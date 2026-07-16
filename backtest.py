#!/usr/bin/env python3
"""
backtest.py - Combinational TP/SL Grid Search Backtest

Finds the Take-Profit / Stop-Loss percentage combination that maximises
total profit across all BUY signals in signal_report.csv, using daily
OHLCV candle data to simulate exits.

Usage:
    python backtest.py                      # uses config.yaml
    python backtest.py --config my.yaml     # custom config
"""

import argparse
import os
import sys
import time
from pathlib import Path
from typing import Dict, List, Tuple

import pandas as pd
import yaml


# --------------------------------------------------------------------------
# Config
# --------------------------------------------------------------------------

def load_config(path: str = "config.yaml") -> dict:
    """Load YAML configuration file."""
    with open(path, "r") as f:
        cfg = yaml.safe_load(f)
    return cfg


# --------------------------------------------------------------------------
# Data Loading
# --------------------------------------------------------------------------

def load_ohlcv(raw_dir: str) -> Dict[str, pd.DataFrame]:
    """Load all *_ohlcv.csv files into {ticker: DataFrame} dict."""
    raw_path = Path(raw_dir)
    if not raw_path.exists():
        raise FileNotFoundError(f"Raw data directory not found: {raw_path}")

    ohlcv: Dict[str, pd.DataFrame] = {}
    for csv_file in sorted(raw_path.glob("*_ohlcv.csv")):
        ticker = csv_file.stem.replace("_ohlcv", "")
        df = pd.read_csv(csv_file, parse_dates=["Date"])
        df.sort_values("Date", inplace=True)
        df.reset_index(drop=True, inplace=True)
        ohlcv[ticker] = df

    if not ohlcv:
        raise ValueError(f"No *_ohlcv.csv files found in {raw_path}")

    print(f"  Loaded OHLCV data for {len(ohlcv)} tickers")
    return ohlcv


def load_signals(signal_file: str) -> pd.DataFrame:
    """Load signal_report.csv and keep only BUY signals."""
    df = pd.read_csv(signal_file, parse_dates=["Date"])
    total = len(df)
    df = df[df["Direction"] == "BUY"].copy()
    df.sort_values("Date", inplace=True)
    df.reset_index(drop=True, inplace=True)
    print(f"  Loaded {total} signals, kept {len(df)} BUY signals")
    return df


# --------------------------------------------------------------------------
# Single-Trade Simulation
# --------------------------------------------------------------------------

