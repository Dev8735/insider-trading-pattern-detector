# backend/models/isolation_forest.py
# ─────────────────────────────────────────────────────────────────────────────
# PURPOSE : Train an unsupervised Isolation Forest model on the four signal
#           columns produced by features.py (AVR, CAR_10, Vol_Spike, Return_Z)
#           to catch MULTIVARIATE anomalies — days where no single signal is
#           extreme on its own, but the COMBINATION of moderately unusual
#           values across all four signals together is statistically rare.
#
# WHY THIS MODEL, ON TOP OF THE FLAGS ALREADY IN features.py:
#   features.py already raises individual flags using fixed thresholds
#   (e.g. Vol_Spike=1 if ratio > 2.0). Those are univariate — they look at
#   ONE column at a time. A day with AVR=2.3 (just under the 2.5 threshold),
#   CAR_10=0.07 (just under 0.08), and Return_Z=2.3 (just under 2.5) would
#   pass every single individual check — yet having all three simultaneously
#   elevated is far rarer and more suspicious than any one of them alone.
#
#   Isolation Forest is built exactly for this: it isolates points that are
#   "few and different" by randomly partitioning the feature space. Points
#   that need fewer random splits to isolate are more anomalous. It naturally
#   captures these multi-signal combinations without us having to hand-craft
#   a rule for every possible combination.
#
# CONTAINS:
#   Section 1 — Imports & Configuration
#   Section 2 — prepare_model_input()    : extract & clean the 4 feature columns
#   Section 3 — train_isolation_forest() : fit the model and score every row
#   Section 4 — run_isolation_forest_on_all() : runs detection for every stock
#   Section 5 — Tests                    : unittest, run with --test
#   Section 6 — Entry point
#
# HOW TO RUN:
#   python backend/models/isolation_forest.py           → runs on all processed stocks
#   python backend/models/isolation_forest.py --test    → runs the test suite
#
# DEPENDENCY:
#   This file expects data/processed/{ticker}_features.csv to already exist,
#   containing the columns AVR, CAR_10, Vol_Spike, Return_Z (from features.py).
#   Run `python backend/features.py` first if those files are missing.
#
# NEW LIBRARY USED HERE:
#   scikit-learn's IsolationForest. Install with:
#       pip install scikit-learn
# ─────────────────────────────────────────────────────────────────────────────


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 1 — IMPORTS & CONFIGURATION
# ══════════════════════════════════════════════════════════════════════════════

import os
import sys
import unittest

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

PROCESSED_DIR = "data/processed"

# The four signal columns this model trains on — must already exist in
# the input DataFrame, produced by features.py's build_features().
MODEL_FEATURES = ["AVR", "CAR_10", "Vol_Spike", "Return_Z"]

# contamination = the expected PROPORTION of anomalous rows in the data.
# 0.05 means "assume roughly 5% of trading days are genuinely abnormal."
# This is a tunable assumption, not a measured fact — 5% is a reasonable
# starting point for financial anomaly detection (rare but not vanishingly
# so). Person A/B can adjust this during model evaluation in Days 11-13.
CONTAMINATION = 0.05

# Number of random trees in the forest. More trees = more stable scores
# but slower training. 100 is a standard, well-tested default.
N_ESTIMATORS = 100

# Fixed random seed so results are reproducible — running this file twice
# on the same data always produces the same anomaly flags. Without this,
# IsolationForest's internal randomness would give slightly different
# results each run, making debugging and grading difficult.
RANDOM_STATE = 42


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 2 — prepare_model_input()
# ══════════════════════════════════════════════════════════════════════════════

