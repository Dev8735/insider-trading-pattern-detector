'use client';

import { useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { mockFlaggedStocks, FlaggedStock } from '@/lib/mockData';
import { getRiskTextClass, formatDate, exportToCSV } from '@/lib/utils';
import { Download, ChevronRight } from 'lucide-react';

export default function StocksPage() {
  const [scoreFilter, setScoreFilter] = useState<[number, number]>([0, 100]);
  const [dateRange, setDateRange] = useState<string>('');

  const filteredStocks = mockFlaggedStocks.filter((stock) => {
    const scoreMatch =
      stock.anomalyScore >= scoreFilter[0] && stock.anomalyScore <= scoreFilter[1];
    const dateMatch = !dateRange || stock.lastAnomalyDate >= dateRange;
    return scoreMatch && dateMatch;
  });

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

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />

      <main className="md:ml-60 pt-16 pb-8">
        <div className="container-md">
          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Flagged Stocks</h1>
              <p className="text-muted mt-1">
                Monitoring {filteredStocks.length} suspicious trading patterns
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="btn btn-secondary flex items-center gap-2 w-fit"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>

          {/* Filters */}
          <div className="card mb-6">
            <h3 className="font-semibold mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted block mb-2">
                  Anomaly Score Range
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={scoreFilter[0]}
                    onChange={(e) =>
                      setScoreFilter([parseInt(e.target.value), scoreFilter[1]])
                    }
                    className="flex-1"
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={scoreFilter[1]}
                    onChange={(e) =>
                      setScoreFilter([scoreFilter[0], parseInt(e.target.value)])
                    }
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted mt-2">
                  {scoreFilter[0]} - {scoreFilter[1]}
                </p>
              </div>
              <div>
                <label className="text-sm text-muted block mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left p-4 font-semibold">Stock</th>
                  <th className="text-left p-4 font-semibold">Sector</th>
                  <th className="text-right p-4 font-semibold">Price</th>
                  <th className="text-right p-4 font-semibold">Score</th>
                  <th className="text-left p-4 font-semibold">Risk</th>
                  <th className="text-left p-4 font-semibold">Last Alert</th>
                  <th className="text-center p-4 font-semibold">Count</th>
                  <th className="text-center p-4"></th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map((stock) => (
                  <tr
                    key={stock.symbol}
                    className="border-b border-border hover:bg-secondary transition-colors"
                  >
                    <td className="p-4">
                      <div className="font-semibold">{stock.symbol}</div>
                      <div className="text-xs text-muted">{stock.name}</div>
                    </td>
                    <td className="p-4 text-muted">{stock.sector}</td>
                    <td className="p-4 text-right">₹{stock.currentPrice.toLocaleString()}</td>
                    <td className="p-4 text-right font-semibold">
                      <span className={getRiskTextClass(stock.riskLevel)}>
                        {stock.anomalyScore}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getRiskTextClass(
                          stock.riskLevel
                        )}`}
                      >
                        {stock.riskLevel.charAt(0).toUpperCase() +
                          stock.riskLevel.slice(1)}
                      </span>
                    </td>
                    <td className="p-4 text-muted text-xs">
                      {formatDate(stock.lastAnomalyDate)}
                    </td>
                    <td className="p-4 text-center font-semibold">
                      {stock.anomalyCount}
                    </td>
                    <td className="p-4 text-center">
                      <Link
                        href={`/stocks/${stock.symbol}`}
                        className="inline-flex items-center justify-center w-8 h-8 hover:bg-secondary rounded-lg transition-colors"
                      >
                        <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredStocks.length === 0 && (
              <div className="text-center py-8 text-muted">
                No stocks match the selected filters
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
