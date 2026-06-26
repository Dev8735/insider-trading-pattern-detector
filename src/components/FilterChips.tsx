'use client'

import { cx } from '@/lib/utils'

interface FilterChipsProps {
  label?: string
  options: string[]
  value: string
  onChange: (value: string) => void
}

// Notion-style filter chips: small rounded buttons that wrap onto multiple
// lines, with a subtle active state. Never overflow horizontally.
export function FilterChips({ label, options, value, onChange }: FilterChipsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {label ? (
        <span className="mr-1 text-xs font-medium uppercase tracking-wide text-faint">
          {label}
        </span>
      ) : null}
      {options.map((opt) => {
        const active = opt === value
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cx(
              'rounded-full border px-2.5 py-1 text-xs transition-colors',
              active
                ? 'border-foreground bg-foreground text-primary-foreground'
                : 'border-border bg-card text-muted hover:bg-hover hover:text-foreground',
            )}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}
