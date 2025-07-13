import { EncryptedBlob, DecryptParams, SolaceSDKError } from './types';

/**
 * Encryption utilities using Web Crypto API with AES-GCM 256
 */
export class CryptoManager {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12; // 96 bits for GCM

  /**
   * Generate a random encryption key
   */
  static async generateKey(): Promise<CryptoKey> {
    try {
      return await crypto.subtle.generateKey(
        {
          name: this.ALGORITHM,
          length: this.KEY_LENGTH,
        },
        true, // extractable
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      throw new SolaceSDKError(
        'Failed to generate encryption key',
        'KEY_GENERATION_ERROR',
        error
      );
    }
  }

  /**
   * Import a key from raw bytes
   */
  static async importKey(keyData: ArrayBuffer): Promise<CryptoKey> {
    try {
      return await crypto.subtle.importKey(
        'raw',
        keyData,
        {
          name: this.ALGORITHM,
          length: this.KEY_LENGTH,
        },
        false, // not extractable
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      throw new SolaceSDKError(
        'Failed to import encryption key',
        'KEY_IMPORT_ERROR',
        error
      );
    }
  }

  /**
   * Export a key to raw bytes
   */
  static async exportKey(key: CryptoKey): Promise<ArrayBuffer> {
    try {
      return await crypto.subtle.exportKey('raw', key);
    } catch (error) {
      throw new SolaceSDKError(
        'Failed to export encryption key',
        'KEY_EXPORT_ERROR',
        error
      );
    }
  }

  /**
   * Encrypt data using AES-GCM 256
   * @param data - String data to encrypt
   * @returns Promise<EncryptedBlob> - Object containing iv, ciphertext, and tag
   */
  static async encryptBlob(data: string): Promise<EncryptedBlob> {
    try {
      // Generate a new key for this encryption
      const key = await this.generateKey();
      
      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
      
      // Convert string to ArrayBuffer
      const encoder = new TextEncoder();
      const plaintext = encoder.encode(data);
      
      // Encrypt the data
      const encrypted = await crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv: iv,
        },
        key,
        plaintext
      );
      
      // Extract ciphertext and tag from encrypted data
      // In AES-GCM, the tag is appended to the ciphertext
      const ciphertextLength = encrypted.byteLength - 16; // 16 bytes for tag
      const ciphertext = encrypted.slice(0, ciphertextLength);
      const tag = encrypted.slice(ciphertextLength);
      
      // Export the key for storage/transmission
      const keyBuffer = await this.exportKey(key);
      
      return {
        iv: this.arrayBufferToBase64(iv),
        ciphertext: this.arrayBufferToBase64(ciphertext),
        tag: this.arrayBufferToBase64(tag),
      };
    } catch (error) {
      throw new SolaceSDKError(
        'Encryption failed',
        'ENCRYPTION_ERROR',
        error
      );
    }
  }

  /**
   * Decrypt data using AES-GCM 256
   * @param params - Object containing iv, ciphertext, and tag
   * @param key - CryptoKey or ArrayBuffer for decryption
   * @returns Promise<string> - Decrypted plaintext
   */
  static async decryptBlob(
    params: DecryptParams,
    key: CryptoKey | ArrayBuffer
  ): Promise<string> {
    try {
      // Import key if it's an ArrayBuffer
      const cryptoKey = key instanceof CryptoKey 
        ? key 
        : await this.importKey(key);
      
      // Convert base64 strings back to ArrayBuffers
      const iv = this.base64ToArrayBuffer(params.iv);
      const ciphertext = this.base64ToArrayBuffer(params.ciphertext);
      const tag = this.base64ToArrayBuffer(params.tag);
      
      // Combine ciphertext and tag for decryption
      const encryptedData = new Uint8Array(ciphertext.byteLength + tag.byteLength);
      encryptedData.set(new Uint8Array(ciphertext), 0);
      encryptedData.set(new Uint8Array(tag), ciphertext.byteLength);
      
      // Decrypt the data
      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: iv,
        },
        cryptoKey,
        encryptedData.buffer
      );
      
      // Convert ArrayBuffer back to string
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      throw new SolaceSDKError(
        'Decryption failed',
        'DECRYPTION_ERROR',
        error
      );
    }
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 string to ArrayBuffer
   */
  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

// Export convenience functions
export const encryptBlob = CryptoManager.encryptBlob.bind(CryptoManager);
export const decryptBlob = CryptoManager.decryptBlob.bind(CryptoManager); 