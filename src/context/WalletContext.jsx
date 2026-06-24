import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  WagmiProvider,
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
  useChainId,
  useSwitchChain,
  usePublicClient,
  useWalletClient,
} from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { formatEther, parseUnits } from 'viem'
import { wagmiConfig, sepolia } from '../config/wagmi'
import { buildEtherscanUrl } from '../config/etherscan'
import { SEPOLIA_CHAIN_ID } from '../config/contracts'
import { fetchEthUsdPrice } from '../utils/marketPrices'

const WalletContext = createContext(null)
const queryClient = new QueryClient()

const NETWORK_NAMES = {
  [sepolia.id]: 'Sepolia Testnet',
  1: 'Ethereum Mainnet',
  5: 'Goerli Testnet',
  137: 'Polygon',
  56: 'BNB Smart Chain',
  10: 'Optimism',
  42161: 'Arbitrum One',
}

export function WalletProvider({ children }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <WalletContextInner>{children}</WalletContextInner>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

function WalletContextInner({ children }) {
  const { address, status: accountStatus, isConnected } = useAccount()
  const { connectAsync, connectors, isPending: isConnecting } = useConnect()
  const { disconnectAsync } = useDisconnect()
  const chainId = useChainId()
  const { switchChainAsync } = useSwitchChain()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const { data: balanceData, refetch: refetchBalance } = useBalance({ address })

  const [error, setError] = useState(null)
  const [txHistory, setTxHistory] = useState([])
  const [txLoading, setTxLoading] = useState(false)
  const [ethPrice, setEthPrice] = useState(null)
  const [tokenList, setTokenList] = useState([])

  const isMetaMask = typeof window !== 'undefined' && Boolean(window.ethereum?.isMetaMask)
  const account = address || null
  const balance = balanceData ? balanceData.value.toString() : null
  const network = NETWORK_NAMES[chainId] || (chainId ? `Chain ${chainId}` : null)
  const isCorrectNetwork = chainId === SEPOLIA_CHAIN_ID

  const status = isConnecting
    ? 'connecting'
    : isConnected
      ? 'connected'
      : accountStatus === 'reconnecting'
        ? 'connecting'
        : error
          ? 'error'
          : 'idle'

  const fetchEthPrice = useCallback(async () => {
    try {
      const res = await fetch(
        buildEtherscanUrl(sepolia.id, { module: 'stats', action: 'ethprice' })
      )
      const data = await res.json()
      if (data.status === '1') {
        setEthPrice(parseFloat(data.result.ethusd))
        return
      }
    } catch { /* fall through */ }
    try {
      const price = await fetchEthUsdPrice()
      if (price) setEthPrice(price)
    } catch { /* silent */ }
  }, [])

  const fetchTxHistory = useCallback(async (addr) => {
    if (!addr) return
    setTxLoading(true)
    try {
      const res = await fetch(
        buildEtherscanUrl(chainId || sepolia.id, {
          module: 'account',
          action: 'txlist',
          address: addr,
          startblock: '0',
          endblock: '99999999',
          page: '1',
          offset: '20',
          sort: 'desc',
        })
      )
      const data = await res.json()
      if (data.status === '1') setTxHistory(data.result || [])
      else setTxHistory([])
    } catch {
      setTxHistory([])
    } finally {
      setTxLoading(false)
    }
  }, [chainId])

  const fetchTokens = useCallback(async (addr) => {
    if (!addr) return
    try {
      const res = await fetch(
        buildEtherscanUrl(chainId || sepolia.id, {
          module: 'account',
          action: 'tokentx',
          address: addr,
          page: '1',
          offset: '50',
          sort: 'desc',
        })
      )
      const data = await res.json()
      if (data.status === '1') {
        const seen = {}
        const tokens = []
        for (const tx of data.result || []) {
          if (!seen[tx.contractAddress]) {
            seen[tx.contractAddress] = true
            tokens.push({
              symbol: tx.tokenSymbol,
              name: tx.tokenName,
              decimals: tx.tokenDecimal,
              contract: tx.contractAddress,
            })
          }
        }
        setTokenList(tokens.slice(0, 8))
      }
    } catch { /* silent */ }
  }, [chainId])

  const refreshWallet = useCallback(async () => {
    if (!address) return
    await Promise.all([
      refetchBalance(),
      fetchTxHistory(address),
      fetchTokens(address),
      fetchEthPrice(),
    ])
  }, [address, refetchBalance, fetchTxHistory, fetchTokens, fetchEthPrice])

  const connect = useCallback(async () => {
    const injected = connectors.find((c) => c.id === 'injected')
    if (!injected) {
      setError('MetaMask not detected. Please install the MetaMask browser extension.')
      return
    }
    setError(null)
    try {
      await connectAsync({ connector: injected, chainId: sepolia.id })
    } catch (err) {
      setError(err.code === 4001 || err.name === 'UserRejectedRequestError'
        ? 'Connection rejected by user.'
        : err.shortMessage || err.message)
    }
  }, [connectAsync, connectors])

  const disconnect = useCallback(async () => {
    await disconnectAsync()
    setTxHistory([])
    setTokenList([])
    setError(null)
  }, [disconnectAsync])

  const switchToSepolia = useCallback(async () => {
    try {
      await switchChainAsync({ chainId: sepolia.id })
    } catch (err) {
      setError(err.shortMessage || err.message)
      throw err
    }
  }, [switchChainAsync])

  const ensureSepolia = useCallback(async () => {
    if (chainId !== sepolia.id) {
      await switchToSepolia()
    }
  }, [chainId, switchToSepolia])

  const deployContract = useCallback(async ({ abi, bytecode, args = [] }) => {
    if (!walletClient || !publicClient) throw new Error('Wallet not connected')
    await ensureSepolia()
    const hash = await walletClient.deployContract({
      abi,
      bytecode,
      args,
    })
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    if (!receipt.contractAddress) throw new Error('Contract deployment failed')
    await refreshWallet()
    return { hash, receipt, address: receipt.contractAddress }
  }, [walletClient, publicClient, ensureSepolia, refreshWallet])

  const writeContract = useCallback(async ({ address: contractAddress, abi, functionName, args = [], value }) => {
    if (!walletClient || !publicClient) throw new Error('Wallet not connected')
    await ensureSepolia()
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi,
      functionName,
      args,
      value,
    })
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    await refreshWallet()
    return { hash, receipt }
  }, [walletClient, publicClient, ensureSepolia, refreshWallet])

  const readContract = useCallback(async ({ address: contractAddress, abi, functionName, args = [] }) => {
    if (!publicClient) throw new Error('RPC client unavailable')
    return publicClient.readContract({
      address: contractAddress,
      abi,
      functionName,
      args,
    })
  }, [publicClient])

  const sendTransaction = useCallback(async ({ to, value, data }) => {
    if (!walletClient || !publicClient) throw new Error('Wallet not connected')
    await ensureSepolia()
    const hash = await walletClient.sendTransaction({ to, value, data })
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    await refreshWallet()
    return { hash, receipt }
  }, [walletClient, publicClient, ensureSepolia, refreshWallet])

  useEffect(() => {
    if (address && isConnected) {
      refreshWallet()
    }
  }, [address, isConnected, chainId, refreshWallet])

  useEffect(() => {
    fetchEthPrice()
    const id = setInterval(fetchEthPrice, 60_000)
    return () => clearInterval(id)
  }, [fetchEthPrice])

  return (
    <WalletContext.Provider
      value={{
        account,
        balance,
        network,
        chainId,
        status,
        error,
        txHistory,
        txLoading,
        ethPrice,
        tokenList,
        isMetaMask,
        isCorrectNetwork,
        publicClient,
        walletClient,
        connect,
        disconnect,
        switchToSepolia,
        ensureSepolia,
        refreshWallet,
        deployContract,
        writeContract,
        readContract,
        sendTransaction,
        formatEth: (wei) => formatEther(BigInt(wei || 0)),
        parseTokenAmount: (amount, decimals = 18) => parseUnits(String(amount || 0), decimals),
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}
