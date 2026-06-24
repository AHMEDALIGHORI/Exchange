import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { buildEtherscanUrl } from '../config/etherscan'
import styles from './GasTracker.module.css'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const MAINNET_CHAIN_ID = 1

// Gas estimation presets (gas units for common operations)
const TX_PRESETS = [
  { label: 'ETH Transfer', gas: 21000, icon: '💸', desc: 'Simple ETH send' },
  { label: 'ERC-20 Transfer', gas: 65000, icon: '🪙', desc: 'Token transfer' },
  { label: 'Uniswap Swap', gas: 184000, icon: '🔄', desc: 'DEX token swap' },
  { label: 'NFT Mint', gas: 150000, icon: '🖼️', desc: 'Mint an NFT' },
  { label: 'Contract Deploy', gas: 1200000, icon: '📜', desc: 'Deploy smart contract' },
  { label: 'Approve Token', gas: 46000, icon: '✅', desc: 'Token approval' },
]

function GasCard({ label, gwei, color, speed, ethPrice, isRecommended }) {
  const ethCost = (21000 * gwei * 1e-9)
  const usdCost = ethCost * (ethPrice || 3821)

  return (
    <div className={`${styles.gasCard} ${isRecommended ? styles.recommended : ''}`} style={{ '--card-color': color }}>
      {isRecommended && <span className={styles.recommendBadge}>Best Value</span>}
      <div className={styles.gasCardHeader}>
        <span className={styles.gasLabel}>{label}</span>
        <span className={styles.gasSpeed}>{speed}</span>
      </div>
      <div className={styles.gweiValue}>
        <span className={styles.gweiNum}>{gwei}</span>
        <span className={styles.gweiUnit}>Gwei</span>
      </div>
      <div className={styles.costRow}>
        <span className={styles.ethCost}>{ethCost.toFixed(6)} ETH</span>
        <span className={styles.usdCost}>${usdCost.toFixed(2)}</span>
      </div>
      <div className={styles.gasBar}>
        <div className={styles.gasBarFill} style={{ transform: `scaleX(${Math.min(1, gwei / 120)})`, background: color }} />
      </div>
    </div>
  )
}

