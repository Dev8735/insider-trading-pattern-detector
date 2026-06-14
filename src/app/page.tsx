'use client';

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
import { AlertTriangle, TrendingUp, BarChart3, Activity } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />

      {/* Main Content */}
      <main className="md:ml-60 pt-16 pb-8">
        <div className="container-md">
          {/* Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted mt-1">
              Real-time monitoring of insider trading patterns
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Stocks Monitored"
              value={dashboardStats.totalStocksMonitored}
              change={2.5}
              icon={<BarChart3 size={24} />}
              color="primary"
            />
            <StatCard
              label="Flagged Stocks"
              value={dashboardStats.flaggedStocks}
              change={-1.2}
              icon={<AlertTriangle size={24} />}
              color="orange"
            />
            <StatCard
              label="Critical Alerts"
              value={dashboardStats.criticalAlerts}
              change={3.1}
              icon={<TrendingUp size={24} />}
              color="red"
            />
            <StatCard
              label="Anomalies Detected"
              value={dashboardStats.anomaliesDetected}
              change={5.4}
              icon={<Activity size={24} />}
              color="green"
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Chart - 2 columns */}
            <div className="lg:col-span-2">
              <CandlestickChart
                data={mockCandleData}
                title="RELIANCE.NS - Stock Price & Volume"
              />
            </div>

            {/* Gauge - 1 column */}
            <div>
              <AnomalyGauge score={78} title="Anomaly Risk Score" />
            </div>
          </div>

          {/* Timeline */}
          <div className="mt-6">
            <AnomalyTimeline
              signals={mockAnomalySignals}
              title="Recent Anomaly Signals"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
