# backend/scoring.py
# ─────────────────────────────────────────────────────────────────────────────
# PURPOSE : Combine every individual anomaly signal computed so far
#           (AVR, CAR_10, Vol_Spike, Return_Z_Flag, IF_Flag, and optionally
#           Cluster_Flag) into ONE composite Suspicion Score from 0-100
#           per trading day, per stock. This is the single number the
#           dashboard displays and ranks stocks by.
#
# WHY A COMPOSITE SCORE INSTEAD OF JUST SHOWING ALL THE FLAGS SEPARATELY:
#   A user looking at a dashboard doesn't want to mentally combine 6
#   different 0/1 flags themselves. A single weighted score that says
#   "this day scored 78/100" is immediately interpretable, sortable, and
#   rankable across stocks. The underlying flags remain in the data for
#   anyone who wants to drill into WHY a day scored high — scoring.py
#   doesn't hide them, it just adds one more summary column on top.
#
# THE WEIGHTING LOGIC:
#   Score = (AVR_component * 25) + (CAR_component * 25)
#           + (IF_Flag * 30) + (event_proximity_component * 20)
#
#   These weights reflect each signal's relative reliability as an
#   insider-trading indicator, based on the project's original design:
#   - IF_Flag (30 pts)  : highest weight, because Isolation Forest already
#                          captures MULTIVARIATE combinations across AVR,
#                          CAR_10, Vol_Spike, and Return_Z together — it's
#                          the most information-dense single signal we have.
#   - AVR (25 pts)       : volume is typically the EARLIEST signal of
#                          informed trading, before price even moves much.
#   - CAR_10 (25 pts)    : sustained abnormal price drift vs the market is
#                          a strong, intuitive insider signal.
#   - Event proximity (20 pts) : closer to the most recent IF-flagged or
#                          CAR-flagged day = more suspicious. This rewards
#                          RECENT anomalies over old ones that have since
#                          calmed down.
#
#   AVR_component and CAR_component are NOT simple 0/1 flags here — they
#   are scaled 0-1 based on HOW FAR each value is past its own threshold,
#   so a day with AVR=8.0 scores higher than a day with AVR=2.6, even
#   though both would trip the same binary avr_flag in features.py.
#   This gives the score more resolution than a pure flag-counting scheme.
#
# CONTAINS:
#   Section 1 — Imports & Configuration
#   Section 2 — scale_component()        : generic 0-1 scaling helper
#   Section 3 — compute_event_proximity() : "days since last anomaly" signal
#   Section 4 — compute_suspicion_score() : the master scoring formula
#   Section 5 — run_scoring_on_all()      : runs scoring for every stock
#   Section 6 — Tests                     : unittest, run with --test
#   Section 7 — Entry point
#
# HOW TO RUN:
#   python backend/scoring.py           → scores every processed stock
#   python backend/scoring.py --test    → runs the test suite
#
# DEPENDENCY:
#   This file expects data/processed/{ticker}_features.csv to already
#   contain AVR, CAR_10, Vol_Spike, Return_Z_Flag (from features.py) AND
#   IF_Flag (from isolation_forest.py). Run those two files first.
# ─────────────────────────────────────────────────────────────────────────────


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 1 — IMPORTS & CONFIGURATION
# ══════════════════════════════════════════════════════════════════════════════

import os
import sys
import unittest

import numpy as np
import pandas as pd

PROCESSED_DIR = "data/processed"

# Columns this file REQUIRES to already exist in the input CSV.
# AVR, CAR_10, Vol_Spike come from features.py.
# IF_Flag comes from isolation_forest.py.
REQUIRED_COLUMNS = ["AVR", "CAR_10", "IF_Flag"]

# Same thresholds used in features.py, repeated here so scale_component()
# knows what counts as "fully suspicious" (scaled value = 1.0) for each signal.
AVR_THRESHOLD = 2.5
CAR_THRESHOLD = 0.08

