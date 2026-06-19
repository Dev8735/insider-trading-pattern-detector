# backend/models/dbscan_cluster.py
# ─────────────────────────────────────────────────────────────────────────────
# PURPOSE : Detect COORDINATED trading activity by clustering insider trade
#           disclosures (or any trade-level records) by their proximity in
#           TIME and PRICE. A tight cluster of trades from different filers,
#           all occurring within a few days of each other at similar prices,
#           is a stronger insider-trading signal than any single trade alone.
#
# WHY DBSCAN, AND WHY THIS IS DIFFERENT FROM THE OTHER TWO MODELS:
#   zscore_detector.py and isolation_forest.py both operate on a single
#   stock's daily TIME SERIES (one row per trading day). This file operates
#   on individual TRADE RECORDS (one row per disclosed trade), which can be
#   sparse, irregular, and come from multiple different people/entities.
#
#   DBSCAN (Density-Based Spatial Clustering) is suited to this because:
#   - It doesn't require specifying the number of clusters in advance
#     (unlike k-means) — clusters emerge naturally from dense regions.
#   - It naturally labels isolated, one-off trades as "noise" (no cluster),
#     which is exactly what we want: an isolated trade is NOT suspicious
#     on its own, but a dense cluster of several trades close together is.
#
# CONTAINS:
#   Section 1 — Imports & Configuration
#   Section 2 — prepare_trade_input()   : scale time & price for clustering
#   Section 3 — run_dbscan_clustering() : fit DBSCAN and label trades
#   Section 4 — summarize_clusters()    : turn cluster labels into per-cluster stats
#   Section 5 — run_clustering_on_all() : runs detection for every stock's trade file
#   Section 6 — Tests                   : unittest, run with --test
#   Section 7 — Entry point
#
# HOW TO RUN:
#   python backend/models/dbscan_cluster.py           → runs on all trade files
#   python backend/models/dbscan_cluster.py --test    → runs the test suite
#
# EXPECTED INPUT FORMAT (one CSV per stock, in data/bse_disclosures/):
#   Columns required: Date, Price, Entity
#   - Date    : trade disclosure date (YYYY-MM-DD string)
#   - Price   : the price at which the disclosed trade occurred
#   - Entity  : name/ID of the person or entity who made the trade
#               (different entities trading close together is what makes
#               a cluster suspicious — coordination across people)
#
# NEW LIBRARY USED HERE:
#   scikit-learn's DBSCAN (same package as isolation_forest.py, no new install)
# ─────────────────────────────────────────────────────────────────────────────


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 1 — IMPORTS & CONFIGURATION
# ══════════════════════════════════════════════════════════════════════════════

import os
import sys
import unittest

import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler

DISCLOSURES_DIR = "data/bse_disclosures"
PROCESSED_DIR = "data/processed"

# Required input columns — every trade record must have these.
TRADE_COLUMNS = ["Date", "Price", "Entity"]

# DBSCAN's two core parameters:
#
# EPS (epsilon) : the maximum distance between two points for them to be
#                 considered "neighbours." Since we scale Date and Price
#                 to comparable ranges (see prepare_trade_input()), this
#                 is a unitless distance in SCALED space, not raw days
#                 or raw rupees.
#
# MIN_SAMPLES   : the minimum number of trades required to form a dense
#                 cluster. We set this to 2 — meaning even 2 trades close
#                 together can form a cluster. This is deliberately
#                 permissive because real insider coordination might only
#                 involve a handful of people, not dozens.
EPS = 0.5
MIN_SAMPLES = 2


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 2 — prepare_trade_input()
# ══════════════════════════════════════════════════════════════════════════════

