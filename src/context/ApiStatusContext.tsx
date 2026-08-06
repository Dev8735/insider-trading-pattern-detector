'use client'

import * as React from 'react'
import { checkHealth } from '@/lib/api'

interface ApiStatusValue {
  connected: boolean
  checking: boolean
  recheck: () => void
}

const ApiStatusContext = React.createContext<ApiStatusValue>({
  connected: false,
  checking: true,
  recheck: () => {},
})

export function ApiStatusProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = React.useState(false)
  const [checking, setChecking] = React.useState(true)

  const recheck = React.useCallback(() => {
    setChecking(true)
    checkHealth()
      .then((ok) => setConnected(ok))
      .catch(() => setConnected(false))
      .finally(() => setChecking(false))
  }, [])

  // Ping the backend health endpoint once on app load.
  React.useEffect(() => {
    recheck()
  }, [recheck])

  const value = React.useMemo(
    () => ({ connected, checking, recheck }),
    [connected, checking, recheck],
  )

  return <ApiStatusContext.Provider value={value}>{children}</ApiStatusContext.Provider>
}

export function useApiStatus(): ApiStatusValue {
  return React.useContext(ApiStatusContext)
}
