'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  makeStyles,
  tokens,
  typographyStyles,
  Title1,
  Title3,
  Subtitle2,
  Body1Strong,
  Caption1,
  Card,
  CardHeader,
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
  Badge,
  mergeClasses,
} from '@fluentui/react-components'
import {
  ArrowLeftRegular,
  ArrowSortDownRegular,
  ArrowSortUpRegular,
  ArrowSortRegular,
  ShieldErrorRegular,
} from '@fluentui/react-icons'
import { AppShell } from '@/components/NavRail'
import { RiskBadge } from '@/components/RiskBadge'
import { KpiCard } from '@/components/KpiCard'
import { fetchStockHistory, fetchStockSummary } from '@/lib/api'
import type { StockSummary, DayRecord } from '@/lib/types'

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
  backBtn: { marginBottom: tokens.spacingVerticalL },

  // Header card
  headerCard: {
    marginBottom: tokens.spacingVerticalXL,
    paddingTop: tokens.spacingVerticalL,
    paddingBottom: tokens.spacingVerticalL,
    paddingLeft: tokens.spacingHorizontalXL,
    paddingRight: tokens.spacingHorizontalXL,
    '@media (max-width: 480px)': {
      paddingLeft: tokens.spacingHorizontalM,
      paddingRight: tokens.spacingHorizontalM,
    },
  },
  headerRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalM,
  },
  tickerBlock: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXS },
  tickerText: {
    ...typographyStyles.largeTitle,
    fontVariantNumeric: 'tabular-nums',
    color: tokens.colorNeutralForeground1,
  },
  companyText: { color: tokens.colorNeutralForeground2 },
  metaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
    marginTop: tokens.spacingVerticalS,
  },

  // KPI grid
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalXXL,
    '@media (max-width: 480px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: tokens.spacingHorizontalS,
    },
  },

  // History table section
  tableSection: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusLarge,
    borderTopWidth: tokens.strokeWidthThin,
    borderRightWidth: tokens.strokeWidthThin,
    borderBottomWidth: tokens.strokeWidthThin,
    borderLeftWidth: tokens.strokeWidthThin,
    borderTopStyle: 'solid',
    borderRightStyle: 'solid',
    borderBottomStyle: 'solid',
    borderLeftStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke2,
    borderRightColor: tokens.colorNeutralStroke2,
    borderBottomColor: tokens.colorNeutralStroke2,
    borderLeftColor: tokens.colorNeutralStroke2,
    overflow: 'hidden',
  },
  tableHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM,
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    borderBottomWidth: tokens.strokeWidthThin,
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke2,
  },
  tableWrap: { overflowX: 'auto' },
  tableRow: {
    transition: `background ${tokens.durationFast}`,
    ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover },
  },
  tableRowFlagged: {
    backgroundColor: tokens.colorPaletteRedBackground1,
    ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover },
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
  num: { fontVariantNumeric: 'tabular-nums' },
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

  // Pagination
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
    borderTopStyle: 'solid' as const,
    borderTopColor: tokens.colorNeutralStroke2,
  },
})

type SortKey = 'date' | 'suspicionScore' | 'avr' | 'car' | 'eventProximity'
type SortDir = 'asc' | 'desc'

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowSortRegular fontSize={14} />
  return dir === 'desc' ? <ArrowSortDownRegular fontSize={14} /> : <ArrowSortUpRegular fontSize={14} />
}

const PAGE_SIZE = 15

