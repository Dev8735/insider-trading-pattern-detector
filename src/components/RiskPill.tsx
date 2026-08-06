import type { RiskTier } from '@/lib/types'
import { riskPillClasses, cx } from '@/lib/utils'

export function RiskPill({ tier, className }: { tier: RiskTier; className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium leading-5 whitespace-nowrap',
        riskPillClasses(tier),
        className,
      )}
    >
      {tier}
    </span>
  )
}

type PillColor = 'gray' | 'green' | 'blue' | 'yellow' | 'red' | 'orange'

const pillColorMap: Record<PillColor, string> = {
  gray: 'bg-[var(--color-pill-gray-bg)] text-[var(--color-pill-gray-text)]',
  green: 'bg-[var(--color-pill-green-bg)] text-[var(--color-pill-green-text)]',
  blue: 'bg-[var(--color-pill-blue-bg)] text-[var(--color-pill-blue-text)]',
  yellow: 'bg-[var(--color-pill-yellow-bg)] text-[var(--color-pill-yellow-text)]',
  red: 'bg-[var(--color-pill-red-bg)] text-[var(--color-pill-red-text)]',
  orange: 'bg-[var(--color-pill-orange-bg)] text-[var(--color-pill-orange-text)]',
}

// Generic Notion-style pill used for tags, signal types, demo badges, etc.
export function Pill({
  children,
  color = 'gray',
  className,
}: {
  children: React.ReactNode
  color?: PillColor
  className?: string
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium leading-5 whitespace-nowrap',
        pillColorMap[color],
        className,
      )}
    >
      {children}
    </span>
  )
}
