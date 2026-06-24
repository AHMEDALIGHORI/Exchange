import { useEffect, useState, useCallback } from 'react'
import { fetchLiveMarketCoins } from '../utils/marketPrices'

export function useMarketPrices({ refreshMs = 60_000 } = {}) {
  const [coins, setCoins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)

  const refresh = useCallback(async () => {
    try {
      setError(null)
      const next = await fetchLiveMarketCoins()
      setCoins(next)
      setUpdatedAt(Date.now())
    } catch (err) {
      setError(err.message || 'Failed to load market data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, refreshMs)
    return () => clearInterval(id)
  }, [refresh, refreshMs])

  return { coins, loading, error, updatedAt, refresh }
}