# How many trading days back we look when computing event proximity.
# A flagged day exactly today gets full proximity credit; a flagged day
# PROXIMITY_WINDOW days ago or further back gets zero credit.
PROXIMITY_WINDOW = 10

# Point weights — MUST sum to 100. Each represents one component's
# maximum possible contribution to the final Suspicion Score.
WEIGHT_AVR = 25
WEIGHT_CAR = 25
WEIGHT_IF = 30
WEIGHT_PROXIMITY = 20

# The threshold above which a day is considered "flagged" for the dashboard's
# alert table — stocks/days scoring at or above this appear as suspicious.
SUSPICION_THRESHOLD = 65


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 2 — scale_component()
# ══════════════════════════════════════════════════════════════════════════════

def scale_component(value: float, threshold: float, cap_multiple: float = 3.0) -> float:
    """
    Scales a raw signal value to a 0-1 range based on how far past its
    threshold it is, giving the scoring formula more resolution than a
    plain binary flag would.

    WHY THIS EXISTS:
        Without this, every day that crosses AVR_THRESHOLD (2.5) would
        contribute the exact same 25 points to the score, whether AVR
        was 2.6 or 12.0. That collapses genuinely different severities
        into one bucket. scale_component() instead produces a smooth
        ramp: AVR=2.5 gives 0.0 (just at the line), AVR=5.0 (threshold
        x 2) gives ~0.5, and AVR >= threshold * cap_multiple gives the
        maximum 1.0.

    FORMULA:
        If value <= threshold:                    scaled = 0.0
        If value >= threshold * cap_multiple:      scaled = 1.0
        Otherwise: linear ramp between those two points

    Parameters
    ----------
    value : float
        The raw signal value, e.g. an AVR or |CAR_10| reading.
        Can be NaN (early rows with insufficient history) — see Returns.
    threshold : float
        The point at which this signal first becomes "notable" (scaled = 0).
        This matches the same threshold used for the binary flag in
        features.py, so a scaled value of 0 corresponds to "right at the
        edge of being flagged at all."
    cap_multiple : float, default 3.0
        How many multiples of the threshold count as "maximally suspicious"
        (scaled = 1.0). Default 3.0 means 3x the threshold value is treated
        as the ceiling — beyond that, severity is already extreme and
        further increases don't add more score.

    Returns
    -------
    float
        A value in [0.0, 1.0]. Returns 0.0 (not NaN) if the input value
        is NaN — a row with no signal data contributes nothing to the
        score rather than poisoning the calculation with NaN propagation.
    """
    if pd.isna(value):
        return 0.0

    if value <= threshold:
        return 0.0

    cap_value = threshold * cap_multiple
    if value >= cap_value:
        return 1.0

    # Linear interpolation between threshold (0.0) and cap_value (1.0)
    scaled = (value - threshold) / (cap_value - threshold)
    return round(scaled, 4)


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 3 — compute_event_proximity()
# ══════════════════════════════════════════════════════════════════════════════

