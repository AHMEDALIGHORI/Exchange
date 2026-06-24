import { useState, useEffect, useRef } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import styles from './Dashboard.module.css'
import {
  AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import { useWallet } from '../context/WalletContext'
import { useMarketPrices } from '../hooks/useMarketPrices'
import OnChainSetupBanner from '../components/OnChainSetupBanner'
import { getWalletProfile } from '../utils/walletProfile'

// ─── Mock Data ───────────────────────────────────────────
const portfolioHistory = [
  { time: 'Jan', value: 24000, profit: 1200 },
  { time: 'Feb', value: 27500, profit: 3500 },
  { time: 'Mar', value: 23800, profit: -700 },
  { time: 'Apr', value: 31200, profit: 7400 },
  { time: 'May', value: 29400, profit: 5600 },
  { time: 'Jun', value: 35800, profit: 11900 },
  { time: 'Jul', value: 38200, profit: 14300 },
  { time: 'Aug', value: 33600, profit: 9700 },
  { time: 'Sep', value: 41000, profit: 17100 },
  { time: 'Oct', value: 44500, profit: 20600 },
  { time: 'Nov', value: 39800, profit: 15900 },
  { time: 'Dec', value: 52400, profit: 28500 },
]

const volumeData = [
  { day: 'Mon', buy: 4200, sell: 3100 },
  { day: 'Tue', buy: 6800, sell: 4500 },
  { day: 'Wed', buy: 5200, sell: 6100 },
  { day: 'Thu', buy: 8900, sell: 5700 },
  { day: 'Fri', buy: 7100, sell: 8200 },
  { day: 'Sat', buy: 3800, sell: 2900 },
  { day: 'Sun', buy: 5500, sell: 4100 },
]

const topCoins = []

// ─── Animated Counter ──────────────────────────────────
function useCountUp(target, duration = 1600, start = false) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!start) return
    const steps = 60
    const step = target / steps
    let current = 0
    const interval = setInterval(() => {
      current += step
      if (current >= target) { setValue(target); clearInterval(interval) }
      else setValue(current)
    }, duration / steps)
    return () => clearInterval(interval)
  }, [target, duration, start])
  return value
}

// ─── Intersection Observer hook ─────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, inView]
}

// ─── Stat Card with counter ─────────────────────────────
function StatCard({ label, value, sub, subUp, icon, tone = 'default', numericValue, prefix, suffix }) {
  const [ref, inView] = useInView()
  const count = useCountUp(numericValue || 0, 1600, inView)

  const displayValue = numericValue != null
    ? `${prefix || ''}${count.toLocaleString(undefined, { maximumFractionDigits: 0 })}${suffix || ''}`
    : value

  return (
    <div ref={ref} className={`${styles.statCard} ${styles[`stat_${tone}`]}`}>
      <div className={styles.statTop}>
        <span className={styles.statLabel}>{label}</span>
        <div className={styles.statIcon}>{icon}</div>
      </div>
      <div className={styles.statValue}>{displayValue}</div>
      <div className={`${styles.statSub} ${subUp ? styles.subUp : styles.subDown}`}>
        {subUp ? '▲' : '▼'} {sub}
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className={styles.tooltip}>
        <p className={styles.tooltipLabel}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: <strong>${p.value.toLocaleString()}</strong>
          </p>
        ))}
      </div>
    )
  }
  return null
}

