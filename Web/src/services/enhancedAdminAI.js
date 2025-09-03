// Enhanced Admin AI Service with Updated Codebase Knowledge
import { GoogleGenerativeAI } from '@google/generative-ai';
import { database } from '../../../Database/firebaseConfig';

// Google AI configuration
const GOOGLE_API_KEY = 'AIzaSyDPV6y1cgQMpOyJYKXIHeHXX0m6qIMrMZA';
const googleAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
const googleModel = googleAI.getGenerativeModel({ model: "gemini-1.5-flash" });

console.log('Enhanced Admin AI Service initialized with complete codebase knowledge');

// Enhanced database loader with all recent updates
export const loadAllDatabaseData = async () => {
  try {
    console.log('Loading complete database with enhanced context...');
    
    const allData = {
      members: {},
      loanApplications: {},
      currentLoans: {},
      deposits: {},
      withdrawals: {},
      payments: {},
      registrations: {},
      statistics: {
        totalMembers: 0,
        totalLoanApplications: 0,
        totalCurrentLoans: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalPayments: 0,
        totalRegistrations: 0,
        totalSavingsBalance: 0,
        totalLoanBalance: 0,
        pendingApplications: 0,
        approvedApplications: 0,
        rejectedApplications: 0
      }
    };

    // Load Members
    const membersSnapshot = await database.ref('Members').once('value');
    if (membersSnapshot.exists()) {
      allData.members = membersSnapshot.val();
      allData.statistics.totalMembers = Object.keys(allData.members).length;
      
      Object.keys(allData.members).forEach(memberId => {
        const member = allData.members[memberId];
        if (member && member.balance) {
          allData.statistics.totalSavingsBalance += parseFloat(member.balance) || 0;
        }
      });
    }

    // Load Registration Applications
    const registrationsSnapshot = await database.ref('Registrations/RegistrationApplications').once('value');
    if (registrationsSnapshot.exists()) {
      allData.registrations = registrationsSnapshot.val();
      Object.keys(allData.registrations).forEach(regId => {
        const registration = allData.registrations[regId];
        allData.statistics.totalRegistrations++;
        if (registration.status === 'pending') allData.statistics.pendingApplications++;
        else if (registration.status === 'approved') allData.statistics.approvedApplications++;
        else if (registration.status === 'rejected') allData.statistics.rejectedApplications++;
      });
    }

    // Load Loan Applications
    const loanAppsSnapshot = await database.ref('Loans/LoanApplications').once('value');
    if (loanAppsSnapshot.exists()) {
      allData.loanApplications = loanAppsSnapshot.val();
      Object.keys(allData.loanApplications).forEach(memberId => {
        const memberLoans = allData.loanApplications[memberId];
        if (memberLoans) {
          allData.statistics.totalLoanApplications += Object.keys(memberLoans).length;
        }
      });
    }

    // Load Current Loans
    const currentLoansSnapshot = await database.ref('Loans/CurrentLoans').once('value');
    if (currentLoansSnapshot.exists()) {
      allData.currentLoans = currentLoansSnapshot.val();
      Object.keys(allData.currentLoans).forEach(memberId => {
        const memberLoans = allData.currentLoans[memberId];
        if (memberLoans) {
          Object.keys(memberLoans).forEach(loanId => {
            const loan = memberLoans[loanId];
            allData.statistics.totalCurrentLoans++;
            allData.statistics.totalLoanBalance += parseFloat(loan.remainingBalance || loan.loanAmount || 0);
          });
        }
      });
    }

    // Load Deposits
    const depositsSnapshot = await database.ref('Deposits/DepositApplications').once('value');
    if (depositsSnapshot.exists()) {
      allData.deposits = depositsSnapshot.val();
      Object.keys(allData.deposits).forEach(memberId => {
        const memberDeposits = allData.deposits[memberId];
        if (memberDeposits) {
          allData.statistics.totalDeposits += Object.keys(memberDeposits).length;
        }
      });
    }

    // Load Withdrawals
    const withdrawalsSnapshot = await database.ref('Withdraws/WithdrawApplications').once('value');
    if (withdrawalsSnapshot.exists()) {
      allData.withdrawals = withdrawalsSnapshot.val();
      Object.keys(allData.withdrawals).forEach(memberId => {
        const memberWithdrawals = allData.withdrawals[memberId];
        if (memberWithdrawals) {
          allData.statistics.totalWithdrawals += Object.keys(memberWithdrawals).length;
        }
      });
    }

    // Load Payments
    const paymentsSnapshot = await database.ref('Payments/PaymentApplications').once('value');
    if (paymentsSnapshot.exists()) {
      allData.payments = paymentsSnapshot.val();
      Object.keys(allData.payments).forEach(memberId => {
        const memberPayments = allData.payments[memberId];
        if (memberPayments) {
          allData.statistics.totalPayments += Object.keys(memberPayments).length;
        }
      });
    }

    console.log('Enhanced database loaded successfully:', allData.statistics);
    return allData;
  } catch (error) {
    console.error('Error loading enhanced database:', error);
    return null;
  }
};

