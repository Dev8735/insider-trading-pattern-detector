'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Search, ScrollText, Eye, Zap, Trophy, BarChart3 } from 'lucide-react'
import { useApiStatus } from '@/context/ApiStatusContext'
import { Pill } from './RiskPill'
import { cx } from '@/lib/utils'

const NAV = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Stocks Explorer', href: '/stocks', icon: Search },
  { label: 'Quality Signals', href: '/quality-signals', icon: Zap },
  { label: 'Suitability', href: '/suitability', icon: Trophy },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Historical Log', href: '/history', icon: ScrollText },
]

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(href + '/')
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { connected, checking } = useApiStatus()

  return (
    <div className="flex h-full w-full flex-col bg-sidebar">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 pb-2 pt-5">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-primary-foreground">
          <Eye size={16} strokeWidth={1.75} />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-medium text-foreground">TradeWatch</p>
          <p className="text-xs text-faint">NSE · BSE monitor</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="mt-3 flex flex-1 flex-col gap-1 px-2">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cx(
                'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
                active
                  ? 'bg-hover font-medium text-foreground'
                  : 'text-muted hover:bg-hover hover:text-foreground',
              )}
            >
              <Icon size={17} strokeWidth={1.75} className="flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* API status pill */}
      <div className="px-3 pb-4 pt-2">
        {checking ? (
          <Pill color="gray">Checking…</Pill>
        ) : connected ? (
          <Pill color="green">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-pill-green-text)]" />
            API Connected
          </Pill>
        ) : (
          <Pill color="gray">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-pill-gray-text)]" />
            Demo Mode
          </Pill>
        )}
      </div>
    </div>
  )
}
