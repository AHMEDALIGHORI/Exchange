import fs from 'fs'
import path from 'path'

const root = process.cwd()
const envPath = path.join(root, '.env')
const deploymentsPath = path.join(root, 'src', 'config', 'deployments.json')

const envKeys = {
  SimpleERC20: 'VITE_EXC_TOKEN_ADDRESS',
  WEXToken: 'VITE_WEX_TOKEN_ADDRESS',
  SimpleNFT: 'VITE_SIMPLE_NFT_ADDRESS',
  StakingPool: 'VITE_STAKING_POOL_ADDRESS',
  SimpleSwap: 'VITE_SIMPLE_SWAP_ADDRESS',
  BankPolicyRegistry: 'VITE_BANK_POLICY_REGISTRY_ADDRESS',
  BankDepositToken: 'VITE_BANK_DEPOSIT_TOKEN_ADDRESS',
}

function readEnv(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const parsed = {}
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)

  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!match || match[1].startsWith('#')) continue
    parsed[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
  }

  return parsed
}

function readDeployments(filePath) {
  if (!fs.existsSync(filePath)) return {}
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))?.contracts || {}
  } catch {
    return {}
  }
}

function isAddress(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(value || '')
}

const env = readEnv(envPath)
const deployments = readDeployments(deploymentsPath)

const rows = Object.entries(envKeys).map(([name, envKey]) => {
  const fromEnv = env[envKey]
  const fromDeployments = deployments[name]
  const value = fromEnv || fromDeployments
  const source = fromEnv ? '.env' : fromDeployments ? 'deployments.json' : 'missing'

  return {
    name,
    envKey,
    source,
    valid: isAddress(value),
  }
})

const missingContracts = rows.filter(row => !row.valid)
const missingDeployEnv = []

if (!env.SEPOLIA_RPC_URL) missingDeployEnv.push('SEPOLIA_RPC_URL')
if (!env.DEPLOYER_PRIVATE_KEY) missingDeployEnv.push('DEPLOYER_PRIVATE_KEY')

console.log('On-chain contract configuration')
for (const row of rows) {
  const status = row.valid ? `ok (${row.source})` : 'missing/invalid'
  console.log(`- ${row.name} via ${row.envKey}: ${status}`)
}

console.log('\nSepolia deployment credentials')
console.log(`- SEPOLIA_RPC_URL: ${env.SEPOLIA_RPC_URL ? 'set' : 'missing'}`)
console.log(`- DEPLOYER_PRIVATE_KEY: ${env.DEPLOYER_PRIVATE_KEY ? 'set' : 'missing'}`)

if (missingContracts.length === 0) {
  console.log('\nReady: frontend can resolve all deployed contract addresses.')
  process.exit(0)
}

console.log('\nNot ready: frontend is missing deployed contract addresses.')

if (missingDeployEnv.length > 0) {
  console.log(`Add ${missingDeployEnv.join(' and ')} to .env, fund the deployer with Sepolia ETH, then run:`)
  console.log('  npm run deploy:sepolia')
} else {
  console.log('Run:')
  console.log('  npm run deploy:sepolia')
  console.log('or set the VITE_* contract addresses in .env.')
}

process.exit(1)
