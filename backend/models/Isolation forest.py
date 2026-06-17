# backend/models/isolation_forest.py
# ─────────────────────────────────────────────────────────────────────────────
# PURPOSE : Train an unsupervised Isolation Forest on the four signal columns
#           produced by features.py (AVR, CAR_10, Vol_Spike, Return_Z) and
#           flag days that look anomalous across ALL signals considered
#           together — not just one signal crossing its own fixed threshold.
#
# WHY THIS MODEL, AND WHY IT DIFFERS FROM THE OTHER DETECTORS:
#   features.py already raises individual flags (AVR > 2.5, |CAR_10| > 0.08,
#   Vol_Spike, Return_Z_Flag). zscore_detector.py (if built) re-checks each
#   column against its OWN per-stock distribution, one column at a time.
#
#   Isolation Forest is different: it looks at all four numbers for a single
#   day TOGETHER, as one point in 4-dimensional space. A day where AVR=1.8,
#   CAR_10=0.05, Vol_Ratio=1.6, and Return_Z=1.9 might not trip any single
#   fixed threshold, but if that COMBINATION is far from how every other day
#   in the dataset behaves, Isolation Forest will isolate it as an outlier.
#   This is exactly the kind of subtle, coordinated pattern an insider
#   trying to stay under any one threshold might still leave behind.
#
#   HOW ISOLATION FOREST WORKS (intuition, not implementation):
#       It builds many random decision trees that try to isolate each data
#       point by repeatedly splitting on random features at random values.
#       Outliers — points that are different from the rest — get isolated
#       in very few splits (they end up in short branches). Normal points,
#       which look like lots of other points, take many splits to isolate.
#       The model converts "how few splits it took" into an anomaly score.
#
# CONTAINS:
#   Section 1 — Imports & Configuration
#   Section 2 — prepare_model_input()  : select + clean the 4 feature columns
#   Section 3 — train_isolation_forest(): fit the model and score every row
#   Section 4 — run_isolation_forest_on_all() : runs on every processed stock
#   Section 5 — Tests                  : unittest, run with --test
#   Section 6 — Entry point
#
# HOW TO RUN:
#   python backend/models/isolation_forest.py           → runs on all processed stocks
#   python backend/models/isolation_forest.py --test    → runs the test suite
#
# DEPENDENCY:
#   This file expects data/processed/{ticker}_features.csv to already exist,
#   with columns AVR, CAR_10, Vol_Spike, Return_Z (produced by features.py).
#   Run `python backend/features.py` first if those files are missing.
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

# The four signal columns from features.py that the model looks at together.
# Order doesn't matter for the model itself, but keeping it fixed makes
# results reproducible and easy to reason about.
MODEL_FEATURES = ["AVR", "CAR_10", "Vol_Ratio", "Return_Z"]

# contamination = the expected PROPORTION of anomalous days in the dataset.
# 0.05 means "assume roughly 5% of trading days are anomalous" — this is a
# deliberately conservative guess; insider-trading-adjacent days should be
# rare, not common. Lower contamination = fewer, more confident flags.
CONTAMINATION = 0.05

# n_estimators = number of random trees the forest builds. More trees give
# a more stable anomaly score at the cost of more computation. 100 is the
# standard default and is more than enough for a few hundred rows per stock.
N_ESTIMATORS = 100

# Fixed random seed so that re-running the model on the same data always
# produces the same flagged days — essential for reproducible test results
# and for trusting that a flag isn't just random tree-building luck.
RANDOM_STATE = 42


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 2 — prepare_model_input()
# ══════════════════════════════════════════════════════════════════════════════

