import { cx } from '@/lib/utils'

interface SummaryCardProps {
  label: string
  value: React.ReactNode
  hint?: string
  loading?: boolean
  accent?: React.ReactNode
}

// Plain Notion-style stat block: label + number + one muted line.
// No heavy KPI tile styling — hairline border, no shadow.
export function SummaryCard({ label, value, hint, loading, accent }: SummaryCardProps) {
  return (
    <div className="rounded-md border border-border bg-card p-4 sm:p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-faint">{label}</p>
      {loading ? (
        <div className="mt-2 h-7 w-20 rounded shimmer" />
      ) : (
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-2xl font-medium tabular-nums text-foreground sm:text-3xl">
            {value}
          </span>
          {accent}
        </div>
      )}
      {hint ? (
        loading ? (
          <div className="mt-2 h-3 w-28 rounded shimmer" />
        ) : (
          <p className="mt-1 text-sm leading-relaxed text-muted">{hint}</p>
        )
      ) : null}
    </div>
  )
}

// Responsive auto-fit grid wrapper for a row of summary cards.
export function SummaryGrid({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cx('grid gap-3 sm:gap-4', className)}
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}
    >
      {children}
    </div>
  )
}
