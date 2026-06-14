'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Volume2, Zap, Clock } from 'lucide-react';
import { AnomalySignal } from '@/lib/mockData';
import { formatDate } from '@/lib/utils';

interface AnomalyTimelineProps {
  signals: AnomalySignal[];
  title?: string;
}

const signalConfig: Record<
  string,
  { icon: React.ReactNode; color: string; bg: string; border: string; label: string }
> = {
  insider_buying: {
    icon: <TrendingUp size={15} />,
    color: '#10b981',
    bg: '#10b98118',
    border: '#10b98140',
    label: 'Insider Buying',
  },
  insider_selling: {
    icon: <TrendingDown size={15} />,
    color: '#ef4444',
    bg: '#ef444418',
    border: '#ef444440',
    label: 'Insider Selling',
  },
  unusual_volume: {
    icon: <Volume2 size={15} />,
    color: '#f97316',
    bg: '#f9731618',
    border: '#f9731640',
    label: 'Unusual Volume',
  },
  price_spike: {
    icon: <Zap size={15} />,
    color: '#eab308',
    bg: '#eab30818',
    border: '#eab30840',
    label: 'Price Spike',
  },
};

const fallbackConfig = {
  icon: <AlertTriangle size={15} />,
  color: '#6b7280',
  bg: '#6b728018',
  border: '#6b728040',
  label: 'Unknown Signal',
};

function getConfig(type: string) {
  return signalConfig[type] ?? { ...fallbackConfig, label: type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') };
}

function ConfidenceBar({ confidence, color }: { confidence: number; color: string }) {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setWidth(confidence * 100); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [confidence]);

  const pct = Math.round(confidence * 100);
  const confidenceLabel = pct >= 80 ? 'High' : pct >= 50 ? 'Medium' : 'Low';

  return (
    <div ref={ref} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
      <div style={{ flex: 1, height: '4px', background: '#1f2937', borderRadius: '100px', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${width}%`,
            background: color,
            borderRadius: '100px',
            transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>
      <span style={{ fontSize: '10px', color, fontWeight: 600, minWidth: '28px', fontVariantNumeric: 'tabular-nums' }}>
        {pct}%
      </span>
      <span style={{
        fontSize: '10px',
        color,
        background: `${color}18`,
        border: `1px solid ${color}30`,
        padding: '1px 7px',
        borderRadius: '100px',
        fontWeight: 500,
      }}>
        {confidenceLabel}
      </span>
    </div>
  );
}

export default function AnomalyTimeline({ signals, title }: AnomalyTimelineProps) {
  const [visible, setVisible] = useState<Set<number>>(new Set());

  useEffect(() => {
    signals.forEach((_, i) => {
      setTimeout(() => setVisible(prev => new Set([...prev, i])), i * 80);
    });
  }, [signals]);

  if (signals.length === 0) {
    return (
      <div style={{
        background: '#111827',
        border: '1px solid #1f2937',
        borderRadius: '14px',
        padding: '1.5rem 1.25rem',
      }}>
        {title && <h3 style={{ fontSize: '15px', fontWeight: 500, color: '#f9fafb', margin: '0 0 1rem' }}>{title}</h3>}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 0', gap: '10px' }}>
          <AlertTriangle size={28} color="#374151" />
          <p style={{ fontSize: '13px', color: '#4b5563', margin: 0 }}>No signals detected</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: '#111827',
      border: '1px solid #1f2937',
      borderRadius: '14px',
      padding: '1.25rem',
    }}>
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 500, color: '#f9fafb', margin: 0 }}>{title}</h3>
          <span style={{
            fontSize: '11px',
            color: '#6b7280',
            background: '#1f2937',
            border: '1px solid #374151',
            padding: '3px 10px',
            borderRadius: '100px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}>
            <Clock size={11} />
            {signals.length} signal{signals.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {signals.map((signal, index) => {
          const cfg = getConfig(signal.type);
          const isLast = index === signals.length - 1;
          const isVis = visible.has(index);

          return (
            <div
              key={signal.id}
              style={{
                display: 'flex',
                gap: '14px',
                opacity: isVis ? 1 : 0,
                transform: isVis ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 0.35s ease, transform 0.35s ease',
              }}
            >
              {/* Left rail */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: cfg.bg,
                  border: `1px solid ${cfg.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: cfg.color,
                  flexShrink: 0,
                  zIndex: 1,
                }}>
                  {cfg.icon}
                </div>
                {!isLast && (
                  <div style={{
                    width: '1px',
                    flex: 1,
                    minHeight: '24px',
                    background: 'linear-gradient(to bottom, #374151, transparent)',
                    margin: '4px 0',
                  }} />
                )}
              </div>

              {/* Content */}
              <div style={{
                flex: 1,
                paddingBottom: isLast ? 0 : '1.25rem',
                paddingTop: '4px',
              }}>
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: '#f9fafb', margin: 0 }}>
                      {cfg.label}
                    </p>
                    <span style={{
                      fontSize: '10px',
                      color: cfg.color,
                      background: cfg.bg,
                      border: `1px solid ${cfg.border}`,
                      padding: '1px 7px',
                      borderRadius: '100px',
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                    }}>
                      {signal.type.includes('selling') || signal.type.includes('spike')
                        ? 'BEARISH'
                        : signal.type.includes('buying')
                          ? 'BULLISH'
                          : 'ALERT'}
                    </span>
                  </div>
                  <p style={{
                    fontSize: '10px',
                    color: '#4b5563',
                    margin: 0,
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    <Clock size={10} />
                    {formatDate(signal.date)}
                  </p>
                </div>

                {/* Description */}
                <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, lineHeight: 1.6 }}>
                  {signal.description}
                </p>

                {/* Confidence bar */}
                <ConfidenceBar confidence={signal.confidence} color={cfg.color} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}