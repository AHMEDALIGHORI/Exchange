import { useState } from 'react';
import styles from './BridgePortal.module.css';
import DashboardLayout from '../components/DashboardLayout';

const CHAINS = [
  { id: 'ethereum', name: 'Ethereum Mainnet', icon: 'Ξ' },
  { id: 'arbitrum', name: 'Arbitrum One', icon: '🔵' },
  { id: 'optimism', name: 'Optimism', icon: '🔴' },
  { id: 'polygon', name: 'Polygon PoS', icon: '💜' },
  { id: 'solana', name: 'Solana', icon: '☀️' },
  { id: 'avalanche', name: 'Avalanche C-Chain', icon: '🔺' }
];

const TOKENS = [
  { symbol: 'ETH', name: 'Ether' },
  { symbol: 'USDC', name: 'USD Coin' },
  { symbol: 'USDT', name: 'Tether' },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin' }
];

const PROVIDERS = [
  {
    id: 'across',
    name: 'Across Protocol',
    logo: '⚡',
    time: '1 min',
    feePct: 0.05, // 0.05%
    gasFee: 0.90,
    desc: 'Optimistic Relayer'
  },
  {
    id: 'stargate',
    name: 'Stargate Finance',
    logo: '⭐',
    time: '2 mins',
    feePct: 0.06, // 0.06%
    gasFee: 1.80,
    desc: 'LayerZero Bridge'
  },
  {
    id: 'hop',
    name: 'Hop Protocol',
    logo: '🐰',
    time: '4 mins',
    feePct: 0.08, // 0.08%
    gasFee: 2.50,
    desc: 'L2 Liquidity Bridge'
  }
];

