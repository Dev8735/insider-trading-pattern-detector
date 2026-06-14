'use client';

import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import CandlestickChart from '@/components/CandlestickChart';
import AnomalyGauge from '@/components/AnomalyGauge';
import AnomalyTimeline from '@/components/AnomalyTimeline';
import { mockCandleData, getStockDetail, mockFlaggedStocks } from '@/lib/mockData';
import { getRiskTextClass, formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PageProps {
  params: Promise<{ symbol: string }>;
}

export default async function StockDetailPage({ params }: PageProps) {
  const { symbol } = await params;
  const stock = getStockDetail(symbol);
  const flaggedStock = mockFlaggedStocks.find((s) => s.symbol === symbol);

  if (!flaggedStock) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <Header />
        <main className="md:ml-60 pt-16 pb-8">
          <div className="container-md">
            <Link href="/stocks" className="flex items-center gap-2 text-primary hover:underline mb-8">
              <ArrowLeft size={20} />
              Back to Stocks
            </Link>
            <p className="text-muted">Stock not found</p>
          </div>
        </main>
      </div>
    );
  }

  // Prepare signal breakdown data
  const signalBreakdown = [
    { name: 'Insider Buying', value: stock.signals.filter((s) => s.type === 'insider_buying').length },
    { name: 'Insider Selling', value: stock.signals.filter((s) => s.type === 'insider_selling').length },
    { name: 'Unusual Volume', value: stock.signals.filter((s) => s.type === 'unusual_volume').length },
    { name: 'Price Spike', value: stock.signals.filter((s) => s.type === 'price_spike').length },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />

      <main className="md:ml-60 pt-16 pb-8">
        <div className="container-md">
          {/* Back Button */}
          <Link href="/stocks" className="flex items-center gap-2 text-primary hover:underline mb-8">
            <ArrowLeft size={20} />
            Back to Stocks
          </Link>

          {/* Stock Header */}
          <div className="card mb-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold">{stock.symbol}</h1>
                <p className="text-muted mt-1">{stock.name}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">₹{stock.currentPrice.toLocaleString()}</div>
                <div className="flex items-center justify-end gap-2 mt-1">
                  {stock.priceChange >= 0 ? (
                    <>
                      <TrendingUp size={16} className="text-green-400" />
                      <span className="text-green-400">+₹{stock.priceChange.toFixed(2)}</span>
                      <span className="text-green-400">(+{stock.priceChangePercent.toFixed(2)}%)</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown size={16} className="text-red-400" />
                      <span className="text-red-400">₹{stock.priceChange.toFixed(2)}</span>
                      <span className="text-red-400">({stock.priceChangePercent.toFixed(2)}%)</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Stock Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-border">
              <div>
                <p className="text-muted text-xs mb-1">Sector</p>
                <p className="font-semibold">{stock.sector}</p>
              </div>
              <div>
                <p className="text-muted text-xs mb-1">Risk Level</p>
                <p className={`font-semibold ${getRiskTextClass(stock.riskLevel)}`}>
                  {stock.riskLevel.charAt(0).toUpperCase() + stock.riskLevel.slice(1)}
                </p>
              </div>
              <div>
                <p className="text-muted text-xs mb-1">Anomaly Score</p>
                <p className={`font-semibold ${getRiskTextClass(stock.riskLevel)}`}>
                  {stock.anomalyScore}
                </p>
              </div>
              <div>
                <p className="text-muted text-xs mb-1">Signal Count</p>
                <p className="font-semibold">{stock.signals.length}</p>
              </div>
            </div>

            {/* Description */}
            <p className="mt-6 text-muted">{stock.description}</p>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Candlestick Chart */}
            <div className="lg:col-span-2">
              <CandlestickChart data={mockCandleData} title="Price & Volume" />
            </div>

            {/* Gauge */}
            <div>
              <AnomalyGauge score={stock.anomalyScore} title="Risk Score" />
            </div>
          </div>

          {/* Signal Breakdown */}
          <div className="card mb-6">
            <h3 className="text-lg font-semibold mb-4">Signal Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={signalBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 18%)" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(210, 10%, 30%)' }} />
                <YAxis tick={{ fill: 'hsl(210, 10%, 30%)' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(210, 20%, 12%)',
                    border: '1px solid hsl(210, 20%, 18%)',
                  }}
                />
                <Bar dataKey="value" fill="hsl(217, 100%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Anomaly Timeline */}
          <div className="mb-6">
            <AnomalyTimeline signals={stock.signals} title="Anomaly Signals" />
          </div>

          {/* Insider Disclosures */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Insider Disclosures</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left p-4 font-semibold">Name</th>
                    <th className="text-left p-4 font-semibold">Relationship</th>
                    <th className="text-left p-4 font-semibold">Type</th>
                    <th className="text-right p-4 font-semibold">Quantity</th>
                    <th className="text-right p-4 font-semibold">Price</th>
                    <th className="text-right p-4 font-semibold">Value</th>
                    <th className="text-left p-4 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stock.disclosures.map((disclosure) => (
                    <tr key={disclosure.id} className="border-b border-border hover:bg-secondary transition-colors">
                      <td className="p-4 font-semibold">{disclosure.name}</td>
                      <td className="p-4 text-muted text-xs">{disclosure.relationship}</td>
                      <td className="p-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            disclosure.type === 'buy' ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {disclosure.type === 'buy' ? 'BUY' : 'SELL'}
                        </span>
                      </td>
                      <td className="p-4 text-right">{disclosure.quantity.toLocaleString()}</td>
                      <td className="p-4 text-right">₹{disclosure.price.toLocaleString()}</td>
                      <td className="p-4 text-right font-semibold">
                        {formatCurrency(disclosure.value)}
                      </td>
                      <td className="p-4 text-muted text-xs">{formatDate(disclosure.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
