const PINATA_JWT = import.meta.env.VITE_PINATA_JWT

/**
 * Pins a file to IPFS via Pinata.
 * @param {File} file - The file object to upload.
 * @param {string} name - Name identifier for Pinata dashboard.
 * @returns {Promise<{success: boolean, ipfsHash?: string, gatewayUrl?: string, error?: string}>}
 */
export async function pinFileToIPFS(file, name) {
  try {
    if (!PINATA_JWT) {
      throw new Error('Pinata JWT is not configured in environment variables.')
    }

    const formData = new FormData()
    formData.append('file', file)

    const metadata = JSON.stringify({
      name: name || `ExChange NFT Asset - ${Date.now()}`,
    })
    formData.append('pinataMetadata', metadata)

    const options = JSON.stringify({
      cidVersion: 0,
    })
    formData.append('pinataOptions', options)

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Pinata API error: ${response.status} - ${errText}`)
    }

    const data = await response.json()
    return {
      success: true,
      ipfsHash: data.IpfsHash,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`,
    }
  } catch (error) {
    console.error('Error pinning file to Pinata:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Pins JSON metadata to IPFS via Pinata.
 * @param {object} jsonBody - The metadata object (attributes, name, description, image URL).
 * @param {string} name - Name identifier for Pinata dashboard.
 * @returns {Promise<{success: boolean, ipfsHash?: string, gatewayUrl?: string, error?: string}>}
 */
export async function pinJSONToIPFS(jsonBody, name) {
  try {
    if (!PINATA_JWT) {
      throw new Error('Pinata JWT is not configured in environment variables.')
    }

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataContent: jsonBody,
        pinataMetadata: {
          name: name || `ExChange NFT Metadata - ${Date.now()}`,
        },
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Pinata API error: ${response.status} - ${errText}`)
    }

    const data = await response.json()
    return {
      success: true,
      ipfsHash: data.IpfsHash,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`,
    }
  } catch (error) {
    console.error('Error pinning JSON to Pinata:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}
