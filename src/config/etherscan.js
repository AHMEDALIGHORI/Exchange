import { sepolia } from './wagmi'

const ETHERSCAN_API_KEY = import.meta.env.VITE_ETHERSCAN_API_KEY || ''
const ETHERSCAN_V2_BASE = 'https://api.etherscan.io/v2/api'

/** Default chain for Etherscan V2 requests (Sepolia testnet). */
export const DEFAULT_ETHERSCAN_CHAIN_ID = sepolia.id

export function getEtherscanApiKey() {
  return ETHERSCAN_API_KEY
}

export function buildEtherscanUrl(chainId, params) {
  const apiKey = getEtherscanApiKey()
  const search = new URLSearchParams({
    chainid: String(chainId),
    ...params,
    apikey: apiKey,
  })
  return `${ETHERSCAN_V2_BASE}?${search.toString()}`
}