def simulate_trade(
    ohlcv_df: pd.DataFrame,
    entry_date: pd.Timestamp,
    entry_price: float,
    tp_pct: float,
    sl_pct: float,
    max_hold: int,
    conservative: bool = True,
) -> dict:
    """
    Simulate a single BUY trade through OHLCV candles.

    Parameters
    ----------
    ohlcv_df    : OHLCV DataFrame for the ticker (sorted by Date).
    entry_date  : Signal date (entry is at Entry_Price on this date).
    entry_price : Entry price from signal.
    tp_pct      : Take-profit percentage (e.g. 5 means +5%).
    sl_pct      : Stop-loss percentage (e.g. 3 means -3%).
    max_hold    : Maximum holding days before forced exit.
    conservative: If True, SL wins when both TP and SL are hit on same candle.

    Returns
    -------
    dict with keys: exit_price, exit_date, exit_reason, pnl_pct, holding_days
    """
    target_price = entry_price * (1 + tp_pct / 100)
    stop_price = entry_price * (1 - sl_pct / 100)

    # Find rows AFTER entry_date
    mask = ohlcv_df["Date"] > entry_date
    future = ohlcv_df.loc[mask]

    if future.empty:
        # No future data -- cannot simulate
        return {
            "exit_price": entry_price,
            "exit_date": entry_date,
            "exit_reason": "NO_DATA",
            "pnl_pct": 0.0,
            "holding_days": 0,
        }

    for i, (_, row) in enumerate(future.iterrows()):
        day = i + 1  # holding day count (1-based)
        high = row["High"]
        low = row["Low"]
        close = row["Close"]
        candle_date = row["Date"]

        tp_hit = high >= target_price
        sl_hit = low <= stop_price

        if tp_hit and sl_hit:
            # Same-candle conflict
            if conservative:
                # SL wins
                return {
                    "exit_price": stop_price,
                    "exit_date": candle_date,
                    "exit_reason": "SL",
                    "pnl_pct": -sl_pct,
                    "holding_days": day,
                }
            else:
                # TP wins (optimistic)
                return {
                    "exit_price": target_price,
                    "exit_date": candle_date,
                    "exit_reason": "TP",
                    "pnl_pct": tp_pct,
                    "holding_days": day,
                }
        elif tp_hit:
            return {
                "exit_price": target_price,
                "exit_date": candle_date,
                "exit_reason": "TP",
                "pnl_pct": tp_pct,
                "holding_days": day,
            }
        elif sl_hit:
            return {
                "exit_price": stop_price,
                "exit_date": candle_date,
                "exit_reason": "SL",
                "pnl_pct": -sl_pct,
                "holding_days": day,
            }

        # Max holding days reached -> force exit at close
        if day >= max_hold:
            pnl_pct = (close - entry_price) / entry_price * 100
            return {
                "exit_price": close,
                "exit_date": candle_date,
                "exit_reason": "TIMEOUT",
                "pnl_pct": pnl_pct,
                "holding_days": day,
            }

    # Exhausted all future candles without hitting TP/SL/timeout
    last = future.iloc[-1]
    pnl_pct = (last["Close"] - entry_price) / entry_price * 100
    return {
        "exit_price": last["Close"],
        "exit_date": last["Date"],
        "exit_reason": "END_OF_DATA",
        "pnl_pct": pnl_pct,
        "holding_days": len(future),
    }


# --------------------------------------------------------------------------
# Run Backtest for One TP/SL Combination
# --------------------------------------------------------------------------

def run_backtest(
    signals: pd.DataFrame,
    ohlcv: Dict[str, pd.DataFrame],
    tp_pct: float,
    sl_pct: float,
    capital_per_trade: float,
    max_hold: int,
    conservative: bool = True,
) -> Tuple[dict, List[dict]]:
    """
    Run backtest for a single TP/SL combination across all BUY signals.

    Returns
    -------
    summary : dict with aggregate stats
    trades  : list of per-trade dicts
    """
    trades: List[dict] = []

    for _, sig in signals.iterrows():
        ticker = sig["Ticker"]
        entry_date = sig["Date"]
        entry_price = sig["Entry_Price"]

        if ticker not in ohlcv:
            continue  # skip tickers without OHLCV data

        result = simulate_trade(
            ohlcv_df=ohlcv[ticker],
            entry_date=entry_date,
            entry_price=entry_price,
            tp_pct=tp_pct,
            sl_pct=sl_pct,
            max_hold=max_hold,
            conservative=conservative,
        )

        if result["exit_reason"] == "NO_DATA":
            continue  # skip un-simulable trades

        pnl_amount = result["pnl_pct"] / 100 * capital_per_trade

        trades.append({
            "Ticker": ticker,
            "Entry_Date": entry_date,
            "Entry_Price": entry_price,
            "Exit_Date": result["exit_date"],
            "Exit_Price": result["exit_price"],
            "Exit_Reason": result["exit_reason"],
            "PnL_Pct": round(result["pnl_pct"], 4),
            "PnL_Amount": round(pnl_amount, 2),
            "Holding_Days": result["holding_days"],
        })

    # Aggregate
    if not trades:
        return {
            "TP_Pct": tp_pct, "SL_Pct": sl_pct,
            "Total_Trades": 0, "Wins": 0, "Losses": 0,
            "Win_Rate_Pct": 0, "Total_Profit": 0,
            "Avg_PnL_Pct": 0, "Avg_Hold_Days": 0,
            "TP_Exits": 0, "SL_Exits": 0, "Timeout_Exits": 0,
        }, trades

    trades_df = pd.DataFrame(trades)
    wins = (trades_df["PnL_Amount"] > 0).sum()
    losses = (trades_df["PnL_Amount"] <= 0).sum()
    total = len(trades_df)

    summary = {
        "TP_Pct": tp_pct,
        "SL_Pct": sl_pct,
        "Total_Trades": total,
        "Wins": int(wins),
        "Losses": int(losses),
        "Win_Rate_Pct": round(wins / total * 100, 2),
        "Total_Profit": round(trades_df["PnL_Amount"].sum(), 2),
        "Avg_PnL_Pct": round(trades_df["PnL_Pct"].mean(), 4),
        "Avg_Hold_Days": round(trades_df["Holding_Days"].mean(), 1),
        "TP_Exits": int((trades_df["Exit_Reason"] == "TP").sum()),
        "SL_Exits": int((trades_df["Exit_Reason"] == "SL").sum()),
        "Timeout_Exits": int((trades_df["Exit_Reason"] == "TIMEOUT").sum()),
    }
    return summary, trades


