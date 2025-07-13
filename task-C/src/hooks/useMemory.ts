import { useCallback } from 'react';

export const useMemory = () => {
  const saveTranscript = useCallback(async (transcript: string): Promise<void> => {
    try {
      // Get existing transcripts
      const existing = localStorage.getItem('solace_transcripts');
      const transcripts = existing ? JSON.parse(existing) : [];
      
      // Add new transcript with timestamp
      const newTranscript = {
        text: transcript,
        timestamp: new Date().toISOString(),
        id: Date.now().toString()
      };
      
      // Keep only last 3 transcripts
      const updatedTranscripts = [...transcripts, newTranscript].slice(-3);
      
      // Store in localStorage (in a real app, this would be encrypted)
      localStorage.setItem('solace_transcripts', JSON.stringify(updatedTranscripts));
      
    } catch (error) {
      console.error('Error saving transcript:', error);
    }
  }, []);

  const getTranscripts = useCallback((): string[] => {
    try {
      const existing = localStorage.getItem('solace_transcripts');
      if (!existing) return [];
      
      const transcripts = JSON.parse(existing);
      return transcripts.map((t: any) => t.text);
      
    } catch (error) {
      console.error('Error retrieving transcripts:', error);
      return [];
    }
  }, []);

  const clearTranscripts = useCallback((): void => {
    try {
      localStorage.removeItem('solace_transcripts');
    } catch (error) {
      console.error('Error clearing transcripts:', error);
    }
  }, []);

  return {
    saveTranscript,
    getTranscripts,
    clearTranscripts
  };
}; 