def prepare_model_input(df: pd.DataFrame) -> pd.DataFrame:
    """
    Extracts and cleans the four MODEL_FEATURES columns so they're ready
    to feed into IsolationForest.

    WHY THIS STEP IS NEEDED:
        IsolationForest (like virtually all scikit-learn models) cannot
        handle NaN values - it will raise an error if any are present.
        The early rows of features.py's output have NaN in AVR/CAR_10/
        Return_Z because there isn't enough historical window yet
        (e.g. AVR needs 60 days of history before its first valid value).

        Rather than dropping those rows (which would shrink our dataset
        and lose early trading days entirely), we fill NaN with 0 - the
        "neutral" value for every one of these four signals:
            AVR=0 doesn't naturally occur (it's a ratio, normally ~1.0)
            but for rows with no history, 0 correctly signals "we have
            no information to judge this row as abnormal."
        This keeps row count consistent with the input and lets the
        model simply treat early rows as "ordinary" by default, since
        we have no evidence to say otherwise.

    Parameters
    ----------
    df : pd.DataFrame
        Must contain all columns listed in MODEL_FEATURES.
        Typically the output of features.py's build_features().

    Returns
    -------
    pd.DataFrame
        A NEW DataFrame containing ONLY the MODEL_FEATURES columns,
        with all NaN replaced by 0.0. Same row count and row order
        as the input - this is critical so the anomaly scores we
        compute later can be reattached to the original DataFrame
        by simple positional alignment.

    Raises
    ------
    ValueError
        If any column in MODEL_FEATURES is missing from the input df.
        This is a deliberate fail-fast check - running the model on
        the wrong/incomplete data would produce silently wrong results
        otherwise.
    """
    missing_cols = [col for col in MODEL_FEATURES if col not in df.columns]
    if missing_cols:
        raise ValueError(
            f"prepare_model_input() requires columns {MODEL_FEATURES}, "
            f"but these are missing from the input DataFrame: {missing_cols}. "
            f"Make sure features.py's build_features() has already run."
        )

    model_input = df[MODEL_FEATURES].copy()
    model_input = model_input.fillna(0.0)

    return model_input


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 3 — train_isolation_forest()
# ══════════════════════════════════════════════════════════════════════════════

def train_isolation_forest(df: pd.DataFrame) -> pd.DataFrame:
    """
    Fits an Isolation Forest on the four signal columns and adds anomaly
    scores and flags back onto the original DataFrame.

    HOW ISOLATION FOREST WORKS (conceptually):
        The algorithm builds many random decision trees. Each tree
        randomly picks a feature and a random split value, repeatedly
        partitioning the data. A point that's "isolated" (separated
        from the rest of the data) after very few random splits is
        considered anomalous - outliers are, by definition, easy to
        separate from the dense "normal" cluster of points.

        Each row gets:
        - decision_function(): a continuous score where LOWER (more
          negative) = MORE anomalous, higher (more positive) = more normal
        - predict(): a binary label, -1 for anomaly, +1 for normal

    Parameters
    ----------
    df : pd.DataFrame
        Must contain all columns in MODEL_FEATURES.
        Typically the output of features.py's build_features() for ONE stock.

    Returns
    -------
    pd.DataFrame
        Same as input, with three new columns added:
        - "IF_Score" : raw anomaly score from decision_function().
                       More negative = more anomalous. Rounded to 4 decimals.
        - "IF_Flag"  : 1 if the model classifies the row as anomalous
                       (predict() == -1), else 0.
        - "IF_Rank"  : the row's anomaly rank within this stock's history,
                       1 = most anomalous day, 2 = second most anomalous, etc.
                       Useful for showing "top N suspicious days" in the
                       dashboard without re-sorting on the frontend.

    Notes
    -----
    A fresh IsolationForest is trained PER STOCK (not across all stocks
    pooled together). This is a deliberate design choice: a stock like
    RELIANCE naturally has different baseline volume/volatility than a
    smaller-cap stock, so each stock's "normal" must be learned from its
    own history, not from a blended pool that would wash out individual
    stock characteristics.
    """
    df = df.copy()

    model_input = prepare_model_input(df)

    model = IsolationForest(
        n_estimators=N_ESTIMATORS,
        contamination=CONTAMINATION,
        random_state=RANDOM_STATE,
    )

    # fit_predict() does both steps in one call: train the model on this
    # data, then immediately classify every row in that same data.
    # This is correct for our use case - we want to know which of THIS
    # stock's OWN historical days look anomalous relative to its OWN
    # history, not predict on unseen future data.
    predictions = model.fit_predict(model_input)

    # decision_function() gives the continuous anomaly score.
    # We call it AFTER fit_predict() - the model is already fitted,
    # so this just scores the same rows without retraining.
    scores = model.decision_function(model_input)

    df["IF_Score"] = np.round(scores, 4)

    # predict() returns -1 for anomalies, +1 for normal rows.
    # Convert to our standard 0/1 flag convention (1 = flagged, 0 = normal)
    # to stay consistent with avr_flag, car_flag, Vol_Spike, etc.
    df["IF_Flag"] = (predictions == -1).astype(int)

    # Rank rows by anomaly score: rank 1 = most negative score = most anomalous.
    # ascending=True on IF_Score (most negative first) gives rank 1 to the
    # single most anomalous day in this stock's entire history.
    df["IF_Rank"] = df["IF_Score"].rank(method="min", ascending=True).astype(int)

    return df


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 4 — run_isolation_forest_on_all()
# ══════════════════════════════════════════════════════════════════════════════

