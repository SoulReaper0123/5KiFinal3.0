
export const loadAllDatabaseData = async (database) => {
  try {
    const dataPromises = {
      // Members data
      members: database.ref('Members').once('value'),
      
      // Financial data
      deposits: database.ref('Deposits').once('value'),
      loans: database.ref('Loans').once('value'),
      payments: database.ref('Payments').once('value'),
      withdraws: database.ref('Withdraws').once('value'),
      
      // Applications
      registrationApps: database.ref('Registrations/RegistrationApplications').once('value'),
      depositApps: database.ref('Deposits/DepositApplications').once('value'),
      loanApps: database.ref('Loans/LoanApplications').once('value'),
      paymentApps: database.ref('Payments/PaymentApplications').once('value'),
      withdrawApps: database.ref('Withdraws/WithdrawApplications').once('value'),
      
      // System data
      settings: database.ref('Settings').once('value'),
      transactions: database.ref('Transactions').once('value'),
    };

    const results = {};
    for (const [key, promise] of Object.entries(dataPromises)) {
      try {
        const snapshot = await promise;
        results[key] = snapshot.val() || {};
      } catch (error) {
        console.warn(`Failed to load ${key}:`, error);
        results[key] = {};
      }
    }

    return results;
  } catch (error) {
    console.error('Failed to load database data:', error);
    return null;
  }
};

// Generate database summary for AI context
export const generateDatabaseSummary = (data) => {
  if (!data) return 'Database data unavailable.';

  const summary = {
    members: {},
    financial: {},
    applications: {},
    system: {}
  };

  try {
    // Members analysis
    const members = data.members || {};
    const membersList = Object.values(members);
    summary.members = {
      total: membersList.length,
      active: membersList.filter(m => m.status === 'active' || m.status === 'Active').length,
      pending: membersList.filter(m => m.status === 'pending' || m.status === 'Pending').length,
    };

    // Financial analysis
    const deposits = data.deposits || {};
    const loans = data.loans || {};
    const payments = data.payments || {};
    const withdraws = data.withdraws || {};

    // Calculate totals from nested structure
    const calculateTotal = (dataObj, field = 'amount') => {
      let total = 0;
      Object.values(dataObj).forEach(group => {
        if (group && typeof group === 'object') {
          Object.values(group).forEach(item => {
            if (item && typeof item[field] === 'number') {
              total += item[field];
            } else if (item && typeof item[field] === 'string') {
              const num = parseFloat(item[field]);
              if (!isNaN(num)) total += num;
            }
          });
        }
      });
      return total;
    };

    const countItems = (dataObj) => {
      let count = 0;
      Object.values(dataObj).forEach(group => {
        if (group && typeof group === 'object') {
          count += Object.keys(group).length;
        }
      });
      return count;
    };

    summary.financial = {
      totalDeposits: calculateTotal(deposits),
      totalLoans: calculateTotal(loans),
      totalPayments: calculateTotal(payments),
      totalWithdraws: calculateTotal(withdraws),
      depositsCount: countItems(deposits),
      loansCount: countItems(loans),
      paymentsCount: countItems(payments),
      withdrawsCount: countItems(withdraws),
    };

    // Calculate net funds (deposits + payments - loans - withdraws)
    summary.financial.netFunds = summary.financial.totalDeposits + summary.financial.totalPayments - summary.financial.totalLoans - summary.financial.totalWithdraws;

    // Applications analysis
    const countPending = (dataObj) => {
      let count = 0;
      Object.values(dataObj).forEach(group => {
        if (group && typeof group === 'object') {
          Object.values(group).forEach(item => {
            if (item && (item.status === 'pending' || item.status === 'Pending')) {
              count++;
            }
          });
        }
      });
      return count;
    };

    summary.applications = {
      pendingRegistrations: countPending(data.registrationApps || {}),
      pendingDeposits: countPending(data.depositApps || {}),
      pendingLoans: countPending(data.loanApps || {}),
      pendingPayments: countPending(data.paymentApps || {}),
      pendingWithdraws: countPending(data.withdrawApps || {}),
    };

    // System info
    summary.system = {
      lastUpdated: new Date().toISOString(),
      dataAvailable: true,
    };

  } catch (error) {
    console.error('Error generating database summary:', error);
    return 'Error analyzing database data.';
  }

  return `
FINANCIAL MANAGEMENT SYSTEM - DATABASE SUMMARY
==============================================

MEMBERS:
- Total Members: ${summary.members.total}
- Active Members: ${summary.members.active}
- Pending Members: ${summary.members.pending}

FINANCIAL OVERVIEW:
- Total Deposits: ₱${summary.financial.totalDeposits.toLocaleString()}
- Total Loans: ₱${summary.financial.totalLoans.toLocaleString()}
- Total Payments: ₱${summary.financial.totalPayments.toLocaleString()}
- Total Withdraws: ₱${summary.financial.totalWithdraws.toLocaleString()}
- Net Funds: ₱${summary.financial.netFunds.toLocaleString()}

TRANSACTION COUNTS:
- Deposits: ${summary.financial.depositsCount}
- Loans: ${summary.financial.loansCount}
- Payments: ${summary.financial.paymentsCount}
- Withdraws: ${summary.financial.withdrawsCount}

PENDING APPLICATIONS:
- Registration Applications: ${summary.applications.pendingRegistrations}
- Deposit Applications: ${summary.applications.pendingDeposits}
- Loan Applications: ${summary.applications.pendingLoans}
- Payment Applications: ${summary.applications.pendingPayments}
- Withdraw Applications: ${summary.applications.pendingWithdraws}

Data last updated: ${summary.system.lastUpdated}
`;
};