# --------------------------------------------------------------------------
# Grid Search
# --------------------------------------------------------------------------

def grid_search(
    signals: pd.DataFrame,
    ohlcv: Dict[str, pd.DataFrame],
    tp_values: List[float],
    sl_values: List[float],
    capital_per_trade: float,
    max_hold: int,
    conservative: bool = True,
) -> Tuple[pd.DataFrame, dict, List[dict]]:
    """
    Run backtest for every TP x SL combination.

    Returns
    -------
    results_df   : DataFrame with one row per combination, sorted by profit
    best_summary : summary dict for the best combination
    best_trades  : per-trade list for the best combination
    """
    total_combos = len(tp_values) * len(sl_values)
    print(f"\n{'='*65}")
    print(f"  GRID SEARCH: {len(tp_values)} TP x {len(sl_values)} SL = {total_combos} combinations")
    print(f"{'='*65}\n")

    results: List[dict] = []
    best_profit = -float("inf")
    best_summary = {}
    best_trades: List[dict] = []
    done = 0

    for tp in tp_values:
        for sl in sl_values:
            done += 1
            summary, trades = run_backtest(
                signals, ohlcv, tp, sl,
                capital_per_trade, max_hold, conservative,
            )
            results.append(summary)

            if summary["Total_Profit"] > best_profit:
                best_profit = summary["Total_Profit"]
                best_summary = summary
                best_trades = trades

            # Progress
            bar_len = 30
            pct = done / total_combos
            filled = int(bar_len * pct)
            bar = "#" * filled + "-" * (bar_len - filled)
            sys.stdout.write(
                f"\r  [{bar}] {done}/{total_combos}  "
                f"TP={tp:>5}% SL={sl:>5}%  Profit=Rs.{summary['Total_Profit']:>10,.2f}"
            )
            sys.stdout.flush()

    print("\n")

    results_df = pd.DataFrame(results)
    results_df.sort_values("Total_Profit", ascending=False, inplace=True)
    results_df.reset_index(drop=True, inplace=True)

    return results_df, best_summary, best_trades


# --------------------------------------------------------------------------
# Display & Save
# --------------------------------------------------------------------------

def print_results_table(results_df: pd.DataFrame, top_n: int = 20):
    """Print top N combinations as a formatted table."""
    print(f"{'='*95}")
    print(f"  TOP {min(top_n, len(results_df))} TP/SL COMBINATIONS BY TOTAL PROFIT")
    print(f"{'='*95}")
    print(
        f"  {'Rank':<5} {'TP%':>5} {'SL%':>5} {'Trades':>7} {'Wins':>5} "
        f"{'WR%':>7} {'Profit':>14} {'Avg PnL%':>9} {'TP':>4} {'SL':>4} {'TO':>4} {'Avg Days':>9}"
    )
    print(f"  {'-'*89}")

    for i, row in results_df.head(top_n).iterrows():
        rank = i + 1
        print(
            f"  {rank:<5} {row['TP_Pct']:>5.0f} {row['SL_Pct']:>5.0f} {row['Total_Trades']:>7} "
            f"{row['Wins']:>5} {row['Win_Rate_Pct']:>6.1f}% Rs.{row['Total_Profit']:>12,.2f} "
            f"{row['Avg_PnL_Pct']:>8.2f}% {row['TP_Exits']:>4} {row['SL_Exits']:>4} "
            f"{row['Timeout_Exits']:>4} {row['Avg_Hold_Days']:>8.1f}"
        )

    print(f"  {'-'*89}\n")


