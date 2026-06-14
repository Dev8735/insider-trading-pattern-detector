'use client';

import { useEffect, useRef, useState } from 'react';

interface AnomalyGaugeProps {
  score: number;
  title?: string;
  avr?: string;
  car?: string;
  ifSignal?: string;
  proximity?: string;
}

export default function AnomalyGauge({
  score,
  title,
  avr = '3.2×',
  car = '+9.1%',
  ifSignal = 'Anomaly',
  proximity = '4 days',
}: AnomalyGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [mounted, setMounted] = useState(false);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getColor = (s: number) => {
    if (s >= 80) return '#ef4444';
    if (s >= 65) return '#f59e0b';
    if (s >= 40) return '#f59e0b';
    return '#10b981';
  };

  const getRisk = (s: number): { label: string; color: string } => {
    if (s >= 80) return { label: 'CRITICAL', color: '#ef4444' };
    if (s >= 65) return { label: 'HIGH', color: '#f59e0b' };
    if (s >= 40) return { label: 'MEDIUM', color: '#f59e0b' };
    if (s >= 20) return { label: 'LOW', color: '#10b981' };
    return { label: 'NONE', color: '#6b7280' };
  };

  const getConfidence = (s: number) => Math.min(100, Math.round(40 + s * 0.6));

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (animRef.current) clearInterval(animRef.current);
    let current = displayScore;
    const target = score;
    const step = target > current ? 1 : -1;
    const totalSteps = Math.abs(target - current) || 1;
    const duration = 900;
    const intervalMs = duration / totalSteps;

    animRef.current = setInterval(() => {
      current += step;
      setDisplayScore(current);
      if (current === target) {
        if (animRef.current) clearInterval(animRef.current);
      }
    }, intervalMs);

    return () => {
      if (animRef.current) clearInterval(animRef.current);
    };
  }, [score, mounted]);

  const { label: riskLabel, color: riskColor } = getRisk(score);
  const arcColor = getColor(score);
  const confidence = getConfidence(score);

  // SVG arc math — 180° semicircle
  const cx = 130;
  const cy = 135;
  const r = 95;
  const totalArcLen = Math.PI * r; // half circumference
  const fillFraction = score / 100;
  const strokeDasharray = totalArcLen;
  const strokeDashoffset = totalArcLen * (1 - fillFraction);

  // Needle angle: -180deg (left) to 0deg (right)
  const needleAngleDeg = -180 + fillFraction * 180;
  const needleAngleRad = (needleAngleDeg * Math.PI) / 180;
  const needleLen = 78;
  const nx = cx + needleLen * Math.cos(needleAngleRad);
  const ny = cy + needleLen * Math.sin(needleAngleRad);

  // Tick marks
  const ticks = [0, 25, 50, 75, 100];

  const signals = [
    { label: 'AVR', value: avr },
    { label: 'CAR', value: car },
    { label: 'IF Signal', value: ifSignal },
    { label: 'Proximity', value: proximity },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '1.5rem 1.25rem 1.25rem',
        background: 'var(--card-bg, #111827)',
        border: '1px solid var(--border, #1f2937)',
        borderRadius: '16px',
        maxWidth: '320px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {title && (
        <p
          style={{
            fontSize: '11px',
            color: '#6b7280',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '1rem',
            fontWeight: 500,
          }}
        >
          {title}
        </p>
      )}

      {/* SVG Gauge */}
      <div style={{ position: 'relative', width: '260px', height: '155px' }}>
        <svg
          viewBox="0 0 260 155"
          width="260"
          height="155"
          aria-label={`Anomaly score gauge showing ${score} out of 100, risk level ${riskLabel}`}
          role="img"
        >
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="45%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>

          {/* Pulse ring for critical scores */}
          {score >= 80 && mounted && (
            <circle
              cx={cx}
              cy={cy}
              r="50"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              opacity="0"
              style={{
                animation: 'pulseRing 1.6s ease-out infinite',
              }}
            />
          )}

          {/* Track arc */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="#1f2937"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Fill arc */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={mounted ? strokeDashoffset : strokeDasharray}
            style={{
              transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />

          {/* Tick marks */}
          {ticks.map((t) => {
            const tickFrac = t / 100;
            const tickAngleDeg = -180 + tickFrac * 180;
            const tickAngleRad = (tickAngleDeg * Math.PI) / 180;
            const innerR = r - 20;
            const outerR = r - 8;
            const x1 = cx + innerR * Math.cos(tickAngleRad);
            const y1 = cy + innerR * Math.sin(tickAngleRad);
            const x2 = cx + outerR * Math.cos(tickAngleRad);
            const y2 = cy + outerR * Math.sin(tickAngleRad);
            const labelR = r + 14;
            const lx = cx + labelR * Math.cos(tickAngleRad);
            const ly = cy + labelR * Math.sin(tickAngleRad);
            return (
              <g key={t}>
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="#374151"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <text
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="9"
                  fill="#4b5563"
                >
                  {t}
                </text>
              </g>
            );
          })}

          {/* Needle */}
          {mounted && (
            <>
              <line
                x1={cx} y1={cy}
                x2={nx} y2={ny}
                stroke={arcColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                style={{ transition: 'all 0.9s cubic-bezier(0.4,0,0.2,1)' }}
              />
              <circle cx={cx} cy={cy} r="6" fill={arcColor}
                style={{ transition: 'fill 0.9s' }}
              />
              <circle cx={cx} cy={cy} r="3" fill="#0a0f1e" />
            </>
          )}
        </svg>

        {/* Center score label */}
        <div
          style={{
            position: 'absolute',
            bottom: '4px',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <p
            style={{
              fontSize: '40px',
              fontWeight: 600,
              lineHeight: 1,
              color: arcColor,
              transition: 'color 0.9s',
              fontVariantNumeric: 'tabular-nums',
              margin: 0,
            }}
          >
            {displayScore}
          </p>
          <p style={{ fontSize: '11px', color: '#6b7280', margin: '4px 0 0', letterSpacing: '0.04em' }}>
            anomaly score
          </p>
        </div>
      </div>

      {/* Risk badge */}
      <div
        style={{
          marginTop: '0.5rem',
          padding: '4px 16px',
          borderRadius: '100px',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          background: riskColor + '22',
          color: riskColor,
          border: `1px solid ${riskColor}44`,
          transition: 'all 0.9s',
        }}
      >
        {riskLabel} RISK
      </div>

      {/* Divider */}
      <div style={{ width: '100%', height: '1px', background: '#1f2937', margin: '1rem 0' }} />

      {/* Signal pills */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          width: '100%',
        }}
      >
        {signals.map(({ label, value }) => (
          <div
            key={label}
            style={{
              background: '#0a0f1e',
              border: '1px solid #1f2937',
              borderRadius: '10px',
              padding: '8px 10px',
            }}
          >
            <p style={{ fontSize: '9px', color: '#6b7280', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 3px' }}>
              {label}
            </p>
            <p style={{ fontSize: '14px', fontWeight: 500, color: '#f9fafb', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Confidence bar */}
      <div style={{ width: '100%', marginTop: '0.875rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6b7280', marginBottom: '5px' }}>
          <span>Model confidence</span>
          <span style={{ color: arcColor, fontVariantNumeric: 'tabular-nums' }}>{confidence}%</span>
        </div>
        <div style={{ width: '100%', height: '5px', background: '#1f2937', borderRadius: '100px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: mounted ? `${confidence}%` : '0%',
              background: arcColor,
              borderRadius: '100px',
              transition: 'width 1.1s cubic-bezier(0.4,0,0.2,1), background 0.9s',
            }}
          />
        </div>
      </div>

      {/* Keyframes injected inline */}
      <style>{`
        @keyframes pulseRing {
          0% { r: 50; opacity: 0.7; }
          100% { r: 70; opacity: 0; }
        }
      `}</style>
    </div>
  );
}