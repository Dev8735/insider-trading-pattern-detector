'use client'

import * as React from 'react'
import {
  makeStyles,
  tokens,
  Title1,
  Subtitle2,
  Caption1,
  Body1,
  Card,
  Badge,
  Divider,
  Button,
} from '@fluentui/react-components'
import {
  CheckmarkCircleRegular,
  ErrorCircleRegular,
  ArrowClockwiseRegular,
} from '@fluentui/react-icons'
import { AppShell } from '@/components/NavRail'
import { fetchHealth } from '@/lib/api'

const useStyles = makeStyles({
  page: {
    minHeight: '100vh',
    backgroundColor: tokens.colorNeutralBackground2,
    paddingBottom: tokens.spacingVerticalXXXL,
  },
  inner: {
    maxWidth: '720px',
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingLeft: tokens.spacingHorizontalXL,
    paddingRight: tokens.spacingHorizontalXL,
    paddingTop: tokens.spacingVerticalXL,
    '@media (max-width: 480px)': {
      paddingLeft: tokens.spacingHorizontalM,
      paddingRight: tokens.spacingHorizontalM,
      paddingTop: tokens.spacingVerticalM,
    },
  },
  pageHeader: {
    marginBottom: tokens.spacingVerticalXXL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  subtitle: { color: tokens.colorNeutralForeground3 },
  card: {
    paddingTop: tokens.spacingVerticalL,
    paddingBottom: tokens.spacingVerticalL,
    paddingLeft: tokens.spacingHorizontalXL,
    paddingRight: tokens.spacingHorizontalXL,
    marginBottom: tokens.spacingVerticalL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    '@media (max-width: 480px)': {
      paddingLeft: tokens.spacingHorizontalM,
      paddingRight: tokens.spacingHorizontalM,
    },
  },
  sectionTitle: { marginBottom: tokens.spacingVerticalXS },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM,
  },
  label: { color: tokens.colorNeutralForeground2 },
  value: { color: tokens.colorNeutralForeground1, fontVariantNumeric: 'tabular-nums' },
})

export default function SettingsPage() {
  const styles = useStyles()
  const [apiConnected, setApiConnected] = React.useState(false)
  const [checking, setChecking] = React.useState(false)
  const [lastChecked, setLastChecked] = React.useState<string | null>(null)

  const checkHealth = React.useCallback(async () => {
    setChecking(true)
    try {
      // TODO: swap for real fetchHealth() → endpoint 1 GET /
      const h = await fetchHealth()
      setApiConnected(h.status === 'ok')
    } catch {
      setApiConnected(false)
    } finally {
      setChecking(false)
      setLastChecked(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }
  }, [])

  React.useEffect(() => { checkHealth() }, [checkHealth])

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

  return (
    <AppShell apiConnected={apiConnected}>
      <main className={styles.page}>
        <div className={styles.inner}>
          <header className={styles.pageHeader}>
            <Title1 as="h1">Settings</Title1>
            <Caption1 className={styles.subtitle}>TradeWatch configuration and API connection status</Caption1>
          </header>

          {/* API Connection */}
          <Card appearance="filled-alternative" className={styles.card}>
            <Subtitle2 className={styles.sectionTitle}>API Connection</Subtitle2>
            <Divider />
            <div className={styles.row}>
              <Body1 className={styles.label}>Status</Body1>
              <Badge
                appearance="tint"
                color={apiConnected ? 'success' : 'danger'}
                icon={apiConnected ? <CheckmarkCircleRegular /> : <ErrorCircleRegular />}
              >
                {apiConnected ? 'Connected' : 'Offline'}
              </Badge>
            </div>
            <div className={styles.row}>
              <Body1 className={styles.label}>Base URL</Body1>
              <Caption1 className={styles.value} style={{ fontFamily: tokens.fontFamilyMonospace }}>
                {apiBaseUrl}
              </Caption1>
            </div>
            {lastChecked && (
              <div className={styles.row}>
                <Body1 className={styles.label}>Last checked</Body1>
                <Caption1 className={styles.value}>{lastChecked}</Caption1>
              </div>
            )}
            <div>
              <Button
                appearance="subtle"
                icon={<ArrowClockwiseRegular />}
                onClick={checkHealth}
                disabled={checking}
                aria-label="Re-check API connection"
              >
                {checking ? 'Checking…' : 'Re-check connection'}
              </Button>
            </div>
          </Card>

          {/* Endpoints reference */}
          <Card appearance="filled-alternative" className={styles.card}>
            <Subtitle2 className={styles.sectionTitle}>API Endpoints</Subtitle2>
            <Divider />
            {[
              { method: 'GET', path: '/', desc: 'Health check — pinged on app load' },
              { method: 'GET', path: '/stocks', desc: 'All tracked tickers — Stocks Explorer' },
              { method: 'GET', path: '/flags', desc: 'Top suspicious stocks by peak score — Dashboard' },
              { method: 'GET', path: '/stock/{ticker}', desc: 'Day-by-day scored history — Stock Detail' },
              { method: 'GET', path: '/stock/{ticker}/summary', desc: 'Compact summary — Stock Detail cards' },
            ].map(({ method, path, desc }) => (
              <div key={path} className={styles.row}>
                <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS, minWidth: 0 }}>
                  <Badge appearance="tint" color="brand" size="small">{method}</Badge>
                  <Caption1 style={{ fontFamily: tokens.fontFamilyMonospace, color: tokens.colorNeutralForeground1, flexShrink: 0 }}>
                    {path}
                  </Caption1>
                </div>
                <Caption1 className={styles.label} style={{ textAlign: 'right' }}>{desc}</Caption1>
              </div>
            ))}
          </Card>

          {/* About */}
          <Card appearance="filled-alternative" className={styles.card}>
            <Subtitle2 className={styles.sectionTitle}>About TradeWatch</Subtitle2>
            <Divider />
            <div className={styles.row}>
              <Body1 className={styles.label}>Version</Body1>
              <Caption1 className={styles.value}>1.0.0</Caption1>
            </div>
            <div className={styles.row}>
              <Body1 className={styles.label}>Markets covered</Body1>
              <Caption1 className={styles.value}>NSE, BSE</Caption1>
            </div>
            <div className={styles.row}>
              <Body1 className={styles.label}>UI framework</Body1>
              <Caption1 className={styles.value}>Microsoft Fluent UI v9</Caption1>
            </div>
          </Card>
        </div>
      </main>
    </AppShell>
  )
}
