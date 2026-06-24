import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styles from './AuthPage.module.css'
import { useWallet } from '../context/WalletContext'
import { saveWalletProfile } from '../utils/walletProfile'

export default function SignIn() {
  const navigate = useNavigate()
  const { status, account, connect, error, isCorrectNetwork, switchToSepolia } = useWallet()

  useEffect(() => {
    if (status === 'connected' && account && isCorrectNetwork) {
      saveWalletProfile(account, { lastSeenAt: Date.now() })
      navigate('/dashboard', { replace: true })
    }
  }, [status, account, isCorrectNetwork, navigate])

  const handleConnect = async () => {
    await connect()
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.gridBg} />
      <header className={styles.topBar}>
        <Link to="/" className={styles.backBtn} id="signin-back-home">
          ← Back to Home
        </Link>
        <Link to="/signup" className={styles.switchBtn} id="signin-goto-signup">
          Create profile
        </Link>
      </header>

      <main className={styles.authMain}>
        <div className={styles.authCard}>
          <h1 className={styles.authTitle}>Sign in with your wallet</h1>
          <p className={styles.authSubtitle}>
              ExChange uses non-custodial Web3 authentication. Connect MetaMask on Sepolia testnet —
              no passwords stored on our servers.
          </p>

          {error && <div className={styles.errorBanner}>{error}</div>}

          {status === 'connected' && !isCorrectNetwork ? (
            <button type="button" className={styles.submitBtn} onClick={switchToSepolia}>
              Switch to Sepolia Testnet
            </button>
          ) : (
            <button
              type="button"
              className={styles.submitBtn}
              onClick={handleConnect}
              disabled={status === 'connecting'}
              id="wallet-signin-btn"
            >
              {status === 'connecting' ? 'Connecting…' : 'Connect MetaMask'}
            </button>
          )}

          <p className={styles.authFooterNote}>
            New here? <Link to="/signup" className={styles.authLink}>Set up your wallet profile</Link>
          </p>
          <p className={styles.authFooterNote}>
            Just browsing? <Link to="/markets" className={styles.authLink}>View live markets</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