def prepare_model_input(df: pd.DataFrame) -> pd.DataFrame:
    """
    Selects and cleans the four feature columns the Isolation Forest will
    actually train on, returning ONLY the rows that have a complete, valid
    set of all four values.

    WHY WE DROP INCOMPLETE ROWS HERE:
        features.py produces NaN for the first ~60 rows of every stock
        (not enough history yet to compute a 60-day rolling baseline).
        Isolation Forest cannot handle NaN inputs — scikit-learn will raise
        an error if you try. Rather than silently filling NaN with 0 (which
        would create a fake, decision-relevant value of "0" that didn't
        actually happen), we exclude those rows entirely from training and
        scoring. A day we have no real signal for should never be called
        "normal" or "anomalous" — it should simply not be judged.

    Parameters
    ----------
    df : pd.DataFrame
        Output of build_features() from features.py.
        Must contain all columns listed in MODEL_FEATURES.

    Returns
    -------
    pd.DataFrame
        A subset of the input: only rows where every column in
        MODEL_FEATURES is non-NaN. The original index is preserved
        (not reset) so the caller can map results back onto the
        original DataFrame using .loc later.

    Raises
    ------
    ValueError
        If any column in MODEL_FEATURES is missing from the input
        DataFrame entirely. This is a structural problem (wrong
        upstream file version) and should fail loudly, unlike a
        normal NaN row which is just an expected, common case.
    """
    missing_columns = [col for col in MODEL_FEATURES if col not in df.columns]
    if missing_columns:
        raise ValueError(
            f"prepare_model_input() requires columns {MODEL_FEATURES}, "
            f"but these are missing from the input DataFrame: {missing_columns}. "
            f"Make sure build_features() from features.py has already run."
        )

    # dropna(subset=...) keeps a row only if ALL listed columns are non-NaN
    # for that row. This is exactly the "complete case" we need for the model.
    clean_df = df.dropna(subset=MODEL_FEATURES).copy()

    return clean_df


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 3 — train_isolation_forest()
# ══════════════════════════════════════════════════════════════════════════════

def train_isolation_forest(df: pd.DataFrame) -> pd.DataFrame:
    """
    Trains an Isolation Forest on the four feature columns and scores
    every valid row in the input DataFrame.

    Parameters
    ----------
    df : pd.DataFrame
        Output of build_features() from features.py. Does NOT need to be
        pre-cleaned — this function calls prepare_model_input() internally.

    Returns
    -------
    pd.DataFrame
        The ORIGINAL input df (same row count, same index), with two new
        columns added:
        - "IF_Score" : raw anomaly score from the model.
                       More negative = more anomalous.
                       NaN for rows that were skipped (incomplete feature
                       data — see prepare_model_input()).
        - "IF_Flag"  : 1 if the model classified the row as an outlier,
                       0 if normal, 0 (not NaN) for skipped rows.
                       We use 0 rather than NaN for skipped rows here
                       because a flag column should always be safely
                       summable/usable downstream in scoring.py without
                       special NaN-handling.

    WHY WE RETURN THE FULL ORIGINAL DATAFRAME, NOT JUST THE CLEAN SUBSET:
        scoring.py (built later) will want to align this model's output
        with the AVR/CAR/Vol_Spike/Return_Z_Flag columns already in the
        same DataFrame, row for row. Returning a smaller, reduced DataFrame
        would break that alignment. So we score what we can and explicitly
        mark what we couldn't.
    """
    df = df.copy()

    clean_df = prepare_model_input(df)

    # Edge case: if there isn't enough valid data to train on at all
    # (e.g. a stock with fewer than 60 trading days total), return the
    # DataFrame with all-NaN/0 model columns rather than crashing.
    if len(clean_df) == 0:
        df["IF_Score"] = np.nan
        df["IF_Flag"] = 0
        return df

    X = clean_df[MODEL_FEATURES].values

    model = IsolationForest(
        n_estimators=N_ESTIMATORS,
        contamination=CONTAMINATION,
        random_state=RANDOM_STATE,
    )

    # fit_predict returns -1 for outliers, 1 for inliers (scikit-learn's
    # own convention — not ours). We translate this into our own,
    # more readable 1 = anomaly / 0 = normal convention below.
    predictions = model.fit_predict(X)

    # decision_function returns a continuous anomaly score: lower (more
    # negative) values are MORE anomalous. We keep this raw score too,
    # since scoring.py may want the continuous value, not just the binary flag.
    scores = model.decision_function(X)

    # Build a flag column using OUR convention: 1 = anomaly, 0 = normal
    flags = (predictions == -1).astype(int)

    # Initialise the two new columns on the FULL DataFrame as NaN/0,
    # then fill in real values only at the indices we actually scored.
    # Using clean_df.index (preserved from prepare_model_input) lets us
    # place each result back at exactly the right row.
    df["IF_Score"] = np.nan
    df["IF_Flag"] = 0

    df.loc[clean_df.index, "IF_Score"] = np.round(scores, 4)
    df.loc[clean_df.index, "IF_Flag"] = flags

    return df


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 4 — run_isolation_forest_on_all()
# ══════════════════════════════════════════════════════════════════════════════

