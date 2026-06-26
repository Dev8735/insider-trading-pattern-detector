'use client'

import * as React from 'react'
import {
  makeStyles,
  tokens,
  typographyStyles,
  Input,
  Text,
  Caption1,
  Button,
} from '@fluentui/react-components'
import {
  Home20Regular,
  WalletCreditCard20Regular,
  DataTrending20Regular,
  ArrowSwap20Regular,
  ArrowSync20Regular,
  Wallet20Regular,
  Search20Regular,
  Snooze20Regular,
  Gauge20Regular,
  LockClosed20Regular,
  Receipt20Regular,
  ShieldKeyhole20Regular,
  Rocket20Regular,
} from '@fluentui/react-icons'

const useStyles = makeStyles({
  sidebar: {
    width: '264px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    paddingTop: tokens.spacingVerticalL,
    paddingBottom: tokens.spacingVerticalL,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRightWidth: tokens.strokeWidthThin,
    borderRightStyle: 'solid',
    borderRightColor: tokens.colorNeutralStroke2,
    height: '100%',
    overflowY: 'auto',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    paddingLeft: tokens.spacingHorizontalXS,
    paddingTop: tokens.spacingVerticalXS,
    paddingBottom: tokens.spacingVerticalXS,
  },
  brandMark: {
    width: '28px',
    height: '28px',
    borderRadius: tokens.borderRadiusMedium,
    background: 'linear-gradient(135deg, #c8b68a 0%, #7b6cf6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#0b0b0d',
    fontWeight: tokens.fontWeightBold,
    fontSize: tokens.fontSizeBase300,
  },
  brandName: {
    ...typographyStyles.subtitle2,
    letterSpacing: '0.14em',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: tokens.spacingHorizontalS,
  },
  navCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    alignItems: 'flex-start',
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderTopWidth: tokens.strokeWidthThin,
    borderRightWidth: tokens.strokeWidthThin,
    borderBottomWidth: tokens.strokeWidthThin,
    borderLeftWidth: tokens.strokeWidthThin,
    borderTopStyle: 'solid',
    borderRightStyle: 'solid',
    borderBottomStyle: 'solid',
    borderLeftStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke2,
    borderRightColor: tokens.colorNeutralStroke2,
    borderBottomColor: tokens.colorNeutralStroke2,
    borderLeftColor: tokens.colorNeutralStroke2,
    cursor: 'pointer',
    color: tokens.colorNeutralForeground2,
    transitionProperty: 'background-color, border-color, transform',
    transitionDuration: tokens.durationFast,
    ':hover': {
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderTopColor: tokens.colorNeutralStroke1,
      borderRightColor: tokens.colorNeutralStroke1,
      borderBottomColor: tokens.colorNeutralStroke1,
      borderLeftColor: tokens.colorNeutralStroke1,
    },
  },
  navCardActive: {
    backgroundColor: tokens.colorNeutralForeground1,
    color: tokens.colorNeutralBackground1,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    ':hover': {
      backgroundColor: tokens.colorNeutralForeground1,
    },
  },
  navCardLabel: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    marginTop: tokens.spacingVerticalXS,
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
    borderRadius: tokens.borderRadiusMedium,
    color: tokens.colorNeutralForeground2,
    cursor: 'pointer',
    transitionProperty: 'background-color, color',
    transitionDuration: tokens.durationFast,
    ':hover': {
      backgroundColor: 'rgba(255,255,255,0.05)',
      color: tokens.colorNeutralForeground1,
    },
  },
  listIcon: {
    display: 'flex',
    color: tokens.colorNeutralForeground3,
  },
  listLabel: {
    fontSize: tokens.fontSizeBase300,
  },
  spacer: { flex: 1 },
  promo: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: tokens.borderRadiusLarge,
    paddingTop: tokens.spacingVerticalL,
    paddingBottom: tokens.spacingVerticalL,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    background: 'linear-gradient(135deg, rgba(123,108,246,0.35) 0%, rgba(200,182,138,0.25) 100%)',
    borderTopWidth: tokens.strokeWidthThin,
    borderRightWidth: tokens.strokeWidthThin,
    borderBottomWidth: tokens.strokeWidthThin,
    borderLeftWidth: tokens.strokeWidthThin,
    borderTopStyle: 'solid',
    borderRightStyle: 'solid',
    borderBottomStyle: 'solid',
    borderLeftStyle: 'solid',
    borderTopColor: 'rgba(255,255,255,0.18)',
    borderRightColor: 'rgba(255,255,255,0.18)',
    borderBottomColor: 'rgba(255,255,255,0.18)',
    borderLeftColor: 'rgba(255,255,255,0.18)',
  },
  promoTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
    marginBottom: tokens.spacingVerticalXS,
  },
})

const navCards = [
  { label: 'Home', icon: <Home20Regular /> },
  { label: 'Cards', icon: <WalletCreditCard20Regular />, active: true },
  { label: 'Analytics', icon: <DataTrending20Regular /> },
  { label: 'Transfers', icon: <ArrowSwap20Regular /> },
  { label: 'Swap Coins', icon: <ArrowSync20Regular /> },
  { label: 'Payments', icon: <Wallet20Regular /> },
]

const listItems = [
  { label: 'Freeze Card', icon: <Snooze20Regular /> },
  { label: 'Set Spending Limit', icon: <Gauge20Regular /> },
  { label: 'View Card PIN', icon: <LockClosed20Regular /> },
  { label: 'Manage Subscriptions', icon: <Receipt20Regular /> },
  { label: 'Security Settings', icon: <ShieldKeyhole20Regular /> },
]

export function BankSidebar() {
  const styles = useStyles()
  return (
    <aside className={styles.sidebar} aria-label="Primary navigation">
      <div className={styles.brand}>
        <div className={styles.brandMark} aria-hidden="true">
          Z
        </div>
        <span className={styles.brandName}>ZIXO</span>
      </div>

      <Input
        contentBefore={<Search20Regular />}
        placeholder="Search..."
        appearance="filled-darker"
        aria-label="Search"
      />

      <nav className={styles.grid} aria-label="Sections">
        {navCards.map((c) => (
          <div
            key={c.label}
            className={`${styles.navCard} ${c.active ? styles.navCardActive : ''}`}
            role="button"
            tabIndex={0}
            aria-current={c.active ? 'page' : undefined}
          >
            {c.icon}
            <span className={styles.navCardLabel}>{c.label}</span>
          </div>
        ))}
      </nav>

      <div className={styles.list}>
        {listItems.map((item) => (
          <div key={item.label} className={styles.listItem} role="button" tabIndex={0}>
            <span className={styles.listIcon}>{item.icon}</span>
            <span className={styles.listLabel}>{item.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.spacer} />

      <div className={styles.promo}>
        <Text as="p" className={styles.promoTitle}>
          Pro <Rocket20Regular />
        </Text>
        <Caption1 style={{ color: tokens.colorNeutralForeground1 }}>
          Everything you need for smart personal finance.
        </Caption1>
        <div style={{ marginTop: tokens.spacingVerticalM }}>
          <Button appearance="primary" size="small">
            Upgrade
          </Button>
        </div>
      </div>
    </aside>
  )
}
