'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { DemoBadge } from '@/components/DemoBadge'
import { DataTable, type Column } from '@/components/DataTable'
import { Pill } from '@/components/RiskPill'
import { getSuitabilityRanking } from '@/lib/api'
import type { SuitabilityRanking } from '@/lib/types'
import { Trophy } from 'lucide-react'

export default function SuitabilityPage() {
  const [rankings, setRankings] = useState<SuitabilityRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [demo, setDemo] = useState(false)

  useEffect(() => {
    const load = async () => {
      const res = await getSuitabilityRanking()
      setRankings(res.data)
      setDemo(res.demo)
      setLoading(false)
    }
    load()
  }, [])

  const qualityTierColor = (tier: string) => {
    switch (tier) {
      case 'High':
        return 'green'
      case 'Medium':
        return 'yellow'
      case 'Low':
        return 'orange'
      default:
        return 'gray'
    }
  }

  const columns: Column<SuitabilityRanking>[] = [
    {
      key: 'ticker',
      header: 'Ticker',
      render: (row) => (
        <span className="font-medium text-foreground">{row.ticker}</span>
      ),
      sortValue: (row) => row.ticker,
      priority: true,
    },
    {
      key: 'company',
      header: 'Company',
      render: (row) => <span className="text-muted">{row.company}</span>,
      sortValue: (row) => row.company,
    },
    {
      key: 'score',
      header: 'Suitability',
      render: (row) => (
        <span className="font-medium text-foreground">{row.suitability_score.toFixed(1)}/100</span>
      ),
      sortValue: (row) => row.suitability_score,
      priority: true,
    },
    {
      key: 'window_score',
      header: 'Window Score',
      render: (row) => (
        <span className="text-foreground">{row.window_score.toFixed(1)}</span>
      ),
      sortValue: (row) => row.window_score,
    },
    {
      key: 'forward_return',
      header: 'Forward Return %',
      render: (row) => (
        <span className={row.forward_return_pct >= 0 ? 'text-green-600' : 'text-red-600'}>
          {row.forward_return_pct.toFixed(2)}%
        </span>
      ),
      sortValue: (row) => row.forward_return_pct,
      align: 'right',
    },
    {
      key: 'tier',
      header: 'Quality',
      render: (row) => (
        <Pill color={qualityTierColor(row.quality_tier)}>{row.quality_tier}</Pill>
      ),
    },
    {
      key: 'recommended',
      header: 'Recommended',
      render: (row) => (
        <Pill color={row.recommended ? 'green' : 'gray'}>
          {row.recommended ? 'Yes' : 'No'}
        </Pill>
      ),
    },
  ]

  const recommendedCount = rankings.filter((r) => r.recommended).length
  const highQualityCount = rankings.filter((r) => r.quality_tier === 'High').length

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Stock Suitability Ranking"
        subtitle="Stocks ranked by composite suitability for analysis and trading opportunities"
        icon={<Trophy size={18} strokeWidth={1.75} />}
        badge={demo && <DemoBadge />}
      />

      {/* Summary cards */}
      <div className="grid gap-2 sm:gap-3 md:grid-cols-3">
        <div className="rounded-md border border-border bg-card p-3 sm:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-faint">Recommended</p>
          <p className="mt-1 text-xl font-medium text-foreground sm:text-2xl">{recommendedCount}</p>
          <p className="mt-0.5 text-xs text-muted">Meet all criteria</p>
        </div>
        <div className="rounded-md border border-border bg-card p-3 sm:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-faint">High Quality</p>
          <p className="mt-1 text-xl font-medium text-green-600 sm:text-2xl">{highQualityCount}</p>
          <p className="mt-0.5 text-xs text-muted">Premium tier stocks</p>
        </div>
        <div className="rounded-md border border-border bg-card p-3 sm:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-faint">Total Stocks</p>
          <p className="mt-1 text-xl font-medium text-foreground sm:text-2xl">{rankings.length}</p>
          <p className="mt-0.5 text-xs text-muted">In database</p>
        </div>
      </div>

      {/* Results Table */}
      <div>
        <div className="mb-2 flex items-center gap-2 sm:mb-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-faint sm:text-sm">
            All Rankings
          </h2>
          <Pill color="gray">{rankings.length} stocks</Pill>
        </div>
        <DataTable
          rows={rankings}
          columns={columns}
          rowKey={(row) => row.ticker}
          loading={loading}
          pageSize={20}
          initialSort={{ key: 'score', dir: 'desc' }}
        />
      </div>
    </div>
  )
}
