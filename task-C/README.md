# Task C: Solace Lite - End-to-End Voice Companion

A complete voice-to-voice AI companion prototype with speech recognition, natural language processing, and text-to-speech capabilities. The system is designed with psychiatric knowledge to provide supportive, empathetic responses.

## 🎯 Features

### Core Functionality
- **Voice Capture & ASR**: Real-time microphone input with OpenAI Whisper transcription
- **Intelligent Chatbot**: GPT-powered responses with mental health awareness
- **TTS & Voice Customization**: Multiple voice options with speed/pitch control
- **Conversation Memory**: Encrypted storage of recent transcripts
- **Modern UI/UX**: Responsive design with real-time feedback

### Technical Features
- **Web Audio API**: High-quality audio capture and processing
- **Voice Activity Detection**: Smart recording with VAD integration
- **Error Handling**: Comprehensive error management and user feedback
- **Security**: Encrypted transcript storage and secure API communication

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Modern browser with microphone access
- OpenAI API key (for production)

### Installation

1. **Clone and navigate to Task C**:
   ```bash
   cd task-C
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to `http://localhost:3000`

## 📋 Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3001

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_ORG_ID=your_openai_org_id_here

# AWS Configuration (for TTS)
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_REGION=us-east-1

# Optional: Azure Speech Services
AZURE_SPEECH_KEY=your_azure_speech_key_here
AZURE_SPEECH_REGION=your_azure_region_here

# Security
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here

# Development
NODE_ENV=development
LOG_LEVEL=debug
```

## 🎮 Usage

### Basic Operation

1. **Grant microphone permissions** when prompted
2. **Select voice settings** (male/female, speed, pitch)
3. **Click "Talk"** to start recording
4. **Speak your message** clearly
5. **Click "Stop"** when finished
6. **Listen to the AI response** automatically

### Voice Settings

- **Voice Type**: Choose between male and female voices
- **Speed**: Adjust speech rate (0.5x to 2.0x)
- **Pitch**: Modify voice pitch (0.5x to 2.0x)

### Conversation Features

- **Real-time transcription**: See your speech converted to text
- **Contextual responses**: AI remembers previous conversation
- **Empathetic responses**: Mental health-aware responses
- **Error handling**: Clear feedback for any issues

## 🏗️ Architecture

### Frontend (React + TypeScript)
```
src/
├── components/          # UI components
│   ├── VoiceSettings.tsx
│   ├── ChatInterface.tsx
│   └── VoiceCapture.tsx
├── hooks/              # Custom React hooks
│   ├── useAudioRecorder.ts
│   ├── useASR.ts
│   ├── useChatbot.ts
│   ├── useTTS.ts
│   └── useMemory.ts
├── App.tsx             # Main application
└── index.tsx           # Entry point
```

### Backend (Express.js)
```
server.js               # Main server file
├── /api/transcribe     # ASR endpoint
├── /api/chat          # Chatbot endpoint
└── /api/synthesize    # TTS endpoint
```

## 🔧 API Endpoints

### POST /api/transcribe
Transcribes audio to text using OpenAI Whisper.

**Request**:
- `file`: Audio file (WebM format)
- `model`: Whisper model (default: whisper-1)
- `language`: Language code (default: en)

**Response**:
```json
{
  "text": "transcribed text here"
}
```

### POST /api/chat
Generates AI responses using OpenAI GPT.

**Request**:
```json
{
  "message": "user message",
  "context": ["previous messages"],
  "systemPrompt": "AI behavior instructions"
}
```

**Response**:
```json
{
  "response": "AI generated response"
}
```

### POST /api/synthesize
Converts text to speech using TTS service.

**Request**:
```json
{
  "text": "text to synthesize",
  "voice": "male|female",
  "speed": 1.0,
  "pitch": 1.0
}
```

**Response**:
```json
{
  "audioUrl": "url to audio file",
  "message": "status message"
}
```

## 🛠️ Development

### Available Scripts

```bash
npm start          # Start React development server
npm run server     # Start Express API server
npm run dev        # Start both frontend and backend
npm run build      # Build for production
```

### Development Workflow

1. **Start development servers**:
   ```bash
   npm run dev
   ```

2. **Make changes** to React components or server code

3. **Test functionality** in the browser

4. **Build for production**:
   ```bash
   npm run build
   ```

## 🧪 Testing

### Manual Testing
- Test voice recording and transcription
- Verify chatbot responses
- Check TTS functionality
- Test error handling

### Automated Testing
```bash
npm test
```

## 📦 Deployment

### Production Build
1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Deploy to your preferred hosting service**:
   - Vercel, Netlify, or similar for frontend
   - Heroku, AWS, or similar for backend

3. **Set environment variables** on your hosting platform

## 🔒 Security Considerations

- **API Keys**: Never commit API keys to version control
- **HTTPS**: Use HTTPS in production
- **CORS**: Configure CORS properly for your domain
- **Rate Limiting**: Implement rate limiting for API endpoints
- **Input Validation**: Validate all user inputs

## 🐛 Troubleshooting

### Common Issues
- **Microphone permissions**: Ensure browser has microphone access
- **API errors**: Check environment variables and API keys
- **Build errors**: Clear node_modules and reinstall dependencies

### Debug Mode
Set `LOG_LEVEL=debug` in your environment variables for detailed logging.

## 📝 License

This project is licensed under the MIT License.

**Note**: This is a prototype/demo application. For production use, implement proper security measures, error handling, and API integrations.
