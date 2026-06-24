import fs from 'fs'
import path from 'path'

const root = process.cwd()
const envPath = path.join(root, '.env')
const deploymentsPath = path.join(root, 'src', 'config', 'deployments.json')

const ENV_MAP = {
  SimpleERC20: 'VITE_EXC_TOKEN_ADDRESS',
  WEXToken: 'VITE_WEX_TOKEN_ADDRESS',
  SimpleNFT: 'VITE_SIMPLE_NFT_ADDRESS',
  StakingPool: 'VITE_STAKING_POOL_ADDRESS',
  SimpleSwap: 'VITE_SIMPLE_SWAP_ADDRESS',
  BankPolicyRegistry: 'VITE_BANK_POLICY_REGISTRY_ADDRESS',
  BankDepositToken: 'VITE_BANK_DEPOSIT_TOKEN_ADDRESS',
}

if (!fs.existsSync(deploymentsPath)) {
  console.error('Missing src/config/deployments.json. Run npm run deploy:sepolia first.')
  process.exit(1)
}

const deployments = JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'))
let envText = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''

for (const [contract, envKey] of Object.entries(ENV_MAP)) {
  const address = deployments?.contracts?.[contract]
  if (!address) continue
  const line = `${envKey}=${address}`
  const pattern = new RegExp(`^${envKey}=.*$`, 'm')
  envText = pattern.test(envText) ? envText.replace(pattern, line) : `${envText.trimEnd()}\n${line}\n`
  console.log(`Synced ${envKey}`)
}

fs.writeFileSync(envPath, envText.endsWith('\n') ? envText : `${envText}\n`)
console.log('Updated .env from deployments.json')