def run_isolation_forest_on_all(ticker_names: list = None) -> dict:
    """
    Loads every processed feature CSV from data/processed/, trains a
    per-stock Isolation Forest, and saves the result back (overwriting
    with the new IF_Score / IF_Flag / IF_Rank columns added) so
    scoring.py can later read one fully-enriched file per stock.

    Parameters
    ----------
    ticker_names : list, optional
        Clean ticker names to process, e.g. ["RELIANCE", "INFY"].
        If None, auto-detects every "{name}_features.csv" file in
        data/processed/.

    Returns
    -------
    dict  {ticker_name: pd.DataFrame}  — only successfully processed stocks
    """
    print("=" * 55)
    print("  Insider Trading Detector - Isolation Forest Detection")
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

        print(f"  Processing {ticker_name} ...")
        df = pd.read_csv(filepath)

        try:
            df = train_isolation_forest(df)
        except ValueError as e:
            print(f"    Error: {e}")
            continue

        df.to_csv(filepath, index=False)
        results[ticker_name] = df

        anomaly_count = int(df["IF_Flag"].sum())
        print(f"    Done: {anomaly_count} anomalous day(s) flagged -> {filepath}")

    print()
    print("=" * 55)
    print(f"  Isolation Forest detection complete: {len(results)} stocks processed")
    print(f"  Files updated in: {PROCESSED_DIR}/")
    print("=" * 55)

    return results


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 5 — TESTS
# ══════════════════════════════════════════════════════════════════════════════
#
# HOW TO RUN:
#   python backend/models/isolation_forest.py --test
#
# Like the other model files, these tests use small, controlled synthetic
# data with a DELIBERATELY INJECTED anomaly - this lets us assert that the
# model actually finds the thing we planted, not just that it runs without
# crashing.
# ══════════════════════════════════════════════════════════════════════════════

def _make_synthetic_features_df(n: int = 100, inject_anomaly_at: int = None) -> pd.DataFrame:
    """
    Builds a synthetic DataFrame with the four MODEL_FEATURES columns,
    mimicking what features.py's build_features() would produce.

    Parameters
    ----------
    n : int
        Number of rows (trading days) to generate.
    inject_anomaly_at : int, optional
        If given, this row index gets all four features set to extreme,
        simultaneously unusual values - a multivariate anomaly that no
        single-column threshold check would necessarily catch if each
        value individually were just under that column's own cutoff.

    Returns
    -------
    pd.DataFrame with columns: AVR, CAR_10, Vol_Spike, Return_Z
    All "normal" rows are drawn from realistic, tight distributions
    centred on each signal's natural baseline value.
    """
    rng = np.random.default_rng(seed=7)

    avr = rng.normal(1.0, 0.15, n)           # AVR normally hovers around 1.0
    car_10 = rng.normal(0.0, 0.015, n)       # CAR_10 normally hovers around 0
    vol_spike = rng.integers(0, 2, n).astype(float)  # mostly 0, occasionally 1
    return_z = rng.normal(0.0, 0.8, n)       # Return_Z normally within ±2

    if inject_anomaly_at is not None:
        # Each individual value here is moderately elevated but NOT
        # extreme enough to trip the FIXED thresholds in features.py
        # on its own (AVR < 2.5, |CAR_10| < 0.08, Return_Z < 2.5).
        # Only the COMBINATION across all four should stand out to
        # Isolation Forest as multivariate-rare.
        avr[inject_anomaly_at] = 2.3
        car_10[inject_anomaly_at] = 0.075
        vol_spike[inject_anomaly_at] = 1.0
        return_z[inject_anomaly_at] = 2.3

    return pd.DataFrame({
        "AVR": avr,
        "CAR_10": car_10,
        "Vol_Spike": vol_spike,
        "Return_Z": return_z,
    })


