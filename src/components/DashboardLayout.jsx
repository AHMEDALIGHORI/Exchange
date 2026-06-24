import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import styles from './DashboardLayout.module.css'
import Footer from './Footer'
import Logo from './Logo'
import { useWallet } from '../context/WalletContext'
import { clearWalletSession } from '../utils/walletProfile'

const navItems = [
  {
    id: 'overview', label: 'Overview', to: '/dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="2" width="7" height="7" rx="1.5" fill="currentColor"/>
        <rect x="11" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity=".5"/>
        <rect x="2" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity=".5"/>
        <rect x="11" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity=".5"/>
      </svg>
    )
  },
  {
    id: 'portfolio', label: 'Portfolio', to: '/portfolio',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M2 10 Q5 4 10 8 Q14 12 18 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <path d="M2 10 Q5 4 10 8 Q14 12 18 5 V17 H2Z" fill="currentColor" opacity=".15"/>
      </svg>
    )
  },
  {
    id: 'markets', label: 'Markets', to: '/markets',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="12" width="3" height="6" rx="1" fill="currentColor"/>
        <rect x="7" y="8" width="3" height="10" rx="1" fill="currentColor"/>
        <rect x="12" y="5" width="3" height="13" rx="1" fill="currentColor"/>
        <rect x="17" y="2" width="1" height="16" rx=".5" fill="currentColor" opacity=".3"/>
      </svg>
    )
  },
  {
    id: 'transactions', label: 'Transactions', to: '/transactions',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 6h14M3 10h10M3 14h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M15 12l3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    id: 'exchange', label: 'Exchange', to: '/exchange',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 8h12M13 5l3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 12H4M7 9l-3 3 3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    id: 'wallet', label: 'Wallet', to: '/wallet',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="5" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M2 9h16" stroke="currentColor" strokeWidth="1.8"/>
        <circle cx="14" cy="13" r="1.2" fill="currentColor"/>
      </svg>
    )
  },
]

const blockchainItems = [
  {
    id: 'explorer', label: 'Explorer', to: '/explorer',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M13 13l4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    id: 'gas', label: 'Gas Tracker', to: '/gas-tracker',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M6 16V6a2 2 0 012-2h4a2 2 0 012 2v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M14 8l2-2v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4 16h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M8 8h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    id: 'staking', label: 'Staking', to: '/staking',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M10 6v8M7.5 8.5c0-1.1 1.1-1.5 2.5-1.5s2.5.4 2.5 1.5S11.4 10 10 10s-2.5.6-2.5 1.5S8.6 13 10 13s2.5-.4 2.5-1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    id: 'defi', label: 'DeFi', to: '/defi',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 10c0-3.87 3.13-7 7-7s7 3.13 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M6 10a4 4 0 018 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
        <path d="M10 10v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    id: 'institutional', label: 'Institutional', to: '/institutional-settlement',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 17h14M5 17V8M10 17V8M15 17V8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
        <path d="M2.5 8h15L10 3 2.5 8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
        <path d="M7 11h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".55"/>
      </svg>
    )
  },
  {
    id: 'nft', label: 'NFT Gallery', to: '/nft',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="3" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M3 13l4-4 3 3 2-2 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="13" cy="7" r="1.5" fill="currentColor"/>
      </svg>
    )
  },
]

const web3LabsItems = [
  {
    id: 'labs-arbitrage', label: 'Arbitrage Builder', to: '/labs/arbitrage',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2v16M2 10h16M14 6l4 4-4 4M6 14l-4-4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    id: 'labs-bridge', label: 'Bridge Simulator', to: '/labs/bridge',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 13V7a3 3 0 013-3h8a3 3 0 013 3v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M2 13h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    id: 'labs-playground', label: 'Solidity Playground', to: '/labs/playground',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M6 14l-4-4 4-4M14 6l4 4-4 4M11.5 5l-3 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    id: 'labs-token', label: 'Token Generator', to: '/labs/token-generator',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M10 6v8M8 8h4M7.5 11h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    id: 'labs-multisig', label: 'Multi-Sig Safe', to: '/labs/multisig',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M10 3v14M3 10h14" stroke="currentColor" strokeWidth="1.8"/>
      </svg>
    )
  }
]

