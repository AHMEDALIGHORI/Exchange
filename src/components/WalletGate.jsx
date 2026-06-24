import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { saveWalletProfile } from '../utils/walletProfile'
import styles from './WalletGate.module.css'

export default function WalletGate({ children, title = 'Connect your wallet' }) {
  const { status, account, connect, error, isCorrectNetwork, switchToSepolia } = useWallet()

  useEffect(() => {
    if (status === 'connected' && account) {
      saveWalletProfile(account, { lastSeenAt: Date.now() })
    }
  }, [status, account])

  if (status === 'connected' && account) {
    if (!isCorrectNetwork) {
      return (
        <div className={styles.wrap}>
          <div className={styles.card}>
            <h1>Switch to Sepolia</h1>
            <p>ExChange on-chain features run on Sepolia testnet. Switch your wallet network to continue.</p>
            {error && <p className={styles.error}>{error}</p>}
            <button type="button" className={styles.primaryBtn} onClick={switchToSepolia}>
              Switch to Sepolia
            </button>
          </div>
        </div>
      )
    }
    return children
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <span className={styles.badge}>Web3 Required</span>
        <h1>{title}</h1>
        <p>
          Connect MetaMask on Sepolia testnet to access live balances, swaps, staking, and your on-chain portfolio.
          No passwords are stored — your wallet is your account.
        </p>
        {error && <p className={styles.error}>{error}</p>}
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={connect}
          disabled={status === 'connecting'}
        >
          {status === 'connecting' ? 'Connecting…' : 'Connect MetaMask'}
        </button>
        <p className={styles.hint}>
          Browse live markets without a wallet on <Link to="/markets">Markets</Link>.
        </p>
      </div>
    </div>
  )
}