// Get comprehensive codebase context
const getCodebaseContext = () => {
  return `
RECENT CODEBASE UPDATES & STRUCTURE:
===================================

UI/UX IMPROVEMENTS:
- Recently updated all empty state displays to show clean text without container boxes
- Fixed 17 components to remove unnecessary container styling around "No ... available" messages
- Components updated: PermanentWithdraws, ApprovedPermanent, ApprovedWithdraws, RejectedWithdraws, 
  WithdrawApplications, ApplyDeposits, ApprovedDeposits, RejectedDeposits, ApprovedPayments, 
  RejectedPayments, PaymentApplications, ApplyLoans, ApprovedLoans, RejectedLoans, AllMembers, 
  ApprovedRegistrations, Registrations

COMPONENT STRUCTURE:
===================

WEB APPLICATION COMPONENTS:
- AdminHome.jsx: Main admin dashboard with AI assistant
- Dashboard/Dashboard.jsx: Analytics and overview
- Registrations/: Registration management (Registrations.jsx, ApprovedRegistrations.jsx, Register.jsx)
- Members/: Member management (AllMembers.jsx)
- Deposits/: Deposit management (ApplyDeposits.jsx, ApprovedDeposits.jsx, RejectedDeposits.jsx, Deposits.jsx)
- Loans/: Loan management (ApplyLoans.jsx, ApprovedLoans.jsx, RejectedLoans.jsx, Loans.jsx)
- Payments/: Payment management (PaymentApplications.jsx, ApprovedPayments.jsx, RejectedPayments.jsx, PayLoans.jsx)
- Withdraws/: Withdrawal management (WithdrawApplications.jsx, PermanentWithdraws.jsx, ApprovedWithdraws.jsx, ApprovedPermanent.jsx, RejectedWithdraws.jsx, Withdraws.jsx)
- Transactions.jsx: Transaction history
- CoAdmins.jsx: Admin user management
- Settings/: System configuration

MOBILE APPLICATION COMPONENTS:
- Bot.js: AI assistant for mobile users
- HomePage/: User dashboard and navigation
- Various user-facing screens for loans, deposits, payments, withdrawals

DATABASE STRUCTURE:
==================
Firebase Realtime Database with these main collections:
- Members/: User profiles and account information
- Registrations/RegistrationApplications/: New user registrations
- Loans/LoanApplications/: Loan applications
- Loans/CurrentLoans/: Active approved loans
- Deposits/DepositApplications/: Deposit requests
- Withdraws/WithdrawApplications/: Withdrawal requests
- Payments/PaymentApplications/: Payment submissions

EMPTY STATE HANDLING:
====================
All components now use clean empty state display:
- Before: <div style={styles.loadingView}><p style={styles.noDataMessage}>No ... available.</p></div>
- After: <p style={styles.noDataMessage}>No ... available.</p>

This provides cleaner UI without unnecessary container boxes when no data is available.

FEATURES & CAPABILITIES:
=======================
- Real-time data synchronization with Firebase
- Document upload and verification (OCR for payments)
- Biometric authentication support
- Multi-level approval workflows
- Comprehensive transaction tracking
- Admin dashboard with full database access
- Mobile and web applications
- AI assistants for both admin and user support

RECENT FIXES:
=============
- Improved empty state UI across all data tables
- Enhanced user experience with cleaner interfaces
- Consistent styling and behavior across components
- Better error handling and loading states
`;
};

