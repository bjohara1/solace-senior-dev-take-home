# Task B: Cross-Platform Client SDK

## Overview

`@solace/client-sdk` is a comprehensive TypeScript/JavaScript SDK that provides secure blob encryption, Voice Activity Detection (VAD), and seamless integration with the Task A decryption service. Built with modern web standards and designed for cross-platform compatibility.

## Features

- 🔐 **AES-GCM 256 Encryption**: Secure client-side encryption using Web Crypto API
- 🎤 **Voice Activity Detection**: Real-time audio processing with WebRTC VAD
- 📤 **Upload/Download Helpers**: Seamless integration with Task A endpoints
- 🎯 **TypeScript Support**: Full type safety and IntelliSense
- 🧪 **Comprehensive Testing**: Unit tests for all core functionality
- 📱 **Cross-Platform**: Works in browsers, Node.js, and React Native

## Installation

### NPM
```bash
npm install @solace/client-sdk
```

### Yarn
```bash
yarn add @solace/client-sdk
```

### Local Development
```bash
# Clone the repository
git clone <repository-url>
cd solace-senior-dev-take-home/task-B

# Install dependencies
npm install

# Build the SDK
npm run build

# Run tests
npm test
```

## Quick Start

```typescript
import SolaceClientSDK from '@solace/client-sdk';

// Initialize the SDK
const sdk = new SolaceClientSDK({
  apiUrl: 'http://localhost:3000',
  vadConfig: {
    aggressiveness: 1,
    frameDuration: 30,
    sampleRate: 16000
  }
});

await sdk.initialize();

// Encrypt data
const encrypted = await sdk.encrypt('Hello, World!');
console.log('Encrypted:', encrypted);

// Record voice with VAD
for await (const frame of sdk.recordVoice()) {
  if (frame.hasVoice) {
    console.log('Voice detected at:', frame.timestamp);
  }
}
```

## API Reference

### Core SDK Class

#### `SolaceClientSDK(config?: SDKConfig)`

Main SDK class that provides unified access to all functionality.

**Configuration Options:**
```typescript
interface SDKConfig {
  apiUrl?: string;           // Task A API endpoint
  token?: string;            // Authentication token
  vadConfig?: VADConfig;     // Voice Activity Detection settings
  audioConfig?: AudioConfig; // Audio processing settings
}
```

#### Methods

- `initialize()`: Initialize the SDK and required components
- `encrypt(data: string)`: Encrypt data using AES-GCM 256
- `decrypt(params, key)`: Decrypt data using provided key
- `recordVoice()`: Start voice activity detection recording
- `uploadBlob(blob)`: Upload encrypted blob to Task A
- `downloadAndDecrypt(blobKey, key)`: Download and decrypt blob
- `generateKey()`: Generate new encryption key
- `importKey(keyData)`: Import key from raw bytes
- `exportKey(key)`: Export key to raw bytes

### Encryption API

#### `encryptBlob(data: string): Promise<EncryptedBlob>`

Encrypts data using AES-GCM 256 and returns an object containing:
- `iv`: Initialization vector (base64)
- `ciphertext`: Encrypted data (base64)
- `tag`: Authentication tag (base64)

```typescript
import { encryptBlob } from '@solace/client-sdk';

const encrypted = await encryptBlob('Secret message');
console.log(encrypted.iv, encrypted.ciphertext, encrypted.tag);
```

#### `decryptBlob(params, key): Promise<string>`

Decrypts data using the provided key and parameters.

```typescript
import { decryptBlob } from '@solace/client-sdk';

const decrypted = await decryptBlob(encryptedParams, cryptoKey);
console.log('Decrypted:', decrypted);
```

### Voice Activity Detection API

#### `recordAndDetectVoice(config?: VADConfig): AsyncIterable<VADFrame>`

Records audio and yields frames with voice activity detection.

