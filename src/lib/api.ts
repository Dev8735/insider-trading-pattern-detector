import type {
  HealthResponse,
  StockListItem,
  FlaggedStock,
  StockHistoryResponse,
  StockSummary,
} from './types'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockStocks: StockListItem[] = [
  { ticker: 'RELIANCE', company: 'Reliance Industries Ltd', sector: 'Energy', exchange: 'NSE', riskTier: 'Critical', lastFlagged: '2026-06-12', latestScore: 91 },
  { ticker: 'INFY', company: 'Infosys Limited', sector: 'IT', exchange: 'NSE', riskTier: 'High', lastFlagged: '2026-06-10', latestScore: 78 },
  { ticker: 'HDFCBANK', company: 'HDFC Bank Limited', sector: 'Banking', exchange: 'NSE', riskTier: 'Medium', lastFlagged: '2026-06-08', latestScore: 62 },
  { ticker: 'TCS', company: 'Tata Consultancy Services', sector: 'IT', exchange: 'NSE', riskTier: 'Low', lastFlagged: '2026-05-30', latestScore: 38 },
  { ticker: 'WIPRO', company: 'Wipro Limited', sector: 'IT', exchange: 'NSE', riskTier: 'High', lastFlagged: '2026-06-11', latestScore: 74 },
  { ticker: 'AXISBANK', company: 'Axis Bank Limited', sector: 'Banking', exchange: 'NSE', riskTier: 'Critical', lastFlagged: '2026-06-13', latestScore: 88 },
  { ticker: 'TATAMOTORS', company: 'Tata Motors Limited', sector: 'Auto', exchange: 'NSE', riskTier: 'Medium', lastFlagged: '2026-06-05', latestScore: 55 },
  { ticker: 'SUNPHARMA', company: 'Sun Pharmaceutical Industries', sector: 'Pharma', exchange: 'BSE', riskTier: 'High', lastFlagged: '2026-06-09', latestScore: 71 },
  { ticker: 'HINDUNILVR', company: 'Hindustan Unilever Limited', sector: 'FMCG', exchange: 'NSE', riskTier: 'Low', lastFlagged: '2026-05-22', latestScore: 29 },
  { ticker: 'BAJFINANCE', company: 'Bajaj Finance Limited', sector: 'NBFC', exchange: 'NSE', riskTier: 'Critical', lastFlagged: '2026-06-14', latestScore: 93 },
  { ticker: 'MARUTI', company: 'Maruti Suzuki India Ltd', sector: 'Auto', exchange: 'BSE', riskTier: 'Medium', lastFlagged: '2026-06-03', latestScore: 57 },
  { ticker: 'ICICIBANK', company: 'ICICI Bank Limited', sector: 'Banking', exchange: 'NSE', riskTier: 'Clean', lastFlagged: null, latestScore: 18 },
  { ticker: 'DRREDDY', company: 'Dr. Reddy\'s Laboratories', sector: 'Pharma', exchange: 'BSE', riskTier: 'High', lastFlagged: '2026-06-07', latestScore: 76 },
  { ticker: 'ONGC', company: 'Oil & Natural Gas Corp', sector: 'Energy', exchange: 'NSE', riskTier: 'Medium', lastFlagged: '2026-06-01', latestScore: 49 },
  { ticker: 'POWERGRID', company: 'Power Grid Corporation', sector: 'Utilities', exchange: 'NSE', riskTier: 'Clean', lastFlagged: null, latestScore: 11 },
]

const mockFlags: FlaggedStock[] = [
  { ticker: 'BAJFINANCE', company: 'Bajaj Finance Limited', sector: 'NBFC', exchange: 'NSE', peakScore: 93, riskTier: 'Critical', flaggedDate: '14 Jun 2026', signalType: 'AVR + IF Anomaly', flaggedDays: 7 },
  { ticker: 'RELIANCE', company: 'Reliance Industries Ltd', sector: 'Energy', exchange: 'NSE', peakScore: 91, riskTier: 'Critical', flaggedDate: '12 Jun 2026', signalType: 'CAR + Event Proximity', flaggedDays: 5 },
  { ticker: 'AXISBANK', company: 'Axis Bank Limited', sector: 'Banking', exchange: 'NSE', peakScore: 88, riskTier: 'Critical', flaggedDate: '13 Jun 2026', signalType: 'AVR + CAR Spike', flaggedDays: 4 },
  { ticker: 'INFY', company: 'Infosys Limited', sector: 'IT', exchange: 'NSE', peakScore: 78, riskTier: 'High', flaggedDate: '10 Jun 2026', signalType: 'IF Anomaly', flaggedDays: 3 },
  { ticker: 'DRREDDY', company: 'Dr. Reddy\'s Laboratories', sector: 'Pharma', exchange: 'BSE', peakScore: 76, riskTier: 'High', flaggedDate: '07 Jun 2026', signalType: 'CAR Spike', flaggedDays: 2 },
  { ticker: 'WIPRO', company: 'Wipro Limited', sector: 'IT', exchange: 'NSE', peakScore: 74, riskTier: 'High', flaggedDate: '11 Jun 2026', signalType: 'AVR + Event Proximity', flaggedDays: 3 },
  { ticker: 'SUNPHARMA', company: 'Sun Pharmaceutical Industries', sector: 'Pharma', exchange: 'BSE', peakScore: 71, riskTier: 'High', flaggedDate: '09 Jun 2026', signalType: 'AVR Spike', flaggedDays: 2 },
  { ticker: 'HDFCBANK', company: 'HDFC Bank Limited', sector: 'Banking', exchange: 'NSE', peakScore: 62, riskTier: 'Medium', flaggedDate: '08 Jun 2026', signalType: 'CAR Divergence', flaggedDays: 1 },
  { ticker: 'MARUTI', company: 'Maruti Suzuki India Ltd', sector: 'Auto', exchange: 'BSE', peakScore: 57, riskTier: 'Medium', flaggedDate: '03 Jun 2026', signalType: 'IF Anomaly', flaggedDays: 1 },
  { ticker: 'TATAMOTORS', company: 'Tata Motors Limited', sector: 'Auto', exchange: 'NSE', peakScore: 55, riskTier: 'Medium', flaggedDate: '05 Jun 2026', signalType: 'AVR Spike', flaggedDays: 1 },
]

