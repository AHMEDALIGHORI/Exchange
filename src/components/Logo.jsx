import { useId } from 'react'
import styles from './Logo.module.css'

function WalletMark({ idPrefix }) {
  const p = (name) => `${name}-${idPrefix}`

  return (
    <>
      <defs>
        <linearGradient id={p('bg')} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="38%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#3b0764" />
        </linearGradient>
        <linearGradient id={p('gold')} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="45%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id={p('glass')} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="55%" stopColor="#c4b5fd" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.03" />
        </linearGradient>
        <linearGradient id={p('top')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.38" />
          <stop offset="35%" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={p('glow')} cx="50%" cy="42%" r="58%">
          <stop offset="0%" stopColor="#ddd6fe" stopOpacity="0.45" />
          <stop offset="70%" stopColor="#7c3aed" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>
        <filter id={p('depth')} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodColor="#000000" floodOpacity="0.45" />
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#4c1d95" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Depth plate */}
      <rect x="1.5" y="2.5" width="29" height="29" rx="8" fill="#0c0318" opacity="0.85" />

      {/* Main tile */}
      <rect width="32" height="32" rx="8" fill={`url(#${p('bg')})`} filter={`url(#${p('depth')})`} />
      <rect width="32" height="32" rx="8" fill={`url(#${p('top')})`} />
      <circle cx="16" cy="15" r="14" fill={`url(#${p('glow')})`} opacity="0.75" />

      {/* Bevel ring */}
      <rect
        x="0.6"
        y="0.6"
        width="30.8"
        height="30.8"
        rx="7.6"
        fill="none"
        stroke="rgba(255,255,255,0.14)"
        strokeWidth="0.8"
      />
      <path
        d="M1.5 8.5C6 4.5 26 4.5 30.5 8.5"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="0.6"
        fill="none"
      />

      {/* Coin shadow + body */}
      <ellipse cx="12" cy="12.2" rx="3.1" ry="0.9" fill="#000000" opacity="0.28" />
      <circle cx="12" cy="10.8" r="3" fill={`url(#${p('gold')})`} />
      <ellipse cx="10.8" cy="9.6" rx="1.4" ry="0.75" fill="#ffffff" opacity="0.5" />

      {/* Wallet stack */}
      <rect x="6" y="13.2" width="22" height="13.5" rx="3.4" fill="#0a0214" />
      <rect x="5" y="11.8" width="22" height="14" rx="3.5" fill="#1b083a" />
      <rect
        x="5"
        y="12.8"
        width="22"
        height="12.5"
        rx="3"
        fill={`url(#${p('glass')})`}
        stroke="rgba(255,255,255,0.16)"
        strokeWidth="0.7"
      />
      <path d="M6 14.2h20" stroke="rgba(255,255,255,0.12)" strokeWidth="0.6" />

      {/* Clasp */}
      <rect x="17.5" y="15.8" width="8.5" height="6.5" rx="1.4" fill={`url(#${p('gold')})`} />
      <rect x="17.5" y="15.8" width="8.5" height="2.2" rx="1.4" fill="#ffffff" opacity="0.18" />
      <circle cx="21.75" cy="19" r="1.1" fill="#ffffff" />
      <circle cx="21.75" cy="19" r="0.45" fill="#92400e" opacity="0.55" />
    </>
  )
}

export default function Logo({ size = 28, className = '', interactive = false }) {
  const rawId = useId().replace(/:/g, '')
  const radius = Math.round((size * 8) / 32)

  return (
    <span
      className={`${styles.container} ${interactive ? styles.interactive : ''} ${className}`.trim()}
      style={{ width: size, height: size, borderRadius: radius }}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.mark}
      >
        <WalletMark idPrefix={rawId} />
      </svg>
    </span>
  )
}
