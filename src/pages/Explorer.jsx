import { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { buildEtherscanUrl } from '../config/etherscan'
import styles from './Explorer.module.css'

const MAINNET_CHAIN_ID = 1

const shortAddr = (addr) => addr ? `${addr.slice(0, 10)}...${addr.slice(-6)}` : ''
const formatEth = (wei) => (Number(wei) / 1e18).toFixed(6)
const formatEthShort = (wei) => (Number(wei) / 1e18).toFixed(4)

function timeAgo(ts) {
  const diff = Math.floor(Date.now() / 1000) - Number(ts)
  if (diff < 60)    return `${diff}s ago`
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

// ─── Result: Address Info ──────────────────────────────
function AddressResult({ data }) {
  return (
    <div className={styles.resultCard}>
      <div className={styles.resultHeader}>
        <div className={styles.resultBadge} style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M2 16c0-3.3 3-6 7-6s7 2.7 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Address
        </div>
        <a href={`https://etherscan.io/address/${data.address}`} target="_blank" rel="noreferrer" className={styles.etherscanBtn}>
          View on Etherscan ↗
        </a>
      </div>

      <div className={styles.addressDisplay}>
        <span className={styles.addressLabel}>Address</span>
        <span className={styles.addressValue}>{data.address}</span>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statBox}>
          <span className={styles.statBoxLabel}>ETH Balance</span>
          <span className={styles.statBoxValue}>{formatEth(data.balance)} ETH</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statBoxLabel}>Transactions</span>
          <span className={styles.statBoxValue}>{data.txCount}</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statBoxLabel}>Tokens Found</span>
          <span className={styles.statBoxValue}>{data.tokens.length}</span>
        </div>
      </div>

      {/* Recent Transactions */}
      {data.transactions.length > 0 && (
        <div className={styles.subSection}>
          <h4 className={styles.subTitle}>Recent Transactions</h4>
          <div className={styles.txList}>
            {data.transactions.slice(0, 8).map((tx, i) => {
              const isSent = tx.from.toLowerCase() === data.address.toLowerCase()
              const success = tx.isError === '0'
              return (
                <div key={tx.hash} className={styles.txRow} style={{ '--i': i }}>
                  <span className={`${styles.txBadge} ${isSent ? styles.txSent : styles.txRecv}`}>
                    {isSent ? '↑ Sent' : '↓ Recv'}
                  </span>
                  <a href={`https://etherscan.io/tx/${tx.hash}`} target="_blank" rel="noreferrer" className={styles.txHash}>
                    {tx.hash.slice(0, 10)}…{tx.hash.slice(-6)}
                  </a>
                  <span className={styles.txValue}>
                    {isSent ? '-' : '+'}{formatEthShort(tx.value)} ETH
                  </span>
                  <span className={styles.txTime}>{timeAgo(tx.timeStamp)}</span>
                  <span className={`${styles.txStatus} ${success ? styles.txSuccess : styles.txFailed}`}>
                    {success ? 'Success' : 'Failed'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Token List */}
      {data.tokens.length > 0 && (
        <div className={styles.subSection}>
          <h4 className={styles.subTitle}>ERC-20 Tokens</h4>
          <div className={styles.tokenGrid}>
            {data.tokens.map((token, i) => (
              <div key={token.contract} className={styles.tokenCard} style={{ '--i': i }}>
                <div className={styles.tokenIcon}>{token.symbol.slice(0, 2)}</div>
                <div className={styles.tokenInfo}>
                  <span className={styles.tokenSymbol}>{token.symbol}</span>
                  <span className={styles.tokenName}>{token.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Result: Transaction Info ──────────────────────────
function TransactionResult({ data }) {
  const success = data.isError === '0' || data.status === '1'
  return (
    <div className={styles.resultCard}>
      <div className={styles.resultHeader}>
        <div className={styles.resultBadge} style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="2" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M5 7h8M5 10h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          Transaction
        </div>
        <a href={`https://etherscan.io/tx/${data.hash}`} target="_blank" rel="noreferrer" className={styles.etherscanBtn}>
          View on Etherscan ↗
        </a>
      </div>

      <div className={styles.detailGrid}>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Transaction Hash</span>
          <span className={styles.detailValue} style={{ fontSize: 12 }}>{data.hash}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Status</span>
          <span className={`${styles.statusPill} ${success ? styles.pillSuccess : styles.pillFailed}`}>
            {success ? '✓ Success' : '✗ Failed'}
          </span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Block Number</span>
          <span className={styles.detailValue}>{data.blockNumber}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Timestamp</span>
          <span className={styles.detailValue}>{timeAgo(data.timeStamp)}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>From</span>
          <span className={styles.detailValue} style={{ fontSize: 12 }}>{data.from}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>To</span>
          <span className={styles.detailValue} style={{ fontSize: 12 }}>{data.to}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Value</span>
          <span className={styles.detailValue}>{formatEth(data.value)} ETH</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Gas Used</span>
          <span className={styles.detailValue}>{Number(data.gasUsed).toLocaleString()}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Gas Price</span>
          <span className={styles.detailValue}>{(Number(data.gasPrice) / 1e9).toFixed(2)} Gwei</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Transaction Fee</span>
          <span className={styles.detailValue}>{(Number(data.gasUsed) * Number(data.gasPrice) / 1e18).toFixed(6)} ETH</span>
        </div>
        {data.confirmations && (
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Confirmations</span>
            <span className={styles.detailValue}>{Number(data.confirmations).toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Explorer Page ────────────────────────────────
export default function Explorer() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)      // { type: 'address' | 'transaction', data }
  const [error, setError] = useState('')
  const [recentSearches, setRecentSearches] = useState([])

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('explorer_searches') || '[]')
      setRecentSearches(saved)
    } catch { /* ignore */ }
  }, [])

  const saveSearch = (q, type) => {
    const updated = [{ query: q, type, time: Date.now() }, ...recentSearches.filter(s => s.query !== q)].slice(0, 6)
    setRecentSearches(updated)
    localStorage.setItem('explorer_searches', JSON.stringify(updated))
  }

  const detectType = (input) => {
    const trimmed = input.trim()
    if (/^0x[a-fA-F0-9]{64}$/.test(trimmed)) return 'transaction'
    if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) return 'address'
    if (/^\d+$/.test(trimmed)) return 'block'
    return 'unknown'
  }

  const handleSearch = async (e) => {
    e?.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return

    setLoading(true)
    setError('')
    setResult(null)

    const type = detectType(trimmed)

    try {
      if (type === 'address') {
        // Fetch balance, tx list, and tokens in parallel
        const [balRes, txRes, tokRes] = await Promise.all([
          fetch(buildEtherscanUrl(MAINNET_CHAIN_ID, { module: 'account', action: 'balance', address: trimmed, tag: 'latest' })).then(r => r.json()),
          fetch(buildEtherscanUrl(MAINNET_CHAIN_ID, { module: 'account', action: 'txlist', address: trimmed, startblock: '0', endblock: '99999999', page: '1', offset: '10', sort: 'desc' })).then(r => r.json()),
          fetch(buildEtherscanUrl(MAINNET_CHAIN_ID, { module: 'account', action: 'tokentx', address: trimmed, page: '1', offset: '50', sort: 'desc' })).then(r => r.json()),
        ])

        // Deduplicate tokens
        const seen = {}
        const tokens = []
        for (const tx of (tokRes.result || [])) {
          if (!seen[tx.contractAddress]) {
            seen[tx.contractAddress] = true
            tokens.push({ symbol: tx.tokenSymbol, name: tx.tokenName, contract: tx.contractAddress })
          }
        }

        setResult({
          type: 'address',
          data: {
            address: trimmed,
            balance: balRes.result || '0',
            transactions: txRes.result || [],
            txCount: (txRes.result || []).length,
            tokens: tokens.slice(0, 12),
          }
        })
        saveSearch(trimmed, 'address')

      } else if (type === 'transaction') {
        const res = await fetch(
          buildEtherscanUrl(MAINNET_CHAIN_ID, { module: 'proxy', action: 'eth_getTransactionByHash', txhash: trimmed })
        ).then(r => r.json())

        if (!res.result) throw new Error('Transaction not found')

        const receipt = await fetch(
          buildEtherscanUrl(MAINNET_CHAIN_ID, { module: 'proxy', action: 'eth_getTransactionReceipt', txhash: trimmed })
        ).then(r => r.json())

        const txData = res.result
        const rData = receipt.result || {}

        setResult({
          type: 'transaction',
          data: {
            hash: txData.hash,
            from: txData.from,
            to: txData.to || 'Contract Creation',
            value: parseInt(txData.value, 16).toString(),
            gasPrice: parseInt(txData.gasPrice, 16).toString(),
            gasUsed: rData.gasUsed ? parseInt(rData.gasUsed, 16).toString() : '21000',
            blockNumber: parseInt(txData.blockNumber, 16).toString(),
            status: rData.status ? parseInt(rData.status, 16).toString() : '1',
            isError: rData.status === '0x0' ? '1' : '0',
            timeStamp: Math.floor(Date.now() / 1000).toString(),
            confirmations: rData.blockNumber
              ? (parseInt(txData.blockNumber, 16)).toString()
              : '—',
          }
        })
        saveSearch(trimmed, 'transaction')

      } else {
        setError('Please enter a valid Ethereum address (0x…40 hex chars) or transaction hash (0x…64 hex chars).')
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch data. Please check the input and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickSearch = (q) => {
    setQuery(q)
    // Trigger search after state update
    setTimeout(() => {
      const trimmed = q.trim()
      if (trimmed) {
        setQuery(trimmed)
        // Re-run search
        setQuery(trimmed)
        handleSearchDirect(trimmed)
      }
    }, 50)
  }

  const handleSearchDirect = async (trimmed) => {
    setLoading(true)
    setError('')
    setResult(null)

    const type = detectType(trimmed)
    try {
      if (type === 'address') {
        const [balRes, txRes, tokRes] = await Promise.all([
          fetch(buildEtherscanUrl(MAINNET_CHAIN_ID, { module: 'account', action: 'balance', address: trimmed, tag: 'latest' })).then(r => r.json()),
          fetch(buildEtherscanUrl(MAINNET_CHAIN_ID, { module: 'account', action: 'txlist', address: trimmed, startblock: '0', endblock: '99999999', page: '1', offset: '10', sort: 'desc' })).then(r => r.json()),
          fetch(buildEtherscanUrl(MAINNET_CHAIN_ID, { module: 'account', action: 'tokentx', address: trimmed, page: '1', offset: '50', sort: 'desc' })).then(r => r.json()),
        ])
        const seen = {}
        const tokens = []
        for (const tx of (tokRes.result || [])) {
          if (!seen[tx.contractAddress]) { seen[tx.contractAddress] = true; tokens.push({ symbol: tx.tokenSymbol, name: tx.tokenName, contract: tx.contractAddress }) }
        }
        setResult({ type: 'address', data: { address: trimmed, balance: balRes.result || '0', transactions: txRes.result || [], txCount: (txRes.result || []).length, tokens: tokens.slice(0, 12) } })
        saveSearch(trimmed, 'address')
      } else if (type === 'transaction') {
        const res = await fetch(buildEtherscanUrl(MAINNET_CHAIN_ID, { module: 'proxy', action: 'eth_getTransactionByHash', txhash: trimmed })).then(r => r.json())
        if (!res.result) throw new Error('Transaction not found')
        const receipt = await fetch(buildEtherscanUrl(MAINNET_CHAIN_ID, { module: 'proxy', action: 'eth_getTransactionReceipt', txhash: trimmed })).then(r => r.json())
        const txData = res.result
        const rData = receipt.result || {}
        setResult({ type: 'transaction', data: { hash: txData.hash, from: txData.from, to: txData.to || 'Contract Creation', value: parseInt(txData.value, 16).toString(), gasPrice: parseInt(txData.gasPrice, 16).toString(), gasUsed: rData.gasUsed ? parseInt(rData.gasUsed, 16).toString() : '21000', blockNumber: parseInt(txData.blockNumber, 16).toString(), status: rData.status ? parseInt(rData.status, 16).toString() : '1', isError: rData.status === '0x0' ? '1' : '0', timeStamp: Math.floor(Date.now() / 1000).toString(), confirmations: rData.blockNumber ? (parseInt(txData.blockNumber, 16)).toString() : '—' } })
        saveSearch(trimmed, 'transaction')
      } else {
        setError('Please enter a valid Ethereum address or transaction hash.')
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch data.')
    } finally {
      setLoading(false)
    }
  }

  // Sample addresses for demo
  const sampleLookups = [
    { label: 'Vitalik.eth', value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', type: 'address' },
    { label: 'Uniswap V3 Router', value: '0xE592427A0AEce92De3Edee1F18E0157C05861564', type: 'address' },
  ]

  return (
    <DashboardLayout activeOverride="explorer">
      <div className={styles.container}>

        {/* Header */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Blockchain Explorer</h1>
            <p className={styles.subtitle}>Look up any Ethereum address, transaction, or block</p>
          </div>
          <div className={styles.networkBadge}>
            <span className={styles.networkDot} />
            Ethereum Mainnet
          </div>
        </header>

        {/* Search Bar */}
        <form className={styles.searchForm} onSubmit={handleSearch}>
          <div className={styles.searchInputWrap}>
            <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="8.5" cy="8.5" r="6" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M13 13l4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by Address (0x...) or Tx Hash (0x...)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              id="explorer-search-input"
            />
            {query && (
              <button type="button" className={styles.clearBtn} onClick={() => { setQuery(''); setResult(null); setError('') }}>
                ✕
              </button>
            )}
          </div>
          <button type="submit" className={styles.searchBtn} disabled={loading} id="explorer-search-btn">
            {loading ? (
              <><div className={styles.spinner} /> Searching...</>
            ) : (
              'Search'
            )}
          </button>
        </form>

        {/* Quick Links */}
        {!result && !loading && (
          <div className={styles.quickSection}>
            <div className={styles.quickRow}>
              <span className={styles.quickLabel}>Try:</span>
              {sampleLookups.map(s => (
                <button key={s.label} className={styles.quickBtn} onClick={() => handleQuickSearch(s.value)}>
                  <span className={styles.quickType}>{s.type === 'address' ? '📋' : '🔗'}</span>
                  {s.label}
                </button>
              ))}
            </div>

            {recentSearches.length > 0 && (
              <div className={styles.recentSection}>
                <h4 className={styles.recentTitle}>Recent Searches</h4>
                <div className={styles.recentList}>
                  {recentSearches.map((s, i) => (
                    <button key={i} className={styles.recentItem} onClick={() => handleQuickSearch(s.query)}>
                      <span className={styles.recentIcon}>
                        {s.type === 'address' ? '👤' : '📝'}
                      </span>
                      <span className={styles.recentQuery}>{shortAddr(s.query)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Info Cards */}
            <div className={styles.infoGrid}>
              <div className={styles.infoCard}>
                <div className={styles.infoIcon} style={{ background: 'rgba(124,58,237,0.12)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" stroke="#a78bfa" strokeWidth="1.8"/>
                    <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </div>
                <h4>Address Lookup</h4>
                <p>View ETH balance, transaction history, and ERC-20 tokens for any Ethereum address.</p>
              </div>
              <div className={styles.infoCard}>
                <div className={styles.infoIcon} style={{ background: 'rgba(16,185,129,0.12)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="#34d399" strokeWidth="1.8"/>
                    <path d="M7 9h10M7 13h6" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <h4>Transaction Details</h4>
                <p>Look up any transaction by hash to see status, gas used, value transferred, and more.</p>
              </div>
              <div className={styles.infoCard}>
                <div className={styles.infoIcon} style={{ background: 'rgba(249,115,22,0.12)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="3" stroke="#fb923c" strokeWidth="1.8"/>
                    <path d="M3 9h18M9 3v18" stroke="#fb923c" strokeWidth="1.5"/>
                  </svg>
                </div>
                <h4>Live Data</h4>
                <p>All data is fetched in real-time from the Ethereum blockchain via Etherscan API.</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner} />
            <p>Querying the Ethereum blockchain...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className={styles.errorBanner}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="7" stroke="#ef4444" strokeWidth="1.5"/>
              <path d="M9 6v4" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="9" cy="13" r="0.8" fill="#ef4444"/>
            </svg>
            {error}
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className={styles.resultSection}>
            {result.type === 'address' && <AddressResult data={result.data} />}
            {result.type === 'transaction' && <TransactionResult data={result.data} />}
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
