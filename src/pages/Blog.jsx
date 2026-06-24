import { useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import styles from './Blog.module.css'

const blogArticles = [
  {
    id: 1,
    title: "The Future of Ethereum: EIP-4844 and Proto-Danksharding Explained",
    excerpt: "Discover how Ethereum's next major upgrade aims to slash rollups' transaction fees by 10x using data blobs, paving the way for mass scaling.",
    content: "Ethereum is undergoing its most significant transition since the Merge. EIP-4844, also known as Proto-Danksharding, introduces a temporary data space called 'blobs'. These blobs allow Layer-2 rollups (like Arbitrum and Optimism) to write their transaction proofs much cheaper than before, directly translating into a 10x drop in gas fees for end users. In this article, we break down the underlying cryptography, rollup economics, and what this scaling roadmap means for dApps, liquidity, and the long-term price potential of ETH.",
    category: "Markets",
    readTime: "6 min read",
    date: "June 22, 2026",
    image: "/blog/blog_ethereum_scaling_1782197478637.png",
    imageText: "ETH SCALING",
    featured: true
  },
  {
    id: 2,
    title: "Hardware Wallets vs Software Wallets: Security Trade-offs",
    excerpt: "A detailed comparison of custody methods, key derivation, offline signatures, and user experience across hot and cold wallets.",
    content: "When it comes to securing your digital assets, the debate between cold storage (hardware wallets) and hot storage (software wallets) is paramount. Hardware wallets store your private keys entirely offline, isolating them from internet-connected malware. On the other hand, software wallets offer unmatched convenience for active dApp trading and DeFi staking. We analyze the mechanisms of seed phrase storage, hardware architectures, and help you select the safest backup plan tailored to your trading volume.",
    category: "Security",
    readTime: "5 min read",
    date: "June 18, 2026",
    image: "/blog/blog_wallet_security_1782197491695.png",
    imageText: "KEY STORAGE"
  },
  {
    id: 3,
    title: "A Complete Beginner's Guide to Smart Contracts in 2026",
    excerpt: "Learn the fundamentals of blockchain protocols, solidity compilations, gas optimization, and decentralised code execution.",
    content: "Smart contracts are self-executing agreements with the terms of the contract directly written into lines of code. Running on decentralized virtual machines (like the EVM), they remove middleman dependencies. This beginner's guide covers how smart contracts compile, compile gas fees, dynamic Solidity variables, and why smart contract audits are crucial before committing pools of capital.",
    category: "Tutorials",
    readTime: "8 min read",
    date: "June 15, 2026",
    image: "/blog/blog_smart_contracts_1782197504671.png",
    imageText: "SMART CONTRACTS"
  },
  {
    id: 4,
    title: "DeFi Yield Farming: Maximising Rewards & Mitigating Risks",
    excerpt: "Explore liquidity pool routing, automated market makers (AMMs), interest compounding, and the math behind impermanent loss.",
    content: "Yield farming allows investors to earn passive income by lending tokens to liquidity pools. However, high annual percentage yields (APYs) come with significant risks, primarily impermanent loss and smart contract exploits. In this guide, we dive into liquidity pool math, discuss hedging techniques, and compare lending protocols to optimize your yield curves safely.",
    category: "Markets",
    readTime: "7 min read",
    date: "June 10, 2026",
    image: "/blog/blog_defi_staking_1782197520013.png",
    imageText: "DEFI STAKING"
  },
  {
    id: 5,
    title: "Phishing Scams: 5 Critical Rules to Protect Your Seed Phrase",
    excerpt: "Web3 phishing campaigns are becoming increasingly sophisticated. Learn how to recognize signature traps and malicious approvals.",
    content: "With the rise of Web3, phishing has evolved beyond simple email scams. Attackers now spoof dApp websites, construct malicious wallet approval prompts, and compromise discord servers to distribute malicious files. We outline the 5 golden rules of Web3 hygiene: verifying domain names, understanding token approvals, isolating seed phrases, running dual wallets, and utilizing hardware safety confirmation dialogs.",
    category: "Security",
    readTime: "4 min read",
    date: "June 08, 2026",
    image: "/blog/blog_secure_web3_1782197534001.png",
    imageText: "SECURE WEB3"
  }
]

export default function Blog() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [activeArticle, setActiveArticle] = useState(null)

  // Filter articles
  const filteredArticles = blogArticles.filter(art => {
    const matchesSearch = art.title.toLowerCase().includes(search.toLowerCase()) || 
                          art.excerpt.toLowerCase().includes(search.toLowerCase())
    if (category === 'all') return matchesSearch
    return matchesSearch && art.category.toLowerCase() === category.toLowerCase()
  })

  // Separate featured article (only when showing 'all' and no active search)
  const showFeatured = category === 'all' && !search
  const featuredArticle = blogArticles.find(a => a.featured)
  
  const displayGridArticles = showFeatured 
    ? filteredArticles.filter(a => !a.featured)
    : filteredArticles

  return (
    <div className={styles.page}>
      <Navbar />
      
      <div className={styles.container}>
        
        {/* Header */}
        <header className={styles.header}>
          <h1 className={styles.title}>Crypto Insights & News</h1>
          <p className={styles.subtitle}>Stay updated with deep technical reviews, market analysis, and Web3 tutorials</p>
        </header>

        {/* Filters and Search */}
        <div className={styles.toolbar}>
          <div className={styles.filters}>
            {['all', 'markets', 'tutorials', 'security'].map(cat => (
              <button
                key={cat}
                className={`${styles.filterBtn} ${category === cat ? styles.activeFilter : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          <div className={styles.searchBox}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
              <path d="M11 11l3 3" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search insights..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Featured Post Card */}
        {showFeatured && featuredArticle && (
          <div className={styles.featuredCard} onClick={() => setActiveArticle(featuredArticle)}>
            <div className={styles.featuredImage}>
              {featuredArticle.image ? (
                <img src={featuredArticle.image} alt={featuredArticle.title} className={styles.articleImage} />
              ) : (
                <div className={styles.imagePlaceholder}>{featuredArticle.imageText}</div>
              )}
            </div>
            <div className={styles.featuredContent}>
              <div className={styles.tagRow}>
                <span className={styles.tag}>{featuredArticle.category}</span>
                <span className={styles.readTime}>{featuredArticle.readTime}</span>
              </div>
              <h2 className={styles.featuredTitle}>{featuredArticle.title}</h2>
              <p className={styles.featuredExcerpt}>{featuredArticle.excerpt}</p>
              <div className={styles.featuredFooter}>
                <span className={styles.date}>{featuredArticle.date}</span>
                <button className={styles.readMoreBtn}>Read Article ↗</button>
              </div>
            </div>
          </div>
        )}

        {/* Grid List */}
        <div className={styles.articlesGrid}>
          {displayGridArticles.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No articles match your search or filter selection.</p>
            </div>
          ) : (
            displayGridArticles.map((art, i) => (
              <div 
                key={art.id} 
                className={styles.articleCard}
                onClick={() => setActiveArticle(art)}
                style={{ '--i': i }}
              >
                <div className={styles.cardImage}>
                  {art.image ? (
                    <img src={art.image} alt={art.title} className={styles.articleImage} />
                  ) : (
                    <div className={styles.cardImageText}>{art.imageText}</div>
                  )}
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.tagRow}>
                    <span className={styles.tag}>{art.category}</span>
                    <span className={styles.readTime}>{art.readTime}</span>
                  </div>
                  <h3 className={styles.cardTitle}>{art.title}</h3>
                  <p className={styles.cardExcerpt}>{art.excerpt}</p>
                  <div className={styles.cardFooter}>
                    <span className={styles.date}>{art.date}</span>
                    <button className={styles.cardLink}>Read ↗</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Article Reader Modal */}
      {activeArticle && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <button className={styles.closeBtn} onClick={() => setActiveArticle(null)}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M13.5 4.5l-9 9M4.5 4.5l9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className={styles.modalHeader}>
              <span className={styles.tag}>{activeArticle.category}</span>
              <span className={styles.modalReadTime}>{activeArticle.readTime}</span>
            </div>
            <h2 className={styles.modalArticleTitle}>{activeArticle.title}</h2>
            <div className={styles.modalMeta}>Published on {activeArticle.date} · By CryptoWallet Editor</div>
            {activeArticle.image && (
              <div className={styles.modalImageContainer}>
                <img src={activeArticle.image} alt={activeArticle.title} className={styles.modalHeroImage} />
              </div>
            )}
            <hr className={styles.divider} />
            <p className={styles.modalText}>{activeArticle.content}</p>
            <button className={styles.modalCloseActionBtn} onClick={() => setActiveArticle(null)}>
              Close Article
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
