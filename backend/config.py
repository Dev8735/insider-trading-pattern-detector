# config.py
# Central configuration for the entire backend pipeline

TICKERS = [
    'RELIANCE.NS', 'INFY.NS', 'TCS.NS', 'HDFCBANK.NS',
    'WIPRO.NS', 'TATAMOTORS.NS', 'ADANIENT.NS',
    'ZOMATO.NS', 'BAJFINANCE.NS', 'SUNPHARMA.NS',
]

BENCHMARK_TICKER = '^NSEI'       # Nifty 50
DATA_PERIOD      = '6mo'         # how far back to pull
RAW_DIR          = 'data/raw'
PROCESSED_DIR    = 'data/processed'
BSE_DIR          = 'data/bse_disclosures'

# Detection thresholds
AVR_THRESHOLD        = 2.5   # Abnormal Volume Ratio cutoff
CAR_THRESHOLD        = 0.08  # Cumulative Abnormal Return cutoff (8%)
ZSCORE_THRESHOLD     = 2.5   # Z-score cutoff
IF_CONTAMINATION     = 0.05  # Isolation Forest contamination rate
SUSPICION_THRESHOLD  = 65    # Minimum score to flag a stock (out of 100)
EVENT_WINDOW_DAYS    = 10    # Days before event to analyse
