import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styles from './AuthPage.module.css'
import { useWallet } from '../context/WalletContext'
import { getWalletProfile, saveWalletProfile } from '../utils/walletProfile'

export default function SignUp() {
  const navigate = useNavigate()
  const { status, account, connect, error, isCorrectNetwork, switchToSepolia } = useWallet()
  const [displayName, setDisplayName] = useState('')

  useEffect(() => {
    if (account) {
      const profile = getWalletProfile(account)
      if (profile?.displayName) setDisplayName(profile.displayName)
    }
  }, [account])

  useEffect(() => {
    if (status === 'connected' && account && isCorrectNetwork && displayName.trim()) {
      saveWalletProfile(account, { displayName: displayName.trim() })
      navigate('/dashboard', { replace: true })
    }
  }, [status, account, isCorrectNetwork, displayName, navigate])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!account) {
      await connect()
      return
    }
    if (!isCorrectNetwork) {
      await switchToSepolia()
      return
    }
    if (!displayName.trim()) return
    saveWalletProfile(account, { displayName: displayName.trim() })
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.gridBg} />
      <header className={styles.topBar}>
        <Link to="/" className={styles.backBtn} id="signup-back-home">
          ← Back to Home
        </Link>
        <Link to="/signin" className={styles.switchBtn} id="signup-goto-signin">
          Sign in
        </Link>
      </header>

      <main className={styles.authMain}>
        <div className={styles.authCard}>
          <h1 className={styles.authTitle}>Create your Web3 profile</h1>
          <p className={styles.authSubtitle}>
              Connect your wallet, choose a display name, and start using live Sepolia features:
              swaps, staking, NFT minting, and institutional settlement demos.
          </p>

          {error && <div className={styles.errorBanner}>{error}</div>}

          <form className={styles.authForm} onSubmit={handleSaveProfile} noValidate>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="signup-name">Display name</label>
              <div className={styles.inputWrap}>
                <input
                  id="signup-name"
                  className={styles.authInput}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Trader"
                  required
                />
              </div>
            </div>

            {!account ? (
              <button type="submit" className={styles.submitBtn} disabled={status === 'connecting'}>
                {status === 'connecting' ? 'Connecting…' : 'Connect Wallet & Continue'}
              </button>
            ) : !isCorrectNetwork ? (
              <button type="button" className={styles.submitBtn} onClick={switchToSepolia}>
                Switch to Sepolia Testnet
              </button>
            ) : (
              <button type="submit" className={styles.submitBtn} id="signup-submit">
                Save Profile & Open Dashboard
              </button>
            )}
          </form>

          {account && (
            <p className={styles.authFooterNote}>
              Connected: <code>{account.slice(0, 6)}…{account.slice(-4)}</code>
            </p>
          )}

          <p className={styles.authFooterNote}>
            Already connected? <Link to="/signin" className={styles.authLink}>Go to dashboard</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
