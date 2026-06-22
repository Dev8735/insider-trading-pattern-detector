'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import CandlestickChart from '@/components/CandlestickChart';
import AnomalyGauge from '@/components/AnomalyGauge';
import AnomalyTimeline from '@/components/AnomalyTimeline';
import {
  mockCandleData,
  mockAnomalySignals,
  dashboardStats,
} from '@/lib/mockData';
import {
  AlertTriangle, TrendingUp, BarChart3, Activity,
  ShieldAlert, Clock,
} from 'lucide-react';

function formatTimeAgo(date: Date) {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 10) return 'just now';
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  return `${mins}m ago`;
}

export default function Dashboard() {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiOnline, setApiOnline] = useState(true);
  const [timeAgoLabel, setTimeAgoLabel] = useState('just now');

  // Keep the "X ago" label ticking
  useEffect(() => {
    const id = setInterval(() => setTimeAgoLabel(formatTimeAgo(lastUpdated)), 1000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // TODO: replace with real fetchFlags() / fetchStockDetail() calls
      await new Promise((res) => setTimeout(res, 700));
      setApiOnline(true);
      setLastUpdated(new Date());
    } catch {
      setApiOnline(false);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const criticalCount = mockAnomalySignals.filter(
    (s) => s.confidence >= 0.8
  ).length;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e' }}>
      <Sidebar />
      <Header
        pageTitle="Dashboard"
        apiOnline={apiOnline}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />

      {/* Main Content */}
      <main
        style={{
          marginLeft: 'var(--sidebar-w, 240px)',
          paddingTop: '60px',
          paddingBottom: '2rem',
        }}
        className="dashboard-main"
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>

          {/* Title row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              marginTop: '2rem',
              marginBottom: '2rem',
            }}
          >
            <div>
              <h1 style={{
                fontSize: '28px', fontWeight: 600, color: '#f9fafb',
                margin: 0, letterSpacing: '-0.02em',
              }}>
                Dashboard
              </h1>
              <p style={{ color: '#6b7280', marginTop: '6px', fontSize: '13px' }}>
                Real-time monitoring of insider trading patterns across NSE &amp; BSE
              </p>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '11px', color: '#4b5563',
              background: '#111827', border: '1px solid #1f2937',
              padding: '6px 12px', borderRadius: '100px',
            }}>
              <Clock size={12} />
              Last updated {timeAgoLabel}
            </div>
          </div>

          {/* Stats Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            <StatCard
              label="Stocks Monitored"
              value={dashboardStats.totalStocksMonitored}
              change={2.5}
              icon={<BarChart3 size={18} />}
              color="primary"
              caption="vs last week"
              sparkline={[40, 42, 41, 44, 45, 46, 47]}
            />
            <StatCard
              label="Flagged Stocks"
              value={dashboardStats.flaggedStocks}
              change={-1.2}
              icon={<AlertTriangle size={18} />}
              color="orange"
              caption="vs last week"
              sparkline={[9, 8, 8, 7, 6, 7, 6]}
            />
            <StatCard
              label="Critical Alerts"
              value={dashboardStats.criticalAlerts}
              change={3.1}
              icon={<ShieldAlert size={18} />}
              color="red"
              caption="vs last week"
              sparkline={[2, 2, 3, 2, 4, 3, 4]}
            />
            <StatCard
              label="Anomalies Detected"
              value={dashboardStats.anomaliesDetected}
              change={5.4}
              icon={<Activity size={18} />}
              color="green"
              caption="vs last week"
              sparkline={[10, 12, 11, 14, 15, 17, 18]}
            />
          </div>

          {/* Charts Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: '1.25rem',
              alignItems: 'start',
            }}
            className="charts-grid"
          >
            {/* Main Chart */}
            <CandlestickChart
              data={mockCandleData}
              title="Stock Price &amp; Volume"
              ticker="RELIANCE.NS"
            />

            {/* Gauge */}
            <AnomalyGauge
              score={78}
              title="RELIANCE.NS"
              avr="3.2×"
              car="+9.1%"
              ifSignal="Anomaly"
              proximity="4 days"
            />
          </div>

          {/* Timeline */}
          <div style={{ marginTop: '1.25rem' }}>
            <AnomalyTimeline
              signals={mockAnomalySignals}
              title={`Recent Anomaly Signals${criticalCount > 0 ? ` · ${criticalCount} high-confidence` : ''}`}
            />
          </div>
        </div>
      </main>

      <style>{`
        @media (max-width: 1024px) {
          .charts-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 768px) {
          .dashboard-main {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}