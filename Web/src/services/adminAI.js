// Admin AI Service - Can access ALL database information
import { GoogleGenerativeAI } from '@google/generative-ai';
import { database } from '../../../Database/firebaseConfig';

// Google AI configuration
const GOOGLE_API_KEY = 'AIzaSyDPV6y1cgQMpOyJYKXIHeHXX0m6qIMrMZA';
const googleAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
const googleModel = googleAI.getGenerativeModel({ model: "gemini-1.5-flash" });

console.log('Admin AI Service initialized with Google AI (Gemini 1.5 Flash)');

// Load ALL database information for admin AI
export const loadAllDatabaseData = async () => {
  try {
    console.log('Loading complete database for admin AI...');
    
    const allData = {
      members: {},
      loanApplications: {},
      currentLoans: {},
      deposits: {},
      withdrawals: {},
      payments: {},
      statistics: {
        totalMembers: 0,
        totalLoanApplications: 0,
        totalCurrentLoans: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalPayments: 0,
        totalSavingsBalance: 0,
        totalLoanBalance: 0
      }
    };

    // Load Members
    const membersSnapshot = await database.ref('Members').once('value');
    if (membersSnapshot.exists()) {
      allData.members = membersSnapshot.val();
      allData.statistics.totalMembers = Object.keys(allData.members).length;
      
      // Calculate total savings balance from Members table
      Object.keys(allData.members).forEach(memberId => {
        const member = allData.members[memberId];
        if (member && member.balance) {
          allData.statistics.totalSavingsBalance += parseFloat(member.balance) || 0;
        }
      });
    }

    // Load Loan Applications
    const loanAppsSnapshot = await database.ref('Loans/LoanApplications').once('value');
    if (loanAppsSnapshot.exists()) {
      allData.loanApplications = loanAppsSnapshot.val();
      // Count total loan applications
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
      // Count and calculate total current loans
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
      // Count and calculate total deposits
      Object.keys(allData.deposits).forEach(memberId => {
        const memberDeposits = allData.deposits[memberId];
        if (memberDeposits) {
          Object.keys(memberDeposits).forEach(depositId => {
            const deposit = memberDeposits[depositId];
            allData.statistics.totalDeposits++;
          });
        }
      });
    }

    // Load Withdrawals
    const withdrawalsSnapshot = await database.ref('Withdraws/WithdrawApplications').once('value');
    if (withdrawalsSnapshot.exists()) {
      allData.withdrawals = withdrawalsSnapshot.val();
      // Count and calculate total withdrawals
      Object.keys(allData.withdrawals).forEach(memberId => {
        const memberWithdrawals = allData.withdrawals[memberId];
        if (memberWithdrawals) {
          Object.keys(memberWithdrawals).forEach(withdrawalId => {
            const withdrawal = memberWithdrawals[withdrawalId];
            allData.statistics.totalWithdrawals++;
          });
        }
      });
    }

    // Load Payments
    const paymentsSnapshot = await database.ref('Payments/PaymentApplications').once('value');
    if (paymentsSnapshot.exists()) {
      allData.payments = paymentsSnapshot.val();
      // Count total payments
      Object.keys(allData.payments).forEach(memberId => {
        const memberPayments = allData.payments[memberId];
        if (memberPayments) {
          allData.statistics.totalPayments += Object.keys(memberPayments).length;
        }
      });
    }

    console.log('Database loaded successfully for admin AI:', allData.statistics);
    return allData;
  } catch (error) {
    console.error('Error loading database for admin AI:', error);
    return null;
  }
};