function buildDayRecords(baseSeed: number): import('./types').DayRecord[] {
  const records: import('./types').DayRecord[] = []
  const today = new Date('2026-06-14')
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const raw = baseSeed + Math.sin(i * 0.7) * 20 + Math.random() * 15
    const score = Math.min(100, Math.max(0, Math.round(raw)))
    records.push({
      date: d.toISOString().slice(0, 10),
      suspicionScore: score,
      avr: parseFloat((1 + Math.random() * 4).toFixed(2)),
      car: parseFloat((-5 + Math.random() * 15).toFixed(2)),
      ifAnomaly: score > 65,
      eventProximity: Math.floor(Math.random() * 14) + 1,
      flagged: score >= 60,
    })
  }
  return records
}

const mockHistories: Record<string, StockHistoryResponse> = {
  BAJFINANCE: { ticker: 'BAJFINANCE', company: 'Bajaj Finance Limited', records: buildDayRecords(75) },
  RELIANCE:   { ticker: 'RELIANCE',   company: 'Reliance Industries Ltd', records: buildDayRecords(70) },
  AXISBANK:   { ticker: 'AXISBANK',   company: 'Axis Bank Limited', records: buildDayRecords(68) },
  INFY:       { ticker: 'INFY',       company: 'Infosys Limited', records: buildDayRecords(58) },
  DRREDDY:    { ticker: 'DRREDDY',    company: "Dr. Reddy's Laboratories", records: buildDayRecords(55) },
  WIPRO:      { ticker: 'WIPRO',      company: 'Wipro Limited', records: buildDayRecords(54) },
  SUNPHARMA:  { ticker: 'SUNPHARMA',  company: 'Sun Pharmaceutical Industries', records: buildDayRecords(50) },
  HDFCBANK:   { ticker: 'HDFCBANK',   company: 'HDFC Bank Limited', records: buildDayRecords(42) },
  MARUTI:     { ticker: 'MARUTI',     company: 'Maruti Suzuki India Ltd', records: buildDayRecords(37) },
  TATAMOTORS: { ticker: 'TATAMOTORS', company: 'Tata Motors Limited', records: buildDayRecords(35) },
  TCS:        { ticker: 'TCS',        company: 'Tata Consultancy Services', records: buildDayRecords(20) },
  HINDUNILVR: { ticker: 'HINDUNILVR', company: 'Hindustan Unilever Limited', records: buildDayRecords(10) },
  ICICIBANK:  { ticker: 'ICICIBANK',  company: 'ICICI Bank Limited', records: buildDayRecords(8) },
  ONGC:       { ticker: 'ONGC',       company: 'Oil & Natural Gas Corp', records: buildDayRecords(30) },
  POWERGRID:  { ticker: 'POWERGRID',  company: 'Power Grid Corporation', records: buildDayRecords(5) },
}

// ─── Fetch functions ───────────────────────────────────────────────────────────

// Endpoint 1: GET /
export async function fetchHealth(): Promise<HealthResponse> {
  // TODO: swap for real fetch(`${BASE}/`)
  return { status: 'ok', timestamp: new Date().toISOString() }
}

// Endpoint 2: GET /stocks
export async function fetchStocks(): Promise<StockListItem[]> {
  // TODO: swap for real fetch(`${BASE}/stocks`)
  return mockStocks
}

// Endpoint 3: GET /flags
export async function fetchFlags(): Promise<FlaggedStock[]> {
  // TODO: swap for real fetch(`${BASE}/flags`)
  return mockFlags
}

// Endpoint 4: GET /stock/{ticker}
export async function fetchStockHistory(ticker: string): Promise<StockHistoryResponse> {
  // TODO: swap for real fetch(`${BASE}/stock/${ticker}`)
  const upper = ticker.toUpperCase()
  return (
    mockHistories[upper] ?? {
      ticker: upper,
      company: upper,
      records: buildDayRecords(40),
    }
  )
}

// Endpoint 5: GET /stock/{ticker}/summary
export async function fetchStockSummary(ticker: string): Promise<StockSummary> {
  // TODO: swap for real fetch(`${BASE}/stock/${ticker}/summary`)
  const upper = ticker.toUpperCase()
  const stock = mockStocks.find((s) => s.ticker === upper)
  const history = mockHistories[upper]
  const records = history?.records ?? []
  const peak = records.length ? Math.max(...records.map((r) => r.suspicionScore)) : 0
  const flaggedCount = records.filter((r) => r.flagged).length
  const lastFlagged = records.filter((r) => r.flagged).at(-1)?.date ?? null
  return {
    ticker: upper,
    company: stock?.company ?? upper,
    sector: stock?.sector ?? 'Unknown',
    exchange: stock?.exchange ?? 'NSE',
    latestScore: stock?.latestScore ?? records.at(-1)?.suspicionScore ?? 0,
    peakScore: peak,
    flaggedDays: flaggedCount,
    lastFlaggedDate: lastFlagged
      ? new Date(lastFlagged).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : null,
    riskTier: stock?.riskTier ?? 'Clean',
  }
}
