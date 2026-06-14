'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';
import { CandleDataPoint } from '@/lib/mockData';

interface CandlestickChartProps {
  data: CandleDataPoint[];
  title?: string;
  ticker?: string;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  point: CandleDataPoint & { dateLabel: string; volumeM: number } | null;
}

const CHART_H = 240;
const VOL_H = 60;
const GAP = 12;
const TOTAL_H = CHART_H + GAP + VOL_H;
const PAD = { top: 16, right: 16, bottom: 8, left: 58 };

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export default function CandlestickChart({ data, title, ticker }: CandlestickChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [svgW, setSvgW] = useState(600);
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, point: null });
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const obs = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width;
      if (w) setSvgW(w);
    });
    if (wrapRef.current) obs.observe(wrapRef.current);
    return () => obs.disconnect();
  }, []);

  if (!data || data.length === 0) {
    return (
      <div style={cardStyle}>
        <p style={{ color: '#4b5563', fontSize: '13px', textAlign: 'center', padding: '3rem 0' }}>No chart data available</p>
      </div>
    );
  }

  const chartData = data.map(d => ({
    ...d,
    dateLabel: d.date.split('-').slice(1).join('/'),
    volumeM: +(d.volume / 1_000_000).toFixed(2),
  }));

  const innerW = svgW - PAD.left - PAD.right;
  const n = chartData.length;
  const candleW = clamp(Math.floor(innerW / n) - 2, 3, 18);
  const candleSpacing = innerW / n;

  const prices = chartData.flatMap(d => [d.high, d.low]);
  const priceMin = Math.min(...prices);
  const priceMax = Math.max(...prices);
  const pricePad = (priceMax - priceMin) * 0.06;
  const pMin = priceMin - pricePad;
  const pMax = priceMax + pricePad;

  const vols = chartData.map(d => d.volumeM);
  const volMax = Math.max(...vols) * 1.1;

  const px = (i: number) => PAD.left + i * candleSpacing + candleSpacing / 2;
  const py = (price: number) => PAD.top + ((pMax - price) / (pMax - pMin)) * CHART_H;
  const vy = (vol: number) => PAD.top + CHART_H + GAP + VOL_H - (vol / volMax) * VOL_H;

  // Y-axis ticks
  const yTicks = 5;
  const yTickVals = Array.from({ length: yTicks }, (_, i) =>
    pMin + (i / (yTicks - 1)) * (pMax - pMin)
  );

  // X-axis: show every nth label to avoid crowding
  const xStep = Math.ceil(n / 8);

  const bullCount = chartData.filter(d => d.close >= d.open).length;
  const bearCount = n - bullCount;
  const anomalyCount = chartData.filter(d => d.isAnomaly).length;
  const lastClose = chartData[n - 1]?.close ?? 0;
  const firstClose = chartData[0]?.close ?? 0;
  const totalChange = firstClose ? ((lastClose - firstClose) / firstClose) * 100 : 0;
  const isUp = totalChange >= 0;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left - PAD.left;
    const i = Math.round(mouseX / candleSpacing - 0.5);
    if (i < 0 || i >= n) { setTooltip(t => ({ ...t, visible: false })); setHoverIdx(null); return; }
    const d = chartData[i];
    const x = px(i);
    const y = py((d.high + d.low) / 2);
    setHoverIdx(i);
    setTooltip({ visible: true, x, y, point: d });
  };

  const handleMouseLeave = () => {
    setTooltip(t => ({ ...t, visible: false }));
    setHoverIdx(null);
  };

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          {title && <h3 style={{ fontSize: '15px', fontWeight: 500, color: '#f9fafb', margin: '0 0 4px' }}>{title}</h3>}
          {ticker && <p style={{ fontSize: '11px', color: '#6b7280', margin: 0, letterSpacing: '0.06em' }}>{ticker}</p>}
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Chip color="#10b981">{bullCount} Bull</Chip>
          <Chip color="#ef4444">{bearCount} Bear</Chip>
          {anomalyCount > 0 && <Chip color="#f97316">⚠ {anomalyCount} Anomal{anomalyCount === 1 ? 'y' : 'ies'}</Chip>}
          <Chip color={isUp ? '#10b981' : '#ef4444'}>
            {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {totalChange >= 0 ? '+' : ''}{totalChange.toFixed(2)}%
          </Chip>
        </div>
      </div>

      {/* SVG Chart */}
      <div ref={wrapRef} style={{ width: '100%', position: 'relative' }}>
        <svg
          ref={svgRef}
          width="100%"
          height={TOTAL_H + PAD.top + PAD.bottom + 24}
          viewBox={`0 0 ${svgW} ${TOTAL_H + PAD.top + PAD.bottom + 24}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ display: 'block', cursor: 'crosshair' }}
          role="img"
          aria-label={`Candlestick chart for ${ticker ?? 'stock'} with ${n} trading days`}
        >
          {/* Grid lines */}
          {yTickVals.map((v, i) => (
            <line
              key={i}
              x1={PAD.left} y1={py(v)}
              x2={svgW - PAD.right} y2={py(v)}
              stroke="#1f2937" strokeWidth="1" strokeDasharray="3 3"
            />
          ))}

          {/* Y-axis labels */}
          {yTickVals.map((v, i) => (
            <text key={i} x={PAD.left - 6} y={py(v)} textAnchor="end" dominantBaseline="central"
              fontSize="10" fill="#4b5563">
              ₹{v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}
            </text>
          ))}

          {/* Y-axis label */}
          <text
            x={12} y={PAD.top + CHART_H / 2}
            textAnchor="middle" dominantBaseline="central"
            fontSize="10" fill="#4b5563"
            transform={`rotate(-90, 12, ${PAD.top + CHART_H / 2})`}
          >
            Price (₹)
          </text>

          {/* Volume axis label */}
          <text
            x={12} y={PAD.top + CHART_H + GAP + VOL_H / 2}
            textAnchor="middle" dominantBaseline="central"
            fontSize="10" fill="#374151"
            transform={`rotate(-90, 12, ${PAD.top + CHART_H + GAP + VOL_H / 2})`}
          >
            Vol
          </text>

          {/* Hover crosshair vertical */}
          {hoverIdx !== null && (
            <line
              x1={px(hoverIdx)} y1={PAD.top}
              x2={px(hoverIdx)} y2={PAD.top + CHART_H + GAP + VOL_H}
              stroke="#374151" strokeWidth="1" strokeDasharray="4 3"
            />
          )}

          {/* Candles */}
          {chartData.map((d, i) => {
            const bull = d.close >= d.open;
            const color = d.isAnomaly ? '#f97316' : bull ? '#10b981' : '#ef4444';
            const bodyTop = py(Math.max(d.open, d.close));
            const bodyBot = py(Math.min(d.open, d.close));
            const bodyH = Math.max(bodyBot - bodyTop, 1);
            const cx = px(i);
            const isHovered = hoverIdx === i;

            return (
              <g key={d.date} style={{ transition: 'opacity 0.15s' }} opacity={hoverIdx !== null && !isHovered ? 0.4 : 1}>
                {/* Wick */}
                <line x1={cx} y1={py(d.high)} x2={cx} y2={py(d.low)}
                  stroke={color} strokeWidth={1.5} />
                {/* Body */}
                <rect
                  x={cx - candleW / 2}
                  y={bodyTop}
                  width={candleW}
                  height={bodyH}
                  fill={bull ? color : 'transparent'}
                  stroke={color}
                  strokeWidth={bull ? 0 : 1.5}
                  rx={1}
                />
                {/* Anomaly marker */}
                {d.isAnomaly && mounted && (
                  <>
                    <circle cx={cx} cy={py(d.high) - 10} r="5" fill="#f97316" opacity={0.9} />
                    <text x={cx} y={py(d.high) - 10} textAnchor="middle" dominantBaseline="central"
                      fontSize="7" fill="white" fontWeight="bold">!</text>
                  </>
                )}
              </g>
            );
          })}

          {/* Volume bars */}
          {chartData.map((d, i) => {
            const bull = d.close >= d.open;
            const color = d.isAnomaly ? '#f9731640' : bull ? '#10b98130' : '#ef444430';
            const borderColor = d.isAnomaly ? '#f97316' : bull ? '#10b981' : '#ef4444';
            const barH = VOL_H - (vy(d.volumeM) - (PAD.top + CHART_H + GAP));
            return (
              <rect
                key={`vol-${d.date}`}
                x={px(i) - candleW / 2}
                y={vy(d.volumeM)}
                width={candleW}
                height={Math.max(barH, 1)}
                fill={color}
                stroke={borderColor}
                strokeWidth={0.5}
                rx={1}
                opacity={hoverIdx !== null && hoverIdx !== i ? 0.4 : 1}
              />
            );
          })}

          {/* Volume separator line */}
          <line
            x1={PAD.left} y1={PAD.top + CHART_H + GAP}
            x2={svgW - PAD.right} y2={PAD.top + CHART_H + GAP}
            stroke="#1f2937" strokeWidth="1"
          />

          {/* X-axis labels */}
          {chartData.map((d, i) => {
            if (i % xStep !== 0 && i !== n - 1) return null;
            return (
              <text
                key={`xl-${i}`}
                x={px(i)} y={PAD.top + TOTAL_H + 16}
                textAnchor="middle" fontSize="9" fill="#4b5563"
              >
                {d.dateLabel}
              </text>
            );
          })}
        </svg>

        {/* Tooltip */}
        {tooltip.visible && tooltip.point && (() => {
          const d = tooltip.point;
          const bull = d.close >= d.open;
          const ttW = 148;
          const rawX = (tooltip.x / svgW) * 100;
          const leftPct = rawX > 65 ? undefined : `${rawX}%`;
          const rightPct = rawX > 65 ? `${100 - rawX}%` : undefined;

          return (
            <div style={{
              position: 'absolute',
              top: `${clamp((tooltip.y / (TOTAL_H + PAD.top + PAD.bottom + 24)) * 100, 5, 60)}%`,
              left: leftPct,
              right: rightPct,
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              zIndex: 10,
              width: `${ttW}px`,
            }}>
              <div style={{
                background: '#0a0f1e',
                border: `1px solid ${d.isAnomaly ? '#f97316' : '#1f2937'}`,
                borderRadius: '10px',
                padding: '10px 12px',
                fontSize: '11px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
              }}>
                <p style={{ color: '#6b7280', margin: '0 0 6px', fontWeight: 500 }}>{d.dateLabel}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px' }}>
                  <TooltipRow label="Open" value={`₹${d.open.toFixed(2)}`} color="#9ca3af" />
                  <TooltipRow label="Close" value={`₹${d.close.toFixed(2)}`} color={bull ? '#10b981' : '#ef4444'} />
                  <TooltipRow label="High" value={`₹${d.high.toFixed(2)}`} color="#10b981" />
                  <TooltipRow label="Low" value={`₹${d.low.toFixed(2)}`} color="#ef4444" />
                </div>
                <div style={{ borderTop: '1px solid #1f2937', marginTop: '6px', paddingTop: '6px' }}>
                  <TooltipRow label="Volume" value={`${d.volumeM.toFixed(1)}M`} color="#6b7280" />
                </div>
                {d.isAnomaly && (
                  <div style={{
                    marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px',
                    color: '#f97316', fontSize: '10px', fontWeight: 600,
                  }}>
                    <AlertTriangle size={11} />
                    Anomaly Detected
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '0.75rem', flexWrap: 'wrap' }}>
        <LegendItem color="#10b981" label="Bullish" />
        <LegendItem color="#ef4444" label="Bearish" />
        <LegendItem color="#f97316" label="Anomaly" dot />
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px', color: '#4b5563', fontSize: '11px' }}>
          <BarChart2 size={12} />
          Volume below
        </div>
      </div>
    </div>
  );
}

function TooltipRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <span style={{ color: '#4b5563', fontSize: '10px' }}>{label} </span>
      <span style={{ color, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}

function Chip({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px',
      fontSize: '10px', fontWeight: 600,
      color, background: `${color}18`, border: `1px solid ${color}35`,
      padding: '2px 8px', borderRadius: '100px',
    }}>
      {children}
    </span>
  );
}

function LegendItem({ color, label, dot }: { color: string; label: string; dot?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      {dot
        ? <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, display: 'inline-block' }} />
        : <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: color, display: 'inline-block' }} />
      }
      <span style={{ fontSize: '11px', color: '#4b5563' }}>{label}</span>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: '#111827',
  border: '1px solid #1f2937',
  borderRadius: '14px',
  padding: '1.25rem',
  width: '100%',
  boxSizing: 'border-box',
  position: 'relative',
};