def compute_event_proximity(df: pd.DataFrame) -> pd.Series:
    """
    Computes a 0-1 "recency" score for each row, based on how many trading
    days have passed since the MOST RECENT anomaly (IF_Flag == 1 OR
    CAR_10 exceeded CAR_THRESHOLD), looking backward from each row.

    WHY THIS MATTERS:
        A stock that showed strong anomaly signals 3 days ago is still
        "hot" — whatever triggered that anomaly may still be unfolding.
        A stock that had an anomaly 200 days ago but has been completely
        calm since is much less urgent right now. This component rewards
        RECENT anomalies and decays the score for older ones, so the
        dashboard naturally surfaces what's currently relevant rather
        than dredging up ancient history.

    HOW IT'S COMPUTED, for each row t:
        1. Look backward from row t (inclusive) up to PROXIMITY_WINDOW
           (10) days, for the NEAREST prior row where IF_Flag==1 or
           CAR_10 exceeded CAR_THRESHOLD.
        2. If such a row exists at distance d days back (d=0 means today):
               proximity_component(t) = 1 - (d / PROXIMITY_WINDOW)
           So an anomaly happening TODAY (d=0) gives 1.0 (full proximity
           credit). An anomaly exactly PROXIMITY_WINDOW days ago gives 0.0.
        3. If no such anomaly exists within the window, proximity = 0.0.

    Parameters
    ----------
    df : pd.DataFrame
        Must contain "IF_Flag" and "CAR_10" columns, sorted chronologically
        ascending (oldest row first) — same convention as every other
        file in this pipeline.

    Returns
    -------
    pd.Series of float, same length and index as df, values in [0.0, 1.0].
    """
    n = len(df)
    proximity = np.zeros(n)

    # A row counts as "an anomaly event" if EITHER the Isolation Forest
    # flagged it OR its CAR_10 exceeded the fixed threshold. We use OR
    # because either signal independently constitutes a notable event
    # worth measuring recency from.
    is_event = (
        (df["IF_Flag"] == 1) |
        (df["CAR_10"].abs() > CAR_THRESHOLD)
    ).values

    for t in range(n):
        # Look backward from t, including t itself, up to PROXIMITY_WINDOW days
        window_start = max(0, t - PROXIMITY_WINDOW + 1)
        window = is_event[window_start: t + 1]

        if not window.any():
            proximity[t] = 0.0
            continue

        # Find the distance (in days) from row t back to the NEAREST
        # True in the window. np.where gives indices of True values;
        # the last one is the closest to t since we're looking backward.
        event_positions = np.where(window)[0]
        nearest_event_offset_from_window_start = event_positions[-1]

        # Convert that to "days back from t"
        days_back = t - (window_start + nearest_event_offset_from_window_start)

        proximity[t] = round(1 - (days_back / PROXIMITY_WINDOW), 4)

    return pd.Series(proximity, index=df.index)


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 4 — compute_suspicion_score()
# ══════════════════════════════════════════════════════════════════════════════

def compute_suspicion_score(df: pd.DataFrame) -> pd.DataFrame:
    """
    Master scoring function — combines AVR, CAR_10, IF_Flag, and event
    proximity into a single 0-100 Suspicion_Score per row, using the
    weights defined in Section 1.

    Parameters
    ----------
    df : pd.DataFrame
        Must contain REQUIRED_COLUMNS = ["AVR", "CAR_10", "IF_Flag"].
        Typically the output of running features.py and then
        isolation_forest.py on the same stock (their outputs are saved
        to the same {ticker}_features.csv file, so this is a chained read).

    Returns
    -------
    pd.DataFrame
        Same as input, with five new columns added:
        - "AVR_Component"       : scaled 0-1 AVR severity
        - "CAR_Component"       : scaled 0-1 |CAR_10| severity
        - "Proximity_Component" : scaled 0-1 recency-to-last-anomaly
        - "Suspicion_Score"     : final 0-100 composite score (rounded
                                   to 2 decimal places)
        - "Suspicion_Flag"      : 1 if Suspicion_Score >= SUSPICION_THRESHOLD
                                   (65), else 0 — this is what populates
                                   the dashboard's alert table.

    Raises
    ------
    ValueError
        If any column in REQUIRED_COLUMNS is missing from the input.
    """
    missing_cols = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing_cols:
        raise ValueError(
            f"compute_suspicion_score() requires columns {REQUIRED_COLUMNS}, "
            f"but these are missing: {missing_cols}. "
            f"Make sure features.py and isolation_forest.py have both run."
        )

    df = df.copy()

    # ── AVR component: scaled 0-1 based on distance past AVR_THRESHOLD ───────
    df["AVR_Component"] = df["AVR"].apply(
        lambda v: scale_component(v, AVR_THRESHOLD)
    )

    # ── CAR component: scaled 0-1 based on distance past CAR_THRESHOLD ───────
    # We use the ABSOLUTE value of CAR_10 because a large negative CAR
    # (sharp underperformance, e.g. insiders selling ahead of bad news)
    # is just as suspicious as a large positive CAR.
    df["CAR_Component"] = df["CAR_10"].abs().apply(
        lambda v: scale_component(v, CAR_THRESHOLD)
    )

    # ── Event proximity component: recency of the nearest anomaly ────────────
    df["Proximity_Component"] = compute_event_proximity(df)

    # ── IF component: already binary (0 or 1), used directly, no scaling ─────
    # IF_Flag may contain NaN if a row somehow lacks it (shouldn't normally
    # happen if isolation_forest.py ran correctly, but we guard anyway).
    if_component = df["IF_Flag"].fillna(0)

    # ── Final weighted composite score ────────────────────────────────────────
    df["Suspicion_Score"] = (
        df["AVR_Component"] * WEIGHT_AVR
        + df["CAR_Component"] * WEIGHT_CAR
        + if_component * WEIGHT_IF
        + df["Proximity_Component"] * WEIGHT_PROXIMITY
    ).round(2)

    df["Suspicion_Flag"] = (df["Suspicion_Score"] >= SUSPICION_THRESHOLD).astype(int)

    return df


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 5 — run_scoring_on_all()
# ══════════════════════════════════════════════════════════════════════════════

