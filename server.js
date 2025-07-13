const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const FormData = require('form-data');
// Use dynamic import for node-fetch v3+
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// ASR endpoint - Transcribe audio using OpenAI Whisper
app.post('/api/transcribe', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Send the file to OpenAI Whisper API
    const formData = new FormData();
    formData.append('file', Buffer.from(req.file.buffer), {
      filename: 'audio.webm',
      contentType: 'audio/webm',
    });
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: formData
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    res.json({ text: data.text });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Transcription failed', details: error.message });
  }
});

// Chatbot endpoint - Generate responses using OpenAI GPT
app.post('/api/chat', async (req, res) => {
  try {
    const { message, context, systemPrompt } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'No message provided' });
    }

    // Send the message to OpenAI GPT API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt || 'You are a helpful, empathetic mental health assistant.' },
          ...(Array.isArray(context) ? context.map(text => ({ role: 'user', content: text })) : []),
          { role: 'user', content: message }
        ]
      })
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    res.json({ response: data.choices[0].message.content });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Chat failed', details: error.message });
  }
});

// TTS endpoint - Synthesize speech using AWS Polly or similar
app.post('/api/synthesize', async (req, res) => {
  try {
    const { text, voice, speed, pitch } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    // In a real implementation, you would use AWS Polly or similar TTS service
    // For demo purposes, we'll return a mock audio URL
    // In production, you would generate actual audio and return the URL
    
    res.json({ 
      audioUrl: null, // Browser will use built-in speech synthesis
      message: 'Using browser speech synthesis for demo'
    });
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: 'TTS failed' });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend available at http://localhost:3000`);
  console.log(`API available at http://localhost:${PORT}/api`);
}); 