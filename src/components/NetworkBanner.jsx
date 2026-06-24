import { useWallet } from '../context/WalletContext'

export default function NetworkBanner() {
  const { status, isCorrectNetwork, switchToSepolia, network } = useWallet()

  if (status !== 'connected' || isCorrectNetwork) return null

  return (
    <div style={{
      background: 'rgba(249, 115, 22, 0.12)',
      border: '1px solid rgba(249, 115, 22, 0.35)',
      color: '#fdba74',
      padding: '10px 16px',
      borderRadius: '8px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      fontSize: '13px',
    }}>
      <span>
        Connected to {network}. ExChange on-chain features require Sepolia testnet.
      </span>
      <button
        type="button"
        onClick={switchToSepolia}
        style={{
          background: '#f97316',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          padding: '6px 12px',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        Switch to Sepolia
      </button>
    </div>
  )
}
