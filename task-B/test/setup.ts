// Jest setup file for browser API mocks

// Mock Web Crypto API
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      generateKey: jest.fn().mockResolvedValue({
        type: 'secret',
        extractable: true,
        algorithm: { name: 'AES-GCM', length: 256 }
      }),
      importKey: jest.fn().mockResolvedValue({
        type: 'secret',
        extractable: false,
        algorithm: { name: 'AES-GCM', length: 256 }
      }),
      exportKey: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
      encrypt: jest.fn().mockResolvedValue(new ArrayBuffer(64)),
      decrypt: jest.fn().mockResolvedValue(new TextEncoder().encode('decrypted'))
    },
    getRandomValues: jest.fn().mockImplementation((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    })
  }
});

// Mock TextEncoder/TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock btoa/atob
global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');

// Mock navigator.mediaDevices
Object.defineProperty(global, 'navigator', {
  value: {
    mediaDevices: {
      getUserMedia: jest.fn().mockResolvedValue({
        getTracks: jest.fn().mockReturnValue([])
      })
    }
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

// Mock fetch
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn()
}; 