def run_scoring_on_all(ticker_names: list = None) -> dict:
    """
    Loads every processed feature CSV (already enriched by features.py and
    isolation_forest.py) from data/processed/, computes the Suspicion Score,
    and saves the result back to the same files so api.py can serve a
    single, fully-scored CSV per stock.

    Parameters
    ----------
    ticker_names : list, optional
        Clean ticker names to process, e.g. ["RELIANCE", "INFY"].
        If None, auto-detects every "{name}_features.csv" file in
        data/processed/.

    Returns
    -------
    dict  {ticker_name: pd.DataFrame}  — only successfully scored stocks
    """
    print("=" * 55)
    print("  Insider Trading Detector - Suspicion Scoring")
    print("=" * 55)

    if ticker_names is None:
        if not os.path.exists(PROCESSED_DIR):
            print(f"  Error: {PROCESSED_DIR}/ does not exist. Run features.py first.")
            return {}

        ticker_names = [
            f.replace("_features.csv", "")
            for f in os.listdir(PROCESSED_DIR)
            if f.endswith("_features.csv")
        ]

    results = {}

    for ticker_name in ticker_names:
        filepath = os.path.join(PROCESSED_DIR, f"{ticker_name}_features.csv")

        if not os.path.exists(filepath):
            print(f"  Warning: {filepath} not found - skipping {ticker_name}.")
            continue

        print(f"  Scoring {ticker_name} ...")
        df = pd.read_csv(filepath)

        try:
            df = compute_suspicion_score(df)
        except ValueError as e:
            print(f"    Error: {e}")
            continue

        df.to_csv(filepath, index=False)
        results[ticker_name] = df

        flagged_count = int(df["Suspicion_Flag"].sum())
        max_score = df["Suspicion_Score"].max()
        print(f"    Done: {flagged_count} day(s) >= {SUSPICION_THRESHOLD}, "
              f"max score {max_score:.2f} -> {filepath}")

    print()
    print("=" * 55)
    print(f"  Suspicion scoring complete: {len(results)} stocks scored")
    print(f"  Files updated in: {PROCESSED_DIR}/")
    print("=" * 55)

    return results


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 6 — TESTS
# ══════════════════════════════════════════════════════════════════════════════
#
# HOW TO RUN:
#   python backend/scoring.py --test
# ══════════════════════════════════════════════════════════════════════════════

def _make_synthetic_scored_input(n: int = 30) -> pd.DataFrame:
    """
    Builds a synthetic DataFrame with AVR, CAR_10, IF_Flag columns,
    mimicking what features.py + isolation_forest.py would have produced
    by the time scoring.py runs. All rows start "calm" (no anomalies).
    """
    rng = np.random.default_rng(seed=3)
    return pd.DataFrame({
        "AVR": rng.normal(1.0, 0.1, n),
        "CAR_10": rng.normal(0.0, 0.01, n),
        "IF_Flag": np.zeros(n, dtype=int),
    })