export default function BridgePortal() {
  const [sourceChain, setSourceChain] = useState('ethereum');
  const [destChain, setDestChain] = useState('arbitrum');
  const [token, setToken] = useState('USDC');
  const [amount, setAmount] = useState('1000');
  const [selectedProvider, setSelectedProvider] = useState('across');
  const [isBridging, setIsBridging] = useState(false);
  const [bridgeStep, setBridgeStep] = useState(0); // 0 = idle, 1 = locking, 2 = verifying, 3 = releasing, 4 = complete
  const [txHash, setTxHash] = useState('');

  const handleSourceChange = (nextSource) => {
    setSourceChain(nextSource);
    if (nextSource === destChain) {
      const nextDest = CHAINS.find(c => c.id !== nextSource);
      if (nextDest) setDestChain(nextDest.id);
    }
  };

  const handleDestChange = (nextDest) => {
    setDestChain(nextDest);
    if (nextDest === sourceChain) {
      const nextSource = CHAINS.find(c => c.id !== nextDest);
      if (nextSource) setSourceChain(nextSource.id);
    }
  };


  const swapChains = () => {
    const temp = sourceChain;
    setSourceChain(destChain);
    setDestChain(temp);
  };

  const getProviderInfo = (providerId) => {
    return PROVIDERS.find(p => p.id === providerId) || PROVIDERS[0];
  };

  const currentProvider = getProviderInfo(selectedProvider);
  const numericAmount = parseFloat(amount) || 0;
  const bridgeFee = (numericAmount * currentProvider.feePct) / 100 + currentProvider.gasFee;
  const receiveAmount = Math.max(0, numericAmount - bridgeFee);

  const startBridgeSimulation = () => {
    if (numericAmount <= 0 || isBridging) return;
    setIsBridging(true);
    setBridgeStep(1);
    setTxHash('');

    // Step 1: Deposit & lock (3 seconds)
    setTimeout(() => {
      setBridgeStep(2);
      // Step 2: Verification (3.5 seconds)
      setTimeout(() => {
        setBridgeStep(3);
        // Step 3: Releasing (3 seconds)
        setTimeout(() => {
          setBridgeStep(4);
          setIsBridging(false);
          setTxHash('sim-' + Array.from({length: 12}, () => Math.floor(Math.random()*16).toString(16)).join(''));
        }, 3000);
      }, 3500);
    }, 3000);
  };

  const getChainName = (id) => CHAINS.find(c => c.id === id)?.name || id;
  const getChainIcon = (id) => CHAINS.find(c => c.id === id)?.icon || '🌐';

  return (
    <DashboardLayout activeOverride="labs">
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Cross-Chain Bridge Simulator</h1>
            <p className={styles.subtitle}>Model bridge routes, fees, and settlement timing without moving real assets</p>
          </div>
        </div>

        <div className={styles.grid}>
          {/* Left Form Panel */}
          <div className={styles.panel}>
            <h2 className={styles.sectionTitle}>
              <span>🌉</span> Simulate Transfer
            </h2>

            <div className={styles.bridgeFormRow}>
              {/* Source Chain */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>From (Source Network)</label>
                <select
                  className={styles.formSelect}
                  value={sourceChain}
                  onChange={(e) => handleSourceChange(e.target.value)}
                  disabled={isBridging}
                >
                  {CHAINS.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Swap Button */}
              <button
                className={styles.swapChainsBtn}
                onClick={swapChains}
                disabled={isBridging}
                title="Swap Networks"
              >
                ↔️
              </button>

              {/* Destination Chain */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>To (Destination Network)</label>
                <select
                  className={styles.formSelect}
                  value={destChain}
                  onChange={(e) => handleDestChange(e.target.value)}
                  disabled={isBridging}
                >
                  {CHAINS.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>


          {/* Asset & Amount */}
          <div className={styles.bridgeFormRow} style={{ gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Token</label>
              <select
                className={styles.formSelect}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={isBridging}
              >
                {TOKENS.map(t => (
                  <option key={t.symbol} value={t.symbol}>
                    {t.symbol} - {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Send Amount</label>
              <input
                type="number"
                className={styles.formInput}
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isBridging}
                min="0.0001"
              />
            </div>
          </div>

          {/* Providers */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Select Bridge Protocol</label>
            <div className={styles.providersGrid}>
              {PROVIDERS.map(p => {
                const estFee = (numericAmount * p.feePct) / 100 + p.gasFee;
                const recAmt = Math.max(0, numericAmount - estFee);
                return (
                  <div
                    key={p.id}
                    className={`${styles.providerCard} ${selectedProvider === p.id ? styles.providerActive : ''}`}
                    onClick={() => !isBridging && setSelectedProvider(p.id)}
                  >
                    <div className={styles.providerBrand}>
                      <span className={styles.providerLogo}>{p.logo}</span>
                      <div>
                        <span className={styles.providerName}>{p.name}</span>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)' }}>{p.desc}</div>
                      </div>
                    </div>

                    <div className={styles.providerDetails}>
                      <div className={styles.detailCol}>
                        <span className={styles.detailLabel}>Est. Time</span>
                        <span className={styles.detailVal}>{p.time}</span>
                      </div>
                      <div className={styles.detailCol}>
                        <span className={styles.detailLabel}>Total Fee</span>
                        <span className={styles.detailVal}>${estFee.toFixed(2)}</span>
                      </div>
                      <div className={styles.detailCol}>
                        <span className={styles.detailLabel}>You Receive</span>
                        <span className={styles.detailVal} style={{ color: '#a78bfa' }}>
                          {recAmt.toFixed(4)} {token}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            className={styles.actionBtn}
            onClick={startBridgeSimulation}
            disabled={isBridging || numericAmount <= 0}
          >
            {isBridging ? 'Running Simulation...' : 'Run Bridge Simulation'}
          </button>
        </div>

        {/* Right Info & Progress Panel */}
        <div className={styles.sidebarCard}>
          <h2 className={styles.sectionTitle}>
            <span>📋</span> Bridge Summary
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Route</span>
              <span className={styles.summaryVal}>
                {getChainIcon(sourceChain)} {getChainName(sourceChain)} ➔ {getChainIcon(destChain)} {getChainName(destChain)}
              </span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Asset</span>
              <span className={styles.summaryVal}>{token}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Protocol Operator</span>
              <span className={styles.summaryVal}>{currentProvider.name}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Bridge Gas Fee</span>
              <span className={styles.summaryVal}>${currentProvider.gasFee.toFixed(2)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Liquidity Fee</span>
              <span className={styles.summaryVal}>{(currentProvider.feePct).toFixed(2)}% (${((numericAmount * currentProvider.feePct) / 100).toFixed(2)})</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Total Charged Fee</span>
              <span className={styles.summaryVal} style={{ color: '#f43f5e' }}>${bridgeFee.toFixed(2)}</span>
            </div>
            <div className={styles.summaryRow} style={{ border: 'none', paddingTop: '8px' }}>
              <span className={styles.summaryLabel} style={{ fontWeight: '700', color: '#fff' }}>Expected payout</span>
              <span className={styles.summaryVal} style={{ color: '#10b981', fontSize: '15px' }}>
                {receiveAmount.toFixed(4)} {token}
              </span>
            </div>
          </div>

          {/* Progress Timeline */}
          {bridgeStep > 0 && (
            <div style={{ marginTop: '16px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className={styles.sectionTitle} style={{ fontSize: '14px', marginBottom: '16px' }}>
                <span>⛓️</span> Simulation Status
              </h3>
              <div className={styles.timeline}>
                {/* Step 1 */}
                <div className={`${styles.step} ${bridgeStep >= 1 ? styles.stepActive : ''}`}>
                  <div className={`${styles.stepDot} ${bridgeStep > 1 ? styles.stepDotSuccess : (bridgeStep === 1 ? styles.stepDotActive : '')}`}>
                    {bridgeStep > 1 ? '✓' : '1'}
                  </div>
                  <div className={styles.stepContent}>
                    <span className={`${styles.stepTitle} ${bridgeStep === 1 ? styles.stepTitleActive : (bridgeStep > 1 ? styles.stepTitleSuccess : '')}`}>
                      Deposition locked
                    </span>
                    <span className={`${styles.stepDesc} ${bridgeStep === 1 ? styles.stepDescActive : ''}`}>
                      Locking {numericAmount} {token} on {getChainName(sourceChain)}
                    </span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className={`${styles.step} ${bridgeStep >= 2 ? styles.stepActive : ''}`}>
                  <div className={`${styles.stepDot} ${bridgeStep > 2 ? styles.stepDotSuccess : (bridgeStep === 2 ? styles.stepDotActive : '')}`}>
                    {bridgeStep > 2 ? '✓' : '2'}
                  </div>
                  <div className={styles.stepContent}>
                    <span className={`${styles.stepTitle} ${bridgeStep === 2 ? styles.stepTitleActive : (bridgeStep > 2 ? styles.stepTitleSuccess : '')}`}>
                      Relayer Consensus
                    </span>
                    <span className={`${styles.stepDesc} ${bridgeStep === 2 ? styles.stepDescActive : ''}`}>
                      Verifying transactions on the consensus layer via {currentProvider.name} Relayers
                    </span>
                  </div>
                </div>

                {/* Step 3 */}
                <div className={`${styles.step} ${bridgeStep >= 3 ? styles.stepActive : ''}`}>
                  <div className={`${styles.stepDot} ${bridgeStep > 3 ? styles.stepDotSuccess : (bridgeStep === 3 ? styles.stepDotActive : '')}`}>
                    {bridgeStep > 3 ? '✓' : '3'}
                  </div>
                  <div className={styles.stepContent}>
                    <span className={`${styles.stepTitle} ${bridgeStep === 3 ? styles.stepTitleActive : (bridgeStep > 3 ? styles.stepTitleSuccess : '')}`}>
                      Asset Mint & Release
                    </span>
                    <span className={`${styles.stepDesc} ${bridgeStep === 3 ? styles.stepDescActive : ''}`}>
                      Minting or releasing liquidity to user address on {getChainName(destChain)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success Panel */}
          {bridgeStep === 4 && txHash && (
            <div className={styles.successPanel}>
              <span className={styles.successPanelTitle}>Simulation Complete</span>
              <span className={styles.successPanelDesc}>
                The modeled route completed to {getChainName(destChain)}.
              </span>
              <span className={styles.explorerLink}>Simulation ID: {txHash}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  </DashboardLayout>
  );
}
