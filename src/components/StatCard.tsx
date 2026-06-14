'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number;
  change?: number;
  icon?: React.ReactNode;
  color?: 'primary' | 'orange' | 'red' | 'green';
  prefix?: string;
  suffix?: string;
  caption?: string;
  sparkline?: number[];
}

const colorMap = {
  primary: { text: '#3b82f6', bg: '#3b82f614', border: '#3b82f630' },
  orange:  { text: '#f97316', bg: '#f9731614', border: '#f9731630' },
  red:     { text: '#ef4444', bg: '#ef444414', border: '#ef444430' },
  green:   { text: '#10b981', bg: '#10b98114', border: '#10b98130' },
};

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;
  const w = 80;
  const h = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  const polyline = pts.join(' ');
  const areaPath = `M ${pts[0]} L ${pts.join(' L ')} L ${w},${h} L 0,${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#sg-${color.replace('#','')})`} />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle
        cx={parseFloat(pts[pts.length - 1].split(',')[0])}
        cy={parseFloat(pts[pts.length - 1].split(',')[1])}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}

function useCountUp(target: number, duration = 900) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);

  return display;
}

export default function StatCard({
  label,
  value,
  change,
  icon,
  color = 'primary',
  prefix = '',
  suffix = '',
  caption = 'vs last week',
  sparkline,
}: StatCardProps) {
  const { text, bg, border } = colorMap[color];
  const displayValue = useCountUp(value);
  const isPositive = (change ?? 0) >= 0;
  const isNeutral = change === 0;

  const changeBg    = isNeutral ? '#6b728018' : isPositive ? '#10b98114' : '#ef444414';
  const changeColor = isNeutral ? '#6b7280'   : isPositive ? '#10b981'   : '#ef4444';

  return (
    <div
      style={{
        background: '#111827',
        border: `1px solid #1f2937`,
        borderRadius: '14px',
        padding: '1.1rem 1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = border;
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 1px ${border}`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = '#1f2937';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      {/* Subtle top accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: text, opacity: 0.6, borderRadius: '14px 14px 0 0' }} />

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
        <p style={{ fontSize: '11px', color: '#6b7280', letterSpacing: '0.07em', textTransform: 'uppercase', margin: 0, fontWeight: 500 }}>
          {label}
        </p>
        {icon && (
          <div style={{
            background: bg,
            border: `1px solid ${border}`,
            borderRadius: '8px',
            padding: '6px',
            color: text,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {icon}
          </div>
        )}
      </div>

      {/* Value row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
        <p style={{
          fontSize: '30px',
          fontWeight: 600,
          color: '#f9fafb',
          margin: 0,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
        }}>
          {prefix}{displayValue.toLocaleString()}{suffix}
        </p>
        {sparkline && (
          <div style={{ paddingBottom: '2px' }}>
            <Sparkline data={sparkline} color={text} />
          </div>
        )}
      </div>

      {/* Change badge + caption */}
      {change !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '0.75rem' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            background: changeBg,
            color: changeColor,
            fontSize: '11px',
            fontWeight: 600,
            padding: '3px 7px',
            borderRadius: '100px',
          }}>
            {isNeutral
              ? <Minus size={11} />
              : isPositive
                ? <TrendingUp size={11} />
                : <TrendingDown size={11} />
            }
            {isNeutral ? '0%' : isPositive ? `+${change}%` : `${change}%`}
          </span>
          <span style={{ fontSize: '11px', color: '#4b5563' }}>{caption}</span>
        </div>
      )}
    </div>
  );
}