class TestScaleComponent(unittest.TestCase):
    """Tests for scale_component()."""

    # ── Test 1 ────────────────────────────────────────────────────────────────
    def test_value_at_threshold_scales_to_zero(self):
        """A value exactly AT the threshold must scale to 0.0 (the floor)."""
        result = scale_component(2.5, threshold=2.5)
        self.assertEqual(result, 0.0)

    # ── Test 2 ────────────────────────────────────────────────────────────────
    def test_value_below_threshold_scales_to_zero(self):
        """A value below the threshold must also scale to 0.0, not negative."""
        result = scale_component(1.0, threshold=2.5)
        self.assertEqual(result, 0.0)

    # ── Test 3 ────────────────────────────────────────────────────────────────
    def test_value_at_cap_scales_to_one(self):
        """A value at threshold * cap_multiple must scale to exactly 1.0."""
        # threshold=2.5, cap_multiple=3.0 (default) → cap value = 7.5
        result = scale_component(7.5, threshold=2.5)
        self.assertEqual(result, 1.0)

    # ── Test 4 ────────────────────────────────────────────────────────────────
    def test_value_above_cap_still_scales_to_one(self):
        """Values WAY beyond the cap must still clamp at 1.0, never exceed it."""
        result = scale_component(1000.0, threshold=2.5)
        self.assertEqual(result, 1.0)

    # ── Test 5 ────────────────────────────────────────────────────────────────
    def test_midpoint_value_scales_to_approximately_half(self):
        """
        A value exactly halfway between threshold and cap must scale to
        approximately 0.5 — proving the interpolation is linear.
        threshold=2.5, cap=7.5, midpoint=5.0 → expect scaled ≈ 0.5
        """
        result = scale_component(5.0, threshold=2.5)
        self.assertAlmostEqual(result, 0.5, places=2)

    # ── Test 6 ────────────────────────────────────────────────────────────────
    def test_nan_input_returns_zero_not_nan(self):
        """
        NaN input (e.g. early row with insufficient history) must return
        0.0, NOT NaN — otherwise NaN would propagate into the final score
        and silently corrupt every downstream calculation.
        """
        result = scale_component(np.nan, threshold=2.5)
        self.assertEqual(result, 0.0)
        self.assertFalse(pd.isna(result), "scale_component leaked a NaN value")


