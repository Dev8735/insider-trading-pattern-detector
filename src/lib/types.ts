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