// Enhanced AI response generator with complete codebase knowledge
export const generateEnhancedAdminAIResponse = async (prompt, options = {}) => {
  try {
    console.log('Generating enhanced admin AI response...');
    
    // Load complete database
    const allData = await loadAllDatabaseData();
    if (!allData) {
      throw new Error('Failed to load database information');
    }

    // Create comprehensive context
    const enhancedContext = `You are an advanced AI assistant for 5KI Financial Services with complete knowledge of the codebase and database.

${getCodebaseContext()}

CURRENT DATABASE OVERVIEW:
=========================
Total Statistics:
- Total Members: ${allData.statistics.totalMembers}
- Total Registrations: ${allData.statistics.totalRegistrations}
- Total Loan Applications: ${allData.statistics.totalLoanApplications}
- Total Current Active Loans: ${allData.statistics.totalCurrentLoans}
- Total Deposit Transactions: ${allData.statistics.totalDeposits}
- Total Withdrawal Transactions: ${allData.statistics.totalWithdrawals}
- Total Payment Transactions: ${allData.statistics.totalPayments}
- Total Savings Balance: ₱${allData.statistics.totalSavingsBalance.toFixed(2)}
- Total Outstanding Loan Balance: ₱${allData.statistics.totalLoanBalance.toFixed(2)}
- Pending Applications: ${allData.statistics.pendingApplications}
- Approved Applications: ${allData.statistics.approvedApplications}
- Rejected Applications: ${allData.statistics.rejectedApplications}

MEMBER INFORMATION (Sample):
${Object.keys(allData.members).slice(0, 10).map(memberId => {
  const member = allData.members[memberId];
  return `- Member ID: ${memberId}, Name: ${member.firstName} ${member.lastName}, Email: ${member.email}, Balance: ₱${parseFloat(member.balance || 0).toFixed(2)}, Status: ${member.status || 'Active'}`;
}).join('\n')}
${Object.keys(allData.members).length > 10 ? `... and ${Object.keys(allData.members).length - 10} more members` : ''}

CAPABILITIES:
=============
- Complete database access and analysis
- Code structure and component knowledge
- Recent updates and improvements awareness
- Financial reporting and statistics
- Member account management
- Transaction analysis and insights
- System navigation and troubleshooting
- UI/UX improvement suggestions
- Technical support and guidance

RESPONSE GUIDELINES:
===================
- Provide accurate, comprehensive information
- Reference specific components and files when relevant
- Use Philippine Peso (₱) formatting for amounts
- Include member IDs and transaction IDs when applicable
- Offer insights based on recent code improvements
- Maintain professional, helpful tone
- Suggest actionable solutions and improvements
- Reference the clean empty state improvements when discussing UI`;

    const fullPrompt = `${enhancedContext}\n\nAdmin Query: ${prompt}`;
    
    const result = await googleModel.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Enhanced admin AI response generated successfully');
    return {
      success: true,
      text: text,
      provider: 'Enhanced Google AI (Complete Codebase Knowledge)',
      usage: null
    };
  } catch (error) {
    console.error('Enhanced admin AI error:', error);
    
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
        message: 'Enhanced AI service temporarily unavailable. Please try again later.'
      };
    }
  }
};

export default {
  generateEnhancedAdminAIResponse,
  loadAllDatabaseData,
  getCodebaseContext
};