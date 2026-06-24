import { useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import styles from './ArbitrageSimulator.module.css'

const presets = {
  profitable: {
    token: 'ETH',
    amount: '100',
    dexA: 'Uniswap V3',
    dexB: 'SushiSwap',
    dexARate: '3850',
    dexBRate: '3820',
    gasFee: '0.05',
  },
  unprofitable: {
    token: 'ETH',
    amount: '100',
    dexA: 'Uniswap V3',
    dexB: 'SushiSwap',
    dexARate: '3820',
    dexBRate: '3850',
    gasFee: '0.05',
  },
  revert: {
    token: 'ETH',
    amount: '100',
    dexA: 'Uniswap V3',
    dexB: 'SushiSwap',
    dexARate: '3500', // high slippage
    dexBRate: '3820',
    gasFee: '0.05',
  }
}

export default function ArbitrageSimulator() {
  const [activePreset, setActivePreset] = useState('profitable')
  const [token, setToken] = useState(presets.profitable.token)
  const [amount, setAmount] = useState(presets.profitable.amount)
  const [dexA, setDexA] = useState(presets.profitable.dexA)
  const [dexB, setDexB] = useState(presets.profitable.dexB)
  const [dexARate, setDexARate] = useState(presets.profitable.dexARate)
  const [dexBRate, setDexBRate] = useState(presets.profitable.dexBRate)
  const [gasFee, setGasFee] = useState(presets.profitable.gasFee)
  
  const [logs, setLogs] = useState([])
  const [isSimulating, setIsSimulating] = useState(false)
  const [status, setStatus] = useState('idle') // idle | success | error

  const applyPreset = (presetName) => {
    setActivePreset(presetName)
    const p = presets[presetName]
    setToken(p.token)
    setAmount(p.amount)
    setDexA(p.dexA)
    setDexB(p.dexB)
    setDexARate(p.dexARate)
    setDexBRate(p.dexBRate)
    setGasFee(p.gasFee)
  }

  // Math Calculations
  const loanFee = parseFloat(amount) * 0.0009 // 0.09% fee
  const repayAmount = parseFloat(amount) + loanFee

  const dexAOutput = parseFloat(amount) * parseFloat(dexARate)
  const dexBOutput = dexAOutput / parseFloat(dexBRate)
  const grossProfit = dexBOutput - repayAmount
  const netProfit = grossProfit - parseFloat(gasFee)

  const isProfitable = netProfit > 0 && dexBOutput >= repayAmount

  const runSimulation = async () => {
    setIsSimulating(true)
    setStatus('idle')
    setLogs([])

    const appendLog = (text, type = 'info') => {
      setLogs(prev => [...prev, { text, type, time: new Date().toLocaleTimeString() }])
    }

    const wait = (ms) => new Promise(res => setTimeout(res, ms))

    try {
      appendLog(`Initializing Flash Loan transaction on EVM...`, 'info')
      await wait(600)
      
      appendLog(`Requesting ${amount} ${token} from Aave V3 Liquidity Pool...`, 'info')
      await wait(800)

      appendLog(`Flash Loan approved. Aave fee: ${loanFee.toFixed(4)} ${token} (0.09%). Required repayment: ${repayAmount.toFixed(4)} ${token}`, 'success')
      await wait(700)

      appendLog(`Executing arbitrage routing block inside single transaction...`, 'info')
      await wait(500)

      appendLog(`Step 1: Swapping ${amount} ${token} for ${dexAOutput.toLocaleString(undefined, {maximumFractionDigits: 2})} USDC on ${dexA} (Rate: 1 ${token} = ${dexARate} USDC)...`, 'info')
      await wait(900)

      appendLog(`Step 2: Swapping ${dexAOutput.toLocaleString(undefined, {maximumFractionDigits: 2})} USDC for ${dexBOutput.toFixed(4)} ${token} on ${dexB} (Rate: 1 ${token} = ${dexBRate} USDC)...`, 'info')
      await wait(900)

      if (dexBOutput < repayAmount) {
        if (activePreset === 'revert') {
          appendLog(`Repayment check failed: Output (${dexBOutput.toFixed(4)} ${token}) is less than repayment threshold (${repayAmount.toFixed(4)} ${token}).`, 'error')
          await wait(600)
          appendLog(`Aave V3 callback validation rejected. Rolling back transaction block...`, 'error')
          await wait(500)
          throw new Error('EVM Revert: FlashLoanRepaymentFailed')
        } else {
          appendLog(`Step 3: Repaying Aave V3 ${repayAmount.toFixed(4)} ${token} using intermediate pool reserves...`, 'info')
          await wait(800)
          appendLog(`Aave V3 Loan Repaid. Transaction validated successfully.`, 'success')
          setStatus('error') // unprofitable still returns error/warning
        }
      } else {
        appendLog(`Step 3: Repaying Aave V3 ${repayAmount.toFixed(4)} ${token} from swap outputs...`, 'info')
        await wait(800)
        appendLog(`Aave V3 Loan Repaid. Transaction validated successfully.`, 'success')
        await wait(500)
        appendLog(`Net arbitrage profit of ${netProfit.toFixed(4)} ${token} transferred to wallet.`, 'success')
        setStatus('success')
      }
    } catch (err) {
      appendLog(`Transaction FAILED: ${err.message}`, 'error')
      appendLog(`All operations rolled back. Borrowed assets returned. Gas spent: ${gasFee} ${token}.`, 'error')
      setStatus('error')
    } finally {
      setIsSimulating(false)
    }
  }

  return (
    <DashboardLayout activeOverride="labs">
      <div className={styles.container}>
        
        {/* Header */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Flash Loan Arbitrage Simulator</h1>
            <p className={styles.subtitle}>Test single-block multi-pool arbitrage routes with mock zero-collateral capital.</p>
          </div>
        </header>

        {/* Presets */}
        <div className={styles.presetsRow}>
          <button 
            className={`${styles.presetBtn} ${activePreset === 'profitable' ? styles.presetActive : ''}`}
            onClick={() => applyPreset('profitable')}
          >
            📈 Profitable Route Preset
          </button>
          <button 
            className={`${styles.presetBtn} ${activePreset === 'unprofitable' ? styles.presetActive : ''}`}
            onClick={() => applyPreset('unprofitable')}
          >
            📉 Unprofitable Route Preset
          </button>
          <button 
            className={`${styles.presetBtn} ${activePreset === 'revert' ? styles.presetActive : ''}`}
            onClick={() => applyPreset('revert')}
          >
            ⚠️ High-Slippage Reverting Preset
          </button>
        </div>

        {/* Content Grid */}
        <div className={styles.grid}>
          <div className={styles.panel}>
            <h3 className={styles.sectionTitle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M8 12h8M12 8v8"></path>
              </svg>
              Flash Loan Route Setup
            </h3>

            {/* Custom Input Block */}
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Borrow Asset</label>
                <select className={styles.formSelect} value={token} onChange={(e) => setToken(e.target.value)}>
                  <option value="ETH">ETH</option>
                  <option value="USDC">USDC</option>
                  <option value="WBTC">WBTC</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Flash Loan Capital</label>
                <input 
                  type="number" 
                  className={styles.formInput} 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                />
              </div>
            </div>

            {/* DEX details */}
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>DEX A Swap (Buy Asset)</label>
                <input 
                  type="text" 
                  className={styles.formInput} 
                  value={dexA} 
                  onChange={(e) => setDexA(e.target.value)} 
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>DEX A Rate (USDC per Token)</label>
                <input 
                  type="number" 
                  className={styles.formInput} 
                  value={dexARate} 
                  onChange={(e) => setDexARate(e.target.value)} 
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>DEX B Swap (Sell Asset)</label>
                <input 
                  type="text" 
                  className={styles.formInput} 
                  value={dexB} 
                  onChange={(e) => setDexB(e.target.value)} 
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>DEX B Rate (USDC per Token)</label>
                <input 
                  type="number" 
                  className={styles.formInput} 
                  value={dexBRate} 
                  onChange={(e) => setDexBRate(e.target.value)} 
                />
              </div>
            </div>

            {/* Visualizer representation */}
            <div className={styles.routeVisualizer}>
              <div className={styles.node}>
                <div className={styles.nodeHeader}>
                  <div className={styles.nodeNumber}>1</div>
                  <span className={styles.nodeTitle}>Aave Pool</span>
                </div>
                <span className={styles.nodeVal}>Borrow {amount} {token}</span>
              </div>
              <div className={styles.arrow}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <polyline points="19 12 12 19 5 12"></polyline>
                </svg>
              </div>
              <div className={styles.node}>
                <div className={styles.nodeHeader}>
                  <div className={styles.nodeNumber}>2</div>
                  <span className={styles.nodeTitle}>{dexA}</span>
                </div>
                <span className={styles.nodeVal}>Buy USDC</span>
              </div>
              <div className={styles.arrow}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <polyline points="19 12 12 19 5 12"></polyline>
                </svg>
              </div>
              <div className={styles.node}>
                <div className={styles.nodeHeader}>
                  <div className={styles.nodeNumber}>3</div>
                  <span className={styles.nodeTitle}>{dexB}</span>
                </div>
                <span className={styles.nodeVal}>Sell to {token}</span>
              </div>
              <div className={styles.arrow}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <polyline points="19 12 12 19 5 12"></polyline>
                </svg>
              </div>
              <div className={styles.node}>
                <div className={styles.nodeHeader}>
                  <div className={styles.nodeNumber}>4</div>
                  <span className={styles.nodeTitle}>Aave Pool</span>
                </div>
                <span className={styles.nodeVal}>Repay {repayAmount.toFixed(4)} {token}</span>
              </div>
            </div>
          </div>

          {/* Right Statistics / Output */}
          <div className={styles.sidebarCard}>
            <h3 className={styles.sectionTitle}>Arbitrage Math</h3>

            <div className={styles.statsList}>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Borrow Amount</span>
                <span className={styles.statVal}>{amount} {token}</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Aave Flash Fee (0.09%)</span>
                <span className={styles.statVal}>{loanFee.toFixed(4)} {token}</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Repayment Threshold</span>
                <span className={styles.statVal}>{repayAmount.toFixed(4)} {token}</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>DEX A Swap Value</span>
                <span className={styles.statVal}>{dexAOutput.toLocaleString(undefined, {maximumFractionDigits: 2})} USDC</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>DEX B Swap Return</span>
                <span className={styles.statVal}>{dexBOutput.toFixed(4)} {token}</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Estimated Gas Cost</span>
                <span className={styles.statVal}>{gasFee} {token}</span>
              </div>
              <div className={styles.statRow} style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                <span className={styles.statLabel} style={{ fontWeight: 'bold' }}>Simulated Net Profit</span>
                <span 
                  className={styles.statVal} 
                  style={{ color: isProfitable ? '#34d399' : '#f87171', fontSize: '15px' }}
                >
                  {netProfit.toFixed(4)} {token}
                </span>
              </div>
            </div>

            {status === 'success' && (
              <div className={`${styles.outcomePanel} ${styles.outcomeSuccess}`}>
                <span>Simulated Arbitrage Successful!</span>
                <span style={{ fontSize: '11px', fontWeight: 'normal' }}>Net profit has been captured.</span>
              </div>
            )}

            {status === 'error' && (
              <div className={`${styles.outcomePanel} ${styles.outcomeFail}`}>
                <span>Simulated Arbitrage Reverted!</span>
                <span style={{ fontSize: '11px', fontWeight: 'normal' }}>
                  {activePreset === 'revert' ? 'EVM Transaction rejected: Insufficient output.' : 'Route unprofitable after gas fees.'}
                </span>
              </div>
            )}

            <button className={styles.actionBtn} onClick={runSimulation} disabled={isSimulating}>
              {isSimulating ? 'Executing Arbitrage Block...' : 'Run Simulated Flash Loan'}
            </button>

            {/* Console output display */}
            <h4 className={styles.sectionTitle} style={{ fontSize: '13px', marginTop: '10px' }}>EVM Simulator Logs</h4>
            <div className={styles.console}>
              {logs.length === 0 ? (
                <span className={styles.consoleLine} style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Console ready. Run simulation to verify routes.
                </span>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className={styles.consoleLine}>
                    <span style={{ color: 'rgba(255,255,255,0.3)' }}>[{log.time}]</span>{' '}
                    <span className={
                      log.type === 'success' ? styles.consoleSuccess :
                      log.type === 'error' ? styles.consoleError : styles.consoleInfo
                    }>
                      {log.text}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