// Generate AI response for admin with full database access
export const generateAdminAIResponse = async (prompt, options = {}) => {
  try {
    console.log('Generating admin AI response...');
    
    // Load complete database
    const allData = await loadAllDatabaseData();
    if (!allData) {
      throw new Error('Failed to load database information');
    }

    // Create comprehensive context for admin
    const adminContext = `You are an advanced AI assistant for 5KI Financial Services Admin Dashboard.

ADMIN PRIVILEGES:
- You have access to ALL database information
- You can provide statistics and insights about all members
- You can analyze trends, patterns, and generate reports
- You can answer questions about any member, loan, deposit, withdrawal, or payment

DATABASE OVERVIEW:
=================
Total Statistics:
- Total Members: ${allData.statistics.totalMembers}
- Total Loan Applications: ${allData.statistics.totalLoanApplications}
- Total Current Active Loans: ${allData.statistics.totalCurrentLoans}
- Total Deposit Transactions: ${allData.statistics.totalDeposits}
- Total Withdrawal Transactions: ${allData.statistics.totalWithdrawals}
- Total Payment Transactions: ${allData.statistics.totalPayments}
- Total Savings Balance: ₱${allData.statistics.totalSavingsBalance.toFixed(2)}
- Total Outstanding Loan Balance: ₱${allData.statistics.totalLoanBalance.toFixed(2)}

MEMBER INFORMATION:
${Object.keys(allData.members).slice(0, 10).map(memberId => {
  const member = allData.members[memberId];
  return `- Member ID: ${memberId}, Name: ${member.firstName} ${member.lastName}, Email: ${member.email}, Balance: ₱${parseFloat(member.balance || 0).toFixed(2)}, Status: ${member.status || 'Active'}`;
}).join('\n')}
${Object.keys(allData.members).length > 10 ? `... and ${Object.keys(allData.members).length - 10} more members` : ''}

RECENT LOAN APPLICATIONS:
${Object.keys(allData.loanApplications).slice(0, 5).map(memberId => {
  const memberLoans = allData.loanApplications[memberId];
  if (memberLoans) {
    return Object.keys(memberLoans).slice(0, 2).map(loanId => {
      const loan = memberLoans[loanId];
      return `- Member ${memberId}: ₱${loan.amount || 'N/A'}, Status: ${loan.status}, Date: ${loan.dateApplied}, Applicant: ${loan.firstName} ${loan.lastName}`;
    }).join('\n');
  }
  return '';
}).join('\n')}

RECENT DEPOSITS:
${Object.keys(allData.deposits).slice(0, 5).map(memberId => {
  const memberDeposits = allData.deposits[memberId];
  if (memberDeposits) {
    return Object.keys(memberDeposits).slice(0, 2).map(depositId => {
      const deposit = memberDeposits[depositId];
      return `- Member ${memberId}: ₱${deposit.amountToBeDeposited || deposit.amount || 'N/A'}, Status: ${deposit.status}, Date: ${deposit.dateApplied}, Account: ${deposit.accountName || 'N/A'}`;
    }).join('\n');
  }
  return '';
}).join('\n')}

RECENT WITHDRAWALS:
${Object.keys(allData.withdrawals).slice(0, 5).map(memberId => {
  const memberWithdrawals = allData.withdrawals[memberId];
  if (memberWithdrawals) {
    return Object.keys(memberWithdrawals).slice(0, 2).map(withdrawalId => {
      const withdrawal = memberWithdrawals[withdrawalId];
      return `- Member ${memberId}: ₱${withdrawal.amountWithdrawn || withdrawal.amount || 'N/A'}, Status: ${withdrawal.status}, Date: ${withdrawal.dateApplied}, Account: ${withdrawal.accountName || 'N/A'}`;
    }).join('\n');
  }
  return '';
}).join('\n')}

RECENT PAYMENTS:
${Object.keys(allData.payments).slice(0, 5).map(memberId => {
  const memberPayments = allData.payments[memberId];
  if (memberPayments) {
    return Object.keys(memberPayments).slice(0, 2).map(paymentId => {
      const payment = memberPayments[paymentId];
      return `- Member ${memberId}: ₱${payment.amountToBePaid || payment.amount || 'N/A'}, Status: ${payment.status}, Date: ${payment.dateApplied}`;
    }).join('\n');
  }
  return '';
}).join('\n')}

CAPABILITIES:
- Provide detailed member information and account summaries
- Generate financial reports and statistics
- Analyze loan performance and approval rates
- Track deposit and withdrawal patterns
- Identify trends and provide insights
- Answer specific queries about any member or transaction
- Calculate totals, averages, and other metrics

RESPONSE GUIDELINES:
- Provide comprehensive and accurate information
- Use Philippine Peso (₱) formatting
- Include relevant member IDs and transaction IDs
- Offer insights and analysis when appropriate
- Keep responses organized and easy to read
- Always maintain professional tone`;

    const fullPrompt = `${adminContext}\n\nAdmin Query: ${prompt}`;
    
    const result = await googleModel.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Admin AI response generated successfully');
    return {
      success: true,
      text: text,
      provider: 'Google AI (Admin - Full Database Access)',
      usage: null
    };
  } catch (error) {
    console.error('Admin AI error:', error);
    
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
        message: 'Admin AI service temporarily unavailable. Please try again later.'
      };
    }
  }
};

// Function to check admin AI service status
export const checkAdminAIServiceStatus = async () => {
  try {
    const testResult = await generateAdminAIResponse('Hello, provide a brief system status');
    return {
      available: testResult.success,
      model: 'gemini-1.5-flash',
      provider: 'Google AI (Admin - Full Database Access)'
    };
  } catch (error) {
    return {
      available: false,
      error: error.message,
      model: 'gemini-1.5-flash',
      provider: 'Google AI (Admin - Full Database Access)'
    };
  }
};

export default {
  generateAdminAIResponse,
  checkAdminAIServiceStatus,
  loadAllDatabaseData
};