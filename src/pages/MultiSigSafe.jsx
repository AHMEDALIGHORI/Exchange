import { useState, useEffect, useCallback } from 'react';
import styles from './MultiSigSafe.module.css';
import DashboardLayout from '../components/DashboardLayout';
import NetworkBanner from '../components/NetworkBanner';
import { useWallet } from '../context/WalletContext';
import { abis, bytecodes } from '../config/abis';
import { getExplorerAddressUrl } from '../config/contracts';
import { formatEther, parseEther, isAddress } from 'viem';

export default function MultiSigSafe() {
  const { status, account, deployContract, writeContract, readContract } = useWallet();
  const walletConnected = status === 'connected';

  const [owners, setOwners] = useState([
    '',
    '0x290cCc12911b3efB1922A346C82F245165522463',
  ]);
  const [threshold, setThreshold] = useState(2);
  const [isDeploying, setIsDeploying] = useState(false);
  const [safeVault, setSafeVault] = useState(null); // { address, owners, threshold, balance }
  
  // Proposal Submitter state
  const [destAddress, setDestAddress] = useState('0xDeFiBridgeContractAddress0000000000000');
  const [valueAmount, setValueAmount] = useState('1.5');
  const [description, setDescription] = useState('Deposit assets to Arbitrum Bridge Pool');
  const [proposals, setProposals] = useState([]);

  // Log notifications
  const [logMessages, setLogMessages] = useState([
    'Multisig client initialized (Sepolia).',
    'Connect wallet and deploy a real MultiSigWallet contract.'
  ]);

  useEffect(() => {
    if (account) {
      setOwners(prev => (prev[0] ? prev : [account, prev[1] || '']));
    }
  }, [account]);

  const refreshVaultStats = useCallback(async (vaultAddress) => {
    if (!vaultAddress) return {};
    try {
      const bal = await readContract({
        address: vaultAddress,
        abi: abis.MultiSigWallet,
        functionName: 'getBalance',
      });
      const txCount = await readContract({
        address: vaultAddress,
        abi: abis.MultiSigWallet,
        functionName: 'getTransactionCount',
      });
      return { balance: Number(formatEther(bal)), txCount: Number(txCount) };
    } catch {
      return {};
    }
  }, [readContract]);

  useEffect(() => {
    if (!safeVault?.address) return;
    let cancelled = false;
    refreshVaultStats(safeVault.address).then((stats) => {
      if (cancelled) return;
      setSafeVault(prev => prev?.address === safeVault.address ? { ...prev, ...stats } : prev);
    });
    return () => {
      cancelled = true;
    };
  }, [safeVault?.address, proposals.length, refreshVaultStats]);

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString();
    setLogMessages(prev => [...prev, `[${time}] ${msg}`]);
  };

  const handleAddOwner = () => {
    if (owners.length >= 5) {
      addLog('Warning: Maximum 5 owners allowed for local playground coordinator.');
      return;
    }
    setOwners(prev => [...prev, '']);
  };

  const handleOwnerChange = (index, value) => {
    const updated = [...owners];
    updated[index] = value;
    setOwners(updated);
  };

  const handleRemoveOwner = (index) => {
    if (owners.length <= 2) {
      addLog('Warning: Safe Vault requires at least 2 owners.');
      return;
    }
    setOwners(prev => prev.filter((_, i) => i !== index));
    if (threshold > owners.length - 1) {
      setThreshold(owners.length - 1);
    }
  };

  const deploySafeVault = async () => {
    if (!walletConnected || !account) {
      addLog('Error: Connect MetaMask on Sepolia first.');
      return;
    }

    const activeOwners = owners.filter(o => o.trim() !== '' && isAddress(o.trim()));
    if (activeOwners.length < 2) {
      addLog('Error: Safe Vault requires at least 2 valid owner addresses.');
      return;
    }
    if (threshold > activeOwners.length) {
      addLog('Error: Threshold cannot exceed total number of active owners.');
      return;
    }

    setIsDeploying(true);
    addLog(`Deploying MultiSigWallet (${threshold}-of-${activeOwners.length}) to Sepolia...`);

    try {
      const { address } = await deployContract({
        abi: abis.MultiSigWallet,
        bytecode: bytecodes.MultiSigWallet,
        args: [activeOwners, threshold],
      });

      setSafeVault({
        address,
        owners: activeOwners,
        threshold,
        balance: 0,
      });
      setProposals([]);
      addLog(`Safe Vault deployed at ${address}`);
      addLog(`Explorer: ${getExplorerAddressUrl(address)}`);
      addLog('Fund the vault by sending Sepolia ETH to this address.');
    } catch (err) {
      addLog(`Deploy failed: ${err.shortMessage || err.message}`);
    }

    setIsDeploying(false);
  };

  const submitProposal = async (e) => {
    e.preventDefault();
    if (!safeVault) return;

    const numericVal = parseFloat(valueAmount) || 0;
    if (numericVal <= 0) {
      addLog('Error: Value transfer amount must be greater than 0.');
      return;
    }
    if (!isAddress(destAddress)) {
      addLog('Error: Invalid destination address.');
      return;
    }

    try {
      const valueWei = parseEther(String(valueAmount));
      const { hash } = await writeContract({
        address: safeVault.address,
        abi: abis.MultiSigWallet,
        functionName: 'submitTransaction',
        args: [destAddress, valueWei, '0x'],
      });

      const txCount = await readContract({
        address: safeVault.address,
        abi: abis.MultiSigWallet,
        functionName: 'getTransactionCount',
      });
      const newId = Number(txCount) - 1;

      const newProposal = {
        id: newId,
        destination: destAddress,
        value: numericVal,
        description,
        executed: false,
        signatures: safeVault.owners.reduce((acc, owner) => {
          acc[owner] = owner.toLowerCase() === account?.toLowerCase();
          return acc;
        }, {}),
        txHash: hash,
      };

      setProposals(prev => [newProposal, ...prev]);
      addLog(`Proposal #${newId} submitted on-chain (${hash.slice(0, 10)}...)`);
    } catch (err) {
      addLog(`Submit failed: ${err.shortMessage || err.message}`);
    }
  };

  const signProposal = async (propId) => {
    if (!safeVault) return;
    try {
      const { hash } = await writeContract({
        address: safeVault.address,
        abi: abis.MultiSigWallet,
        functionName: 'confirmTransaction',
        args: [BigInt(propId)],
      });
      setProposals(prev => prev.map(p => {
        if (p.id !== propId) return p;
        const updatedSigs = { ...p.signatures };
        if (account) updatedSigs[account] = true;
        addLog(`Confirmed proposal #${propId} (${hash.slice(0, 10)}...)`);
        return { ...p, signatures: updatedSigs };
      }));
      const stats = await refreshVaultStats(safeVault.address);
      setSafeVault(prev => prev ? { ...prev, ...stats } : prev);
    } catch (err) {
      addLog(`Confirm failed: ${err.shortMessage || err.message}`);
    }
  };

  const executeProposal = async (propId) => {
    if (!safeVault) return;
    try {
      const { hash } = await writeContract({
        address: safeVault.address,
        abi: abis.MultiSigWallet,
        functionName: 'executeTransaction',
        args: [BigInt(propId)],
      });
      setProposals(prev => prev.map(p => (p.id === propId ? { ...p, executed: true } : p)));
      const stats = await refreshVaultStats(safeVault.address);
      setSafeVault(prev => prev ? { ...prev, ...stats } : prev);
      addLog(`Proposal #${propId} executed (${hash.slice(0, 10)}...)`);
    } catch (err) {
      addLog(`Execute failed: ${err.shortMessage || err.message}`);
    }
  };

  return (
    <DashboardLayout activeOverride="labs">
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Multi-Sig Safe Coordinator</h1>
            <p className={styles.subtitle}>Deploy and operate a real MultiSigWallet on Sepolia testnet</p>
          </div>
        </div>

        <NetworkBanner />

        <div className={styles.grid}>
          {/* Left Control Panel */}
          <div className={styles.panel}>

          {!safeVault ? (
            <>
              <h2 className={styles.sectionTitle}>
                <span>🔐</span> Vault Setup
              </h2>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Owners (Addresses)</label>
                <div className={styles.ownersList}>
                  {owners.map((owner, idx) => (
                    <div key={idx} className={styles.ownerRow}>
                      <span className={styles.ownerIndex}>{idx + 1}</span>
                      <input
                        type="text"
                        className={styles.formInput}
                        style={{ flex: 1 }}
                        value={owner}
                        onChange={(e) => handleOwnerChange(idx, e.target.value)}
                        placeholder="0x..."
                        disabled={isDeploying}
                      />
                      <button
                        className={styles.removeOwnerBtn}
                        onClick={() => handleRemoveOwner(idx)}
                        disabled={isDeploying}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  className={styles.addOwnerBtn}
                  onClick={handleAddOwner}
                  disabled={isDeploying}
                >
                  + Add Co-Owner Address
                </button>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Minimum Threshold Signatures</label>
                <select
                  className={styles.formSelect}
                  value={threshold}
                  onChange={(e) => setThreshold(parseInt(e.target.value))}
                  disabled={isDeploying}
                >
                  {Array.from({ length: owners.length }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>
                      {num} signature{num > 1 ? 's' : ''} (out of {owners.length} owners)
                    </option>
                  ))}
                </select>
              </div>

              <button
                className={styles.actionBtn}
                onClick={deploySafeVault}
                disabled={isDeploying || owners.filter(o => o.trim() !== '').length < 2 || !walletConnected}
              >
                {isDeploying ? '🚀 Deploying...' : walletConnected ? 'Deploy Safe Vault on Sepolia' : 'Connect Wallet'}
              </button>
            </>
          ) : (
            <>
              <h2 className={styles.sectionTitle}>
                <span>📝</span> Propose Transaction
              </h2>

              <form onSubmit={submitProposal} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Destination Address</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={destAddress}
                    onChange={(e) => setDestAddress(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Ether Amount (ETH)</label>
                  <input
                    type="number"
                    step="0.001"
                    className={styles.formInput}
                    value={valueAmount}
                    onChange={(e) => setValueAmount(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Tx Description / ABI payload</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className={styles.actionBtn}>
                  Submit Proposal
                </button>
              </form>

              <button
                className={styles.actionBtn}
                style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#f87171', marginTop: '10px' }}
                onClick={() => {
                  setSafeVault(null);
                  setProposals([]);
                  addLog('Safe Vault reset. Return to Vault setup portal.');
                }}
              >
                Reset / Deploy New Vault
              </button>
            </>
          )}

          {/* Console Log Feed */}
          <div style={{ marginTop: '10px' }}>
            <span className={styles.formLabel}>Local Coordinator Log Feed</span>
            <div
              style={{
                background: '#090a0f',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px',
                padding: '10px 14px',
                fontFamily: 'Fira Code, monospace',
                fontSize: '11px',
                height: '110px',
                overflowY: 'auto',
                color: '#94a3b8',
                marginTop: '6px'
              }}
            >
              {logMessages.map((msg, i) => (
                <div key={i} style={{ margin: '4px 0', lineBreak: 'anywhere' }}>{msg}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Info & Proposals List */}
        <div className={styles.panel} style={{ background: 'rgba(255, 255, 255, 0.015)' }}>
          {safeVault ? (
            <>
              {/* Vault Header Details */}
              <div className={styles.vaultCard}>
                <div className={styles.vaultHeader}>
                  <span style={{ fontWeight: '700', color: '#fff', fontSize: '15px' }}>
                    🏢 Safe Vault Status
                  </span>
                  <span className={styles.vaultStatus}>Deployed</span>
                </div>
                <div className={styles.vaultData}>
                  <div>
                    <span className={styles.dataLabel}>Address:</span>
                    <div className={styles.dataVal} style={{ fontFamily: 'Fira Code', fontSize: '11px' }}>
                      {safeVault.address.slice(0, 10)}...{safeVault.address.slice(-8)}
                    </div>
                  </div>
                  <div>
                    <span className={styles.dataLabel}>Balance:</span>
                    <div className={styles.dataVal} style={{ color: '#10b981' }}>
                      {Number(safeVault.balance || 0).toFixed(4)} ETH
                    </div>
                  </div>
                  <div>
                    <span className={styles.dataLabel}>Confirmation:</span>
                    <div className={styles.dataVal}>
                      {safeVault.threshold}-of-{safeVault.owners.length} owners
                    </div>
                  </div>
                  <div>
                    <span className={styles.dataLabel}>Active Owners:</span>
                    <div className={styles.dataVal}>
                      {safeVault.owners.length} Addresses
                    </div>
                  </div>
                </div>
              </div>

              {/* Proposals Queue */}
              <h2 className={styles.sectionTitle} style={{ marginTop: '12px' }}>
                <span>📋</span> Proposals Queue ({proposals.length})
              </h2>

              <div className={styles.proposalsContainer}>
                {proposals.length === 0 ? (
                  <div className={styles.emptyState}>
                    No transaction proposals submitted yet. Submit a proposal to start co-signing.
                  </div>
                ) : (
                  proposals.map(p => {
                    const signaturesCount = Object.values(p.signatures).filter(Boolean).length;
                    const canExecute = signaturesCount >= safeVault.threshold;

                    return (
                      <div key={p.id} className={styles.proposalCard}>
                        <div className={styles.propHeader}>
                          <span className={styles.propTitle}>Proposal #{p.id}</span>
                          <span className={`${styles.statusBadge} ${p.executed ? styles.badgeSuccess : styles.badgePending}`}>
                            {p.executed ? 'Executed' : 'Pending Signatures'}
                          </span>
                        </div>

                        <div className={styles.propDetail}>
                          <strong>To:</strong> {p.destination.slice(0, 14)}...{p.destination.slice(-6)}<br />
                          <strong>Value:</strong> {p.value} ETH<br />
                          <strong>Payload:</strong> "{p.description}"
                        </div>

                        <div className={styles.signaturesTitle}>
                          Signatures ({signaturesCount} / {safeVault.threshold} required)
                        </div>

                        <div className={styles.signaturesGrid}>
                          {safeVault.owners.map(owner => {
                            const isSigned = p.signatures[owner];
                            return (
                              <div key={owner} className={styles.signatureItem}>
                                <span className={styles.signerAddress}>
                                  {owner.slice(0, 8)}...{owner.slice(-6)}
                                </span>
                                <div>
                                  {isSigned ? (
                                    <span className={`${styles.signStatusText} ${styles.signedText}`}>✓ Signed</span>
                                  ) : (
                                    <>
                                      <span className={`${styles.signStatusText} ${styles.unsignedText}`} style={{ marginRight: '8px' }}>Pending</span>
                                      {!p.executed && account?.toLowerCase() === owner.toLowerCase() && (
                                        <button
                                          className={styles.signPropBtn}
                                          onClick={() => signProposal(p.id)}
                                        >
                                          Confirm
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {!p.executed && (
                          <button
                            className={styles.executePropBtn}
                            onClick={() => executeProposal(p.id)}
                            disabled={!canExecute}
                            style={{
                              opacity: canExecute ? 1 : 0.6,
                              cursor: canExecute ? 'pointer' : 'not-allowed'
                            }}
                          >
                            Execute Transaction
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className={styles.emptyState} style={{ padding: '60px 20px' }}>
              ⚙️ Deploy a Safe Vault contract on Sepolia to manage multi-sig transactions.
            </div>
          )}
        </div>
      </div>
    </div>
  </DashboardLayout>
  );
}
