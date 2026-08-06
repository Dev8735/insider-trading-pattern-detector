import type {
  ApiResult,
  HealthResponse,
  StockListItem,
  FlaggedStock,
  StockHistoryResponse,
  StockSummary,
  DayRecord,
  QualitySignalsDefaults,
  QualitySignal,
  StockQualitySignal,
  SuitabilityRanking,
  BacktestResult,
  StockBacktestResult,
  RiskTier,
} from './types'

// Browser requests use the same-origin proxy to avoid CORS issues with the
// Cloudflare tunnel. Server-side requests go directly to the configured backend.
const BASE = typeof window !== 'undefined'
  ? '/api/backend'
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')

// Short timeout so pages degrade quickly to demo data if the backend is down.
const TIMEOUT_MS = 4000

async function getJSON<T>(path: string): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${BASE}${path}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`)
    return (await res.json()) as T
  } finally {
    clearTimeout(timer)
  }
}

// ─── Mock data (fallback when backend is offline) ────────────────────────────

const mockStocks: StockListItem[] = [
  { ticker: 'RELIANCE.NS', company: 'Reliance Industries Ltd', sector: 'Energy', exchange: 'NSE', riskTier: 'Critical', lastFlagged: '2026-06-12', latestScore: 91 },
  { ticker: 'INFY.NS', company: 'Infosys Limited', sector: 'IT', exchange: 'NSE', riskTier: 'High', lastFlagged: '2026-06-10', latestScore: 78 },
  { ticker: 'HDFCBANK.NS', company: 'HDFC Bank Limited', sector: 'Banking', exchange: 'NSE', riskTier: 'Medium', lastFlagged: '2026-06-08', latestScore: 62 },
  { ticker: 'TCS.NS', company: 'Tata Consultancy Services', sector: 'IT', exchange: 'NSE', riskTier: 'Low', lastFlagged: '2026-05-30', latestScore: 38 },
  { ticker: 'WIPRO.NS', company: 'Wipro Limited', sector: 'IT', exchange: 'NSE', riskTier: 'High', lastFlagged: '2026-06-11', latestScore: 74 },
  { ticker: 'AXISBANK.NS', company: 'Axis Bank Limited', sector: 'Banking', exchange: 'NSE', riskTier: 'Critical', lastFlagged: '2026-06-13', latestScore: 88 },
  { ticker: 'TATAMOTORS.NS', company: 'Tata Motors Limited', sector: 'Auto', exchange: 'NSE', riskTier: 'Medium', lastFlagged: '2026-06-05', latestScore: 55 },
  { ticker: 'SUNPHARMA.BO', company: 'Sun Pharmaceutical Industries', sector: 'Pharma', exchange: 'BSE', riskTier: 'High', lastFlagged: '2026-06-09', latestScore: 71 },
  { ticker: 'HINDUNILVR.NS', company: 'Hindustan Unilever Limited', sector: 'FMCG', exchange: 'NSE', riskTier: 'Low', lastFlagged: '2026-05-22', latestScore: 29 },
  { ticker: 'BAJFINANCE.NS', company: 'Bajaj Finance Limited', sector: 'NBFC', exchange: 'NSE', riskTier: 'Critical', lastFlagged: '2026-06-14', latestScore: 93 },
  { ticker: 'MARUTI.BO', company: 'Maruti Suzuki India Ltd', sector: 'Auto', exchange: 'BSE', riskTier: 'Medium', lastFlagged: '2026-06-03', latestScore: 57 },
  { ticker: 'ICICIBANK.NS', company: 'ICICI Bank Limited', sector: 'Banking', exchange: 'NSE', riskTier: 'Clean', lastFlagged: null, latestScore: 18 },
  { ticker: 'DRREDDY.BO', company: "Dr. Reddy's Laboratories", sector: 'Pharma', exchange: 'BSE', riskTier: 'High', lastFlagged: '2026-06-07', latestScore: 76 },
  { ticker: 'ONGC.NS', company: 'Oil & Natural Gas Corp', sector: 'Energy', exchange: 'NSE', riskTier: 'Medium', lastFlagged: '2026-06-01', latestScore: 49 },
  { ticker: 'POWERGRID.NS', company: 'Power Grid Corporation', sector: 'Utilities', exchange: 'NSE', riskTier: 'Clean', lastFlagged: null, latestScore: 11 },
]

const mockFlags: FlaggedStock[] = [
  { ticker: 'BAJFINANCE.NS', company: 'Bajaj Finance Limited', sector: 'NBFC', exchange: 'NSE', peakScore: 93, riskTier: 'Critical', flaggedDate: '14 Jun 2026', signalType: 'AVR + IF Anomaly', flaggedDays: 7 },
  { ticker: 'RELIANCE.NS', company: 'Reliance Industries Ltd', sector: 'Energy', exchange: 'NSE', peakScore: 91, riskTier: 'Critical', flaggedDate: '12 Jun 2026', signalType: 'CAR + Event Proximity', flaggedDays: 5 },
  { ticker: 'AXISBANK.NS', company: 'Axis Bank Limited', sector: 'Banking', exchange: 'NSE', peakScore: 88, riskTier: 'Critical', flaggedDate: '13 Jun 2026', signalType: 'AVR + CAR Spike', flaggedDays: 4 },
  { ticker: 'INFY.NS', company: 'Infosys Limited', sector: 'IT', exchange: 'NSE', peakScore: 78, riskTier: 'High', flaggedDate: '10 Jun 2026', signalType: 'IF Anomaly', flaggedDays: 3 },
  { ticker: 'DRREDDY.BO', company: "Dr. Reddy's Laboratories", sector: 'Pharma', exchange: 'BSE', peakScore: 76, riskTier: 'High', flaggedDate: '07 Jun 2026', signalType: 'CAR Spike', flaggedDays: 2 },
  { ticker: 'WIPRO.NS', company: 'Wipro Limited', sector: 'IT', exchange: 'NSE', peakScore: 74, riskTier: 'High', flaggedDate: '11 Jun 2026', signalType: 'AVR + Event Proximity', flaggedDays: 3 },
  { ticker: 'SUNPHARMA.BO', company: 'Sun Pharmaceutical Industries', sector: 'Pharma', exchange: 'BSE', peakScore: 71, riskTier: 'High', flaggedDate: '09 Jun 2026', signalType: 'AVR Spike', flaggedDays: 2 },
  { ticker: 'HDFCBANK.NS', company: 'HDFC Bank Limited', sector: 'Banking', exchange: 'NSE', peakScore: 62, riskTier: 'Medium', flaggedDate: '08 Jun 2026', signalType: 'CAR Divergence', flaggedDays: 1 },
  { ticker: 'MARUTI.BO', company: 'Maruti Suzuki India Ltd', sector: 'Auto', exchange: 'BSE', peakScore: 57, riskTier: 'Medium', flaggedDate: '03 Jun 2026', signalType: 'IF Anomaly', flaggedDays: 1 },
  { ticker: 'TATAMOTORS.NS', company: 'Tata Motors Limited', sector: 'Auto', exchange: 'NSE', peakScore: 55, riskTier: 'Medium', flaggedDate: '05 Jun 2026', signalType: 'AVR Spike', flaggedDays: 1 },
]

// Deterministic pseudo-random so SSR and client render match.
function seededRand(seed: number): () => number {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function buildDayRecords(baseSeed: number): DayRecord[] {
  const rand = seededRand(baseSeed * 7919 + 13)
  const records: DayRecord[] = []
  const today = new Date('2026-06-24')
  const signals = ['AVR Spike', 'CAR Spike', 'IF Anomaly', 'Event Proximity', 'AVR + CAR Spike']
  for (let i = 39; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    // skip weekends to feel like trading days
    if (d.getDay() === 0 || d.getDay() === 6) continue
    const raw = baseSeed + Math.sin(i * 0.7) * 18 + rand() * 14
    const score = Math.min(100, Math.max(0, Math.round(raw)))
    records.push({
      date: d.toISOString().slice(0, 10),
      suspicionScore: score,
      avr: parseFloat((1 + rand() * 4).toFixed(2)),
      car: parseFloat((-5 + rand() * 15).toFixed(2)),
      ifAnomaly: score > 65,
      eventProximity: Math.floor(rand() * 14) + 1,
      flagged: score >= 60,
      signalType: signals[Math.floor(rand() * signals.length)],
    })
  }
  return records
}

const mockHistories: Record<string, StockHistoryResponse> = Object.fromEntries(
  mockStocks.map((s) => [
    s.ticker,
    { ticker: s.ticker, company: s.company, records: buildDayRecords(s.latestScore) },
  ]),
)

function buildSummary(ticker: string): StockSummary {
  const upper = ticker.toUpperCase()
  const stock = mockStocks.find((s) => s.ticker === upper)
  const history = mockHistories[upper]
  const records = history?.records ?? buildDayRecords(40)
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
    lastFlaggedDate: lastFlagged,
    riskTier: stock?.riskTier ?? 'Clean',
  }
}

// ─── Live fetch functions (real backend, mock fallback) ──────────────────────

function riskTier(score: number): RiskTier {
  if (score >= 85) return 'Critical'
  if (score >= 70) return 'High'
  if (score >= 50) return 'Medium'
  if (score >= 30) return 'Low'
  return 'Clean'
}

function exchangeFor(ticker: string): 'NSE' | 'BSE' {
  return ticker.endsWith('.BO') ? 'BSE' : 'NSE'
}

function stockMetadata(ticker: string) {
  const mock = mockStocks.find((stock) => stock.ticker === ticker.toUpperCase())
  return {
    company: mock?.company ?? ticker.toUpperCase(),
    sector: mock?.sector ?? 'Equity',
    exchange: mock?.exchange ?? exchangeFor(ticker),
  }
}

// The live API currently returns compact payloads (tickers[] and flagged_stocks[])
// while the UI uses richer view models. Normalize them at this boundary so every
// page stays typed and the backend can evolve without duplicating mapping logic.
function normalizeStocks(payload: unknown): StockListItem[] {
  const tickers = Array.isArray(payload)
    ? payload
    : (payload as { tickers?: unknown[] })?.tickers ?? []
  return tickers.map((value) => {
    const ticker = String(typeof value === 'string' ? value : (value as { ticker?: string }).ticker ?? '')
    const metadata = stockMetadata(ticker)
    const mock = mockStocks.find((stock) => stock.ticker === ticker)
    return {
      ticker,
      ...metadata,
      riskTier: mock?.riskTier ?? 'Clean',
      lastFlagged: mock?.lastFlagged ?? null,
      latestScore: mock?.latestScore ?? 0,
    }
  })
}

function normalizeFlags(payload: unknown): FlaggedStock[] {
  const flags = Array.isArray(payload)
    ? payload
    : (payload as { flagged_stocks?: unknown[] })?.flagged_stocks ?? []
  return flags.map((value) => {
    const item = value as { ticker?: string; peak_score?: number; peak_date?: string; flagged_days?: number }
    const ticker = item.ticker ?? ''
    const metadata = stockMetadata(ticker)
    const mock = mockFlags.find((flag) => flag.ticker === ticker)
    return {
      ticker,
      ...metadata,
      peakScore: Number(item.peak_score ?? 0),
      riskTier: riskTier(Number(item.peak_score ?? 0)),
      flaggedDate: item.peak_date ?? mock?.flaggedDate ?? '',
      signalType: mock?.signalType ?? 'Suspicion score spike',
      flaggedDays: Number(item.flagged_days ?? 0),
    }
  })
}

// Endpoint 1: GET /  → { status: "ok", ... }
export async function checkHealth(): Promise<boolean> {
  try {
    const res = await getJSON<HealthResponse>('/')
    return res.status === 'ok'
  } catch {
    return false
  }
}

// Endpoint 2: GET /stocks → list of all tracked tickers
export async function getStocks(): Promise<ApiResult<StockListItem[]>> {
  try {
    const payload = await getJSON<unknown>('/stocks')
    return { data: normalizeStocks(payload), demo: false }
  } catch (err) {
    console.log('[v0] getStocks fell back to mock:', (err as Error).message)
    return { data: mockStocks, demo: true }
  }
}

// Endpoint 3: GET /flags → top suspicious stocks ranked by peak Suspicion_Score
export async function getFlags(): Promise<ApiResult<FlaggedStock[]>> {
  try {
    const payload = await getJSON<unknown>('/flags')
    return { data: normalizeFlags(payload), demo: false }
  } catch (err) {
    console.log('[v0] getFlags fell back to mock:', (err as Error).message)
    return { data: mockFlags, demo: true }
  }
}

// Endpoint 4: GET /stock/{ticker} → full day-by-day scored history
export async function getStockHistory(
  ticker: string,
): Promise<ApiResult<StockHistoryResponse>> {
  const upper = ticker.toUpperCase()
  try {
    const data = await getJSON<StockHistoryResponse>(`/stock/${encodeURIComponent(ticker)}`)
    return { data, demo: false }
  } catch (err) {
    console.log('[v0] getStockHistory fell back to mock:', (err as Error).message)
    const data =
      mockHistories[upper] ?? { ticker: upper, company: upper, records: buildDayRecords(40) }
    return { data, demo: true }
  }
}

// Endpoint 5: GET /stock/{ticker}/summary → compact summary
export async function getStockSummary(
  ticker: string,
): Promise<ApiResult<StockSummary>> {
  try {
    const payload = await getJSON<{
      ticker: string
      latest_date?: string
      latest_score?: number
      peak_score?: number
      total_flagged_days?: number
    }>(`/stock/${encodeURIComponent(ticker)}/summary`)
    const metadata = stockMetadata(payload.ticker ?? ticker)
    const data: StockSummary = {
      ticker: payload.ticker ?? ticker.toUpperCase(),
      ...metadata,
      latestScore: Number(payload.latest_score ?? 0),
      peakScore: Number(payload.peak_score ?? 0),
      flaggedDays: Number(payload.total_flagged_days ?? 0),
      lastFlaggedDate: payload.latest_date ?? null,
      riskTier: riskTier(Number(payload.peak_score ?? 0)),
    }
    return { data, demo: false }
  } catch (err) {
    console.log('[v0] getStockSummary fell back to mock:', (err as Error).message)
    return { data: buildSummary(ticker), demo: true }
  }
}

// Endpoint 6: GET /quality-signals/config/defaults → default slider values
export async function getQualitySignalsDefaults(): Promise<ApiResult<QualitySignalsDefaults>> {
  try {
    const data = await getJSON<QualitySignalsDefaults>('/quality-signals/config/defaults')
    return { data, demo: false }
  } catch (err) {
    console.log('[v0] getQualitySignalsDefaults fell back to mock:', (err as Error).message)
    return {
      data: {
        min_window_score: 60,
        min_forward_return_pct: 15,
        min_signals_in_window: 3,
        avr_threshold: 2.5,
      },
      demo: true,
    }
  }
}

// Endpoint 7: GET /quality-signals → all stocks with quality signals (configurable)
export async function getQualitySignals(
  params?: Partial<QualitySignalsDefaults>,
): Promise<ApiResult<QualitySignal[]>> {
  try {
    const query = params ? new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString() : ''
    const data = await getJSON<QualitySignal[]>(`/quality-signals${query ? `?${query}` : ''}`)
    return { data, demo: false }
  } catch (err) {
    console.log('[v0] getQualitySignals fell back to mock:', (err as Error).message)
    return { data: [], demo: true }
  }
}

// Endpoint 8: GET /quality-signals/{ticker} → one stock quality signals
export async function getStockQualitySignal(ticker: string): Promise<ApiResult<StockQualitySignal>> {
  try {
    const data = await getJSON<StockQualitySignal>(
      `/quality-signals/${encodeURIComponent(ticker)}`,
    )
    return { data, demo: false }
  } catch (err) {
    console.log('[v0] getStockQualitySignal fell back to mock:', (err as Error).message)
    return {
      data: {
        ticker: ticker.toUpperCase(),
        company: ticker,
        sector: 'Unknown',
        window_score: 0,
        forward_return_pct: 0,
        signals_in_window: 0,
        avr_avg: 0,
        suitable: false,
        quality_tier: 'Poor',
      },
      demo: true,
    }
  }
}

// Endpoint 9: GET /quality-signals/suitability → all stocks ranked by suitability
export async function getSuitabilityRanking(): Promise<ApiResult<SuitabilityRanking[]>> {
  try {
    const data = await getJSON<SuitabilityRanking[]>('/quality-signals/suitability')
    return { data, demo: false }
  } catch (err) {
    console.log('[v0] getSuitabilityRanking fell back to mock:', (err as Error).message)
    return { data: [], demo: true }
  }
}

// Endpoint 10: GET /backtest → forward return analysis all stocks
export async function getBacktestResults(): Promise<ApiResult<BacktestResult[]>> {
  try {
    const data = await getJSON<BacktestResult[]>('/backtest')
    return { data, demo: false }
  } catch (err) {
    console.log('[v0] getBacktestResults fell back to mock:', (err as Error).message)
    return { data: [], demo: true }
  }
}

// Endpoint 11: GET /backtest/{ticker} → forward return for one stock
export async function getStockBacktest(ticker: string): Promise<ApiResult<StockBacktestResult>> {
  try {
    const data = await getJSON<StockBacktestResult>(`/backtest/${encodeURIComponent(ticker)}`)
    return { data, demo: false }
  } catch (err) {
    console.log('[v0] getStockBacktest fell back to mock:', (err as Error).message)
    return {
      data: {
        ticker: ticker.toUpperCase(),
        company: ticker,
        avg_forward_return_pct: 0,
        max_forward_return_pct: 0,
        min_forward_return_pct: 0,
        win_rate_pct: 0,
        sample_size: 0,
      },
      demo: true,
    }
  }
}
