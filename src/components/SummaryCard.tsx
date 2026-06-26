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
    <div className="rounded-md border border-border bg-card p-3 sm:p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-faint">{label}</p>
      {loading ? (
        <div className="mt-1.5 h-6 w-16 rounded shimmer" />
      ) : (
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xl font-medium tabular-nums text-foreground sm:text-2xl">
            {value}
          </span>
          {accent}
        </div>
      )}
      {hint ? (
        loading ? (
          <div className="mt-1.5 h-3 w-24 rounded shimmer" />
        ) : (
          <p className="mt-0.5 text-xs leading-snug text-muted sm:text-sm">{hint}</p>
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
      className={cx('grid gap-2 sm:gap-3', className)}
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}
    >
      {children}
    </div>
  )
}
