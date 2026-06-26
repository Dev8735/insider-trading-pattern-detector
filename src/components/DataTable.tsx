'use client'

import * as React from 'react'
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import { cx } from '@/lib/utils'

export interface Column<T> {
  key: string
  header: string
  // Render cell content.
  render: (row: T) => React.ReactNode
  // Value used for sorting (string | number). Omit to disable sorting.
  sortValue?: (row: T) => string | number
  // Show this column in the collapsed mobile view (max ~3 should be true).
  priority?: boolean
  align?: 'left' | 'right'
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  rowClassName?: (row: T) => string | undefined
  loading?: boolean
  emptyMessage?: string
  pageSize?: number
  initialSort?: { key: string; dir: 'asc' | 'desc' }
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  rowClassName,
  loading,
  emptyMessage = 'Nothing to show yet.',
  pageSize,
  initialSort,
}: DataTableProps<T>) {
  const [sort, setSort] = React.useState<{ key: string; dir: 'asc' | 'desc' } | null>(
    initialSort ?? null,
  )
  const [page, setPage] = React.useState(0)
  const [expanded, setExpanded] = React.useState<string | null>(null)

  const sorted = React.useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    if (!col?.sortValue) return rows
    const copy = [...rows]
    copy.sort((a, b) => {
      const av = col.sortValue!(a)
      const bv = col.sortValue!(b)
      if (av < bv) return sort.dir === 'asc' ? -1 : 1
      if (av > bv) return sort.dir === 'asc' ? 1 : -1
      return 0
    })
    return copy
  }, [rows, sort, columns])

  const pageCount = pageSize ? Math.ceil(sorted.length / pageSize) : 1
  const safePage = Math.min(page, Math.max(0, pageCount - 1))
  const paged = pageSize
    ? sorted.slice(safePage * pageSize, safePage * pageSize + pageSize)
    : sorted

  React.useEffect(() => {
    setPage(0)
  }, [sort, rows.length])

  function toggleSort(col: Column<T>) {
    if (!col.sortValue) return
    setSort((prev) => {
      if (prev?.key !== col.key) return { key: col.key, dir: 'desc' }
      if (prev.dir === 'desc') return { key: col.key, dir: 'asc' }
      return null
    })
  }

  const priorityCols = columns.filter((c) => c.priority)
  const mobileCols = priorityCols.length ? priorityCols : columns.slice(0, 3)

  if (loading) {
    return <TableSkeleton columns={columns} />
  }

  if (!sorted.length) {
    return (
      <div className="rounded-md border border-border bg-card px-4 py-12 text-center text-sm text-muted">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div>
      {/* Desktop / tablet table */}
      <div className="hidden overflow-hidden rounded-md border border-border bg-card md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-divider">
              {columns.map((col) => {
                const active = sort?.key === col.key
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={cx(
                      'px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-faint',
                      col.align === 'right' ? 'text-right' : 'text-left',
                    )}
                  >
                    {col.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col)}
                        className={cx(
                          'inline-flex items-center gap-1 transition-colors hover:text-foreground',
                          col.align === 'right' && 'flex-row-reverse',
                          active && 'text-foreground',
                        )}
                      >
                        {col.header}
                        {active ? (
                          sort!.dir === 'asc' ? (
                            <ChevronUp size={13} strokeWidth={2} />
                          ) : (
                            <ChevronDown size={13} strokeWidth={2} />
                          )
                        ) : (
                          <ChevronsUpDown size={13} strokeWidth={1.5} className="text-faint" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {paged.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cx(
                  'border-b border-divider last:border-0 transition-colors',
                  onRowClick && 'cursor-pointer',
                  'hover:bg-hover',
                  rowClassName?.(row),
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cx(
                      'px-4 py-3 text-foreground align-middle',
                      col.align === 'right' ? 'text-right' : 'text-left',
                      col.className,
                    )}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile collapsed list: priority columns + tap to expand */}
      <div className="overflow-hidden rounded-md border border-border bg-card md:hidden">
        {paged.map((row) => {
          const key = rowKey(row)
          const isOpen = expanded === key
          const hiddenCols = columns.filter((c) => !mobileCols.includes(c))
          return (
            <div key={key} className={cx('border-b border-divider last:border-0', rowClassName?.(row))}>
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : key)}
                className="flex w-full items-center gap-3 px-3 py-3 text-left"
              >
                {mobileCols.map((col, i) => (
                  <div
                    key={col.key}
                    className={cx(
                      'min-w-0 text-sm text-foreground',
                      i === 0 ? 'flex-1 font-medium' : 'flex-shrink-0',
                    )}
                  >
                    {col.render(row)}
                  </div>
                ))}
                <ChevronDown
                  size={16}
                  className={cx(
                    'flex-shrink-0 text-faint transition-transform',
                    isOpen && 'rotate-180',
                  )}
                />
              </button>
              {isOpen && hiddenCols.length > 0 && (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-divider bg-background px-3 py-3">
                  {hiddenCols.map((col) => (
                    <div key={col.key} className="min-w-0">
                      <dt className="text-xs uppercase tracking-wide text-faint">{col.header}</dt>
                      <dd className="mt-0.5 text-sm text-foreground">{col.render(row)}</dd>
                    </div>
                  ))}
                  {onRowClick && (
                    <div className="col-span-2 mt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRowClick(row)
                        }}
                        className="text-sm font-medium text-[var(--color-accent)]"
                      >
                        View details →
                      </button>
                    </div>
                  )}
                </dl>
              )}
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {pageSize && pageCount > 1 && (
        <div className="mt-3 flex items-center justify-between text-sm text-muted">
          <span>
            {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, sorted.length)} of{' '}
            {sorted.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="rounded border border-border px-2.5 py-1 transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="tabular-nums text-faint">
              {safePage + 1} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={safePage >= pageCount - 1}
              className="rounded border border-border px-2.5 py-1 transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function TableSkeleton<T>({ columns }: { columns: Column<T>[] }) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-card">
      <div className="border-b border-divider px-4 py-2.5">
        <div className="h-3 w-24 rounded shimmer" />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-divider px-4 py-3.5 last:border-0">
          {columns.map((c) => (
            <div key={c.key} className="h-4 flex-1 rounded shimmer" />
          ))}
        </div>
      ))}
    </div>
  )
}
