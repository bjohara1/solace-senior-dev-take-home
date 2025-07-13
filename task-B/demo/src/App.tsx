import React, { useState, useRef, useEffect } from 'react';
import SolaceClientSDK, { VADFrame } from '@solace/client-sdk';
import './App.css';

function App() {
  const [sdk, setSdk] = useState<SolaceClientSDK | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [recordingStats, setRecordingStats] = useState({
    duration: 0,
    framesCaptured: 0,
    voiceFrames: 0
  });
  
  const recordingRef = useRef<AsyncGenerator<VADFrame> | null>(null);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const encryptionKeyRef = useRef<CryptoKey | null>(null);
  const uploadedBlobKeyRef = useRef<string>('');

  // Initialize SDK on component mount
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        const sdkInstance = new SolaceClientSDK({
          apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000',
          vadConfig: {
            aggressiveness: 1,
            frameDuration: 30,
            sampleRate: 16000
          }
        });
        
        await sdkInstance.initialize();
        setSdk(sdkInstance);
        
        // Generate encryption key
        encryptionKeyRef.current = await sdkInstance.generateKey();
        
        console.log('SDK initialized successfully');
      } catch (err) {
        setError(`Failed to initialize SDK: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };

    initializeSDK();
  }, []);

  // Update recording duration
  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => {
        setRecordingStats(prev => ({
          ...prev,
          duration: Date.now() - startTimeRef.current
        }));
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isRecording]);

  const startRecording = async () => {
    if (!sdk) {
      setError('SDK not initialized');
      return;
    }

    try {
      setError('');
      setIsRecording(true);
      startTimeRef.current = Date.now();
      
      // Reset stats
      setRecordingStats({
        duration: 0,
        framesCaptured: 0,
        voiceFrames: 0
      });

      // Start recording with VAD
      recordingRef.current = sdk.recordVoice();
      
      // Process frames
      for await (const frame of recordingRef.current) {
        setRecordingStats(prev => ({
          ...prev,
          framesCaptured: prev.framesCaptured + 1,
          voiceFrames: prev.voiceFrames + (frame.hasVoice ? 1 : 0)
        }));
      }
    } catch (err) {
      setError(`Recording failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsRecording(false);
    }
  };

  const stopAndUpload = async () => {
    if (!sdk || !recordingRef.current) {
      setError('No active recording');
      return;
    }

    try {
      setIsProcessing(true);
      setError('');

      // Stop recording
      setIsRecording(false);
      recordingRef.current = null;

      // Create a sample encrypted blob (in real app, this would be the recorded audio)
      const sampleData = `Recorded audio data captured at ${new Date().toISOString()}`;
      const encryptedBlob = await sdk.encrypt(sampleData);

      // Convert encrypted blob to ArrayBuffer for upload
      const blobData = new TextEncoder().encode(JSON.stringify(encryptedBlob));
      
      // Upload to Task A endpoint
      const blobKey = await sdk.uploadBlob(blobData);
      uploadedBlobKeyRef.current = blobKey;

      setResult(`Audio uploaded successfully! Blob Key: ${blobKey}`);
    } catch (err) {
      setError(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchAndDecrypt = async () => {
    if (!sdk || !uploadedBlobKeyRef.current || !encryptionKeyRef.current) {
      setError('No uploaded blob or encryption key available');
      return;
    }

    try {
      setIsProcessing(true);
      setError('');

      // Download and decrypt the blob
      const decryptedData = await sdk.downloadAndDecrypt(
        uploadedBlobKeyRef.current,
        encryptionKeyRef.current
      );

      setResult(`Decrypted data: ${decryptedData}`);
    } catch (err) {
      setError(`Decryption failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Solace Client SDK Demo</h1>
        <p>Voice Activity Detection & Secure Encryption</p>
      </header>

      <main className="App-main">
        <div className="controls">
          <button
            onClick={startRecording}
            disabled={isRecording || !sdk}
            className="btn btn-primary"
          >
            {isRecording ? 'Recording...' : 'Start Recording'}
          </button>

          <button
            onClick={stopAndUpload}
            disabled={!isRecording || isProcessing}
            className="btn btn-secondary"
          >
            {isProcessing ? 'Processing...' : 'Stop & Upload'}
          </button>

          <button
            onClick={fetchAndDecrypt}
            disabled={!uploadedBlobKeyRef.current || isProcessing}
            className="btn btn-success"
          >
            {isProcessing ? 'Processing...' : 'Fetch & Decrypt'}
          </button>
        </div>

        {isRecording && (
          <div className="recording-stats">
            <h3>Recording Statistics</h3>
            <p>Duration: {formatDuration(recordingStats.duration)}</p>
            <p>Frames Captured: {recordingStats.framesCaptured}</p>
            <p>Voice Frames: {recordingStats.voiceFrames}</p>
            <div className="recording-indicator">
              <div className="pulse"></div>
              Recording...
            </div>
          </div>
        )}

        {error && (
          <div className="error">
            <h3>Error</h3>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="result">
            <h3>Result</h3>
            <pre>{result}</pre>
          </div>
        )}

        <div className="info">
          <h3>How it works</h3>
          <ol>
            <li>Click "Start Recording" to begin voice activity detection</li>
            <li>Speak into your microphone - only frames with voice will be captured</li>
            <li>Click "Stop & Upload" to encrypt and upload the audio data</li>
            <li>Click "Fetch & Decrypt" to retrieve and decrypt the data</li>
          </ol>
        </div>
      </main>
    </div>
  );
}

export default App; 