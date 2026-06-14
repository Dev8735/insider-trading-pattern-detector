'use client';

import { AlertTriangle, TrendingUp, Volume2, Zap } from 'lucide-react';
import { AnomalySignal } from '@/lib/mockData';
import { formatDate } from '@/lib/utils';

interface AnomalyTimelineProps {
  signals: AnomalySignal[];
  title?: string;
}

export default function AnomalyTimeline({ signals, title }: AnomalyTimelineProps) {
  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'insider_buying':
        return <TrendingUp size={16} className="text-green-400" />;
      case 'insider_selling':
        return <TrendingUp size={16} className="text-red-400" />;
      case 'unusual_volume':
        return <Volume2 size={16} className="text-orange-400" />;
      case 'price_spike':
        return <Zap size={16} className="text-yellow-400" />;
      default:
        return <AlertTriangle size={16} />;
    }
  };

  const getSignalLabel = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="card">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <div className="space-y-4">
        {signals.length === 0 ? (
          <p className="text-muted text-sm">No signals detected</p>
        ) : (
          signals.map((signal, index) => (
            <div key={signal.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="p-2 bg-secondary rounded-full">
                  {getSignalIcon(signal.type)}
                </div>
                {index < signals.length - 1 && (
                  <div className="w-0.5 h-12 bg-border my-2" />
                )}
              </div>
              <div className="flex-1 pt-1">
                <div className="flex items-start justify-between mb-1">
                  <p className="font-medium">{getSignalLabel(signal.type)}</p>
                  <p className="text-xs text-muted">{formatDate(signal.date)}</p>
                </div>
                <p className="text-sm text-muted">{signal.description}</p>
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1 bg-secondary rounded-full flex-1">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${signal.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted">{(signal.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