def prepare_trade_input(df: pd.DataFrame) -> np.ndarray:
    """
    Converts Date and Price columns into a scaled 2D numpy array suitable
    for DBSCAN's distance-based clustering.

    WHY SCALING IS ESSENTIAL HERE:
        DBSCAN clusters based on Euclidean distance between points. Date
        and Price are on wildly different numeric scales — a date might be
        represented as "20000" (days since epoch) while a price might be
        "150.50" (rupees). Without scaling, DBSCAN would treat tiny price
        differences as irrelevant compared to date differences, since the
        raw date numbers are so much larger.

        StandardScaler transforms both columns to have mean 0 and standard
        deviation 1, so a "1 unit" difference in scaled-date space is
        comparable in importance to a "1 unit" difference in scaled-price
        space. This is what makes EPS=0.5 meaningful across both dimensions
        simultaneously.

    Parameters
    ----------
    df : pd.DataFrame
        Must contain "Date" (string, YYYY-MM-DD) and "Price" (numeric)
        columns. Typically one stock's trade disclosure records.

    Returns
    -------
    np.ndarray of shape (n_trades, 2)
        Column 0 = scaled date (as days since the earliest trade in this df)
        Column 1 = scaled price
        Ready to be passed directly into DBSCAN.fit_predict().

    Raises
    ------
    ValueError
        If "Date" or "Price" columns are missing from the input.
    """
    missing_cols = [col for col in ["Date", "Price"] if col not in df.columns]
    if missing_cols:
        raise ValueError(
            f"prepare_trade_input() requires columns ['Date', 'Price'], "
            f"but these are missing: {missing_cols}"
        )

    # Convert Date strings to actual datetime objects, then to a numeric
    # "days since earliest trade" value — DBSCAN needs numbers, not strings.
    dates = pd.to_datetime(df["Date"])
    days_since_start = (dates - dates.min()).dt.days.values.reshape(-1, 1)

    prices = df["Price"].values.reshape(-1, 1)

    # Stack date and price into one (n_trades, 2) array
    raw_features = np.hstack([days_since_start, prices])

    # Scale both columns to mean=0, std=1 so they're comparable
    scaler = StandardScaler()
    scaled_features = scaler.fit_transform(raw_features)

    return scaled_features


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 3 — run_dbscan_clustering()
# ══════════════════════════════════════════════════════════════════════════════

def run_dbscan_clustering(df: pd.DataFrame) -> pd.DataFrame:
    """
    Runs DBSCAN clustering on a stock's trade disclosure records and adds
    cluster labels back onto the original DataFrame.

    HOW DBSCAN WORKS (conceptually):
        For each point, DBSCAN looks at how many other points fall within
        distance EPS of it. If there are at least MIN_SAMPLES neighbours
        (including itself), it's a "core point" and starts/extends a
        cluster. Points that aren't within EPS of any cluster are labelled
        as noise (-1) — meaning they're isolated, one-off trades with no
        nearby coordinated activity.

    Parameters
    ----------
    df : pd.DataFrame
        Must contain TRADE_COLUMNS = ["Date", "Price", "Entity"].
        Typically all disclosed trades for ONE stock across its history.

    Returns
    -------
    pd.DataFrame
        Same as input, with two new columns added:
        - "Cluster_ID"   : the cluster label assigned by DBSCAN.
                            -1 means "noise" (not part of any cluster,
                            i.e. an isolated trade — not suspicious on
                            its own).
                            0, 1, 2, ... are distinct cluster IDs — all
                            trades sharing the same non-negative ID are
                            considered part of the same coordinated group.
        - "Cluster_Flag" : 1 if Cluster_ID != -1 (this trade IS part of
                            a cluster), 0 if it's noise (isolated trade).
                            This is the simple binary signal scoring.py
                            will consume.

    Raises
    ------
    ValueError
        Propagated from prepare_trade_input() if required columns are missing.
    """
    df = df.copy()

    scaled_features = prepare_trade_input(df)

    model = DBSCAN(eps=EPS, min_samples=MIN_SAMPLES)
    cluster_labels = model.fit_predict(scaled_features)

    df["Cluster_ID"] = cluster_labels
    df["Cluster_Flag"] = (df["Cluster_ID"] != -1).astype(int)

    return df


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 4 — summarize_clusters()
# ══════════════════════════════════════════════════════════════════════════════

