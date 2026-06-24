import { useCallback, useEffect, useMemo, useState } from 'react'
import { formatUnits, isAddress } from 'viem'
import styles from './InstitutionalSettlement.module.css'
import DashboardLayout from '../components/DashboardLayout'
import NetworkBanner from '../components/NetworkBanner'
import { useWallet } from '../context/WalletContext'
import { abis, bytecodes } from '../config/abis'
import {
  getContractAddress,
  getExplorerAddressUrl,
  getExplorerTxUrl,
  hasInstitutionalContracts,
} from '../config/contracts'

const DATA_KEY = 'exchange_institutional_settlement_v1'
const CONTRACT_KEY = 'exchange_institutional_contracts_v1'
const DEFAULT_LIMIT = 50000

const sampleClients = [
  {
    id: 'northstar',
    name: 'Northstar Manufacturing LLC',
    type: 'Corporate treasury',
    address: '0x1111111111111111111111111111111111111111',
    status: 'approved',
    kyb: 'Approved',
    risk: 'Low',
    jurisdiction: 'US-DE',
    limit: 50000,
  },
  {
    id: 'harbor',
    name: 'Harbor Payroll Trust',
    type: 'Payroll settlement',
    address: '0x2222222222222222222222222222222222222222',
    status: 'approved',
    kyb: 'Approved',
    risk: 'Low',
    jurisdiction: 'US-NY',
    limit: 75000,
  },
  {
    id: 'bridge-operator',
    name: 'Blocked Bridge Operator',
    type: 'Counterparty',
    address: '0x3333333333333333333333333333333333333333',
    status: 'blocked',
    kyb: 'Rejected',
    risk: 'High',
    jurisdiction: 'Unknown',
    limit: 0,
  },
  {
    id: 'vendor-review',
    name: 'Vendor Awaiting KYB',
    type: 'Supplier',
    address: '0x4444444444444444444444444444444444444444',
    status: 'review',
    kyb: 'In review',
    risk: 'Medium',
    jurisdiction: 'GB',
    limit: 10000,
  },
]

const initialAlerts = [
  {
    id: 'ALT-001',
    severity: 'High',
    status: 'Open',
    title: 'Blocked wallet attempted settlement',
    detail: 'Bridge operator wallet is blocked pending sanctions and source-of-funds review.',
    time: '2026-06-23T09:12:00.000Z',
  },
  {
    id: 'ALT-002',
    severity: 'Medium',
    status: 'Monitoring',
    title: 'Transfer requested above treasury limit',
    detail: 'Corporate payment exceeds the default USD 50,000 sandbox settlement limit.',
    time: '2026-06-23T10:18:00.000Z',
  },
]

const initialApprovals = [
  {
    id: 'APR-001',
    requestor: 'Northstar Manufacturing LLC',
    senderAddress: sampleClients[0].address,
    recipient: 'Harbor Payroll Trust',
    recipientAddress: sampleClients[1].address,
    amount: 125000,
    reason: 'Invoice batch exceeds current daily settlement policy.',
    status: 'pending',
    submittedAt: '2026-06-23T10:18:00.000Z',
  },
]

const initialAudit = [
  {
    id: 'AUD-001',
    time: '2026-06-23T08:30:00.000Z',
    actor: 'Bank admin',
    action: 'Issued sandbox BDUSD float',
    detail: 'Minted initial demo tokenized deposits for treasury operations.',
    txHash: '',
  },
  {
    id: 'AUD-002',
    time: '2026-06-23T09:04:00.000Z',
    actor: 'Compliance officer',
    action: 'KYB approved',
    detail: 'Northstar Manufacturing LLC approved with USD 50,000 transfer limit.',
    txHash: '',
  },
  {
    id: 'AUD-003',
    time: '2026-06-23T09:12:00.000Z',
    actor: 'Compliance officer',
    action: 'Wallet blocked',
    detail: 'Blocked Bridge Operator cannot receive settlement tokens.',
    txHash: '',
  },
]

const roles = [
  {
    id: 'admin',
    label: 'Bank admin',
    summary: 'Issue and redeem tokenized deposits, pause the token, and deploy sandbox contracts.',
  },
  {
    id: 'compliance',
    label: 'Compliance officer',
    summary: 'Approve or block wallets, review exceptions, and export an audit package.',
  },
  {
    id: 'corporate',
    label: 'Corporate client',
    summary: 'Request controlled transfers and see whether policy allows settlement.',
  },
]

const scenarios = [
  {
    id: 'approved',
    title: 'Approved transfer',
    detail: 'Approved business to approved business under limit.',
  },
  {
    id: 'blocked',
    title: 'Blocked wallet fails',
    detail: 'Route settlement to a blocked counterparty and watch policy stop it.',
  },
  {
    id: 'over-limit',
    title: 'Over-limit review',
    detail: 'Submit a treasury payment that requires officer approval.',
  },
  {
    id: 'pause',
    title: 'Suspicious activity pause',
    detail: 'Switch to the admin desk and prepare a token pause event.',
  },
]

const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

