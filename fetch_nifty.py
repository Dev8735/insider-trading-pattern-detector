import yfinance as yf
import pandas as pd
from pathlib import Path

# Output directory (relative to current working directory)
out_dir = Path("data/benchmark")
out_dir.mkdir(parents=True, exist_ok=True)

# Download with auto_adjust=False to get separate Adj Close
df = yf.download(
    '^NSEI',
    start='2016-07-07',
    end='2026-07-06',
    auto_adjust=False      # ensures Adj Close appears
)

if df.empty:
    print("❌ No data retrieved. Check ticker or network.")
    exit(1)

# Flatten MultiIndex columns (if any) – keep first level only
if isinstance(df.columns, pd.MultiIndex):
    df.columns = df.columns.get_level_values(0)

# Define desired columns in order
desired = ['Adj Close', 'High', 'Low', 'Close', 'Volume']
# Keep only those that exist
existing = [col for col in desired if col in df.columns]

if not existing:
    print("❌ None of the required columns found. Available:", df.columns.tolist())
    exit(1)

# If 'Adj Close' is missing, we use 'Close' as fallback and rename it
if 'Adj Close' not in df.columns and 'Close' in df.columns:
    df['Adj Close'] = df['Close']  # or you can leave it as is

# Save only the columns we need (in the requested order)
df_to_save = df[existing] if 'Adj Close' in existing else df[['Close','High','Low','Volume']]
# If we added 'Adj Close', include it
if 'Adj Close' not in existing and 'Adj Close' in df.columns:
    existing = ['Adj Close'] + [c for c in ['High','Low','Close','Volume'] if c in df.columns]
    df_to_save = df[existing]

df_to_save.to_csv(out_dir / 'NIFTY50.csv')
print(f"✅ Data saved to {out_dir / 'NIFTY50.csv'}")
print("Columns saved:", df_to_save.columns.tolist())