class TestComputeEventProximity(unittest.TestCase):
    """Tests for compute_event_proximity()."""

    # ── Test 7 ────────────────────────────────────────────────────────────────
    def test_returns_correct_length(self):
        """Output Series must have the same length as the input DataFrame."""
        df = _make_synthetic_scored_input(n=20)
        result = compute_event_proximity(df)
        self.assertEqual(len(result), 20)

    # ── Test 8 ────────────────────────────────────────────────────────────────
    def test_no_events_gives_all_zero_proximity(self):
        """
        With IF_Flag all 0 and CAR_10 always small (below threshold),
        every row's proximity must be 0.0 — there's nothing to be "close to."
        """
        df = _make_synthetic_scored_input(n=20)  # all calm, no events
        result = compute_event_proximity(df)
        self.assertTrue((result == 0.0).all(),
            "Expected all-zero proximity when there are no anomaly events")

    # ── Test 9 ────────────────────────────────────────────────────────────────
    def test_event_on_same_day_gives_full_proximity(self):
        """
        A row WHERE the event itself occurs (IF_Flag=1 on that exact row)
        must score proximity = 1.0 for that row (distance 0 from itself).
        """
        df = _make_synthetic_scored_input(n=10)
        df.loc[5, "IF_Flag"] = 1  # event on row 5

        result = compute_event_proximity(df)
        self.assertEqual(result.iloc[5], 1.0,
            "Expected proximity=1.0 on the exact day of the event")

    # ── Test 10 ───────────────────────────────────────────────────────────────
    def test_proximity_decays_linearly_with_distance(self):
        """
        With an event at row 5, row 7 (2 days later) should have LOWER
        proximity than row 6 (1 day later), and both should be less than
        row 5's proximity of 1.0 — proving the decay direction is correct.
        """
        df = _make_synthetic_scored_input(n=15)
        df.loc[5, "IF_Flag"] = 1

        result = compute_event_proximity(df)

        self.assertGreater(result.iloc[5], result.iloc[6],
            "Proximity should be higher closer to the event")
        self.assertGreater(result.iloc[6], result.iloc[7],
            "Proximity should keep decreasing further from the event")

    # ── Test 11 ───────────────────────────────────────────────────────────────
    def test_event_beyond_window_gives_zero_proximity(self):
        """
        An event that happened MORE than PROXIMITY_WINDOW (10) days before
        the current row must NOT contribute any proximity credit — it's
        considered too old to be currently relevant.
        """
        df = _make_synthetic_scored_input(n=30)
        df.loc[0, "IF_Flag"] = 1  # event right at the very start

        result = compute_event_proximity(df)

        # Row 25 is 25 days after the event — well beyond the 10-day window
        self.assertEqual(result.iloc[25], 0.0,
            "Expected zero proximity for a row far beyond PROXIMITY_WINDOW "
            "from the nearest event")

    # ── Test 12 ───────────────────────────────────────────────────────────────
    def test_car_based_event_also_counts(self):
        """
        An event can be triggered by CAR_10 exceeding the threshold, not
        just IF_Flag. A row with a large CAR_10 (even with IF_Flag=0)
        must still register as an event for proximity purposes.
        """
        df = _make_synthetic_scored_input(n=10)
        df.loc[3, "CAR_10"] = 0.12  # well above CAR_THRESHOLD (0.08)

        result = compute_event_proximity(df)
        self.assertEqual(result.iloc[3], 1.0,
            "Expected a large CAR_10 value alone to count as an event")


