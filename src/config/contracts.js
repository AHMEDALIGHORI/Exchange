import deploymentsFile from './deployments.json'

const ENV_KEYS = {
  SimpleERC20: 'VITE_EXC_TOKEN_ADDRESS',
  WEXToken: 'VITE_WEX_TOKEN_ADDRESS',
  SimpleNFT: 'VITE_SIMPLE_NFT_ADDRESS',
  StakingPool: 'VITE_STAKING_POOL_ADDRESS',
  SimpleSwap: 'VITE_SIMPLE_SWAP_ADDRESS',
  BankPolicyRegistry: 'VITE_BANK_POLICY_REGISTRY_ADDRESS',
  BankDepositToken: 'VITE_BANK_DEPOSIT_TOKEN_ADDRESS',
}

export const SEPOLIA_CHAIN_ID = 11155111
export const EXPLORER_BASE = 'https://sepolia.etherscan.io'

export function getContractAddress(name) {
  const envKey = ENV_KEYS[name]
  const fromEnv = envKey ? import.meta.env[envKey] : undefined
  if (fromEnv && /^0x[a-fA-F0-9]{40}$/.test(fromEnv)) return fromEnv
  const fromFile = deploymentsFile?.contracts?.[name]
  if (fromFile && /^0x[a-fA-F0-9]{40}$/.test(fromFile)) return fromFile
  return ''
}

export function getExplorerAddressUrl(address) {
  if (!address) return EXPLORER_BASE
  return `${EXPLORER_BASE}/address/${address}`
}

export function getExplorerTxUrl(hash) {
  if (!hash) return EXPLORER_BASE
  return `${EXPLORER_BASE}/tx/${hash}`
}

export function hasDeployedContracts() {
  return Boolean(
    getContractAddress('SimpleERC20') &&
    getContractAddress('SimpleNFT') &&
    getContractAddress('SimpleSwap')
  )
}

export function hasInstitutionalContracts() {
  return Boolean(
    getContractAddress('BankPolicyRegistry') &&
    getContractAddress('BankDepositToken')
  )
}