export default function StockDetailPage({ params }: { params: Promise<{ ticker: string }> }) {
  const styles = useStyles()
  const router = useRouter()

  const [ticker, setTicker] = React.useState<string | null>(null)
  const [summary, setSummary] = React.useState<StockSummary | null>(null)
  const [records, setRecords] = React.useState<DayRecord[]>([])
  const [loading, setLoading] = React.useState(true)
  const [apiConnected, setApiConnected] = React.useState(false)

  const [sortKey, setSortKey] = React.useState<SortKey>('date')
  const [sortDir, setSortDir] = React.useState<SortDir>('desc')
  const [page, setPage] = React.useState(0)

  // Unwrap params
  React.useEffect(() => {
    params.then((p) => setTicker(p.ticker.toUpperCase()))
  }, [params])

  React.useEffect(() => {
    if (!ticker) return
    setLoading(true)
    Promise.all([
      // TODO: swap for real fetchStockSummary(ticker) → endpoint 5
      fetchStockSummary(ticker),
      // TODO: swap for real fetchStockHistory(ticker) → endpoint 4
      fetchStockHistory(ticker),
    ])
      .then(([sum, hist]) => {
        setSummary(sum)
        setRecords(hist.records)
        setApiConnected(true)
      })
      .catch(() => setApiConnected(false))
      .finally(() => setLoading(false))
  }, [ticker])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    else { setSortKey(key); setSortDir('desc'); setPage(0) }
  }

  const sorted = React.useMemo(() => {
    return [...records].sort((a, b) => {
      const mul = sortDir === 'desc' ? -1 : 1
      if (sortKey === 'date') return mul * a.date.localeCompare(b.date)
      if (sortKey === 'suspicionScore') return mul * (a.suspicionScore - b.suspicionScore)
      if (sortKey === 'avr') return mul * (a.avr - b.avr)
      if (sortKey === 'car') return mul * (a.car - b.car)
      if (sortKey === 'eventProximity') return mul * (a.eventProximity - b.eventProximity)
      return 0
    })
  }, [records, sortKey, sortDir])

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <AppShell apiConnected={apiConnected}>
      <main className={styles.page}>
        <div className={styles.inner}>
          {/* Back */}
          <div className={styles.backBtn}>
            <Button
              appearance="subtle"
              icon={<ArrowLeftRegular />}
              onClick={() => router.push('/stocks')}
              aria-label="Back to Stocks Explorer"
            >
              Back to Stocks
            </Button>
          </div>

          {/* Header card */}
          {loading ? (
            <Skeleton aria-label="Loading stock details" style={{ marginBottom: tokens.spacingVerticalXL }}>
              <SkeletonItem style={{ height: '120px', borderRadius: tokens.borderRadiusLarge }} />
            </Skeleton>
          ) : summary ? (
            <Card appearance="filled-alternative" className={styles.headerCard}>
              <div className={styles.headerRow}>
                <div className={styles.tickerBlock}>
                  <div className={styles.tickerText}>{summary.ticker}</div>
                  <Subtitle2 className={styles.companyText}>{summary.company}</Subtitle2>
                </div>
                <RiskBadge tier={summary.riskTier} score={summary.latestScore} size="extra-large" />
              </div>
              <div className={styles.metaRow}>
                <Badge appearance="outline" color="informative">{summary.exchange}</Badge>
                <Badge appearance="outline">{summary.sector}</Badge>
              </div>
            </Card>
          ) : null}

          {/* KPI summary cards */}
          <section aria-label="Stock summary metrics" className={styles.kpiGrid}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} aria-label="Loading metric">
                  <SkeletonItem style={{ height: '90px', borderRadius: tokens.borderRadiusLarge }} />
                </Skeleton>
              ))
            ) : summary ? (
              <>
                <KpiCard
                  label="Latest Score"
                  value={summary.latestScore}
                  trend="Current suspicion score"
                  accent={summary.latestScore >= 80 ? 'danger' : summary.latestScore >= 60 ? 'warning' : 'success'}
                />
                <KpiCard
                  label="Peak Score"
                  value={summary.peakScore}
                  trend="30-day maximum"
                  accent={summary.peakScore >= 80 ? 'danger' : 'brand'}
                />
                <KpiCard
                  label="Flagged Days"
                  value={summary.flaggedDays}
                  trend="Days above threshold"
                  accent={summary.flaggedDays > 5 ? 'danger' : 'brand'}
                />
                <KpiCard
                  label="Last Flagged"
                  value={summary.lastFlaggedDate ?? 'Never'}
                  trend="Most recent alert"
                  accent="brand"
                />
              </>
            ) : null}
          </section>

          {/* Day-by-day history table */}
          <section className={styles.tableSection} aria-label="Day-by-day scored history">
            <div className={styles.tableHeader}>
              <Body1Strong>Day-by-Day Score History</Body1Strong>
              <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                Highlighted rows crossed the flag threshold (score ≥ 60) — sortable and paginated
              </Caption1>
            </div>

            {loading ? (
              <div style={{ padding: tokens.spacingVerticalL }}>
                <Skeleton aria-label="Loading history">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonItem key={i} style={{ height: '40px', marginBottom: tokens.spacingVerticalXS }} />
                  ))}
                </Skeleton>
              </div>
            ) : pageRows.length === 0 ? (
              <div className={styles.emptyState}>
                <ShieldErrorRegular fontSize={40} />
                <Body1Strong>No history available</Body1Strong>
                <Caption1>Score records will appear here once data is available.</Caption1>
              </div>
            ) : (
              <>
                <div className={styles.tableWrap}>
                  <Table aria-label={`Score history for ${ticker}`} size="small" sortable>
                    <TableHeader>
                      <TableRow>
                        <TableHeaderCell className={styles.headerCell} onClick={() => handleSort('date')}>
                          <span className={styles.headerInner}>Date <SortIcon active={sortKey === 'date'} dir={sortDir} /></span>
                        </TableHeaderCell>
                        <TableHeaderCell className={styles.headerCell} onClick={() => handleSort('suspicionScore')}>
                          <span className={styles.headerInner}>Score <SortIcon active={sortKey === 'suspicionScore'} dir={sortDir} /></span>
                        </TableHeaderCell>
                        <TableHeaderCell className={mergeClasses(styles.headerCell, styles.mobileHide)} onClick={() => handleSort('avr')}>
                          <span className={styles.headerInner}>AVR <SortIcon active={sortKey === 'avr'} dir={sortDir} /></span>
                        </TableHeaderCell>
                        <TableHeaderCell className={mergeClasses(styles.headerCell, styles.mobileHide)} onClick={() => handleSort('car')}>
                          <span className={styles.headerInner}>CAR (%) <SortIcon active={sortKey === 'car'} dir={sortDir} /></span>
                        </TableHeaderCell>
                        <TableHeaderCell className={styles.mobileHide}>IF Anomaly</TableHeaderCell>
                        <TableHeaderCell className={mergeClasses(styles.headerCell, styles.mobileHide)} onClick={() => handleSort('eventProximity')}>
                          <span className={styles.headerInner}>Event Proximity <SortIcon active={sortKey === 'eventProximity'} dir={sortDir} /></span>
                        </TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pageRows.map((row) => (
                        <TableRow
                          key={row.date}
                          className={row.flagged ? mergeClasses(styles.tableRow, styles.tableRowFlagged) : styles.tableRow}
                          aria-label={`${formatDate(row.date)}, score ${row.suspicionScore}${row.flagged ? ', flagged' : ''}`}
                        >
                          <TableCell>
                            <TableCellLayout>
                              <Caption1 className={styles.num}>{formatDate(row.date)}</Caption1>
                            </TableCellLayout>
                          </TableCell>
                          <TableCell>
                            <span className={mergeClasses(styles.score, row.suspicionScore >= 80 && styles.scoreHigh)}>
                              {row.suspicionScore}
                            </span>
                          </TableCell>
                          <TableCell className={styles.mobileHide}>
                            <Caption1 className={styles.num}>{row.avr.toFixed(2)}×</Caption1>
                          </TableCell>
                          <TableCell className={styles.mobileHide}>
                            <Caption1
                              className={styles.num}
                              style={{ color: row.car >= 0 ? tokens.colorPaletteGreenForeground2 : tokens.colorPaletteRedForeground2 }}
                            >
                              {row.car >= 0 ? '+' : ''}{row.car.toFixed(2)}%
                            </Caption1>
                          </TableCell>
                          <TableCell className={styles.mobileHide}>
                            <Badge
                              appearance="tint"
                              color={row.ifAnomaly ? 'danger' : 'subtle'}
                              size="small"
                            >
                              {row.ifAnomaly ? 'Anomaly' : 'Normal'}
                            </Badge>
                          </TableCell>
                          <TableCell className={styles.mobileHide}>
                            <Caption1 className={styles.num}>{row.eventProximity}d</Caption1>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className={styles.paginationRow}>
                  <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                    Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length} records
                  </Caption1>
                  <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
                    <Button
                      appearance="subtle"
                      size="small"
                      disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}
                      aria-label="Previous page"
                    >
                      Previous
                    </Button>
                    <Button
                      appearance="subtle"
                      size="small"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                      aria-label="Next page"
                    >
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
