import { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import NetworkBanner from '../components/NetworkBanner'
import styles from './DeFi.module.css'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useWallet } from '../context/WalletContext'
import { abis } from '../config/abis'
import { getContractAddress, hasDeployedContracts } from '../config/contracts'
import { formatEther } from 'viem'

// ─── Mock DeFi Data ─────────────────────────────────────
const overviewStats = [
  { label: 'Total Value Locked', value: '$14,892', icon: '🏦', change: '+3.2%', up: true, gradient: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(124,58,237,0.05))' },
  { label: 'Active Positions', value: '7', icon: '📊', change: '+2 this week', up: true, gradient: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(6,182,212,0.04))' },
  { label: 'Total Yield Earned', value: '$1,247', icon: '💰', change: '+$89 today', up: true, gradient: 'linear-gradient(135deg, rgba(16,185,129,0.22), rgba(16,185,129,0.04))' },
  { label: 'Net APY', value: '8.4%', icon: '📈', change: 'Weighted avg', up: true, gradient: 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(249,115,22,0.04))' },
]

const lendingPositions = [
  { protocol: 'Aave V3', asset: 'ETH', type: 'Supply', amount: '2.5 ETH', value: '$9,553', apy: '3.2%', apyColor: '#34d399', logo: '#B6509E', health: 2.1 },
  { protocol: 'Aave V3', asset: 'USDC', type: 'Borrow', amount: '3,000 USDC', value: '$3,000', apy: '4.8%', apyColor: '#f59e0b', logo: '#B6509E', health: 2.1 },
  { protocol: 'Compound', asset: 'DAI', type: 'Supply', amount: '5,000 DAI', value: '$5,000', apy: '2.9%', apyColor: '#34d399', logo: '#00D395', health: null },
  { protocol: 'Compound', asset: 'WBTC', type: 'Borrow', amount: '0.02 WBTC', value: '$1,348', apy: '5.1%', apyColor: '#f59e0b', logo: '#00D395', health: null },
]

const liquidityPools = [
  { pair: 'ETH / USDC', protocol: 'Uniswap V3', tvl: '$2.4B', apy: '12.8%', volume24h: '$184M', fee: '0.3%', color: '#ff007a', myLiquidity: '$2,300', risk: 'Medium' },
  { pair: 'ETH / DAI', protocol: 'SushiSwap', tvl: '$420M', apy: '8.2%', volume24h: '$32M', fee: '0.3%', color: '#fa52a0', myLiquidity: '$1,150', risk: 'Medium' },
  { pair: 'USDC / USDT', protocol: 'Curve', tvl: '$3.1B', apy: '3.4%', volume24h: '$210M', fee: '0.04%', color: '#a5b4c3', myLiquidity: '$4,000', risk: 'Low' },
  { pair: 'WBTC / ETH', protocol: 'Balancer', tvl: '$180M', apy: '6.1%', volume24h: '$18M', fee: '0.3%', color: '#1e1e1e', myLiquidity: '$0', risk: 'Medium' },
]

const yieldFarms = [
  { name: 'ETH-USDC LP', protocol: 'Uniswap', apy: '24.5%', tvl: '$890M', reward: 'UNI', risk: 'High', color: '#ff007a', boosted: true },
  { name: 'stETH Staking', protocol: 'Lido', apy: '4.0%', tvl: '$14.2B', reward: 'LDO', risk: 'Low', color: '#00a3ff', boosted: false },
  { name: 'USDC Lending', protocol: 'Aave', apy: '3.2%', tvl: '$4.5B', reward: 'AAVE', risk: 'Low', color: '#B6509E', boosted: false },
  { name: 'CRV-ETH LP', protocol: 'Convex', apy: '18.3%', tvl: '$320M', reward: 'CVX+CRV', risk: 'High', color: '#3A67F0', boosted: true },
  { name: 'DAI Savings', protocol: 'MakerDAO', apy: '5.0%', tvl: '$2.1B', reward: 'DSR', risk: 'Low', color: '#F4B731', boosted: false },
  { name: 'GMX Staking', protocol: 'GMX', apy: '14.7%', tvl: '$540M', reward: 'esGMX+ETH', risk: 'Medium', color: '#2D42FC', boosted: true },
]

