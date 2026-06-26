'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  makeStyles,
  mergeClasses,
  tokens,
  typographyStyles,
  Badge,
  Button,
  Tooltip,
  Body1Strong,
  Caption1,
} from '@fluentui/react-components'
import {
  GridRegular,
  DataTrendingRegular,
  ClockRegular,
  SettingsRegular,
  NavigationRegular,
  DismissRegular,
  CircleRegular,
  CheckmarkCircleRegular,
  ErrorCircleRegular,
} from '@fluentui/react-icons'

const NAV_WIDTH_EXPANDED = '220px'
const NAV_WIDTH_COLLAPSED = '56px'

const useStyles = makeStyles({
  // Desktop sidebar
  rail: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRightWidth: tokens.strokeWidthThin,
    borderRightStyle: 'solid',
    borderRightColor: tokens.colorNeutralStroke2,
    zIndex: 100,
    transition: `width ${tokens.durationNormal} ${tokens.curveEasyEase}`,
    overflow: 'hidden',
    '@media (max-width: 768px)': {
      display: 'none',
    },
  },
  railExpanded: { width: NAV_WIDTH_EXPANDED },
  railCollapsed: { width: NAV_WIDTH_COLLAPSED },

  // Top brand / toggle row
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '56px',
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalS,
    flexShrink: 0,
    borderBottomWidth: tokens.strokeWidthThin,
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke2,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
  brandName: {
    ...typographyStyles.subtitle2,
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    transition: `opacity ${tokens.durationNormal}`,
  },
  brandHidden: { opacity: 0, width: 0, pointerEvents: 'none' },

  // Nav items
  navList: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalXS,
    paddingRight: tokens.spacingHorizontalXS,
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    height: '40px',
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    color: tokens.colorNeutralForeground2,
    transition: `background ${tokens.durationFast}, color ${tokens.durationFast}`,
    whiteSpace: 'nowrap',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      color: tokens.colorNeutralForeground1,
    },
    textDecoration: 'none',
  },
  navItemActive: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold,
    ':hover': {
      backgroundColor: tokens.colorBrandBackground2Hover,
    },
  },
  navLabel: {
    ...typographyStyles.body1,
    overflow: 'hidden',
    transition: `opacity ${tokens.durationNormal}, max-width ${tokens.durationNormal}`,
    whiteSpace: 'nowrap',
  },
  navLabelHidden: { opacity: 0, maxWidth: 0, overflow: 'hidden' },
  navIcon: { flexShrink: 0, fontSize: '20px' },

  // Bottom status area
  statusArea: {
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
    borderTopWidth: tokens.strokeWidthThin,
    borderTopStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke2,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
    paddingTop: tokens.spacingVerticalXS,
    paddingBottom: tokens.spacingVerticalXS,
    borderRadius: tokens.borderRadiusMedium,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  statusText: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    transition: `opacity ${tokens.durationNormal}`,
  },
  statusTextHidden: { opacity: 0, width: 0, overflow: 'hidden' },

  // Mobile bottom tab bar
  mobileBar: {
    display: 'none',
    '@media (max-width: 768px)': {
      display: 'flex',
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '56px',
      backgroundColor: tokens.colorNeutralBackground1,
      borderTopWidth: tokens.strokeWidthThin,
      borderTopStyle: 'solid',
      borderTopColor: tokens.colorNeutralStroke2,
      zIndex: 100,
      alignItems: 'stretch',
    },
  },
  mobileTab: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    cursor: 'pointer',
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    textDecoration: 'none',
    ':hover': { color: tokens.colorNeutralForeground1 },
  },
  mobileTabActive: {
    color: tokens.colorBrandForeground1,
  },
  mobileTabIcon: { fontSize: '20px' },
  mobileTabLabel: { fontSize: tokens.fontSizeBase100, lineHeight: 1 },

  // Content offset wrapper
  contentWrap: {
    marginLeft: NAV_WIDTH_EXPANDED,
    transition: `margin-left ${tokens.durationNormal} ${tokens.curveEasyEase}`,
    '@media (max-width: 768px)': {
      marginLeft: '0 !important',
      paddingBottom: '56px',
    },
  },
  contentWrapCollapsed: { marginLeft: NAV_WIDTH_COLLAPSED },
})

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: <GridRegular /> },
  { label: 'Stocks Explorer', href: '/stocks', icon: <DataTrendingRegular /> },
  { label: 'History', href: '/history', icon: <ClockRegular /> },
] as const

interface ApiStatusProps {
  connected: boolean
  collapsed: boolean
}

