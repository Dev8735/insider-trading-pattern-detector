'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface AnomalyGaugeProps {
  score: number;
  title?: string;
}

export default function AnomalyGauge({ score, title }: AnomalyGaugeProps) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'hsl(0, 100%, 50%)';
    if (s >= 60) return 'hsl(38, 100%, 50%)';
    if (s >= 40) return 'hsl(38, 92%, 50%)';
    if (s >= 20) return 'hsl(142, 71%, 45%)';
    return 'hsl(210, 20%, 30%)';
  };

  const getRiskLabel = (s: number) => {
    if (s >= 80) return 'CRITICAL';
    if (s >= 60) return 'HIGH';
    if (s >= 40) return 'MEDIUM';
    if (s >= 20) return 'LOW';
    return 'NONE';
  };

  const data = [
    { name: 'Score', value: score },
    { name: 'Remaining', value: 100 - score },
  ];

  return (
    <div className="card flex flex-col items-center">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            fill="#8884d8"
            paddingAngle={2}
            dataKey="value"
            startAngle={180}
            endAngle={0}
          >
            <Cell fill={getScoreColor(score)} />
            <Cell fill="hsl(210, 20%, 20%)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 text-center">
        <p className="text-4xl font-bold" style={{ color: getScoreColor(score) }}>
          {score}
        </p>
        <p className="text-muted text-sm mt-1">Anomaly Score</p>
        <p className="mt-3 px-3 py-1 rounded-full text-xs font-semibold inline-block" style={{ backgroundColor: getScoreColor(score), color: 'white' }}>
          {getRiskLabel(score)} RISK
        </p>
      </div>
    </div>
  );
}
