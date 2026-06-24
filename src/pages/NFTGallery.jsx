import { useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import NetworkBanner from '../components/NetworkBanner'
import styles from './NFTGallery.module.css'
import { pinFileToIPFS, pinJSONToIPFS } from '../utils/pinata'
import { useWallet } from '../context/WalletContext'
import { abis } from '../config/abis'
import { getContractAddress, getExplorerTxUrl, hasDeployedContracts } from '../config/contracts'

// ─── Generated NFT Data ─────────────────────────────────
const nftItems = [
  { id: 1, name: 'CryptoPunk #7804', collection: 'CryptoPunks', floorPrice: '42.5 ETH', estimatedValue: '$162,400', rarity: 'Legendary', traits: [{ key: 'Type', value: 'Alien' }, { key: 'Accessory', value: 'Pipe' }, { key: 'Background', value: 'Blue' }], hue: 180, pattern: 'punk', image: '/nfts/nft_cryptopunk_1_1782196801391.png' },
  { id: 2, name: 'Bored Ape #3749', collection: 'Bored Ape YC', floorPrice: '28.2 ETH', estimatedValue: '$107,800', rarity: 'Rare', traits: [{ key: 'Fur', value: 'Golden Brown' }, { key: 'Eyes', value: 'Laser' }, { key: 'Mouth', value: 'Bored' }], hue: 35, pattern: 'ape', image: '/nfts/nft_boredape_1_1782196810600.png' },
  { id: 3, name: 'Azuki #9018', collection: 'Azuki', floorPrice: '8.4 ETH', estimatedValue: '$32,100', rarity: 'Uncommon', traits: [{ key: 'Type', value: 'Human' }, { key: 'Hair', value: 'Pink' }, { key: 'Clothing', value: 'Kimono' }], hue: 340, pattern: 'azuki', image: '/nfts/nft_azuki_1_1782196819621.png' },
  { id: 4, name: 'Pudgy #2891', collection: 'Pudgy Penguins', floorPrice: '12.1 ETH', estimatedValue: '$46,240', rarity: 'Rare', traits: [{ key: 'Body', value: 'Teal' }, { key: 'Head', value: 'Crown' }, { key: 'Face', value: 'Smile' }], hue: 200, pattern: 'pudgy', image: '/nfts/nft_pudgy_1_1782196838140.png' },
  { id: 5, name: 'Doodle #6142', collection: 'Doodles', floorPrice: '3.8 ETH', estimatedValue: '$14,520', rarity: 'Common', traits: [{ key: 'Face', value: 'Happy' }, { key: 'Hair', value: 'Rainbow' }, { key: 'Body', value: 'Blue' }], hue: 280, pattern: 'doodle', image: '/nfts/nft_doodle_1_1782196848335.png' },
  { id: 6, name: 'Moonbird #4521', collection: 'Moonbirds', floorPrice: '5.2 ETH', estimatedValue: '$19,870', rarity: 'Uncommon', traits: [{ key: 'Feathers', value: 'Cosmic' }, { key: 'Eyes', value: 'Diamond' }, { key: 'Beak', value: 'Golden' }], hue: 260, pattern: 'moon', image: '/nfts/nft_moonbird_1_1782196858803.png' },
  { id: 7, name: 'CryptoPunk #1234', collection: 'CryptoPunks', floorPrice: '38.0 ETH', estimatedValue: '$145,200', rarity: 'Rare', traits: [{ key: 'Type', value: 'Zombie' }, { key: 'Accessory', value: 'Earring' }, { key: 'Background', value: 'Green' }], hue: 120, pattern: 'punk', image: '/nfts/nft_cryptopunk_1_1782196801391.png' },
  { id: 8, name: 'Bored Ape #8821', collection: 'Bored Ape YC', floorPrice: '31.5 ETH', estimatedValue: '$120,300', rarity: 'Epic', traits: [{ key: 'Fur', value: 'Solid Gold' }, { key: 'Eyes', value: 'Robot' }, { key: 'Hat', value: 'Captain' }], hue: 45, pattern: 'ape', image: '/nfts/nft_boredape_1_1782196810600.png' },
  { id: 9, name: 'Azuki #1122', collection: 'Azuki', floorPrice: '9.1 ETH', estimatedValue: '$34,770', rarity: 'Rare', traits: [{ key: 'Type', value: 'Spirit' }, { key: 'Hair', value: 'Blue' }, { key: 'Weapon', value: 'Katana' }], hue: 210, pattern: 'azuki', image: '/nfts/nft_azuki_1_1782196819621.png' },
]

// Procedurally generated or image-based NFT art
function NFTArt({ image, hue, pattern, rarity, name }) {
  const rarityGlow = {
    'Legendary': `0 0 30px hsla(${hue}, 100%, 60%, 0.5)`,
    'Epic': `0 0 22px hsla(${hue}, 90%, 55%, 0.4)`,
    'Rare': `0 0 16px hsla(${hue}, 80%, 50%, 0.3)`,
    'Uncommon': `0 0 10px hsla(${hue}, 70%, 45%, 0.2)`,
    'Common': 'none',
  }

  const gradients = {
    punk: `radial-gradient(circle at 30% 40%, hsl(${hue}, 70%, 55%) 0%, hsl(${hue+30}, 60%, 25%) 50%, hsl(${hue+60}, 50%, 15%) 100%)`,
    ape: `conic-gradient(from 45deg, hsl(${hue}, 65%, 45%), hsl(${hue+40}, 70%, 35%), hsl(${hue+80}, 55%, 50%), hsl(${hue}, 65%, 45%))`,
    azuki: `linear-gradient(135deg, hsl(${hue}, 80%, 60%) 0%, hsl(${hue+60}, 70%, 30%) 50%, hsl(${hue+120}, 60%, 20%) 100%)`,
    pudgy: `radial-gradient(ellipse at 50% 60%, hsl(${hue}, 75%, 55%) 0%, hsl(${hue+40}, 65%, 35%) 60%, hsl(${hue+80}, 50%, 18%) 100%)`,
    doodle: `linear-gradient(45deg, hsl(${hue}, 80%, 65%) 0%, hsl(${hue+90}, 70%, 50%) 33%, hsl(${hue+180}, 75%, 55%) 66%, hsl(${hue+270}, 80%, 60%) 100%)`,
    moon: `radial-gradient(circle at 60% 30%, hsl(${hue}, 90%, 70%) 0%, hsl(${hue+20}, 80%, 40%) 40%, hsl(${hue+50}, 60%, 15%) 100%)`,
  }

  const idMatch = name ? name.match(/#\d+/) : null
  const nftId = idMatch ? idMatch[0] : `#${Math.floor(Math.random() * 9999)}`

  return (
    <div
      className={styles.nftArt}
      style={{
        background: image ? 'none' : (gradients[pattern] || gradients.punk),
        boxShadow: rarityGlow[rarity] || 'none',
      }}
    >
      {image ? (
        <img src={image} alt={name} className={styles.nftImage} />
      ) : (
        <div className={styles.artOverlay}>
          <div className={styles.artShape1} style={{ background: `hsla(${hue+60}, 80%, 70%, 0.15)` }} />
          <div className={styles.artShape2} style={{ background: `hsla(${hue+120}, 70%, 60%, 0.1)` }} />
          <div className={styles.artShape3} style={{ background: `hsla(${hue+180}, 90%, 75%, 0.08)` }} />
        </div>
      )}
      <span className={styles.artId}>{nftId}</span>
    </div>
  )
}

// NFT Detail Modal
function NFTModal({ nft, onClose }) {
  if (!nft) return null

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose}>✕</button>

        <div className={styles.modalContent}>
          <div className={styles.modalArt}>
            <NFTArt image={nft.image} hue={nft.hue} pattern={nft.pattern} rarity={nft.rarity} name={nft.name} />
          </div>
          <div className={styles.modalInfo}>
            <div className={`${styles.rarityBadge} ${styles[`rarity${nft.rarity}`]}`}>
              {nft.rarity}
            </div>
            <h2 className={styles.modalName}>{nft.name}</h2>
            <p className={styles.modalCollection}>{nft.collection}</p>

            <div className={styles.modalStats}>
              <div className={styles.modalStat}>
                <span className={styles.modalStatLabel}>Floor Price</span>
                <span className={styles.modalStatValue}>{nft.floorPrice}</span>
              </div>
              <div className={styles.modalStat}>
                <span className={styles.modalStatLabel}>Est. Value</span>
                <span className={styles.modalStatValue}>{nft.estimatedValue}</span>
              </div>
            </div>

            <h4 className={styles.traitsTitle}>Traits</h4>
            <div className={styles.traitsGrid}>
              {nft.traits.map(trait => (
                <div key={trait.key} className={styles.traitCard}>
                  <span className={styles.traitKey}>{trait.key}</span>
                  <span className={styles.traitValue}>{trait.value}</span>
                </div>
              ))}
            </div>

            <div className={styles.modalActions}>
              <button className={styles.listBtn}>List for Sale</button>
              <button className={styles.transferBtn}>Transfer</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NFTGallery() {
  const { status, writeContract } = useWallet()
  const walletConnected = status === 'connected'
  const nftContractAddress = getContractAddress('SimpleNFT')
  const [nfts, setNfts] = useState(() => {
    const saved = localStorage.getItem('exchange_user_nfts')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return nftItems
      }
    }
    return nftItems
  })
  const [filter, setFilter] = useState('All')
  const [sortBy, setSortBy] = useState('value') // value | name | rarity
  const [selectedNFT, setSelectedNFT] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // grid | list

  // Minting form state
  const [isPinningModalOpen, setIsPinningModalOpen] = useState(false)
  const [nftName, setNftName] = useState('')
  const [nftCollection, setNftCollection] = useState('CryptoPunks')
  const [customCollection, setCustomCollection] = useState('')
  const [floorPrice, setFloorPrice] = useState('0.1 ETH')
  const [rarity, setRarity] = useState('Common')
  const [description, setDescription] = useState('')
  const [traits, setTraits] = useState([{ key: 'Type', value: 'Human' }])
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [isPinning, setIsPinning] = useState(false)
  const [pinningStep, setPinningStep] = useState('idle') // 'idle' | 'uploading_media' | 'uploading_meta' | 'saving' | 'success' | 'error'
  const [pinningError, setPinningError] = useState('')
  const [pinnedResult, setPinnedResult] = useState(null)
  const [mintTxHash, setMintTxHash] = useState(null)

  const collectionsList = ['All', ...new Set([
    'CryptoPunks', 'Bored Ape YC', 'Azuki', 'Pudgy Penguins', 'Doodles', 'Moonbirds',
    ...nfts.map(nft => nft.collection)
  ])]

  const handleAddTrait = () => {
    setTraits([...traits, { key: '', value: '' }])
  }

  const handleUpdateTrait = (index, keyOrVal, value) => {
    const newTraits = [...traits]
    newTraits[index][keyOrVal] = value
    setTraits(newTraits)
  }

  const handleRemoveTrait = (index) => {
    setTraits(traits.filter((_, idx) => idx !== index))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl('')
    }
  }

  const resetMintForm = () => {
    setNftName('')
    setNftCollection('CryptoPunks')
    setCustomCollection('')
    setFloorPrice('0.1 ETH')
    setRarity('Common')
    setDescription('')
    setTraits([{ key: 'Type', value: 'Human' }])
    setSelectedFile(null)
    setPreviewUrl('')
    setIsPinning(false)
    setPinningStep('idle')
    setPinningError('')
    setPinnedResult(null)
    setMintTxHash(null)
  }

  const handlePinNFT = async (e) => {
    e.preventDefault()
    if (!nftName || !selectedFile || !description) {
      setPinningError('Please fill out Name, Description, and select an Image.')
      setPinningStep('error')
      return
    }

    setIsPinning(true)
    setPinningStep('uploading_media')
    setPinningError('')

    // 1. Upload file to IPFS via Pinata
    const fileResult = await pinFileToIPFS(selectedFile, nftName)
    if (!fileResult.success) {
      setPinningError(`Media Pinning Failed: ${fileResult.error}`)
      setPinningStep('error')
      return
    }

    setPinningStep('uploading_meta')

    // 2. Prepare Metadata JSON
    const metadata = {
      name: nftName,
      description: description,
      image: `ipfs://${fileResult.ipfsHash}`,
      external_url: `https://exchange-wallet.io/nft/${nftName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      attributes: traits
        .filter(t => t.key.trim() && t.value.trim())
        .map(t => ({ trait_type: t.key.trim(), value: t.value.trim() })),
      collection: nftCollection === 'Custom' ? customCollection : nftCollection,
      floorPrice: floorPrice,
      rarity: rarity,
    }

    // 3. Upload metadata to IPFS via Pinata
    const metaResult = await pinJSONToIPFS(metadata, `${nftName} Metadata`)
    if (!metaResult.success) {
      setPinningError(`Metadata Pinning Failed: ${metaResult.error}`)
      setPinningStep('error')
      return
    }

    setPinningStep('saving')

    let onChainMintHash = null
    if (walletConnected && nftContractAddress && hasDeployedContracts()) {
      try {
        const tokenUri = `ipfs://${metaResult.ipfsHash}`
        const { hash } = await writeContract({
          address: nftContractAddress,
          abi: abis.SimpleNFT,
          functionName: 'publicMint',
          args: [tokenUri],
          value: BigInt('100000000000000'),
        })
        onChainMintHash = hash
        setMintTxHash(hash)
      } catch (err) {
        setPinningError(`On-chain mint failed: ${err.shortMessage || err.message}. IPFS assets were pinned.`)
        setPinningStep('error')
        setIsPinning(false)
        return
      }
    }

    const finalCollection = nftCollection === 'Custom' ? customCollection : nftCollection
    const newNFT = {
      id: Date.now(),
      name: nftName,
      collection: finalCollection,
      floorPrice: floorPrice,
      estimatedValue: `$${(parseFloat(floorPrice) * 3800 || 380).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      rarity: rarity,
      traits: traits.filter(t => t.key.trim() && t.value.trim()),
      hue: Math.floor(Math.random() * 360),
      pattern: finalCollection.toLowerCase().replace(/[^a-z]/g, '') || 'punk',
      image: fileResult.gatewayUrl, // Display the pinned media gateway link directly in the app
      metadataIpfs: metaResult.ipfsHash,
      metadataGateway: metaResult.gatewayUrl,
      mintTxHash: onChainMintHash,
    }

    const updatedNfts = [newNFT, ...nfts]
    setNfts(updatedNfts)
    localStorage.setItem('exchange_user_nfts', JSON.stringify(updatedNfts))

    setPinnedResult({
      mediaCid: fileResult.ipfsHash,
      metaCid: metaResult.ipfsHash,
      mediaGateway: fileResult.gatewayUrl,
      metaGateway: metaResult.gatewayUrl,
    })
    setPinningStep('success')
    setIsPinning(false)
  }

  const filteredNFTs = nfts
    .filter(nft => filter === 'All' || nft.collection === filter)
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'rarity') {
        const order = { 'Legendary': 0, 'Epic': 1, 'Rare': 2, 'Uncommon': 3, 'Common': 4 }
        return (order[a.rarity] || 5) - (order[b.rarity] || 5)
      }
      return parseFloat(b.floorPrice) - parseFloat(a.floorPrice) // value desc
    })

  const totalValue = nfts.reduce((sum, nft) => {
    return sum + parseFloat(nft.estimatedValue.replace(/[$,]/g, ''))
  }, 0)

  return (
    <DashboardLayout activeOverride="nft">
      <div className={styles.container}>

        <NetworkBanner />

        {/* Header */}
        <header className={styles.header}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <h1 className={styles.title}>NFT Gallery</h1>
              <button className={styles.mintBtn} onClick={() => setIsPinningModalOpen(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Pin NFT to IPFS{walletConnected && nftContractAddress ? ' & Mint' : ''}
              </button>
            </div>
            <p className={styles.subtitle}>Browse and manage your NFT collection</p>
          </div>
          <div className={styles.headerStats}>
            <div className={styles.headerStat}>
              <span className={styles.headerStatLabel}>Total NFTs</span>
              <span className={styles.headerStatValue}>{nfts.length}</span>
            </div>
            <div className={styles.headerStatDivider} />
            <div className={styles.headerStat}>
              <span className={styles.headerStatLabel}>Est. Total Value</span>
              <span className={styles.headerStatValue}>${totalValue.toLocaleString()}</span>
            </div>
            <div className={styles.headerStatDivider} />
            <div className={styles.headerStat}>
              <span className={styles.headerStatLabel}>Collections</span>
              <span className={styles.headerStatValue}>{collectionsList.length - 1}</span>
            </div>
          </div>
        </header>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          {/* Collection Filter */}
          <div className={styles.filterScroll}>
            {collectionsList.map(col => (
              <button
                key={col}
                className={`${styles.filterBtn} ${filter === col ? styles.filterActive : ''}`}
                onClick={() => setFilter(col)}
              >
                {col}
              </button>
            ))}
          </div>

          <div className={styles.toolbarRight}>
            {/* Sort */}
            <select
              className={styles.sortSelect}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="value">Sort: Value</option>
              <option value="name">Sort: Name</option>
              <option value="rarity">Sort: Rarity</option>
            </select>

            {/* View Toggle */}
            <div className={styles.viewToggle}>
              <button
                className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewActive : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor"/>
                  <rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor"/>
                  <rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor"/>
                  <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor"/>
                </svg>
              </button>
              <button
                className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewActive : ''}`}
                onClick={() => setViewMode('list')}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="2" width="14" height="3" rx="1" fill="currentColor"/>
                  <rect x="1" y="7" width="14" height="3" rx="1" fill="currentColor"/>
                  <rect x="1" y="12" width="14" height="3" rx="1" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* NFT Grid / List */}
        {filteredNFTs.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No NFTs found in this collection.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className={styles.nftGrid}>
            {filteredNFTs.map((nft, i) => (
              <div
                key={nft.id}
                className={styles.nftCard}
                style={{ '--i': i }}
                onClick={() => setSelectedNFT(nft)}
              >
                <NFTArt image={nft.image} hue={nft.hue} pattern={nft.pattern} rarity={nft.rarity} name={nft.name} />
                <div className={styles.nftInfo}>
                  <div className={styles.nftTop}>
                    <span className={styles.nftName}>{nft.name}</span>
                    <span className={`${styles.rarityDot} ${styles[`rarity${nft.rarity}`]}`} />
                  </div>
                  <span className={styles.nftCollection}>{nft.collection}</span>
                  <div className={styles.nftPriceRow}>
                    <div>
                      <span className={styles.nftPriceLabel}>Floor</span>
                      <span className={styles.nftPrice}>{nft.floorPrice}</span>
                    </div>
                    <div>
                      <span className={styles.nftPriceLabel}>Value</span>
                      <span className={styles.nftValue}>{nft.estimatedValue}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.nftList}>
            {filteredNFTs.map((nft, i) => (
              <div
                key={nft.id}
                className={styles.nftListItem}
                style={{ '--i': i }}
                onClick={() => setSelectedNFT(nft)}
              >
                <div className={styles.listArtThumb}>
                  <NFTArt image={nft.image} hue={nft.hue} pattern={nft.pattern} rarity={nft.rarity} name={nft.name} />
                </div>
                <div className={styles.listInfo}>
                  <span className={styles.listName}>{nft.name}</span>
                  <span className={styles.listCollection}>{nft.collection}</span>
                </div>
                <span className={`${styles.rarityBadge} ${styles[`rarity${nft.rarity}`]}`}>
                  {nft.rarity}
                </span>
                <span className={styles.listFloor}>{nft.floorPrice}</span>
                <span className={styles.listValue}>{nft.estimatedValue}</span>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        <NFTModal nft={selectedNFT} onClose={() => setSelectedNFT(null)} />

        {/* Pin to IPFS Modal */}
        {isPinningModalOpen && (
          <div className={styles.modalOverlay} onClick={resetMintForm}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
              <button className={styles.modalClose} onClick={() => { setIsPinningModalOpen(false); resetMintForm(); }}>✕</button>
              
              <div style={{ padding: '28px' }}>
                <h3 className={styles.modalTitle}>Pin & Mint NFT on Sepolia</h3>

                {pinningStep === 'idle' && (
                  <form onSubmit={handlePinNFT} className={styles.mintForm}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>NFT Asset Name *</label>
                      <input 
                        type="text" 
                        required 
                        className={styles.formInput} 
                        placeholder="e.g. My Cosmic Bored Ape" 
                        value={nftName} 
                        onChange={(e) => setNftName(e.target.value)} 
                      />
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Collection *</label>
                        <select 
                          className={styles.formSelect} 
                          value={nftCollection} 
                          onChange={(e) => setNftCollection(e.target.value)}
                        >
                          <option value="CryptoPunks">CryptoPunks</option>
                          <option value="Bored Ape YC">Bored Ape YC</option>
                          <option value="Azuki">Azuki</option>
                          <option value="Pudgy Penguins">Pudgy Penguins</option>
                          <option value="Doodles">Doodles</option>
                          <option value="Moonbirds">Moonbirds</option>
                          <option value="Custom">-- Custom Collection --</option>
                        </select>
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Floor Price *</label>
                        <input 
                          type="text" 
                          required 
                          className={styles.formInput} 
                          placeholder="e.g. 0.5 ETH" 
                          value={floorPrice} 
                          onChange={(e) => setFloorPrice(e.target.value)} 
                        />
                      </div>
                    </div>

                    {nftCollection === 'Custom' && (
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Custom Collection Name *</label>
                        <input 
                          type="text" 
                          required 
                          className={styles.formInput} 
                          placeholder="e.g. CyberKongz" 
                          value={customCollection} 
                          onChange={(e) => setCustomCollection(e.target.value)} 
                        />
                      </div>
                    )}

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Rarity Tier</label>
                      <select 
                        className={styles.formSelect} 
                        value={rarity} 
                        onChange={(e) => setRarity(e.target.value)}
                      >
                        <option value="Common">Common</option>
                        <option value="Uncommon">Uncommon</option>
                        <option value="Rare">Rare</option>
                        <option value="Epic">Epic</option>
                        <option value="Legendary">Legendary</option>
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>NFT Description *</label>
                      <textarea 
                        required 
                        className={styles.formTextarea} 
                        placeholder="Provide details about this digital asset..." 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <div className={styles.traitsHeaderRow}>
                        <label className={styles.formLabel}>Attributes / Traits</label>
                        <button type="button" className={styles.addTraitLink} onClick={handleAddTrait}>+ Add Trait</button>
                      </div>
                      <div className={styles.traitsFormList}>
                        {traits.map((trait, idx) => (
                          <div key={idx} className={styles.traitFormRow}>
                            <input 
                              type="text" 
                              placeholder="Trait type (e.g. Background)" 
                              className={styles.formInput} 
                              value={trait.key} 
                              onChange={(e) => handleUpdateTrait(idx, 'key', e.target.value)} 
                            />
                            <input 
                              type="text" 
                              placeholder="Value (e.g. Purple)" 
                              className={styles.formInput} 
                              value={trait.value} 
                              onChange={(e) => handleUpdateTrait(idx, 'value', e.target.value)} 
                            />
                            <button type="button" className={styles.removeTraitBtn} onClick={() => handleRemoveTrait(idx)}>✕</button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>NFT Media File *</label>
                      {!selectedFile ? (
                        <div className={styles.dragDropArea} onClick={() => document.getElementById('nftFileInput').click()}>
                          <input 
                            type="file" 
                            id="nftFileInput" 
                            accept="image/*" 
                            style={{ display: 'none' }} 
                            onChange={handleFileChange} 
                          />
                          <svg className={styles.uploadIcon} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                          </svg>
                          <span className={styles.uploadText}>Select or drag your NFT image</span>
                          <span className={styles.uploadSubtext}>Supports PNG, JPG, JPEG, GIF</span>
                        </div>
                      ) : (
                        <div className={styles.previewContainer}>
                          <img src={previewUrl} className={styles.imgPreview} alt="NFT Preview" />
                          <button type="button" className={styles.removeImgBtn} onClick={handleRemoveFile}>✕</button>
                        </div>
                      )}
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={!nftName || !description || !selectedFile || isPinning}>
                      {walletConnected && nftContractAddress ? 'Pin to IPFS & Mint On-Chain' : 'Upload & Pin to IPFS'}
                    </button>
                  </form>
                )}

                {isPinning && pinningStep !== 'success' && pinningStep !== 'error' && (
                  <div className={styles.pinningOverlay}>
                    <div className={styles.spinner}></div>
                    <h4 className={styles.pinningTitle}>Pinning NFT to IPFS</h4>
                    <p className={styles.pinningDesc}>Please wait while your assets are securely uploaded and pinned via Pinata API.</p>
                    
                    <div className={styles.pinningSteps}>
                      <div className={styles.pinningStep}>
                        <div className={`${styles.stepDot} ${
                          pinningStep === 'uploading_media' ? styles.stepDotActive : 
                          (pinningStep === 'uploading_meta' || pinningStep === 'saving' ? styles.stepDotSuccess : styles.stepDotPending)
                        }`}>
                          {pinningStep === 'uploading_meta' || pinningStep === 'saving' ? '✓' : '1'}
                        </div>
                        <span className={`${styles.stepText} ${
                          pinningStep === 'uploading_media' ? styles.stepTextActive : 
                          (pinningStep === 'uploading_meta' || pinningStep === 'saving' ? styles.stepTextSuccess : '')
                        }`}>
                          Uploading NFT Image to IPFS...
                        </span>
                      </div>

                      <div className={styles.pinningStep}>
                        <div className={`${styles.stepDot} ${
                          pinningStep === 'uploading_meta' ? styles.stepDotActive : 
                          (pinningStep === 'saving' ? styles.stepDotSuccess : styles.stepDotPending)
                        }`}>
                          {pinningStep === 'saving' ? '✓' : '2'}
                        </div>
                        <span className={`${styles.stepText} ${
                          pinningStep === 'uploading_meta' ? styles.stepTextActive : 
                          (pinningStep === 'saving' ? styles.stepTextSuccess : '')
                        }`}>
                          Generating & Pinning Metadata JSON...
                        </span>
                      </div>

                      <div className={styles.pinningStep}>
                        <div className={`${styles.stepDot} ${
                          pinningStep === 'saving' ? styles.stepDotActive : styles.stepDotPending
                        }`}>
                          3
                        </div>
                        <span className={`${styles.stepText} ${
                          pinningStep === 'saving' ? styles.stepTextActive : ''
                        }`}>
                          Saving Asset to Gallery...
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {pinningStep === 'error' && (
                  <div className={styles.pinningOverlay}>
                    <span className={styles.errorIcon}>⚠️</span>
                    <h4 className={styles.pinningTitle} style={{ color: '#ef4444' }}>Upload Failed</h4>
                    <p className={styles.errorText}>{pinningError}</p>
                    <button className={styles.doneBtn} onClick={() => setPinningStep('idle')} style={{ background: '#ef4444' }}>
                      Try Again
                    </button>
                  </div>
                )}

                {pinningStep === 'success' && pinnedResult && (
                  <div className={styles.pinningOverlay}>
                    <span className={styles.successIcon}>🎉</span>
                    <h4 className={styles.pinningTitle}>NFT Successfully Pinned{mintTxHash ? ' & Minted' : ''}!</h4>
                    <p className={styles.pinningDesc} style={{ marginBottom: '18px' }}>
                      {mintTxHash
                        ? 'Your NFT metadata is on IPFS and minted to your wallet on Sepolia.'
                        : 'Your NFT asset and metadata are decentralized on IPFS. Connect wallet + deploy contracts to mint on-chain.'}
                    </p>
                    
                    <div className={styles.successDetails}>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Asset CID (IPFS Hash)</span>
                        <span className={styles.detailVal}>{pinnedResult.mediaCid}</span>
                        <a href={pinnedResult.mediaGateway} target="_blank" rel="noreferrer" className={styles.detailLink}>
                          View Image on IPFS Gateway ↗
                        </a>
                      </div>

                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Metadata CID (IPFS Hash)</span>
                        <span className={styles.detailVal}>{pinnedResult.metaCid}</span>
                        <a href={pinnedResult.metaGateway} target="_blank" rel="noreferrer" className={styles.detailLink}>
                          View Metadata JSON ↗
                        </a>
                      </div>

                      {mintTxHash && (
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Mint Transaction</span>
                          <span className={styles.detailVal}>{mintTxHash}</span>
                          <a href={getExplorerTxUrl(mintTxHash)} target="_blank" rel="noreferrer" className={styles.detailLink}>
                            View on Etherscan ↗
                          </a>
                        </div>
                      )}
                    </div>

                    <button className={styles.doneBtn} onClick={() => { setIsPinningModalOpen(false); resetMintForm(); }}>
                      Back to Gallery
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
