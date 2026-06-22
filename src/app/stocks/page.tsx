'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { mockFlaggedStocks, FlaggedStock } from '@/lib/mockData';
import { formatDate, exportToCSV } from '@/lib/utils';
import {
  Download, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown,
  SlidersHorizontal, X, Search,
} from 'lucide-react';

type SortKey = 'symbol' | 'currentPrice' | 'anomalyScore' | 'lastAnomalyDate' | 'anomalyCount';
type SortDir = 'asc' | 'desc';

const RISK_STYLE: Record<string, { color: string; bg: string; border: string; row: string }> = {
  critical: { color: '#ef4444', bg: '#ef444418', border: '#ef444440', row: '#ef444408' },
  high:     { color: '#f97316', bg: '#f9731618', border: '#f9731640', row: '#f9731606' },
  medium:   { color: '#f59e0b', bg: '#f59e0b18', border: '#f59e0b40', row: 'transparent' },
  low:      { color: '#10b981', bg: '#10b98118', border: '#10b98140', row: 'transparent' },
};

function riskStyle(level: string) {
  return RISK_STYLE[level?.toLowerCase()] ?? RISK_STYLE.medium;
}

function scoreColor(score: number) {
  if (score >= 80) return '#ef4444';
  if (score >= 65) return '#f97316';
  if (score >= 40) return '#f59e0b';
  return '#10b981';
}

const DATE_PRESETS = [
  { label: 'All time', days: null },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 60 days', days: 60 },
  { label: 'Last 90 days', days: 90 },
];