const protocolDistribution = [
  { name: 'Aave', value: 35, color: '#B6509E' },
  { name: 'Uniswap', value: 25, color: '#ff007a' },
  { name: 'Curve', value: 20, color: '#a5b4c3' },
  { name: 'Lido', value: 12, color: '#00a3ff' },
  { name: 'Others', value: 8, color: '#6b7280' },
]

export default function DeFi() {
  const { status, account, balance, ethPrice, readContract } = useWallet()
  const walletConnected = status === 'connected'
  const onChainReady = hasDeployedContracts()
  const stakingAddress = getContractAddress('StakingPool')
  const excAddress = getContractAddress('SimpleERC20')

  const [onChainStats, setOnChainStats] = useState(null)
  const [activeTab, setActiveTab] = useState('lending')

  useEffect(() => {
    async function loadOnChain() {
      if (!walletConnected || !account || !onChainReady) {
        setOnChainStats(null)
        return
      }
      try {
        const [excBal, staked, totalStaked] = await Promise.all([
          readContract({ address: excAddress, abi: abis.SimpleERC20, functionName: 'balanceOf', args: [account] }),
          readContract({ address: stakingAddress, abi: abis.StakingPool, functionName: 'stakes', args: [account] }),
          readContract({ address: stakingAddress, abi: abis.StakingPool, functionName: 'totalStaked' }),
        ])
        const ethBal = balance ? Number(balance) / 1e18 : 0
        const ethUsd = ethBal * (ethPrice || 0)
        const exc = Number(formatEther(excBal))
        const stake = Number(formatEther(staked))
        setOnChainStats({
          ethBal,
          excBal: exc,
          staked: stake,
          totalStaked: Number(formatEther(totalStaked)),
          portfolioUsd: ethUsd + exc * 0.01,
        })
      } catch {
        setOnChainStats(null)
      }
    }
    loadOnChain()
  }, [walletConnected, account, onChainReady, balance, ethPrice, readContract, excAddress, stakingAddress])

  const stats = walletConnected && onChainStats ? [
    { label: 'ETH Balance', value: `${onChainStats.ethBal.toFixed(4)} ETH`, icon: '⟠', change: 'Live Sepolia', up: true, gradient: overviewStats[0].gradient },
    { label: 'EXC Balance', value: `${onChainStats.excBal.toFixed(2)} EXC`, icon: '🪙', change: 'Wallet read', up: true, gradient: overviewStats[1].gradient },
    { label: 'Staked EXC', value: `${onChainStats.staked.toFixed(2)} EXC`, icon: '🔒', change: 'StakingPool', up: true, gradient: overviewStats[2].gradient },
    { label: 'Est. Portfolio', value: `$${Math.round(onChainStats.portfolioUsd).toLocaleString()}`, icon: '📈', change: 'On-chain', up: true, gradient: overviewStats[3].gradient },
  ] : overviewStats

  return (
    <DashboardLayout activeOverride="defi">
      <div className={styles.container}>

        {/* Header */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>DeFi Dashboard</h1>
            <p className={styles.subtitle}>
              {walletConnected && onChainStats
                ? 'Live Sepolia balances plus educational DeFi position templates'
                : 'Monitor lending, borrowing, and yield farming positions'}
            </p>
          </div>
          <div className={styles.headerBadge}>
            <span className={styles.protocolCount}>
              {walletConnected && onChainStats ? 'Sepolia Live' : '5 Protocols'}
            </span>
          </div>
        </header>

        <NetworkBanner />

        {/* Overview Stats */}
        <div className={styles.statsGrid}>
          {stats.map((stat, i) => (
            <div key={stat.label} className={styles.statCard} style={{ '--card-gradient': stat.gradient, '--i': i }}>
              <div className={styles.statTop}>
                <span className={styles.statLabel}>{stat.label}</span>
                <span className={styles.statIcon}>{stat.icon}</span>
              </div>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={`${styles.statChange} ${stat.up ? styles.up : styles.down}`}>
                {stat.up ? '▲' : '▼'} {stat.change}
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className={styles.mainRow}>

          {/* Left: Tabs Content */}
          <div className={styles.mainContent}>

            {/* Tabs */}
            <div className={styles.tabs}>
              {['lending', 'pools', 'farming'].map(tab => (
                <button
                  key={tab}
                  className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'lending' && '🏛️ '}
                  {tab === 'pools' && '💧 '}
                  {tab === 'farming' && '🌾 '}
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Lending Tab */}
            {activeTab === 'lending' && (
              <div className={styles.tabContent}>
                <div className={styles.sectionHeader}>
                  <h3>Lending & Borrowing Positions</h3>
                  <p>Active positions across DeFi protocols</p>
                </div>
                <div className={styles.positionTable}>
                  <div className={styles.tableHead}>
                    <span>Protocol</span>
                    <span>Asset</span>
                    <span>Type</span>
                    <span>Amount</span>
                    <span>Value</span>
                    <span>APY</span>
                  </div>
                  {lendingPositions.map((pos, i) => (
                    <div key={`${pos.protocol}-${pos.asset}-${pos.type}`} className={styles.tableRow} style={{ '--i': i }}>
                      <span className={styles.protocolCell}>
                        <span className={styles.protocolDot} style={{ background: pos.logo }} />
                        {pos.protocol}
                      </span>
                      <span className={styles.assetCell}>{pos.asset}</span>
                      <span>
                        <span className={`${styles.typeBadge} ${pos.type === 'Supply' ? styles.typeSupply : styles.typeBorrow}`}>
                          {pos.type}
                        </span>
                      </span>
                      <span className={styles.amountCell}>{pos.amount}</span>
                      <span className={styles.valueCell}>{pos.value}</span>
                      <span style={{ color: pos.apyColor, fontWeight: 700 }}>{pos.apy}</span>
                    </div>
                  ))}
                </div>

                {/* Health Factor */}
                <div className={styles.healthCard}>
                  <div className={styles.healthHeader}>
                    <span className={styles.healthLabel}>Health Factor (Aave)</span>
                    <span className={styles.healthValue}>2.10</span>
                  </div>
                  <div className={styles.healthBar}>
                    <div className={styles.healthFill} style={{ width: '70%' }} />
                    <div className={styles.healthMarker} style={{ left: '70%' }} />
                  </div>
                  <div className={styles.healthLegend}>
                    <span className={styles.healthDanger}>Liquidation &lt; 1.0</span>
                    <span className={styles.healthSafe}>Safe &gt; 1.5</span>
                  </div>
                </div>
              </div>
            )}

            {/* Pools Tab */}
            {activeTab === 'pools' && (
              <div className={styles.tabContent}>
                <div className={styles.sectionHeader}>
                  <h3>Liquidity Pools</h3>
                  <p>Your liquidity positions and pool performance</p>
                </div>
                <div className={styles.poolGrid}>
                  {liquidityPools.map((pool, i) => (
                    <div key={pool.pair} className={styles.poolCard} style={{ '--i': i }}>
                      <div className={styles.poolHeader}>
                        <div className={styles.poolPair}>
                          <span className={styles.poolDot} style={{ background: pool.color }} />
                          <div>
                            <div className={styles.poolName}>{pool.pair}</div>
                            <div className={styles.poolProtocol}>{pool.protocol}</div>
                          </div>
                        </div>
                        <span className={`${styles.riskBadge} ${styles[`risk${pool.risk}`]}`}>{pool.risk}</span>
                      </div>
                      <div className={styles.poolStats}>
                        <div className={styles.poolStat}>
                          <span className={styles.poolStatLabel}>APY</span>
                          <span className={styles.poolStatValue} style={{ color: '#34d399' }}>{pool.apy}</span>
                        </div>
                        <div className={styles.poolStat}>
                          <span className={styles.poolStatLabel}>TVL</span>
                          <span className={styles.poolStatValue}>{pool.tvl}</span>
                        </div>
                        <div className={styles.poolStat}>
                          <span className={styles.poolStatLabel}>24h Vol</span>
                          <span className={styles.poolStatValue}>{pool.volume24h}</span>
                        </div>
                        <div className={styles.poolStat}>
                          <span className={styles.poolStatLabel}>Fee</span>
                          <span className={styles.poolStatValue}>{pool.fee}</span>
                        </div>
                      </div>
                      <div className={styles.poolFooter}>
                        <span className={styles.poolLiq}>My Liquidity: {pool.myLiquidity}</span>
                        <button className={styles.poolBtn}>
                          {pool.myLiquidity === '$0' ? 'Add Liquidity' : 'Manage'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Farming Tab */}
            {activeTab === 'farming' && (
              <div className={styles.tabContent}>
                <div className={styles.sectionHeader}>
                  <h3>Yield Farming Opportunities</h3>
                  <p>Explore top yield farming strategies across DeFi</p>
                </div>
                <div className={styles.farmGrid}>
                  {yieldFarms.map((farm, i) => (
                    <div key={farm.name} className={styles.farmCard} style={{ '--i': i }}>
                      {farm.boosted && <span className={styles.boostedBadge}>🔥 Boosted</span>}
                      <div className={styles.farmHeader}>
                        <span className={styles.farmDot} style={{ background: farm.color }} />
                        <div>
                          <div className={styles.farmName}>{farm.name}</div>
                          <div className={styles.farmProtocol}>{farm.protocol}</div>
                        </div>
                      </div>
                      <div className={styles.farmApy}>{farm.apy}</div>
                      <div className={styles.farmMeta}>
                        <div className={styles.farmMetaItem}>
                          <span className={styles.farmMetaLabel}>TVL</span>
                          <span>{farm.tvl}</span>
                        </div>
                        <div className={styles.farmMetaItem}>
                          <span className={styles.farmMetaLabel}>Reward</span>
                          <span>{farm.reward}</span>
                        </div>
                      </div>
                      <div className={styles.farmFooter}>
                        <span className={`${styles.riskBadge} ${styles[`risk${farm.risk}`]}`}>{farm.risk}</span>
                        <button className={styles.farmBtn}>Deposit</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Protocol Distribution */}
          <div className={styles.sidebar}>
            <div className={styles.sidebarCard}>
              <h3 className={styles.sidebarTitle}>Protocol Distribution</h3>
              <p className={styles.sidebarSub}>TVL breakdown by protocol</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={protocolDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    animationBegin={200}
                    animationDuration={1000}
                  >
                    {protocolDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} opacity={0.85} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => `${v}%`}
                    contentStyle={{ background: '#1a0a40', border: 'none', borderRadius: 8, color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.legendList}>
                {protocolDistribution.map(item => (
                  <div key={item.name} className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: item.color }} />
                    <span className={styles.legendName}>{item.name}</span>
                    <span className={styles.legendVal}>{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Summary */}
            <div className={styles.sidebarCard}>
              <h3 className={styles.sidebarTitle}>Risk Overview</h3>
              <div className={styles.riskList}>
                <div className={styles.riskRow}>
                  <span className={`${styles.riskBadge} ${styles.riskLow}`}>Low</span>
                  <span className={styles.riskCount}>3 positions</span>
                </div>
                <div className={styles.riskRow}>
                  <span className={`${styles.riskBadge} ${styles.riskMedium}`}>Medium</span>
                  <span className={styles.riskCount}>3 positions</span>
                </div>
                <div className={styles.riskRow}>
                  <span className={`${styles.riskBadge} ${styles.riskHigh}`}>High</span>
                  <span className={styles.riskCount}>1 position</span>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className={styles.sidebarCard}>
              <h3 className={styles.sidebarTitle}>💡 DeFi Tips</h3>
              <div className={styles.tipsList}>
                <div className={styles.tip}>Always keep your Health Factor above 1.5 to avoid liquidation.</div>
                <div className={styles.tip}>Stablecoin pools carry lower impermanent loss risk.</div>
                <div className={styles.tip}>Diversify across protocols to reduce smart contract risk.</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