const bottomItems = [
  {
    id: 'settings', label: 'Settings',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    id: 'logout', label: 'Log Out',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M8 3H4a1 1 0 00-1 1v12a1 1 0 001 1h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M13 14l4-4-4-4M17 10H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
]

function getActiveItem(pathname, activeOverride) {
  if (activeOverride) return activeOverride
  if (pathname === '/wallet') return 'wallet'
  if (pathname === '/portfolio') return 'portfolio'
  if (pathname === '/markets') return 'markets'
  if (pathname === '/transactions') return 'transactions'
  if (pathname === '/exchange') return 'exchange'
  if (pathname === '/explorer') return 'explorer'
  if (pathname === '/gas-tracker') return 'gas'
  if (pathname === '/staking') return 'staking'
  if (pathname === '/defi') return 'defi'
  if (pathname === '/institutional-settlement') return 'institutional'
  if (pathname === '/nft') return 'nft'
  if (pathname === '/labs/arbitrage') return 'labs-arbitrage'
  if (pathname === '/labs/bridge') return 'labs-bridge'
  if (pathname === '/labs/playground') return 'labs-playground'
  if (pathname === '/labs/token-generator') return 'labs-token'
  if (pathname === '/labs/multisig') return 'labs-multisig'
  return 'overview'
}

export default function DashboardLayout({ children, activeOverride, showFooter = true }) {
  const location = useLocation()
  const active = getActiveItem(location.pathname, activeOverride)
  const navRef = useRef(null)
  const { disconnect } = useWallet()

  useEffect(() => {
    const activeLink = navRef.current?.querySelector('[aria-current="page"]')
    activeLink?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [active])

  const handleBottomItemClick = async (id) => {
    if (id === 'logout') {
      clearWalletSession()
      await disconnect()
      window.location.href = '/'
    }
  }

  return (
    <div className={styles.layout}>
      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>
        <Link to="/" className={styles.sidebarLogo}>
          <Logo size={28} className={styles.logoIcon} interactive />
          <span className={styles.logoName}>ExChange</span>
        </Link>

        <nav className={styles.sidebarNav} ref={navRef} aria-label="Dashboard navigation">
          <p className={styles.navGroup}>Main</p>
          {navItems.map(item => (
            <Link
              key={item.id}
              to={item.to}
              className={`${styles.navItem} ${active === item.id ? styles.navActive : ''}`}
              id={`dash-nav-${item.id}`}
              aria-current={active === item.id ? 'page' : undefined}
              style={{ textDecoration: 'none' }}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}

          <p className={styles.navGroup} style={{ marginTop: 16 }}>On-chain</p>
          {blockchainItems.map(item => (
            <Link
              key={item.id}
              to={item.to}
              className={`${styles.navItem} ${active === item.id ? styles.navActive : ''}`}
              id={`dash-nav-${item.id}`}
              aria-current={active === item.id ? 'page' : undefined}
              style={{ textDecoration: 'none' }}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}

          <p className={styles.navGroup} style={{ marginTop: 16 }}>Labs</p>
          {web3LabsItems.map(item => (
            <Link
              key={item.id}
              to={item.to}
              className={`${styles.navItem} ${active === item.id ? styles.navActive : ''}`}
              id={`dash-nav-${item.id}`}
              aria-current={active === item.id ? 'page' : undefined}
              style={{ textDecoration: 'none' }}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <p className={styles.navGroup}>Account</p>
          {bottomItems.map(item => (
            <button
              key={item.id}
              className={`${styles.navItem} ${item.id === 'logout' ? styles.logoutItem : ''}`}
              id={`dash-nav-${item.id}`}
              onClick={() => handleBottomItemClick(item.id)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* ── Main ── */}
      <main className={styles.main}>
        {children}
        {showFooter && <Footer />}
      </main>
    </div>
  )
}
