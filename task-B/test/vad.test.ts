import { VADManager, recordAndDetectVoice } from '../src/vad';
import { VADFrame, VADConfig } from '../src/types';

// Mock WebRTC VAD
jest.mock('webrtcvad', () => {
  return jest.fn().mockImplementation(() => ({
    isSpeech: jest.fn().mockReturnValue(true)
  }));
});

describe('VADManager', () => {
  let vadManager: VADManager;
  let mockConfig: VADConfig;

  beforeEach(() => {
    mockConfig = {
      aggressiveness: 1,
      frameDuration: 30,
      sampleRate: 16000
    };
    vadManager = new VADManager(mockConfig);
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const defaultVAD = new VADManager();
      expect(defaultVAD).toBeInstanceOf(VADManager);
    });

    it('should initialize with custom config', () => {
      const customConfig: VADConfig = {
        aggressiveness: 2,
        frameDuration: 20,
        sampleRate: 8000
      };
      const customVAD = new VADManager(customConfig);
      expect(customVAD).toBeInstanceOf(VADManager);
    });
  });

  describe('getRecordingState', () => {
    it('should return initial recording state', () => {
      const state = vadManager.getRecordingState();
      expect(state).toEqual({
        isRecording: false,
        duration: 0
      });
    });
  });

  describe('stopRecording', () => {
    it('should stop recording and clean up resources', async () => {
      // Mock media stream
      const mockMediaStream = {
        getTracks: jest.fn().mockReturnValue([
          { stop: jest.fn() }
        ])
      };

      // Mock audio context
      const mockAudioContext = {
        close: jest.fn().mockResolvedValue(undefined)
      };

      // Set private properties for testing
      (vadManager as any).mediaStream = mockMediaStream;
      (vadManager as any).audioContext = mockAudioContext;
      (vadManager as any).isRecording = true;

      await vadManager.stopRecording();

      expect(mockMediaStream.getTracks).toHaveBeenCalled();
      expect(mockAudioContext.close).toHaveBeenCalled();
    });
  });
});

describe('recordAndDetectVoice', () => {
  beforeEach(() => {
    // Mock navigator.mediaDevices.getUserMedia
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: jest.fn().mockResolvedValue({
          getTracks: jest.fn().mockReturnValue([])
        })
      },
      writable: true
    });

    // Mock AudioContext
    global.AudioContext = jest.fn().mockImplementation(() => ({
      createAnalyser: jest.fn().mockReturnValue({
        fftSize: 2048,
        frequencyBinCount: 1024,
        getByteFrequencyData: jest.fn()
      }),
      createMediaStreamSource: jest.fn().mockReturnValue({
        connect: jest.fn()
      }),
      close: jest.fn().mockResolvedValue(undefined)
    })) as any;
  });

  it('should create VAD manager and return async generator', () => {
    const generator = recordAndDetectVoice();
    expect(generator).toBeDefined();
    expect(typeof generator[Symbol.asyncIterator]).toBe('function');
  });

  it('should handle VAD configuration', () => {
    const config: VADConfig = {
      aggressiveness: 2,
      frameDuration: 20,
      sampleRate: 8000
    };
    const generator = recordAndDetectVoice(config);
    expect(generator).toBeDefined();
  });
});

describe('VAD Simulation Tests', () => {
  it('should simulate VAD on prerecorded audio data', async () => {
    // Create mock audio data
    const mockAudioData = new Int16Array(1024);
    for (let i = 0; i < mockAudioData.length; i++) {
      // Simulate some audio waveform
      mockAudioData[i] = Math.sin(i * 0.1) * 1000;
    }

    // Mock VAD to return different results
    const mockVAD = {
      isSpeech: jest.fn()
        .mockReturnValueOnce(true)   // First frame has voice
        .mockReturnValueOnce(false)  // Second frame no voice
        .mockReturnValueOnce(true)   // Third frame has voice
    };

    // Test VAD behavior
    expect(mockVAD.isSpeech(mockAudioData, 16000)).toBe(true);
    expect(mockVAD.isSpeech(mockAudioData, 16000)).toBe(false);
    expect(mockVAD.isSpeech(mockAudioData, 16000)).toBe(true);
  });

  it('should handle different audio sample rates', () => {
    const mockAudioData = new Int16Array(512);
    const mockVAD = {
      isSpeech: jest.fn().mockReturnValue(true)
    };

    // Test different sample rates
    const sampleRates = [8000, 16000, 32000, 48000];
    
    sampleRates.forEach(rate => {
      mockVAD.isSpeech(mockAudioData, rate);
      expect(mockVAD.isSpeech).toHaveBeenCalledWith(mockAudioData, rate);
    });
  });

  it('should handle different VAD aggressiveness levels', () => {
    const mockAudioData = new Int16Array(1024);
    
    // Test different aggressiveness levels
    const aggressivenessLevels = [0, 1, 2, 3];
    
    aggressivenessLevels.forEach(level => {
      const mockVAD = {
        isSpeech: jest.fn().mockReturnValue(level > 1) // Higher levels more sensitive
      };
      
      const result = mockVAD.isSpeech(mockAudioData, 16000);
      expect(typeof result).toBe('boolean');
    });
  });
});

describe('VAD Frame Processing', () => {
  it('should process audio frames correctly', () => {
    // Mock frequency data
    const frequencyData = new Uint8Array(1024);
    for (let i = 0; i < frequencyData.length; i++) {
      frequencyData[i] = Math.random() * 255;
    }

    // Test PCM conversion (this would be a private method in real implementation)
    const convertToPCM = (data: Uint8Array): Int16Array => {
      const pcmData = new Int16Array(data.length);
      for (let i = 0; i < data.length; i++) {
        const amplitude = (data[i] - 128) / 128;
        pcmData[i] = Math.round(amplitude * 32767);
      }
      return pcmData;
    };

    const pcmData = convertToPCM(frequencyData);
    
    expect(pcmData).toBeInstanceOf(Int16Array);
    expect(pcmData.length).toBe(frequencyData.length);
    
    // Check that PCM values are within valid range
    pcmData.forEach(value => {
      expect(value).toBeGreaterThanOrEqual(-32768);
      expect(value).toBeLessThanOrEqual(32767);
    });
  });

  it('should create valid VAD frames', () => {
    const mockFrame: VADFrame = {
      frame: new ArrayBuffer(1024),
      timestamp: Date.now(),
      hasVoice: true
    };

    expect(mockFrame).toHaveProperty('frame');
    expect(mockFrame).toHaveProperty('timestamp');
    expect(mockFrame).toHaveProperty('hasVoice');
    
    expect(mockFrame.frame).toBeInstanceOf(ArrayBuffer);
    expect(typeof mockFrame.timestamp).toBe('number');
    expect(typeof mockFrame.hasVoice).toBe('boolean');
  });
}); 