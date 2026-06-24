import { useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import styles from './Markets.module.css'
import { useMarketPrices } from '../hooks/useMarketPrices'

export default function Markets() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const { coins, loading, error, updatedAt, refresh } = useMarketPrices()

  const filteredCoins = coins.filter((coin) => {
    const matchesSearch =
      coin.name.toLowerCase().includes(search.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(search.toLowerCase())
    if (filter === 'gainers') return matchesSearch && coin.up
    if (filter === 'losers') return matchesSearch && !coin.up
    return matchesSearch
  })

  const updatedLabel = loading
    ? 'Fetching…'
    : updatedAt
      ? `Updated ${new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      : 'Offline'

  return (
    <DashboardLayout activeOverride="markets">
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Markets</h1>
            <p className={styles.subtitle}>CoinGecko spot prices — refreshes every minute</p>
          </div>
          <div className={styles.updatedTag}>{updatedLabel}</div>
        </header>

        {error && (
          <div className={styles.errorBanner}>
            {error}
            <button type="button" onClick={refresh}>Retry</button>
          </div>
        )}

        <div className={styles.tickerRow}>
          {coins.slice(0, 4).map((coin) => (
            <div key={coin.symbol} className={styles.tickerCard}>
              <div className={styles.tickerTop}>
                <span className={styles.tickerName}>{coin.name}</span>
                <span className={`${styles.tickerChange} ${coin.up ? styles.up : styles.down}`}>
                  {coin.up ? '▲' : '▼'} {Math.abs(coin.change).toFixed(2)}%
                </span>
              </div>
              <div className={styles.tickerPrice}>
                ${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.toolbar}>
          <div className={styles.filterBtns}>
            {['all', 'gainers', 'losers'].map((f) => (
              <button
                key={f}
                type="button"
                className={`${styles.filterBtn} ${filter === f ? styles.activeFilter : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <div className={styles.searchBox}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
              <path d="M11 11l3 3" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>24h Change</th>
                  <th>24h Volume</th>
                  <th>Market Cap</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredCoins.map((coin) => (
                  <tr key={coin.symbol} className={styles.tableRow}>
                    <td className={styles.tdRank}>{coin.rank}</td>
                    <td>
                      <div className={styles.coinCell}>
                        <div
                          className={styles.coinBadge}
                          style={{ background: `${coin.color}22`, border: `1.5px solid ${coin.color}55` }}
                        >
                          <span style={{ color: coin.color, fontSize: 11, fontWeight: 800 }}>{coin.symbol[0]}</span>
                        </div>
                        <div>
                          <div className={styles.coinName}>{coin.name}</div>
                          <div className={styles.coinSymbol}>{coin.symbol}</div>
                        </div>
                      </div>
                    </td>
                    <td className={styles.tdPrice}>
                      ${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className={`${styles.changeBadge} ${coin.up ? styles.changeUp : styles.changeDown}`}>
                        {coin.up ? '▲' : '▼'} {Math.abs(coin.change).toFixed(2)}%
                      </span>
                    </td>
                    <td className={styles.tdMuted}>${coin.volume}</td>
                    <td className={styles.tdMuted}>${coin.cap}</td>
                    <td>
                      <a
                        href={`/exchange?swapTo=${coin.symbol === 'ETH' ? 'EXC' : 'ETH'}`}
                        className={styles.tradeBtn}
                        style={{ '--btn-color': coin.color }}
                      >
                        Trade
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
