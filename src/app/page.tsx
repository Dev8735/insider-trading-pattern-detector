'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  makeStyles,
  tokens,
  typographyStyles,
  Title1,
  Caption1,
  Body1Strong,
  Skeleton,
  SkeletonItem,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  TableCellLayout,
  TableSelectionCell,
  Button,
  Spinner,
  mergeClasses,
} from '@fluentui/react-components'
import {
  DataTrendingRegular,
  ShieldErrorRegular,
  AlertRegular,
  BuildingBankRegular,
  ArrowSortDownRegular,
  ArrowSortUpRegular,
  ArrowSortRegular,
  ArrowClockwiseRegular,
} from '@fluentui/react-icons'
import { AppShell } from '@/components/NavRail'
import { KpiCard } from '@/components/KpiCard'
import { RiskBadge } from '@/components/RiskBadge'
import { fetchFlags, fetchHealth } from '@/lib/api'
import type { FlaggedStock, RiskTier } from '@/lib/types'

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
  timestamp: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    ...typographyStyles.caption1,
    color: tokens.colorNeutralForeground3,
    backgroundColor: tokens.colorNeutralBackground3,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    paddingTop: tokens.spacingVerticalXS,
    paddingBottom: tokens.spacingVerticalXS,
    borderRadius: tokens.borderRadiusCircular,
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
    whiteSpace: 'nowrap',
    alignSelf: 'flex-start',
    marginTop: tokens.spacingVerticalXS,
  },

  // KPI grid
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalXXL,
    '@media (max-width: 480px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: tokens.spacingHorizontalS,
    },
  },

  // Table section
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
  tableWrap: {
    overflowX: 'auto',
  },
  tableRow: {
    cursor: 'pointer',
    ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover },
    transition: `background ${tokens.durationFast}`,
  },
  tableRowFlagged: {
    backgroundColor: tokens.colorPaletteRedBackground1,
    ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover },
  },
  tableRowHigh: {
    backgroundColor: tokens.colorPaletteMarigoldBackground1,
    ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover },
  },
  headerCell: {
    cursor: 'pointer',
    userSelect: 'none',
    ':hover': { color: tokens.colorNeutralForeground1 },
  },
  headerCellInner: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  score: {
    fontVariantNumeric: 'tabular-nums',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  scoreHigh: { color: tokens.colorPaletteRedForeground2 },
  mobileHide: {
    '@media (max-width: 600px)': { display: 'none' },
  },
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

type SortKey = 'peakScore' | 'ticker' | 'flaggedDays'
type SortDir = 'asc' | 'desc'

function SortIcon({ col, active, dir }: { col: string; active: boolean; dir: SortDir }) {
  if (!active) return <ArrowSortRegular fontSize={14} />
  return dir === 'desc' ? <ArrowSortDownRegular fontSize={14} /> : <ArrowSortUpRegular fontSize={14} />
}

export default function DashboardPage() {
  const styles = useStyles()
  const router = useRouter()

  const [flags, setFlags] = React.useState<FlaggedStock[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [apiConnected, setApiConnected] = React.useState(false)
  const [lastRefreshed, setLastRefreshed] = React.useState<Date | null>(null)
  const [sortKey, setSortKey] = React.useState<SortKey>('peakScore')
  const [sortDir, setSortDir] = React.useState<SortDir>('desc')

  const load = React.useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const [health, data] = await Promise.all([fetchHealth(), fetchFlags()])
      setApiConnected(health.status === 'ok')
      setFlags(data)
      setLastRefreshed(new Date())
    } catch {
      setApiConnected(false)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  React.useEffect(() => { load() }, [load])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  const sorted = React.useMemo(() => {
    return [...flags].sort((a, b) => {
      const mul = sortDir === 'desc' ? -1 : 1
      if (sortKey === 'peakScore') return mul * (a.peakScore - b.peakScore)
      if (sortKey === 'flaggedDays') return mul * (a.flaggedDays - b.flaggedDays)
      return mul * a.ticker.localeCompare(b.ticker)
    })
  }, [flags, sortKey, sortDir])

  const criticalCount = flags.filter((f) => f.riskTier === 'Critical').length
  const avgScore = flags.length
    ? Math.round(flags.reduce((s, f) => s + f.peakScore, 0) / flags.length)
    : 0

  const lastRefreshedLabel = lastRefreshed
    ? lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '—'

  const rowClass = (tier: RiskTier) =>
    tier === 'Critical' ? mergeClasses(styles.tableRow, styles.tableRowFlagged)
    : tier === 'High' ? mergeClasses(styles.tableRow, styles.tableRowHigh)
    : styles.tableRow

  return (
    <AppShell apiConnected={apiConnected}>
      <main className={styles.page}>
        <div className={styles.inner}>
          {/* Page header */}
          <header className={styles.pageHeader}>
            <div className={styles.titleBlock}>
              <Title1 as="h1">Dashboard</Title1>
              <Caption1 className={styles.subtitle}>
                Real-time insider trading pattern monitoring across NSE &amp; BSE
              </Caption1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
              <span className={styles.timestamp}>
                Last refreshed: {lastRefreshedLabel}
              </span>
              <Button
                appearance="subtle"
                icon={refreshing ? <Spinner size="tiny" /> : <ArrowClockwiseRegular />}
                onClick={() => load(true)}
                disabled={refreshing}
                aria-label="Refresh data"
              >
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </Button>
            </div>
          </header>

          {/* KPI tiles */}
          <section aria-label="Key metrics" className={styles.kpiGrid}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} aria-label="Loading metric">
                  <SkeletonItem style={{ height: '96px', borderRadius: tokens.borderRadiusLarge }} />
                </Skeleton>
              ))
            ) : (
              <>
                <KpiCard
                  label="Stocks Monitored"
                  value={15}
                  trend="+2 added this week"
                  trendDir="up"
                  icon={<BuildingBankRegular fontSize={18} />}
                  accent="brand"
                />
                <KpiCard
                  label="Flagged Today"
                  value={flags.length}
                  trend={`${criticalCount} critical alert${criticalCount !== 1 ? 's' : ''}`}
                  trendDir={criticalCount > 0 ? 'down' : 'neutral'}
                  icon={<AlertRegular fontSize={18} />}
                  accent="warning"
                />
                <KpiCard
                  label="Avg Suspicion Score"
                  value={avgScore}
                  trend="Across all flagged stocks"
                  trendDir="neutral"
                  icon={<DataTrendingRegular fontSize={18} />}
                  accent="brand"
                />
                <KpiCard
                  label="Critical Alerts"
                  value={criticalCount}
                  trend="+1 since yesterday"
                  trendDir={criticalCount > 0 ? 'down' : 'neutral'}
                  icon={<ShieldErrorRegular fontSize={18} />}
                  accent="danger"
                />
              </>
            )}
          </section>

          {/* Flagged stocks table */}
          <section className={styles.tableSection} aria-label="Top flagged stocks">
            <div className={styles.tableHeader}>
              <Body1Strong>Top Flagged Stocks</Body1Strong>
              <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                Ranked by peak suspicion score — click a row to view full history
              </Caption1>
            </div>

            {loading ? (
              <div style={{ padding: tokens.spacingVerticalL }}>
                <Skeleton aria-label="Loading table">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonItem key={i} style={{ height: '40px', marginBottom: tokens.spacingVerticalXS }} />
                  ))}
                </Skeleton>
              </div>
            ) : sorted.length === 0 ? (
              <div className={styles.emptyState}>
                <ShieldErrorRegular fontSize={40} />
                <Body1Strong>No flagged stocks found</Body1Strong>
                <Caption1>All monitored stocks are within normal parameters.</Caption1>
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <Table
                  aria-label="Flagged stocks sorted by score"
                  size="small"
                  sortable
                >
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell
                        className={mergeClasses(styles.headerCell)}
                        onClick={() => handleSort('ticker')}
                      >
                        <span className={styles.headerCellInner}>
                          Ticker
                          <SortIcon col="ticker" active={sortKey === 'ticker'} dir={sortDir} />
                        </span>
                      </TableHeaderCell>
                      <TableHeaderCell className={styles.mobileHide}>Company</TableHeaderCell>
                      <TableHeaderCell
                        className={mergeClasses(styles.headerCell, styles.mobileHide)}
                        onClick={() => handleSort('peakScore')}
                      >
                        <span className={styles.headerCellInner}>
                          Peak Score
                          <SortIcon col="peakScore" active={sortKey === 'peakScore'} dir={sortDir} />
                        </span>
                      </TableHeaderCell>
                      <TableHeaderCell>Risk Tier</TableHeaderCell>
                      <TableHeaderCell className={styles.mobileHide}>Signal Type</TableHeaderCell>
                      <TableHeaderCell
                        className={mergeClasses(styles.headerCell, styles.mobileHide)}
                        onClick={() => handleSort('flaggedDays')}
                      >
                        <span className={styles.headerCellInner}>
                          Flagged Days
                          <SortIcon col="flaggedDays" active={sortKey === 'flaggedDays'} dir={sortDir} />
                        </span>
                      </TableHeaderCell>
                      <TableHeaderCell className={styles.mobileHide}>Last Flagged</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.map((f) => (
                      <TableRow
                        key={f.ticker}
                        className={rowClass(f.riskTier)}
                        onClick={() => router.push(`/stocks/${f.ticker}`)}
                        aria-label={`View details for ${f.ticker}`}
                      >
                        <TableCell>
                          <TableCellLayout>
                            <Body1Strong>{f.ticker}</Body1Strong>
                            <span style={{ display: 'none' }}>{f.exchange}</span>
                          </TableCellLayout>
                        </TableCell>
                        <TableCell className={styles.mobileHide}>
                          <Caption1 style={{ color: tokens.colorNeutralForeground2 }}>
                            {f.company}
                          </Caption1>
                        </TableCell>
                        <TableCell className={styles.mobileHide}>
                          <span className={mergeClasses(styles.score, f.peakScore >= 80 && styles.scoreHigh)}>
                            {f.peakScore}
                          </span>
                        </TableCell>
                        <TableCell>
                          <RiskBadge tier={f.riskTier} />
                        </TableCell>
                        <TableCell className={styles.mobileHide}>
                          <Caption1>{f.signalType}</Caption1>
                        </TableCell>
                        <TableCell className={styles.mobileHide}>
                          <Caption1 style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {f.flaggedDays}d
                          </Caption1>
                        </TableCell>
                        <TableCell className={styles.mobileHide}>
                          <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                            {f.flaggedDate}
                          </Caption1>
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
