# backend/quality_signals_api.py
# ─────────────────────────────────────────────────────────────────────────────
# PURPOSE : FastAPI router exposing quality_signals.py's 3-stage detection
#           pipeline (suitability -> event windows -> forward-return
#           validation) as HTTP endpoints, with the detection thresholds
#           exposed as query parameters instead of hardcoded constants.
#
# ENDPOINTS:
#   GET /quality-signals/config/defaults   -> the stock default threshold values
#   GET /quality-signals                   -> confirmed events for ALL stocks
#   GET /quality-signals/{ticker}          -> confirmed events for ONE stock
#   GET /quality-signals/suitability       -> stock suitability ranking
#
# HOW THIS WRAPS quality_signals.py:
#   quality_signals.py's detect_event_windows() / validate_with_forward_returns()
#   read their thresholds from module-level constants (MIN_WINDOW_SCORE,
#   MIN_FORWARD_RETURN_PCT, etc.) rather than accepting them as function
#   arguments. Rather than rewrite that file's signatures (risking its own
#   CLI usage and existing tests), this router temporarily overrides those
#   module attributes for the duration of a single request, then restores
#   the originals in a `finally` block. This process runs one request at a
#   time (dev / single-worker use) — if this API is ever run with multiple
#   uvicorn workers or concurrent async requests, this patching approach is
#   NOT thread-safe and would need a real refactor of quality_signals.py to
#   take thresholds as explicit function parameters instead.
#
# HOW TO ADD TO api.py (already done in api.py, shown here for reference):
#   from backend.quality_signals_api import router as quality_router
#   app.include_router(quality_router)
#   -> endpoints become: GET /quality-signals, /quality-signals/{ticker},
#      /quality-signals/suitability, /quality-signals/config/defaults
# ─────────────────────────────────────────────────────────────────────────────

import os
from contextlib import contextmanager

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query

from backend import quality_signals as qs

router = APIRouter(prefix="/quality-signals", tags=["Quality Signals"])


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 1 — THRESHOLD OVERRIDE HELPER
# ══════════════════════════════════════════════════════════════════════════════

# Names of the quality_signals.py module constants that are safe to expose
# as tunable query parameters (mirrors exactly what the frontend spec asks
# for: min_window_score, min_forward_return_pct, min_signals_in_window,
# avr_threshold).
_OVERRIDABLE = [
    "MIN_SIGNALS_IN_WINDOW",
    "MIN_WINDOW_SCORE",
    "MIN_FORWARD_RETURN_PCT",
    "AVR_THRESHOLD",
]


@contextmanager
def _thresholds(overrides: dict):
    """
    Temporarily applies `overrides` (a dict of {CONST_NAME: value}, skipping
    any None values) onto the quality_signals module, yields, then restores
    the original values — even if the wrapped code raises.
    """
    originals = {name: getattr(qs, name) for name in _OVERRIDABLE}
    try:
        for name, value in overrides.items():
            if value is not None:
                setattr(qs, name, value)
        yield
    finally:
        for name, value in originals.items():
            setattr(qs, name, value)


def _defaults() -> dict:
    """Returns the CURRENT threshold values (live off the qs module) as a
    plain dict. Only meaningful to call this while inside a `_thresholds()`
    block if you want the values actually in effect for that request —
    once the block exits, this reverts to reporting the stock defaults."""
    return {
        "min_signals_in_window": qs.MIN_SIGNALS_IN_WINDOW,
        "min_window_score": qs.MIN_WINDOW_SCORE,
        "min_forward_return_pct": qs.MIN_FORWARD_RETURN_PCT,
        "avr_threshold": qs.AVR_THRESHOLD,
        "window_gap": qs.WINDOW_GAP,
        "car_threshold": qs.CAR_THRESHOLD,
        "return_z_threshold": qs.RETURN_Z_THRESHOLD,
        "min_avg_volume": qs.MIN_AVG_VOLUME,
        "max_avg_volume": qs.MAX_AVG_VOLUME,
        "min_volatility": qs.MIN_VOLATILITY,
        "max_volatility": qs.MAX_VOLATILITY,
    }


