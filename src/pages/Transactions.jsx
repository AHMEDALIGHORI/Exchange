import { useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import styles from './Transactions.module.css'
import { useWallet } from '../context/WalletContext'
import { getExplorerTxUrl } from '../config/contracts'

export default function Transactions() {
  const { account, txHistory, txLoading, ethPrice } = useWallet()
  const [filter, setFilter] = useState('all') // all | sent | received | pending
  const [search, setSearch] = useState('')

  const ethPriceNum = ethPrice || 0

  const formatEthShort = (wei) => (Number(wei) / 1e18).toFixed(4)
  const timeAgo = (ts) => {
    const diff = Math.floor(Date.now() / 1000) - Number(ts)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  const rawHistory = (txHistory || []).map((tx) => {
    const isSent = tx.from.toLowerCase() === account.toLowerCase()
    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      timeStamp: tx.timeStamp,
      isError: tx.isError,
      symbol: 'ETH',
      name: 'Ethereum',
      color: isSent ? '#ef4444' : '#34d399',
      isSent,
    }
  })

  // Apply filters and search
  const filteredHistory = rawHistory.filter(tx => {
    const matchesSearch = tx.hash.toLowerCase().includes(search.toLowerCase()) || 
                          tx.symbol.toLowerCase().includes(search.toLowerCase()) ||
                          tx.to.toLowerCase().includes(search.toLowerCase())
    
    if (filter === 'sent') return matchesSearch && tx.isSent
    if (filter === 'received') return matchesSearch && !tx.isSent
    if (filter === 'pending') return matchesSearch && tx.isError !== '0' // simple mock filter
    return matchesSearch
  })

  return (
    <DashboardLayout activeOverride="transactions">
      <div className={styles.container}>
        
        {/* Header */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Transaction Ledger</h1>
            <p className={styles.subtitle}>Live Sepolia transaction history from Etherscan</p>
          </div>
        </header>

        {/* Filters Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.filterBtns}>
            {['all', 'sent', 'received', 'pending'].map(f => (
              <button
                key={f}
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
              placeholder="Search by transaction hash..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Ledger Panel */}
        <div className={styles.ledgerCard}>
          {txLoading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <p>Syncing transactions with Etherscan...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className={styles.emptyState}>
              <p>{rawHistory.length === 0 ? 'No Sepolia transactions found for this wallet yet.' : 'No transactions match your search/filter criteria.'}</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Tx Hash</th>
                    <th>Direction</th>
                    <th>Value</th>
                    <th>USD Amount</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((tx, i) => {
                    const success = tx.isError === '0'
                    const usdValue = Number(tx.value) / 1e18 * ethPriceNum
                    return (
                      <tr key={tx.hash} className={styles.tableRow} style={{ '--i': i }}>
                        <td>
                          <span className={`${styles.badge} ${tx.isSent ? styles.badgeSent : styles.badgeRecv}`}>
                            {tx.isSent ? 'Sent' : 'Recv'}
                          </span>
                        </td>
                        <td>
                          <a 
                            href={getExplorerTxUrl(tx.hash)}
                            target="_blank" 
                            rel="noreferrer"
                            className={styles.hashLink}
                          >
                            {tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}
                          </a>
                        </td>
                        <td className={styles.dirCell}>
                          <span className={styles.dirLabel}>{tx.isSent ? 'To:' : 'From:'}</span>
                          <span className={styles.dirAddr}>
                            {tx.isSent ? tx.to.slice(0, 8) + '...' : tx.from.slice(0, 8) + '...'}
                          </span>
                        </td>
                        <td className={styles.valueCell}>
                          {formatEthShort(tx.value)} {tx.symbol}
                        </td>
                        <td className={styles.usdCell}>
                          ${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </td>
                        <td className={styles.timeCell}>{timeAgo(tx.timeStamp)}</td>
                        <td>
                          <span className={`${styles.statusLabel} ${success ? styles.success : styles.failed}`}>
                            {success ? 'Success' : 'Failed'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  )
}
