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
  EyeRegular,
  DataTrendingRegular,
} from '@fluentui/react-icons'
import { AppShell } from '@/components/NavRail'
import { RiskBadge } from '@/components/RiskBadge'
import { fetchStocks } from '@/lib/api'
import type { StockListItem } from '@/lib/types'

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
  headerCell: {
    cursor: 'pointer',
    userSelect: 'none',
  },
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
})

const SECTORS = ['All Sectors', 'Banking', 'IT', 'Energy', 'Pharma', 'Auto', 'FMCG', 'NBFC', 'Utilities']
const RISK_TIERS = ['All Tiers', 'Critical', 'High', 'Medium', 'Low', 'Clean']
const DATE_RANGES = ['Any Time', 'Last 7 days', 'Last 30 days', 'Last 90 days']

type SortKey = 'ticker' | 'latestScore' | 'company'
type SortDir = 'asc' | 'desc'

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowSortRegular fontSize={14} />
  return dir === 'desc' ? <ArrowSortDownRegular fontSize={14} /> : <ArrowSortUpRegular fontSize={14} />
}

function exportCsv(rows: StockListItem[]) {
  const header = 'Ticker,Company,Sector,Exchange,Risk Tier,Latest Score,Last Flagged'
  const lines = rows.map((r) =>
    [r.ticker, `"${r.company}"`, r.sector, r.exchange, r.riskTier, r.latestScore, r.lastFlagged ?? 'N/A'].join(',')
  )
  const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'tradewatch-stocks.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function daysAgo(dateStr: string | null, days: number): boolean {
  if (!dateStr) return false
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return new Date(dateStr) >= cutoff
}

