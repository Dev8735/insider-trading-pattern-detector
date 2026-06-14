'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Menu, X, BarChart3, AlertTriangle, TrendingUp,
  Settings, Shield, ChevronRight, Activity, Bell,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number | string;
  badgeColor?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',     href: '/',         icon: BarChart3 },
  { label: 'Flagged Stocks', href: '/stocks',  icon: AlertTriangle, badge: 6, badgeColor: '#ef4444' },
  { label: 'Trends',        href: '/trends',   icon: TrendingUp },
  { label: 'Live Signals',  href: '/signals',  icon: Activity, badge: 'NEW', badgeColor: '#3b82f6' },
  { label: 'Alerts',        href: '/alerts',   icon: Bell, badge: 2, badgeColor: '#f59e0b' },
  { label: 'Settings',      href: '/settings', icon: Settings },
];

const MARKET_STATS = [
  { label: 'NIFTY 50',  value: '22,147', change: '+0.43%', up: true },
  { label: 'SENSEX',    value: '73,088', change: '-0.11%', up: false },
];

function NavLink({ item, collapsed, onClick }: { item: NavItem; collapsed: boolean; onClick?: () => void }) {
  const pathname = usePathname();
  const active = pathname === item.href;
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: collapsed ? '10px' : '9px 12px',
        borderRadius: '10px',
        textDecoration: 'none',
        justifyContent: collapsed ? 'center' : 'flex-start',
        position: 'relative',
        background: active ? '#3b82f618' : 'transparent',
        border: `1px solid ${active ? '#3b82f630' : 'transparent'}`,
        color: active ? '#3b82f6' : '#6b7280',
        transition: 'background 0.15s, color 0.15s, border-color 0.15s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLAnchorElement).style.background = '#111827';
          (e.currentTarget as HTMLAnchorElement).style.color = '#d1d5db';
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
          (e.currentTarget as HTMLAnchorElement).style.color = '#6b7280';
        }
      }}
    >
      {/* Active indicator bar */}
      {active && (
        <span style={{
          position: 'absolute', left: 0, top: '20%', bottom: '20%',
          width: '3px', borderRadius: '0 3px 3px 0',
          background: '#3b82f6',
        }} />
      )}

      <Icon size={17} style={{ flexShrink: 0 }} />

      {!collapsed && (
        <>
          <span style={{ fontSize: '13px', fontWeight: active ? 500 : 400, flex: 1 }}>
            {item.label}
          </span>
          {item.badge !== undefined && (
            <span style={{
              fontSize: '10px', fontWeight: 600,
              color: item.badgeColor ?? '#6b7280',
              background: `${item.badgeColor ?? '#6b7280'}18`,
              border: `1px solid ${item.badgeColor ?? '#6b7280'}35`,
              padding: '1px 6px', borderRadius: '100px',
              minWidth: '20px', textAlign: 'center',
            }}>
              {item.badge}
            </span>
          )}
          {active && <ChevronRight size={13} style={{ color: '#3b82f6', opacity: 0.6 }} />}
        </>
      )}

      {/* Collapsed badge dot */}
      {collapsed && item.badge !== undefined && (
        <span style={{
          position: 'absolute', top: '6px', right: '6px',
          width: '7px', height: '7px',
          background: item.badgeColor ?? '#6b7280',
          borderRadius: '50%',
          border: '1.5px solid #0a0f1e',
        }} />
      )}
    </Link>
  );
}

