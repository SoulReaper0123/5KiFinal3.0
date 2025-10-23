// Display-only AI service for Admin Web UI. No database or code access here.

// Gemini configuration (single key, dynamic model selection)
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

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
      temperature: 0.5,
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
const getFallbackResponse = () => {
  const responses = [
    "I'm currently experiencing technical difficulties. Please try again later.",
    "I can help using only what is currently visible on your admin pages. What would you like to know?",
    "I don't have background access to your database or files. Ask about what's displayed on your dashboard, loans, deposits, payments, withdrawals, or registrations.",
  ];
  return responses[Math.floor(Math.random() * responses.length)];
};

console.log('Enhanced Admin AI Service (display-only) initialized');

// Generate AI response strictly from provided visible context
export const generateEnhancedAdminAIResponse = async (prompt, visibleContext = '') => {
  try {
    const finalPrompt = typeof prompt === 'string' ? prompt : '';

    const baseContext = `You are an AI assistant for the 5KI Financial Services Admin Web UI.

STRICT RULES:
- You have NO access to any database, source code, or hidden files.
- Answer ONLY using the VISIBLE UI CONTEXT provided below (display-only snapshot).
- If information is not present in the VISIBLE UI CONTEXT, say you don't have that information.
- Use Philippine Peso (₱) for amounts.
- Refer to funds as "Available Funds" (do NOT use "Net Funds").
- Keep responses concise, structured, and professional.

VISIBLE UI CONTEXT:
${visibleContext || '(No context captured — you must ask the user to open the relevant page or provide details visible on screen.)'}
`;

    const fullPrompt = `${baseContext}\n\nAdmin Query: ${finalPrompt}`;

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
      text: getFallbackResponse(),
      provider: 'Local Fallback',
      usage: null,
    };
  }
};

export const getCodebaseContext = () => '';

export default {
  generateEnhancedAdminAIResponse,
  getCodebaseContext,
};