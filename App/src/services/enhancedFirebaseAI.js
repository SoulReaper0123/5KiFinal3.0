// Enhanced Firebase AI Service with Display Data Only (Gemini only)
// Switched to direct REST (v1beta) for proper Gemini 1.5 Flash support.

import Constants from 'expo-constants';

// Resolve API keys from multiple sources for reliability
const RESOLVED_KEY = (process.env?.EXPO_PUBLIC_GEMINI_API_KEY
  || Constants?.expoConfig?.extra?.geminiApiKey
  || Constants?.manifest?.extra?.geminiApiKey
  || '').toString();

const RAW_KEYS = RESOLVED_KEY
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
let KEY_INDEX = 0;

const GEMINI_MODELS = [
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest',
  'gemini-pro',
  'gemini-pro-latest',
];
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

const extractText = (json) => {
  try {
    const parts = json?.candidates?.[0]?.content?.parts;
    const textPart = parts?.find(p => typeof p.text === 'string');
    return textPart?.text || '';
  } catch {
    return '';
  }
};

const callGemini = async (apiKey, prompt, modelIndex = 0) => {
  const model = GEMINI_MODELS[modelIndex] || GEMINI_MODELS[0];
  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
  };

  const url = `${API_BASE}/models/${model}:generateContent?key=${apiKey}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = json?.error?.message || JSON.stringify(json) || `HTTP ${res.status}`;
      const statusText = (message || '').toLowerCase();
      const err = new Error(message);
      err.status = res.status;
      err.isQuota = [429, 503].includes(res.status) || statusText.includes('quota') || statusText.includes('rate');
      err.isInvalidKey = res.status === 400 && statusText.includes('api key');
      err.isModelNotFound = res.status === 404 || statusText.includes('not found');
      throw err;
    }
    return extractText(json);
  } catch (e) {
    throw e;
  }
};

console.log('Enhanced Firebase AI Service initialized (Gemini v1 REST, display data only)');

// Get mobile app context without codebase knowledge
const getMobileAppContext = () => {
  return `
MOBILE APPLICATION FEATURES:
============================

USER CAPABILITIES:
- View account balance and transaction history
- Apply for loans with document upload
- Submit deposit requests
- Make payments with proof upload
- Request withdrawals
- Track application statuses
- Get AI assistance for account questions

AI ASSISTANT FEATURES:
- Personal account information access
- Transaction history and status updates
- Application guidance and support
- Balance inquiries and calculations
- Loan payment schedules and information
- Deposit and withdrawal tracking
- General financial guidance

SECURITY FEATURES:
- Biometric authentication
- Secure document storage
- Encrypted data transmission
- User session management
- Privacy protection for personal data

NAVIGATION STRUCTURE:
- Home Dashboard
- Loans Section
- Deposits Section
- Payments Section
- Withdrawals Section
- Profile/Settings
- AI Assistant (Bot)
`;
};

// Enhanced AI response generator using only displayed data
export const generateEnhancedAIResponse = async (prompt, userData = null, options = {}) => {
  try {
    if (!RAW_KEYS.length) throw new Error('No Gemini API key configured');

    // Load database data for AI context
    console.log('Loading database data for mobile AI context...');
    const { database } = await import('../firebaseConfig');
    const databaseData = await sharedLoadData(database);
    const databaseSummary = databaseData ? sharedGenerateSummary(databaseData) : 'Database data unavailable.';

    let userDataContext = '';

    if (userData) {
      userDataContext = `
USER INFORMATION (Based on Displayed Data):
==========================================

Member Details:
- Full Name: ${userData.firstName || ''} ${userData.middleName || ''} ${userData.lastName || ''}
- Email: ${userData.email || ''}
- Phone: ${userData.phoneNumber || 'Not provided'}
- Current Savings Balance: ₱${parseFloat(userData.balance || 0).toFixed(2)}
- Account Status: ${userData.status || 'Active'}

Recent Transactions:
${userData.recentTransactions ? userData.recentTransactions.map(t => 
  `- ${t.type}: ₱${t.amount}, Status: ${t.status}, Date: ${t.date}`
).join('\n') : 'No recent transactions'}
`;
    }

    const enhancedContext = `You are an AI assistant for 5KI Financial Services mobile application.

${getMobileAppContext()}

CURRENT DATABASE STATUS:
${databaseSummary}

${userDataContext}

RESPONSE GUIDELINES:
===================
- You have access to real-time database information above
- Answer questions about members, funds, loans, deposits, withdrawals, and applications using this data
- Use Philippine Peso (₱) formatting for all amounts
- Be conversational and friendly while maintaining professionalism
- Offer specific guidance based on the user's displayed transaction history
- Protect user privacy - only discuss information that would be visible to the user
- Provide actionable advice and next steps
- Reference specific transactions or applications when relevant
- Help with navigation and feature explanations
- Offer financial guidance and support`;

    const finalPrompt = typeof prompt === 'string' ? prompt : '';
    const fullPrompt = `${enhancedContext}\n\nUser Query: ${finalPrompt}`;

    // Try multiple keys and models
    let text;
    let lastErr = null;
    
    for (let keyAttempt = 0; keyAttempt < RAW_KEYS.length; keyAttempt++) {
      const keyIndex = (KEY_INDEX + keyAttempt) % RAW_KEYS.length;
      
      for (let modelIndex = 0; modelIndex < GEMINI_MODELS.length; modelIndex++) {
        try {
          text = await callGemini(RAW_KEYS[keyIndex], fullPrompt, modelIndex);
          if (text) {
            KEY_INDEX = keyIndex; // Remember successful key
            break;
          }
        } catch (err) {
          lastErr = err;
          console.warn(`Gemini attempt failed (key ${keyIndex}, model ${modelIndex}):`, err.message);
          // Continue to next model/key
        }
      }
      
      if (text) break;
    }
    
    if (!text && lastErr) {
      throw lastErr;
    }

    return {
      success: true,
      text: text,
      provider: 'Google Gemini (v1 REST, Display Data Only)',
      usage: null,
    };
  } catch (error) {
    console.error('Enhanced AI error:', error);

    if ((error.message || '').toLowerCase().includes('quota')) {
      return {
        success: false,
        error: 'QUOTA_EXCEEDED',
        message: 'Daily quota exceeded. Please try again tomorrow.',
      };
    }

    if ((error.message || '').toLowerCase().includes('api key')) {
      return {
        success: false,
        error: 'API_KEY_INVALID',
        message: 'API key not valid. Please configure a valid Gemini API key.',
      };
    }

    return {
      success: false,
      error: 'UNKNOWN_ERROR',
      message: 'AI service temporarily unavailable. Please try again later.',
    };
  }
};

// Function to check enhanced AI service status
export const checkEnhancedAIServiceStatus = async () => {
  try {
    if (!RAW_KEYS.length) {
      return { available: false, error: 'No Gemini API key configured', model: GEMINI_MODELS[0], provider: 'Google Gemini (v1beta REST)' };
    }
    const testText = await callGemini(RAW_KEYS[KEY_INDEX], 'Hello');
    return {
      available: !!testText,
      model: GEMINI_MODELS[0],
      provider: 'Google Gemini (v1beta REST, Display Data Only)',
    };
  } catch (error) {
    return {
      available: false,
      error: error.message,
      model: GEMINI_MODELS[0],
      provider: 'Google Gemini (v1beta REST, Display Data Only)',
    };
  }
};

export default {
  generateEnhancedAIResponse,
  checkEnhancedAIServiceStatus,
};