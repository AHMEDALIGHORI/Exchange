import { http, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

const rpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org'

export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors: [injected()],
  transports: {
    [sepolia.id]: http(rpcUrl),
  },
})

export { sepolia }
