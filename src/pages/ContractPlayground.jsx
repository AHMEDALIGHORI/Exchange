import { useState } from 'react';
import styles from './ContractPlayground.module.css';
import DashboardLayout from '../components/DashboardLayout';
import NetworkBanner from '../components/NetworkBanner';
import { useWallet } from '../context/WalletContext';
import { abis, bytecodes } from '../config/abis';
import { getExplorerAddressUrl } from '../config/contracts';

const TEMPLATES = {
  SimpleStorage: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleStorage {
    uint256 private storedData = 100;

    event ValueChanged(address indexed author, uint256 newValue);

    /**
     * @dev Store value in variable
     * @param x value to store
     */
    function set(uint256 x) public {
        storedData = x;
        emit ValueChanged(msg.sender, x);
    }

    /**
     * @dev Return value
     */
    function get() public view returns (uint256) {
        return storedData;
    }
}`,
  BasicToken: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract BasicToken {
    string public name = "Playground Token";
    string public symbol = "PLAY";
    uint256 public totalSupply = 1000000 * 10**18;
    
    mapping(address => uint256) private balances;

    constructor() {
        balances[msg.sender] = totalSupply;
    }

    function transfer(address to, uint256 amount) public returns (bool) {
        require(balances[msg.sender] >= amount, "ERC20: transfer amount exceeds balance");
        balances[msg.sender] -= amount;
        balances[to] += amount;
        return true;
    }

    function balanceOf(address account) public view returns (uint256) {
        return balances[account];
    }
}`,
  MultiSigWallet: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MultiSigWallet {
    address[] public owners;
    uint256 public required = 2;
    
    struct Transaction {
        address destination;
        uint256 value;
        bool executed;
    }
    
    Transaction[] public transactions;

    constructor(address[] memory _owners) {
        require(_owners.length >= 2, "Owners must be at least 2");
        owners = _owners;
    }

    function submitTransaction(address dest, uint256 val) public returns (uint256) {
        transactions.push(Transaction({
            destination: dest,
            value: val,
            executed: false
        }));
        return transactions.length - 1;
    }

    function getTransactionCount() public view returns (uint256) {
        return transactions.length;
    }
}`
};

export default function ContractPlayground() {
  const { status, account, deployContract, writeContract, readContract, parseTokenAmount } = useWallet();
  const walletConnected = status === 'connected';
  const [selectedTemplate, setSelectedTemplate] = useState('SimpleStorage');
  const [code, setCode] = useState(TEMPLATES.SimpleStorage);
  const [consoleLogs, setConsoleLogs] = useState([
    { type: 'info', text: 'Solidity Compiler v0.8.19 initialized.' },
    { type: 'info', text: 'Ready for compilation.' }
  ]);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compiledInfo, setCompiledInfo] = useState(null); // { name, abi, bytecode }
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedContracts, setDeployedContracts] = useState([]);

  // Load template
  const handleTemplateChange = (e) => {
    const templateName = e.target.value;
    setSelectedTemplate(templateName);
    setCode(TEMPLATES[templateName]);
    setCompiledInfo(null);
    addLog('info', `Loaded template: ${templateName}`);
  };

  const addLog = (type, text) => {
    const timestamp = new Date().toLocaleTimeString();
    setConsoleLogs(prev => [...prev, { type, text: `[${timestamp}] ${text}` }]);
  };

  const compileContract = () => {
    setIsCompiling(true);
    setCompiledInfo(null);
    addLog('info', 'Loading Hardhat artifact ABI + bytecode...');

    setTimeout(() => {
      const match = code.match(/contract\s+(\w+)/);
      const contractName = match ? match[1] : 'Contract';
      let artifactAbi = abis.SimpleStorage;
      let artifactBytecode = bytecodes.SimpleStorage;

      if (selectedTemplate === 'BasicToken') {
        artifactAbi = abis.SimpleERC20;
        artifactBytecode = bytecodes.SimpleERC20;
      } else if (selectedTemplate === 'MultiSigWallet') {
        artifactAbi = abis.MultiSigWallet;
        artifactBytecode = bytecodes.MultiSigWallet;
      }

      const mockAbi = getMockAbiForTemplate(selectedTemplate);
      addLog('success', `Artifact loaded for ${contractName} (Sepolia deploy ready).`);
      setCompiledInfo({
        name: contractName,
        abi: mockAbi,
        fullAbi: artifactAbi,
        bytecode: artifactBytecode,
      });
      setIsCompiling(false);
    }, 400);
  };

  const deployContractOnChain = async () => {
    if (!compiledInfo) return;
    if (!walletConnected || !account) {
      addLog('error', 'Connect MetaMask on Sepolia to deploy.');
      return;
    }

    setIsDeploying(true);
    addLog('info', `Deploying ${compiledInfo.name} to Sepolia...`);

    try {
      let args = [];
      if (selectedTemplate === 'BasicToken') {
        const supply = parseTokenAmount('1000000', 18);
        args = ['Playground Token', 'PLAY', 18, supply, account];
      } else if (selectedTemplate === 'MultiSigWallet') {
        args = [[account, '0x000000000000000000000000000000000000dEaD'], 1];
        addLog('info', 'Using 1-of-2 demo owners (you + burn address).');
      }

      const { hash, address } = await deployContract({
        abi: compiledInfo.fullAbi,
        bytecode: compiledInfo.bytecode,
        args,
      });

      const newContract = {
        id: Date.now(),
        name: compiledInfo.name,
        address,
        template: selectedTemplate,
        abi: compiledInfo.abi,
        fullAbi: compiledInfo.fullAbi,
        txHash: hash,
      };

      setDeployedContracts(prev => [newContract, ...prev]);
      addLog('success', `Contract deployed at ${address}`);
      addLog('info', `Explorer: ${getExplorerAddressUrl(address)}`);
    } catch (err) {
      addLog('error', `Deploy failed: ${err.shortMessage || err.message}`);
    }

    setIsDeploying(false);
  };

  const executeMethod = async (contractId, methodName, inputs) => {
    const contractIndex = deployedContracts.findIndex(c => c.id === contractId);
    if (contractIndex === -1) return;

    const contract = deployedContracts[contractIndex];

    try {
      const method = contract.abi.find(m => m.name === methodName);
      const isView = method?.stateMutability === 'view';

      if (isView) {
        let args = [];
        if (contract.template === 'SimpleStorage' && methodName === 'get') args = [];
        else if (contract.template === 'BasicToken' && methodName === 'balanceOf') {
          args = [inputs.account || account];
        } else if (contract.template === 'MultiSigWallet' && methodName === 'getTransactionCount') args = [];

        const result = await readContract({
          address: contract.address,
          abi: contract.fullAbi,
          functionName: methodName,
          args,
        });

        const formatted = String(result);
        addLog('info', `Call ${contract.name}.${methodName}() -> ${formatted}`);
        const updatedContracts = [...deployedContracts];
        updatedContracts[contractIndex] = {
          ...contract,
          lastResult: { [methodName]: formatted },
        };
        setDeployedContracts(updatedContracts);
        return;
      }

      if (contract.template === 'SimpleStorage' && methodName === 'set') {
        const val = BigInt(inputs.x || 0);
        const { hash } = await writeContract({
          address: contract.address,
          abi: contract.fullAbi,
          functionName: 'set',
          args: [val],
        });
        addLog('success', `Tx SimpleStorage.set(${val}) confirmed: ${hash.slice(0, 10)}...`);
      } else if (contract.template === 'BasicToken' && methodName === 'transfer') {
        const to = inputs.to;
        const amt = BigInt(inputs.amount || 0);
        const { hash } = await writeContract({
          address: contract.address,
          abi: contract.fullAbi,
          functionName: 'transfer',
          args: [to, amt],
        });
        addLog('success', `Tx transfer confirmed: ${hash.slice(0, 10)}...`);
      } else if (contract.template === 'MultiSigWallet' && methodName === 'submitTransaction') {
        const dest = inputs.dest;
        const val = BigInt(inputs.val || 0);
        const { hash } = await writeContract({
          address: contract.address,
          abi: contract.fullAbi,
          functionName: 'submitTransaction',
          args: [dest, val, '0x'],
        });
        addLog('success', `Tx submitTransaction confirmed: ${hash.slice(0, 10)}...`);
      }

      const updatedContracts = [...deployedContracts];
      updatedContracts[contractIndex] = {
        ...contract,
        lastResult: { [methodName]: 'Transaction confirmed on Sepolia' },
      };
      setDeployedContracts(updatedContracts);
    } catch (err) {
      addLog('error', `Execution failed: ${err.shortMessage || err.message}`);
    }
  };

  return (
    <DashboardLayout activeOverride="labs">
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Solidity Contract Playground</h1>
            <p className={styles.subtitle}>Draft contracts, load Hardhat artifacts, and deploy to Sepolia testnet</p>
          </div>
        </div>

        <NetworkBanner />

        <div className={styles.grid}>
          {/* Left Side: Code Editor & Console */}
          <div className={styles.panel}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Load Standard Template</label>
              <select
                className={styles.formSelect}
                value={selectedTemplate}
                onChange={handleTemplateChange}
                disabled={isCompiling || isDeploying}
              >
                <option value="SimpleStorage">Simple Storage (Variables & Getters)</option>
                <option value="BasicToken">Basic Token (Custom ERC-20 Ledger)</option>
                <option value="MultiSigWallet">Multi-Signature Wallet Coordinator</option>
              </select>
            </div>


          <div className={styles.editorWrapper}>
            <div className={styles.editorHeader}>
              <span className={styles.editorTitle}>
                📄 {selectedTemplate}.sol
              </span>
              <span className={styles.editorLang}>Solidity v0.8.19</span>
            </div>
            <textarea
              className={styles.textarea}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={isCompiling}
              spellCheck="false"
            />
          </div>

          <div className={styles.actionBtnRow}>
            <button
              className={styles.compileBtn}
              onClick={compileContract}
              disabled={isCompiling}
            >
              {isCompiling ? '⚙️ Compiling...' : '🛠️ Compile Contract'}
            </button>
            <button
              className={styles.deployBtn}
              onClick={deployContractOnChain}
              disabled={!compiledInfo || isDeploying || !walletConnected}
            >
              {isDeploying ? '🚀 Deploying...' : walletConnected ? '⚡ Deploy to Sepolia' : 'Connect Wallet'}
            </button>
          </div>

          <div className={styles.console}>
            <div className={styles.consoleHeader}>
              <span>Solidity Terminal Console</span>
              <span>UTF-8</span>
            </div>
            {consoleLogs.map((log, idx) => (
              <div
                key={idx}
                className={`${styles.consoleLine} ${
                  log.type === 'success' ? styles.consoleSuccess :
                  log.type === 'error' ? styles.consoleError :
                  log.type === 'info' ? styles.consoleInfo : ''
                }`}
              >
                {log.text}
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Deployed Contracts Portal */}
        <div className={styles.panel} style={{ background: 'rgba(255, 255, 255, 0.015)' }}>
          <h2 className={styles.sectionTitle}>
            <span>🖥️</span> Deployed Contracts Console
          </h2>
          <p className={styles.subtitle} style={{ marginBottom: '10px' }}>
            Interact with live deployed ABI endpoints, trigger functions, and update state
          </p>

          <div className={styles.deployedSection}>
            {deployedContracts.length === 0 ? (
              <div className={styles.emptyState}>
                No active contracts deployed. Compile and deploy to Sepolia to interact on-chain.
              </div>
            ) : (
              <div className={styles.deployedList}>
                {deployedContracts.map(c => (
                  <div key={c.id} className={styles.contractCard}>
                    <div className={styles.contractCardHeader}>
                      <span className={styles.contractName}>{c.name}</span>
                      <span className={styles.contractAddress}>{c.address.slice(0, 10)}...{c.address.slice(-6)}</span>
                    </div>

                    <div className={styles.contractContent}>
                      {c.abi.map(method => (
                          <MethodRow
                            key={method.name}
                            contractId={c.id}
                            method={method}
                            lastResult={c.lastResult?.[method.name]}
                            onExecute={executeMethod}
                          />
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
  );
}

// Inner Component for Method Executions
function MethodRow({ contractId, method, lastResult, onExecute }) {
  const [inputs, setInputs] = useState({});

  const handleInputChange = (name, value) => {
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const runCall = () => {
    onExecute(contractId, method.name, inputs);
  };

  const isView = method.stateMutability === 'view';

  return (
    <div className={styles.methodRow}>
      <div className={styles.methodHeader}>
        <span className={styles.methodName}>{method.name}()</span>
        <span className={`${styles.methodBadge} ${isView ? styles.badgeRead : styles.badgeWrite}`}>
          {isView ? 'view' : 'transact'}
        </span>
      </div>

      {method.inputs.length > 0 && (
        <div className={styles.methodInputs}>
          {method.inputs.map(input => (
            <input
              key={input.name}
              type="text"
              className={styles.methodInput}
              placeholder={`${input.name} (${input.type})`}
              value={inputs[input.name] || ''}
              onChange={(e) => handleInputChange(input.name, e.target.value)}
            />
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
        <button className={styles.methodCallBtn} onClick={runCall}>
          {isView ? 'Read Call' : 'Write Call'}
        </button>
      </div>

      {lastResult !== undefined && (
        <div className={styles.methodResult}>
          Result: {lastResult}
        </div>
      )}
    </div>
  );
}

// ABI mappings for UI method rows
function getMockAbiForTemplate(template) {
  if (template === 'SimpleStorage') {
    return [
      { name: 'get', stateMutability: 'view', inputs: [] },
      { name: 'set', stateMutability: 'nonpayable', inputs: [{ name: 'x', type: 'uint256' }] }
    ];
  } else if (template === 'BasicToken') {
    return [
      { name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }] },
      { name: 'transfer', stateMutability: 'nonpayable', inputs: [
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' }
      ]}
    ];
  } else if (template === 'MultiSigWallet') {
    return [
      { name: 'getTransactionCount', stateMutability: 'view', inputs: [] },
      { name: 'submitTransaction', stateMutability: 'nonpayable', inputs: [
        { name: 'dest', type: 'address' },
        { name: 'val', type: 'uint256' }
      ]}
    ];
  }
  return [];
}
