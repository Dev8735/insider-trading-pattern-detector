'use client'

import * as React from 'react'
import { makeStyles, tokens } from '@fluentui/react-components'

/* ------------------------------------------------------------------ */
/* Sparkline — tiny inline trend line for KPI cards                    */
/* ------------------------------------------------------------------ */

export function Sparkline({
  data,
  color,
  width = 96,
  height = 34,
}: {
  data: number[]
  color: string
  width?: number
  height?: number
}) {
  const { path, area } = React.useMemo(() => {
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    const stepX = width / (data.length - 1)
    const pts = data.map((d, i) => {
      const x = i * stepX
      const y = height - ((d - min) / range) * (height - 4) - 2
      return [x, y] as const
    })
    const line = pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
      .join(' ')
    const areaPath = `${line} L${width},${height} L0,${height} Z`
    return { path: line, area: areaPath }
  }, [data, width, height])

  const gid = React.useId().replace(/:/g, '')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <defs>
        <linearGradient id={`spark-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#spark-${gid})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* BarChart — vertical bars with an optional highlighted index         */
/* ------------------------------------------------------------------ */

const useBarStyles = makeStyles({
  wrap: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '3px',
    width: '100%',
    height: '100%',
  },
  bar: {
    flex: '1 1 0',
    borderTopLeftRadius: '3px',
    borderTopRightRadius: '3px',
    backgroundColor: 'rgba(255,255,255,0.20)',
    transitionProperty: 'background-color, opacity',
    transitionDuration: tokens.durationNormal,
    minHeight: '2px',
  },
  active: {
    backgroundColor: '#c8b68a',
  },
})

export function BarChart({
  data,
  activeIndex,
  height = 120,
}: {
  data: number[]
  activeIndex?: number
  height?: number
}) {
  const styles = useBarStyles()
  const max = Math.max(...data) || 1
  return (
    <div className={styles.wrap} style={{ height }}>
      {data.map((d, i) => (
        <div
          key={i}
          className={`${styles.bar} ${i === activeIndex ? styles.active : ''}`}
          style={{ height: `${Math.max((d / max) * 100, 3)}%` }}
        />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* DottedChart — matrix of dots whose density encodes a value          */
/* ------------------------------------------------------------------ */

export function DottedChart({
  fill = 0.84,
  rows = 7,
  cols = 22,
  color,
}: {
  fill?: number
  rows?: number
  cols?: number
  color: string
}) {
  const total = rows * cols
  const filled = Math.round(total * fill)
  const dots: React.ReactElement[] = []
  const dot = 3
  const gap = 4
  const w = cols * (dot + gap)
  const h = rows * (dot + gap)
  let idx = 0
  for (let c = 0; c < cols; c++) {
    // fill column-by-column from the right so the dense area sits on the right
    for (let r = rows - 1; r >= 0; r--) {
      const colsFromLeft = c
      const colFill = Math.min(Math.max(filled - colsFromLeft * 0, 0), 1)
      void colFill
      idx++
    }
  }
  void idx
  // simpler: fill bottom-up, left-to-right proportion
  const cells: { x: number; y: number; on: boolean }[] = []
  let count = 0
  for (let c = 0; c < cols; c++) {
    for (let r = rows - 1; r >= 0; r--) {
      cells.push({ x: c * (dot + gap), y: r * (dot + gap), on: count < filled })
      count++
    }
  }
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      {cells.map((cell, i) => (
        <circle
          key={i}
          cx={cell.x + dot / 2}
          cy={cell.y + dot / 2}
          r={dot / 2}
          fill={cell.on ? color : 'currentColor'}
          opacity={cell.on ? 1 : 0.16}
        />
      ))}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Gauge — semicircular utilization meter                              */
/* ------------------------------------------------------------------ */

export function Gauge({
  value,
  trackColor,
  fillColor,
  size = 200,
}: {
  value: number // 0..1
  trackColor: string
  fillColor: string
  size?: number
}) {
  const stroke = 12
  const r = (size - stroke) / 2
  const cx = size / 2
  const cy = size / 2
  // semicircle from 180deg to 360deg (top half)
  const circ = Math.PI * r
  const dash = circ
  const offset = circ * (1 - value)

  return (
    <svg width={size} height={size / 2 + stroke} viewBox={`0 0 ${size} ${size / 2 + stroke}`} aria-hidden="true">
      <path
        d={`M ${stroke / 2} ${cy} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${cy}`}
        fill="none"
        stroke={trackColor}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      <path
        d={`M ${stroke / 2} ${cy} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${cy}`}
        fill="none"
        stroke={fillColor}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={dash}
        strokeDashoffset={offset}
      />
    </svg>
  )
}
