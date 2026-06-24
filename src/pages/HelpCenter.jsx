import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import styles from './InfoPage.module.css'

export default function HelpCenter() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'help'

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
          <span className={styles.category}>Support</span>
          <h1 className={styles.title}>Resources & Help</h1>
          <p className={styles.subtitle}>
            Explore user guides, developer API integrations, and community discussion groups.
          </p>
        </header>

        {/* Layout */}
        <div className={styles.layout}>
          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <span className={styles.sidebarTitle}>Navigation</span>
            <button 
              className={`${styles.sidebarLink} ${activeTab === 'help' ? styles.sidebarActive : ''}`}
              onClick={() => setTab('help')}
            >
              Help Center (FAQ)
            </button>
            <button 
              className={`${styles.sidebarLink} ${activeTab === 'api' ? styles.sidebarActive : ''}`}
              onClick={() => setTab('api')}
            >
              API Docs
            </button>
            <button 
              className={`${styles.sidebarLink} ${activeTab === 'community' ? styles.sidebarActive : ''}`}
              onClick={() => setTab('community')}
            >
              Community
            </button>
          </aside>

          {/* Content */}
          <main className={styles.content}>
            {activeTab === 'help' && (
              <div>
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
                  <p className={styles.text}>
                    Find quick answers to common questions about custody, staking, and asset transfers.
                  </p>
                </section>

                <section className={styles.section}>
                  <div className={styles.grid} style={{ gridTemplateColumns: '1fr' }}>
                    <div className={styles.card}>
                      <h3 className={styles.cardTitle}>How does ExChange secure my private keys?</h3>
                      <p className={styles.cardText} style={{ marginBottom: 0 }}>
                        ExChange is a non-custodial wallet. Your seed phrase and private keys are encrypted locally 
                        on your device using AES-256 GCM. We never transmit, store, or have access to your backup codes.
                      </p>
                    </div>

                    <div className={styles.card}>
                      <h3 className={styles.cardTitle}>What blockchains are currently supported?</h3>
                      <p className={styles.cardText} style={{ marginBottom: 0 }}>
                        We natively support Ethereum (L1), Arbitrum, Optimism, Base, Polygon, and BNB Chain. 
                        You can manage tokens, track transaction history, and interact with smart contracts across these networks.
                      </p>
                    </div>

                    <div className={styles.card}>
                      <h3 className={styles.cardTitle}>How do I stake my crypto and earn rewards?</h3>
                      <p className={styles.cardText} style={{ marginBottom: 0 }}>
                        Navigate to the Staking Simulator in the sidebar, input your token and volume details, and 
                        compare APYs across top validators (Lido, Rocket Pool, Coinbase). Staking transactions 
                        can be executed directly via the Wallet dashboard interface.
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'api' && (
              <div>
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Developer API Reference</h2>
                  <p className={styles.text}>
                    Build custom wallet analytics, fetch live gas prices, or track transactions on top blockchains.
                  </p>
                </section>

                <section className={styles.section}>
                  <h3 className={styles.sectionTitle} style={{ fontSize: '16px' }}>1. Fetch Gas Prices</h3>
                  <p className={styles.text}>
                    Get real-time Ethereum gas price estimations (Low, Standard, Fast, and Rapid) in gwei.
                  </p>
                  
                  <div className={styles.codeBlock}>
                    <span className={styles.comment}>// GET https://api.exchange-wallet.io/v1/gas/live</span><br />
                    <span className={styles.keyword}>const</span> response = <span className={styles.keyword}>await</span> <span className={styles.function}>fetch</span>(<span className={styles.string}>'https://api.exchange-wallet.io/v1/gas/live'</span>);<br />
                    <span className={styles.keyword}>const</span> data = <span className={styles.keyword}>await</span> response.<span className={styles.function}>json</span>();<br />
                    console.<span className={styles.function}>log</span>(data);
                  </div>

                  <div className={styles.codeBlock}>
                    <span className={styles.comment}>// Response Format</span><br />
                    &#123;<br />
                    &nbsp;&nbsp;<span className={styles.string}>"status"</span>: <span className={styles.string}>"success"</span>,<br />
                    &nbsp;&nbsp;<span className={styles.string}>"data"</span>: &#123;<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className={styles.string}>"low"</span>: <span className={styles.keyword}>12</span>,<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className={styles.string}>"standard"</span>: <span className={styles.keyword}>18</span>,<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className={styles.string}>"fast"</span>: <span className={styles.keyword}>24</span>,<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className={styles.string}>"rapid"</span>: <span className={styles.keyword}>35</span>,<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className={styles.string}>"updatedAt"</span>: <span className={styles.string}>"2026-06-23T07:00:00Z"</span><br />
                    &nbsp;&nbsp;&#125;<br />
                    &#125;
                  </div>
                </section>

                <section className={styles.section}>
                  <h3 className={styles.sectionTitle} style={{ fontSize: '16px' }}>2. Upload Assets to IPFS</h3>
                  <p className={styles.text}>
                    Upload files (images/metadata) directly into IPFS via the pinned Pinata router endpoint.
                  </p>
                  
                  <div className={styles.codeBlock}>
                    <span className={styles.comment}>// POST https://api.exchange-wallet.io/v1/ipfs/pin</span><br />
                    <span className={styles.keyword}>const</span> body = <span className={styles.keyword}>new</span> <span className={styles.function}>FormData</span>();<br />
                    body.<span className={styles.function}>append</span>(<span className={styles.string}>'file'</span>, myImageFile);<br />
                    <br />
                    <span className={styles.keyword}>const</span> response = <span className={styles.keyword}>await</span> <span className={styles.function}>fetch</span>(<span className={styles.string}>'https://api.exchange-wallet.io/v1/ipfs/pin'</span>, &#123;<br />
                    &nbsp;&nbsp;method: <span className={styles.string}>'POST'</span>,<br />
                    &nbsp;&nbsp;headers: &#123; <span className={styles.string}>'Authorization'</span>: <span className={styles.string}>'Bearer JWT_TOKEN_HERE'</span> &#125;,<br />
                    &nbsp;&nbsp;body<br />
                    &#125;);
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'community' && (
              <div>
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Our Global Community</h2>
                  <p className={styles.text}>
                    Connect with other Web3 enthusiasts, contribute to our open-source codebase, or chat directly 
                    with the core developer team.
                  </p>
                </section>

                <section className={styles.section}>
                  <div className={styles.grid}>
                    <div className={styles.card}>
                      <h3 className={styles.cardTitle}>Twitter / X</h3>
                      <p className={styles.cardText}>Get real-time news alerts, announcements, and join our weekly spaces.</p>
                      <a href="https://twitter.com" target="_blank" rel="noreferrer" className={styles.actionBtn} style={{ marginTop: 0 }}>Follow @ExChange</a>
                    </div>

                    <div className={styles.card}>
                      <h3 className={styles.cardTitle}>Discord Server</h3>
                      <p className={styles.cardText}>Discuss DeFi yield curves, request API keys, and seek troubleshooting help.</p>
                      <a href="https://discord.com" target="_blank" rel="noreferrer" className={styles.actionBtn} style={{ marginTop: 0 }}>Join Server</a>
                    </div>

                    <div className={styles.card}>
                      <h3 className={styles.cardTitle}>Telegram Channel</h3>
                      <p className={styles.cardText}>Receive developer updates, release notes, and general announcements.</p>
                      <a href="https://telegram.org" target="_blank" rel="noreferrer" className={styles.actionBtn} style={{ marginTop: 0 }}>Join Channel</a>
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