export default function GasTracker() {
  const [gasData, setGasData] = useState({ low: 12, average: 18, fast: 25, rapid: 42 })
  const [ethPrice, setEthPrice] = useState(3821)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [history, setHistory] = useState([])
  const [selectedPreset, setSelectedPreset] = useState(0)
  const [customGas, setCustomGas] = useState('')

  const fetchGas = useCallback(async () => {
    try {
      const [gasRes, priceRes] = await Promise.all([
        fetch(buildEtherscanUrl(MAINNET_CHAIN_ID, { module: 'gastracker', action: 'gasoracle' })).then(r => r.json()),
        fetch(buildEtherscanUrl(MAINNET_CHAIN_ID, { module: 'stats', action: 'ethprice' })).then(r => r.json()),
      ])

      if (gasRes.status === '1' && gasRes.result) {
        const newGas = {
          low: parseInt(gasRes.result.SafeGasPrice) || 12,
          average: parseInt(gasRes.result.ProposeGasPrice) || 18,
          fast: parseInt(gasRes.result.FastGasPrice) || 25,
          rapid: Math.round((parseInt(gasRes.result.FastGasPrice) || 25) * 1.6),
        }
        setGasData(newGas)

        setHistory(prev => {
          const now = new Date()
          const timeLabel = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`
          const updated = [...prev, { time: timeLabel, low: newGas.low, avg: newGas.average, fast: newGas.fast }]
          return updated.slice(-20) // Keep last 20 data points
        })
      }

      if (priceRes.status === '1') {
        setEthPrice(parseFloat(priceRes.result.ethusd))
      }

      setLastUpdate(new Date())
      setLoading(false)
    } catch {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGas()
    const interval = setInterval(fetchGas, 15000) // Refresh every 15 seconds
    return () => clearInterval(interval)
  }, [fetchGas])

  // Initialize with some history points
  useEffect(() => {
    if (history.length === 0) {
      const mockHistory = []
      const now = new Date()
      for (let i = 19; i >= 0; i--) {
        const t = new Date(now.getTime() - i * 15000)
        const base = 15 + Math.sin(i * 0.5) * 5
        mockHistory.push({
          time: `${t.getHours()}:${t.getMinutes().toString().padStart(2, '0')}`,
          low: Math.round(base * 0.7),
          avg: Math.round(base),
          fast: Math.round(base * 1.5),
        })
      }
      setHistory(mockHistory)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const preset = TX_PRESETS[selectedPreset]
  const gasUnits = customGas ? parseInt(customGas) || 21000 : preset.gas

  const calcCost = (gwei) => {
    const ethCost = gasUnits * gwei * 1e-9
    const usdCost = ethCost * ethPrice
    return { eth: ethCost.toFixed(6), usd: usdCost.toFixed(2) }
  }

  const getBestTime = () => {
    if (gasData.low < 10) return { text: 'Now! Gas is very low', color: '#34d399' }
    if (gasData.low < 20) return { text: 'Good time to transact', color: '#34d399' }
    if (gasData.low < 40) return { text: 'Average gas, wait if not urgent', color: '#f59e0b' }
    return { text: 'High gas — wait for off-peak hours', color: '#ef4444' }
  }

  const bestTime = getBestTime()

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipLabel}>{label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color, margin: '2px 0' }}>
              {p.name}: <strong>{p.value} Gwei</strong>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <DashboardLayout activeOverride="gas">
      <div className={styles.container}>

        {/* Header */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Gas Tracker</h1>
            <p className={styles.subtitle}>Real-time Ethereum network gas prices</p>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.refreshInfo}>
              <div className={styles.livePulse} />
              <span>Auto-refresh 15s</span>
              {lastUpdate && (
                <span className={styles.lastUpdate}>
                  Last: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>
            <button className={styles.refreshBtn} onClick={fetchGas} disabled={loading}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 8a6 6 0 0110.89-3.48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M14 8a6 6 0 01-10.89 3.48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M13 1v4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 15v-4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Refresh
            </button>
          </div>
        </header>

        {/* Best Time Banner */}
        <div className={styles.timeBanner} style={{ '--banner-color': bestTime.color }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" stroke={bestTime.color} strokeWidth="1.5"/>
            <path d="M10 6v4l2.5 2.5" stroke={bestTime.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ color: bestTime.color, fontWeight: 700 }}>{bestTime.text}</span>
          <span className={styles.ethPriceTag}>ETH: ${ethPrice.toLocaleString()}</span>
        </div>

        {/* Gas Price Cards */}
        <div className={styles.gasGrid}>
          <GasCard label="🐢 Low" gwei={gasData.low} color="#34d399" speed="~10 min" ethPrice={ethPrice} isRecommended={gasData.low < 15} />
          <GasCard label="🚶 Standard" gwei={gasData.average} color="#3b82f6" speed="~3 min" ethPrice={ethPrice} isRecommended={false} />
          <GasCard label="🚀 Fast" gwei={gasData.fast} color="#f59e0b" speed="~30 sec" ethPrice={ethPrice} isRecommended={false} />
          <GasCard label="⚡ Rapid" gwei={gasData.rapid} color="#ef4444" speed="~15 sec" ethPrice={ethPrice} isRecommended={false} />
        </div>

        {/* Charts + Calculator Row */}
        <div className={styles.bottomRow}>

          {/* Gas Trend Chart */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div>
                <h3 className={styles.chartTitle}>Gas Price Trend</h3>
                <p className={styles.chartSub}>Live tracking every 15 seconds</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={history} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="gasLowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gasAvgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gasFastGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
                <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} unit=" Gwei"/>
                <Tooltip content={<CustomTooltip />}/>
                <Area type="monotone" dataKey="low" stroke="#34d399" strokeWidth={2} fill="url(#gasLowGrad)" name="Low" dot={false}/>
                <Area type="monotone" dataKey="avg" stroke="#3b82f6" strokeWidth={2} fill="url(#gasAvgGrad)" name="Average" dot={false}/>
                <Area type="monotone" dataKey="fast" stroke="#f59e0b" strokeWidth={2} fill="url(#gasFastGrad)" name="Fast" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Cost Calculator */}
          <div className={styles.calcCard}>
            <h3 className={styles.chartTitle}>Transaction Cost Calculator</h3>
            <p className={styles.chartSub}>Estimate gas fees for common operations</p>

            {/* Preset Selector */}
            <div className={styles.presetGrid}>
              {TX_PRESETS.map((p, i) => (
                <button
                  key={i}
                  className={`${styles.presetBtn} ${selectedPreset === i ? styles.presetActive : ''}`}
                  onClick={() => { setSelectedPreset(i); setCustomGas('') }}
                >
                  <span className={styles.presetIcon}>{p.icon}</span>
                  <span className={styles.presetLabel}>{p.label}</span>
                </button>
              ))}
            </div>

            {/* Custom Gas Input */}
            <div className={styles.customGasRow}>
              <label className={styles.customLabel}>Custom gas units:</label>
              <input
                type="text"
                className={styles.customInput}
                placeholder={preset.gas.toLocaleString()}
                value={customGas}
                onChange={(e) => setCustomGas(e.target.value.replace(/[^0-9]/g, ''))}
              />
            </div>

            {/* Cost Breakdown Table */}
            <div className={styles.costTable}>
              <div className={styles.costTableHead}>
                <span>Speed</span>
                <span>Gas Price</span>
                <span>Cost (ETH)</span>
                <span>Cost (USD)</span>
              </div>
              {[
                { label: '🐢 Low', gwei: gasData.low, color: '#34d399' },
                { label: '🚶 Standard', gwei: gasData.average, color: '#3b82f6' },
                { label: '🚀 Fast', gwei: gasData.fast, color: '#f59e0b' },
                { label: '⚡ Rapid', gwei: gasData.rapid, color: '#ef4444' },
              ].map(tier => {
                const c = calcCost(tier.gwei)
                return (
                  <div key={tier.label} className={styles.costTableRow}>
                    <span style={{ color: tier.color, fontWeight: 600 }}>{tier.label}</span>
                    <span>{tier.gwei} Gwei</span>
                    <span>{c.eth}</span>
                    <span className={styles.usdHighlight}>${c.usd}</span>
                  </div>
                )
              })}
            </div>

            <div className={styles.gasNote}>
              Using {gasUnits.toLocaleString()} gas units for <strong>{customGas ? 'custom operation' : preset.label}</strong>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