# Shared query-parameter declarations so all three detection endpoints
# accept the identical set of overrides with identical docs.
def _threshold_params(
    min_window_score: float | None = Query(
        None, description="Minimum combined window score to count as a candidate event."
    ),
    min_forward_return_pct: float | None = Query(
        None, description="Minimum |forward return| (%) at 3M or 6M required to confirm a window."
    ),
    min_signals_in_window: int | None = Query(
        None, description="Minimum number of signals that must fire together to open a window."
    ),
    avr_threshold: float | None = Query(
        None, description="Volume ratio (AVR) above which the volume signal is considered elevated."
    ),
) -> dict:
    return {
        "MIN_WINDOW_SCORE": min_window_score,
        "MIN_FORWARD_RETURN_PCT": min_forward_return_pct,
        "MIN_SIGNALS_IN_WINDOW": min_signals_in_window,
        "AVR_THRESHOLD": avr_threshold,
    }


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 2 — ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/config/defaults")
def get_config_defaults():
    """
    Returns the stock threshold values quality_signals.py ships with, so the
    frontend can pre-fill settings-panel sliders before the user touches them.
    """
    return _defaults()


@router.get("/suitability")
def get_suitability_ranking():
    """
    Ranks every scorable stock by how well-suited it is for insider-trading
    pattern detection (liquidity + volatility sweet spot), highest first.
    Uses score_stock_suitability() directly — no window/forward-return
    thresholds apply here, so this endpoint takes no query overrides.
    """
    results = []
    for ticker in _get_all_ticker_names():
        df = _load_scored(ticker)
        if df is None:
            continue
        results.append(qs.score_stock_suitability(df, ticker))

    results.sort(key=lambda r: r.get("suitability_score", 0), reverse=True)
    return {"stocks": results}


@router.get("")
def get_all_quality_signals(overrides: dict = Depends(_threshold_params)):
    """
    Runs the full 3-stage quality-signal detection pipeline for every
    scorable stock, using either the stock defaults or the thresholds
    supplied as query params (e.g. ?min_window_score=60&avr_threshold=2.5).
    """
    with _thresholds(overrides):
        thresholds_used = _defaults()
        results = []
        for ticker in _get_all_ticker_names():
            result = qs.run_quality_detection(ticker)
            if result is not None:
                results.append(result)

    results.sort(key=lambda r: r["n_confirmed"], reverse=True)
    return {
        "thresholds_used": thresholds_used,
        "stock_count": len(results),
        "results": results,
    }


@router.get("/{ticker}")
def get_quality_signals_for_stock(ticker: str, overrides: dict = Depends(_threshold_params)):
    """
    Runs the full 3-stage quality-signal detection pipeline for ONE stock,
    using either the stock defaults or the thresholds supplied as query
    params (e.g. /quality-signals/CGPOWER?min_signals_in_window=3).
    404s if the ticker has no scored CSV on disk.
    """
    with _thresholds(overrides):
        thresholds_used = _defaults()
        result = qs.run_quality_detection(ticker)

    if result is None:
        raise HTTPException(status_code=404, detail=f"No scored data found for ticker '{ticker}'")

    result["thresholds_used"] = thresholds_used
    return result


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 3 — SMALL HELPERS (mirrors api.py's own helpers, kept local so this
# router has no dependency on api.py and can't create a circular import)
# ══════════════════════════════════════════════════════════════════════════════

def _get_all_ticker_names() -> list[str]:
    if not os.path.exists(qs.PROCESSED_DIR):
        return []
    return sorted(
        f.replace("_features.csv", "")
        for f in os.listdir(qs.PROCESSED_DIR)
        if f.endswith("_features.csv")
    )


def _load_scored(ticker: str) -> pd.DataFrame | None:
    filepath = os.path.join(qs.PROCESSED_DIR, f"{ticker}_features.csv")
    if not os.path.exists(filepath):
        return None
    df = pd.read_csv(filepath, parse_dates=[qs.COL_DATE])
    return df.sort_values(qs.COL_DATE).reset_index(drop=True)