def summarize_clusters(df: pd.DataFrame) -> pd.DataFrame:
    """
    Builds a per-cluster summary table — one row per cluster, showing how
    many trades and how many DISTINCT entities are involved, plus the
    date range the cluster spans.

    WHY DISTINCT ENTITY COUNT MATTERS MOST:
        A cluster of 5 trades all made by the SAME person isn't unusual —
        that's just one investor's normal trading pattern. A cluster of
        5 trades made by 5 DIFFERENT entities within a few days of each
        other is the real red flag — it suggests coordinated action,
        which is much harder to explain as a coincidence.

    Parameters
    ----------
    df : pd.DataFrame
        Must already have "Cluster_ID" column (output of run_dbscan_clustering()).
        Also needs "Date", "Entity" columns from the original trade data.

    Returns
    -------
    pd.DataFrame with one row per cluster (excluding noise, Cluster_ID == -1):
        - "Cluster_ID"        : the cluster identifier
        - "Trade_Count"       : total number of trades in this cluster
        - "Distinct_Entities" : number of UNIQUE entities involved
        - "Start_Date"        : earliest trade date in the cluster
        - "End_Date"          : latest trade date in the cluster
        - "Multi_Entity_Flag" : 1 if Distinct_Entities >= 2, else 0 —
                                 the strongest individual indicator of
                                 coordinated (rather than coincidental)
                                 trading activity.

    Returns an empty DataFrame (with the correct columns, zero rows) if
    there are no clusters at all (every trade was noise).
    """
    if "Cluster_ID" not in df.columns:
        raise ValueError(
            "summarize_clusters() requires a 'Cluster_ID' column. "
            "Call run_dbscan_clustering() first."
        )

    # Exclude noise points (-1) — we only summarize actual clusters
    clustered = df[df["Cluster_ID"] != -1].copy()

    if clustered.empty:
        return pd.DataFrame(columns=[
            "Cluster_ID", "Trade_Count", "Distinct_Entities",
            "Start_Date", "End_Date", "Multi_Entity_Flag"
        ])

    clustered["Date"] = pd.to_datetime(clustered["Date"])

    summary = (
        clustered
        .groupby("Cluster_ID")
        .agg(
            Trade_Count=("Entity", "size"),
            Distinct_Entities=("Entity", "nunique"),
            Start_Date=("Date", "min"),
            End_Date=("Date", "max"),
        )
        .reset_index()
    )

    summary["Start_Date"] = summary["Start_Date"].dt.strftime("%Y-%m-%d")
    summary["End_Date"] = summary["End_Date"].dt.strftime("%Y-%m-%d")
    summary["Multi_Entity_Flag"] = (summary["Distinct_Entities"] >= 2).astype(int)

    return summary


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 5 — run_clustering_on_all()
# ══════════════════════════════════════════════════════════════════════════════

def run_clustering_on_all(ticker_names: list = None) -> dict:
    """
    Loads every trade disclosure CSV from data/bse_disclosures/, runs
    DBSCAN clustering, saves the enriched trade-level CSV back to
    data/processed/, and also saves a separate cluster summary CSV.

    Parameters
    ----------
    ticker_names : list, optional
        Clean ticker names to process, e.g. ["RELIANCE", "INFY"].
        Expected file naming: data/bse_disclosures/{ticker}_trades.csv
        If None, auto-detects every "{name}_trades.csv" file in
        data/bse_disclosures/.

    Returns
    -------
    dict  {ticker_name: {"trades": pd.DataFrame, "clusters": pd.DataFrame}}
          Only successfully processed tickers are included.
    """
    print("=" * 55)
    print("  Insider Trading Detector - DBSCAN Trade Clustering")
    print("=" * 55)

    if ticker_names is None:
        if not os.path.exists(DISCLOSURES_DIR):
            print(f"  Warning: {DISCLOSURES_DIR}/ does not exist. "
                  f"No trade disclosure data available yet.")
            return {}

        ticker_names = [
            f.replace("_trades.csv", "")
            for f in os.listdir(DISCLOSURES_DIR)
            if f.endswith("_trades.csv")
        ]

    os.makedirs(PROCESSED_DIR, exist_ok=True)
    results = {}

    for ticker_name in ticker_names:
        filepath = os.path.join(DISCLOSURES_DIR, f"{ticker_name}_trades.csv")

        if not os.path.exists(filepath):
            print(f"  Warning: {filepath} not found - skipping {ticker_name}.")
            continue

        print(f"  Processing {ticker_name} ...")
        df = pd.read_csv(filepath)

        try:
            clustered_df = run_dbscan_clustering(df)
        except ValueError as e:
            print(f"    Error: {e}")
            continue

        cluster_summary = summarize_clusters(clustered_df)

        trades_out_path = os.path.join(PROCESSED_DIR, f"{ticker_name}_trades_clustered.csv")
        summary_out_path = os.path.join(PROCESSED_DIR, f"{ticker_name}_clusters_summary.csv")

        clustered_df.to_csv(trades_out_path, index=False)
        cluster_summary.to_csv(summary_out_path, index=False)

        results[ticker_name] = {
            "trades": clustered_df,
            "clusters": cluster_summary,
        }

        n_clusters = clustered_df[clustered_df["Cluster_ID"] != -1]["Cluster_ID"].nunique()
        n_multi_entity = int(cluster_summary["Multi_Entity_Flag"].sum()) if not cluster_summary.empty else 0
        print(f"    Done: {n_clusters} cluster(s) found, "
              f"{n_multi_entity} multi-entity -> {trades_out_path}")

    print()
    print("=" * 55)
    print(f"  DBSCAN clustering complete: {len(results)} stocks processed")
    print(f"  Files updated in: {PROCESSED_DIR}/")
    print("=" * 55)

    return results


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 6 — TESTS
# ══════════════════════════════════════════════════════════════════════════════
#
# HOW TO RUN:
#   python backend/models/dbscan_cluster.py --test
# ══════════════════════════════════════════════════════════════════════════════

