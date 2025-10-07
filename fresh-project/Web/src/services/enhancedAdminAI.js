import { 
  loadAllDatabaseData as sharedLoadData, 
  generateDatabaseSummary as sharedGenerateSummary 
} from '../../../shared/databaseService.js';

// Gemini configuration (single key, dynamic model selection)
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'; // Changed from v1 to v1beta

// Updated model names for v1beta endpoint
const CANDIDATE_MODELS = [
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest',
  'gemini-pro',
  'gemini-pro-latest',
];

let SELECTED_MODEL = null; // cache the first working model

const quickProbeModel = async (apiKey, model) => {
  const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        { role: 'user', parts: [{ text: 'ping' }] }
      ]
    }),
  });
  return res.ok;
};

const pickSupportedModel = async (apiKey) => {
  for (const model of CANDIDATE_MODELS) {
    try {
      const ok = await quickProbeModel(apiKey, model);
      if (ok) {
        console.log(`Gemini model selected: ${model}`);
        SELECTED_MODEL = model;
        return model;
      }
    } catch (e) {
      console.warn(`Model ${model} probe failed:`, e.message);
    }
  }
  throw new Error('No supported Gemini model found for generateContent on v1beta.');
};

// Utility: extract text from Gemini response
const extractGeminiText = (json) => {
  try {
    const parts = json?.candidates?.[0]?.content?.parts;
    const textPart = parts?.find(p => typeof p.text === 'string');
    return textPart?.text || '';
  } catch {
    return '';
  }
};

// Internal: ensure we have a working model selected
const getSelectedModel = async (apiKey) => {
  if (SELECTED_MODEL) return SELECTED_MODEL;
  return await pickSupportedModel(apiKey);
};

// Call Gemini generateContent
const callGemini = async (apiKey, prompt) => {
  if (!apiKey) throw new Error('Missing Gemini API key');

  const model = await getSelectedModel(apiKey);

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    }
  };

  const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = json?.error?.message || JSON.stringify(json) || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  return { text: extractGeminiText(json), model };
};

// Local fallback response
const getFallbackResponse = (prompt) => {
  const responses = [
    "I'm currently experiencing technical difficulties. Please try again later.",
    "I'm here to help with your Financial Management System. Could you please rephrase your question?",
    "I'm temporarily unavailable, but I can help you navigate the system. What specific section would you like assistance with?",
    "I'm having trouble connecting to my AI services. In the meantime, you can explore the dashboard, manage registrations, or check pending applications.",
  ];
  return responses[Math.floor(Math.random() * responses.length)];
};

console.log('Enhanced Admin AI Service initialized (Gemini v1beta)');

// Generate AI response (Gemini only) with database context
export const generateEnhancedAdminAIResponse = async (prompt, visibleContext = '') => {
  try {
    const finalPrompt = typeof prompt === 'string' ? prompt : '';

    // Load database data for AI context
    const databaseData = await loadAllDatabaseData();
    const databaseSummary = databaseData ? generateDatabaseSummary(databaseData) : 'Database data unavailable.';

    const baseContext = `You are an AI assistant for the 5KI Financial Services Admin Web UI.

RULES:
- You have access to real-time database information below.
- Answer questions about members, funds, loans, deposits, withdrawals, and applications using this data.
- Use Philippine Peso (₱) for amounts.
- Keep responses concise, structured, and professional.
- If asked about specific data not in the summary, explain what data is available.

CURRENT DATABASE STATUS:
${databaseSummary}

ADDITIONAL CONTEXT:
${visibleContext || '(No additional context provided)'}
`;

    const fullPrompt = `${baseContext}\n\nAdmin Query: ${finalPrompt}`;

    // Gemini only
    const { text, model } = await callGemini(GEMINI_API_KEY, fullPrompt);
    return {
      success: true,
      text: text || 'No response generated.',
      provider: `Google Gemini (${model})`,
      usage: null,
    };

  } catch (error) {
    console.error('Gemini failed:', error);

    // Final fallback - local response
    return {
      success: true,
      text: getFallbackResponse(String(prompt || '')),
      provider: 'Local Fallback',
      usage: null,
    };
  }
};

// Database data loading for AI context
export const loadAllDatabaseData = async () => {
  try {
    const { database } = await import('../../../Database/firebaseConfig');
    return await sharedLoadData(database);
  } catch (error) {
    console.error('Failed to load database data:', error);
    return null;
  }
};

// Generate database summary for AI context
export const generateDatabaseSummary = sharedGenerateSummary;

export const getCodebaseContext = () => '';

export default {
  generateEnhancedAdminAIResponse,
  loadAllDatabaseData,
  generateDatabaseSummary,
  getCodebaseContext,
};