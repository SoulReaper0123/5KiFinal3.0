// Enhanced Firebase AI Service with Display Data Only (Gemini only)
import { GoogleGenerativeAI } from '@google/generative-ai';

// Google AI configuration (Gemini only)
// Use env-only key; no hardcoded fallback
const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

let googleModel = null;
if (GOOGLE_API_KEY) {
  const googleAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
  googleModel = googleAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
}

console.log('Enhanced Firebase AI Service initialized (Gemini only, display data only)');

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
    console.log('Generating enhanced AI response with display data only (Gemini)');
    
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

${userDataContext}

RESPONSE GUIDELINES:
===================
- Provide helpful responses based only on the user's displayed data
- Use Philippine Peso (₱) formatting for all amounts
- Be conversational and friendly while maintaining professionalism
- Offer specific guidance based on the user's displayed transaction history
- Protect user privacy - only discuss information that would be visible to the user
- Provide actionable advice and next steps
- Reference specific transactions or applications when relevant
- Help with navigation and feature explanations
- Offer financial guidance and support

IMPORTANT: You do not have access to the complete database or codebase. Only use the information provided above.`;

    // No OpenRouter or other models. Gemini only.
    const finalPrompt = typeof prompt === 'string' ? prompt : '';
    const fullPrompt = `${enhancedContext}\n\nUser Query: ${finalPrompt}`;

    if (!googleModel) throw new Error('AI model not initialized');
    const result = await googleModel.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Enhanced AI response generated successfully (Gemini)');
    return {
      success: true,
      text: text,
      provider: 'Google Gemini (Display Data Only)',
      usage: null
    };
  } catch (error) {
    console.error('Enhanced AI error:', error);
    
    if (error.message?.toLowerCase().includes('quota')) {
      return {
        success: false,
        error: 'QUOTA_EXCEEDED',
        message: 'Daily quota exceeded. Please try again tomorrow.'
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

// Function to check enhanced AI service status
export const checkEnhancedAIServiceStatus = async () => {
  try {
    const testResult = await generateEnhancedAIResponse('Hello');
    return {
      available: testResult.success,
      model: 'gemini-1.5-flash',
      provider: 'Google Gemini (Display Data Only)'
    };
  } catch (error) {
    return {
      available: false,
      error: error.message,
      model: 'gemini-1.5-flash',
      provider: 'Google Gemini (Display Data Only)'
    };
  }
};

export default {
  generateEnhancedAIResponse,
  checkEnhancedAIServiceStatus
};