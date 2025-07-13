// Main entry point for @solace/client-sdk

// Export types
export * from './types';

// Export crypto functions
export { 
  CryptoManager, 
  encryptBlob, 
  decryptBlob 
} from './crypto';

// Export VAD functions
export { 
  VADManager, 
  recordAndDetectVoice 
} from './vad';

// Export API functions
export { 
  APIManager, 
  uploadBlob, 
  downloadAndDecrypt, 
  downloadAndDecryptLocal 
} from './api';

// Main SDK class
import { SDKConfig, VADConfig, AudioConfig } from './types';
import { CryptoManager } from './crypto';
import { VADManager } from './vad';
import { APIManager } from './api';

/**
 * Main Solace Client SDK class
 */
export class SolaceClientSDK {
  private config: SDKConfig;
  private cryptoManager!: CryptoManager;
  private vadManager: VADManager | null = null;
  private apiManager: APIManager | null = null;

  constructor(config: SDKConfig = {}) {
    this.config = {
      vadConfig: {
        aggressiveness: 1,
        frameDuration: 30,
        sampleRate: 16000
      },
      audioConfig: {
        sampleRate: 16000,
        channels: 1,
        bitsPerSample: 16
      },
      ...config
    };
  }

  /**
   * Initialize the SDK
   */
  async initialize(): Promise<void> {
    // Initialize VAD if needed
    if (this.config.vadConfig) {
      this.vadManager = new VADManager(this.config.vadConfig);
    }

    // Initialize API manager if URL is provided
    if (this.config.apiUrl) {
      this.apiManager = new APIManager(this.config.apiUrl, this.config.token);
    }
  }

  /**
   * Encrypt data using AES-GCM 256
   */
  async encrypt(data: string) {
    return CryptoManager.encryptBlob(data);
  }

  /**
   * Decrypt data using AES-GCM 256
   */
  async decrypt(params: { iv: string; ciphertext: string; tag: string }, key: CryptoKey | ArrayBuffer) {
    return CryptoManager.decryptBlob(params, key);
  }

  /**
   * Start voice activity detection recording
   */
  async *recordVoice() {
    if (!this.vadManager) {
      throw new Error('VAD not initialized. Call initialize() first.');
    }
    yield* this.vadManager.recordAndDetectVoice();
  }

  /**
   * Upload encrypted blob
   */
  async uploadBlob(blob: Blob | ArrayBuffer): Promise<string> {
    if (!this.apiManager) {
      throw new Error('API not initialized. Provide apiUrl in config.');
    }
    return this.apiManager.uploadBlob(blob);
  }

  /**
   * Download and decrypt blob
   */
  async downloadAndDecrypt(blobKey: string, key: CryptoKey | ArrayBuffer): Promise<string> {
    if (!this.apiManager) {
      throw new Error('API not initialized. Provide apiUrl in config.');
    }
    return this.apiManager.downloadAndDecrypt(blobKey, key);
  }

  /**
   * Generate a new encryption key
   */
  async generateKey(): Promise<CryptoKey> {
    return CryptoManager.generateKey();
  }

  /**
   * Import key from raw bytes
   */
  async importKey(keyData: ArrayBuffer): Promise<CryptoKey> {
    return CryptoManager.importKey(keyData);
  }

  /**
   * Export key to raw bytes
   */
  async exportKey(key: CryptoKey): Promise<ArrayBuffer> {
    return CryptoManager.exportKey(key);
  }

  /**
   * Get SDK configuration
   */
  getConfig(): SDKConfig {
    return { ...this.config };
  }

  /**
   * Update SDK configuration
   */
  updateConfig(newConfig: Partial<SDKConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Default export
export default SolaceClientSDK;

// Convenience exports for direct usage
export const createSDK = (config?: SDKConfig) => new SolaceClientSDK(config); 