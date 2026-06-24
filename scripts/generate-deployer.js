import fs from 'fs'
import path from 'path'
import { Wallet } from 'ethers'

const root = process.cwd()
const envPath = path.join(root, '.env')

function readEnv(filePath) {
  if (!fs.existsSync(filePath)) return { text: '', map: {} }
  const text = fs.readFileSync(filePath, 'utf8')
  const map = {}
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (match) map[match[1]] = match[2]
  }
  return { text, map }
}

function upsertEnvKey(text, key, value) {
  const line = `${key}=${value}`
  const pattern = new RegExp(`^${key}=.*$`, 'm')
  if (pattern.test(text)) return text.replace(pattern, line)
  return `${text.trimEnd()}\n${line}\n`
}

const { text, map } = readEnv(envPath)

if (map.DEPLOYER_PRIVATE_KEY && map.DEPLOYER_PRIVATE_KEY.length > 10) {
  const wallet = new Wallet(map.DEPLOYER_PRIVATE_KEY)
  console.log('DEPLOYER_PRIVATE_KEY already set')
  console.log('Deployer address:', wallet.address)
  console.log('Fund this address with Sepolia ETH, then run: npm run deploy:sepolia')
  process.exit(0)
}

const wallet = Wallet.createRandom()
let next = upsertEnvKey(text, 'DEPLOYER_PRIVATE_KEY', wallet.privateKey)
if (!map.SEPOLIA_RPC_URL) {
  console.error('Missing SEPOLIA_RPC_URL in .env. Add your Alchemy Sepolia URL first.')
  process.exit(1)
}

fs.writeFileSync(envPath, next)
console.log('Created new Sepolia deployer wallet and saved DEPLOYER_PRIVATE_KEY to .env')
console.log('Deployer address:', wallet.address)
console.log('')
console.log('Next steps:')
console.log('1. Fund this address with Sepolia ETH (pick a faucet without mainnet balance rules):')
console.log('   https://cloud.google.com/application/web3/faucet/ethereum/sepolia')
console.log('   https://faucets.chain.link/sepolia')
console.log('   https://sepolia-faucet.pk910.de/')
console.log('2. Run: npm run deploy:sepolia')
console.log('3. Run: npm run sync:deploy-env')
console.log('4. Run: npm run check:onchain')
