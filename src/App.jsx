import { BrowserRouter, Routes, Route } from 'react-router-dom'
import styles from './App.module.css'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Footer from './components/Footer'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import Wallet from './pages/Wallet'
import Portfolio from './pages/Portfolio'
import Markets from './pages/Markets'
import Transactions from './pages/Transactions'
import Exchange from './pages/Exchange'
import Blog from './pages/Blog'
import Chatbot from './components/Chatbot'
import Explorer from './pages/Explorer'
import GasTracker from './pages/GasTracker'
import Staking from './pages/Staking'
import DeFi from './pages/DeFi'
import NFTGallery from './pages/NFTGallery'
import AboutUs from './pages/AboutUs'
import HelpCenter from './pages/HelpCenter'
import LegalCenter from './pages/LegalCenter'
import ArbitrageSimulator from './pages/ArbitrageSimulator'
import BridgePortal from './pages/BridgePortal'
import ContractPlayground from './pages/ContractPlayground'
import TokenGenerator from './pages/TokenGenerator'
import MultiSigSafe from './pages/MultiSigSafe'
import InstitutionalSettlement from './pages/InstitutionalSettlement'
import { WalletProvider } from './context/WalletContext'
import WalletGate from './components/WalletGate'

function ProtectedPage({ children, title }) {
  return (
    <WalletGate title={title}>
      {children}
    </WalletGate>
  )
}

function HomePage() {
  return (
    <div className={styles.app}>
      <div className={styles.container}>
        <Navbar />
        <Hero />
      </div>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/dashboard" element={<ProtectedPage title="Connect to open your dashboard"><Dashboard /></ProtectedPage>} />
          <Route path="/wallet" element={<ProtectedPage title="Connect to open your wallet"><Wallet /></ProtectedPage>} />
          <Route path="/portfolio" element={<ProtectedPage title="Connect to view your portfolio"><Portfolio /></ProtectedPage>} />
          <Route path="/markets" element={<Markets />} />
          <Route path="/transactions" element={<ProtectedPage title="Connect to view transactions"><Transactions /></ProtectedPage>} />
          <Route path="/exchange" element={<ProtectedPage title="Connect to use the exchange"><Exchange /></ProtectedPage>} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/explorer" element={<Explorer />} />
          <Route path="/gas-tracker" element={<GasTracker />} />
          <Route path="/staking" element={<ProtectedPage title="Connect to stake on Sepolia"><Staking /></ProtectedPage>} />
          <Route path="/defi" element={<ProtectedPage title="Connect to view DeFi analytics"><DeFi /></ProtectedPage>} />
          <Route path="/nft" element={<ProtectedPage title="Connect to mint NFTs"><NFTGallery /></ProtectedPage>} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/legal" element={<LegalCenter />} />
          <Route path="/labs/arbitrage" element={<ArbitrageSimulator />} />
          <Route path="/labs/bridge" element={<BridgePortal />} />
          <Route path="/labs/playground" element={<ProtectedPage title="Connect to deploy contracts"><ContractPlayground /></ProtectedPage>} />
          <Route path="/labs/token-generator" element={<ProtectedPage title="Connect to deploy tokens"><TokenGenerator /></ProtectedPage>} />
          <Route path="/labs/multisig" element={<ProtectedPage title="Connect to use multisig"><MultiSigSafe /></ProtectedPage>} />
          <Route path="/institutional-settlement" element={<ProtectedPage title="Connect to institutional settlement"><InstitutionalSettlement /></ProtectedPage>} />
        </Routes>
      </BrowserRouter>
      <Chatbot />
    </WalletProvider>
  )
}

export default App
