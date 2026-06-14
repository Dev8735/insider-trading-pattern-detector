'use client';

import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CandleDataPoint } from '@/lib/mockData';

interface CandlestickChartProps {
  data: CandleDataPoint[];
  title?: string;
}

export default function CandlestickChart({ data, title }: CandlestickChartProps) {
  // Transform candle data for recharts
  const chartData = data.map((d) => ({
    date: d.date.split('-').slice(1).join('-'),
    open: d.open,
    close: d.close,
    high: d.high,
    low: d.low,
    volume: d.volume / 1000000,
    isAnomaly: d.isAnomaly,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-secondary p-3 rounded-lg border border-border text-xs">
          <p className="text-muted">{data.date}</p>
          <p className="text-primary font-semibold">Open: ₹{data.open.toFixed(2)}</p>
          <p className="text-green-400">High: ₹{data.high.toFixed(2)}</p>
          <p className="text-red-400">Low: ₹{data.low.toFixed(2)}</p>
          <p className="text-primary font-semibold">Close: ₹{data.close.toFixed(2)}</p>
          <p className="text-muted">Vol: {data.volume.toFixed(1)}M</p>
          {data.isAnomaly && <p className="text-orange-400 font-semibold">⚠️ Anomaly Detected</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 18%)" />
          <XAxis
            dataKey="date"
            tick={{ fill: 'hsl(210, 10%, 30%)' }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: 'hsl(210, 10%, 30%)' }}
            label={{ value: 'Price (₹)', angle: -90, position: 'insideLeft' }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: 'hsl(210, 10%, 30%)' }}
            label={{ value: 'Volume (M)', angle: 90, position: 'insideRight' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            yAxisId="left"
            dataKey="close"
            fill="hsl(217, 100%, 50%)"
            radius={[4, 4, 0, 0]}
            name="Price"
          />
          <Bar
            yAxisId="right"
            dataKey="volume"
            fill="hsl(210, 20%, 25%)"
            opacity={0.3}
            name="Volume"
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="mt-4 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-primary" />
          <span className="text-muted">Price</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-orange-400" />
          <span className="text-muted">Anomalies</span>
        </div>
      </div>
    </div>
  );
}
