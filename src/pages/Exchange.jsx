import { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import NetworkBanner from '../components/NetworkBanner'
import styles from './Exchange.module.css'
import { useWallet } from '../context/WalletContext'
import { useLocation } from 'react-router-dom'
import { abis } from '../config/abis'
import { getContractAddress, getExplorerTxUrl, hasDeployedContracts } from '../config/contracts'
import { formatEther, parseEther } from 'viem'

const DEFAULT_TOKENS = [
  { symbol: 'ETH', name: 'Ethereum', balance: '0.00', price: 0, color: '#7c3aed', onChain: true },
  { symbol: 'EXC', name: 'ExChange Token', balance: '0.00', price: 0, color: '#06b6d4', onChain: true },
]

export default function Exchange() {
  const {
    status,
    balance,
    ethPrice,
    account,
    writeContract,
    readContract,
    refreshWallet,
    parseTokenAmount,
  } = useWallet()
  const walletConnected = status === 'connected'
  const location = useLocation()
  const swapAddress = getContractAddress('SimpleSwap')
  const excAddress = getContractAddress('SimpleERC20')
  const onChainReady = hasDeployedContracts() && swapAddress && excAddress

  const getSelectedToken = () => {
    const params = new URLSearchParams(location.search)
    const toSym = params.get('swapTo') || 'EXC'
    return DEFAULT_TOKENS.find(t => t.symbol === toSym) || DEFAULT_TOKENS[1]
  }

  const [fromToken, setFromToken] = useState(DEFAULT_TOKENS[0])
  const [toToken, setToToken] = useState(getSelectedToken())
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [excBalance, setExcBalance] = useState('0')
  const [swapState, setSwapState] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [txHash, setTxHash] = useState(null)

  const ethBal = balance ? Number(balance) / 1e18 : 0
  const ethPriceNum = ethPrice || 3821.18
  const isOnChainPair =
    onChainReady &&
    ((fromToken.symbol === 'ETH' && toToken.symbol === 'EXC') ||
      (fromToken.symbol === 'EXC' && toToken.symbol === 'ETH'))

  useEffect(() => {
    async function loadExcBalance() {
      if (!account || !excAddress || !walletConnected) {
        setExcBalance('0')
        return
      }
      try {
        const bal = await readContract({
          address: excAddress,
          abi: abis.SimpleERC20,
          functionName: 'balanceOf',
          args: [account],
        })
        setExcBalance(formatEther(bal))
      } catch {
        setExcBalance('0')
      }
    }
    loadExcBalance()
  }, [account, excAddress, walletConnected, readContract, swapState])

  useEffect(() => {
    setFromToken(prev => ({
      ...prev,
      balance: prev.symbol === 'ETH' ? ethBal.toFixed(4) : prev.symbol === 'EXC' ? parseFloat(excBalance).toFixed(4) : prev.balance,
      price: prev.symbol === 'ETH' ? ethPriceNum : prev.price,
    }))
  }, [ethBal, ethPriceNum, excBalance])

  // Conversion calculations
  const handleFromChange = (val) => {
    setFromAmount(val)
    if (!val || isNaN(val)) {
      setToAmount('')
      return
    }
    const fromUSD = Number(val) * fromToken.price
    const targetAmount = fromUSD / toToken.price
    setToAmount(targetAmount.toFixed(6))
  }

  const handleToChange = (val) => {
    setToAmount(val)
    if (!val || isNaN(val)) {
      setFromAmount('')
      return
    }
    const toUSD = Number(val) * toToken.price
    const sourceAmount = toUSD / fromToken.price
    setFromAmount(sourceAmount.toFixed(6))
  }

  const handleSetMax = () => {
    const maxVal = fromToken.symbol === 'ETH' ? Math.max(0, ethBal - 0.005) : 0 // Leave a tiny ETH for gas
    handleFromChange(maxVal.toString())
  }

  const handleSwapTokens = () => {
    const temp = fromToken
    setFromToken(toToken)
    setToToken(temp)
    setFromAmount(toAmount)
    setToAmount(fromAmount)
  }

  const handleExecuteSwap = async (e) => {
    e.preventDefault()
    if (!fromAmount || Number(fromAmount) <= 0) return

    if (!walletConnected) {
      setErrorMessage('Connect MetaMask on Sepolia to swap.')
      return
    }

    if (isOnChainPair) {
      setErrorMessage('')
      setSwapState('signing')
      try {
        let hash
        if (fromToken.symbol === 'ETH') {
          hash = (await writeContract({
            address: swapAddress,
            abi: abis.SimpleSwap,
            functionName: 'swapEthForTokens',
            args: [],
            value: parseEther(fromAmount),
          })).hash
        } else {
          const amount = parseTokenAmount(fromAmount, 18)
          await writeContract({
            address: excAddress,
            abi: abis.SimpleERC20,
            functionName: 'approve',
            args: [swapAddress, amount],
          })
          hash = (await writeContract({
            address: swapAddress,
            abi: abis.SimpleSwap,
            functionName: 'swapTokensForEth',
            args: [amount],
          })).hash
        }
        setTxHash(hash)
        setSwapState('success')
        await refreshWallet()
      } catch (err) {
        setErrorMessage(err.shortMessage || err.message)
        setSwapState('idle')
      }
      return
    }

    setErrorMessage('On-chain swaps support ETH ↔ EXC on Sepolia. Deploy contracts or select ETH/EXC pair.')
  }

  const handleReset = () => {
    setSwapState('idle')
    setFromAmount('')
    setToAmount('')
    setTxHash(null)
    setErrorMessage('')
  }

  return (
    <DashboardLayout activeOverride="exchange">
      <div className={styles.container}>
        
        {/* Header */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Token Exchange</h1>
            <p className={styles.subtitle}>
              {onChainReady
                ? 'Swap ETH and EXC on Sepolia via the on-chain SimpleSwap contract'
                : 'Deploy contracts to enable Sepolia swaps (ETH ↔ EXC)'}
            </p>
          </div>
        </header>

        <NetworkBanner />

        {/* Swap Widget */}
        <div className={styles.widgetWrapper}>
          <div className={styles.swapCard}>
            
            {swapState === 'idle' ? (
              <form onSubmit={handleExecuteSwap} className={styles.swapForm}>
                
                {/* From Input */}
                <div className={styles.inputGroup}>
                  <div className={styles.inputHeader}>
                    <span>From</span>
                    <span>Balance: {fromToken.symbol === 'ETH' ? ethBal.toFixed(4) : fromToken.symbol === 'EXC' ? parseFloat(excBalance).toFixed(4) : fromToken.balance} {fromToken.symbol}</span>
                  </div>
                  <div className={styles.inputRow}>
                    <input
                      type="text"
                      placeholder="0.0"
                      value={fromAmount}
                      onChange={(e) => handleFromChange(e.target.value)}
                      required
                    />
                    <button type="button" className={styles.maxBtn} onClick={handleSetMax}>
                      MAX
                    </button>
                    <div className={styles.tokenPill}>
                      <span className={styles.tokenDot} style={{ background: fromToken.color }} />
                      {fromToken.symbol}
                    </div>
                  </div>
                </div>

                {/* Swap Loop Arrow Button */}
                <div className={styles.arrowRow}>
                  <button type="button" className={styles.arrowBtn} onClick={handleSwapTokens} title="Switch direction">
                    ⇅
                  </button>
                </div>

                {/* To Input */}
                <div className={styles.inputGroup}>
                  <div className={styles.inputHeader}>
                    <span>To</span>
                    <span>Balance: {toToken.symbol === 'EXC' ? parseFloat(excBalance).toFixed(4) : toToken.symbol === 'ETH' ? ethBal.toFixed(4) : '0.00'} {toToken.symbol}</span>
                  </div>
                  <div className={styles.inputRow}>
                    <input
                      type="text"
                      placeholder="0.0"
                      value={toAmount}
                      onChange={(e) => handleToChange(e.target.value)}
                      required
                    />
                    <div className={styles.tokenPill}>
                      <span className={styles.tokenDot} style={{ background: toToken.color }} />
                      {toToken.symbol}
                    </div>
                  </div>
                </div>

                {/* Conversion Details */}
                {fromAmount && (
                  <div className={styles.rateRow}>
                    <span>Exchange Rate:</span>
                    <span>
                      1 {fromToken.symbol} = {(fromToken.price / toToken.price).toFixed(6)} {toToken.symbol}
                    </span>
                  </div>
                )}

                {errorMessage && <div className={styles.errorText}>{errorMessage}</div>}

                {/* Submit Action */}
                <button
                  type="submit"
                  className={styles.swapSubmitBtn}
                  disabled={!walletConnected || !isOnChainPair}
                >
                  {walletConnected
                    ? (isOnChainPair ? 'Swap on Sepolia' : 'Select ETH ↔ EXC')
                    : 'Connect Wallet'}
                </button>
              </form>
            ) : swapState === 'signing' ? (
              <div className={styles.signingState}>
                <div className={styles.spinner} />
                <h3 className={styles.signingTitle}>Awaiting Wallet Signature</h3>
                <p className={styles.signingDesc}>
                  Confirm the swap transaction in MetaMask on Sepolia.
                </p>
              </div>
            ) : (
              <div className={styles.successState}>
                <div className={styles.successBadge}>✓</div>
                <h3 className={styles.signingTitle}>Swap Successful!</h3>
                <p className={styles.signingDesc}>
                  Successfully exchanged {fromAmount} {fromToken.symbol} for {toAmount} {toToken.symbol}.
                </p>
                <div className={styles.receipt}>
                  <div className={styles.receiptRow}>
                    <span>Status</span>
                    <span style={{ color: '#34d399' }}>Confirmed on Sepolia</span>
                  </div>
                  {txHash && (
                    <div className={styles.receiptRow}>
                      <span>Transaction</span>
                      <a href={getExplorerTxUrl(txHash)} target="_blank" rel="noreferrer" style={{ color: '#7c3aed' }}>
                        View on Etherscan ↗
                      </a>
                    </div>
                  )}
                </div>
                <button className={styles.swapSubmitBtn} onClick={handleReset}>
                  Make another swap
                </button>
              </div>
            )}

          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