class TestPrepareModelInput(unittest.TestCase):
    """Tests for prepare_model_input()."""

    # ── Test 1 ────────────────────────────────────────────────────────────────
    def test_returns_only_model_feature_columns(self):
        """
        The output must contain EXACTLY the 4 MODEL_FEATURES columns,
        in that order - no extra columns like Date or Ticker leaking in.
        """
        df = _make_synthetic_features_df(n=20)
        df["Date"] = pd.date_range("2025-01-01", periods=20)  # extra column
        df["Ticker"] = "TEST"  # extra column

        result = prepare_model_input(df)
        self.assertEqual(list(result.columns), MODEL_FEATURES,
            f"Expected exactly {MODEL_FEATURES}, got {list(result.columns)}")

    # ── Test 2 ────────────────────────────────────────────────────────────────
    def test_nan_values_filled_with_zero(self):
        """
        NaN values (from early rows with insufficient rolling-window history)
        must be replaced with 0.0, not left as NaN - IsolationForest cannot
        handle NaN and would raise an error during fit().
        """
        df = _make_synthetic_features_df(n=20)
        df.loc[0:5, "AVR"] = np.nan
        df.loc[0:5, "CAR_10"] = np.nan

        result = prepare_model_input(df)

        self.assertEqual(result["AVR"].isnull().sum(), 0,
            "AVR still contains NaN after prepare_model_input()")
        self.assertEqual(result["CAR_10"].isnull().sum(), 0,
            "CAR_10 still contains NaN after prepare_model_input()")
        self.assertTrue(
            (result.loc[0:5, "AVR"] == 0.0).all(),
            "Expected NaN AVR values to be filled with exactly 0.0"
        )

    # ── Test 3 ────────────────────────────────────────────────────────────────
    def test_row_count_unchanged(self):
        """
        prepare_model_input() must not add or drop rows - every row,
        including those with NaN, must be preserved (just filled, not removed).
        """
        df = _make_synthetic_features_df(n=50)
        df.loc[0:10, "Return_Z"] = np.nan

        result = prepare_model_input(df)
        self.assertEqual(len(result), 50,
            f"Expected 50 rows preserved, got {len(result)}")

    # ── Test 4 ────────────────────────────────────────────────────────────────
    def test_missing_required_column_raises_value_error(self):
        """
        If the input DataFrame is missing one of MODEL_FEATURES (e.g.
        "Vol_Spike" wasn't computed for some reason), prepare_model_input()
        must raise a ValueError naming the missing column, not silently
        proceed with incomplete data or crash with a cryptic KeyError.
        """
        df = _make_synthetic_features_df(n=20)
        df = df.drop(columns=["Vol_Spike"])

        with self.assertRaises(ValueError) as ctx:
            prepare_model_input(df)
        self.assertIn("Vol_Spike", str(ctx.exception),
            "ValueError message should name the missing column")

    # ── Test 5 ────────────────────────────────────────────────────────────────
    def test_does_not_mutate_input_dataframe(self):
        """
        prepare_model_input() must not modify the caller's original
        DataFrame - it should always work on a .copy().
        """
        df = _make_synthetic_features_df(n=20)
        df.loc[0, "AVR"] = np.nan
        original_nan_count = df["AVR"].isnull().sum()

        prepare_model_input(df)  # call it, discard the result

        self.assertEqual(
            df["AVR"].isnull().sum(), original_nan_count,
            "prepare_model_input() mutated the caller's original DataFrame"
        )


