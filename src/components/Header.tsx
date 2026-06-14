'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, User, Search, ChevronDown, RefreshCw, Wifi, WifiOff, Clock } from 'lucide-react';

interface HeaderProps {
  pageTitle?: string;
  ticker?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  apiOnline?: boolean;
}

function useCurrentTime() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Asia/Kolkata',
      });
    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

const MOCK_NOTIFICATIONS = [
  { id: 1, title: 'RELIANCE — Score 84', sub: 'Crossed critical threshold', time: '2m ago', color: '#ef4444', unread: true },
  { id: 2, title: 'INFY — Volume spike 3.8×', sub: 'Unusual volume detected', time: '11m ago', color: '#f97316', unread: true },
  { id: 3, title: 'TCS — IF Anomaly flagged', sub: 'Isolation Forest signal', time: '34m ago', color: '#f59e0b', unread: false },
  { id: 4, title: 'WIPRO — CAR +9.1%', sub: 'Abnormal return vs Nifty50', time: '1h ago', color: '#3b82f6', unread: false },
];

const MOCK_SUGGESTIONS = ['RELIANCE.NS', 'INFY.NS', 'TCS.NS', 'HDFC.NS', 'WIPRO.NS', 'BAJFINANCE.NS'];

export default function Header({
  pageTitle = 'Dashboard',
  ticker,
  onRefresh,
  isRefreshing = false,
  apiOnline = true,
}: HeaderProps) {
  const time = useCurrentTime();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const unreadCount = MOCK_NOTIFICATIONS.filter(n => n.unread).length;
  const filtered = MOCK_SUGGESTIONS.filter(s =>
    s.toLowerCase().includes(searchVal.toLowerCase())
  );

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header style={{
      position: 'fixed',
      top: 0, right: 0, left: 0,
      marginLeft: 'var(--sidebar-w, 240px)',
      height: '60px',
      background: '#0d1117',
      borderBottom: '1px solid #1f2937',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.25rem',
      zIndex: 40,
      gap: '12px',
    }}>

      {/* Left — page title + breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        <span style={{ fontSize: '13px', color: '#4b5563', fontWeight: 400 }}>TradeWatch</span>
        <span style={{ color: '#1f2937', fontSize: '16px' }}>/</span>
        <span style={{ fontSize: '13px', color: '#f9fafb', fontWeight: 500, whiteSpace: 'nowrap' }}>
          {pageTitle}
        </span>
        {ticker && (
          <>
            <span style={{ color: '#1f2937', fontSize: '16px' }}>/</span>
            <span style={{
              fontSize: '12px', fontWeight: 600,
              color: '#3b82f6',
              background: '#3b82f614',
              border: '1px solid #3b82f630',
              padding: '2px 8px', borderRadius: '100px',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {ticker}
            </span>
          </>
        )}
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>

        {/* Live clock */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          fontSize: '11px', color: '#4b5563',
          background: '#111827', border: '1px solid #1f2937',
          padding: '4px 10px', borderRadius: '8px',
          fontVariantNumeric: 'tabular-nums',
        }}>
          <Clock size={11} />
          <span>{time}</span>
          <span style={{ color: '#374151' }}>IST</span>
        </div>

        {/* API status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          fontSize: '11px',
          color: apiOnline ? '#10b981' : '#ef4444',
          background: apiOnline ? '#10b98114' : '#ef444414',
          border: `1px solid ${apiOnline ? '#10b98130' : '#ef444430'}`,
          padding: '4px 10px', borderRadius: '8px',
        }}>
          {apiOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
          <span>{apiOnline ? 'API Live' : 'Offline'}</span>
        </div>

        {/* Search */}
        <div ref={searchRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setSearchOpen(o => !o)}
            style={iconBtnStyle(searchOpen)}
            aria-label="Search tickers"
          >
            <Search size={16} />
          </button>
          {searchOpen && (
            <div style={dropdownStyle(280)}>
              <input
                autoFocus
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                placeholder="Search ticker… e.g. INFY"
                style={{
                  width: '100%', background: '#0a0f1e',
                  border: '1px solid #374151', borderRadius: '8px',
                  padding: '7px 10px', fontSize: '12px', color: '#f9fafb',
                  outline: 'none', boxSizing: 'border-box', marginBottom: '6px',
                }}
              />
              {filtered.length === 0
                ? <p style={{ fontSize: '11px', color: '#4b5563', padding: '4px 2px' }}>No results</p>
                : filtered.map(s => (
                  <button key={s} onClick={() => { setSearchVal(''); setSearchOpen(false); }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      padding: '6px 8px', borderRadius: '6px', fontSize: '12px',
                      color: '#d1d5db',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#1f2937')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {s}
                  </button>
                ))
              }
            </div>
          )}
        </div>

        {/* Refresh */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            style={{ ...iconBtnStyle(false), opacity: isRefreshing ? 0.5 : 1 }}
            aria-label="Refresh data"
          >
            <RefreshCw size={15} style={{
              transition: 'transform 0.6s linear',
              transform: isRefreshing ? 'rotate(360deg)' : 'none',
              animation: isRefreshing ? 'spin 0.7s linear infinite' : 'none',
            }} />
          </button>
        )}

        {/* Notifications */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setNotifOpen(o => !o); setUserOpen(false); }}
            style={{ ...iconBtnStyle(notifOpen), position: 'relative' }}
            aria-label={`${unreadCount} unread notifications`}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '4px', right: '4px',
                width: '7px', height: '7px',
                background: '#ef4444', borderRadius: '50%',
                border: '1.5px solid #0d1117',
              }} />
            )}
          </button>
          {notifOpen && (
            <div style={dropdownStyle(300)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#f9fafb', margin: 0 }}>Alerts</p>
                <span style={{
                  fontSize: '10px', color: '#ef4444',
                  background: '#ef444418', padding: '1px 7px', borderRadius: '100px',
                }}>
                  {unreadCount} new
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {MOCK_NOTIFICATIONS.map(n => (
                  <div key={n.id} style={{
                    display: 'flex', gap: '10px', alignItems: 'flex-start',
                    padding: '8px', borderRadius: '8px',
                    background: n.unread ? '#111827' : 'transparent',
                    border: `1px solid ${n.unread ? '#1f2937' : 'transparent'}`,
                  }}>
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: n.color, flexShrink: 0, marginTop: '4px',
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '12px', fontWeight: 500, color: '#f9fafb', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.title}</p>
                      <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>{n.sub}</p>
                    </div>
                    <span style={{ fontSize: '10px', color: '#374151', flexShrink: 0 }}>{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div ref={userRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setUserOpen(o => !o); setNotifOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: userOpen ? '#1f2937' : 'transparent',
              border: '1px solid #1f2937',
              borderRadius: '8px', padding: '5px 10px 5px 6px',
              cursor: 'pointer', color: '#9ca3af',
              transition: 'background 0.15s',
            }}
            aria-label="User menu"
            onMouseEnter={e => { if (!userOpen) (e.currentTarget as HTMLButtonElement).style.background = '#111827'; }}
            onMouseLeave={e => { if (!userOpen) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: '#3b82f618', border: '1px solid #3b82f630',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#3b82f6',
            }}>
              <User size={13} />
            </div>
            <span style={{ fontSize: '12px', color: '#d1d5db', fontWeight: 500 }}>Analyst</span>
            <ChevronDown size={12} style={{
              transition: 'transform 0.2s',
              transform: userOpen ? 'rotate(180deg)' : 'none',
            }} />
          </button>
          {userOpen && (
            <div style={dropdownStyle(180)}>
              {[
                { label: 'Profile', sub: 'View your profile' },
                { label: 'Settings', sub: 'Preferences' },
                { label: 'Sign out', sub: '', danger: true },
              ].map(item => (
                <button key={item.label}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    padding: '7px 8px', borderRadius: '6px',
                    color: item.danger ? '#ef4444' : '#d1d5db',
                    fontSize: '12px',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#1f2937')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {item.label}
                  {item.sub && <span style={{ display: 'block', fontSize: '10px', color: '#4b5563', marginTop: '1px' }}>{item.sub}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </header>
  );
}

function iconBtnStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '34px', height: '34px', borderRadius: '8px',
    background: active ? '#1f2937' : 'transparent',
    border: '1px solid #1f2937',
    cursor: 'pointer', color: '#9ca3af',
    transition: 'background 0.15s, color 0.15s',
  };
}

function dropdownStyle(width: number): React.CSSProperties {
  return {
    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
    width: `${width}px`,
    background: '#0d1117',
    border: '1px solid #1f2937',
    borderRadius: '12px',
    padding: '10px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    zIndex: 100,
  };
}