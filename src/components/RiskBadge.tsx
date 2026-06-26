'use client'

import { Badge, makeStyles, tokens } from '@fluentui/react-components'
import type { RiskTier } from '@/lib/types'

const useStyles = makeStyles({
  score: {
    fontVariantNumeric: 'tabular-nums',
    fontWeight: tokens.fontWeightSemibold,
  },
})

type BadgeColor = 'danger' | 'severe' | 'warning' | 'success' | 'subtle'

const TIER_COLOR: Record<RiskTier, BadgeColor> = {
  Critical: 'danger',
  High: 'severe',
  Medium: 'warning',
  Low: 'success',
  Clean: 'subtle',
}

interface RiskBadgeProps {
  tier: RiskTier
  score?: number
  size?: 'small' | 'medium' | 'large' | 'extra-large'
}

export function RiskBadge({ tier, score, size = 'medium' }: RiskBadgeProps) {
  const styles = useStyles()
  const label = score !== undefined ? `${tier} · ${score}` : tier
  return (
    <Badge
      appearance="tint"
      color={TIER_COLOR[tier]}
      size={size}
      className={styles.score}
    >
      {label}
    </Badge>
  )
}
