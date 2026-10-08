import { useEffect, useState } from 'react'

/**
 * Tracks the browser's online/offline connectivity.
 *
 * Returns `true` when the device can reach the network, `false` otherwise.
 * Initializes from `navigator.onLine` and stays in sync via the window
 * "online" and "offline" events, cleaning up both listeners on unmount.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState<boolean>(() => navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return online
}