// ─── Animated table row ─────────────────────────────────
function CoinRow({ coin, index }) {
  const [ref, inView] = useInView(0.05)
  return (
    <tr
      ref={ref}
      key={coin.rank}
      className={`${styles.tableRow} ${inView ? styles.tableRowVisible : ''}`}
      style={{ '--row-delay': `${index * 0.07}s` }}
    >
      <td className={styles.tdRank}>{coin.rank}</td>
      <td>
        <div className={styles.coinCell}>
          <div className={styles.coinBadge} style={{ background: `${coin.color}22`, border: `1.5px solid ${coin.color}55` }}>
            <span style={{ color: coin.color, fontSize: 11, fontWeight: 800 }}>{coin.symbol[0]}</span>
          </div>
          <div>
            <div className={styles.coinName}>{coin.name}</div>
            <div className={styles.coinSymbol}>{coin.symbol}</div>
          </div>
        </div>
      </td>
      <td className={styles.tdPrice}>${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
      <td>
        <span className={`${styles.changeBadge} ${coin.up ? styles.changeUp : styles.changeDown}`}>
          {coin.up ? '▲' : '▼'} {Math.abs(coin.change)}%
        </span>
      </td>
      <td className={styles.tdMuted}>${coin.volume}</td>
      <td className={styles.tdMuted}>${coin.cap}</td>
      <td>
        <button
          className={styles.tradeBtn}
          id={`dash-trade-${coin.symbol}`}
          style={{ '--btn-color': coin.color }}
        >
          Trade
        </button>
      </td>
    </tr>
  )
}

// ─── Main Dashboard ────────────────────────────────────
export default function Dashboard() {
  const [chartRange, setChartRange] = useState('1Y')
  const ranges = ['1D', '1W', '1M', '3M', '1Y', 'ALL']
  const [headerRef, headerInView] = useInView(0.1)
  const {
    account,
    balance,
    txHistory,
    txLoading,
    ethPrice,
    tokenList,
  } = useWallet()
  const [walletProfile, setWalletProfile] = useState(null)
  const { coins: marketCoins } = useMarketPrices()

  useEffect(() => {
    if (account) setWalletProfile(getWalletProfile(account))
  }, [account])

  const walletConnected = true
  const liveTopCoins = marketCoins.length > 0 ? marketCoins.slice(0, 6) : topCoins

  const ethBal = balance ? Number(balance) / 1e18 : 0
  const ethPriceNum = ethPrice || 0
  const rawPortfolioValue = ethBal * ethPriceNum
  const portfolioValue = Math.round(rawPortfolioValue)

  const changeValue = Math.round(portfolioValue * 0.01)
  const changeSubtext = 'Based on live ETH balance'

  const profitValue = Math.max(0, Math.round(portfolioValue * 0.15))
  const profitSubtext = 'Estimated from on-chain holdings'

  const activePositionsText = `${1 + tokenList.length} Asset${1 + tokenList.length !== 1 ? 's' : ''}`
  const activePositionsSubtext = `${tokenList.length} ERC-20 token${tokenList.length !== 1 ? 's' : ''} detected`

  // 2. Scaled Portfolio History
  const scaledPortfolioHistory = portfolioHistory.map((item, index) => {
    const scale = rawPortfolioValue > 0 ? rawPortfolioValue / 52400 : 0
    const factor = 0.85 + (index / portfolioHistory.length) * 0.3
    return {
      ...item,
      value: Math.round(Math.max(rawPortfolioValue * factor, item.value * scale)),
      profit: Math.round(Math.max(rawPortfolioValue * 0.1 * factor, item.profit * scale)),
    }
  })

  // 3. Dynamic Asset Allocation Data
  const COLORS = ['#7c3aed', '#06b6d4', '#f97316', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6b7280']
  let currentAllocation
  if (tokenList.length === 0) {
    currentAllocation = [{ name: 'Ethereum', value: 100, color: '#7c3aed' }]
  } else {
    const ethShare = 70
    const tokenShare = 30
    const numTokens = tokenList.length
    const perTokenShare = Math.round(tokenShare / numTokens)

    currentAllocation = [
      { name: 'Ethereum', value: ethShare, color: COLORS[0] },
      ...tokenList.map((token, index) => ({
        name: token.symbol,
        value: perTokenShare,
        color: COLORS[(index + 1) % COLORS.length]
      }))
    ]
  }

  // 4. Recent Transactions mapping
  const formatEthShort = (wei) => (Number(wei) / 1e18).toFixed(4)
  const timeAgo = (ts) => {
    const diff = Math.floor(Date.now() / 1000) - Number(ts)
    if (diff < 60)   return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`
    if (diff < 86400)return `${Math.floor(diff/3600)}h ago`
    return `${Math.floor(diff/86400)}d ago`
  }

  let displayTransactions = []
  if (txHistory && txHistory.length > 0) {
    displayTransactions = txHistory.slice(0, 5).map((tx) => {
        const isSent = tx.from.toLowerCase() === account.toLowerCase()
        const usdValue = Number(tx.value) / 1e18 * ethPriceNum
        return {
          id: tx.hash,
          type: isSent ? 'sell' : 'buy',
          coin: isSent ? 'Sent' : 'Received',
          symbol: 'ETH',
          amount: `${isSent ? '-' : '+'}${formatEthShort(tx.value)} ETH`,
          value: `$${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
          time: timeAgo(tx.timeStamp),
          status: tx.isError === '0' ? 'completed' : 'pending',
          color: isSent ? '#ef4444' : '#34d399'
        }
      })
  }

  return (
    <DashboardLayout>
      <div className={styles.dashboard}>
        <OnChainSetupBanner />
        <header
          ref={headerRef}
          className={`${styles.header} ${headerInView ? styles.headerVisible : ''}`}
        >
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>Overview</h1>
            <p className={styles.pageDate}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              {' · '}
              <span className={styles.pageNetwork}>Sepolia</span>
            </p>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.searchBox}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
                <path d="M11 11l3 3" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input placeholder="Search coins..." id="dash-search" />
            </div>
            <button className={styles.notifBtn} id="dash-notifications">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 2a5 5 0 00-5 5v3l-1.5 2.5h13L14 10V7a5 5 0 00-5-5z" stroke="white" strokeWidth="1.5"/>
                <path d="M7 14a2 2 0 004 0" stroke="white" strokeWidth="1.5"/>
              </svg>
              <span className={styles.notifDot}></span>
            </button>
            <div 
              className={styles.avatar} 
              id="dash-user-avatar" 
              title={walletProfile?.displayName || account || 'Connected wallet'}
            >
              <span>
                {walletProfile?.displayName
                  ? walletProfile.displayName.slice(0, 2).toUpperCase()
                  : account.slice(2, 4).toUpperCase()
                }
              </span>
            </div>
          </div>
        </header>

        {/* ── Stat Cards ── */}
        <section className={styles.statsGrid}>
          <StatCard
            label="Portfolio value"
            numericValue={portfolioValue}
            prefix="$"
            sub="vs. prior month (mock curve)"
            subUp={true}
            tone="accent"
            icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="#a78bfa" strokeWidth="1.6"/><path d="M10 6v8M7.5 8.5C7.5 7.4 8.6 7 10 7c1.4 0 2.5.4 2.5 1.5S11.4 10 10 10s-2.5.6-2.5 1.5S8.6 13 10 13c1.4 0 2.5-.4 2.5-1.5" stroke="#a78bfa" strokeWidth="1.4" strokeLinecap="round"/></svg>}
          />
          <StatCard
            label="24h change"
            numericValue={changeValue}
            prefix="+$"
            sub={changeSubtext}
            subUp={true}
            tone="success"
            icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 13 Q7 6 10 9 Q13 12 17 5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" fill="none"/><path d="M14 5h3v3" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          />
          <StatCard
            label="Estimated P/L"
            numericValue={profitValue}
            prefix="+$"
            sub={profitSubtext}
            subUp={true}
            tone="info"
            icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3v14M5 8l5-5 5 5" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          />
          <StatCard
            label="Positions"
            value={activePositionsText}
            sub={activePositionsSubtext}
            subUp={true}
            tone="warning"
            icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="16" height="12" rx="2" stroke="#f97316" strokeWidth="1.6"/><path d="M2 9h16" stroke="#f97316" strokeWidth="1.6"/><circle cx="14" cy="13" r="1.5" fill="#f97316"/></svg>}
          />
        </section>

        {/* ── Charts Row ── */}
        <section className={styles.chartsRow}>
          {/* Portfolio Area Chart */}
          <div className={`${styles.chartCard} ${styles.chartCardAnimate}`} style={{ flex: 2 }}>
            <div className={styles.chartHeader}>
              <div>
                <h2 className={styles.chartTitle}>Portfolio Performance</h2>
                <p className={styles.chartSub}>Mock curve scaled to wallet balance</p>
              </div>
              <div className={styles.rangeToggle}>
                {ranges.map(r => (
                  <button
                    key={r}
                    className={`${styles.rangeBtn} ${chartRange === r ? styles.rangeBtnActive : ''}`}
                    onClick={() => setChartRange(r)}
                    id={`dash-range-${r}`}
                  >{r}</button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={scaledPortfolioHistory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
                <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`}/>
                <Tooltip content={<CustomTooltip />}/>
                <Area type="monotone" dataKey="value"  stroke="#7c3aed" strokeWidth={2.5} fill="url(#areaGrad)"   name="Portfolio Value" dot={false} activeDot={{ r: 5, fill: '#7c3aed' }}/>
                <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2}   fill="url(#profitGrad)" name="Profit"          dot={false} activeDot={{ r: 4, fill: '#10b981' }}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Allocation Pie */}
          <div className={`${styles.chartCard} ${styles.chartCardAnimate}`} style={{ flex: 1, minWidth: 260, '--chart-delay': '0.15s' }}>
            <div className={styles.chartHeader}>
              <div>
                <h2 className={styles.chartTitle}>Asset Allocation</h2>
                <p className={styles.chartSub}>Portfolio breakdown</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie
                  data={currentAllocation}
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={78}
                  paddingAngle={3}
                  dataKey="value"
                  isAnimationActive={true}
                  animationBegin={300}
                  animationDuration={1200}
                >
                  {currentAllocation.map((entry, i) => (
                    <Cell key={i} fill={entry.color} opacity={0.9}/>
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: '#1a0a40', border: 'none', borderRadius: 8, color: '#fff' }}/>
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.legend}>
              {currentAllocation.map(item => (
                <div key={item.name} className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: item.color }}></span>
                  <span className={styles.legendName}>{item.name}</span>
                  <span className={styles.legendVal}>{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Volume Chart + Transactions ── */}
        <section className={styles.chartsRow}>
          {/* Volume Bar Chart */}
          <div className={`${styles.chartCard} ${styles.chartCardAnimate}`} style={{ flex: 1, '--chart-delay': '0.1s' }}>
            <div className={styles.chartHeader}>
              <div>
                <h2 className={styles.chartTitle}>Trading Volume</h2>
                <p className={styles.chartSub}>Buy vs Sell — this week</p>
              </div>
              <div className={styles.volumeLegend}>
                <span><i style={{ background: '#7c3aed' }}></i>Buy</span>
                <span><i style={{ background: '#ef4444' }}></i>Sell</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={volumeData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
                <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`}/>
                <Tooltip content={<CustomTooltip />}/>
                <Bar dataKey="buy"  name="Buy"  fill="#7c3aed" radius={[5,5,0,0]} opacity={0.85} isAnimationActive={true} animationDuration={900}/>
                <Bar dataKey="sell" name="Sell" fill="#ef4444" radius={[5,5,0,0]} opacity={0.75} isAnimationActive={true} animationDuration={900} animationBegin={200}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Transactions */}
          <div className={`${styles.chartCard} ${styles.chartCardAnimate}`} style={{ flex: 1, '--chart-delay': '0.2s' }}>
            <div className={styles.chartHeader}>
              <div>
                <h2 className={styles.chartTitle}>Recent Transactions</h2>
                <p className={styles.chartSub}>Your latest activity</p>
              </div>
              <button className={styles.viewAllBtn} id="dash-view-all-tx">View all</button>
            </div>
            <div className={styles.txList}>
              {txLoading ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                  Fetching transactions...
                </div>
              ) : displayTransactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                  No transactions found for this address.
                </div>
              ) : (
                displayTransactions.map((tx, i) => (
                  <div
                    key={tx.id}
                    className={styles.txRow}
                    style={{ '--tx-delay': `${i * 0.08}s` }}
                  >
                    <div className={styles.txIcon} style={{ background: `${tx.color}22`, border: `1px solid ${tx.color}44` }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        {tx.type === 'buy'
                          ? <path d="M7 11V3M3 7l4-4 4 4" stroke={tx.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          : <path d="M7 3v8M3 7l4 4 4-4" stroke={tx.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        }
                      </svg>
                    </div>
                    <div className={styles.txInfo}>
                      <span className={styles.txName}>
                        {walletConnected 
                          ? `${tx.coin} ${tx.symbol}` 
                          : `${tx.type === 'buy' ? 'Bought' : 'Sold'} ${tx.coin}`
                        }
                      </span>
                      <span className={styles.txTime}>{tx.time}</span>
                    </div>
                    <div className={styles.txRight}>
                      <span className={`${styles.txAmount} ${tx.type === 'buy' ? styles.txBuy : styles.txSell}`}>{tx.amount}</span>
                      <span className={styles.txValue}>{tx.value}</span>
                    </div>
                    <div className={`${styles.txStatus} ${tx.status === 'completed' ? styles.txCompleted : styles.txPending}`}>
                      {tx.status}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* ── Market Table ── */}
        <section className={styles.tableSection}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div>
                <h2 className={styles.chartTitle}>Market Watchlist</h2>
                <p className={styles.chartSub}>Top assets by market cap</p>
              </div>
              <span className={styles.dataSourceTag}>
                CoinGecko · {marketCoins.length ? 'live' : 'cached'}
              </span>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Coin</th>
                    <th>Price</th>
                    <th>24h Change</th>
                    <th>Volume (24h)</th>
                    <th>Market Cap</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {liveTopCoins.map((coin, i) => (
                    <CoinRow key={coin.rank} coin={coin} index={i} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </div>
    </DashboardLayout>
  )
}
