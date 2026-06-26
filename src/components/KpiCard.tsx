'use client'

import {
  Card,
  makeStyles,
  mergeClasses,
  tokens,
  typographyStyles,
  Caption1,
  Body1Strong,
} from '@fluentui/react-components'
import type { JSX } from 'react'

const useStyles = makeStyles({
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    paddingTop: tokens.spacingVerticalL,
    paddingBottom: tokens.spacingVerticalL,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    minWidth: 0,
    '@media (max-width: 480px)': {
      paddingTop: tokens.spacingVerticalM,
      paddingBottom: tokens.spacingVerticalM,
      paddingLeft: tokens.spacingHorizontalM,
      paddingRight: tokens.spacingHorizontalM,
    },
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
  },
  label: {
    color: tokens.colorNeutralForeground3,
    '@media (max-width: 480px)': {
      ...typographyStyles.caption1,
    },
  },
  iconWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    flexShrink: 0,
  },
  iconWrapDanger: {
    backgroundColor: tokens.colorPaletteRedBackground2,
    color: tokens.colorPaletteRedForeground2,
  },
  iconWrapWarning: {
    backgroundColor: tokens.colorPaletteYellowBackground2,
    color: tokens.colorPaletteYellowForeground2,
  },
  iconWrapSuccess: {
    backgroundColor: tokens.colorPaletteGreenBackground2,
    color: tokens.colorPaletteGreenForeground2,
  },
  value: {
    ...typographyStyles.title1,
    color: tokens.colorNeutralForeground1,
    lineHeight: '1.1',
    fontVariantNumeric: 'tabular-nums',
    '@media (max-width: 480px)': {
      ...typographyStyles.title2,
    },
  },
  trend: {
    color: tokens.colorNeutralForeground3,
  },
  trendPositive: {
    color: tokens.colorPaletteGreenForeground2,
  },
  trendNegative: {
    color: tokens.colorPaletteRedForeground2,
  },
})

type Accent = 'brand' | 'danger' | 'warning' | 'success'

interface KpiCardProps {
  label: string
  value: number | string
  trend?: string
  trendDir?: 'up' | 'down' | 'neutral'
  icon?: JSX.Element
  accent?: Accent
}

export function KpiCard({ label, value, trend, trendDir = 'neutral', icon, accent = 'brand' }: KpiCardProps) {
  const styles = useStyles()

  const iconAccentClass =
    accent === 'danger'
      ? styles.iconWrapDanger
      : accent === 'warning'
      ? styles.iconWrapWarning
      : accent === 'success'
      ? styles.iconWrapSuccess
      : undefined

  const trendClass =
    trendDir === 'up'
      ? styles.trendPositive
      : trendDir === 'down'
      ? styles.trendNegative
      : styles.trend

  return (
    <Card appearance="filled-alternative" className={styles.card}>
      <div className={styles.topRow}>
        <Body1Strong className={styles.label}>{label}</Body1Strong>
        {icon && (
          <span className={mergeClasses(styles.iconWrap, iconAccentClass)}>
            {icon}
          </span>
        )}
      </div>
      <div className={styles.value}>{value}</div>
      {trend && (
        <Caption1 className={trendClass}>{trend}</Caption1>
      )}
    </Card>
  )
}
