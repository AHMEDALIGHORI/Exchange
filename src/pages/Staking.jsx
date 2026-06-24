import { useState, useMemo, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import NetworkBanner from '../components/NetworkBanner'
import styles from './Staking.module.css'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useWallet } from '../context/WalletContext'
import { abis } from '../config/abis'
import { getContractAddress, getExplorerTxUrl, hasDeployedContracts } from '../config/contracts'
import { formatEther } from 'viem'

const TOKENS = [
  { symbol: 'ETH', name: 'Ethereum', price: 3821.18, color: '#7c3aed', defaultApy: 4.2 },
  { symbol: 'SOL', name: 'Solana', price: 182.93, color: '#06b6d4', defaultApy: 6.8 },
  { symbol: 'ADA', name: 'Cardano', price: 0.5831, color: '#10b981', defaultApy: 3.5 },
  { symbol: 'DOT', name: 'Polkadot', price: 6.84, color: '#e6007a', defaultApy: 11.5 },
  { symbol: 'AVAX', name: 'Avalanche', price: 34.22, color: '#e84142', defaultApy: 8.2 },
  { symbol: 'ATOM', name: 'Cosmos', price: 8.42, color: '#6f7390', defaultApy: 18.3 },
]

const PROVIDERS = [
  { name: 'Lido', apy: 4.0, fee: '10%', protocol: 'Liquid Staking', token: 'ETH', color: '#00a3ff', risk: 'Low' },
  { name: 'Rocket Pool', apy: 3.8, fee: '15%', protocol: 'Decentralized', token: 'ETH', color: '#ff6347', risk: 'Low' },
  { name: 'Coinbase', apy: 3.3, fee: '25%', protocol: 'Centralized', token: 'ETH', color: '#0052ff', risk: 'Low' },
  { name: 'Marinade', apy: 6.7, fee: '6%', protocol: 'Liquid Staking', token: 'SOL', color: '#7ed7c1', risk: 'Medium' },
  { name: 'SundaeSwap', apy: 3.2, fee: '5%', protocol: 'DEX', token: 'ADA', color: '#9b59b6', risk: 'Medium' },
  { name: 'Polkadot.js', apy: 14.2, fee: '0%', protocol: 'Native', token: 'DOT', color: '#e6007a', risk: 'Medium' },
]

const DURATIONS = [
  { label: '30 Days', days: 30 },
  { label: '90 Days', days: 90 },
  { label: '6 Months', days: 180 },
  { label: '1 Year', days: 365 },
  { label: '2 Years', days: 730 },
  { label: '5 Years', days: 1825 },
]