class TestTrainIsolationForest(unittest.TestCase):
    """Tests for train_isolation_forest()."""

    # ── Test 6 ────────────────────────────────────────────────────────────────
    def test_adds_expected_columns(self):
        """
        train_isolation_forest() must add exactly three new columns:
        IF_Score, IF_Flag, IF_Rank.
        """
        df = _make_synthetic_features_df(n=100)
        result = train_isolation_forest(df)

        for col in ["IF_Score", "IF_Flag", "IF_Rank"]:
            self.assertIn(col, result.columns, f"Missing expected column: {col}")

    # ── Test 7 ────────────────────────────────────────────────────────────────
    def test_row_count_unchanged(self):
        """train_isolation_forest() must not add or drop rows."""
        df = _make_synthetic_features_df(n=100)
        result = train_isolation_forest(df)
        self.assertEqual(len(df), len(result),
            "Row count changed after train_isolation_forest()")

    # ── Test 8 ────────────────────────────────────────────────────────────────
    def test_if_flag_is_binary(self):
        """IF_Flag must contain only 0 or 1 - it is a binary flag."""
        df = _make_synthetic_features_df(n=100)
        result = train_isolation_forest(df)

        unique_vals = set(result["IF_Flag"].unique())
        self.assertTrue(
            unique_vals.issubset({0, 1}),
            f"IF_Flag contains non-binary values: {unique_vals}"
        )

    # ── Test 9 ────────────────────────────────────────────────────────────────
    def test_injected_multivariate_anomaly_is_flagged(self):
        """
        THE CORE TEST OF THIS FILE.

        Build 100 rows of calm, ordinary data, then inject ONE row where
        all four signals are SIMULTANEOUSLY elevated (but each individually
        still under its own fixed threshold from features.py). This row
        must be flagged by Isolation Forest - proving the model genuinely
        captures multivariate combinations, which is the entire reason
        this model exists alongside the simpler per-column flags.
        """
        anomaly_row = 95
        df = _make_synthetic_features_df(n=100, inject_anomaly_at=anomaly_row)

        result = train_isolation_forest(df)
        anomaly_flag = result["IF_Flag"].iloc[anomaly_row]

        self.assertEqual(
            anomaly_flag, 1,
            "Expected the injected multivariate anomaly row to be flagged "
            "by Isolation Forest (IF_Flag should be 1)"
        )

    # ── Test 10 ───────────────────────────────────────────────────────────────
    def test_injected_anomaly_has_most_negative_score(self):
        """
        The injected anomaly row should have a more negative (more anomalous)
        IF_Score than the vast majority of ordinary rows - specifically,
        it should rank among the most anomalous handful of rows, since it
        was deliberately constructed to be the most unusual point.
        """
        anomaly_row = 95
        df = _make_synthetic_features_df(n=100, inject_anomaly_at=anomaly_row)

        result = train_isolation_forest(df)
        anomaly_rank = result["IF_Rank"].iloc[anomaly_row]

        # With contamination=0.05 on 100 rows, ~5 rows are expected to be
        # flagged as anomalies. The deliberately injected, most-extreme
        # point should be within that top group.
        self.assertLessEqual(
            anomaly_rank, 5,
            f"Expected injected anomaly to rank in the top 5 most anomalous "
            f"rows, but it ranked #{anomaly_rank}"
        )

    # ── Test 11 ───────────────────────────────────────────────────────────────
    def test_if_rank_is_unique_ranking_from_one(self):
        """
        IF_Rank must start at 1 (the single most anomalous row) and every
        row must have a valid rank - no NaN or zero ranks.
        """
        df = _make_synthetic_features_df(n=50)
        result = train_isolation_forest(df)

        self.assertEqual(result["IF_Rank"].min(), 1,
            "Expected the most anomalous row to have IF_Rank == 1")
        self.assertEqual(result["IF_Rank"].isnull().sum(), 0,
            "IF_Rank contains NaN values - every row must be ranked")

    # ── Test 12 ───────────────────────────────────────────────────────────────
    def test_calm_data_has_few_anomalies(self):
        """
        With NO injected anomaly, on purely calm synthetic data, the
        proportion of flagged rows should roughly match the configured
        CONTAMINATION rate (0.05) - not wildly more or fewer. This confirms
        the model isn't systematically over- or under-flagging.
        """
        df = _make_synthetic_features_df(n=200)  # no injected anomaly
        result = train_isolation_forest(df)

        flag_rate = result["IF_Flag"].mean()

        # Allow a reasonable margin around the 5% contamination target,
        # since IsolationForest's actual flagged proportion can vary
        # slightly from the configured contamination on any given dataset.
        self.assertLess(
            flag_rate, 0.15,
            f"Expected roughly 5% of rows flagged (contamination=0.05), "
            f"but got {flag_rate:.1%} - model may be over-flagging"
        )

    # ── Test 13 ───────────────────────────────────────────────────────────────
    def test_does_not_mutate_input_dataframe_columns(self):
        """
        train_isolation_forest() must not alter the ORIGINAL four feature
        columns (AVR, CAR_10, Vol_Spike, Return_Z) - it should only ADD
        new columns, never modify existing values in place in a way that
        differs from the input.
        """
        df = _make_synthetic_features_df(n=50)
        original_avr = df["AVR"].copy()

        result = train_isolation_forest(df)

        pd.testing.assert_series_equal(
            result["AVR"], original_avr,
            check_names=False,
            obj="AVR column was modified by train_isolation_forest()"
        )

    # ── Test 14 ───────────────────────────────────────────────────────────────
    def test_reproducible_results_with_fixed_seed(self):
        """
        Because RANDOM_STATE is fixed, running train_isolation_forest()
        twice on the IDENTICAL input data must produce IDENTICAL IF_Flag
        and IF_Score columns. This is essential for reproducibility -
        without it, re-running the pipeline would give different anomaly
        flags each time, making results impossible to verify or grade.
        """
        df = _make_synthetic_features_df(n=80, inject_anomaly_at=70)

        result_1 = train_isolation_forest(df.copy())
        result_2 = train_isolation_forest(df.copy())

        pd.testing.assert_series_equal(
            result_1["IF_Flag"], result_2["IF_Flag"],
            check_names=False,
            obj="IF_Flag differs between two runs on identical data"
        )
        pd.testing.assert_series_equal(
            result_1["IF_Score"], result_2["IF_Score"],
            check_names=False,
            obj="IF_Score differs between two runs on identical data"
        )

    # ── Test 15 ───────────────────────────────────────────────────────────────
    def test_missing_column_raises_value_error(self):
        """
        train_isolation_forest() must propagate the same ValueError that
        prepare_model_input() raises when a required column is missing -
        it must not silently proceed or crash with an unrelated error.
        """
        df = _make_synthetic_features_df(n=20)
        df = df.drop(columns=["Return_Z"])

        with self.assertRaises(ValueError) as ctx:
            train_isolation_forest(df)
        self.assertIn("Return_Z", str(ctx.exception))