function makeInitialData() {
  return {
    role: 'admin',
    clients: sampleClients,
    approvals: initialApprovals,
    alerts: initialAlerts,
    audit: initialAudit,
    tokenPaused: false,
  }
}

function loadJson(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const stored = window.localStorage.getItem(key)
    return stored ? { ...fallback, ...JSON.parse(stored) } : fallback
  } catch {
    return fallback
  }
}

function saveJson(key, value) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

function nowIso() {
  return new Date().toISOString()
}

function shortAddress(address) {
  if (!address) return 'Not set'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function normalizeError(err) {
  const message = err?.shortMessage || err?.cause?.shortMessage || err?.details || err?.message || 'Unknown error'
  if (message.includes('TRANSFER_LIMIT_EXCEEDED')) return 'TRANSFER_LIMIT_EXCEEDED'
  if (message.includes('RECIPIENT_BLOCKED')) return 'RECIPIENT_BLOCKED'
  if (message.includes('RECIPIENT_NOT_APPROVED')) return 'RECIPIENT_NOT_APPROVED'
  if (message.includes('SENDER_NOT_APPROVED')) return 'SENDER_NOT_APPROVED'
  if (message.includes('SENDER_BLOCKED')) return 'SENDER_BLOCKED'
  return message
}

function getClientStatusClass(status) {
  if (status === 'approved') return styles.statusApproved
  if (status === 'blocked') return styles.statusBlocked
  return styles.statusReview
}

function getRiskClass(risk) {
  if (risk === 'High') return styles.riskHigh
  if (risk === 'Medium') return styles.riskMedium
  return styles.riskLow
}

function getRoleLabel(role) {
  return roles.find(item => item.id === role)?.label || 'Sandbox operator'
}

export default function InstitutionalSettlement() {
  const {
    status,
    account,
    connect,
    deployContract,
    writeContract,
    readContract,
    parseTokenAmount,
  } = useWallet()
  const walletConnected = status === 'connected'
  const configuredRegistry = getContractAddress('BankPolicyRegistry')
  const configuredToken = getContractAddress('BankDepositToken')
  const configHasContracts = hasInstitutionalContracts()

  const [data, setData] = useState(() => loadJson(DATA_KEY, makeInitialData()))
  const [storedContracts, setStoredContracts] = useState(() => loadJson(CONTRACT_KEY, {}))
  const [busyAction, setBusyAction] = useState('')
  const [notice, setNotice] = useState({
    type: 'info',
    text: 'Sandbox initialized with sample KYB, approvals, alerts, and audit events.',
  })
  const [tokenBalance, setTokenBalance] = useState(null)
  const [policyProbe, setPolicyProbe] = useState(null)
  const [transferForm, setTransferForm] = useState({
    fromId: 'northstar',
    to: sampleClients[1].address,
    amount: '24000',
    memo: 'Invoice settlement INV-2026-042',
  })
  const [issueForm, setIssueForm] = useState({
    target: 'connected',
    amount: '100000',
    auditRef: 'BDUSD-SANDBOX-ISSUE',
  })

  const registryAddress = storedContracts.registry || configuredRegistry
  const tokenAddress = storedContracts.token || configuredToken
  const onChainReady = Boolean(registryAddress && tokenAddress)
  const contractSource = storedContracts.registry
    ? 'Browser deploy cache'
    : configHasContracts
      ? '.env or deployments.json'
      : 'Not configured'

  useEffect(() => {
    saveJson(DATA_KEY, data)
  }, [data])

  useEffect(() => {
    saveJson(CONTRACT_KEY, storedContracts)
  }, [storedContracts])

  const addAudit = useCallback((entry) => {
    setData(prev => ({
      ...prev,
      audit: [
        {
          id: `AUD-${Date.now()}`,
          time: nowIso(),
          actor: entry.actor || getRoleLabel(prev.role),
          action: entry.action,
          detail: entry.detail,
          txHash: entry.txHash || '',
        },
        ...prev.audit,
      ].slice(0, 60),
    }))
  }, [])

  const addAlert = useCallback((alert) => {
    setData(prev => ({
      ...prev,
      alerts: [
        {
          id: `ALT-${Date.now()}`,
          severity: alert.severity,
          status: alert.status || 'Open',
          title: alert.title,
          detail: alert.detail,
          time: nowIso(),
        },
        ...prev.alerts,
      ].slice(0, 20),
    }))
  }, [])

  const refreshTokenBalance = useCallback(async () => {
    if (!walletConnected || !account || !tokenAddress) {
      setTokenBalance(null)
      return
    }
    try {
      const balance = await readContract({
        address: tokenAddress,
        abi: abis.BankDepositToken,
        functionName: 'balanceOf',
        args: [account],
      })
      setTokenBalance(formatUnits(balance, 18))
    } catch {
      setTokenBalance(null)
    }
  }, [account, readContract, tokenAddress, walletConnected])

  useEffect(() => {
    refreshTokenBalance()
  }, [refreshTokenBalance, data.audit.length])

  const stats = useMemo(() => {
    const approved = data.clients.filter(client => client.status === 'approved').length
    const blocked = data.clients.filter(client => client.status === 'blocked').length
    const pending = data.approvals.filter(item => item.status === 'pending').length
    const limit = data.clients
      .filter(client => client.status === 'approved')
      .reduce((sum, client) => sum + Number(client.limit || 0), 0)

    return [
      { label: 'Approved wallets', value: approved, sub: `${blocked} blocked` },
      { label: 'Open approvals', value: pending, sub: 'Officer review queue' },
      { label: 'Policy capacity', value: moneyFormatter.format(limit), sub: 'Sandbox transfer limits' },
      { label: 'Audit events', value: data.audit.length, sub: 'Exportable JSON log' },
    ]
  }, [data])

  const selectedRole = roles.find(role => role.id === data.role) || roles[0]
  const canAdmin = data.role === 'admin'
  const canCompliance = data.role === 'compliance'
  const canCorporate = data.role === 'corporate'
  const connectedClient = data.clients.find(client => client.id === 'connected-wallet')
  const activeSender = data.clients.find(client => client.id === transferForm.fromId) || data.clients[0]

  const setRole = (role) => {
    setData(prev => ({ ...prev, role }))
    setNotice({ type: 'info', text: `${getRoleLabel(role)} workflow selected.` })
  }

  const loadScenario = (scenarioId) => {
    if (scenarioId === 'approved') {
      setData(prev => ({ ...prev, role: 'corporate', tokenPaused: false }))
      setTransferForm({
        fromId: 'northstar',
        to: sampleClients[1].address,
        amount: '24000',
        memo: 'Approved vendor invoice settlement',
      })
      setPolicyProbe(null)
      setNotice({ type: 'info', text: 'Scenario loaded: approved business settlement under policy limit.' })
      return
    }

    if (scenarioId === 'blocked') {
      setData(prev => ({ ...prev, role: 'corporate', tokenPaused: false }))
      setTransferForm({
        fromId: 'northstar',
        to: sampleClients[2].address,
        amount: '12000',
        memo: 'Blocked counterparty control test',
      })
      setPolicyProbe(null)
      setNotice({ type: 'info', text: 'Scenario loaded: transfer should fail because the recipient is blocked.' })
      return
    }

    if (scenarioId === 'over-limit') {
      setData(prev => ({ ...prev, role: 'corporate', tokenPaused: false }))
      setTransferForm({
        fromId: 'northstar',
        to: sampleClients[1].address,
        amount: '125000',
        memo: 'Treasury batch requiring officer approval',
      })
      setPolicyProbe(null)
      setNotice({ type: 'info', text: 'Scenario loaded: amount exceeds sender limit and should route to approval.' })
      return
    }

    setData(prev => ({ ...prev, role: 'admin' }))
    setNotice({ type: 'info', text: 'Scenario loaded: use the Bank Admin Token Desk to pause settlement during review.' })
  }

  const updateClientStatus = useCallback((clientId, changes) => {
    setData(prev => ({
      ...prev,
      clients: prev.clients.map(client => (
        client.id === clientId ? { ...client, ...changes } : client
      )),
    }))
  }, [])

  const handleDeployContracts = async () => {
    if (!walletConnected || !account) {
      setNotice({ type: 'error', text: 'Connect MetaMask on Sepolia before deploying sandbox contracts.' })
      return
    }

    setBusyAction('deploy')
    setNotice({ type: 'info', text: 'Deploying registry and tokenized deposit contracts to Sepolia...' })

    try {
      const registry = await deployContract({
        abi: abis.BankPolicyRegistry,
        bytecode: bytecodes.BankPolicyRegistry,
        args: [account, parseTokenAmount(String(DEFAULT_LIMIT), 18)],
      })
      const token = await deployContract({
        abi: abis.BankDepositToken,
        bytecode: bytecodes.BankDepositToken,
        args: ['Bank Demo USD', 'BDUSD', account, registry.address],
      })
      const issue = await writeContract({
        address: token.address,
        abi: abis.BankDepositToken,
        functionName: 'issue',
        args: [account, parseTokenAmount('1000000', 18), 'INITIAL_SANDBOX_FLOAT'],
      })

      setStoredContracts({
        registry: registry.address,
        token: token.address,
        deployedAt: nowIso(),
      })
      addAudit({
        actor: 'Bank admin',
        action: 'Sepolia contracts deployed',
        detail: `Registry ${registry.address}; BDUSD ${token.address}; initial float issued to connected wallet.`,
        txHash: issue.hash,
      })
      setNotice({ type: 'success', text: 'Institutional settlement contracts deployed and initial BDUSD issued.' })
    } catch (err) {
      setNotice({ type: 'error', text: `Deploy failed: ${normalizeError(err)}` })
    } finally {
      setBusyAction('')
      refreshTokenBalance()
    }
  }

  const handleApproveConnectedWallet = async () => {
    if (!account) {
      setNotice({ type: 'error', text: 'Connect a wallet to add it as the corporate treasury operator.' })
      return
    }

    setBusyAction('approve-connected')
    try {
      let txHash = ''
      if (onChainReady && walletConnected) {
        const approve = await writeContract({
          address: registryAddress,
          abi: abis.BankPolicyRegistry,
          functionName: 'setApproved',
          args: [account, true, 'KYB-CONNECTED-WALLET'],
        })
        txHash = approve.hash
        await writeContract({
          address: registryAddress,
          abi: abis.BankPolicyRegistry,
          functionName: 'setTransferLimit',
          args: [account, parseTokenAmount(String(DEFAULT_LIMIT), 18)],
        })
      }

      setData(prev => {
        const existing = prev.clients.some(client => client.id === 'connected-wallet')
        const connected = {
          id: 'connected-wallet',
          name: 'Connected Corporate Treasury',
          type: 'Wallet operator',
          address: account,
          status: 'approved',
          kyb: 'Approved',
          risk: 'Low',
          jurisdiction: 'Sepolia',
          limit: DEFAULT_LIMIT,
        }
        return {
          ...prev,
          clients: existing
            ? prev.clients.map(client => (client.id === 'connected-wallet' ? connected : client))
            : [connected, ...prev.clients],
        }
      })
      addAudit({
        action: 'Connected wallet approved',
        detail: `Approved ${shortAddress(account)} for controlled BDUSD settlement.`,
        txHash,
      })
      setNotice({ type: 'success', text: 'Connected wallet approved for the sandbox policy registry.' })
    } catch (err) {
      setNotice({ type: 'error', text: `Approval failed: ${normalizeError(err)}` })
    } finally {
      setBusyAction('')
    }
  }

  const handlePolicyChange = async (client, action) => {
    if (!canCompliance && !canAdmin) {
      setNotice({ type: 'error', text: 'Switch to Bank admin or Compliance officer before changing policy.' })
      return
    }

    const isBlock = action === 'block'
    const nextStatus = isBlock ? 'blocked' : 'approved'
    setBusyAction(`${action}-${client.id}`)

    try {
      let txHash = ''
      if (onChainReady && walletConnected) {
        const receipt = await writeContract({
          address: registryAddress,
          abi: abis.BankPolicyRegistry,
          functionName: isBlock ? 'setBlocked' : 'setApproved',
          args: isBlock
            ? [client.address, true, 'SANDBOX_COMPLIANCE_BLOCK']
            : [client.address, true, 'SANDBOX_KYB_APPROVED'],
        })
        txHash = receipt.hash
        if (!isBlock) {
          await writeContract({
            address: registryAddress,
            abi: abis.BankPolicyRegistry,
            functionName: 'setTransferLimit',
            args: [client.address, parseTokenAmount(String(client.limit || DEFAULT_LIMIT), 18)],
          })
        }
      }

      updateClientStatus(client.id, {
        status: nextStatus,
        kyb: isBlock ? 'Blocked' : 'Approved',
        risk: isBlock ? 'High' : client.risk === 'High' ? 'Medium' : client.risk,
      })
      addAudit({
        action: isBlock ? 'Wallet blocked' : 'KYB approved',
        detail: `${client.name} set to ${nextStatus}.`,
        txHash,
      })
      setNotice({ type: 'success', text: `${client.name} policy updated to ${nextStatus}.` })
    } catch (err) {
      setNotice({ type: 'error', text: `Policy update failed: ${normalizeError(err)}` })
    } finally {
      setBusyAction('')
    }
  }

  const handleTokenControl = async (action) => {
    if (!canAdmin) {
      setNotice({ type: 'error', text: 'Switch to Bank admin before operating token controls.' })
      return
    }

    setBusyAction(action)
    try {
      let txHash = ''
      if (onChainReady && walletConnected) {
        const target = action === 'pause' || action === 'unpause'
          ? null
          : issueForm.target === 'connected'
            ? account
            : issueForm.target
        const amount = parseTokenAmount(issueForm.amount || '0', 18)
        const receipt = action === 'pause' || action === 'unpause'
          ? await writeContract({
              address: tokenAddress,
              abi: abis.BankDepositToken,
              functionName: action,
            })
          : await writeContract({
              address: tokenAddress,
              abi: abis.BankDepositToken,
              functionName: action,
              args: [target, amount, issueForm.auditRef || `SANDBOX_${action.toUpperCase()}`],
            })
        txHash = receipt.hash
      }

      if (action === 'pause' || action === 'unpause') {
        setData(prev => ({ ...prev, tokenPaused: action === 'pause' }))
      }
      addAudit({
        actor: 'Bank admin',
        action: `Token ${action}`,
        detail: action === 'issue' || action === 'redeem'
          ? `${action} ${moneyFormatter.format(Number(issueForm.amount || 0))} BDUSD for ${shortAddress(issueForm.target === 'connected' ? account : issueForm.target)}.`
          : `BDUSD token ${action} command executed.`,
        txHash,
      })
      setNotice({ type: 'success', text: `Token ${action} workflow recorded${txHash ? ' on Sepolia' : ' locally'}.` })
      refreshTokenBalance()
    } catch (err) {
      setNotice({ type: 'error', text: `Token ${action} failed: ${normalizeError(err)}` })
    } finally {
      setBusyAction('')
    }
  }

  const validateLocalTransfer = (sender, to, amount) => {
    const recipient = data.clients.find(client => client.address.toLowerCase() === to.toLowerCase())
    if (data.tokenPaused) return 'TOKEN_PAUSED'
    if (!sender || sender.status !== 'approved') return 'SENDER_NOT_APPROVED'
    if (sender.status === 'blocked') return 'SENDER_BLOCKED'
    if (!recipient || recipient.status === 'review') return 'RECIPIENT_NOT_APPROVED'
    if (recipient.status === 'blocked') return 'RECIPIENT_BLOCKED'
    if (Number(amount) > Number(sender.limit || 0)) return 'TRANSFER_LIMIT_EXCEEDED'
    return 'APPROVED'
  }

  const createApprovalRequest = (sender, to, amount, reason) => {
    const recipient = data.clients.find(client => client.address.toLowerCase() === to.toLowerCase())
    const request = {
      id: `APR-${Date.now()}`,
      requestor: sender?.name || 'Connected wallet',
      senderAddress: sender?.address || account || '',
      recipient: recipient?.name || shortAddress(to),
      recipientAddress: to,
      amount: Number(amount),
      reason,
      status: 'pending',
      submittedAt: nowIso(),
    }
    setData(prev => ({
      ...prev,
      approvals: [request, ...prev.approvals],
    }))
    addAlert({
      severity: 'Medium',
      title: 'Transfer routed for officer approval',
      detail: `${request.requestor} requested ${moneyFormatter.format(Number(amount))} to ${request.recipient}.`,
    })
    addAudit({
      action: 'Transfer approval requested',
      detail: `${moneyFormatter.format(Number(amount))} requires compliance approval: ${reason}.`,
    })
  }

  const handleTransfer = async (event) => {
    event.preventDefault()
    const amount = Number(transferForm.amount)
    const to = transferForm.to.trim()

    if (!isAddress(to)) {
      setNotice({ type: 'error', text: 'Enter a valid recipient wallet address.' })
      return
    }
    if (!amount || amount <= 0) {
      setNotice({ type: 'error', text: 'Enter a positive settlement amount.' })
      return
    }
    if (!canCorporate && !canAdmin) {
      setNotice({ type: 'error', text: 'Switch to Corporate client or Bank admin to request a transfer.' })
      return
    }

    const localPolicy = validateLocalTransfer(activeSender, to, amount)
    if (localPolicy === 'TRANSFER_LIMIT_EXCEEDED') {
      createApprovalRequest(activeSender, to, amount, 'Transfer exceeds current sender limit.')
      setNotice({ type: 'info', text: 'Transfer exceeds policy limit and was added to the approval queue.' })
      return
    }
    if (localPolicy !== 'APPROVED') {
      addAlert({
        severity: localPolicy.includes('BLOCKED') ? 'High' : 'Medium',
        title: 'Transfer blocked by compliance policy',
        detail: `${moneyFormatter.format(amount)} to ${shortAddress(to)} failed with ${localPolicy}.`,
      })
      setNotice({ type: 'error', text: `Transfer blocked: ${localPolicy}` })
      return
    }

    setBusyAction('transfer')
    try {
      let txHash = ''
      if (onChainReady && walletConnected) {
        const result = await writeContract({
          address: tokenAddress,
          abi: abis.BankDepositToken,
          functionName: 'transfer',
          args: [to, parseTokenAmount(transferForm.amount, 18)],
        })
        txHash = result.hash
      }

      addAudit({
        action: 'Controlled transfer settled',
        detail: `${moneyFormatter.format(amount)} BDUSD to ${shortAddress(to)} for ${transferForm.memo || 'Sandbox settlement'}.`,
        txHash,
      })
      setNotice({ type: 'success', text: `Controlled settlement ${txHash ? 'confirmed on Sepolia' : 'simulated locally'}.` })
      refreshTokenBalance()
    } catch (err) {
      const reason = normalizeError(err)
      if (reason === 'TRANSFER_LIMIT_EXCEEDED') {
        createApprovalRequest(activeSender, to, amount, 'Smart contract transfer limit exceeded.')
      }
      addAlert({
        severity: reason.includes('BLOCKED') ? 'High' : 'Medium',
        title: 'On-chain settlement rejected',
        detail: `Smart contract rejected ${moneyFormatter.format(amount)} to ${shortAddress(to)}: ${reason}.`,
      })
      setNotice({ type: 'error', text: `On-chain transfer failed: ${reason}` })
    } finally {
      setBusyAction('')
    }
  }

  const handlePolicyProbe = async () => {
    const to = transferForm.to.trim()
    const amount = Number(transferForm.amount)
    if (!isAddress(to) || !amount) {
      setPolicyProbe({ allowed: false, reason: 'Enter a valid address and amount first.' })
      return
    }

    const localResult = validateLocalTransfer(activeSender, to, amount)
    if (!onChainReady || !walletConnected || !account) {
      setPolicyProbe({
        allowed: localResult === 'APPROVED',
        reason: `Local sandbox policy: ${localResult}`,
      })
      return
    }

    try {
      const result = await readContract({
        address: registryAddress,
        abi: abis.BankPolicyRegistry,
        functionName: 'canTransfer',
        args: [account, to, parseTokenAmount(transferForm.amount, 18)],
      })
      setPolicyProbe({ allowed: result[0], reason: `Smart contract policy: ${result[1]}` })
    } catch (err) {
      setPolicyProbe({ allowed: false, reason: normalizeError(err) })
    }
  }

  const handleApprovalDecision = async (approval, decision) => {
    if (!canCompliance && !canAdmin) {
      setNotice({ type: 'error', text: 'Switch to Compliance officer or Bank admin before approving requests.' })
      return
    }

    setBusyAction(`${decision}-${approval.id}`)
    try {
      let txHash = ''
      if (decision === 'approved' && onChainReady && walletConnected && isAddress(approval.senderAddress)) {
        const receipt = await writeContract({
          address: registryAddress,
          abi: abis.BankPolicyRegistry,
          functionName: 'setTransferLimit',
          args: [approval.senderAddress, parseTokenAmount(String(approval.amount), 18)],
        })
        txHash = receipt.hash
      }

      setData(prev => ({
        ...prev,
        approvals: prev.approvals.map(item => (
          item.id === approval.id ? { ...item, status: decision, decidedAt: nowIso() } : item
        )),
      }))
      addAudit({
        action: `Approval ${decision}`,
        detail: `${approval.id} for ${moneyFormatter.format(approval.amount)} ${decision}.`,
        txHash,
      })
      setNotice({ type: 'success', text: `${approval.id} marked ${decision}.` })
    } catch (err) {
      setNotice({ type: 'error', text: `Approval action failed: ${normalizeError(err)}` })
    } finally {
      setBusyAction('')
    }
  }

  const exportAudit = () => {
    const payload = {
      generatedAt: nowIso(),
      environment: 'Sepolia testnet sandbox',
      disclosure: 'Demo only. No real customer funds and no real regulated banking activity.',
      contracts: {
        registry: registryAddress,
        token: tokenAddress,
        source: contractSource,
      },
      clients: data.clients,
      approvals: data.approvals,
      alerts: data.alerts,
      audit: data.audit,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `exchange-settlement-audit-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    addAudit({
      action: 'Audit export generated',
      detail: 'Compliance report exported as JSON.',
    })
  }

  const resetSandbox = () => {
    setData(makeInitialData())
    setPolicyProbe(null)
    setNotice({ type: 'info', text: 'Sandbox demo state reset to the default bank settlement scenario.' })
  }

  return (
    <DashboardLayout activeOverride="institutional" showFooter={false}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <div className={styles.badgeRow}>
              <span className={styles.badge}>Sandbox</span>
              <span className={styles.badge}>Sepolia testnet</span>
              <span className={styles.badgeWarning}>Not real banking activity</span>
            </div>
            <h1 className={styles.title}>Institutional Settlement</h1>
            <p className={styles.subtitle}>
              A bank-grade pilot for tokenized deposit issuance, wallet controls, approval workflows, and audit evidence.
            </p>
          </div>
          <button className={styles.secondaryButton} type="button" onClick={resetSandbox}>
            Reset sandbox
          </button>
        </div>

        <NetworkBanner />

        <section className={styles.disclosurePanel}>
          <div>
            <span className={styles.kicker}>Compliance settlement ledger pilot</span>
            <p>
              This module demonstrates permissioned BDUSD token settlement on Sepolia. Compliance checks are simulated
              in local demo data and enforced by the BankPolicyRegistry and BankDepositToken contracts when connected.
            </p>
          </div>
          <div className={styles.contractStatus}>
            <span className={onChainReady ? styles.statusOnline : styles.statusOffline}>
              {onChainReady ? 'Contracts ready' : 'Local-only mode'}
            </span>
            <span>Source: {contractSource}</span>
          </div>
        </section>

        {notice.text && (
          <div className={`${styles.notice} ${styles[`notice${notice.type}`]}`}>
            {notice.text}
          </div>
        )}

        <section className={styles.statsGrid}>
          {stats.map(item => (
            <div className={styles.statCard} key={item.label}>
              <span className={styles.statLabel}>{item.label}</span>
              <strong>{item.value}</strong>
              <span>{item.sub}</span>
            </div>
          ))}
        </section>

        <section className={styles.rolePanel}>
          <div>
            <span className={styles.kicker}>Role workflow</span>
            <h2>{selectedRole.label}</h2>
            <p>{selectedRole.summary}</p>
          </div>
          <div className={styles.roleSwitch}>
            {roles.map(role => (
              <button
                key={role.id}
                type="button"
                className={`${styles.roleButton} ${data.role === role.id ? styles.roleButtonActive : ''}`}
                onClick={() => setRole(role.id)}
              >
                {role.label}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.scenarioPanel}>
          <div>
            <span className={styles.kicker}>Pilot runbook</span>
            <h2>Sample settlement scenarios</h2>
            <p>Load the bank/finance demo paths the page is designed to prove.</p>
          </div>
          <div className={styles.scenarioGrid}>
            {scenarios.map(scenario => (
              <button
                key={scenario.id}
                type="button"
                className={styles.scenarioButton}
                onClick={() => loadScenario(scenario.id)}
              >
                <strong>{scenario.title}</strong>
                <span>{scenario.detail}</span>
              </button>
            ))}
          </div>
        </section>

        <div className={styles.mainGrid}>
          <div className={styles.leftColumn}>
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2>KYC/KYB Status Dashboard</h2>
                  <p>Wallets must be approved and unblocked before settlement can move.</p>
                </div>
              </div>

              <div className={styles.tableWrapper}>
                <div className={styles.clientHead}>
                  <span>Entity</span>
                  <span>Status</span>
                  <span>Limit</span>
                  <span>Risk</span>
                  <span>Action</span>
                </div>
                {data.clients.map(client => (
                  <div className={styles.clientRow} key={client.id}>
                    <div>
                      <strong>{client.name}</strong>
                      <span>{client.type} - {shortAddress(client.address)} - {client.jurisdiction}</span>
                    </div>
                    <span className={`${styles.statusPill} ${getClientStatusClass(client.status)}`}>
                      {client.kyb}
                    </span>
                    <span>{moneyFormatter.format(client.limit)}</span>
                    <span className={`${styles.riskPill} ${getRiskClass(client.risk)}`}>{client.risk}</span>
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        className={styles.tinyButton}
                        onClick={() => handlePolicyChange(client, 'approve')}
                        disabled={busyAction === `approve-${client.id}` || (!canCompliance && !canAdmin)}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className={styles.tinyDanger}
                        onClick={() => handlePolicyChange(client, 'block')}
                        disabled={busyAction === `block-${client.id}` || (!canCompliance && !canAdmin)}
                      >
                        Block
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2>Controlled Transfer</h2>
                  <p>Approved business sends tokenized USD to an approved counterparty, or routes exceptions for review.</p>
                </div>
              </div>

              <form className={styles.formGrid} onSubmit={handleTransfer}>
                <label>
                  Sender profile
                  <select
                    value={transferForm.fromId}
                    onChange={event => setTransferForm(prev => ({ ...prev, fromId: event.target.value }))}
                  >
                    {data.clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Recipient address
                  <input
                    value={transferForm.to}
                    onChange={event => setTransferForm(prev => ({ ...prev, to: event.target.value }))}
                    placeholder="0x..."
                  />
                </label>
                <label>
                  Amount BDUSD
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={transferForm.amount}
                    onChange={event => setTransferForm(prev => ({ ...prev, amount: event.target.value }))}
                  />
                </label>
                <label>
                  Settlement memo
                  <input
                    value={transferForm.memo}
                    onChange={event => setTransferForm(prev => ({ ...prev, memo: event.target.value }))}
                  />
                </label>
                <div className={styles.formActions}>
                  <button
                    className={styles.primaryButton}
                    type="submit"
                    disabled={busyAction === 'transfer' || (!canCorporate && !canAdmin)}
                  >
                    {busyAction === 'transfer' ? 'Submitting...' : 'Submit transfer'}
                  </button>
                  <button className={styles.secondaryButton} type="button" onClick={handlePolicyProbe}>
                    Check policy
                  </button>
                </div>
              </form>

              <div className={styles.policyStrip}>
                <div>
                  <span>Sender limit</span>
                  <strong>{moneyFormatter.format(activeSender?.limit || 0)}</strong>
                </div>
                <div>
                  <span>Connected BDUSD</span>
                  <strong>{tokenBalance ? Number(tokenBalance).toLocaleString(undefined, { maximumFractionDigits: 2 }) : 'Not loaded'}</strong>
                </div>
                <div>
                  <span>Probe result</span>
                  <strong className={policyProbe?.allowed ? styles.goodText : styles.warnText}>
                    {policyProbe ? policyProbe.reason : 'Not checked'}
                  </strong>
                </div>
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2>Approval Queue</h2>
                  <p>Over-limit transfers require officer approval before policy limits are raised.</p>
                </div>
              </div>
              <div className={styles.approvalList}>
                {data.approvals.map(approval => (
                  <div className={styles.approvalItem} key={approval.id}>
                    <div>
                      <strong>{approval.id} - {moneyFormatter.format(approval.amount)}</strong>
                      <span>{approval.requestor} to {approval.recipient}</span>
                      <p>{approval.reason}</p>
                    </div>
                    <span className={`${styles.statusPill} ${approval.status === 'approved' ? styles.statusApproved : approval.status === 'rejected' ? styles.statusBlocked : styles.statusReview}`}>
                      {approval.status}
                    </span>
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        className={styles.tinyButton}
                        onClick={() => handleApprovalDecision(approval, 'approved')}
                        disabled={approval.status !== 'pending' || busyAction === `approved-${approval.id}` || (!canCompliance && !canAdmin)}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className={styles.tinyDanger}
                        onClick={() => handleApprovalDecision(approval, 'rejected')}
                        disabled={approval.status !== 'pending' || busyAction === `rejected-${approval.id}` || (!canCompliance && !canAdmin)}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className={styles.rightColumn}>
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2>Sepolia Contract Controls</h2>
                  <p>Deploy or connect the bank pilot contracts. Persist addresses in .env for reload-safe config.</p>
                </div>
              </div>
              <div className={styles.addressBox}>
                <span>Registry</span>
                {registryAddress ? (
                  <a href={getExplorerAddressUrl(registryAddress)} target="_blank" rel="noreferrer">
                    {shortAddress(registryAddress)}
                  </a>
                ) : (
                  <strong>Missing</strong>
                )}
                <span>Token</span>
                {tokenAddress ? (
                  <a href={getExplorerAddressUrl(tokenAddress)} target="_blank" rel="noreferrer">
                    {shortAddress(tokenAddress)}
                  </a>
                ) : (
                  <strong>Missing</strong>
                )}
              </div>
              <div className={styles.buttonStack}>
                <button
                  className={styles.primaryButton}
                  type="button"
                  onClick={handleDeployContracts}
                  disabled={busyAction === 'deploy' || !canAdmin || !walletConnected}
                >
                  {busyAction === 'deploy' ? 'Deploying...' : 'Deploy sandbox contracts'}
                </button>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  onClick={walletConnected ? handleApproveConnectedWallet : connect}
                  disabled={busyAction === 'approve-connected' || (!canAdmin && !canCompliance)}
                >
                  {walletConnected ? 'Approve connected wallet' : 'Connect wallet'}
                </button>
              </div>
              {connectedClient && (
                <p className={styles.helperText}>
                  Connected operator: {shortAddress(connectedClient.address)} with {moneyFormatter.format(connectedClient.limit)} limit.
                </p>
              )}
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2>Bank Admin Token Desk</h2>
                  <p>Issue, redeem, pause, or resume the demo tokenized deposit.</p>
                </div>
              </div>
              <div className={styles.formStack}>
                <label>
                  Target wallet
                  <select
                    value={issueForm.target}
                    onChange={event => setIssueForm(prev => ({ ...prev, target: event.target.value }))}
                  >
                    <option value="connected">Connected wallet</option>
                    {data.clients.map(client => (
                      <option key={client.id} value={client.address}>{client.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Amount BDUSD
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={issueForm.amount}
                    onChange={event => setIssueForm(prev => ({ ...prev, amount: event.target.value }))}
                  />
                </label>
                <label>
                  Audit reference
                  <input
                    value={issueForm.auditRef}
                    onChange={event => setIssueForm(prev => ({ ...prev, auditRef: event.target.value }))}
                  />
                </label>
              </div>
              <div className={styles.buttonGrid}>
                <button className={styles.tinyButton} type="button" onClick={() => handleTokenControl('issue')} disabled={!canAdmin || busyAction === 'issue'}>
                  Issue
                </button>
                <button className={styles.tinyButton} type="button" onClick={() => handleTokenControl('redeem')} disabled={!canAdmin || busyAction === 'redeem'}>
                  Redeem
                </button>
                <button className={styles.tinyDanger} type="button" onClick={() => handleTokenControl('pause')} disabled={!canAdmin || busyAction === 'pause'}>
                  Pause
                </button>
                <button className={styles.tinyButton} type="button" onClick={() => handleTokenControl('unpause')} disabled={!canAdmin || busyAction === 'unpause'}>
                  Unpause
                </button>
              </div>
              <p className={styles.helperText}>
                Token state: {data.tokenPaused ? 'Paused for suspicious activity' : 'Active sandbox settlement'}
              </p>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2>Compliance Alerts</h2>
                  <p>Exceptions generated by blocked, review, and over-limit scenarios.</p>
                </div>
              </div>
              <div className={styles.alertList}>
                {data.alerts.map(alert => (
                  <div className={styles.alertItem} key={alert.id}>
                    <span className={alert.severity === 'High' ? styles.alertHigh : styles.alertMedium}>
                      {alert.severity}
                    </span>
                    <strong>{alert.title}</strong>
                    <p>{alert.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2>Settlement Audit Report</h2>
                  <p>Export who approved what, when, and which transaction hash confirmed it.</p>
                </div>
                <button className={styles.secondaryButton} type="button" onClick={exportAudit} disabled={!canCompliance && !canAdmin}>
                  Export
                </button>
              </div>
              <div className={styles.auditList}>
                {data.audit.slice(0, 8).map(entry => (
                  <div className={styles.auditItem} key={entry.id}>
                    <span>{new Date(entry.time).toLocaleString()}</span>
                    <strong>{entry.action}</strong>
                    <p>{entry.actor}: {entry.detail}</p>
                    {entry.txHash && (
                      <a href={getExplorerTxUrl(entry.txHash)} target="_blank" rel="noreferrer">
                        {shortAddress(entry.txHash)}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  )
}
