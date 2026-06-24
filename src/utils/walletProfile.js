const PROFILE_PREFIX = 'exchange_wallet_profile_'

export function saveWalletProfile(address, profile) {
  if (!address) return
  const key = `${PROFILE_PREFIX}${address.toLowerCase()}`
  const existing = getWalletProfile(address)
  const next = {
    ...existing,
    ...profile,
    address: address.toLowerCase(),
    updatedAt: Date.now(),
  }
  localStorage.setItem(key, JSON.stringify(next))
  localStorage.setItem('exchange_active_wallet', address.toLowerCase())
  return next
}

export function getWalletProfile(address) {
  if (!address) return null
  try {
    const raw = localStorage.getItem(`${PROFILE_PREFIX}${address.toLowerCase()}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function getActiveWalletAddress() {
  return localStorage.getItem('exchange_active_wallet')
}

export function clearWalletSession() {
  localStorage.removeItem('exchange_active_wallet')
  localStorage.removeItem('exchange_user')
}
