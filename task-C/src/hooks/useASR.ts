import { useCallback } from 'react';

export const useASR = () => {
  const transcribe = useCallback(async (audioBlob: Blob): Promise<string | null> => {
    try {
      // Convert audio blob to FormData for API upload
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.text || null;

    } catch (error) {
      console.error('ASR Error:', error);
      return null;
    }
  }, []);

  return { transcribe };
}; 