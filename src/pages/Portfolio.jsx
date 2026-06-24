import { useEffect, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import styles from './Portfolio.module.css'
import { useWallet } from '../context/WalletContext'
import { abis } from '../config/abis'
import { formatEther } from 'viem'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const portfolioHistory = [
  { time: 'Jan', value: 24000 },
  { time: 'Feb', value: 27500 },
  { time: 'Mar', value: 23800 },
  { time: 'Apr', value: 31200 },
  { time: 'May', value: 29400 },
  { time: 'Jun', value: 35800 },
  { time: 'Jul', value: 38200 },
  { time: 'Aug', value: 33600 },
  { time: 'Sep', value: 41000 },
  { time: 'Oct', value: 44500 },
  { time: 'Nov', value: 39800 },
  { time: 'Dec', value: 52400 },
]

export default function Portfolio() {
  const { balance, ethPrice, tokenList, readContract, account } = useWallet()
  const [tokenBalances, setTokenBalances] = useState([])

  const ethBal = balance ? Number(balance) / 1e18 : 0
  const ethPriceNum = ethPrice || 0
  const portfolioEthVal = ethBal * ethPriceNum
  const formattedPortfolioValue = Math.round(portfolioEthVal).toLocaleString()

  useEffect(() => {
    async function loadBalances() {
      if (!account || tokenList.length === 0) {
        setTokenBalances([])
        return
      }
      const rows = await Promise.all(
        tokenList.map(async (token) => {
          try {
            const raw = await readContract({
              address: token.contract,
              abi: abis.SimpleERC20,
              functionName: 'balanceOf',
              args: [account],
            })
            return {
              ...token,
              amount: formatEther(raw),
            }
          } catch {
            return { ...token, amount: '0' }
          }
        })
      )
      setTokenBalances(rows.filter((row) => Number(row.amount) > 0))
    }
    loadBalances()
  }, [account, tokenList, readContract])

  const assets = [
    {
      name: 'Ethereum',
      symbol: 'ETH',
      amount: `${ethBal.toFixed(4)} ETH`,
      value: `$${(ethBal * ethPriceNum).toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      change: 'Live Sepolia balance',
      color: '#7c3aed',
    },
    ...tokenBalances.map((token, index) => ({
      name: token.name,
      symbol: token.symbol,
      amount: `${Number(token.amount).toFixed(4)} ${token.symbol}`,
      value: 'On-chain Sepolia balance',
      change: `Contract ${token.contract.slice(0, 6)}…${token.contract.slice(-4)}`,
      color: ['#06b6d4', '#f97316', '#3b82f6', '#10b981'][index % 4],
    })),
  ]

  const scaledHistory = portfolioHistory.map((item, index) => {
    const factor = 0.85 + (index / portfolioHistory.length) * 0.3
    return {
      ...item,
      value: Math.round(Math.max(portfolioEthVal * factor, 0)),
    }
  })

  return (
    <DashboardLayout activeOverride="portfolio">
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Portfolio</h1>
            <p className={styles.subtitle}>Live Sepolia wallet holdings — no mock assets</p>
          </div>
          <div className={styles.totalValue}>
            <span className={styles.totalLabel}>Total Value (ETH priced)</span>
            <span className={styles.totalAmount}>${formattedPortfolioValue}</span>
          </div>
        </header>

        <div className={styles.chartCard}>
          <h2 className={styles.sectionTitle}>Balance trend (estimated from current holdings)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={scaledHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#7c3aed" fill="rgba(124,58,237,0.25)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.assetsCard}>
          <h2 className={styles.sectionTitle}>Your assets</h2>
          {assets.length === 0 ? (
            <p className={styles.emptyState}>No assets detected on this Sepolia address yet.</p>
          ) : (
            <div className={styles.assetList}>
              {assets.map((asset) => (
                <div key={asset.symbol} className={styles.assetRow}>
                  <div className={styles.assetLeft}>
                    <div className={styles.assetBadge} style={{ background: `${asset.color}22`, borderColor: `${asset.color}55` }}>
                      {asset.symbol[0]}
                    </div>
                    <div>
                      <div className={styles.assetName}>{asset.name}</div>
                      <div className={styles.assetAmount}>{asset.amount}</div>
                    </div>
                  </div>
                  <div className={styles.assetRight}>
                    <div className={styles.assetValue}>{asset.value}</div>
                    <div className={styles.assetChange}>{asset.change}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
