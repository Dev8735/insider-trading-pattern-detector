'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { DemoBadge } from '@/components/DemoBadge'
import { DataTable, type Column } from '@/components/DataTable'
import { Pill } from '@/components/RiskPill'
import { getBacktestResults } from '@/lib/api'
import type { BacktestResult } from '@/lib/types'
import { BarChart3 } from 'lucide-react'

export default function AnalyticsPage() {
  const [results, setResults] = useState<BacktestResult[]>([])
  const [loading, setLoading] = useState(true)
  const [demo, setDemo] = useState(false)

  useEffect(() => {
    const load = async () => {
      const res = await getBacktestResults()
      setResults(res.data)
      setDemo(res.demo)
      setLoading(false)
    }
    load()
  }, [])

  const columns: Column<BacktestResult>[] = [
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
      key: 'avg_return',
      header: 'Avg Return %',
      render: (row) => (
        <span className={row.avg_forward_return_pct >= 0 ? 'text-green-600' : 'text-red-600'}>
          {row.avg_forward_return_pct.toFixed(2)}%
        </span>
      ),
      sortValue: (row) => row.avg_forward_return_pct,
      priority: true,
      align: 'right',
    },
    {
      key: 'max_return',
      header: 'Max Return %',
      render: (row) => (
        <span className="text-green-600 font-medium">{row.max_forward_return_pct.toFixed(2)}%</span>
      ),
      sortValue: (row) => row.max_forward_return_pct,
      align: 'right',
    },
    {
      key: 'min_return',
      header: 'Min Return %',
      render: (row) => (
        <span className="text-red-600 font-medium">{row.min_forward_return_pct.toFixed(2)}%</span>
      ),
      sortValue: (row) => row.min_forward_return_pct,
      align: 'right',
    },
    {
      key: 'win_rate',
      header: 'Win Rate',
      render: (row) => (
        <Pill color={row.win_rate_pct >= 50 ? 'green' : 'orange'}>
          {row.win_rate_pct.toFixed(1)}%
        </Pill>
      ),
      sortValue: (row) => row.win_rate_pct,
    },
    {
      key: 'sample_size',
      header: 'Sample Size',
      render: (row) => (
        <span className="text-muted">{row.sample_size}</span>
      ),
      sortValue: (row) => row.sample_size,
    },
  ]

  const avgWinRate = results.length
    ? (results.reduce((sum, r) => sum + r.win_rate_pct, 0) / results.length).toFixed(1)
    : '0'

  const positiveReturns = results.filter((r) => r.avg_forward_return_pct > 0).length

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Backtest Analytics"
        subtitle="Forward return analysis and historical performance metrics"
        icon={<BarChart3 size={18} strokeWidth={1.75} />}
        badge={demo && <DemoBadge />}
      />

      {/* Summary cards */}
      <div className="grid gap-2 sm:gap-3 md:grid-cols-3">
        <div className="rounded-md border border-border bg-card p-3 sm:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-faint">Avg Win Rate</p>
          <p className="mt-1 text-xl font-medium text-green-600 sm:text-2xl">{avgWinRate}%</p>
          <p className="mt-0.5 text-xs text-muted">Across all stocks</p>
        </div>
        <div className="rounded-md border border-border bg-card p-3 sm:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-faint">Positive Return</p>
          <p className="mt-1 text-xl font-medium text-foreground sm:text-2xl">{positiveReturns}</p>
          <p className="mt-0.5 text-xs text-muted">Stocks with gains</p>
        </div>
        <div className="rounded-md border border-border bg-card p-3 sm:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-faint">Total Tested</p>
          <p className="mt-1 text-xl font-medium text-foreground sm:text-2xl">{results.length}</p>
          <p className="mt-0.5 text-xs text-muted">In backtest</p>
        </div>
      </div>

      {/* Results Table */}
      <div>
        <div className="mb-2 flex items-center gap-2 sm:mb-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-faint sm:text-sm">
            Performance Results
          </h2>
          <Pill color="gray">{results.length} stocks</Pill>
        </div>
        <DataTable
          rows={results}
          columns={columns}
          rowKey={(row) => row.ticker}
          loading={loading}
          pageSize={20}
          initialSort={{ key: 'avg_return', dir: 'desc' }}
        />
      </div>
    </div>
  )
}
