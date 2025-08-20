// Use Google AI directly (free and no Firebase upgrade needed)
import { GoogleGenerativeAI } from '@google/generative-ai';

// Google AI configuration (completely free)
const GOOGLE_API_KEY = 'AIzaSyDPV6y1cgQMpOyJYKXIHeHXX0m6qIMrMZA';
const googleAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
const googleModel = googleAI.getGenerativeModel({ model: "gemini-1.5-flash" });

console.log('Using Google AI (Gemini 1.5 Flash) - Free Tier');

// AI Service Functions using Google AI (completely free)
export const generateAIResponse = async (prompt, options = {}) => {
  try {
    console.log('Generating AI response with Google AI (Gemini 1.5 Flash)...');
    console.log('Prompt:', prompt.substring(0, 100) + '...');
    
    const result = await googleModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Google AI response generated successfully');
    return {
      success: true,
      text: text,
      provider: 'Google AI (Gemini 1.5 Flash)',
      usage: null
    };
  } catch (error) {
    console.error('Google AI error:', error);
    
    // Handle specific errors
    if (error.message.includes('quota') || error.message.includes('QUOTA_EXCEEDED')) {
      return {
        success: false,
        error: 'QUOTA_EXCEEDED',
        message: 'Daily quota exceeded. Please try again tomorrow.'
      };
    } else if (error.message.includes('API_KEY')) {
      return {
        success: false,
        error: 'API_KEY_ERROR',
        message: 'API key issue. Please contact support.'
      };
    } else {
      return {
        success: false,
        error: 'UNKNOWN_ERROR',
        message: 'AI service temporarily unavailable. Please try again later.'
      };
    }
  }
};

// Chat-specific function for conversational AI using Google AI
export const generateChatResponse = async (messages, options = {}) => {
  try {
    console.log('Generating chat response with Google AI...');
    
    // Convert messages to a single prompt for Google AI
    const conversationPrompt = messages.map(msg => 
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n') + '\nAssistant:';

    const result = await googleModel.generateContent(conversationPrompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Chat response generated successfully');
    return {
      success: true,
      text: text,
      provider: 'Google AI (Gemini 1.5 Flash)',
      usage: null
    };
  } catch (error) {
    console.error('Error in chat response:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to generate chat response.'
    };
  }
};

// Function to check AI service status
export const checkAIServiceStatus = async () => {
  try {
    const testResult = await generateAIResponse('Hello');
    return {
      available: testResult.success,
      model: 'gemini-1.5-flash',
      provider: 'Google AI (Free Tier)'
    };
  } catch (error) {
    return {
      available: false,
      error: error.message,
      model: 'gemini-1.5-flash',
      provider: 'Google AI (Free Tier)'
    };
  }
};

// Export Google AI model for direct access if needed
export { googleModel, googleAI };