class TestComputeSuspicionScore(unittest.TestCase):
    """Tests for compute_suspicion_score()."""

    # ── Test 13 ───────────────────────────────────────────────────────────────
    def test_adds_expected_columns(self):
        """Must add all 5 new columns: 3 components + score + flag."""
        df = _make_synthetic_scored_input(n=20)
        result = compute_suspicion_score(df)

        expected_new_cols = [
            "AVR_Component", "CAR_Component", "Proximity_Component",
            "Suspicion_Score", "Suspicion_Flag"
        ]
        for col in expected_new_cols:
            self.assertIn(col, result.columns, f"Missing expected column: {col}")

    # ── Test 14 ───────────────────────────────────────────────────────────────
    def test_score_is_within_valid_range(self):
        """
        Suspicion_Score must always be between 0 and 100 inclusive — it
        can never go negative or exceed 100, regardless of how extreme
        the input signals are (the scale_component cap enforces this).
        """
        df = _make_synthetic_scored_input(n=50)
        # Inject some extreme values to stress-test the upper bound
        df.loc[0, "AVR"] = 999.0
        df.loc[0, "CAR_10"] = 5.0
        df.loc[0, "IF_Flag"] = 1

        result = compute_suspicion_score(df)

        self.assertTrue((result["Suspicion_Score"] >= 0).all(),
            "Found a negative Suspicion_Score")
        self.assertTrue((result["Suspicion_Score"] <= 100).all(),
            f"Found a Suspicion_Score above 100: max={result['Suspicion_Score'].max()}")

    # ── Test 15 ───────────────────────────────────────────────────────────────
    def test_calm_row_scores_near_zero(self):
        """
        A row with AVR≈1.0 (normal), CAR_10≈0 (normal), IF_Flag=0 (not
        flagged), and no nearby events should score very close to 0 —
        confirming the formula doesn't manufacture false suspicion out
        of ordinary, unremarkable data.
        """
        df = _make_synthetic_scored_input(n=30)  # all rows are calm by construction
        result = compute_suspicion_score(df)

        self.assertTrue(
            (result["Suspicion_Score"] < 10).all(),
            f"Expected all calm rows to score near 0, "
            f"got max={result['Suspicion_Score'].max()}"
        )

    # ── Test 16 ───────────────────────────────────────────────────────────────
    def test_maximally_extreme_row_scores_near_one_hundred(self):
        """
        A row with AVR at/above its cap, |CAR_10| at/above its cap,
        IF_Flag=1, AND positioned to get full proximity credit (it IS
        the event) should score at or very near 100 — proving the
        weights actually sum correctly and the formula isn't silently
        losing points somewhere.
        """
        df = _make_synthetic_scored_input(n=20)
        extreme_row = 10
        df.loc[extreme_row, "AVR"] = AVR_THRESHOLD * 3.0     # caps AVR_Component at 1.0
        df.loc[extreme_row, "CAR_10"] = CAR_THRESHOLD * 3.0  # caps CAR_Component at 1.0
        df.loc[extreme_row, "IF_Flag"] = 1                    # full IF credit
        # This row IS the event, so proximity will be 1.0 automatically

        result = compute_suspicion_score(df)
        score = result["Suspicion_Score"].iloc[extreme_row]

        self.assertGreaterEqual(
            score, 99.0,
            f"Expected a maximally extreme row to score ~100, got {score}"
        )

    # ── Test 17 ───────────────────────────────────────────────────────────────
    def test_suspicion_flag_matches_threshold(self):
        """
        Suspicion_Flag must be 1 exactly when Suspicion_Score >=
        SUSPICION_THRESHOLD (65), and 0 otherwise — no off-by-one or
        inverted logic.
        """
        df = _make_synthetic_scored_input(n=30)
        df.loc[5, "IF_Flag"] = 1
        df.loc[5, "AVR"] = AVR_THRESHOLD * 3.0
        df.loc[5, "CAR_10"] = CAR_THRESHOLD * 3.0

        result = compute_suspicion_score(df)

        for idx in result.index:
            score = result["Suspicion_Score"].iloc[idx]
            flag = result["Suspicion_Flag"].iloc[idx]
            expected_flag = 1 if score >= SUSPICION_THRESHOLD else 0
            self.assertEqual(
                flag, expected_flag,
                f"Row {idx}: score={score}, flag={flag}, "
                f"expected_flag={expected_flag}"
            )

    # ── Test 18 ───────────────────────────────────────────────────────────────
    def test_negative_car_scores_same_as_positive_car(self):
        """
        A large NEGATIVE CAR_10 (e.g. -0.15, sharp underperformance) must
        contribute the SAME score as an equally large POSITIVE CAR_10
        (e.g. +0.15) — because we score on the ABSOLUTE value. Both
        directions of abnormal movement are equally suspicious.
        """
        df_positive = _make_synthetic_scored_input(n=10)
        df_positive.loc[5, "CAR_10"] = 0.15

        df_negative = _make_synthetic_scored_input(n=10)
        df_negative.loc[5, "CAR_10"] = -0.15

        result_positive = compute_suspicion_score(df_positive)
        result_negative = compute_suspicion_score(df_negative)

        self.assertAlmostEqual(
            result_positive["Suspicion_Score"].iloc[5],
            result_negative["Suspicion_Score"].iloc[5],
            places=2,
            msg="Positive and negative CAR_10 of equal magnitude should "
                "score identically"
        )

    # ── Test 19 ───────────────────────────────────────────────────────────────
    def test_missing_required_column_raises_value_error(self):
        """
        compute_suspicion_score() must raise a ValueError naming the
        missing column if IF_Flag (or AVR, or CAR_10) is absent —
        this means isolation_forest.py hasn't run yet on this data.
        """
        df = _make_synthetic_scored_input(n=10).drop(columns=["IF_Flag"])
        with self.assertRaises(ValueError) as ctx:
            compute_suspicion_score(df)
        self.assertIn("IF_Flag", str(ctx.exception))

    # ── Test 20 ───────────────────────────────────────────────────────────────
    def test_row_count_unchanged(self):
        """compute_suspicion_score() must not add or drop rows."""
        df = _make_synthetic_scored_input(n=40)
        result = compute_suspicion_score(df)
        self.assertEqual(len(df), len(result))


