import { UploadResponse, DecryptResponse, SolaceSDKError } from './types';

/**
 * API helpers for uploading and downloading encrypted blobs
 */
export class APIManager {
  private apiUrl: string;
  private token: string | null;

  constructor(apiUrl: string, token?: string) {
    this.apiUrl = apiUrl;
    this.token = token || null;
  }

  /**
   * Upload encrypted blob to Task A endpoint
   * @param blob - Encrypted blob data
   * @param apiUrl - Task A API endpoint URL
   * @param token - Authentication token (optional)
   * @returns Promise<string> - blobKey for the uploaded blob
   */
  static async uploadBlob(
    blob: Blob | ArrayBuffer,
    apiUrl: string,
    token?: string
  ): Promise<string> {
    try {
      // Convert ArrayBuffer to Blob if needed
      const blobData = blob instanceof Blob ? blob : new Blob([blob]);
      
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('blob', blobData, 'encrypted-blob');
      
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'multipart/form-data',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Upload to Task A endpoint
      const response = await fetch(`${apiUrl}/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result: UploadResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Upload failed');
      }

      return result.blobKey;
    } catch (error) {
      throw new SolaceSDKError(
        'Failed to upload blob',
        'UPLOAD_ERROR',
        error
      );
    }
  }

  /**
   * Download and decrypt blob from Task A endpoint
   * @param blobKey - Key identifying the blob to download
   * @param apiUrl - Task A API endpoint URL
   * @param key - Decryption key (CryptoKey or ArrayBuffer)
   * @returns Promise<string> - Decrypted plaintext
   */
  static async downloadAndDecrypt(
    blobKey: string,
    apiUrl: string,
    key: CryptoKey | ArrayBuffer
  ): Promise<string> {
    try {
      // Download encrypted blob from Task A
      const response = await fetch(`${apiUrl}/decrypt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ blobKey }),
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      const result: DecryptResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Download failed');
      }

      // The Task A endpoint should return the decrypted plaintext directly
      return result.plaintext;
    } catch (error) {
      throw new SolaceSDKError(
        'Failed to download and decrypt blob',
        'DOWNLOAD_ERROR',
        error
      );
    }
  }

  /**
   * Alternative implementation that downloads encrypted blob and decrypts locally
   */
  static async downloadAndDecryptLocal(
    blobKey: string,
    apiUrl: string,
    key: CryptoKey | ArrayBuffer
  ): Promise<string> {
    try {
      // Download encrypted blob
      const response = await fetch(`${apiUrl}/download/${blobKey}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      // Get encrypted data
      const encryptedData = await response.arrayBuffer();
      
      // Parse the encrypted blob format (assuming it contains iv, ciphertext, tag)
      const encryptedBlob = this.parseEncryptedBlob(encryptedData);
      
      // Decrypt locally using the crypto module
      const { decryptBlob } = await import('./crypto');
      return await decryptBlob(encryptedBlob, key);
    } catch (error) {
      throw new SolaceSDKError(
        'Failed to download and decrypt blob locally',
        'DOWNLOAD_LOCAL_ERROR',
        error
      );
    }
  }

  /**
   * Parse encrypted blob from ArrayBuffer
   */
  private static parseEncryptedBlob(data: ArrayBuffer): {
    iv: string;
    ciphertext: string;
    tag: string;
  } {
    try {
      // Assuming the blob is stored as JSON string
      const decoder = new TextDecoder();
      const jsonString = decoder.decode(data);
      return JSON.parse(jsonString);
    } catch (error) {
      throw new SolaceSDKError(
        'Failed to parse encrypted blob',
        'PARSE_ERROR',
        error
      );
    }
  }

  /**
   * Upload encrypted blob using instance method
   */
  async uploadBlob(blob: Blob | ArrayBuffer): Promise<string> {
    return APIManager.uploadBlob(blob, this.apiUrl, this.token || undefined);
  }

  /**
   * Download and decrypt blob using instance method
   */
  async downloadAndDecrypt(
    blobKey: string,
    key: CryptoKey | ArrayBuffer
  ): Promise<string> {
    return APIManager.downloadAndDecrypt(blobKey, this.apiUrl, key);
  }

  /**
   * Download and decrypt blob locally using instance method
   */
  async downloadAndDecryptLocal(
    blobKey: string,
    key: CryptoKey | ArrayBuffer
  ): Promise<string> {
    return APIManager.downloadAndDecryptLocal(blobKey, this.apiUrl, key);
  }
}

// Export convenience functions
export const uploadBlob = APIManager.uploadBlob.bind(APIManager);
export const downloadAndDecrypt = APIManager.downloadAndDecrypt.bind(APIManager);
export const downloadAndDecryptLocal = APIManager.downloadAndDecryptLocal.bind(APIManager); 