export default function Staking() {
  const { status, account, writeContract, readContract, parseTokenAmount, refreshWallet } = useWallet()
  const walletConnected = status === 'connected'
  const stakingAddress = getContractAddress('StakingPool')
  const excAddress = getContractAddress('SimpleERC20')
  const onChainReady = hasDeployedContracts() && stakingAddress && excAddress

  const [liveAmount, setLiveAmount] = useState('100')
  const [stakedAmount, setStakedAmount] = useState('0')
  const [liveTx, setLiveTx] = useState(null)
  const [liveLoading, setLiveLoading] = useState(false)
  const [liveError, setLiveError] = useState('')

  const [selectedToken, setSelectedToken] = useState(0)
  const [amount, setAmount] = useState('10')
  const [apy, setApy] = useState(TOKENS[0].defaultApy)
  const [durationIdx, setDurationIdx] = useState(3) // Default: 1 Year
  const [compounding, setCompounding] = useState(true)

  useEffect(() => {
    async function loadStake() {
      if (!account || !onChainReady) {
        setStakedAmount('0')
        return
      }
      try {
        const stake = await readContract({
          address: stakingAddress,
          abi: abis.StakingPool,
          functionName: 'stakes',
          args: [account],
        })
        setStakedAmount(formatEther(stake))
      } catch {
        setStakedAmount('0')
      }
    }
    loadStake()
  }, [account, onChainReady, stakingAddress, readContract, liveTx])

  const handleLiveStake = async () => {
    if (!walletConnected || !onChainReady) return
    setLiveLoading(true)
    setLiveError('')
    try {
      const amount = parseTokenAmount(liveAmount, 18)
      await writeContract({
        address: excAddress,
        abi: abis.SimpleERC20,
        functionName: 'approve',
        args: [stakingAddress, amount],
      })
      const { hash } = await writeContract({
        address: stakingAddress,
        abi: abis.StakingPool,
        functionName: 'stake',
        args: [amount],
      })
      setLiveTx(hash)
      await refreshWallet()
    } catch (err) {
      setLiveError(err.shortMessage || err.message)
    } finally {
      setLiveLoading(false)
    }
  }

  const handleLiveUnstake = async () => {
    if (!walletConnected || !onChainReady) return
    setLiveLoading(true)
    setLiveError('')
    try {
      const amount = parseTokenAmount(liveAmount, 18)
      const { hash } = await writeContract({
        address: stakingAddress,
        abi: abis.StakingPool,
        functionName: 'unstake',
        args: [amount],
      })
      setLiveTx(hash)
      await refreshWallet()
    } catch (err) {
      setLiveError(err.shortMessage || err.message)
    } finally {
      setLiveLoading(false)
    }
  }

  const token = TOKENS[selectedToken]
  const duration = DURATIONS[durationIdx]
  const numAmount = parseFloat(amount) || 0
  const initialValue = numAmount * token.price

  // Calculate rewards
  const calcRewards = useMemo(() => {
    const days = duration.days
    const dailyRate = apy / 100 / 365

    // Generate projection data
    const projectionData = []
    for (let d = 0; d <= days; d += Math.max(1, Math.floor(days / 30))) {
      const balance = compounding
        ? numAmount * Math.pow(1 + dailyRate, d)
        : numAmount + (numAmount * dailyRate * d)
      const month = Math.floor(d / 30)
      projectionData.push({
        time: d < 30 ? `D${d}` : `M${month}`,
        value: Math.round(balance * token.price),
        tokens: parseFloat(balance.toFixed(4)),
      })
    }

    // Final balance
    const finalBalance = compounding
      ? numAmount * Math.pow(1 + dailyRate, days)
      : numAmount + (numAmount * dailyRate * days)

    const totalReward = finalBalance - numAmount
    const totalRewardUsd = totalReward * token.price
    const dailyReward = numAmount * dailyRate
    const monthlyReward = dailyReward * 30
    const yearlyReward = dailyReward * 365

    return {
      projectionData,
      finalBalance: finalBalance.toFixed(4),
      totalReward: totalReward.toFixed(4),
      totalRewardUsd: totalRewardUsd.toFixed(2),
      dailyReward: dailyReward.toFixed(6),
      dailyRewardUsd: (dailyReward * token.price).toFixed(2),
      monthlyReward: monthlyReward.toFixed(4),
      monthlyRewardUsd: (monthlyReward * token.price).toFixed(2),
      yearlyReward: yearlyReward.toFixed(4),
      yearlyRewardUsd: (yearlyReward * token.price).toFixed(2),
    }
  }, [numAmount, apy, duration, compounding, token])

  const handleTokenChange = (idx) => {
    setSelectedToken(idx)
    setApy(TOKENS[idx].defaultApy)
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.tooltip}>
          <p style={{ color: token.color, margin: 0 }}>
            <strong>${payload[0].value.toLocaleString()}</strong>
          </p>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: '2px 0 0', fontSize: 11 }}>
            {payload[0].payload.tokens} {token.symbol}
          </p>
        </div>
      )
    }
    return null
  }

  // Filter providers for selected token
  const relevantProviders = PROVIDERS.filter(p => p.token === token.symbol)

  return (
    <DashboardLayout activeOverride="staking">
      <div className={styles.container}>

        {/* Header */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Staking</h1>
            <p className={styles.subtitle}>Live EXC staking on Sepolia plus reward projection simulator</p>
          </div>
        </header>

        <NetworkBanner />

        {onChainReady && (
          <div className={styles.configPanel} style={{ marginBottom: '20px' }}>
            <h3 className={styles.chartTitle}>Live Staking — EXC on Sepolia</h3>
            <p className={styles.chartSub}>Stake and unstake EXC tokens via the on-chain StakingPool contract</p>
            <div className={styles.amountRow} style={{ marginTop: '12px' }}>
              <input
                type="text"
                className={styles.amountInput}
                value={liveAmount}
                onChange={(e) => setLiveAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              />
              <span className={styles.amountSymbol}>EXC</span>
            </div>
            <p className={styles.amountUsd}>Your staked balance: {parseFloat(stakedAmount).toFixed(4)} EXC</p>
            {liveError && <p style={{ color: '#ef4444', fontSize: '13px' }}>{liveError}</p>}
            {liveTx && (
              <p style={{ fontSize: '13px', marginTop: '8px' }}>
                Last tx: <a href={getExplorerTxUrl(liveTx)} target="_blank" rel="noreferrer" style={{ color: '#7c3aed' }}>View on Etherscan ↗</a>
              </p>
            )}
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button className={styles.durationBtn} onClick={handleLiveStake} disabled={!walletConnected || liveLoading}>
                {liveLoading ? 'Processing...' : 'Stake EXC'}
              </button>
              <button className={styles.durationBtn} onClick={handleLiveUnstake} disabled={!walletConnected || liveLoading}>
                Unstake EXC
              </button>
            </div>
          </div>
        )}

        <div className={styles.mainGrid}>

          {/* Left: Configuration */}
          <div className={styles.configPanel}>

            {/* Token Selector */}
            <div className={styles.section}>
              <label className={styles.sectionLabel}>Select Token</label>
              <div className={styles.tokenGrid}>
                {TOKENS.map((t, i) => (
                  <button
                    key={t.symbol}
                    className={`${styles.tokenBtn} ${selectedToken === i ? styles.tokenActive : ''}`}
                    onClick={() => handleTokenChange(i)}
                    style={{ '--token-color': t.color }}
                  >
                    <span className={styles.tokenDot} style={{ background: t.color }} />
                    <div className={styles.tokenBtnInfo}>
                      <span className={styles.tokenSymbol}>{t.symbol}</span>
                      <span className={styles.tokenPrice}>${t.price.toLocaleString()}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Input */}
            <div className={styles.section}>
              <label className={styles.sectionLabel}>Staking Amount</label>
              <div className={styles.amountRow}>
                <input
                  type="text"
                  className={styles.amountInput}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="0.00"
                />
                <span className={styles.amountSymbol}>{token.symbol}</span>
              </div>
              <div className={styles.amountUsd}>
                ≈ ${initialValue.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
              </div>
              <div className={styles.quickAmounts}>
                {[1, 5, 10, 50, 100].map(v => (
                  <button key={v} className={styles.quickAmountBtn} onClick={() => setAmount(v.toString())}>
                    {v} {token.symbol}
                  </button>
                ))}
              </div>
            </div>

            {/* APY Slider */}
            <div className={styles.section}>
              <div className={styles.apyHeader}>
                <label className={styles.sectionLabel}>Annual Percentage Yield (APY)</label>
                <span className={styles.apyValue} style={{ color: token.color }}>{apy}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="25"
                step="0.1"
                value={apy}
                onChange={(e) => setApy(parseFloat(e.target.value))}
                className={styles.apySlider}
                style={{ '--slider-color': token.color, '--slider-pct': `${(apy / 25) * 100}%` }}
              />
              <div className={styles.apyPresets}>
                {[2, 4, 8, 12, 20].map(v => (
                  <button key={v} className={styles.apyPresetBtn} onClick={() => setApy(v)}>{v}%</button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className={styles.section}>
              <label className={styles.sectionLabel}>Staking Duration</label>
              <div className={styles.durationGrid}>
                {DURATIONS.map((d, i) => (
                  <button
                    key={d.label}
                    className={`${styles.durationBtn} ${durationIdx === i ? styles.durationActive : ''}`}
                    onClick={() => setDurationIdx(i)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Compounding Toggle */}
            <div className={styles.section}>
              <div className={styles.toggleRow}>
                <span className={styles.toggleLabel}>Auto-compound rewards</span>
                <button
                  className={`${styles.toggle} ${compounding ? styles.toggleOn : ''}`}
                  onClick={() => setCompounding(!compounding)}
                >
                  <span className={styles.toggleDot} />
                </button>
              </div>
            </div>
          </div>

          {/* Right: Results */}
          <div className={styles.resultsPanel}>

            {/* Summary Cards */}
            <div className={styles.summaryGrid}>
              <div className={styles.summaryCard} style={{ '--card-color': token.color }}>
                <span className={styles.summaryLabel}>Final Balance</span>
                <span className={styles.summaryValue}>{calcRewards.finalBalance} {token.symbol}</span>
                <span className={styles.summaryUsd}>${(parseFloat(calcRewards.finalBalance) * token.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
              <div className={styles.summaryCard} style={{ '--card-color': '#34d399' }}>
                <span className={styles.summaryLabel}>Total Rewards</span>
                <span className={styles.summaryValue} style={{ color: '#34d399' }}>+{calcRewards.totalReward} {token.symbol}</span>
                <span className={styles.summaryUsd}>+${calcRewards.totalRewardUsd}</span>
              </div>
            </div>

            {/* Projection Chart */}
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>Rewards Projection</h3>
              <p className={styles.chartSub}>
                {compounding ? 'Compound interest' : 'Simple interest'} over {duration.label.toLowerCase()}
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={calcRewards.projectionData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="stakingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={token.color} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={token.color} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
                  <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`}/>
                  <Tooltip content={<CustomTooltip />}/>
                  <Area type="monotone" dataKey="value" stroke={token.color} strokeWidth={2.5} fill="url(#stakingGrad)" dot={false} activeDot={{ r: 5, fill: token.color }}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Earnings Breakdown */}
            <div className={styles.breakdownCard}>
              <h3 className={styles.chartTitle}>Earnings Breakdown</h3>
              <div className={styles.breakdownGrid}>
                <div className={styles.breakdownItem}>
                  <span className={styles.breakdownLabel}>Daily</span>
                  <span className={styles.breakdownTokens}>+{calcRewards.dailyReward} {token.symbol}</span>
                  <span className={styles.breakdownUsd}>${calcRewards.dailyRewardUsd}</span>
                </div>
                <div className={styles.breakdownItem}>
                  <span className={styles.breakdownLabel}>Monthly</span>
                  <span className={styles.breakdownTokens}>+{calcRewards.monthlyReward} {token.symbol}</span>
                  <span className={styles.breakdownUsd}>${calcRewards.monthlyRewardUsd}</span>
                </div>
                <div className={styles.breakdownItem}>
                  <span className={styles.breakdownLabel}>Yearly</span>
                  <span className={styles.breakdownTokens}>+{calcRewards.yearlyReward} {token.symbol}</span>
                  <span className={styles.breakdownUsd}>${calcRewards.yearlyRewardUsd}</span>
                </div>
              </div>
            </div>

            {/* Provider Comparison */}
            {relevantProviders.length > 0 && (
              <div className={styles.providerCard}>
                <h3 className={styles.chartTitle}>Staking Providers for {token.symbol}</h3>
                <p className={styles.chartSub}>Compare APY rates and protocols</p>
                <div className={styles.providerTable}>
                  <div className={styles.providerHead}>
                    <span>Provider</span>
                    <span>APY</span>
                    <span>Fee</span>
                    <span>Protocol</span>
                    <span>Risk</span>
                  </div>
                  {relevantProviders.map(p => (
                    <div key={p.name} className={styles.providerRow}>
                      <span className={styles.providerName}>
                        <span className={styles.providerDot} style={{ background: p.color }} />
                        {p.name}
                      </span>
                      <span className={styles.providerApy}>{p.apy}%</span>
                      <span className={styles.providerFee}>{p.fee}</span>
                      <span className={styles.providerProtocol}>{p.protocol}</span>
                      <span className={`${styles.riskBadge} ${styles[`risk${p.risk}`]}`}>{p.risk}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
