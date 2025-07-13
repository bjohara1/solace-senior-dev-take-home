import { useCallback } from 'react';

export const useChatbot = () => {
  const sendMessage = useCallback(async (
    message: string, 
    context: string[] = []
  ): Promise<string | null> => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context: context.slice(-3), // Last 3 messages for context
          systemPrompt: `You are a compassionate AI assistant with knowledge of mental health and well-being. 
          You provide supportive, empathetic responses while being mindful of mental health best practices. 
          Always encourage professional help when appropriate and never give medical advice.`
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.response || null;

    } catch (error) {
      console.error('Chatbot Error:', error);
      
      // Fallback responses for demo purposes
      const fallbackResponses = [
        "I understand you're going through something difficult. It's okay to feel this way, and I'm here to listen.",
        "Thank you for sharing that with me. It sounds like you're dealing with a lot right now.",
        "I hear you, and your feelings are valid. Have you considered talking to a mental health professional about this?",
        "That sounds really challenging. Remember that it's okay to ask for help when you need it.",
        "I appreciate you opening up to me. You're showing real strength by being honest about your feelings."
      ];
      
      const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      return randomResponse;
    }
  }, []);

  return { sendMessage };
}; 