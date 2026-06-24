import { useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import styles from './Wallet.module.css'
import { useWallet } from '../context/WalletContext'

// ─── Helpers ────────────────────────────────────────────────
const shortAddr = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : ''
const formatEthShort = (wei) => (Number(wei) / 1e18).toFixed(4)
const timeAgo = (ts) => {
  const diff = Math.floor(Date.now() / 1000) - Number(ts)
  if (diff < 60)   return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`
  if (diff < 86400)return `${Math.floor(diff/3600)}h ago`
  return `${Math.floor(diff/86400)}d ago`
}

// ─── Copy button ─────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <button className={styles.copyBtn} onClick={copy} title="Copy address">
      {copied
        ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-7" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        : <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="4" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M4 4V3a1 1 0 011-1h6a1 1 0 011 1v7a1 1 0 01-1 1h-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
      }
    </button>
  )
}

// ─── MetaMask Not Installed Banner ───────────────────────────
function NotInstalled() {
  return (
    <div className={styles.notInstalled}>
      <div className={styles.notInstalledIcon}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <rect width="48" height="48" rx="14" fill="rgba(124,58,237,0.12)"/>
          <path d="M24 12L38 18V28C38 34.627 31.73 40.307 24 42C16.27 40.307 10 34.627 10 28V18L24 12Z" stroke="#7c3aed" strokeWidth="2" fill="rgba(124,58,237,0.08)"/>
          <path d="M24 20V28" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="24" cy="33" r="1.5" fill="#7c3aed"/>
        </svg>
      </div>
      <h3>MetaMask Not Detected</h3>
      <p>Install the MetaMask browser extension to connect your wallet.</p>
      <a
        href="https://metamask.io/download/"
        target="_blank"
        rel="noreferrer"
        className={styles.installBtn}
        id="wallet-install-metamask"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2v10M5 8l4 4 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 14h12" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
        Install MetaMask
      </a>
    </div>
  )
}

// ─── Connect Screen ──────────────────────────────────────────
function ConnectScreen({ onConnect, status, error }) {
  return (
    <div className={styles.connectScreen}>
      <div className={styles.connectCard}>
        {/* Animated MetaMask Fox placeholder */}
        <div className={styles.metamaskIcon}>
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <rect width="80" height="80" rx="22" fill="rgba(124,58,237,0.12)"/>
            {/* Fox shape simplified */}
            <polygon points="40,12 58,24 53,44 40,50 27,44 22,24" fill="#f6851b" opacity="0.9"/>
            <polygon points="40,12 22,24 28,32 40,34 52,32 58,24" fill="#e2761b"/>
            <polygon points="28,32 22,24 18,34 27,44" fill="#f6851b"/>
            <polygon points="52,32 58,24 62,34 53,44" fill="#f6851b"/>
            <polygon points="28,32 40,34 37,42 32,40" fill="#cd6116"/>
            <polygon points="52,32 43,42 40,34 48,40" fill="#cd6116"/>
            <circle cx="33" cy="30" r="3" fill="white"/>
            <circle cx="47" cy="30" r="3" fill="white"/>
            <circle cx="33" cy="31" r="1.5" fill="#333"/>
            <circle cx="47" cy="31" r="1.5" fill="#333"/>
            <polygon points="40,52 35,46 45,46" fill="#f6851b" opacity="0.8"/>
          </svg>
          <div className={styles.metamaskIconRing}/>
        </div>

        <h2 className={styles.connectTitle}>Connect Your Wallet</h2>
        <p className={styles.connectDesc}>
          Link your MetaMask wallet to view your real-time ETH balance,
          transaction history, and token holdings — all powered by Etherscan.
        </p>

        <div className={styles.featureList}>
          {[
            { icon: '💰', text: 'Live ETH balance via Etherscan' },
            { icon: '📋', text: 'Full transaction history' },
            { icon: '🪙', text: 'ERC-20 token detection' },
            { icon: '🌐', text: 'Multi-network support' },
          ].map(f => (
            <div key={f.icon} className={styles.featureItem}>
              <span>{f.icon}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <button
          className={`${styles.connectBtn} ${status === 'connecting' ? styles.connecting : ''}`}
          onClick={onConnect}
          disabled={status === 'connecting'}
          id="wallet-connect-metamask"
        >
          {status === 'connecting' ? (
            <>
              <div className={styles.spinner}/>
              Connecting…
            </>
          ) : (
            <>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect width="22" height="22" rx="6" fill="rgba(255,255,255,0.15)"/>
                <polygon points="11,4 17,8 15,14 11,16 7,14 5,8" fill="#f6851b"/>
              </svg>
              Connect MetaMask
            </>
          )}
        </button>

        <p className={styles.secureNote}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1L2 3v4c0 2.76 1.95 5.34 4.5 6 2.55-.66 4.5-3.24 4.5-6V3L6.5 1z" stroke="#34d399" strokeWidth="1.3" fill="rgba(16,185,129,0.15)"/>
            <path d="M4.5 6.5l1.5 1.5 2.5-2.5" stroke="#34d399" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Non-custodial · Read-only · No private keys stored
        </p>
      </div>
    </div>
  )
}

// ─── Connected Wallet Dashboard ──────────────────────────────
function WalletDashboard({ account, balance, network, txHistory, txLoading, ethPrice, tokenList, onDisconnect }) {
  const [activeTab, setActiveTab] = useState('transactions')
  const ethBal = balance ? formatEthShort(balance) : '—'
  const usdBal = balance && ethPrice
    ? `$${(Number(balance) / 1e18 * ethPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    : '—'

  return (
    <div className={styles.walletDash}>

      {/* ── Wallet Card ── */}
      <div className={styles.walletCard}>
        <div className={styles.walletCardBg}/>
        <div className={styles.walletCardTop}>
          <div className={styles.walletBrand}>
            <div className={styles.mmDot}/>
            <span>MetaMask</span>
          </div>
          <div className={styles.networkBadge}>
            <span className={styles.networkDot}/>
            {network || 'Unknown Network'}
          </div>
        </div>

        <div className={styles.balanceSection}>
          <p className={styles.balLabel}>Total Balance</p>
          <div className={styles.balEth}>{ethBal} <span>ETH</span></div>
          <div className={styles.balUsd}>{usdBal}</div>
        </div>

        <div className={styles.walletCardBottom}>
          <div className={styles.addrRow}>
            <span className={styles.addrLabel}>Address</span>
            <div className={styles.addrGroup}>
              <span className={styles.addrValue}>{shortAddr(account)}</span>
              <CopyButton text={account} />
              <a
                href={`https://etherscan.io/address/${account}`}
                target="_blank"
                rel="noreferrer"
                className={styles.etherscanLink}
                title="View on Etherscan"
                id="wallet-etherscan-link"
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  <path d="M8 1h4m0 0v4m0-4L6 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>
          </div>
          <button className={styles.disconnectBtn} onClick={onDisconnect} id="wallet-disconnect">
            Disconnect
          </button>
        </div>
      </div>

      {/* ── Quick Stats ── */}
      <div className={styles.quickStats}>
        <div className={styles.qStat}>
          <span className={styles.qStatLabel}>ETH Price</span>
          <span className={styles.qStatValue}>${ethPrice ? ethPrice.toLocaleString() : '—'}</span>
        </div>
        <div className={styles.qDivider}/>
        <div className={styles.qStat}>
          <span className={styles.qStatLabel}>Transactions</span>
          <span className={styles.qStatValue}>{txHistory.length}</span>
        </div>
        <div className={styles.qDivider}/>
        <div className={styles.qStat}>
          <span className={styles.qStatLabel}>Tokens Found</span>
          <span className={styles.qStatValue}>{tokenList.length}</span>
        </div>
        <div className={styles.qDivider}/>
        <div className={styles.qStat}>
          <span className={styles.qStatLabel}>Network</span>
          <span className={styles.qStatValue} style={{ fontSize: 12 }}>{network || '—'}</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className={styles.tabs}>
        {['transactions', 'tokens'].map(tab => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab)}
            id={`wallet-tab-${tab}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Transactions ── */}
      {activeTab === 'transactions' && (
        <div className={styles.txPanel}>
          {txLoading ? (
            <div className={styles.loadingPanel}>
              <div className={styles.spinner}/>
              <p>Fetching transactions from Etherscan…</p>
            </div>
          ) : txHistory.length === 0 ? (
            <div className={styles.emptyPanel}>
              <p>No transactions found for this address.</p>
            </div>
          ) : (
            <div className={styles.txTable}>
              <div className={styles.txTableHead}>
                <span>Type</span>
                <span>Hash</span>
                <span>Amount (ETH)</span>
                <span>Time</span>
                <span>Status</span>
              </div>
              {txHistory.map((tx, i) => {
                const isSent = tx.from.toLowerCase() === account.toLowerCase()
                const success = tx.isError === '0' && tx.txreceipt_status !== '0'
                return (
                  <div
                    key={tx.hash}
                    className={styles.txTableRow}
                    style={{ '--row-i': i }}
                  >
                    <span className={`${styles.txBadge} ${isSent ? styles.txSent : styles.txReceived}`}>
                      {isSent ? '↑ Sent' : '↓ Recv'}
                    </span>
                    <a
                      href={`https://etherscan.io/tx/${tx.hash}`}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.txHash}
                    >
                      {tx.hash.slice(0, 8)}…{tx.hash.slice(-4)}
                    </a>
                    <span className={`${styles.txAmt} ${isSent ? styles.txAmtSent : styles.txAmtRecv}`}>
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
          )}
        </div>
      )}

      {/* ── Tokens ── */}
      {activeTab === 'tokens' && (
        <div className={styles.txPanel}>
          {tokenList.length === 0 ? (
            <div className={styles.emptyPanel}>
              <p>No ERC-20 tokens detected for this address.</p>
            </div>
          ) : (
            <div className={styles.tokenGrid}>
              {tokenList.map((token, i) => (
                <div key={token.contract} className={styles.tokenCard} style={{ '--card-i': i }}>
                  <div className={styles.tokenSymbolBadge}>
                    {token.symbol.slice(0, 3)}
                  </div>
                  <div className={styles.tokenInfo}>
                    <span className={styles.tokenSymbol}>{token.symbol}</span>
                    <span className={styles.tokenName}>{token.name}</span>
                  </div>
                  <a
                    href={`https://etherscan.io/token/${token.contract}?a=${account}`}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.tokenLink}
                    id={`wallet-token-${token.symbol}`}
                  >
                    View ↗
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────
export default function Wallet() {
  const mm = useWallet()

  return (
    <DashboardLayout activeOverride="wallet">
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Web3 Wallet</h1>
            <p className={styles.pageDate}>Connect your MetaMask wallet to view live on-chain data</p>
          </div>
          {mm.account && (
            <div className={styles.connectedPill}>
              <span className={styles.connectedDot}/>
              Connected
            </div>
          )}
        </div>

        {!mm.isMetaMask ? (
          <NotInstalled />
        ) : mm.status === 'idle' || mm.status === 'error' || mm.status === 'connecting' ? (
          <ConnectScreen
            onConnect={mm.connect}
            status={mm.status}
            error={mm.error}
          />
        ) : (
          <WalletDashboard
            account={mm.account}
            balance={mm.balance}
            network={mm.network}
            txHistory={mm.txHistory}
            txLoading={mm.txLoading}
            ethPrice={mm.ethPrice}
            tokenList={mm.tokenList}
            onDisconnect={mm.disconnect}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
