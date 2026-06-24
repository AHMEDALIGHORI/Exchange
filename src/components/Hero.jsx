import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styles from './Hero.module.css'

const NETWORK_NODES = [
  { id: 'btc', label: '₿', color: '#f7931a', angle: -50, radius: 48 },
  { id: 'eth', label: 'Ξ', color: '#627eea', angle: 15, radius: 52 },
  { id: 'ada', label: 'A', color: '#0033ad', angle: 75, radius: 50 },
  { id: 'xrp', label: '✕', color: '#3f3f46', angle: 130, radius: 48 },
  { id: 'ltc', label: 'Ł', color: '#345d9d', angle: 200, radius: 50 },
  { id: 'dot', label: '●', color: '#e6007a', angle: 250, radius: 52 },
]

function CryptoNetworkVisual() {
  const cx = 50
  const cy = 50

  const nodePositions = NETWORK_NODES.map((node) => {
    const rad = (node.angle * Math.PI) / 180
    return {
      ...node,
      x: cx + node.radius * Math.cos(rad),
      y: cy + node.radius * Math.sin(rad),
    }
  })

  return (
    <div className={styles.networkStage} aria-hidden="true">
      <svg className={styles.networkLines} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        {nodePositions.map((node) => (
          <line
            key={`line-${node.id}`}
            x1={cx}
            y1={cy}
            x2={node.x}
            y2={node.y}
            className={styles.networkLine}
          />
        ))}
        {nodePositions.map((a, i) =>
          nodePositions.slice(i + 1).map((b) => (
            <line
              key={`cross-${a.id}-${b.id}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              className={styles.networkLineFaint}
            />
          ))
        )}
      </svg>

      {nodePositions.map((node, index) => (
        <div
          key={node.id}
          className={styles.floatingNode}
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            background: node.color,
            '--node-delay': `${index * 0.4}s`,
          }}
        >
          <span>{node.label}</span>
        </div>
      ))}

      <div className={styles.coinFrame}>
        <div className={styles.coinFrameRing} />
        <div className={styles.coinFrameInner}>
          <img
            src="/crypto_coins.svg"
            alt="Cryptocurrency coins"
            className={styles.coinImage}
            draggable={false}
          />
        </div>
      </div>
    </div>
  )
}

export default function Hero() {
  const [email, setEmail] = useState('')
  const navigate = useNavigate()

  const handleRegister = (e) => {
    e.preventDefault()
    navigate('/signin')
  }

  return (
    <section className={styles.hero}>
      <div className={styles.heroLeft}>
        <CryptoNetworkVisual />
      </div>

      <div className={styles.heroRight}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Sepolia testnet · Web3 labs</p>

          <h1 className={styles.heroTitle}>
            Build and trade on-chain without the template noise.
          </h1>

          <p className={styles.heroDescription}>
            ExChange is a developer workspace for real Sepolia workflows — wallet connect,
            ERC-20 deploys, NFT minting, ETH/EXC swaps, staking, multi-sig, and an
            institutional settlement sandbox.
          </p>

          <form className={styles.registerForm} onSubmit={handleRegister} id="register-form">
            <input
              type="email"
              placeholder="Work email (optional)"
              className={styles.emailInput}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              id="register-email-input"
            />
            <button type="submit" className={styles.registerBtn} id="register-btn">
              Connect wallet
            </button>
          </form>

          <div className={styles.ctaRow}>
            <Link to="/dashboard" className={styles.secondaryBtn} id="hero-open-dashboard">
              Open dashboard
            </Link>
            <Link to="/markets" className={styles.ghostBtn} id="hero-view-markets">
              Market watchlist
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
