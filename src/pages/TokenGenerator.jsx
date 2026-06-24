import { useState, useEffect } from 'react';
import styles from './TokenGenerator.module.css';
import { pinJSONToIPFS } from '../utils/pinata';
import DashboardLayout from '../components/DashboardLayout';
import NetworkBanner from '../components/NetworkBanner';
import { useWallet } from '../context/WalletContext';
import { abis, bytecodes } from '../config/abis';
import { getExplorerAddressUrl, getExplorerTxUrl } from '../config/contracts';

export default function TokenGenerator() {
  const { status, account, deployContract, parseTokenAmount } = useWallet();
  const walletConnected = status === 'connected';
  const [name, setName] = useState('MyCustomToken');
  const [symbol, setSymbol] = useState('MCT');
  const [decimals, setDecimals] = useState('18');
  const [initialSupply, setInitialSupply] = useState('1000000');
  const [description, setDescription] = useState('My utility ERC-20 token generated on ExChange Web3 Labs.');

  // Features
  const [features, setFeatures] = useState({
    mintable: true,
    burnable: true,
    pausable: false,
    ownable: true
  });

  const [solidityCode, setSolidityCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [logs, setLogs] = useState([
    { type: 'info', text: 'ERC-20 Generator Engine initialized.' },
    { type: 'info', text: 'Define token specs to preview Solidity contract.' }
  ]);
  const [successInfo, setSuccessInfo] = useState(null);

  const toggleFeature = (key) => {
    setFeatures(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const addLog = (type, text) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { type, text: `[${time}] ${text}` }]);
  };

  // Live update Solidity preview
  useEffect(() => {
    let imports = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";\n`;
    
    let inheritsList = ['ERC20'];
    
    if (features.burnable) {
      imports += `import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";\n`;
      inheritsList.push('ERC20Burnable');
    }
    if (features.pausable) {
      imports += `import "@openzeppelin/contracts/security/Pausable.sol";\n`;
      inheritsList.push('Pausable');
    }
    if (features.ownable) {
      imports += `import "@openzeppelin/contracts/access/Ownable.sol";\n`;
      inheritsList.push('Ownable');
    }

    const inherits = inheritsList.join(', ');

    let contractBody = `contract ${name || 'Token'} is ${inherits} {
    constructor(uint256 initialSupply) ERC20("${name || 'Token'}", "${symbol || 'TKN'}") {\n`;
    
    if (features.ownable) {
      contractBody += `        // Owner inherits control rights\n`;
    }
    contractBody += `        _mint(msg.sender, initialSupply * 10 ** decimals());
    }\n`;

    if (features.mintable) {
      contractBody += `\n    function mint(address to, uint256 amount) public ${features.ownable ? 'onlyOwner ' : ''}{\n        _mint(to, amount);\n    }\n`;
    }

    if (features.pausable) {
      contractBody += `\n    function pause() public onlyOwner {\n        _pause();\n    }\n\n    function unpause() public onlyOwner {\n        _unpause();\n    }\n\n    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override whenNotPaused {\n        super._beforeTokenTransfer(from, to, amount);\n    }\n`;
    }

    contractBody += `}`;
    setSolidityCode(imports + '\n' + contractBody);
  }, [name, symbol, features]);

  const handleLaunchToken = async () => {
    if (!name || !symbol) return;
    if (!walletConnected || !account) {
      addLog('error', 'Connect MetaMask on Sepolia to deploy.');
      return;
    }

    setIsGenerating(true);
    setSuccessInfo(null);
    addLog('info', 'Pinning metadata manifest to IPFS...');

    const metadata = {
      name,
      symbol,
      decimals: parseInt(decimals) || 18,
      totalSupply: parseFloat(initialSupply) || 0,
      description,
      creatorPlatform: 'ExChange Web3 Labs',
      features: features,
    };

    const pinResult = await pinJSONToIPFS(metadata, `ERC20_${symbol}_Metadata`);

    if (!pinResult.success) {
      addLog('error', `Failed to pin metadata to Pinata: ${pinResult.error || 'Unknown network error'}`);
      setIsGenerating(false);
      return;
    }

    addLog('success', `Metadata pinned to IPFS CID: ${pinResult.ipfsHash}`);
    addLog('info', 'Deploying SimpleERC20 to Sepolia...');

    try {
      const supply = parseTokenAmount(initialSupply || '0', parseInt(decimals) || 18);
      const { hash, address } = await deployContract({
        abi: abis.SimpleERC20,
        bytecode: bytecodes.SimpleERC20,
        args: [name, symbol, parseInt(decimals) || 18, supply, account],
      });

      addLog('success', `Token deployed at ${address}`);
      setSuccessInfo({
        address,
        txHash: hash,
        ipfsUrl: pinResult.gatewayUrl,
        ipfsHash: pinResult.ipfsHash,
        explorerUrl: getExplorerAddressUrl(address),
        txExplorerUrl: getExplorerTxUrl(hash),
      });
    } catch (err) {
      addLog('error', `Deployment failed: ${err.shortMessage || err.message}`);
    }

    setIsGenerating(false);
  };

  return (
    <DashboardLayout activeOverride="labs">
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>ERC-20 Token Generator</h1>
            <p className={styles.subtitle}>Deploy OpenZeppelin-based ERC-20 tokens on Sepolia and pin metadata to IPFS</p>
          </div>
        </div>

        <NetworkBanner />

        <div className={styles.grid}>
          {/* Token Specs Form */}
          <div className={styles.panel}>
            <h2 className={styles.sectionTitle}>
              <span>🛠️</span> Token Parameters
            </h2>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Token Name</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={name}
                  onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                  placeholder="e.g. Shiba Inu"
                  disabled={isGenerating}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Token Symbol</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase().slice(0, 8))}
                  placeholder="e.g. SHIB"
                  disabled={isGenerating}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Decimals</label>
                <input
                  type="number"
                  className={styles.formInput}
                  value={decimals}
                  onChange={(e) => setDecimals(e.target.value)}
                  placeholder="18"
                  disabled={isGenerating}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Initial Supply</label>
                <input
                  type="number"
                  className={styles.formInput}
                  value={initialSupply}
                  onChange={(e) => setInitialSupply(e.target.value)}
                  placeholder="1000000"
                  disabled={isGenerating}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Token Description (Metadata)</label>
              <input
                type="text"
                className={styles.formInput}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide information about this token..."
                disabled={isGenerating}
              />
            </div>

            {/* Configurable Features */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Additional Token Features</label>
              <div className={styles.featuresGrid}>
                <div
                  className={`${styles.featureCard} ${features.mintable ? styles.featureCardActive : ''}`}
                  onClick={() => !isGenerating && toggleFeature('mintable')}
                >
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={features.mintable}
                    readOnly
                  />
                  <div className={styles.featureInfo}>
                    <span className={styles.featureName}>Mintable</span>
                    <span className={styles.featureDesc}>Create extra supply later</span>
                  </div>
                </div>

                <div
                  className={`${styles.featureCard} ${features.burnable ? styles.featureCardActive : ''}`}
                  onClick={() => !isGenerating && toggleFeature('burnable')}
                >
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={features.burnable}
                    readOnly
                  />
                  <div className={styles.featureInfo}>
                    <span className={styles.featureName}>Burnable</span>
                    <span className={styles.featureDesc}>Destroy supply tokens</span>
                  </div>
                </div>

                <div
                  className={`${styles.featureCard} ${features.pausable ? styles.featureCardActive : ''}`}
                  onClick={() => !isGenerating && toggleFeature('pausable')}
                >
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={features.pausable}
                    readOnly
                  />
                  <div className={styles.featureInfo}>
                    <span className={styles.featureName}>Pausable</span>
                    <span className={styles.featureDesc}>Freeze transfers in crisis</span>
                  </div>
                </div>

                <div
                  className={`${styles.featureCard} ${features.ownable ? styles.featureCardActive : ''}`}
                  onClick={() => !isGenerating && toggleFeature('ownable')}
                >
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={features.ownable}
                    readOnly
                  />
                  <div className={styles.featureInfo}>
                    <span className={styles.featureName}>Ownable</span>
                    <span className={styles.featureDesc}>Has admin privileges</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              className={styles.actionBtn}
              onClick={handleLaunchToken}
              disabled={isGenerating || !name || !symbol || !walletConnected}
            >
              {isGenerating ? '🚀 Pinning & Deploying...' : walletConnected ? '✨ Deploy Token on Sepolia' : 'Connect Wallet to Deploy'}
            </button>
          </div>

          {/* Live Code Preview & IPFS Result */}
          <div className={styles.panel} style={{ background: 'rgba(255, 255, 255, 0.015)' }}>
            <h2 className={styles.sectionTitle}>
              <span>👁️</span> Code Preview
            </h2>

            <div className={styles.codeWrapper}>
              <div className={styles.codeHeader}>
                <span className={styles.codeTitle}>{name || 'Token'}.sol</span>
                <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)' }}>Solidity v0.8.19</span>
              </div>
              <div className={styles.codeContainer}>
                <pre className={styles.codeText}>
                  {solidityCode}
                </pre>
              </div>
            </div>

            {/* Console */}
            <div className={styles.console}>
              {logs.map((l, i) => (
                <div
                  key={i}
                  className={`${styles.consoleLine} ${
                    l.type === 'success' ? styles.consoleSuccess :
                    l.type === 'error' ? styles.consoleError :
                    l.type === 'info' ? styles.consoleInfo : ''
                  }`}
                >
                  {l.text}
                </div>
              ))}
            </div>

            {/* Success Info Block */}
            {successInfo && (
              <div className={styles.successCard}>
                <span className={styles.successTitle}>🎉 Token Launched Successfully!</span>
                <div className={styles.successDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Deployed Address</span>
                    <span className={styles.value} title={successInfo.address}>{successInfo.address}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Transaction Hash</span>
                    <span className={styles.value} title={successInfo.txHash}>{successInfo.txHash}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Metadata IPFS Hash</span>
                    <span className={styles.value} title={successInfo.ipfsHash}>{successInfo.ipfsHash}</span>
                  </div>
                  <div className={styles.detailRow} style={{ border: 'none', paddingBottom: 0 }}>
                    <span className={styles.label}>Gateway Link</span>
                    <a
                      href={successInfo.ipfsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.ipfsLink}
                    >
                      View IPFS Metadata JSON ↗
                    </a>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Etherscan</span>
                    <a href={successInfo.explorerUrl} target="_blank" rel="noreferrer" className={styles.ipfsLink}>
                      View Contract ↗
                    </a>
                    <a href={successInfo.txExplorerUrl} target="_blank" rel="noreferrer" className={styles.ipfsLink}>
                      View Tx ↗
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