class TestRunScoringOnAll(unittest.TestCase):
    """Tests for run_scoring_on_all() — the integration / file-handling layer."""

    @classmethod
    def setUpClass(cls):
        cls.test_ticker = "_TESTSTOCK_SCORING"
        cls.test_filepath = os.path.join(PROCESSED_DIR, f"{cls.test_ticker}_features.csv")

        os.makedirs(PROCESSED_DIR, exist_ok=True)

        df = _make_synthetic_scored_input(n=30)
        df.loc[25, "IF_Flag"] = 1
        df.loc[25, "AVR"] = AVR_THRESHOLD * 3.0
        df.to_csv(cls.test_filepath, index=False)

    @classmethod
    def tearDownClass(cls):
        if os.path.exists(cls.test_filepath):
            os.remove(cls.test_filepath)

    # ── Test 21 ───────────────────────────────────────────────────────────────
    def test_processes_given_ticker_and_returns_dict(self):
        """
        run_scoring_on_all() called with our synthetic test ticker must
        process it successfully and return a dict containing it.
        """
        results = run_scoring_on_all(ticker_names=[self.test_ticker])
        self.assertIn(self.test_ticker, results)
        self.assertIsInstance(results[self.test_ticker], pd.DataFrame)

    # ── Test 22 ───────────────────────────────────────────────────────────────
    def test_saved_csv_contains_new_columns(self):
        """
        After running, the CSV on disk must be overwritten with
        Suspicion_Score and Suspicion_Flag included.
        """
        run_scoring_on_all(ticker_names=[self.test_ticker])
        saved_df = pd.read_csv(self.test_filepath)

        self.assertIn("Suspicion_Score", saved_df.columns)
        self.assertIn("Suspicion_Flag", saved_df.columns)

    # ── Test 23 ───────────────────────────────────────────────────────────────
    def test_missing_ticker_is_skipped_not_crashed(self):
        """
        Requesting a ticker whose CSV doesn't exist must be skipped with
        a warning, not raise an exception.
        """
        results = run_scoring_on_all(ticker_names=["_NONEXISTENT_TICKER_ABC"])
        self.assertNotIn("_NONEXISTENT_TICKER_ABC", results)
        self.assertEqual(len(results), 0)

    # ── Test 24 ───────────────────────────────────────────────────────────────
    def test_ticker_with_missing_columns_is_skipped_not_crashed(self):
        """
        A ticker's CSV missing IF_Flag (e.g. isolation_forest.py never ran
        on it) must be skipped gracefully, letting the rest of the batch
        continue uninterrupted.
        """
        broken_ticker = "_TESTSTOCK_BROKEN_SCORING"
        broken_filepath = os.path.join(PROCESSED_DIR, f"{broken_ticker}_features.csv")

        df = _make_synthetic_scored_input(n=10).drop(columns=["IF_Flag"])
        df.to_csv(broken_filepath, index=False)

        try:
            results = run_scoring_on_all(ticker_names=[broken_ticker])
            self.assertNotIn(broken_ticker, results,
                "Expected ticker with missing IF_Flag column to be skipped")
        finally:
            if os.path.exists(broken_filepath):
                os.remove(broken_filepath)


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 7 — ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════
#
#   python backend/scoring.py           → scores every processed stock
#   python backend/scoring.py --test    → runs the 24-test suite
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":

    if "--test" in sys.argv:
        sys.argv.remove("--test")

        print("=" * 55)
        print("  Running scoring.py test suite  (24 tests)")
        print("=" * 55)
        print()

        unittest.main(verbosity=2)

    else:
        run_scoring_on_all()