function SidebarContent({
  collapsed,
  onClose,
}: {
  collapsed: boolean;
  onClose?: () => void;
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#0a0f1e',
      borderRight: '1px solid #1f2937',
      width: collapsed ? '60px' : '240px',
      transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
      overflow: 'hidden',
    }}>

      {/* Logo */}
      <div style={{
        padding: collapsed ? '18px 0' : '18px 16px',
        borderBottom: '1px solid #1f2937',
        display: 'flex', alignItems: 'center',
        gap: '10px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        flexShrink: 0,
      }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '9px',
          background: '#3b82f618', border: '1px solid #3b82f640',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Shield size={17} color="#3b82f6" />
        </div>
        {!collapsed && (
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#f9fafb', margin: 0, lineHeight: 1.2 }}>
              TradeWatch
            </p>
            <p style={{ fontSize: '10px', color: '#4b5563', margin: 0, letterSpacing: '0.05em' }}>
              INSIDER DETECTOR
            </p>
          </div>
        )}
      </div>

      {/* Market pulse strip */}
      {!collapsed && (
        <div style={{
          padding: '10px 12px',
          borderBottom: '1px solid #1f2937',
          display: 'flex', gap: '8px',
          flexShrink: 0,
        }}>
          {MARKET_STATS.map(m => (
            <div key={m.label} style={{
              flex: 1,
              background: '#111827', border: '1px solid #1f2937',
              borderRadius: '8px', padding: '6px 8px',
            }}>
              <p style={{ fontSize: '9px', color: '#4b5563', margin: '0 0 2px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {m.label}
              </p>
              <p style={{ fontSize: '12px', color: '#f9fafb', margin: 0, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                {m.value}
              </p>
              <p style={{ fontSize: '10px', color: m.up ? '#10b981' : '#ef4444', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                {m.change}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Nav section label */}
      {!collapsed && (
        <p style={{
          fontSize: '9px', color: '#374151', letterSpacing: '0.1em',
          textTransform: 'uppercase', padding: '14px 16px 6px', margin: 0,
          flexShrink: 0,
        }}>
          Navigation
        </p>
      )}

      {/* Nav items */}
      <nav style={{
        flex: 1, padding: collapsed ? '8px 6px' : '4px 8px',
        display: 'flex', flexDirection: 'column', gap: '2px',
        overflowY: 'auto',
      }}>
        {NAV_ITEMS.map(item => (
          <NavLink key={item.href} item={item} collapsed={collapsed} onClick={onClose} />
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: collapsed ? '12px 6px' : '12px 12px',
        borderTop: '1px solid #1f2937',
        flexShrink: 0,
      }}>
        {!collapsed ? (
          <>
            {/* Session info */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: '#111827', border: '1px solid #1f2937',
              borderRadius: '10px', padding: '8px 10px', marginBottom: '10px',
            }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: '#3b82f618', border: '1px solid #3b82f630',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 600 }}>A</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '12px', fontWeight: 500, color: '#f9fafb', margin: 0 }}>Analyst</p>
                <p style={{ fontSize: '10px', color: '#4b5563', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  NSE · BSE Access
                </p>
              </div>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
            </div>
            <p style={{ fontSize: '10px', color: '#374151', margin: 0, textAlign: 'center' }}>
              TradeWatch v1.0 · © 2024
            </p>
          </>
        ) : (
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: '#3b82f618', border: '1px solid #3b82f630',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto',
          }}>
            <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 600 }}>A</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  const pathname = usePathname();
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(o => !o)}
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        style={{
          display: 'none',
          position: 'fixed', top: '14px', left: '14px', zIndex: 60,
          background: '#111827', border: '1px solid #1f2937',
          borderRadius: '9px', padding: '8px',
          cursor: 'pointer', color: '#9ca3af',
        }}
        className="mobile-hamburger"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Desktop sidebar */}
      <aside
        style={{
          position: 'fixed', left: 0, top: 0, height: '100vh',
          zIndex: 30, flexShrink: 0,
        }}
        className="desktop-sidebar"
      >
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            position: 'absolute', top: '22px', right: '-12px',
            width: '24px', height: '24px', borderRadius: '50%',
            background: '#111827', border: '1px solid #374151',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#6b7280', zIndex: 10,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#1f2937')}
          onMouseLeave={e => (e.currentTarget.style.background = '#111827')}
        >
          <ChevronRight
            size={13}
            style={{
              transition: 'transform 0.25s',
              transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
            }}
          />
        </button>
        <SidebarContent collapsed={collapsed} />
      </aside>

      {/* Mobile overlay + sidebar */}
      {mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(2px)',
              zIndex: 40,
            }}
          />
          <aside style={{
            position: 'fixed', left: 0, top: 0, height: '100vh', zIndex: 50,
          }}>
            <SidebarContent collapsed={false} onClose={() => setMobileOpen(false)} />
          </aside>
        </>
      )}

      <style>{`
        @media (max-width: 768px) {
          .mobile-hamburger { display: flex !important; }
          .desktop-sidebar { display: none !important; }
        }
      `}</style>
    </>
  );
}