def _make_synthetic_trades_df() -> pd.DataFrame:
    """
    Builds a synthetic trade disclosure DataFrame with THREE deliberately
    constructed groups, so we know exactly what DBSCAN should find:

    GROUP A — a tight cluster: 4 trades from 4 DIFFERENT entities, all
              within 2 days of each other, at very similar prices.
              This should form ONE cluster with Multi_Entity_Flag = 1.

    GROUP B — isolated noise: 3 trades scattered far apart in both time
              and price, each from a different entity, with no other
              trade nearby. These should all be labelled -1 (noise).

    GROUP C — a same-entity cluster: 3 trades close in time/price but
              ALL from the SAME entity. This may still form a DBSCAN
              cluster (since DBSCAN doesn't know about entities), but
              summarize_clusters() should correctly report
              Distinct_Entities = 1 and Multi_Entity_Flag = 0 for it —
              proving we don't mistake routine single-investor activity
              for coordination.
    """
    rows = []

    # GROUP A: tight, multi-entity cluster
    base_date = pd.Timestamp("2025-03-01")
    for i, entity in enumerate(["Entity_A", "Entity_B", "Entity_C", "Entity_D"]):
        rows.append({
            "Date": (base_date + pd.Timedelta(days=i)).strftime("%Y-%m-%d"),
            "Price": 150.0 + i * 0.5,
            "Entity": entity,
        })

    # GROUP B: scattered noise, far apart in time and price
    noise_specs = [
        ("2025-01-05", 80.0, "Entity_E"),
        ("2025-05-20", 220.0, "Entity_F"),
        ("2025-09-10", 95.0, "Entity_G"),
    ]
    for date_str, price, entity in noise_specs:
        rows.append({"Date": date_str, "Price": price, "Entity": entity})

    # GROUP C: tight cluster but all the SAME entity
    base_date_c = pd.Timestamp("2025-07-01")
    for i in range(3):
        rows.append({
            "Date": (base_date_c + pd.Timedelta(days=i)).strftime("%Y-%m-%d"),
            "Price": 300.0 + i * 0.3,
            "Entity": "Entity_SOLO",
        })

    return pd.DataFrame(rows)


class TestPrepareTradeInput(unittest.TestCase):
    """Tests for prepare_trade_input()."""

    # ── Test 1 ────────────────────────────────────────────────────────────────
    def test_returns_correct_shape(self):
        """
        Output must be a 2-column numpy array (date, price) with one row
        per input trade.
        """
        df = _make_synthetic_trades_df()
        result = prepare_trade_input(df)

        self.assertEqual(result.shape, (len(df), 2),
            f"Expected shape ({len(df)}, 2), got {result.shape}")

    # ── Test 2 ────────────────────────────────────────────────────────────────
    def test_scaled_output_has_zero_mean(self):
        """
        StandardScaler transforms data to mean ≈ 0, std ≈ 1 per column.
        This test confirms scaling actually happened (raw Date/Price values
        would never naturally have mean 0).
        """
        df = _make_synthetic_trades_df()
        result = prepare_trade_input(df)

        col_means = result.mean(axis=0)
        self.assertTrue(
            np.allclose(col_means, 0, atol=1e-9),
            f"Expected scaled columns to have mean ~0, got {col_means}"
        )

    # ── Test 3 ────────────────────────────────────────────────────────────────
    def test_missing_date_column_raises_value_error(self):
        """Missing 'Date' column must raise a clear ValueError."""
        df = _make_synthetic_trades_df().drop(columns=["Date"])
        with self.assertRaises(ValueError) as ctx:
            prepare_trade_input(df)
        self.assertIn("Date", str(ctx.exception))

    # ── Test 4 ────────────────────────────────────────────────────────────────
    def test_missing_price_column_raises_value_error(self):
        """Missing 'Price' column must raise a clear ValueError."""
        df = _make_synthetic_trades_df().drop(columns=["Price"])
        with self.assertRaises(ValueError) as ctx:
            prepare_trade_input(df)
        self.assertIn("Price", str(ctx.exception))


