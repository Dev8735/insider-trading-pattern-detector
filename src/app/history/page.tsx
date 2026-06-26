'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  makeStyles,
  tokens,
  Title1,
  Caption1,
  Body1Strong,
  Input,
  Dropdown,
  Option,
  Button,
  Skeleton,
  SkeletonItem,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  TableCellLayout,
  mergeClasses,
} from '@fluentui/react-components'
import {
  SearchRegular,
  ArrowDownloadRegular,
  ArrowSortDownRegular,
  ArrowSortUpRegular,
  ArrowSortRegular,
  ClockRegular,
} from '@fluentui/react-icons'
import { AppShell } from '@/components/NavRail'
import { RiskBadge } from '@/components/RiskBadge'
import { fetchStocks, fetchFlags } from '@/lib/api'
import type { RiskTier } from '@/lib/types'

// Flat historical log entry — derived from flags + stocks mock data
interface HistoryEntry {
  id: string
  date: string          // ISO
  ticker: string
  company: string
  score: number
  riskTier: RiskTier
  signalType: string
  sector: string
}

const useStyles = makeStyles({
  page: {
    minHeight: '100vh',
    backgroundColor: tokens.colorNeutralBackground2,
    paddingBottom: tokens.spacingVerticalXXXL,
  },
  inner: {
    maxWidth: '1280px',
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingLeft: tokens.spacingHorizontalXL,
    paddingRight: tokens.spacingHorizontalXL,
    paddingTop: tokens.spacingVerticalXL,
    '@media (max-width: 480px)': {
      paddingLeft: tokens.spacingHorizontalM,
      paddingRight: tokens.spacingHorizontalM,
      paddingTop: tokens.spacingVerticalM,
    },
  },
  pageHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalXXL,
  },
  titleBlock: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXS },
  subtitle: { color: tokens.colorNeutralForeground3 },

  filterBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalL,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusLarge,
    borderWidth: tokens.strokeWidthThin,
    borderStyle: 'solid',
    borderColor: tokens.colorNeutralStroke2,
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    '@media (max-width: 480px)': {
      paddingLeft: tokens.spacingHorizontalM,
      paddingRight: tokens.spacingHorizontalM,
    },
  },
  searchInput: { minWidth: '180px', flex: '1 1 180px' },
  filterDropdown: { minWidth: '140px', flex: '0 0 auto' },
  exportBtn: { marginLeft: 'auto' },

  resultsRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalS,
  },

  tableSection: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusLarge,
    borderWidth: tokens.strokeWidthThin,
    borderStyle: 'solid',
    borderColor: tokens.colorNeutralStroke2,
    overflow: 'hidden',
  },
  tableWrap: { overflowX: 'auto' },
  tableRow: {
    cursor: 'pointer',
    ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover },
    transition: `background ${tokens.durationFast}`,
  },
  headerCell: { cursor: 'pointer', userSelect: 'none' },
  headerInner: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  mobileHide: {
    '@media (max-width: 600px)': { display: 'none' },
  },
  score: {
    fontVariantNumeric: 'tabular-nums',
    fontWeight: tokens.fontWeightSemibold,
  },
  scoreHigh: { color: tokens.colorPaletteRedForeground2 },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingVerticalM,
    paddingTop: tokens.spacingVerticalXXXL,
    paddingBottom: tokens.spacingVerticalXXXL,
    color: tokens.colorNeutralForeground3,
  },
  paginationRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM,
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    borderTopWidth: tokens.strokeWidthThin,
    borderTopStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke2,
  },
})

const RISK_TIERS = ['All Tiers', 'Critical', 'High', 'Medium', 'Low', 'Clean']
const DATE_RANGES = ['Any Time', 'Last 7 days', 'Last 30 days', 'Last 90 days']
const PAGE_SIZE = 20

type SortKey = 'date' | 'ticker' | 'score'
type SortDir = 'asc' | 'desc'

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowSortRegular fontSize={14} />
  return dir === 'desc' ? <ArrowSortDownRegular fontSize={14} /> : <ArrowSortUpRegular fontSize={14} />
}

