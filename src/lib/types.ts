// TypeScript interfaces matching each endpoint's response shape

// Endpoint 1: GET / → health check
export interface HealthResponse {
  status: 'ok' | 'error'
  message?: string
  timestamp?: string
}

// Endpoint 2: GET /stocks → list of tracked tickers
export interface StockListItem {
  ticker: string
  company: string
  sector: string
  exchange: 'NSE' | 'BSE'
  riskTier: RiskTier
  lastFlagged: string | null  // ISO date string e.g. "2026-06-12"
  latestScore: number
}

// Endpoint 3: GET /flags → top suspicious stocks ranked by peak Suspicion_Score
export interface FlaggedStock {
  ticker: string
  company: string
  sector: string
  exchange: 'NSE' | 'BSE'
  peakScore: number
  riskTier: RiskTier
  flaggedDate: string        // e.g. "12 Jun 2026"
  signalType: string         // e.g. "AVR + CAR Spike"
  flaggedDays: number
}

// Endpoint 4: GET /stock/{ticker} → day-by-day scored history
export interface DayRecord {
  date: string               // e.g. "2026-06-10"
  suspicionScore: number
  avr: number                // Abnormal Volume Ratio
  car: number                // Cumulative Abnormal Return (%)
  ifAnomaly: boolean         // Informed Flow anomaly flag
  eventProximity: number     // days to nearest corporate event
  flagged: boolean           // score crossed threshold
  signalType?: string        // dominant signal that day, e.g. "AVR + CAR Spike"
}

export interface StockHistoryResponse {
  ticker: string
  company: string
  records: DayRecord[]
}

// Endpoint 5: GET /stock/{ticker}/summary → compact summary
export interface StockSummary {
  ticker: string
  company: string
  sector: string
  exchange: 'NSE' | 'BSE'
  latestScore: number
  peakScore: number
  flaggedDays: number
  lastFlaggedDate: string | null  // e.g. "12 Jun 2026"
  riskTier: RiskTier
}

// Endpoint 6: GET /quality-signals/config/defaults → default slider values
export interface QualitySignalsDefaults {
  min_window_score: number       // e.g. 60
  min_forward_return_pct: number // e.g. 15
  min_signals_in_window: number  // e.g. 3
  avr_threshold: number          // e.g. 2.5
}

// Endpoint 7: GET /quality-signals → all stocks with quality signals
export interface QualitySignal {
  ticker: string
  company: string
  sector: string
  window_score: number
  forward_return_pct: number
  signals_in_window: number
  avr_avg: number
  suitable: boolean
  quality_tier: 'High' | 'Medium' | 'Low' | 'Poor'
}

// Endpoint 8: GET /quality-signals/{ticker} → one stock quality signals
export interface StockQualitySignal extends QualitySignal {
  detailed_analysis?: string
}

// Endpoint 9: GET /quality-signals/suitability → all stocks ranked by suitability
export interface SuitabilityRanking {
  ticker: string
  company: string
  sector: string
  suitability_score: number      // 0-100 composite score
  quality_tier: 'High' | 'Medium' | 'Low' | 'Poor'
  window_score: number
  forward_return_pct: number
  recommended: boolean           // true if meets all criteria
}

// Endpoint 10: GET /backtest → forward return analysis all stocks
export interface BacktestResult {
  ticker: string
  company: string
  avg_forward_return_pct: number
  max_forward_return_pct: number
  min_forward_return_pct: number
  win_rate_pct: number
  sample_size: number
}

// Endpoint 11: GET /backtest/{ticker} → forward return for one stock
export interface StockBacktestResult extends BacktestResult {
  return_distribution?: number[]  // optional distribution histogram
}

// Shared types
export type RiskTier = 'Critical' | 'High' | 'Medium' | 'Low' | 'Clean'

// Wrapper returned by every lib/api.ts function so the UI can show a
// "Demo data — backend offline" badge when the live fetch fails.
export interface ApiResult<T> {
  data: T
  demo: boolean // true when we fell back to local mock data
}

// Aggregated cross-stock flagged event (Historical Log page).
// NOTE: assembled client-side from multiple getStockHistory() calls —
// see comment in lib/api.ts / app/history. Person A may add a dedicated
// /history endpoint later.
export interface HistoricalEvent {
  date: string // ISO date
  ticker: string
  company: string
  score: number
  riskTier: RiskTier
  signalType: string
}
