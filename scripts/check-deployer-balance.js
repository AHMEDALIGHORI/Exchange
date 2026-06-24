import 'dotenv/config'
import { ethers } from 'ethers'

const rpc = process.env.SEPOLIA_RPC_URL
const pk = process.env.DEPLOYER_PRIVATE_KEY

if (!rpc) {
  console.error('Missing SEPOLIA_RPC_URL in .env')
  process.exit(1)
}

if (!pk || pk.length < 10) {
  console.error('Missing DEPLOYER_PRIVATE_KEY. Run: npm run setup:deployer')
  process.exit(1)
}

const provider = new ethers.JsonRpcProvider(rpc)
const wallet = new ethers.Wallet(pk, provider)
const balance = await provider.getBalance(wallet.address)
const eth = Number(ethers.formatEther(balance))

console.log('Deployer address:', wallet.address)
console.log('Sepolia balance:', eth, 'ETH')

if (eth < 0.002) {
  console.log('\nNot funded yet. Send Sepolia ETH to the address above.')
  console.log('Faucets (no mainnet ETH required on most):')
  console.log('- https://cloud.google.com/application/web3/faucet/ethereum/sepolia')
  console.log('- https://faucets.chain.link/sepolia')
  console.log('- https://sepolia-faucet.pk910.de/ (PoW mining faucet)')
  console.log('- https://faucet.quicknode.com/ethereum/sepolia')
  console.log('\nAlchemy faucet needs 0.001 ETH on Ethereum Mainnet in your MetaMask — skip it if you have no mainnet ETH.')
  console.log('Then run: npm run deploy:sepolia')
  process.exit(1)
}

console.log('\nReady to deploy. Run: npm run deploy:sepolia')
