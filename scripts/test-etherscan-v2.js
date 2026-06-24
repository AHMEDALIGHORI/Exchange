import 'dotenv/config'

const ETHERSCAN_V2_BASE = 'https://api.etherscan.io/v2/api'
const SEPOLIA_CHAIN_ID = 11155111
const apiKey = process.env.VITE_ETHERSCAN_API_KEY

if (!apiKey) {
  console.error('FAIL: VITE_ETHERSCAN_API_KEY not set in .env')
  process.exit(1)
}

function buildEtherscanUrl(chainId, params) {
  const search = new URLSearchParams({
    chainid: String(chainId),
    ...params,
    apikey: apiKey,
  })
  return `${ETHERSCAN_V2_BASE}?${search.toString()}`
}

async function testEndpoint(name, url) {
  const res = await fetch(url)
  const data = await res.json()
  const ok = data.status === '1' || (data.result && typeof data.result === 'object')
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: status=${data.status} message=${data.message || 'ok'}`)
  if (!ok) {
    console.error(JSON.stringify(data, null, 2))
    return false
  }
  return data
}

const vitalik = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'

const ethpriceUrl = buildEtherscanUrl(SEPOLIA_CHAIN_ID, { module: 'stats', action: 'ethprice' })
const txlistUrl = buildEtherscanUrl(SEPOLIA_CHAIN_ID, {
  module: 'account',
  action: 'txlist',
  address: vitalik,
  startblock: '0',
  endblock: '99999999',
  page: '1',
  offset: '5',
  sort: 'desc',
})

const priceData = await testEndpoint('ethprice (Sepolia chainid=11155111)', ethpriceUrl)
const txData = await testEndpoint('txlist (Sepolia chainid=11155111)', txlistUrl)

if (priceData?.result?.ethusd) {
  console.log(`  ethprice: $${priceData.result.ethusd}`)
}
if (Array.isArray(txData?.result)) {
  console.log(`  txlist: ${txData.result.length} transactions returned`)
}

const allOk = priceData && txData
process.exit(allOk ? 0 : 1)