function ApiStatus({ connected, collapsed }: ApiStatusProps) {
  const styles = useStyles()
  const Icon = connected ? CheckmarkCircleRegular : ErrorCircleRegular
  const color = connected ? 'success' : 'danger'
  const label = connected ? 'API Connected' : 'API Offline'

  if (collapsed) {
    return (
      <Tooltip content={label} relationship="label" positioning="after">
        <div className={styles.statusRow}>
          <Badge appearance="tint" color={color} size="small" icon={<Icon />}>
            {''}
          </Badge>
        </div>
      </Tooltip>
    )
  }

  return (
    <div className={styles.statusRow}>
      <Badge appearance="tint" color={color} size="small" icon={<Icon />}>
        {label}
      </Badge>
    </div>
  )
}

interface NavRailProps {
  apiConnected: boolean
}

export function NavRail({ apiConnected }: NavRailProps) {
  const styles = useStyles()
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = React.useState(false)

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <>
      {/* Desktop sidebar */}
      <nav
        className={mergeClasses(
          styles.rail,
          collapsed ? styles.railCollapsed : styles.railExpanded
        )}
        aria-label="Main navigation"
      >
        {/* Brand + toggle */}
        <div className={styles.brandRow}>
          <span className={mergeClasses(styles.brandName, collapsed && styles.brandHidden)}>
            TradeWatch
          </span>
          <Button
            appearance="subtle"
            icon={collapsed ? <NavigationRegular /> : <DismissRegular />}
            size="small"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          />
        </div>

        {/* Nav items */}
        <ul className={styles.navList} role="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {NAV_ITEMS.map(({ label, href, icon }) => {
            const active = isActive(href)
            return (
              <li key={href}>
                {collapsed ? (
                  <Tooltip content={label} relationship="label" positioning="after">
                    <a
                      href={href}
                      onClick={(e) => { e.preventDefault(); router.push(href) }}
                      className={mergeClasses(styles.navItem, active && styles.navItemActive)}
                      aria-current={active ? 'page' : undefined}
                      style={{ justifyContent: 'center', paddingLeft: 0, paddingRight: 0 }}
                    >
                      <span className={styles.navIcon}>{icon}</span>
                    </a>
                  </Tooltip>
                ) : (
                  <a
                    href={href}
                    onClick={(e) => { e.preventDefault(); router.push(href) }}
                    className={mergeClasses(styles.navItem, active && styles.navItemActive)}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span className={styles.navIcon}>{icon}</span>
                    <span className={mergeClasses(styles.navLabel, collapsed && styles.navLabelHidden)}>
                      {label}
                    </span>
                  </a>
                )}
              </li>
            )
          })}
        </ul>

        {/* Status + settings */}
        <div className={styles.statusArea}>
          <ApiStatus connected={apiConnected} collapsed={collapsed} />
          {collapsed ? (
            <Tooltip content="Settings" relationship="label" positioning="after">
              <a
                href="/settings"
                onClick={(e) => { e.preventDefault(); router.push('/settings') }}
                className={mergeClasses(styles.navItem, isActive('/settings') && styles.navItemActive)}
                style={{ justifyContent: 'center', paddingLeft: 0, paddingRight: 0 }}
              >
                <span className={styles.navIcon}><SettingsRegular /></span>
              </a>
            </Tooltip>
          ) : (
            <a
              href="/settings"
              onClick={(e) => { e.preventDefault(); router.push('/settings') }}
              className={mergeClasses(styles.navItem, isActive('/settings') && styles.navItemActive)}
            >
              <span className={styles.navIcon}><SettingsRegular /></span>
              <span className={styles.navLabel}>Settings</span>
            </a>
          )}
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav className={styles.mobileBar} aria-label="Mobile navigation">
        {NAV_ITEMS.map(({ label, href, icon }) => {
          const active = isActive(href)
          return (
            <a
              key={href}
              href={href}
              onClick={(e) => { e.preventDefault(); router.push(href) }}
              className={mergeClasses(styles.mobileTab, active && styles.mobileTabActive)}
              aria-current={active ? 'page' : undefined}
            >
              <span className={styles.mobileTabIcon}>{icon}</span>
              <span className={styles.mobileTabLabel}>{label}</span>
            </a>
          )
        })}
        <a
          href="/settings"
          onClick={(e) => { e.preventDefault(); router.push('/settings') }}
          className={mergeClasses(styles.mobileTab, isActive('/settings') && styles.mobileTabActive)}
        >
          <span className={styles.mobileTabIcon}><SettingsRegular /></span>
          <span className={styles.mobileTabLabel}>Settings</span>
        </a>
      </nav>
    </>
  )
}

// Layout wrapper that applies the correct margin offset
interface AppShellProps {
  children: React.ReactNode
  apiConnected: boolean
}

export function AppShell({ children, apiConnected }: AppShellProps) {
  const styles = useStyles()
  return (
    <>
      <NavRail apiConnected={apiConnected} />
      <div className={styles.contentWrap}>
        {children}
      </div>
    </>
  )
}
