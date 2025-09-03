// Enhanced Firebase AI Service with Complete Codebase Knowledge
import { GoogleGenerativeAI } from '@google/generative-ai';
import { database } from '../firebaseConfig';
import { ref as dbRef, get } from 'firebase/database';

// Google AI configuration
const GOOGLE_API_KEY = 'AIzaSyDPV6y1cgQMpOyJYKXIHeHXX0m6qIMrMZA';
const googleAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
const googleModel = googleAI.getGenerativeModel({ model: "gemini-1.5-flash" });

console.log('Enhanced Firebase AI Service initialized with complete codebase knowledge');

// Enhanced user data loader with comprehensive context
export const loadEnhancedUserData = async (email) => {
  try {
    console.log('Loading enhanced user data for:', email);
    
    const userData = {
      loans: [],
      currentLoans: [],
      deposits: [],
      payments: [],
      withdrawals: [],
      memberInfo: null,
      totalBalance: 0,
      statistics: {
        totalLoans: 0,
        totalDeposits: 0,
        totalPayments: 0,
        totalWithdrawals: 0,
        pendingApplications: 0,
        approvedApplications: 0,
        rejectedApplications: 0
      }
    };

    // Get member info and balance
    const membersRef = dbRef(database, 'Members');
    const membersSnapshot = await get(membersRef);
    if (membersSnapshot.exists()) {
      const membersData = membersSnapshot.val();
      Object.keys(membersData).forEach(memberId => {
        const member = membersData[memberId];
        if (member && member.email === email) {
          userData.memberInfo = { id: memberId, ...member };
          userData.totalBalance = parseFloat(member.balance) || 0;
        }
      });
    }

    // Get user loan applications
    const loansRef = dbRef(database, 'Loans/LoanApplications');
    const loansSnapshot = await get(loansRef);
    if (loansSnapshot.exists()) {
      const loansData = loansSnapshot.val();
      Object.keys(loansData).forEach(memberId => {
        const memberLoans = loansData[memberId];
        if (memberLoans) {
          Object.keys(memberLoans).forEach(loanId => {
            const loan = memberLoans[loanId];
            if (loan && loan.email === email) {
              userData.loans.push({ id: loanId, memberId, ...loan });
              userData.statistics.totalLoans++;
              if (loan.status === 'pending') userData.statistics.pendingApplications++;
              else if (loan.status === 'approved') userData.statistics.approvedApplications++;
              else if (loan.status === 'rejected') userData.statistics.rejectedApplications++;
            }
          });
        }
      });
    }

    // Get user current loans
    const currentLoansRef = dbRef(database, 'Loans/CurrentLoans');
    const currentLoansSnapshot = await get(currentLoansRef);
    if (currentLoansSnapshot.exists()) {
      const currentLoansData = currentLoansSnapshot.val();
      Object.keys(currentLoansData).forEach(memberId => {
        const memberCurrentLoans = currentLoansData[memberId];
        if (memberCurrentLoans && userData.memberInfo && userData.memberInfo.id === memberId) {
          Object.keys(memberCurrentLoans).forEach(loanId => {
            const currentLoan = memberCurrentLoans[loanId];
            if (currentLoan) {
              userData.currentLoans.push({ id: loanId, memberId, ...currentLoan });
            }
          });
        }
      });
    }

    // Get user deposits
    const depositsRef = dbRef(database, 'Deposits/DepositApplications');
    const depositsSnapshot = await get(depositsRef);
    if (depositsSnapshot.exists()) {
      const depositsData = depositsSnapshot.val();
      Object.keys(depositsData).forEach(memberId => {
        const memberDeposits = depositsData[memberId];
        if (memberDeposits) {
          Object.keys(memberDeposits).forEach(depositId => {
            const deposit = memberDeposits[depositId];
            if (deposit && deposit.email === email) {
              userData.deposits.push({ id: depositId, ...deposit });
              userData.statistics.totalDeposits++;
            }
          });
        }
      });
    }

    // Get user payments
    const paymentsRef = dbRef(database, 'Payments/PaymentApplications');
    const paymentsSnapshot = await get(paymentsRef);
    if (paymentsSnapshot.exists()) {
      const paymentsData = paymentsSnapshot.val();
      Object.keys(paymentsData).forEach(memberId => {
        const memberPayments = paymentsData[memberId];
        if (memberPayments) {
          Object.keys(memberPayments).forEach(paymentId => {
            const payment = memberPayments[paymentId];
            if (payment && payment.email === email) {
              userData.payments.push({ id: paymentId, ...payment });
              userData.statistics.totalPayments++;
            }
          });
        }
      });
    }

    // Get user withdrawals
    const withdrawalsRef = dbRef(database, 'Withdraws/WithdrawApplications');
    const withdrawalsSnapshot = await get(withdrawalsRef);
    if (withdrawalsSnapshot.exists()) {
      const withdrawalsData = withdrawalsSnapshot.val();
      Object.keys(withdrawalsData).forEach(memberId => {
        const memberWithdrawals = withdrawalsData[memberId];
        if (memberWithdrawals) {
          Object.keys(memberWithdrawals).forEach(withdrawalId => {
            const withdrawal = memberWithdrawals[withdrawalId];
            if (withdrawal && withdrawal.email === email) {
              userData.withdrawals.push({ id: withdrawalId, ...withdrawal });
              userData.statistics.totalWithdrawals++;
            }
          });
        }
      });
    }

    console.log('Enhanced user data loaded:', userData.statistics);
    return userData;
  } catch (error) {
    console.log('Error loading enhanced user data:', error);
    return null;
  }
};

