import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import styles from './InfoPage.module.css'

export default function AboutUs() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'about'

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
          <span className={styles.category}>Company</span>
          <h1 className={styles.title}>About ExChange</h1>
          <p className={styles.subtitle}>
            Building the next generation of decentralized finance and web3 wallet infrastructure.
          </p>
        </header>

        {/* Layout */}
        <div className={styles.layout}>
          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <span className={styles.sidebarTitle}>Navigation</span>
            <button 
              className={`${styles.sidebarLink} ${activeTab === 'about' ? styles.sidebarActive : ''}`}
              onClick={() => setTab('about')}
            >
              About Us
            </button>
            <button 
              className={`${styles.sidebarLink} ${activeTab === 'careers' ? styles.sidebarActive : ''}`}
              onClick={() => setTab('careers')}
            >
              Careers
            </button>
            <button 
              className={`${styles.sidebarLink} ${activeTab === 'press' ? styles.sidebarActive : ''}`}
              onClick={() => setTab('press')}
            >
              Press & Media
            </button>
          </aside>

          {/* Content */}
          <main className={styles.content}>
            {activeTab === 'about' && (
              <div>
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Our Mission</h2>
                  <p className={styles.text}>
                    At ExChange, we believe decentralized technology is the foundation for financial freedom. 
                    Our mission is to bridge the gap between traditional banking and the global blockchain network 
                    by delivering secure, intuitive, and high-performance wallet solutions.
                  </p>
                  <p className={styles.text}>
                    Launched in 2024, ExChange has grown to support millions of users worldwide, securing over 
                    $4B in active smart contract deposits and token holdings. We operate with radical transparency, 
                    open-source code, and strict security compliance.
                  </p>
                </section>

                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Core Metrics</h2>
                  <div className={styles.grid}>
                    <div className={styles.card}>
                      <h3 className={styles.cardTitle}>$4.2B+</h3>
                      <p className={styles.cardText}>Total Volume Secured across custodial & non-custodial registries.</p>
                    </div>
                    <div className={styles.card}>
                      <h3 className={styles.cardTitle}>15M+</h3>
                      <p className={styles.cardText}>Transactions successfully executed with 99.99% network uptime.</p>
                    </div>
                    <div className={styles.card}>
                      <h3 className={styles.cardTitle}>180+</h3>
                      <p className={styles.cardText}>Countries supported with localized compliance and fiat rails.</p>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'careers' && (
              <div>
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Join Our Remote Team</h2>
                  <p className={styles.text}>
                    We are engineers, developers, designers, and compliance experts working across 12 time zones 
                    to democratize web3. We value autonomy, clean code, and user-centric problem solving.
                  </p>
                </section>

                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Open Positions</h2>
                  <div className={styles.grid}>
                    <div className={styles.card}>
                      <span className={styles.cardTag}>Engineering</span>
                      <h3 className={styles.cardTitle}>Senior Smart Contract Engineer</h3>
                      <p className={styles.cardText}>Design, review, and optimize EVM smart contracts and Solidity liquidity bridges.</p>
                      <span className={styles.cardFooter}>Remote · Full-Time · 180k-220k USD</span>
                    </div>

                    <div className={styles.card}>
                      <span className={styles.cardTag}>Product</span>
                      <h3 className={styles.cardTitle}>Senior Web3 UI/UX Designer</h3>
                      <p className={styles.cardText}>Own the complete user flow for DeFi portals, staking simulator interfaces, and charts.</p>
                      <span className={styles.cardFooter}>Remote · Full-Time · 130k-160k USD</span>
                    </div>

                    <div className={styles.card}>
                      <span className={styles.cardTag}>Security</span>
                      <h3 className={styles.cardTitle}>Blockchain Security Auditor</h3>
                      <p className={styles.cardText}>Conduct audits, write automated security test benches, and lead bug bounty operations.</p>
                      <span className={styles.cardFooter}>Remote · Full-Time · 190k-240k USD</span>
                    </div>
                  </div>
                </section>

                <div className={styles.actionBox}>
                  <h4 className={styles.actionTitle}>Don't see a matching position?</h4>
                  <p className={styles.text} style={{ fontSize: '13.5px', marginBottom: 0 }}>
                    We're always looking for exceptional crypto talent. Send your profile directly to our hiring team.
                  </p>
                  <a href="mailto:careers@exchange-wallet.io" className={styles.actionBtn}>Send Speculative Application</a>
                </div>
              </div>
            )}

            {activeTab === 'press' && (
              <div>
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Press Room</h2>
                  <p className={styles.text}>
                    Read our latest announcements, product launches, and updates from the core ExChange team.
                  </p>
                </section>

                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Recent Press Releases</h2>
                  <div className={styles.grid}>
                    <div className={styles.card}>
                      <span className={styles.cardTag}>Product</span>
                      <h3 className={styles.cardTitle}>ExChange Integrates Decentralized IPFS Storage via Pinata</h3>
                      <p className={styles.cardText}>Users can now mint, upload, and securely store custom NFT media directly from their ExChange wallets.</p>
                      <span className={styles.cardFooter}>June 23, 2026</span>
                    </div>

                    <div className={styles.card}>
                      <span className={styles.cardTag}>Security</span>
                      <h3 className={styles.cardTitle}>ExChange Passes Comprehensive Smart Contract Audit</h3>
                      <p className={styles.cardText}>Top auditing firm confirms 0 critical vulnerabilities on ExChange DeFi liquidity contracts.</p>
                      <span className={styles.cardFooter}>May 14, 2026</span>
                    </div>

                    <div className={styles.card}>
                      <span className={styles.cardTag}>Corporate</span>
                      <h3 className={styles.cardTitle}>ExChange Surpasses $4B in Total Value Locked (TVL)</h3>
                      <p className={styles.cardText}>DeFi dashboard integration accelerates deposits across major lending pools and yield farms.</p>
                      <span className={styles.cardFooter}>March 10, 2026</span>
                    </div>
                  </div>
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