function daysAgo(dateStr: string, days: number): boolean {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return new Date(dateStr) >= cutoff
}

function exportCsv(rows: HistoryEntry[]) {
  const header = 'Date,Ticker,Company,Score,Risk Tier,Signal Type,Sector'
  const lines = rows.map((r) =>
    [r.date, r.ticker, `"${r.company}"`, r.score, r.riskTier, `"${r.signalType}"`, r.sector].join(',')
  )
  const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'tradewatch-history.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// Build a rich flat log by expanding each flagged stock over multiple dates
function buildHistoryLog(): HistoryEntry[] {
  // TODO: replace with real API calls to /flags and per-stock /stock/{ticker} history
  const entries: HistoryEntry[] = [
    { id: 'h1', date: '2026-06-14', ticker: 'BAJFINANCE', company: 'Bajaj Finance Limited', score: 93, riskTier: 'Critical', signalType: 'AVR + IF Anomaly', sector: 'NBFC' },
    { id: 'h2', date: '2026-06-13', ticker: 'BAJFINANCE', company: 'Bajaj Finance Limited', score: 88, riskTier: 'Critical', signalType: 'AVR Spike', sector: 'NBFC' },
    { id: 'h3', date: '2026-06-13', ticker: 'AXISBANK', company: 'Axis Bank Limited', score: 88, riskTier: 'Critical', signalType: 'AVR + CAR Spike', sector: 'Banking' },
    { id: 'h4', date: '2026-06-12', ticker: 'RELIANCE', company: 'Reliance Industries Ltd', score: 91, riskTier: 'Critical', signalType: 'CAR + Event Proximity', sector: 'Energy' },
    { id: 'h5', date: '2026-06-12', ticker: 'BAJFINANCE', company: 'Bajaj Finance Limited', score: 81, riskTier: 'Critical', signalType: 'IF Anomaly', sector: 'NBFC' },
    { id: 'h6', date: '2026-06-12', ticker: 'AXISBANK', company: 'Axis Bank Limited', score: 77, riskTier: 'High', signalType: 'CAR Spike', sector: 'Banking' },
    { id: 'h7', date: '2026-06-11', ticker: 'WIPRO', company: 'Wipro Limited', score: 74, riskTier: 'High', signalType: 'AVR + Event Proximity', sector: 'IT' },
    { id: 'h8', date: '2026-06-11', ticker: 'RELIANCE', company: 'Reliance Industries Ltd', score: 83, riskTier: 'Critical', signalType: 'IF Anomaly', sector: 'Energy' },
    { id: 'h9', date: '2026-06-10', ticker: 'INFY', company: 'Infosys Limited', score: 78, riskTier: 'High', signalType: 'IF Anomaly', sector: 'IT' },
    { id: 'h10', date: '2026-06-10', ticker: 'AXISBANK', company: 'Axis Bank Limited', score: 71, riskTier: 'High', signalType: 'AVR Spike', sector: 'Banking' },
    { id: 'h11', date: '2026-06-09', ticker: 'SUNPHARMA', company: 'Sun Pharmaceutical Industries', score: 71, riskTier: 'High', signalType: 'AVR Spike', sector: 'Pharma' },
    { id: 'h12', date: '2026-06-09', ticker: 'WIPRO', company: 'Wipro Limited', score: 68, riskTier: 'High', signalType: 'CAR Divergence', sector: 'IT' },
    { id: 'h13', date: '2026-06-08', ticker: 'HDFCBANK', company: 'HDFC Bank Limited', score: 62, riskTier: 'Medium', signalType: 'CAR Divergence', sector: 'Banking' },
    { id: 'h14', date: '2026-06-08', ticker: 'RELIANCE', company: 'Reliance Industries Ltd', score: 74, riskTier: 'High', signalType: 'AVR Spike', sector: 'Energy' },
    { id: 'h15', date: '2026-06-07', ticker: 'DRREDDY', company: "Dr. Reddy's Laboratories", score: 76, riskTier: 'High', signalType: 'CAR Spike', sector: 'Pharma' },
    { id: 'h16', date: '2026-06-06', ticker: 'INFY', company: 'Infosys Limited', score: 65, riskTier: 'High', signalType: 'AVR Spike', sector: 'IT' },
    { id: 'h17', date: '2026-06-05', ticker: 'TATAMOTORS', company: 'Tata Motors Limited', score: 55, riskTier: 'Medium', signalType: 'AVR Spike', sector: 'Auto' },
    { id: 'h18', date: '2026-06-05', ticker: 'DRREDDY', company: "Dr. Reddy's Laboratories", score: 69, riskTier: 'High', signalType: 'IF Anomaly', sector: 'Pharma' },
    { id: 'h19', date: '2026-06-04', ticker: 'SUNPHARMA', company: 'Sun Pharmaceutical Industries', score: 63, riskTier: 'Medium', signalType: 'CAR Divergence', sector: 'Pharma' },
    { id: 'h20', date: '2026-06-03', ticker: 'MARUTI', company: 'Maruti Suzuki India Ltd', score: 57, riskTier: 'Medium', signalType: 'IF Anomaly', sector: 'Auto' },
    { id: 'h21', date: '2026-06-02', ticker: 'WIPRO', company: 'Wipro Limited', score: 61, riskTier: 'Medium', signalType: 'AVR Spike', sector: 'IT' },
    { id: 'h22', date: '2026-06-01', ticker: 'ONGC', company: 'Oil & Natural Gas Corp', score: 49, riskTier: 'Medium', signalType: 'CAR Spike', sector: 'Energy' },
    { id: 'h23', date: '2026-05-30', ticker: 'TCS', company: 'Tata Consultancy Services', score: 38, riskTier: 'Low', signalType: 'AVR Spike', sector: 'IT' },
    { id: 'h24', date: '2026-05-28', ticker: 'HDFCBANK', company: 'HDFC Bank Limited', score: 55, riskTier: 'Medium', signalType: 'IF Anomaly', sector: 'Banking' },
    { id: 'h25', date: '2026-05-25', ticker: 'BAJFINANCE', company: 'Bajaj Finance Limited', score: 72, riskTier: 'High', signalType: 'CAR + IF Anomaly', sector: 'NBFC' },
    { id: 'h26', date: '2026-05-22', ticker: 'HINDUNILVR', company: 'Hindustan Unilever Limited', score: 29, riskTier: 'Low', signalType: 'AVR Spike', sector: 'FMCG' },
    { id: 'h27', date: '2026-05-20', ticker: 'RELIANCE', company: 'Reliance Industries Ltd', score: 66, riskTier: 'High', signalType: 'Event Proximity', sector: 'Energy' },
    { id: 'h28', date: '2026-05-18', ticker: 'AXISBANK', company: 'Axis Bank Limited', score: 73, riskTier: 'High', signalType: 'AVR + CAR Spike', sector: 'Banking' },
    { id: 'h29', date: '2026-05-15', ticker: 'INFY', company: 'Infosys Limited', score: 60, riskTier: 'Medium', signalType: 'CAR Divergence', sector: 'IT' },
    { id: 'h30', date: '2026-05-10', ticker: 'DRREDDY', company: "Dr. Reddy's Laboratories", score: 64, riskTier: 'High', signalType: 'AVR Spike', sector: 'Pharma' },
  ]
  return entries
}

export default function HistoryPage() {
  const styles = useStyles()
  const router = useRouter()

  const [allEntries, setAllEntries] = React.useState<HistoryEntry[]>([])
  const [loading, setLoading] = React.useState(true)
  const [apiConnected, setApiConnected] = React.useState(false)

  const [search, setSearch] = React.useState('')
  const [riskTier, setRiskTier] = React.useState('All Tiers')
  const [dateRange, setDateRange] = React.useState('Any Time')
  const [tickerFilter, setTickerFilter] = React.useState('All Tickers')

  const [sortKey, setSortKey] = React.useState<SortKey>('date')
  const [sortDir, setSortDir] = React.useState<SortDir>('desc')
  const [page, setPage] = React.useState(0)

  React.useEffect(() => {
    // TODO: replace with real fetch calls to /flags and /stock/{ticker} for combined log
    setAllEntries(buildHistoryLog())
    setApiConnected(true)
    setLoading(false)
  }, [])

  const uniqueTickers = React.useMemo(() => {
    const tickers = [...new Set(allEntries.map((e) => e.ticker))].sort()
    return ['All Tickers', ...tickers]
  }, [allEntries])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    else { setSortKey(key); setSortDir('desc'); setPage(0) }
  }

  const filtered = React.useMemo(() => {
    let rows = allEntries
    const q = search.trim().toLowerCase()
    if (q) rows = rows.filter((r) => r.ticker.toLowerCase().includes(q) || r.company.toLowerCase().includes(q) || r.signalType.toLowerCase().includes(q))
    if (riskTier !== 'All Tiers') rows = rows.filter((r) => r.riskTier === riskTier)
    if (tickerFilter !== 'All Tickers') rows = rows.filter((r) => r.ticker === tickerFilter)
    if (dateRange === 'Last 7 days') rows = rows.filter((r) => daysAgo(r.date, 7))
    else if (dateRange === 'Last 30 days') rows = rows.filter((r) => daysAgo(r.date, 30))
    else if (dateRange === 'Last 90 days') rows = rows.filter((r) => daysAgo(r.date, 90))

    return [...rows].sort((a, b) => {
      const mul = sortDir === 'desc' ? -1 : 1
      if (sortKey === 'date') return mul * a.date.localeCompare(b.date)
      if (sortKey === 'score') return mul * (a.score - b.score)
      return mul * a.ticker.localeCompare(b.ticker)
    })
  }, [allEntries, search, riskTier, tickerFilter, dateRange, sortKey, sortDir])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <AppShell apiConnected={apiConnected}>
      <main className={styles.page}>
        <div className={styles.inner}>
          <header className={styles.pageHeader}>
            <div className={styles.titleBlock}>
              <Title1 as="h1">Full Historical Log</Title1>
              <Caption1 className={styles.subtitle}>
                Complete record of insider trading alerts across all monitored stocks
              </Caption1>
            </div>
          </header>

          {/* Filter bar */}
          <div className={styles.filterBar} role="search" aria-label="Filter history">
            <Input
              className={styles.searchInput}
              placeholder="Search ticker, company, or signal…"
              contentBefore={<SearchRegular />}
              value={search}
              onChange={(_, d) => { setSearch(d.value); setPage(0) }}
              aria-label="Search history"
            />
            <Dropdown
              className={styles.filterDropdown}
              value={tickerFilter}
              selectedOptions={[tickerFilter]}
              onOptionSelect={(_, d) => { setTickerFilter(d.optionText ?? 'All Tickers'); setPage(0) }}
              aria-label="Filter by ticker"
            >
              {uniqueTickers.map((t) => <Option key={t}>{t}</Option>)}
            </Dropdown>
            <Dropdown
              className={styles.filterDropdown}
              value={riskTier}
              selectedOptions={[riskTier]}
              onOptionSelect={(_, d) => { setRiskTier(d.optionText ?? 'All Tiers'); setPage(0) }}
              aria-label="Filter by risk tier"
            >
              {RISK_TIERS.map((t) => <Option key={t}>{t}</Option>)}
            </Dropdown>
            <Dropdown
              className={styles.filterDropdown}
              value={dateRange}
              selectedOptions={[dateRange]}
              onOptionSelect={(_, d) => { setDateRange(d.optionText ?? 'Any Time'); setPage(0) }}
              aria-label="Filter by date range"
            >
              {DATE_RANGES.map((r) => <Option key={r}>{r}</Option>)}
            </Dropdown>
            <Button
              className={styles.exportBtn}
              appearance="subtle"
              icon={<ArrowDownloadRegular />}
              onClick={() => exportCsv(filtered)}
              disabled={filtered.length === 0}
              aria-label="Export to CSV"
            >
              Export CSV
            </Button>
          </div>

          <div className={styles.resultsRow}>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
              {loading ? 'Loading…' : `${filtered.length} event${filtered.length !== 1 ? 's' : ''} found`}
            </Caption1>
          </div>

          <section className={styles.tableSection} aria-label="Historical event log">
            {loading ? (
              <div style={{ padding: tokens.spacingVerticalL }}>
                <Skeleton aria-label="Loading history">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <SkeletonItem key={i} style={{ height: '40px', marginBottom: tokens.spacingVerticalXS }} />
                  ))}
                </Skeleton>
              </div>
            ) : pageRows.length === 0 ? (
              <div className={styles.emptyState}>
                <ClockRegular fontSize={40} />
                <Body1Strong>No events match your filters</Body1Strong>
                <Caption1>Try broadening your search criteria.</Caption1>
              </div>
            ) : (
              <>
                <div className={styles.tableWrap}>
                  <Table aria-label="Historical insider trading events" size="small" sortable>
                    <TableHeader>
                      <TableRow>
                        <TableHeaderCell className={styles.headerCell} onClick={() => handleSort('date')}>
                          <span className={styles.headerInner}>Date <SortIcon active={sortKey === 'date'} dir={sortDir} /></span>
                        </TableHeaderCell>
                        <TableHeaderCell className={styles.headerCell} onClick={() => handleSort('ticker')}>
                          <span className={styles.headerInner}>Ticker <SortIcon active={sortKey === 'ticker'} dir={sortDir} /></span>
                        </TableHeaderCell>
                        <TableHeaderCell className={styles.mobileHide}>Company</TableHeaderCell>
                        <TableHeaderCell className={styles.headerCell} onClick={() => handleSort('score')}>
                          <span className={styles.headerInner}>Score <SortIcon active={sortKey === 'score'} dir={sortDir} /></span>
                        </TableHeaderCell>
                        <TableHeaderCell>Risk Tier</TableHeaderCell>
                        <TableHeaderCell className={styles.mobileHide}>Signal Type</TableHeaderCell>
                        <TableHeaderCell className={styles.mobileHide}>Sector</TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pageRows.map((entry) => (
                        <TableRow
                          key={entry.id}
                          className={styles.tableRow}
                          onClick={() => router.push(`/stocks/${entry.ticker}`)}
                          aria-label={`${entry.ticker} on ${formatDate(entry.date)}, score ${entry.score}`}
                        >
                          <TableCell>
                            <TableCellLayout>
                              <Caption1 style={{ fontVariantNumeric: 'tabular-nums' }}>
                                {formatDate(entry.date)}
                              </Caption1>
                            </TableCellLayout>
                          </TableCell>
                          <TableCell>
                            <Body1Strong>{entry.ticker}</Body1Strong>
                          </TableCell>
                          <TableCell className={styles.mobileHide}>
                            <Caption1 style={{ color: tokens.colorNeutralForeground2 }}>{entry.company}</Caption1>
                          </TableCell>
                          <TableCell>
                            <span className={mergeClasses(styles.score, entry.score >= 80 && styles.scoreHigh)}>
                              {entry.score}
                            </span>
                          </TableCell>
                          <TableCell>
                            <RiskBadge tier={entry.riskTier} />
                          </TableCell>
                          <TableCell className={styles.mobileHide}>
                            <Caption1>{entry.signalType}</Caption1>
                          </TableCell>
                          <TableCell className={styles.mobileHide}>
                            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>{entry.sector}</Caption1>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className={styles.paginationRow}>
                  <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                    Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length} events
                  </Caption1>
                  <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
                    <Button appearance="subtle" size="small" disabled={page === 0} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
                      Previous
                    </Button>
                    <Button appearance="subtle" size="small" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </AppShell>
  )
}
