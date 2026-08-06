'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X, Eye } from 'lucide-react'
import { Sidebar } from './Sidebar'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()

  // Close the mobile drawer on navigation.
  React.useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Lock body scroll while the drawer is open.
  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 flex-shrink-0 border-r border-border md:block">
        <Sidebar />
      </aside>

      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-12 items-center gap-2 border-b border-border bg-background px-3 md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted transition-colors hover:bg-hover"
        >
          <Menu size={16} strokeWidth={1.75} />
        </button>
        <span className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-foreground text-primary-foreground">
            <Eye size={12} strokeWidth={1.75} />
          </span>
          <span className="text-xs font-medium text-foreground">TradeWatch</span>
        </span>
      </header>

      {/* Mobile slide-over drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-foreground/20"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-0 h-full w-64 border-r border-border shadow-lg">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute right-2 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-hover"
            >
              <X size={18} strokeWidth={1.75} />
            </button>
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="min-w-0 flex-1 px-3 pb-12 pt-16 sm:px-4 md:px-10 md:pt-10 lg:px-14">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
    </div>
  )
}