class TestRunDbscanClustering(unittest.TestCase):
    """Tests for run_dbscan_clustering()."""

    @classmethod
    def setUpClass(cls):
        cls.df = _make_synthetic_trades_df()
        cls.result = run_dbscan_clustering(cls.df)

    # ── Test 5 ────────────────────────────────────────────────────────────────
    def test_adds_expected_columns(self):
        """Must add exactly Cluster_ID and Cluster_Flag columns."""
        self.assertIn("Cluster_ID", self.result.columns)
        self.assertIn("Cluster_Flag", self.result.columns)

    # ── Test 6 ────────────────────────────────────────────────────────────────
    def test_row_count_unchanged(self):
        """Clustering must not add or drop trade rows."""
        self.assertEqual(len(self.df), len(self.result))

    # ── Test 7 ────────────────────────────────────────────────────────────────
    def test_cluster_flag_is_binary(self):
        """Cluster_Flag must contain only 0 or 1."""
        unique_vals = set(self.result["Cluster_Flag"].unique())
        self.assertTrue(unique_vals.issubset({0, 1}),
            f"Cluster_Flag contains non-binary values: {unique_vals}")

    # ── Test 8 ────────────────────────────────────────────────────────────────
    def test_group_a_tight_multi_entity_cluster_is_detected(self):
        """
        THE CORE TEST OF THIS FILE.

        The 4 trades in GROUP A (different entities, 1 day apart, similar
        prices) must all be assigned to the SAME cluster, and that cluster
        must NOT be noise (-1).
        """
        group_a_entities = ["Entity_A", "Entity_B", "Entity_C", "Entity_D"]
        group_a_rows = self.result[self.result["Entity"].isin(group_a_entities)]

        cluster_ids = group_a_rows["Cluster_ID"].unique()

        self.assertEqual(
            len(cluster_ids), 1,
            f"Expected all 4 Group A trades in ONE cluster, "
            f"got cluster IDs: {cluster_ids}"
        )
        self.assertNotEqual(
            cluster_ids[0], -1,
            "Expected Group A trades to be clustered, not labelled as noise"
        )

    # ── Test 9 ────────────────────────────────────────────────────────────────
    def test_group_b_scattered_trades_are_noise(self):
        """
        The 3 scattered trades in GROUP B (far apart in time and price)
        should each be labelled as noise (Cluster_ID == -1), since none
        of them has another trade nearby in scaled date/price space.
        """
        group_b_entities = ["Entity_E", "Entity_F", "Entity_G"]
        group_b_rows = self.result[self.result["Entity"].isin(group_b_entities)]

        self.assertTrue(
            (group_b_rows["Cluster_ID"] == -1).all(),
            f"Expected all Group B trades to be noise (-1), got: "
            f"{group_b_rows['Cluster_ID'].tolist()}"
        )

    # ── Test 10 ───────────────────────────────────────────────────────────────
    def test_missing_required_column_raises_value_error(self):
        """run_dbscan_clustering() must propagate ValueError for missing columns."""
        df = _make_synthetic_trades_df().drop(columns=["Price"])
        with self.assertRaises(ValueError):
            run_dbscan_clustering(df)


