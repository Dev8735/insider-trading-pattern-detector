'use client'

import * as React from 'react'
import {
  makeStyles,
  tokens,
  typographyStyles,
  Title2,
  Subtitle2,
  Subtitle1,
  Body1,
  Caption1,
  Text,
  Button,
  Avatar,
  Badge,
  Tooltip,
} from '@fluentui/react-components'
import {
  Add24Regular,
  WalletCreditCard24Regular,
  ChatMultiple24Regular,
  Alert24Regular,
  ArrowExportUp16Regular,
  ChevronDown16Regular,
  CaretUp12Filled,
  CaretDown12Filled,
  Wifi120Regular,
} from '@fluentui/react-icons'
import { BankSidebar } from './BankSidebar'
import { Sparkline, BarChart, DottedChart, Gauge } from './charts'
import {
  kpis,
  cards,
  cardSwatches,
  monthlySpending,
  monthlyActivity,
  spendingCategories,
  categoryBars,
} from './data'

const useStyles = makeStyles({
  shell: {
    display: 'flex',
    height: '100vh',
    width: '100%',
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    overflow: 'hidden',
  },
  sidebarWrap: {
    '@media (max-width: 1000px)': { display: 'none' },
  },
  main: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },

  /* header */
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM,
    paddingTop: tokens.spacingVerticalL,
    paddingBottom: tokens.spacingVerticalL,
    paddingLeft: tokens.spacingHorizontalXXL,
    paddingRight: tokens.spacingHorizontalXXL,
    borderBottomWidth: tokens.strokeWidthThin,
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke2,
  },
  greeting: { display: 'flex', flexDirection: 'column', gap: '2px' },
  date: { color: tokens.colorNeutralForeground3 },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  pill: {
    borderRadius: tokens.borderRadiusCircular,
  },
  iconBtn: {
    borderRadius: tokens.borderRadiusCircular,
    minWidth: '40px',
    width: '40px',
    height: '40px',
    padding: 0,
  },

  /* content */
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    paddingTop: tokens.spacingVerticalL,
    paddingBottom: tokens.spacingVerticalXXL,
    paddingLeft: tokens.spacingHorizontalXXL,
    paddingRight: tokens.spacingHorizontalXXL,
  },

  /* kpi strip */
  kpiStrip: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: tokens.spacingHorizontalM,
  },
  kpiCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    borderRadius: tokens.borderRadiusXLarge,
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
  },
  kpiLabel: { color: tokens.colorNeutralForeground3, marginBottom: '2px' },
  kpiValueRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  kpiValue: { ...typographyStyles.title3 },
  delta: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '1px',
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
  },
  deltaUp: { color: tokens.colorPaletteGreenForeground1 },
  deltaDown: { color: tokens.colorPaletteRedForeground1 },

  /* body grid */
  body: {
    display: 'grid',
    gridTemplateColumns: 'minmax(340px, 1fr) minmax(440px, 1.5fr)',
    gap: tokens.spacingHorizontalL,
    alignItems: 'stretch',
    '@media (max-width: 1240px)': {
      gridTemplateColumns: '1fr',
    },
  },

  panel: {
    borderRadius: tokens.borderRadiusXLarge,
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
  },

  /* card customizer */
  cardPanel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalL,
    paddingTop: tokens.spacingVerticalXL,
    paddingBottom: tokens.spacingVerticalXL,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
  },
  cardPanelHead: { textAlign: 'center' },
  cardStage: {
    position: 'relative',
    width: '100%',
    height: '260px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditCard: {
    position: 'absolute',
    width: '280px',
    height: '180px',
    borderRadius: tokens.borderRadiusXLarge,
    padding: tokens.spacingHorizontalL,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    color: '#f3f0e8',
    boxShadow: tokens.shadow28,
    borderTopWidth: tokens.strokeWidthThin,
    borderRightWidth: tokens.strokeWidthThin,
    borderBottomWidth: tokens.strokeWidthThin,
    borderLeftWidth: tokens.strokeWidthThin,
    borderTopStyle: 'solid',
    borderRightStyle: 'solid',
    borderBottomStyle: 'solid',
    borderLeftStyle: 'solid',
    borderTopColor: 'rgba(255,255,255,0.12)',
    borderRightColor: 'rgba(255,255,255,0.12)',
    borderBottomColor: 'rgba(255,255,255,0.12)',
    borderLeftColor: 'rgba(255,255,255,0.12)',
  },
  cardBehindLeft: {
    transform: 'translateX(-72px) scale(0.9) rotate(-6deg)',
    opacity: 0.45,
    filter: 'blur(1px)',
  },
  cardBehindRight: {
    transform: 'translateX(72px) scale(0.9) rotate(6deg)',
    opacity: 0.45,
    filter: 'blur(1px)',
  },
  cardFront: { transform: 'translateY(0)', zIndex: 2 },
  cardTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLabel: { fontSize: tokens.fontSizeBase200, opacity: 0.8 },
  cardChip: {
    width: '34px',
    height: '26px',
    borderRadius: '6px',
    background: 'linear-gradient(135deg, #d8c98f, #b59a52)',
  },
  cardNumber: {
    fontSize: tokens.fontSizeBase400,
    letterSpacing: '0.14em',
    fontWeight: tokens.fontWeightSemibold,
  },
  cardBottomRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  visa: { fontStyle: 'italic', fontWeight: tokens.fontWeightBold, fontSize: tokens.fontSizeBase500 },
  swatches: { display: 'flex', gap: tokens.spacingHorizontalS, alignItems: 'center' },
  swatch: {
    width: '22px',
    height: '22px',
    borderRadius: tokens.borderRadiusCircular,
    cursor: 'pointer',
    borderTopWidth: '2px',
    borderRightWidth: '2px',
    borderBottomWidth: '2px',
    borderLeftWidth: '2px',
    borderTopStyle: 'solid',
    borderRightStyle: 'solid',
    borderBottomStyle: 'solid',
    borderLeftStyle: 'solid',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    transitionProperty: 'transform',
    transitionDuration: tokens.durationFast,
    ':hover': { transform: 'scale(1.12)' },
  },
  swatchActive: {
    borderTopColor: tokens.colorNeutralForeground1,
    borderRightColor: tokens.colorNeutralForeground1,
    borderBottomColor: tokens.colorNeutralForeground1,
    borderLeftColor: tokens.colorNeutralForeground1,
  },
  chooseCopy: { textAlign: 'center', maxWidth: '280px' },

  /* right column */
  rightCol: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
  rightGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: tokens.spacingHorizontalL,
  },
  widget: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    paddingTop: tokens.spacingVerticalL,
    paddingBottom: tokens.spacingVerticalL,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
  },
  widgetHead: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalS,
  },
  muted: { color: tokens.colorNeutralForeground3 },
  chartBox: { height: '120px', width: '100%' },
  bigValue: { ...typographyStyles.title2 },
  catGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: tokens.spacingVerticalM,
    rowGap: tokens.spacingVerticalM,
  },
  catItem: { display: 'flex', flexDirection: 'column', gap: '2px' },
  gaugeWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    marginTop: tokens.spacingVerticalS,
  },
  gaugeValue: {
    position: 'absolute',
    bottom: '8px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  monthRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: tokens.spacingVerticalXS,
  },
})

