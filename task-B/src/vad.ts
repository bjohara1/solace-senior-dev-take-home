import { VADFrame, VADConfig, AudioConfig, SolaceSDKError } from './types';

/**
 * Voice Activity Detection using WebRTC VAD
 */
export class VADManager {
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private vad: any = null; // WebRTC VAD instance
  private isRecording = false;
  private frameQueue: VADFrame[] = [];
  private config: VADConfig;
  private startTime: number = 0;

  constructor(config: VADConfig = {
    aggressiveness: 1,
    frameDuration: 30,
    sampleRate: 16000
  }) {
    this.config = config;
  }

  /**
   * Initialize VAD with WebRTC VAD library
   */
  private async initializeVAD(): Promise<void> {
    try {
      // Dynamic import for WebRTC VAD
      const WebRTCVAD = await import('webrtcvad');
      this.vad = new WebRTCVAD.default(this.config.aggressiveness);
    } catch (error) {
      throw new SolaceSDKError(
        'Failed to initialize VAD',
        'VAD_INIT_ERROR',
        error
      );
    }
  }

  /**
   * Start recording and detecting voice activity
   * @returns AsyncIterable<VADFrame> - Yields frames with voice activity
   */
  async *recordAndDetectVoice(): AsyncIterable<VADFrame> {
    try {
      await this.initializeVAD();
      
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: 1, // Mono for VAD
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Create audio context
      this.audioContext = new AudioContext({
        sampleRate: this.config.sampleRate
      });

      // Create analyser node
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;

      // Connect audio stream to analyser
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      source.connect(this.analyser);

      this.isRecording = true;
      const startTime = Date.now();

      // Process audio frames
      while (this.isRecording) {
        const frame = await this.processAudioFrame(startTime);
        if (frame) {
          yield frame;
        }
        
        // Wait for next frame
        await new Promise(resolve => setTimeout(resolve, this.config.frameDuration));
      }
    } catch (error) {
      throw new SolaceSDKError(
        'Failed to start voice recording',
        'RECORDING_ERROR',
        error
      );
    } finally {
      await this.stopRecording();
    }
  }

  /**
   * Process a single audio frame and detect voice activity
   */
  private async processAudioFrame(startTime: number): Promise<VADFrame | null> {
    if (!this.analyser || !this.vad) {
      return null;
    }

    try {
      // Get audio data
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.analyser.getByteFrequencyData(dataArray);

      // Convert to 16-bit PCM for VAD
      const pcmData = this.convertToPCM(dataArray);
      
      // Check for voice activity
      const hasVoice = this.vad.isSpeech(pcmData, this.config.sampleRate);
      
      const timestamp = Date.now() - startTime;
      
      return {
        frame: pcmData.buffer,
        timestamp,
        hasVoice
      };
    } catch (error) {
      console.warn('Error processing audio frame:', error);
      return null;
    }
  }

  /**
   * Convert frequency data to PCM format for VAD
   */
  private convertToPCM(frequencyData: Uint8Array): Int16Array {
    const pcmData = new Int16Array(frequencyData.length);
    
    for (let i = 0; i < frequencyData.length; i++) {
      // Convert frequency data to amplitude
      const amplitude = (frequencyData[i] - 128) / 128;
      // Convert to 16-bit PCM
      pcmData[i] = Math.round(amplitude * 32767);
    }
    
    return pcmData;
  }

  /**
   * Stop recording and clean up resources
   */
  async stopRecording(): Promise<void> {
    this.isRecording = false;
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
    
    this.analyser = null;
    this.vad = null;
  }

  /**
   * Get current recording state
   */
  getRecordingState(): { isRecording: boolean; duration: number } {
    return {
      isRecording: this.isRecording,
      duration: this.isRecording ? Date.now() - (this.startTime || Date.now()) : 0
    };
  }

  /**
   * Alternative implementation using MediaRecorder for better compatibility
   */
  async *recordWithMediaRecorder(): AsyncIterable<VADFrame> {
    try {
      await this.initializeVAD();
      
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: 1
        }
      });

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      const startTime = Date.now();
      let frameCount = 0;

      return new Promise<void>((resolve, reject) => {
        this.mediaRecorder!.ondataavailable = async (event) => {
          try {
            if (event.data.size > 0) {
              // Convert blob to array buffer
              const arrayBuffer = await event.data.arrayBuffer();
              
              // Process the audio data
              const frame: VADFrame = {
                frame: arrayBuffer,
                timestamp: Date.now() - startTime,
                hasVoice: true // Assume voice for now, could add VAD processing here
              };
              
              frameCount++;
              // Yield the frame (this would need to be handled differently in practice)
            }
          } catch (error) {
            reject(error);
          }
        };

        this.mediaRecorder!.onstop = () => {
          resolve();
        };

        this.mediaRecorder!.onerror = (error) => {
          reject(error);
        };

        // Start recording
        this.mediaRecorder!.start(this.config.frameDuration);
        this.isRecording = true;
      });
    } catch (error) {
      throw new SolaceSDKError(
        'Failed to start MediaRecorder',
        'MEDIA_RECORDER_ERROR',
        error
      );
    }
  }
}

// Export convenience function
export const recordAndDetectVoice = (config?: VADConfig) => {
  const vadManager = new VADManager(config);
  return vadManager.recordAndDetectVoice();
}; 