class TestSummarizeClusters(unittest.TestCase):
    """Tests for summarize_clusters()."""

    @classmethod
    def setUpClass(cls):
        df = _make_synthetic_trades_df()
        cls.clustered = run_dbscan_clustering(df)
        cls.summary = summarize_clusters(cls.clustered)

    # ── Test 11 ───────────────────────────────────────────────────────────────
    def test_returns_expected_columns(self):
        """Summary must have all 6 expected columns."""
        expected = [
            "Cluster_ID", "Trade_Count", "Distinct_Entities",
            "Start_Date", "End_Date", "Multi_Entity_Flag"
        ]
        self.assertEqual(list(self.summary.columns), expected,
            f"Expected columns {expected}, got {list(self.summary.columns)}")

    # ── Test 12 ───────────────────────────────────────────────────────────────
    def test_noise_points_excluded_from_summary(self):
        """
        Total trades across all summarized clusters must be LESS than the
        total input trades, since noise points (Group B) are excluded.
        """
        total_clustered_trades = self.summary["Trade_Count"].sum()
        self.assertLess(
            total_clustered_trades, len(self.clustered),
            "Summary should exclude noise points, so clustered trade count "
            "should be less than total trade count"
        )

    # ── Test 13 ───────────────────────────────────────────────────────────────
    def test_group_a_cluster_has_four_distinct_entities(self):
        """
        Group A's cluster must show Distinct_Entities == 4 (Entity_A
        through Entity_D, all different) and Multi_Entity_Flag == 1.
        """
        # Find Group A's cluster ID via one of its known entities
        group_a_cluster_id = self.clustered[
            self.clustered["Entity"] == "Entity_A"
        ]["Cluster_ID"].iloc[0]

        group_a_summary = self.summary[
            self.summary["Cluster_ID"] == group_a_cluster_id
        ].iloc[0]

        self.assertEqual(group_a_summary["Distinct_Entities"], 4,
            f"Expected 4 distinct entities in Group A's cluster, "
            f"got {group_a_summary['Distinct_Entities']}")
        self.assertEqual(group_a_summary["Multi_Entity_Flag"], 1,
            "Expected Multi_Entity_Flag=1 for Group A's multi-entity cluster")

    # ── Test 14 ───────────────────────────────────────────────────────────────
    def test_group_c_same_entity_cluster_has_low_multi_entity_flag(self):
        """
        Group C's trades all come from "Entity_SOLO" — even if DBSCAN
        groups them together spatially (close in time/price), the
        Distinct_Entities count must correctly show 1, and
        Multi_Entity_Flag must be 0 — proving we distinguish "one investor
        trading several times" from genuine multi-party coordination.

        This is the most important business-logic test in this file:
        it's the difference between a false alarm and a real signal.
        """
        group_c_rows = self.clustered[self.clustered["Entity"] == "Entity_SOLO"]

        # Only run this assertion if Group C actually formed a cluster
        # (it should, given how tightly the 3 points are constructed)
        cluster_ids = group_c_rows["Cluster_ID"].unique()

        if len(cluster_ids) == 1 and cluster_ids[0] != -1:
            group_c_summary = self.summary[
                self.summary["Cluster_ID"] == cluster_ids[0]
            ].iloc[0]

            self.assertEqual(group_c_summary["Distinct_Entities"], 1,
                "Expected exactly 1 distinct entity for Group C's same-entity cluster")
            self.assertEqual(group_c_summary["Multi_Entity_Flag"], 0,
                "Expected Multi_Entity_Flag=0 when only one entity is involved")

    # ── Test 15 ───────────────────────────────────────────────────────────────
    def test_missing_cluster_id_column_raises_value_error(self):
        """
        summarize_clusters() must raise ValueError if called on a
        DataFrame that hasn't been through run_dbscan_clustering() yet
        (i.e. has no Cluster_ID column).
        """
        df = _make_synthetic_trades_df()  # no Cluster_ID column
        with self.assertRaises(ValueError) as ctx:
            summarize_clusters(df)
        self.assertIn("Cluster_ID", str(ctx.exception))

    # ── Test 16 ───────────────────────────────────────────────────────────────
    def test_all_noise_returns_empty_dataframe_with_correct_columns(self):
        """
        If every single trade is noise (no clusters at all), summarize_clusters()
        must return an EMPTY DataFrame with the correct column structure,
        not crash or return None.
        """
        all_noise_df = pd.DataFrame({
            "Date": ["2025-01-01", "2025-06-01", "2025-11-01"],
            "Price": [100.0, 500.0, 50.0],
            "Entity": ["A", "B", "C"],
            "Cluster_ID": [-1, -1, -1],
        })

        result = summarize_clusters(all_noise_df)

        self.assertEqual(len(result), 0, "Expected empty summary when all trades are noise")
        expected_cols = [
            "Cluster_ID", "Trade_Count", "Distinct_Entities",
            "Start_Date", "End_Date", "Multi_Entity_Flag"
        ]
        self.assertEqual(list(result.columns), expected_cols)


