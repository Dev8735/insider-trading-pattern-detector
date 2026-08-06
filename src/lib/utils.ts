import type { RiskTier } from './types'

// Format an ISO date (or "12 Jun 2026" string) as "12 Jun 2026".
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  // Already in display form
  if (/^\d{1,2}\s\w{3}\s\d{4}$/.test(value)) return value
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Maps a suspicion score (0-100) to a risk tier, matching the backend's tiers.
export function tierFromScore(score: number): RiskTier {
  if (score >= 85) return 'Critical'
  if (score >= 70) return 'High'
  if (score >= 50) return 'Medium'
  if (score >= 25) return 'Low'
  return 'Clean'
}

// Pastel pill classes for each risk tier — Notion "select property" style.
export function riskPillClasses(tier: RiskTier): string {
  switch (tier) {
    case 'Critical':
      return 'bg-[var(--color-pill-red-bg)] text-[var(--color-pill-red-text)]'
    case 'High':
      return 'bg-[var(--color-pill-orange-bg)] text-[var(--color-pill-orange-text)]'
    case 'Medium':
      return 'bg-[var(--color-pill-yellow-bg)] text-[var(--color-pill-yellow-text)]'
    case 'Low':
      return 'bg-[var(--color-pill-green-bg)] text-[var(--color-pill-green-text)]'
    default:
      return 'bg-[var(--color-pill-gray-bg)] text-[var(--color-pill-gray-text)]'
  }
}

export function exportToCSV(rows: Record<string, unknown>[], filename: string): void {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const csv = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const v = String(row[h] ?? '').replace(/"/g, '""')
          return v.includes(',') || v.includes('\n') ? `"${v}"` : v
        })
        .join(','),
    ),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
