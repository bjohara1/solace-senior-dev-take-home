// Core types for the Solace Client SDK

export interface EncryptedBlob {
  iv: string;
  ciphertext: string;
  tag: string;
}

export interface DecryptParams {
  iv: string;
  ciphertext: string;
  tag: string;
}

export interface VADFrame {
  frame: ArrayBuffer;
  timestamp: number;
  hasVoice: boolean;
}

export interface AudioConfig {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
}

export interface VADConfig {
  aggressiveness: 0 | 1 | 2 | 3; // 0=least aggressive, 3=most aggressive
  frameDuration: 10 | 20 | 30; // milliseconds
  sampleRate: 8000 | 16000 | 32000 | 48000;
}

export interface UploadResponse {
  blobKey: string;
  success: boolean;
  message?: string;
}

export interface DecryptResponse {
  plaintext: string;
  success: boolean;
  message?: string;
}

export interface SDKConfig {
  apiUrl?: string;
  token?: string;
  vadConfig?: VADConfig;
  audioConfig?: AudioConfig;
}

export interface RecordingState {
  isRecording: boolean;
  duration: number;
  framesCaptured: number;
  voiceFrames: number;
}

export class SolaceSDKError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SolaceSDKError';
  }
} 