class TestRunClusteringOnAll(unittest.TestCase):
    """Tests for run_clustering_on_all() — the integration / file-handling layer."""

    @classmethod
    def setUpClass(cls):
        cls.test_ticker = "_TESTSTOCK_DBSCAN"
        cls.test_filepath = os.path.join(DISCLOSURES_DIR, f"{cls.test_ticker}_trades.csv")

        os.makedirs(DISCLOSURES_DIR, exist_ok=True)
        os.makedirs(PROCESSED_DIR, exist_ok=True)

        df = _make_synthetic_trades_df()
        df.to_csv(cls.test_filepath, index=False)

    @classmethod
    def tearDownClass(cls):
        files_to_remove = [
            cls.test_filepath,
            os.path.join(PROCESSED_DIR, f"{cls.test_ticker}_trades_clustered.csv"),
            os.path.join(PROCESSED_DIR, f"{cls.test_ticker}_clusters_summary.csv"),
        ]
        for f in files_to_remove:
            if os.path.exists(f):
                os.remove(f)

    # ── Test 17 ───────────────────────────────────────────────────────────────
    def test_processes_given_ticker_and_returns_dict(self):
        """
        run_clustering_on_all() called with our synthetic test ticker
        must process it and return a dict with "trades" and "clusters" keys.
        """
        results = run_clustering_on_all(ticker_names=[self.test_ticker])

        self.assertIn(self.test_ticker, results)
        self.assertIn("trades", results[self.test_ticker])
        self.assertIn("clusters", results[self.test_ticker])

    # ── Test 18 ───────────────────────────────────────────────────────────────
    def test_both_output_files_saved_to_disk(self):
        """
        After running, BOTH the trades-with-clusters CSV and the cluster
        summary CSV must physically exist on disk.
        """
        run_clustering_on_all(ticker_names=[self.test_ticker])

        trades_path = os.path.join(PROCESSED_DIR, f"{self.test_ticker}_trades_clustered.csv")
        summary_path = os.path.join(PROCESSED_DIR, f"{self.test_ticker}_clusters_summary.csv")

        self.assertTrue(os.path.exists(trades_path), f"Missing file: {trades_path}")
        self.assertTrue(os.path.exists(summary_path), f"Missing file: {summary_path}")

    # ── Test 19 ───────────────────────────────────────────────────────────────
    def test_missing_ticker_is_skipped_not_crashed(self):
        """
        Requesting a ticker whose trade CSV doesn't exist must be skipped
        with a warning, not raise an exception.
        """
        results = run_clustering_on_all(ticker_names=["_NONEXISTENT_TICKER_ABC"])
        self.assertNotIn("_NONEXISTENT_TICKER_ABC", results)
        self.assertEqual(len(results), 0)

    # ── Test 20 ───────────────────────────────────────────────────────────────
    def test_ticker_with_missing_columns_is_skipped_not_crashed(self):
        """
        A trade file missing a required column (e.g. "Price") must be
        skipped gracefully, allowing the rest of the batch to continue.
        """
        broken_ticker = "_TESTSTOCK_BROKEN_DBSCAN"
        broken_filepath = os.path.join(DISCLOSURES_DIR, f"{broken_ticker}_trades.csv")

        df = _make_synthetic_trades_df().drop(columns=["Price"])
        df.to_csv(broken_filepath, index=False)

        try:
            results = run_clustering_on_all(ticker_names=[broken_ticker])
            self.assertNotIn(broken_ticker, results,
                "Expected ticker with missing columns to be skipped")
        finally:
            if os.path.exists(broken_filepath):
                os.remove(broken_filepath)


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 7 — ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════
#
#   python backend/models/dbscan_cluster.py           → run on all trade files
#   python backend/models/dbscan_cluster.py --test    → run the 20-test suite
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":

    if "--test" in sys.argv:
        sys.argv.remove("--test")

        print("=" * 55)
        print("  Running dbscan_cluster.py test suite  (20 tests)")
        print("=" * 55)
        print()

        unittest.main(verbosity=2)

    else:
        run_clustering_on_all()