// Enhanced Admin AI Service - Display-only, Gemini only (no DB/codebase access)
import { GoogleGenerativeAI } from '@google/generative-ai';

// Use env key only (no hardcoded fallback)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let googleModel = null;
try {
  if (API_KEY) {
    const googleAI = new GoogleGenerativeAI(API_KEY);
    googleModel = googleAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }
} catch (e) {
  console.warn('[enhancedAdminAI] Model init failed:', e?.message);
}

console.log('Enhanced Admin AI Service initialized (Gemini only, display-only mode)');

// Generate AI response using ONLY visible UI context provided by the caller
export const generateEnhancedAdminAIResponse = async (prompt, visibleContext = '') => {
  try {
    const finalPrompt = typeof prompt === 'string' ? prompt : '';

    const baseContext = `You are an AI assistant for the 5KI Financial Services Admin Web UI.

RULES:
- You do NOT have access to the database, files, or codebase.
- Use ONLY what is currently visible on screen (counts, labels, charts, tables, filters).
- If information is not visible in the provided context, say you cannot access it.
- Use Philippine Peso (₱) for amounts.
- Keep responses concise, structured, and professional.

VISIBLE CONTEXT (provided by UI):
${visibleContext || '(No extra UI context provided — answer only based on the admin UI layout and common features).'}
`;

    if (!googleModel) throw new Error('AI model not initialized');
    const fullPrompt = `${baseContext}\n\nAdmin Query: ${finalPrompt}`;
    const result = await googleModel.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    return {
      success: true,
      text,
      provider: 'Google Gemini (Display-only Context)',
      usage: null,
    };
  } catch (error) {
    console.error('Enhanced admin AI error:', error);

    if (error.message?.toLowerCase().includes('quota')) {
      return {
        success: false,
        error: 'QUOTA_EXCEEDED',
        message: 'Daily quota exceeded. Please try again tomorrow.'
      };
    }

    return {
      success: false,
      error: 'UNKNOWN_ERROR',
      message: 'AI service temporarily unavailable. Please try again later.'
    };
  }
};

// Legacy exports kept for compatibility (no-ops)
export const loadAllDatabaseData = async () => null;
export const getCodebaseContext = () => '';

export default {
  generateEnhancedAdminAIResponse,
  loadAllDatabaseData,
  getCodebaseContext,
};