export default function StocksExplorerPage() {
  const styles = useStyles()
  const router = useRouter()

  const [stocks, setStocks] = React.useState<StockListItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [apiConnected, setApiConnected] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [sector, setSector] = React.useState('All Sectors')
  const [riskTier, setRiskTier] = React.useState('All Tiers')
  const [dateRange, setDateRange] = React.useState('Any Time')
  const [sortKey, setSortKey] = React.useState<SortKey>('latestScore')
  const [sortDir, setSortDir] = React.useState<SortDir>('desc')

  React.useEffect(() => {
    // TODO: swap for real fetchStocks() against endpoint 2
    fetchStocks()
      .then((data) => { setStocks(data); setApiConnected(true) })
      .catch(() => setApiConnected(false))
      .finally(() => setLoading(false))
  }, [])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  const filtered = React.useMemo(() => {
    let rows = stocks
    const q = search.trim().toLowerCase()
    if (q) rows = rows.filter((s) => s.ticker.toLowerCase().includes(q) || s.company.toLowerCase().includes(q))
    if (sector !== 'All Sectors') rows = rows.filter((s) => s.sector === sector)
    if (riskTier !== 'All Tiers') rows = rows.filter((s) => s.riskTier === riskTier)
    if (dateRange === 'Last 7 days') rows = rows.filter((s) => daysAgo(s.lastFlagged, 7))
    else if (dateRange === 'Last 30 days') rows = rows.filter((s) => daysAgo(s.lastFlagged, 30))
    else if (dateRange === 'Last 90 days') rows = rows.filter((s) => daysAgo(s.lastFlagged, 90))
    return [...rows].sort((a, b) => {
      const mul = sortDir === 'desc' ? -1 : 1
      if (sortKey === 'latestScore') return mul * (a.latestScore - b.latestScore)
      if (sortKey === 'ticker') return mul * a.ticker.localeCompare(b.ticker)
      return mul * a.company.localeCompare(b.company)
    })
  }, [stocks, search, sector, riskTier, dateRange, sortKey, sortDir])

  return (
    <AppShell apiConnected={apiConnected}>
      <main className={styles.page}>
        <div className={styles.inner}>
          <header className={styles.pageHeader}>
            <div className={styles.titleBlock}>
              <Title1 as="h1">Stocks Explorer</Title1>
              <Caption1 className={styles.subtitle}>
                Search, filter, and browse all monitored NSE &amp; BSE tickers
              </Caption1>
            </div>
          </header>

          {/* Filter bar */}
          <div className={styles.filterBar} role="search" aria-label="Filter stocks">
            <Input
              className={styles.searchInput}
              placeholder="Search ticker or company…"
              contentBefore={<SearchRegular />}
              value={search}
              onChange={(_, d) => setSearch(d.value)}
              aria-label="Search stocks"
            />
            <Dropdown
              className={styles.filterDropdown}
              value={riskTier}
              selectedOptions={[riskTier]}
              onOptionSelect={(_, d) => setRiskTier(d.optionText ?? 'All Tiers')}
              aria-label="Filter by risk tier"
            >
              {RISK_TIERS.map((t) => <Option key={t}>{t}</Option>)}
            </Dropdown>
            <Dropdown
              className={styles.filterDropdown}
              value={sector}
              selectedOptions={[sector]}
              onOptionSelect={(_, d) => setSector(d.optionText ?? 'All Sectors')}
              aria-label="Filter by sector"
            >
              {SECTORS.map((s) => <Option key={s}>{s}</Option>)}
            </Dropdown>
            <Dropdown
              className={styles.filterDropdown}
              value={dateRange}
              selectedOptions={[dateRange]}
              onOptionSelect={(_, d) => setDateRange(d.optionText ?? 'Any Time')}
              aria-label="Filter by date flagged"
            >
              {DATE_RANGES.map((r) => <Option key={r}>{r}</Option>)}
            </Dropdown>
            <Button
              className={styles.exportBtn}
              appearance="subtle"
              icon={<ArrowDownloadRegular />}
              onClick={() => exportCsv(filtered)}
              disabled={filtered.length === 0}
              aria-label="Export filtered results to CSV"
            >
              Export CSV
            </Button>
          </div>

          <div className={styles.resultsRow}>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
              {loading ? 'Loading…' : `${filtered.length} stock${filtered.length !== 1 ? 's' : ''} found`}
            </Caption1>
          </div>

          <section className={styles.tableSection} aria-label="Stocks list">
            {loading ? (
              <div style={{ padding: tokens.spacingVerticalL }}>
                <Skeleton aria-label="Loading stocks">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonItem key={i} style={{ height: '40px', marginBottom: tokens.spacingVerticalXS }} />
                  ))}
                </Skeleton>
              </div>
            ) : filtered.length === 0 ? (
              <div className={styles.emptyState}>
                <DataTrendingRegular fontSize={40} />
                <Body1Strong>No stocks match your filters</Body1Strong>
                <Caption1>Try broadening your search or adjusting the filters.</Caption1>
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <Table aria-label="Monitored stocks" size="small" sortable>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell className={styles.headerCell} onClick={() => handleSort('ticker')}>
                        <span className={styles.headerInner}>Ticker <SortIcon active={sortKey === 'ticker'} dir={sortDir} /></span>
                      </TableHeaderCell>
                      <TableHeaderCell className={mergeClasses(styles.headerCell, styles.mobileHide)} onClick={() => handleSort('company')}>
                        <span className={styles.headerInner}>Company <SortIcon active={sortKey === 'company'} dir={sortDir} /></span>
                      </TableHeaderCell>
                      <TableHeaderCell className={styles.mobileHide}>Sector</TableHeaderCell>
                      <TableHeaderCell className={styles.mobileHide}>Exchange</TableHeaderCell>
                      <TableHeaderCell className={styles.headerCell} onClick={() => handleSort('latestScore')}>
                        <span className={styles.headerInner}>Score <SortIcon active={sortKey === 'latestScore'} dir={sortDir} /></span>
                      </TableHeaderCell>
                      <TableHeaderCell>Risk Tier</TableHeaderCell>
                      <TableHeaderCell className={styles.mobileHide}>Last Flagged</TableHeaderCell>
                      <TableHeaderCell />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((s) => (
                      <TableRow
                        key={s.ticker}
                        className={styles.tableRow}
                        onClick={() => router.push(`/stocks/${s.ticker}`)}
                        aria-label={`View ${s.ticker}`}
                      >
                        <TableCell>
                          <TableCellLayout><Body1Strong>{s.ticker}</Body1Strong></TableCellLayout>
                        </TableCell>
                        <TableCell className={styles.mobileHide}>
                          <Caption1 style={{ color: tokens.colorNeutralForeground2 }}>{s.company}</Caption1>
                        </TableCell>
                        <TableCell className={styles.mobileHide}>
                          <Caption1>{s.sector}</Caption1>
                        </TableCell>
                        <TableCell className={styles.mobileHide}>
                          <Caption1>{s.exchange}</Caption1>
                        </TableCell>
                        <TableCell>
                          <span className={mergeClasses(styles.score, s.latestScore >= 80 && styles.scoreHigh)}>
                            {s.latestScore}
                          </span>
                        </TableCell>
                        <TableCell><RiskBadge tier={s.riskTier} /></TableCell>
                        <TableCell className={styles.mobileHide}>
                          <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                            {s.lastFlagged
                              ? new Date(s.lastFlagged).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                              : '—'}
                          </Caption1>
                        </TableCell>
                        <TableCell>
                          <Button
                            appearance="subtle"
                            size="small"
                            icon={<EyeRegular />}
                            onClick={(e) => { e.stopPropagation(); router.push(`/stocks/${s.ticker}`) }}
                            aria-label={`View ${s.ticker} details`}
                          >
                            <span className={styles.mobileHide}>View</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        </div>
      </main>
    </AppShell>
  )
}