def run_isolation_forest_on_all(ticker_names: list = None) -> dict:
    """
    Loads every processed feature CSV from data/processed/, trains and
    applies an Isolation Forest PER STOCK (not pooled across stocks — see
    note below), and saves the result back with the new columns added.

    WHY ONE MODEL PER STOCK, NOT ONE MODEL FOR ALL STOCKS COMBINED:
        A "normal" AVR for RELIANCE (a heavily traded large-cap) is a
        completely different number than "normal" for a thinly traded
        stock. Training one global model would let a perfectly ordinary
        day for a high-volume stock get flagged just because it looks
        unusual compared to a low-volume stock's typical day, and vice
        versa. Training a separate model per stock means every day is
        only ever judged against that SAME stock's own history — which
        is the right comparison for this problem.

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
# Like the other detector files, these tests use small, hand-controlled
# synthetic data with a deliberately injected outlier, rather than real
# downloaded data — so we can prove the model actually catches what it's
# supposed to catch, on demand, every time.
# ══════════════════════════════════════════════════════════════════════════════

def _make_synthetic_features_df(n: int = 80, inject_outlier_at: int = None) -> pd.DataFrame:
    """
    Builds a synthetic DataFrame with the four MODEL_FEATURES columns,
    where every row is "normal" (drawn from a tight, consistent
    distribution) except optionally one deliberately extreme row.

    Parameters
    ----------
    n : int
        Number of rows to generate.
    inject_outlier_at : int, optional
        Row index at which to inject a coordinated multivariate outlier —
        all four features simultaneously far outside their normal range.
        If None, no outlier is injected (all rows are "normal").
    """
    rng = np.random.default_rng(seed=7)

    avr = rng.normal(1.0, 0.1, n)          # normal AVR hovers around 1.0
    car = rng.normal(0.0, 0.01, n)         # normal CAR hovers around 0%
    vol_ratio = rng.normal(1.0, 0.1, n)    # normal volatility ratio around 1.0
    return_z = rng.normal(0.0, 0.5, n)     # normal Z-score, small magnitude

    if inject_outlier_at is not None:
        # A coordinated outlier: every signal is extreme at once, which is
        # exactly the kind of subtle multi-signal pattern Isolation Forest
        # is specifically good at catching that single-column checks miss.
        avr[inject_outlier_at] = 6.0
        car[inject_outlier_at] = 0.15
        vol_ratio[inject_outlier_at] = 5.0
        return_z[inject_outlier_at] = 4.5

    return pd.DataFrame({
        "Date": pd.date_range("2025-01-01", periods=n, freq="B"),
        "AVR": avr,
        "CAR_10": car,
        "Vol_Ratio": vol_ratio,
        "Return_Z": return_z,
    })


class TestPrepareModelInput(unittest.TestCase):
    """Tests for prepare_model_input()."""

    # ── Test 1 ────────────────────────────────────────────────────────────────
    def test_raises_when_required_column_missing(self):
        """
        If the input DataFrame is missing one of the four required
        columns entirely (not just having NaN values, but the column
        doesn't exist at all), prepare_model_input() must raise a
        clear ValueError rather than failing later with a confusing
        KeyError deep inside scikit-learn.
        """
        df = pd.DataFrame({
            "AVR": [1.0, 1.1, 0.9],
            "CAR_10": [0.0, 0.01, -0.01],
            # "Vol_Ratio" and "Return_Z" are deliberately missing
        })
        with self.assertRaises(ValueError) as ctx:
            prepare_model_input(df)
        self.assertIn("Vol_Ratio", str(ctx.exception))
        self.assertIn("Return_Z", str(ctx.exception))

    # ── Test 2 ────────────────────────────────────────────────────────────────
    def test_drops_rows_with_any_nan_feature(self):
        """
        A row must be dropped if EVEN ONE of the four feature columns
        is NaN for that row — not just if all four are NaN. This
        matches features.py's behaviour where different columns can
        become valid at slightly different row indices.
        """
        df = pd.DataFrame({
            "AVR": [1.0, np.nan, 0.9, 1.2],
            "CAR_10": [0.0, 0.01, np.nan, 0.02],
            "Vol_Ratio": [1.0, 1.1, 0.95, 1.05],
            "Return_Z": [0.1, 0.2, 0.3, np.nan],
        })
        result = prepare_model_input(df)

        # Only row index 0 has all four values present
        self.assertEqual(len(result), 1)
        self.assertEqual(list(result.index), [0])

    # ── Test 3 ────────────────────────────────────────────────────────────────
    def test_preserves_original_index(self):
        """
        prepare_model_input() must keep the original DataFrame index on
        the rows it returns (not reset to 0,1,2,...). This is essential
        because train_isolation_forest() uses these indices to place
        scores back onto the correct rows of the full DataFrame.
        """
        df = _make_synthetic_features_df(n=10)
        # Manually introduce a NaN in the middle so dropna actually removes a row
        df.loc[5, "AVR"] = np.nan

        result = prepare_model_input(df)

        self.assertNotIn(5, result.index,
            "Row 5 should have been dropped due to NaN")
        self.assertIn(4, result.index,
            "Row 4 should still be present with its original index label")


class TestTrainIsolationForest(unittest.TestCase):
    """Tests for train_isolation_forest()."""

    # ── Test 4 ────────────────────────────────────────────────────────────────
    def test_adds_expected_columns(self):
        """train_isolation_forest() must add IF_Score and IF_Flag columns."""
        df = _make_synthetic_features_df(n=80)
        result = train_isolation_forest(df)

        self.assertIn("IF_Score", result.columns)
        self.assertIn("IF_Flag", result.columns)

    # ── Test 5 ────────────────────────────────────────────────────────────────
    def test_row_count_unchanged(self):
        """
        The output must have exactly the same number of rows as the input,
        even though internally only the "clean" subset was scored. This
        is the key contract that lets scoring.py merge this output safely
        with other signal columns later.
        """
        df = _make_synthetic_features_df(n=80)
        result = train_isolation_forest(df)

        self.assertEqual(len(df), len(result))

    # ── Test 6 ────────────────────────────────────────────────────────────────
    def test_injected_multivariate_outlier_is_flagged(self):
        """
        The single most important test in this file. We inject one row
        where all four signals are simultaneously extreme (but none of
        them alone would necessarily trip a naive single-column threshold
        depending on how it's tuned), and confirm Isolation Forest flags
        exactly that row as an anomaly.
        """
        outlier_row = 70
        df = _make_synthetic_features_df(n=80, inject_outlier_at=outlier_row)
        result = train_isolation_forest(df)

        flag_at_outlier = result["IF_Flag"].iloc[outlier_row]
        self.assertEqual(
            flag_at_outlier, 1,
            "Expected IF_Flag=1 for the deliberately injected multivariate outlier"
        )

    # ── Test 7 ────────────────────────────────────────────────────────────────
    def test_normal_rows_mostly_not_flagged(self):
        """
        With no injected outlier, and contamination=0.05, we expect
        roughly 5% of rows to be flagged (since the model is told to
        always isolate ITS best guess at the most unusual ~5%, even in
        uniformly normal data). We assert the flagged fraction stays in
        a sane range and isn't flagging everything or nothing.
        """
        df = _make_synthetic_features_df(n=200)  # no outlier injected
        result = train_isolation_forest(df)

        flag_rate = result["IF_Flag"].mean()
        self.assertGreater(flag_rate, 0.0,
            "Expected at least some rows flagged given contamination=0.05")
        self.assertLess(flag_rate, 0.15,
            f"Flag rate {flag_rate:.1%} is too high for uniformly normal data")

    # ── Test 8 ────────────────────────────────────────────────────────────────
    def test_incomplete_rows_get_nan_score_and_zero_flag(self):
        """
        Rows that prepare_model_input() would have dropped (NaN in any
        feature) must end up with IF_Score = NaN and IF_Flag = 0 in the
        final output — never a fabricated score, and never counted as
        an anomaly just because we couldn't judge it.
        """
        df = _make_synthetic_features_df(n=80)
        df.loc[3, "AVR"] = np.nan  # deliberately break row 3

        result = train_isolation_forest(df)

        self.assertTrue(pd.isna(result["IF_Score"].iloc[3]),
            "Expected NaN IF_Score for a row with missing feature data")
        self.assertEqual(result["IF_Flag"].iloc[3], 0,
            "Expected IF_Flag=0 (not 1) for a row that couldn't be scored")

    # ── Test 9 ────────────────────────────────────────────────────────────────
    def test_does_not_mutate_input_dataframe(self):
        """
        train_isolation_forest() must not modify the caller's original
        DataFrame in place — we always .copy() at the top of the function.
        This test confirms that contract holds.
        """
        df = _make_synthetic_features_df(n=80)
        original_columns = list(df.columns)

        train_isolation_forest(df)

        self.assertEqual(
            list(df.columns), original_columns,
            "train_isolation_forest() mutated the caller's original DataFrame"
        )

    # ── Test 10 ───────────────────────────────────────────────────────────────
    def test_empty_clean_data_does_not_crash(self):
        """
        If every single row has at least one NaN feature (e.g. a stock
        with too little history to ever pass the 60-day rolling window),
        train_isolation_forest() must return gracefully with all-NaN
        scores and all-zero flags, not crash when trying to fit a model
        on zero rows.
        """
        df = _make_synthetic_features_df(n=10)
        df["AVR"] = np.nan  # break every row

        result = train_isolation_forest(df)

        self.assertTrue(result["IF_Score"].isna().all(),
            "Expected all-NaN IF_Score when no rows have complete data")
        self.assertTrue((result["IF_Flag"] == 0).all(),
            "Expected all-zero IF_Flag when no rows have complete data")

    # ── Test 11 ───────────────────────────────────────────────────────────────
    def test_reproducible_with_fixed_random_state(self):
        """
        Running train_isolation_forest() twice on the IDENTICAL input
        must produce IDENTICAL flags both times, because RANDOM_STATE is
        fixed. This matters for trust: a flag should be a property of the
        data, not a coin flip that changes between runs.
        """
        df = _make_synthetic_features_df(n=80, inject_outlier_at=70)

        result_1 = train_isolation_forest(df)
        result_2 = train_isolation_forest(df)

        pd.testing.assert_series_equal(
            result_1["IF_Flag"], result_2["IF_Flag"],
            check_names=False,
            obj="IF_Flag should be identical across repeated runs with a fixed random_state"
        )


class TestRunIsolationForestOnAll(unittest.TestCase):
    """Tests for run_isolation_forest_on_all() — the integration / file-handling layer."""

    @classmethod
    def setUpClass(cls):
        cls.test_ticker = "_TESTSTOCK_ISOFOREST"
        cls.test_filepath = os.path.join(PROCESSED_DIR, f"{cls.test_ticker}_features.csv")

        os.makedirs(PROCESSED_DIR, exist_ok=True)

        df = _make_synthetic_features_df(n=80, inject_outlier_at=75)
        df.to_csv(cls.test_filepath, index=False)

    @classmethod
    def tearDownClass(cls):
        if os.path.exists(cls.test_filepath):
            os.remove(cls.test_filepath)

    # ── Test 12 ───────────────────────────────────────────────────────────────
    def test_processes_given_ticker_and_returns_dict(self):
        """
        run_isolation_forest_on_all() called with our synthetic test
        ticker must process it successfully and return a dict containing it.
        """
        results = run_isolation_forest_on_all(ticker_names=[self.test_ticker])
        self.assertIn(self.test_ticker, results)
        self.assertIsInstance(results[self.test_ticker], pd.DataFrame)

    # ── Test 13 ───────────────────────────────────────────────────────────────
    def test_saved_csv_contains_new_columns(self):
        """
        After running, the CSV on disk must be overwritten with the new
        IF_Score / IF_Flag columns included — confirming the save step
        actually persisted the enriched DataFrame.
        """
        run_isolation_forest_on_all(ticker_names=[self.test_ticker])
        saved_df = pd.read_csv(self.test_filepath)

        self.assertIn("IF_Score", saved_df.columns)
        self.assertIn("IF_Flag", saved_df.columns)

    # ── Test 14 ───────────────────────────────────────────────────────────────
    def test_injected_outlier_detected_end_to_end(self):
        """
        The multivariate outlier injected at row 75 in setUpClass must be
        flagged after the full run_isolation_forest_on_all() pipeline —
        proving file loading, model training, scoring, and saving all
        work together correctly.
        """
        run_isolation_forest_on_all(ticker_names=[self.test_ticker])
        saved_df = pd.read_csv(self.test_filepath)

        flag_at_outlier = saved_df["IF_Flag"].iloc[75]
        self.assertEqual(
            flag_at_outlier, 1,
            "Expected the injected outlier at row 75 to be flagged end-to-end"
        )

    # ── Test 15 ───────────────────────────────────────────────────────────────
    def test_missing_ticker_is_skipped_not_crashed(self):
        """
        Requesting a ticker whose CSV doesn't exist must be skipped with
        a warning, not raise an exception — keeping the pipeline robust
        when one stock's file is missing.
        """
        results = run_isolation_forest_on_all(ticker_names=["_NONEXISTENT_TICKER_DEF"])
        self.assertNotIn("_NONEXISTENT_TICKER_DEF", results)
        self.assertEqual(len(results), 0)


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 6 — ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════
#
#   python backend/models/isolation_forest.py           → run on all processed stocks
#   python backend/models/isolation_forest.py --test    → run the 15-test suite
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":

    if "--test" in sys.argv:
        sys.argv.remove("--test")

        print("=" * 55)
        print("  Running isolation_forest.py test suite  (15 tests)")
        print("=" * 55)
        print()

        unittest.main(verbosity=2)

    else:
        run_isolation_forest_on_all()