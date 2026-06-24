/**
 * Safely decodes a Google JWT / ID token payload.
 * Standard atob() throws an error on non-ASCII / UTF-8 characters (e.g. names with accents or emojis).
 * This helper uses decodeURIComponent and percent encoding to support all UTF-8 characters.
 * 
 * @param {string} token - The raw JWT ID token string.
 * @returns {object|null} The decoded JSON payload, or null if invalid.
 */
export function decodeGoogleJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    const binaryStr = atob(base64);
    const percentEncodedStr = binaryStr
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('');
      
    return JSON.parse(decodeURIComponent(percentEncodedStr));
  } catch (error) {
    console.error('Error decoding Google JWT token:', error);
    return null;
  }
}