function Delta({ value }: { value: number }) {
  const styles = useStyles()
  const up = value >= 0
  return (
    <span className={`${styles.delta} ${up ? styles.deltaUp : styles.deltaDown}`}>
      {up ? <CaretUp12Filled /> : <CaretDown12Filled />}
      {Math.abs(value)}%
    </span>
  )
}

export function BankDashboard() {
  const styles = useStyles()
  const [activeSwatch, setActiveSwatch] = React.useState(0)
  const greenSpark = '#5bd6a3'
  const redSpark = '#f1707b'

  return (
    <div className={styles.shell}>
      <div className={styles.sidebarWrap}>
        <BankSidebar />
      </div>

      <div className={styles.main}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.greeting}>
            <Title2 as="h1">Good Morning, Alvie</Title2>
            <Caption1 className={styles.date}>Friday, 15 July 2026</Caption1>
          </div>
          <div className={styles.headerActions}>
            <Button appearance="primary" className={styles.pill} icon={<Add24Regular />}>
              Add Card
            </Button>
            <Button appearance="outline" className={styles.pill} icon={<WalletCreditCard24Regular />}>
              Order a Card
            </Button>
            <Tooltip content="Messages" relationship="label">
              <Button appearance="subtle" className={styles.iconBtn} icon={<ChatMultiple24Regular />} />
            </Tooltip>
            <Tooltip content="Notifications" relationship="label">
              <Button appearance="subtle" className={styles.iconBtn} icon={<Alert24Regular />} />
            </Tooltip>
            <Avatar name="Alvie Mason" color="colorful" />
          </div>
        </header>

        <div className={styles.content}>
          {/* KPI strip */}
          <section className={styles.kpiStrip} aria-label="Key metrics">
            {kpis.map((k) => (
              <div key={k.label} className={styles.kpiCard}>
                <div>
                  <Caption1 className={styles.kpiLabel}>{k.label}</Caption1>
                  <div className={styles.kpiValueRow}>
                    <span className={styles.kpiValue}>{k.value}</span>
                    <Delta value={k.delta} />
                  </div>
                </div>
                <Sparkline data={k.spark} color={k.delta >= 0 ? greenSpark : redSpark} />
              </div>
            ))}
          </section>

          {/* Body */}
          <div className={styles.body}>
            {/* Card customizer */}
            <section className={`${styles.panel} ${styles.cardPanel}`} aria-label="Your cards">
              <div className={styles.cardPanelHead}>
                <Subtitle1 as="h2">Platinum card</Subtitle1>
                <Body1 className={styles.muted}>$150 / year</Body1>
              </div>

              <div className={styles.cardStage}>
                <div
                  className={`${styles.creditCard} ${styles.cardBehindLeft}`}
                  style={{ background: cards[2].gradient }}
                  aria-hidden="true"
                />
                <div
                  className={`${styles.creditCard} ${styles.cardBehindRight}`}
                  style={{ background: cards[1].gradient }}
                  aria-hidden="true"
                />
                <div
                  className={`${styles.creditCard} ${styles.cardFront}`}
                  style={{ background: cards[0].gradient }}
                >
                  <div className={styles.cardTopRow}>
                    <span className={styles.cardLabel}>Credit Card</span>
                    <Wifi120Regular />
                  </div>
                  <div className={styles.cardChip} />
                  <div className={styles.cardBottomRow}>
                    <span className={styles.cardNumber}>{cards[0].number}</span>
                    <span className={styles.visa}>VISA</span>
                  </div>
                </div>
              </div>

              <div className={styles.chooseCopy}>
                <Subtitle2 as="h3">Choose the color of your card</Subtitle2>
                <Caption1 className={styles.muted}>
                  Our cards are made of recycled materials you can be proud of.
                </Caption1>
              </div>

              <div className={styles.swatches}>
                {cardSwatches.map((c, i) => (
                  <div
                    key={c}
                    className={`${styles.swatch} ${i === activeSwatch ? styles.swatchActive : ''}`}
                    style={{ backgroundColor: c }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Card color ${i + 1}`}
                    aria-pressed={i === activeSwatch}
                    onClick={() => setActiveSwatch(i)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setActiveSwatch(i)
                    }}
                  />
                ))}
              </div>

              <Button appearance="primary" shape="circular">
                Choose Platinum
              </Button>
            </section>

            {/* Right column */}
            <div className={styles.rightCol}>
              <div className={styles.rightGrid}>
                {/* Monthly Spending */}
                <section className={`${styles.panel} ${styles.widget}`}>
                  <div className={styles.widgetHead}>
                    <div>
                      <Subtitle2 as="h2">Monthly Spending</Subtitle2>
                      <Caption1 className={styles.muted}>This Month</Caption1>
                    </div>
                    <Badge appearance="tint" color="success">
                      +12%
                    </Badge>
                  </div>
                  <div className={styles.chartBox}>
                    <BarChart data={monthlySpending} activeIndex={9} />
                  </div>
                </section>

                {/* Card Usage */}
                <section className={`${styles.panel} ${styles.widget}`}>
                  <div className={styles.widgetHead}>
                    <div>
                      <Subtitle2 as="h2">Card Usage</Subtitle2>
                      <Caption1 className={styles.muted}>Used Today</Caption1>
                    </div>
                    <Badge appearance="filled" color="informative">
                      84%
                    </Badge>
                  </div>
                  <Text className={styles.bigValue}>$5,150.99</Text>
                  <div className={styles.delta + ' ' + styles.deltaUp}>
                    <CaretUp12Filled /> 56.07% <span className={styles.muted}>&nbsp;Today</span>
                  </div>
                  <div style={{ color: tokens.colorNeutralForeground3, marginTop: tokens.spacingVerticalS }}>
                    <DottedChart fill={0.84} color="#c8b68a" />
                  </div>
                </section>
              </div>

              {/* Spending Categories */}
              <section className={`${styles.panel} ${styles.widget}`}>
                <div className={styles.widgetHead}>
                  <Subtitle2 as="h2">Spending Categories</Subtitle2>
                  <Button appearance="subtle" size="small" iconPosition="after" icon={<ChevronDown16Regular />}>
                    This Month
                  </Button>
                </div>
                <div className={styles.catGrid}>
                  {spendingCategories.map((c) => (
                    <div key={c.label} className={styles.catItem}>
                      <Caption1 className={styles.muted}>{c.label}</Caption1>
                      <Subtitle2>{c.value}</Subtitle2>
                    </div>
                  ))}
                </div>
                <div className={styles.chartBox} style={{ height: '64px' }}>
                  <BarChart data={categoryBars} activeIndex={8} height={64} />
                </div>
              </section>

              <div className={styles.rightGrid}>
                {/* Monthly Activity */}
                <section className={`${styles.panel} ${styles.widget}`}>
                  <div className={styles.widgetHead}>
                    <div>
                      <Subtitle2 as="h2">Monthly Activity</Subtitle2>
                      <Caption1 className={styles.muted}>This Month</Caption1>
                    </div>
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<ArrowExportUp16Regular />}
                      aria-label="Export"
                    />
                  </div>
                  <Text className={styles.bigValue}>$12,058.00</Text>
                  <div className={styles.chartBox} style={{ height: '90px' }}>
                    <BarChart data={monthlyActivity.map((m) => m.value)} activeIndex={3} height={90} />
                  </div>
                  <div className={styles.monthRow}>
                    {monthlyActivity.map((m) => (
                      <Caption1 key={m.label} className={styles.muted}>
                        {m.label}
                      </Caption1>
                    ))}
                  </div>
                </section>

                {/* Card Utilization */}
                <section className={`${styles.panel} ${styles.widget}`}>
                  <div className={styles.widgetHead}>
                    <div>
                      <Subtitle2 as="h2">Card Utilization</Subtitle2>
                      <Caption1 className={styles.muted}>Credit Usage</Caption1>
                    </div>
                    <Badge appearance="tint" color="warning">
                      72%
                    </Badge>
                  </div>
                  <div className={styles.gaugeWrap}>
                    <Gauge value={0.72} trackColor={tokens.colorNeutralBackground5} fillColor="#c8b68a" size={200} />
                    <div className={styles.gaugeValue}>
                      <Text className={styles.bigValue}>$3,200</Text>
                      <Caption1 className={styles.muted}>Limit Used</Caption1>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
