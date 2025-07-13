import React, { useState, useRef, useEffect } from 'react';
import { VoiceCapture } from './components/VoiceCapture';
import { ChatInterface } from './components/ChatInterface';
import { VoiceSettings } from './components/VoiceSettings';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useASR } from './hooks/useASR';
import { useChatbot } from './hooks/useChatbot';
import { useTTS } from './hooks/useTTS';
import { useMemory } from './hooks/useMemory';
import './App.css';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

export interface VoiceSettings {
  voice: 'male' | 'female';
  speed: number;
  pitch: number;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    voice: 'female',
    speed: 1.0,
    pitch: 1.0
  });

  const { startRecording, stopRecording, audioBlob, isRecording: recorderIsRecording } = useAudioRecorder();
  const { transcribe } = useASR();
  const { sendMessage } = useChatbot();
  const { synthesize } = useTTS();
  const { saveTranscript, getTranscripts } = useMemory();

  const audioRef = useRef<HTMLAudioElement>(null);

  // Handle recording state changes
  useEffect(() => {
    setIsRecording(recorderIsRecording);
  }, [recorderIsRecording]);

  // Process audio when recording stops
  useEffect(() => {
    if (audioBlob && !isRecording) {
      handleAudioProcessing();
    }
  }, [audioBlob, isRecording]);

  const handleAudioProcessing = async () => {
    if (!audioBlob) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Step 1: Transcribe audio
      const transcript = await transcribe(audioBlob);
      if (!transcript) {
        throw new Error('Failed to transcribe audio');
      }

      // Step 2: Save transcript to memory
      await saveTranscript(transcript);

      // Step 3: Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        text: transcript,
        sender: 'user',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);

      // Step 4: Get chatbot response
      const response = await sendMessage(transcript, getTranscripts());
      if (!response) {
        throw new Error('Failed to get chatbot response');
      }

      // Step 5: Add assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Step 6: Synthesize and play response
      const audioUrl = await synthesize(response, voiceSettings);
      if (audioUrl && audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Audio processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (err) {
      setError('Failed to start recording. Please check microphone permissions.');
    }
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  const handleVoiceChange = (newSettings: VoiceSettings) => {
    setVoiceSettings(newSettings);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Solace Lite - Voice Companion</h1>
        <p>Your AI-powered voice assistant with psychiatric knowledge</p>
      </header>

      <main className="App-main">
        <div className="app-container">
          {/* Voice Settings */}
          <VoiceSettings 
            settings={voiceSettings}
            onSettingsChange={handleVoiceChange}
          />

          {/* Voice Capture Controls */}
          <div className="voice-controls">
            <button
              className={`record-button ${isRecording ? 'recording' : ''}`}
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              disabled={isProcessing}
            >
              {isRecording ? '🛑 Stop' : '🎤 Talk'}
            </button>
            
            {isProcessing && (
              <div className="processing-indicator">
                <div className="spinner"></div>
                <span>Processing...</span>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="error-message" onClick={clearError}>
              <span>⚠️ {error}</span>
              <button className="close-error">×</button>
            </div>
          )}

          {/* Chat Interface */}
          <ChatInterface 
            messages={messages}
            isLoading={isProcessing}
          />

          {/* Hidden audio element for TTS playback */}
          <audio ref={audioRef} style={{ display: 'none' }} />
        </div>
      </main>

      <footer className="App-footer">
        <p>Powered by OpenAI Whisper, GPT, and AWS Polly</p>
      </footer>
    </div>
  );
}

export default App; 