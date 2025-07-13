import { useCallback } from 'react';
import { VoiceSettings } from '../App';

export const useTTS = () => {
  const synthesize = useCallback(async (
    text: string, 
    settings: VoiceSettings
  ): Promise<string | null> => {
    try {
      const response = await fetch('/api/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice: settings.voice,
          speed: settings.speed,
          pitch: settings.pitch
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.audioUrl || null;

    } catch (error) {
      console.error('TTS Error:', error);
      
      // For demo purposes, we'll use the browser's built-in speech synthesis
      if ('speechSynthesis' in window) {
        return new Promise((resolve) => {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.voice = speechSynthesis.getVoices().find(
            voice => voice.name.includes(settings.voice === 'male' ? 'Male' : 'Female')
          ) || null;
          utterance.rate = settings.speed;
          utterance.pitch = settings.pitch;
          
          utterance.onend = () => resolve(null);
          utterance.onerror = () => resolve(null);
          
          speechSynthesis.speak(utterance);
          resolve(null);
        });
      }
      
      return null;
    }
  }, []);

  return { synthesize };
}; 