export default function StocksPage() {
  const [scoreFilter, setScoreFilter] = useState<[number, number]>([0, 100]);
  const [datePreset, setDatePreset] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('anomalyScore');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [apiOnline] = useState(true);

  const cutoffDate = useMemo(() => {
    if (datePreset === null) return null;
    const d = new Date();
    d.setDate(d.getDate() - datePreset);
    return d.toISOString().slice(0, 10);
  }, [datePreset]);

  const filteredStocks = useMemo(() => {
    const list = mockFlaggedStocks.filter((stock) => {
      const scoreMatch =
        stock.anomalyScore >= scoreFilter[0] && stock.anomalyScore <= scoreFilter[1];
      const dateMatch = !cutoffDate || stock.lastAnomalyDate >= cutoffDate;
      const searchMatch =
        !search ||
        stock.symbol.toLowerCase().includes(search.toLowerCase()) ||
        stock.name.toLowerCase().includes(search.toLowerCase());
      return scoreMatch && dateMatch && searchMatch;
    });

    const sorted = [...list].sort((a, b) => {
      let av: string | number = a[sortKey];
      let bv: string | number = b[sortKey];
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [scoreFilter, cutoffDate, search, sortKey, sortDir]);

  const toggleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }, [sortKey]);

  const handleExportCSV = () => {
    const data = filteredStocks.map((stock) => ({
      Symbol: stock.symbol,
      Name: stock.name,
      Sector: stock.sector,
      'Current Price': `₹${stock.currentPrice}`,
      'Anomaly Score': stock.anomalyScore,
      'Risk Level': stock.riskLevel,
      'Last Anomaly': formatDate(stock.lastAnomalyDate),
      'Anomalies Count': stock.anomalyCount,
    }));
    exportToCSV(data, 'flagged-stocks.csv');
  };

  const activeFilterCount =
    (scoreFilter[0] !== 0 || scoreFilter[1] !== 100 ? 1 : 0) +
    (datePreset !== null ? 1 : 0) +
    (search ? 1 : 0);

  const resetFilters = () => {
    setScoreFilter([0, 100]);
    setDatePreset(null);
    setSearch('');
  };

  const SortHeader = ({ label, sortK, align = 'left' }: { label: string; sortK: SortKey; align?: 'left' | 'right' | 'center' }) => {
    const active = sortKey === sortK;
    return (
      <th
        onClick={() => toggleSort(sortK)}
        style={{
          textAlign: align,
          padding: '12px 16px',
          fontWeight: 600,
          fontSize: '11px',
          color: active ? '#3b82f6' : '#6b7280',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start' }}>
          {label}
          {active
            ? (sortDir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)
            : <ArrowUpDown size={11} style={{ opacity: 0.35 }} />}
        </span>
      </th>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e' }}>
      <Sidebar />
      <Header pageTitle="Flagged Stocks" apiOnline={apiOnline} />

      <main style={{ marginLeft: 'var(--sidebar-w, 240px)', paddingTop: '60px', paddingBottom: '2rem' }} className="stocks-main">
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>

          {/* Page header */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '12px',
            alignItems: 'flex-start', justifyContent: 'space-between',
            marginTop: '2rem', marginBottom: '1.5rem',
          }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#f9fafb', margin: 0, letterSpacing: '-0.02em' }}>
                Flagged Stocks
              </h1>
              <p style={{ color: '#6b7280', marginTop: '6px', fontSize: '13px' }}>
                Monitoring <span style={{ color: '#f9fafb', fontWeight: 500 }}>{filteredStocks.length}</span> suspicious trading pattern{filteredStocks.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              disabled={filteredStocks.length === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                background: '#111827', border: '1px solid #1f2937',
                color: '#d1d5db', fontSize: '13px', fontWeight: 500,
                padding: '9px 16px', borderRadius: '10px',
                cursor: filteredStocks.length === 0 ? 'not-allowed' : 'pointer',
                opacity: filteredStocks.length === 0 ? 0.5 : 1,
                transition: 'background 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => { if (filteredStocks.length) { e.currentTarget.style.background = '#1f2937'; e.currentTarget.style.borderColor = '#374151'; } }}
              onMouseLeave={e => { e.currentTarget.style.background = '#111827'; e.currentTarget.style.borderColor = '#1f2937'; }}
            >
              <Download size={15} />
              Export CSV
            </button>
          </div>

          {/* Filters */}
          <div style={{
            background: '#111827', border: '1px solid #1f2937',
            borderRadius: '14px', padding: '1.25rem', marginBottom: '1.25rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#f9fafb', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <SlidersHorizontal size={14} />
                Filters
                {activeFilterCount > 0 && (
                  <span style={{
                    fontSize: '10px', color: '#3b82f6', background: '#3b82f618',
                    border: '1px solid #3b82f640', padding: '1px 7px', borderRadius: '100px',
                  }}>
                    {activeFilterCount} active
                  </span>
                )}
              </h3>
              {activeFilterCount > 0 && (
                <button
                  onClick={resetFilters}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: '#6b7280', fontSize: '12px',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
                >
                  <X size={12} />
                  Clear all
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>

              {/* Search */}
              <div>
                <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '8px', letterSpacing: '0.04em' }}>
                  Search
                </label>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563' }} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Ticker or company name…"
                    style={{
                      width: '100%', background: '#0a0f1e', border: '1px solid #1f2937',
                      borderRadius: '8px', padding: '8px 10px 8px 32px', fontSize: '13px',
                      color: '#f9fafb', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Score range */}
              <div>
                <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '8px', letterSpacing: '0.04em' }}>
                  Anomaly Score Range
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="range" min="0" max="100" value={scoreFilter[0]}
                    onChange={(e) => setScoreFilter([Math.min(+e.target.value, scoreFilter[1]), scoreFilter[1]])}
                    style={{ flex: 1, accentColor: '#3b82f6' }}
                  />
                  <input
                    type="range" min="0" max="100" value={scoreFilter[1]}
                    onChange={(e) => setScoreFilter([scoreFilter[0], Math.max(+e.target.value, scoreFilter[0])])}
                    style={{ flex: 1, accentColor: '#3b82f6' }}
                  />
                </div>
                <p style={{ fontSize: '11px', color: '#3b82f6', marginTop: '6px', fontVariantNumeric: 'tabular-nums' }}>
                  {scoreFilter[0]} – {scoreFilter[1]}
                </p>
              </div>

              {/* Date preset pills */}
              <div>
                <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '8px', letterSpacing: '0.04em' }}>
                  Date Range
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {DATE_PRESETS.map((p) => {
                    const active = datePreset === p.days;
                    return (
                      <button
                        key={p.label}
                        onClick={() => setDatePreset(p.days)}
                        style={{
                          fontSize: '11px', fontWeight: 500,
                          padding: '6px 12px', borderRadius: '100px',
                          background: active ? '#3b82f618' : '#0a0f1e',
                          color: active ? '#3b82f6' : '#6b7280',
                          border: `1px solid ${active ? '#3b82f640' : '#1f2937'}`,
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div style={{
            background: '#111827', border: '1px solid #1f2937',
            borderRadius: '14px', overflow: 'hidden',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#0d1117', zIndex: 1, borderBottom: '1px solid #1f2937' }}>
                  <tr>
                    <SortHeader label="Stock" sortK="symbol" />
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sector</th>
                    <SortHeader label="Price" sortK="currentPrice" align="right" />
                    <SortHeader label="Score" sortK="anomalyScore" align="right" />
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Risk</th>
                    <SortHeader label="Last Alert" sortK="lastAnomalyDate" />
                    <SortHeader label="Count" sortK="anomalyCount" align="center" />
                    <th style={{ padding: '12px 16px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStocks.map((stock) => {
                    const rs = riskStyle(stock.riskLevel);
                    const sc = scoreColor(stock.anomalyScore);
                    return (
                      <tr
                        key={stock.symbol}
                        style={{
                          borderBottom: '1px solid #1f2937',
                          background: rs.row,
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#1f293750')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = rs.row)}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 600, color: '#f9fafb', fontFamily: 'var(--font-mono, monospace)' }}>{stock.symbol}</div>
                          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{stock.name}</div>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#6b7280' }}>{stock.sector}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', color: '#d1d5db', fontVariantNumeric: 'tabular-nums' }}>
                          ₹{stock.currentPrice.toLocaleString()}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <span style={{ fontWeight: 700, color: sc, fontVariantNumeric: 'tabular-nums', fontSize: '14px' }}>
                            {stock.anomalyScore}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            display: 'inline-block', fontSize: '11px', fontWeight: 600,
                            padding: '3px 10px', borderRadius: '100px',
                            color: rs.color, background: rs.bg, border: `1px solid ${rs.border}`,
                          }}>
                            {stock.riskLevel.charAt(0).toUpperCase() + stock.riskLevel.slice(1)}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: '12px' }}>
                          {formatDate(stock.lastAnomalyDate)}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', color: '#d1d5db', fontWeight: 500 }}>
                          {stock.anomalyCount}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <Link
                            href={`/stocks/${stock.symbol}`}
                            style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: '30px', height: '30px', borderRadius: '8px',
                              background: 'transparent', color: '#6b7280',
                              transition: 'background 0.15s, color 0.15s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#1f2937'; e.currentTarget.style.color = '#3b82f6'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}
                          >
                            <ChevronRight size={16} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredStocks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: '#4b5563' }}>
                <p style={{ fontSize: '13px', margin: '0 0 10px' }}>No stocks match the selected filters</p>
                <button
                  onClick={resetFilters}
                  style={{
                    fontSize: '12px', color: '#3b82f6', background: 'transparent',
                    border: '1px solid #3b82f640', borderRadius: '8px',
                    padding: '6px 14px', cursor: 'pointer',
                  }}
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .stocks-main { margin-left: 0 !important; }
        }
        input[type="range"] {
          height: 4px;
          -webkit-appearance: none;
          background: #1f2937;
          border-radius: 100px;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px; height: 14px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #0a0f1e;
        }
      `}</style>
    </div>
  );
}