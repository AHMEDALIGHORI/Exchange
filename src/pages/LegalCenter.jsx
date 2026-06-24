import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import styles from './InfoPage.module.css'

export default function LegalCenter() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'privacy'

  // Scroll to top on load/change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [activeTab])

  const setTab = (tabName) => {
    setSearchParams({ tab: tabName })
  }

  return (
    <div className={styles.page}>
      <Navbar />
      
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <span className={styles.category}>Legal & Compliance</span>
          <h1 className={styles.title}>Policy Center</h1>
          <p className={styles.subtitle}>
            Please review our terms of use, privacy regulations, cookies usage, and anti-money laundering policies.
          </p>
        </header>

        {/* Layout */}
        <div className={styles.layout}>
          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <span className={styles.sidebarTitle}>Navigation</span>
            <button 
              className={`${styles.sidebarLink} ${activeTab === 'privacy' ? styles.sidebarActive : ''}`}
              onClick={() => setTab('privacy')}
            >
              Privacy Policy
            </button>
            <button 
              className={`${styles.sidebarLink} ${activeTab === 'terms' ? styles.sidebarActive : ''}`}
              onClick={() => setTab('terms')}
            >
              Terms of Service
            </button>
            <button 
              className={`${styles.sidebarLink} ${activeTab === 'cookies' ? styles.sidebarActive : ''}`}
              onClick={() => setTab('cookies')}
            >
              Cookie Policy
            </button>
            <button 
              className={`${styles.sidebarLink} ${activeTab === 'aml' ? styles.sidebarActive : ''}`}
              onClick={() => setTab('aml')}
            >
              AML & KYC Policy
            </button>
          </aside>

          {/* Content */}
          <main className={styles.content}>
            {activeTab === 'privacy' && (
              <div>
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Privacy Policy</h2>
                  <span className={styles.text} style={{ fontSize: '12px', display: 'block', color: 'rgba(255,255,255,0.4)', marginBottom: '20px' }}>
                    Last updated: June 23, 2026
                  </span>
                  
                  <p className={styles.text}>
                    We respect your privacy. Because ExChange is a non-custodial wallet application, we do not store, 
                    collect, or transmit any sensitive personal data, private keys, or seed phrases.
                  </p>
                  
                  <h3 className={styles.sectionTitle} style={{ fontSize: '16px', marginTop: '24px' }}>Information We Collect</h3>
                  <p className={styles.text}>
                    When you use our services (e.g. Explorer, Staking, Gas Tracker), we utilize public blockchain data 
                    and third-party API queries (such as Etherscan). Any client analytics collected are strictly anonymized 
                    and used only to monitor application performance and stability.
                  </p>

                  <h3 className={styles.sectionTitle} style={{ fontSize: '16px', marginTop: '24px' }}>Your Data Control</h3>
                  <p className={styles.text}>
                    Your wallet accounts, transaction logs, and cache data are saved locally within your browser's 
                    IndexedDB or LocalStorage. You can clear this data at any time via your browser settings.
                  </p>
                </section>
              </div>
            )}

            {activeTab === 'terms' && (
              <div>
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Terms of Service</h2>
                  <span className={styles.text} style={{ fontSize: '12px', display: 'block', color: 'rgba(255,255,255,0.4)', marginBottom: '20px' }}>
                    Last updated: June 23, 2026
                  </span>

                  <p className={styles.text}>
                    By accessing or using ExChange, you agree to comply with our terms of use. Please read them carefully.
                  </p>

                  <h3 className={styles.sectionTitle} style={{ fontSize: '16px', marginTop: '24px' }}>1. Wallet Custody & Responsibility</h3>
                  <p className={styles.text}>
                    You maintain full, exclusive ownership of your seed phrase and private keys. ExChange does not have 
                    custody over your assets and cannot recover lost seed phrases. You are solely responsible for 
                    securing your backup codes.
                  </p>

                  <h3 className={styles.sectionTitle} style={{ fontSize: '16px', marginTop: '24px' }}>2. Risk Acknowledgment</h3>
                  <p className={styles.text}>
                    Cryptocurrency transactions are irreversible. Staking pools, lending protocols (such as Aave/Compound), 
                    and DeFi platforms carry inherent smart contract risks. ExChange is not liable for losses resulting 
                    from token volatility, slippage, or validator penalties (slashing).
                  </p>
                </section>
              </div>
            )}

            {activeTab === 'cookies' && (
              <div>
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Cookie Policy</h2>
                  <span className={styles.text} style={{ fontSize: '12px', display: 'block', color: 'rgba(255,255,255,0.4)', marginBottom: '20px' }}>
                    Last updated: June 23, 2026
                  </span>

                  <p className={styles.text}>
                    We use cookies and similar browser storage utilities to enhance your experience, remember preferences, 
                    and secure authentication sessions.
                  </p>

                  <h3 className={styles.sectionTitle} style={{ fontSize: '16px', marginTop: '24px' }}>How We Use Cookies</h3>
                  <ul className={styles.list}>
                    <li className={styles.listItem}>**Essential Cookies**: Required to maintain authentication and Google login routing stability.</li>
                    <li className={styles.listItem}>**Preferences**: Saves your dark mode values, active currency layouts, and dashboard panel filters.</li>
                    <li className={styles.listItem}>**Local Cache**: Speeds up transaction history listing and wallet address book loads.</li>
                  </ul>
                </section>
              </div>
            )}

            {activeTab === 'aml' && (
              <div>
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Anti-Money Laundering (AML) & KYC Policy</h2>
                  <span className={styles.text} style={{ fontSize: '12px', display: 'block', color: 'rgba(255,255,255,0.4)', marginBottom: '20px' }}>
                    Last updated: June 23, 2026
                  </span>

                  <p className={styles.text}>
                    ExChange is committed to preventing money laundering, terrorist financing, and fraudulent activities 
                    on our platform.
                  </p>

                  <h3 className={styles.sectionTitle} style={{ fontSize: '16px', marginTop: '24px' }}>Compliance Controls</h3>
                  <p className={styles.text}>
                    While our core wallet features are decentralized and non-custodial, fiat-to-crypto gateways, token swaps, 
                    and specific payment rails require Know-Your-Customer (KYC) verify procedures. We partner with regulated 
                    on-ramp providers to perform automated identity verification in compliance with local regulations.
                  </p>
                </section>
              </div>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  )
}