def print_best_combo(summary: dict, capital_per_trade: float):
    """Print details of the best combination."""
    print(f"{'='*65}")
    print(f"  * BEST COMBINATION *")
    print(f"{'='*65}")
    print(f"  Take Profit  : {summary['TP_Pct']}%")
    print(f"  Stop Loss    : {summary['SL_Pct']}%")
    print(f"  Total Trades : {summary['Total_Trades']}")
    print(f"  Wins / Losses: {summary['Wins']} / {summary['Losses']}")
    print(f"  Win Rate     : {summary['Win_Rate_Pct']}%")
    print(f"  Total Profit : Rs.{summary['Total_Profit']:,.2f}")
    print(f"  Avg PnL%     : {summary['Avg_PnL_Pct']:.2f}%")
    print(f"  Avg Holding  : {summary['Avg_Hold_Days']} days")
    print(f"  Exit Breakdown: TP={summary['TP_Exits']}  SL={summary['SL_Exits']}  Timeout={summary['Timeout_Exits']}")
    print(f"  Capital/Trade: Rs.{capital_per_trade:,.0f}")
    print(f"{'='*65}\n")


def save_results(results_df: pd.DataFrame, best_trades: List[dict], output_dir: str):
    """Save grid results and best-combo trades to CSV."""
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    grid_file = out_path / "backtest_grid_results.csv"
    results_df.to_csv(grid_file, index=False)
    print(f"  Saved grid results      -> {grid_file}")

    if best_trades:
        trades_file = out_path / "best_combo_trades.csv"
        pd.DataFrame(best_trades).to_csv(trades_file, index=False)
        print(f"  Saved best-combo trades -> {trades_file}")


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Combinational TP/SL Backtest")
    parser.add_argument("--config", default="config.yaml", help="Path to config YAML")
    args = parser.parse_args()

    print("\n" + "=" * 65)
    print("  COMBINATIONAL TP/SL BACKTEST")
    print("=" * 65)

    # 1. Load config
    print("\n[1/4] Loading configuration...")
    cfg = load_config(args.config)
    capital_per_trade = cfg.get("capital_per_trade", 25000)
    max_hold = cfg.get("max_holding_days", 60)
    tp_values = cfg.get("tp_values", [5, 10, 15])
    sl_values = cfg.get("sl_values", [3, 5, 8])
    conservative = cfg.get("same_candle_logic", "conservative") == "conservative"
    output_dir = cfg.get("output_dir", "data/reports")
    print(f"  Capital/trade : Rs.{capital_per_trade:,}")
    print(f"  Max hold      : {max_hold} days")
    print(f"  TP range      : {tp_values}")
    print(f"  SL range      : {sl_values}")
    print(f"  Same-candle   : {'SL wins (conservative)' if conservative else 'TP wins (optimistic)'}")

    # 2. Load data
    print("\n[2/4] Loading data...")
    ohlcv = load_ohlcv(cfg.get("data_raw_dir", "data/raw"))
    signals = load_signals(cfg.get("signal_file", "data/results/signal_report.csv"))

    if signals.empty:
        print("\n  WARNING: No BUY signals found. Nothing to backtest.")
        sys.exit(0)

    # 3. Grid search
    print("\n[3/4] Running grid search...")
    t0 = time.time()
    results_df, best_summary, best_trades = grid_search(
        signals, ohlcv, tp_values, sl_values,
        capital_per_trade, max_hold, conservative,
    )
    elapsed = time.time() - t0
    print(f"  Completed in {elapsed:.1f}s\n")

    # 4. Report
    print("[4/4] Results\n")
    print_results_table(results_df)
    print_best_combo(best_summary, capital_per_trade)
    save_results(results_df, best_trades, output_dir)

    print("\n  Done.\n")


if __name__ == "__main__":
    main()
