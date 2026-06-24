const COIN_META = {
  bitcoin: { color: '#f59e0b' },
  ethereum: { color: '#7c3aed' },
  binancecoin: { color: '#f97316' },
  solana: { color: '#06b6d4' },
  ripple: { color: '#3b82f6' },
  cardano: { color: '#10b981' },
  dogecoin: { color: '#eab308' },
  polkadot: { color: '#e6007a' },
  'avalanche-2': { color: '#e84142' },
  chainlink: { color: '#375bd2' },
}

const COINGECKO_IDS = Object.keys(COIN_META)

function formatCompactUsd(value) {
  if (value == null || Number.isNaN(value)) return '—'
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`
  return `${value.toFixed(2)}`
}

export function mapCoinGeckoMarket(coin, index) {
  const change = coin.price_change_percentage_24h ?? 0
  return {
    rank: coin.market_cap_rank || index + 1,
    id: coin.id,
    name: coin.name,
    symbol: coin.symbol?.toUpperCase() || '',
    price: coin.current_price ?? 0,
    change,
    up: change >= 0,
    volume: formatCompactUsd(coin.total_volume),
    cap: formatCompactUsd(coin.market_cap),
    color: COIN_META[coin.id]?.color || '#6b7280',
    image: coin.image,
  }
}

export async function fetchLiveMarketCoins() {
  const url = new URL('https://api.coingecko.com/api/v3/coins/markets')
  url.searchParams.set('vs_currency', 'usd')
  url.searchParams.set('ids', COINGECKO_IDS.join(','))
  url.searchParams.set('order', 'market_cap_desc')
  url.searchParams.set('sparkline', 'false')
  url.searchParams.set('price_change_percentage', '24h')

  const res = await fetch(url)
  if (!res.ok) throw new Error(`CoinGecko request failed (${res.status})`)
  const data = await res.json()
  return data.map(mapCoinGeckoMarket)
}

export async function fetchEthUsdPrice() {
  const url = new URL('https://api.coingecko.com/api/v3/simple/price')
  url.searchParams.set('ids', 'ethereum')
  url.searchParams.set('vs_currencies', 'usd')
  const res = await fetch(url)
  if (!res.ok) throw new Error(`CoinGecko ETH price failed (${res.status})`)
  const data = await res.json()
  return data?.ethereum?.usd ?? null
}
