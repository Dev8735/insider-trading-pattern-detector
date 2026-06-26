'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/PageHeader'
import { SummaryCard, SummaryGrid } from '@/components/SummaryCard'
import { DataTable, type Column } from '@/components/DataTable'
import { RiskPill, Pill } from '@/components/RiskPill'
import { DemoBadge } from '@/components/DemoBadge'
import { getFlags, getStocks } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { FlaggedStock, StockListItem } from '@/lib/types'

export default function DashboardPage() {
  const router = useRouter()
  const [flags, setFlags] = React.useState<FlaggedStock[]>([])
  const [stocks, setStocks] = React.useState<StockListItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [demo, setDemo] = React.useState(false)

  React.useEffect(() => {
    let active = true
    Promise.all([getFlags(), getStocks()]).then(([f, s]) => {
      if (!active) return
      setFlags(f.data)
      setStocks(s.data)
      setDemo(f.demo || s.demo)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  const stocksMonitored = stocks.length
  const flaggedCount = flags.length
  const avgScore = flags.length
    ? Math.round(flags.reduce((acc, f) => acc + f.peakScore, 0) / flags.length)
    : 0
  const criticalAlerts = flags.filter((f) => f.riskTier === 'Critical').length

  const columns: Column<FlaggedStock>[] = [
    {
      key: 'ticker',
      header: 'Ticker',
      priority: true,
      render: (r) => <span className="font-medium text-foreground">{r.ticker}</span>,
      sortValue: (r) => r.ticker,
    },
    {
      key: 'company',
      header: 'Company',
      render: (r) => <span className="text-muted">{r.company}</span>,
      sortValue: (r) => r.company,
    },
    {
      key: 'sector',
      header: 'Sector',
      render: (r) => <Pill color="gray">{r.sector}</Pill>,
      sortValue: (r) => r.sector,
    },
    {
      key: 'peakScore',
      header: 'Peak Score',
      align: 'right',
      priority: true,
      render: (r) => <span className="font-medium tabular-nums">{r.peakScore}</span>,
      sortValue: (r) => r.peakScore,
    },
    {
      key: 'riskTier',
      header: 'Risk',
      priority: true,
      render: (r) => <RiskPill tier={r.riskTier} />,
      sortValue: (r) => r.peakScore,
    },
    {
      key: 'signalType',
      header: 'Signal',
      render: (r) => <span className="text-muted">{r.signalType}</span>,
      sortValue: (r) => r.signalType,
    },
    {
      key: 'flaggedDate',
      header: 'Last Flagged',
      render: (r) => <span className="text-muted">{formatDate(r.flaggedDate)}</span>,
      sortValue: (r) => r.flaggedDate,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Stocks ranked by peak suspicion score across NSE & BSE."
        badge={!loading && demo ? <DemoBadge /> : undefined}
      />

      <SummaryGrid className="mb-8">
        <SummaryCard
          label="Stocks Monitored"
          value={stocksMonitored}
          hint="Tracked tickers in the model"
          loading={loading}
        />
        <SummaryCard
          label="Flagged"
          value={flaggedCount}
          hint="Currently above threshold"
          loading={loading}
        />
        <SummaryCard
          label="Avg Suspicion Score"
          value={avgScore}
          hint="Across flagged stocks"
          loading={loading}
        />
        <SummaryCard
          label="Critical Alerts"
          value={criticalAlerts}
          hint="Score in critical tier"
          loading={loading}
        />
      </SummaryGrid>

      <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-faint sm:mb-3 sm:text-sm">
        Flagged stocks
      </h2>
      <DataTable
        columns={columns}
        rows={flags}
        rowKey={(r) => r.ticker}
        onRowClick={(r) => router.push(`/stocks/${encodeURIComponent(r.ticker)}`)}
        loading={loading}
        emptyMessage="No flagged stocks right now."
        initialSort={{ key: 'peakScore', dir: 'desc' }}
        pageSize={10}
      />
    </div>
  )
}