// Get comprehensive mobile app context
const getMobileAppContext = () => {
  return `
MOBILE APPLICATION STRUCTURE & RECENT UPDATES:
==============================================

MAIN FEATURES:
- User authentication with biometric support
- Personal financial dashboard
- Loan applications and management
- Deposit requests and tracking
- Payment submissions with OCR verification
- Withdrawal requests
- Transaction history
- AI assistant (Bot.js) for user support

RECENT IMPROVEMENTS:
- Enhanced AI assistant with complete database knowledge
- Improved user data loading and context awareness
- Better error handling and user feedback
- Streamlined navigation and user experience

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

// Enhanced AI response generator for mobile users
export const generateEnhancedAIResponse = async (prompt, userEmail, options = {}) => {
  try {
    console.log('Generating enhanced AI response for user:', userEmail);
    
    // Load user-specific data
    const userData = await loadEnhancedUserData(userEmail);
    let userDataContext = '';
    
    if (userData && userData.memberInfo) {
      // Calculate totals
      const approvedDeposits = userData.deposits.filter(d => d.status === 'approved');
      const totalDeposited = approvedDeposits.reduce((sum, d) => sum + (parseFloat(d.depositAmount) || 0), 0);
      
      const approvedWithdrawals = userData.withdrawals.filter(w => w.status === 'approved');
      const totalWithdrawn = approvedWithdrawals.reduce((sum, w) => sum + (parseFloat(w.withdrawAmount) || 0), 0);
      
      const currentLoanBalance = userData.currentLoans.reduce((sum, loan) => 
        sum + (parseFloat(loan.remainingBalance) || parseFloat(loan.loanAmount) || 0), 0);

      userDataContext = `
PERSONAL ACCOUNT INFORMATION (CONFIDENTIAL - Only for ${userData.memberInfo.firstName}):
=====================================================================================

Member Details:
- Member ID: ${userData.memberInfo.id}
- Full Name: ${userData.memberInfo.firstName} ${userData.memberInfo.middleName || ''} ${userData.memberInfo.lastName}
- Email: ${userData.memberInfo.email}
- Phone: ${userData.memberInfo.phoneNumber || 'Not provided'}
- Current Savings Balance: ₱${userData.totalBalance.toFixed(2)}
- Account Status: ${userData.memberInfo.status || 'Active'}

Account Summary:
- Total Loan Applications: ${userData.statistics.totalLoans}
- Total Deposit Requests: ${userData.statistics.totalDeposits}
- Total Payment Submissions: ${userData.statistics.totalPayments}
- Total Withdrawal Requests: ${userData.statistics.totalWithdrawals}
- Pending Applications: ${userData.statistics.pendingApplications}
- Approved Applications: ${userData.statistics.approvedApplications}
- Rejected Applications: ${userData.statistics.rejectedApplications}

Financial Summary:
- Total Amount Deposited (Approved): ₱${totalDeposited.toFixed(2)}
- Total Amount Withdrawn (Approved): ₱${totalWithdrawn.toFixed(2)}
- Current Outstanding Loan Balance: ₱${currentLoanBalance.toFixed(2)}
- Active Loans: ${userData.currentLoans.length}

Recent Transactions:
${userData.loans.slice(-3).map(loan => 
  `- Loan Application: ₱${loan.loanAmount}, Status: ${loan.status}, Date: ${loan.dateApplied}`
).join('\n')}
${userData.deposits.slice(-3).map(deposit => 
  `- Deposit Request: ₱${deposit.depositAmount}, Status: ${deposit.status}, Date: ${deposit.dateApplied}`
).join('\n')}
${userData.payments.slice(-3).map(payment => 
  `- Payment: ₱${payment.amountToBePaid}, Status: ${payment.status}, Date: ${payment.dateApplied}`
).join('\n')}
${userData.withdrawals.slice(-3).map(withdrawal => 
  `- Withdrawal Request: ₱${withdrawal.withdrawAmount}, Status: ${withdrawal.status}, Date: ${withdrawal.dateApplied}`
).join('\n')}
`;
    }

    const enhancedContext = `You are an AI assistant for 5KI Financial Services mobile application, specifically helping ${userEmail}.

${getMobileAppContext()}

${userDataContext}

RESPONSE GUIDELINES:
===================
- Provide personalized, helpful responses based on the user's actual data
- Use Philippine Peso (₱) formatting for all amounts
- Be conversational and friendly while maintaining professionalism
- Offer specific guidance based on the user's transaction history
- Protect user privacy - only discuss this user's information
- Provide actionable advice and next steps
- Reference specific transactions or applications when relevant
- Help with navigation and feature explanations
- Offer financial guidance and support

CAPABILITIES:
=============
- Access to user's complete transaction history
- Real-time account balance information
- Application status tracking and updates
- Loan payment calculations and schedules
- Deposit and withdrawal guidance
- Payment verification assistance
- General financial advice and support
- System navigation help`;

    const fullPrompt = `${enhancedContext}\n\nUser Query: ${prompt}`;
    
    const result = await googleModel.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Enhanced AI response generated successfully');
    return {
      success: true,
      text: text,
      provider: 'Enhanced Google AI (Complete User Context)',
      usage: null
    };
  } catch (error) {
    console.error('Enhanced AI error:', error);
    
    if (error.message.includes('quota') || error.message.includes('QUOTA_EXCEEDED')) {
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
    const testResult = await generateEnhancedAIResponse('Hello', 'test@example.com');
    return {
      available: testResult.success,
      model: 'gemini-1.5-flash',
      provider: 'Enhanced Google AI (Complete User Context)'
    };
  } catch (error) {
    return {
      available: false,
      error: error.message,
      model: 'gemini-1.5-flash',
      provider: 'Enhanced Google AI (Complete User Context)'
    };
  }
};

export default {
  generateEnhancedAIResponse,
  checkEnhancedAIServiceStatus,
  loadEnhancedUserData
};