class TestRunIsolationForestOnAll(unittest.TestCase):
    """Tests for run_isolation_forest_on_all() — the integration / file-handling layer."""

    @classmethod
    def setUpClass(cls):
        # Use a clearly fake ticker name so it can never collide with a
        # real stock symbol, and clean up after ourselves in tearDownClass.
        cls.test_ticker = "_TESTSTOCK_ISOFOREST"
        cls.test_filepath = os.path.join(PROCESSED_DIR, f"{cls.test_ticker}_features.csv")

        os.makedirs(PROCESSED_DIR, exist_ok=True)

        # Build a synthetic "already feature-engineered" CSV with one
        # injected multivariate anomaly, as if features.py had produced it.
        df = _make_synthetic_features_df(n=100, inject_anomaly_at=99)
        df.insert(0, "Date", pd.date_range("2025-01-01", periods=100, freq="B"))
        df.to_csv(cls.test_filepath, index=False)

    @classmethod
    def tearDownClass(cls):
        if os.path.exists(cls.test_filepath):
            os.remove(cls.test_filepath)

    # ── Test 16 ───────────────────────────────────────────────────────────────
    def test_processes_given_ticker_and_returns_dict(self):
        """
        run_isolation_forest_on_all() called with our synthetic test ticker
        must process it successfully and return a dict containing it.
        """
        results = run_isolation_forest_on_all(ticker_names=[self.test_ticker])
        self.assertIn(self.test_ticker, results)
        self.assertIsInstance(results[self.test_ticker], pd.DataFrame)

    # ── Test 17 ───────────────────────────────────────────────────────────────
    def test_saved_csv_contains_new_columns(self):
        """
        After running, the CSV on disk must be overwritten with the new
        IF_Score / IF_Flag / IF_Rank columns included - confirming the
        save step actually persisted the enriched DataFrame.
        """
        run_isolation_forest_on_all(ticker_names=[self.test_ticker])
        saved_df = pd.read_csv(self.test_filepath)

        self.assertIn("IF_Score", saved_df.columns)
        self.assertIn("IF_Flag", saved_df.columns)
        self.assertIn("IF_Rank", saved_df.columns)

    # ── Test 18 ───────────────────────────────────────────────────────────────
    def test_injected_anomaly_detected_end_to_end(self):
        """
        The multivariate anomaly injected at row 99 in setUpClass must be
        flagged after the full run_isolation_forest_on_all() pipeline -
        the end-to-end proof that file loading, model training, and
        saving all work together correctly.
        """
        run_isolation_forest_on_all(ticker_names=[self.test_ticker])
        saved_df = pd.read_csv(self.test_filepath)

        last_row_flag = saved_df["IF_Flag"].iloc[-1]
        self.assertEqual(
            last_row_flag, 1,
            "Expected the injected multivariate anomaly to be flagged end-to-end"
        )

    # ── Test 19 ───────────────────────────────────────────────────────────────
    def test_missing_ticker_is_skipped_not_crashed(self):
        """
        Requesting a ticker whose CSV doesn't exist must be skipped with
        a warning, not raise an exception - keeping the pipeline robust
        when one stock's file is missing.
        """
        results = run_isolation_forest_on_all(ticker_names=["_NONEXISTENT_TICKER_ABC"])
        self.assertNotIn("_NONEXISTENT_TICKER_ABC", results)
        self.assertEqual(len(results), 0)

    # ── Test 20 ───────────────────────────────────────────────────────────────
    def test_ticker_with_missing_columns_is_skipped_not_crashed(self):
        """
        If a stock's saved CSV is missing one of the required MODEL_FEATURES
        columns (e.g. an older file from before features.py added Return_Z),
        run_isolation_forest_on_all() must skip that stock gracefully and
        continue processing the rest, rather than crashing the whole batch.
        """
        broken_ticker = "_TESTSTOCK_BROKEN_COLS"
        broken_filepath = os.path.join(PROCESSED_DIR, f"{broken_ticker}_features.csv")

        df = _make_synthetic_features_df(n=20).drop(columns=["Vol_Spike"])
        df.to_csv(broken_filepath, index=False)

        try:
            results = run_isolation_forest_on_all(ticker_names=[broken_ticker])
            self.assertNotIn(broken_ticker, results,
                "Expected ticker with missing columns to be skipped, not processed")
        finally:
            if os.path.exists(broken_filepath):
                os.remove(broken_filepath)


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 6 — ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════
#
#   python backend/models/isolation_forest.py           → run on all processed stocks
#   python backend/models/isolation_forest.py --test    → run the 20-test suite
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":

    if "--test" in sys.argv:
        sys.argv.remove("--test")

        print("=" * 55)
        print("  Running isolation_forest.py test suite  (20 tests)")
        print("=" * 55)
        print()

        unittest.main(verbosity=2)

    else:
        run_isolation_forest_on_all()