```typescript
import { recordAndDetectVoice } from '@solace/client-sdk';

for await (const frame of recordAndDetectVoice()) {
  console.log('Frame:', {
    timestamp: frame.timestamp,
    hasVoice: frame.hasVoice,
    dataSize: frame.frame.byteLength
  });
}
```

**VAD Configuration:**
```typescript
interface VADConfig {
  aggressiveness: 0 | 1 | 2 | 3;  // 0=least, 3=most aggressive
  frameDuration: 10 | 20 | 30;    // milliseconds
  sampleRate: 8000 | 16000 | 32000 | 48000;
}
```

### Upload/Download API

#### `uploadBlob(blob, apiUrl, token?): Promise<string>`

Uploads encrypted blob to Task A endpoint and returns blobKey.

```typescript
import { uploadBlob } from '@solace/client-sdk';

const blobKey = await uploadBlob(encryptedBlob, 'http://localhost:3000');
console.log('Uploaded with key:', blobKey);
```

#### `downloadAndDecrypt(blobKey, apiUrl, key): Promise<string>`

Downloads and decrypts blob from Task A endpoint.

```typescript
import { downloadAndDecrypt } from '@solace/client-sdk';

const plaintext = await downloadAndDecrypt(blobKey, apiUrl, cryptoKey);
console.log('Decrypted:', plaintext);
```

## Demo Application

### Launch the Demo

```bash
cd demo
npm install
npm start
```

The demo will open at `http://localhost:3000` and provides:

- **Start Recording**: Begin voice activity detection
- **Stop & Upload**: Encrypt and upload recorded audio
- **Fetch & Decrypt**: Download and decrypt the uploaded data
- **Real-time Statistics**: Recording duration, frames captured, voice frames
- **Error Handling**: Clear error messages and status updates

### Demo Features

- 🎤 Real-time voice activity detection
- 🔐 Client-side encryption with AES-GCM 256
- 📤 Integration with Task A upload endpoint
- 📥 Integration with Task A decrypt endpoint
- 📊 Live recording statistics
- 🎨 Modern, responsive UI
- 📱 Mobile-friendly design

## Testing

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test Suites
```bash
# Crypto tests only
npm test -- --testNamePattern="CryptoManager"

# VAD tests only
npm test -- --testNamePattern="VADManager"
```

### Test Coverage

The SDK includes comprehensive tests for:

- ✅ **Encryption/Decryption**: AES-GCM 256 functionality
- ✅ **Key Management**: Generation, import, export
- ✅ **VAD Simulation**: Voice activity detection on prerecorded audio
- ✅ **API Integration**: Upload/download helpers
- ✅ **Error Handling**: Invalid inputs and edge cases
- ✅ **Type Safety**: TypeScript interface validation

## Security Considerations

### Encryption
- Uses AES-GCM 256 for authenticated encryption
- Random IV generation for each encryption
- Secure key generation via Web Crypto API
- No hardcoded keys or secrets

### Voice Activity Detection
- Local processing - audio never leaves the device
- Configurable aggressiveness levels
- Support for multiple sample rates
- Real-time frame processing

### API Integration
- HTTPS enforcement for all communications
- Optional authentication token support
- Proper error handling without information leakage
- CORS-compliant requests

## Browser Compatibility

- **Chrome**: 67+ (Web Crypto API, WebRTC)
- **Firefox**: 60+ (Web Crypto API, WebRTC)
- **Safari**: 11+ (Web Crypto API, WebRTC)
- **Edge**: 79+ (Web Crypto API, WebRTC)

## Node.js Support

For Node.js environments, the SDK requires:
- Node.js 16+ (for Web Crypto API support)
- Optional: `node-webrtc` for VAD functionality

## Development

### Building the SDK
```bash
npm run build
```

### Development Mode
```bash
npm run dev
```

### Linting
```bash
npm run lint
npm run lint:fix
```

### Type Checking
```bash
npx tsc --noEmit
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review the test examples

---

**Note**: This SDK is designed to work with Task A (Enclave-Style Decryption Service). Ensure Task A is properly deployed and configured before using the upload/download functionality. 