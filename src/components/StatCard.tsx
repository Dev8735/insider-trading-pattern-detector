'use client';

import { ArrowUp, ArrowDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number;
  change?: number;
  icon?: React.ReactNode;
  color?: 'primary' | 'orange' | 'red' | 'green';
}

export default function StatCard({ label, value, change, icon, color = 'primary' }: StatCardProps) {
  const colorClasses = {
    primary: 'text-primary',
    orange: 'text-orange-400',
    red: 'text-red-400',
    green: 'text-green-400',
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-muted text-sm mb-1">{label}</p>
          <p className="text-2xl font-bold">{value.toLocaleString()}</p>
        </div>
        {icon && <div className={colorClasses[color]}>{icon}</div>}
      </div>
      {change !== undefined && (
        <div className="flex items-center gap-1 text-sm">
          {change >= 0 ? (
            <>
              <ArrowUp size={16} className="text-green-400" />
              <span className="text-green-400">+{change}%</span>
            </>
          ) : (
            <>
              <ArrowDown size={16} className="text-red-400" />
              <span className="text-red-400">{change}%</span>
            </>
          )}
          <span className="text-muted">vs last week</span>
        </div>
      )}
    </div>
  );
}
