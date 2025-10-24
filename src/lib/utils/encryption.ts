import crypto from 'crypto'

// Encryption configuration
const ALGORITHM = 'aes-256-cbc'
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required')
}

// Ensure the encryption key is 32 bytes (256 bits)
const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)

/**
 * Encrypts a string using AES-256-CBC encryption
 * @param text - The text to encrypt
 * @returns The encrypted text in format: iv:encryptedData
 */
export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    // Return IV and encrypted data separated by colon
    return iv.toString('hex') + ':' + encrypted
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypts a string that was encrypted using AES-256-CBC encryption
 * @param encryptedText - The encrypted text in format: iv:encryptedData
 * @returns The decrypted text
 */
export function decrypt(encryptedText: string): string {
  try {
    const parts = encryptedText.split(':')
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted text format')
    }
    
    const iv = Buffer.from(parts[0], 'hex')
    const encryptedData = parts[1]
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Generates a secure random string for use as encryption keys
 * @param length - The length of the string to generate (default: 32)
 * @returns A random hex string
 */
export function generateSecureKey(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Creates a hash of the input string using SHA-256
 * @param input - The string to hash
 * @returns The SHA-256 hash as a hex string
 */
export function createHash(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex')
}

/**
 * Validates that an encrypted string can be decrypted
 * @param encryptedText - The encrypted text to validate
 * @returns True if the text can be decrypted, false otherwise
 */
export function validateEncryption(encryptedText: string): boolean {
  try {
    decrypt(encryptedText)
    return true
  } catch {
    return false
  }
}