// Get specific member data for AI context
export const getMemberData = async (database, memberId) => {
  try {
    const memberSnapshot = await database.ref(`Members/${memberId}`).once('value');
    const member = memberSnapshot.val();
    
    if (!member) return null;

    // Get member's transactions
    const [deposits, loans, payments, withdraws] = await Promise.all([
      database.ref(`Deposits/${memberId}`).once('value'),
      database.ref(`Loans/${memberId}`).once('value'),
      database.ref(`Payments/${memberId}`).once('value'),
      database.ref(`Withdraws/${memberId}`).once('value'),
    ]);

    return {
      member,
      deposits: deposits.val() || {},
      loans: loans.val() || {},
      payments: payments.val() || {},
      withdraws: withdraws.val() || {},
    };
  } catch (error) {
    console.error('Failed to load member data:', error);
    return null;
  }
};

// Get financial summary for a specific member
export const getMemberFinancialSummary = (memberData) => {
  if (!memberData) return 'Member data unavailable.';

  const { member, deposits, loans, payments, withdraws } = memberData;

  const calculateTotal = (dataObj) => {
    let total = 0;
    Object.values(dataObj).forEach(item => {
      if (item && typeof item.amount === 'number') {
        total += item.amount;
      } else if (item && typeof item.amount === 'string') {
        const num = parseFloat(item.amount);
        if (!isNaN(num)) total += num;
      }
    });
    return total;
  };

  const totalDeposits = calculateTotal(deposits);
  const totalLoans = calculateTotal(loans);
  const totalPayments = calculateTotal(payments);
  const totalWithdraws = calculateTotal(withdraws);

  return `
MEMBER FINANCIAL SUMMARY
========================
Name: ${member.name || 'N/A'}
Status: ${member.status || 'N/A'}
Member ID: ${member.id || 'N/A'}

FINANCIAL OVERVIEW:
- Total Deposits: ₱${totalDeposits.toLocaleString()}
- Total Loans: ₱${totalLoans.toLocaleString()}
- Total Payments: ₱${totalPayments.toLocaleString()}
- Total Withdraws: ₱${totalWithdraws.toLocaleString()}
- Net Balance: ₱${(totalDeposits + totalPayments - totalLoans - totalWithdraws).toLocaleString()}

TRANSACTION COUNTS:
- Deposits: ${Object.keys(deposits).length}
- Loans: ${Object.keys(loans).length}
- Payments: ${Object.keys(payments).length}
- Withdraws: ${Object.keys(withdraws).length}
`;
};

export default {
  loadAllDatabaseData,
  generateDatabaseSummary,
  getMemberData,
  getMemberFinancialSummary,
};