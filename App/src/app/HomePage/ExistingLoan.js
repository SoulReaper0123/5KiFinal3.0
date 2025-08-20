import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, BackHandler, Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ref as dbRef, get } from 'firebase/database';
import { auth, database } from '../../firebaseConfig';
import * as SecureStore from 'expo-secure-store';

const ExistingLoan = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [loanDetails, setLoanDetails] = useState(null);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loanStatus, setLoanStatus] = useState('Active');
  const [statusColor, setStatusColor] = useState('#3A7F0D');

  // Robust date formatter
  const formatDisplayDate = (dateInput) => {
    try {
      if (!dateInput) return 'N/A';

      // Handle Firebase Timestamp objects
      if (typeof dateInput === 'object' && dateInput.seconds !== undefined) {
        const date = new Date(dateInput.seconds * 1000);
        return date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }

      // Handle string dates
      if (typeof dateInput === 'string') {
        // Return as-is if in "mm/dd/yyyy at 00:00" format
        if (/^\d{2}\/\d{2}\/\d{4} at \d{2}:\d{2}$/.test(dateInput)) {
          return dateInput;
        }
        
        // Try to parse other string formats
        const parsedDate = new Date(dateInput);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toLocaleString();
        }
        return dateInput; // Return original if can't parse
      }

      return 'N/A';
    } catch (error) {
      console.warn('Date formatting error:', error);
      return 'N/A';
    }
  };

  // Safe date parser
  const parseDateTime = (dateInput) => {
    try {
      if (!dateInput) return new Date();

      // Firebase Timestamp
      if (typeof dateInput === 'object' && dateInput.seconds !== undefined) {
        return new Date(dateInput.seconds * 1000);
      }

      // Handle "mm/dd/yyyy at 00:00" format
      if (typeof dateInput === 'string' && dateInput.includes(' at ')) {
        const [datePart, timePart] = dateInput.split(' at ');
        const [month, day, year] = datePart.split('/');
        const [hours, minutes] = timePart.split(':');
        return new Date(year, month - 1, day, hours, minutes);
      }

      // Fallback to native Date parsing
      return new Date(dateInput);
    } catch (error) {
      console.warn('Date parsing error:', error);
      return new Date(); // Return current date as fallback
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Try to get email from auth
        const user = auth.currentUser;
        let userEmail = user?.email;
        
        // Check if user data is passed via navigation (from fingerprint auth)
        if (!userEmail && route.params?.user?.email) {
          userEmail = route.params.user.email;
        }
        
        // If still not available, try to get from SecureStore (for biometric login)
        if (!userEmail) {
          try {
            const storedEmail = await SecureStore.getItemAsync('currentUserEmail');
            if (storedEmail) {
              userEmail = storedEmail;
            }
          } catch (error) {
            console.error('Error getting email from SecureStore:', error);
          }
        }
        
        if (userEmail) {
          fetchUserLoan(userEmail);
        } else {
          setLoading(false);
          Alert.alert('Error', 'User email not found');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [route.params]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        navigation.navigate('Home');
        return true;
      }
    );
    return () => backHandler.remove();
  }, [navigation]);

  const fetchUserLoan = async (userEmail) => {
    try {
      setLoading(true);
      
      // Fetch approved loans
      const approvedLoansRef = dbRef(database, 'Loans/ApprovedLoans');
      const approvedSnapshot = await get(approvedLoansRef);
      
      let approvedData = {
        loanAmount: 0,
        dateApproved: null,
        interestRate: 0,
        interest: 0,
        term: 0
      };

      if (approvedSnapshot.exists()) {
        const allApprovedLoans = approvedSnapshot.val();
        for (const memberId in allApprovedLoans) {
          const loans = allApprovedLoans[memberId];
          for (const loanId in loans) {
            const loan = loans[loanId];
            if (loan?.email === userEmail) {
              approvedData = {
                loanAmount: parseFloat(loan.loanAmount || 0),
                dateApproved: loan.dateApproved,
                interestRate: parseFloat(loan.interestRate || 0),
                interest: parseFloat(loan.interest || 0),
                term: parseInt(loan.term || 0)
              };
              break;
            }
          }
        }
      }

      // Fetch current loans
      const currentLoansRef = dbRef(database, 'Loans/CurrentLoans');
      const currentSnapshot = await get(currentLoansRef);

      if (currentSnapshot.exists()) {
        const allCurrentLoans = currentSnapshot.val();
        for (const memberId in allCurrentLoans) {
          const loans = allCurrentLoans[memberId];
          for (const loanId in loans) {
            const currentLoan = loans[loanId];
            if (currentLoan?.email === userEmail) {
              const loanData = {
                ...currentLoan,
                ...approvedData,
                outstandingBalance: currentLoan.loanAmount,
                dateApplied: currentLoan.dateApplied,
                dateApproved: currentLoan.dateApproved || approvedData.dateApproved,
              };
              setLoanDetails(loanData);
              checkLoanStatus(loanData);
              fetchTransactionHistory(memberId);
              return;
            }
          }
        }
      }
      setLoanDetails(null);
    } catch (error) {
      console.error('Error fetching loans:', error);
      Alert.alert('Error', 'Failed to load loan data');
      setLoanDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const checkLoanStatus = (loan) => {
    if (!loan) {
      setLoanStatus('Unknown');
      setStatusColor('#666');
      return;
    }

    try {
      const dueDate = parseDateTime(loan.dueDate || loan.nextDueDate);
      const today = new Date();
      
      const hasPaymentThisMonth = transactionHistory.some(t => {
        const paymentDate = parseDateTime(t.dateApproved);
        return (
          t.status?.toLowerCase() === 'paid' &&
          paymentDate.getMonth() === today.getMonth() &&
          paymentDate.getFullYear() === today.getFullYear()
        );
      });

      if (hasPaymentThisMonth) {
        setLoanStatus('Paid');
        setStatusColor('#4CAF50');
      } else if (today > dueDate) {
        setLoanStatus('Overdue');
        setStatusColor('#F44336');
      } else {
        setLoanStatus('Active');
        setStatusColor('#2D5783');
      }
    } catch (error) {
      console.warn('Status check error:', error);
      setLoanStatus('Unknown');
      setStatusColor('#666');
    }
  };

 const fetchTransactionHistory = async (memberId) => {
  try {
    const transactionsRef = dbRef(database, `Transactions/Payments/${memberId}`);
    const snapshot = await get(transactionsRef);

    if (snapshot.exists()) {
      const transactionsData = snapshot.val();
      const transactions = Object.entries(transactionsData)
        .map(([id, t]) => ({
          transactionId: id,
          type: t.type || 'Payment',
          amountToBePaid: parseFloat(t.amountToBePaid || 0),
          dateApproved: t.dateApproved,
          description: t.description || '',
          status: t.status || 'Pending',
          paymentOption: t.paymentOption || 'Not specified'
        }))
        // Only include "Completed" or "Paid" transactions
        .filter(t => {
          const status = t.status.toLowerCase();
          return status === 'completed' || status === 'paid';
        });

      transactions.sort((a, b) => 
        parseDateTime(b.dateApproved).getTime() - parseDateTime(a.dateApproved).getTime()
      );
      
      setTransactionHistory(transactions);
    } else {
      setTransactionHistory([]);
    }
  } catch (error) {
    console.error('Error fetching transactions:', error);
    setTransactionHistory([]);
  }
};

  const getStatusColor = (status) => {
    switch(String(status).toLowerCase()) {
      case 'approved':
      case 'paid': return '#3A7F0D';
      case 'pending': return '#FFA000';
      case 'rejected': return '#D32F2F';
      default: return '#2D5783';
    }
  };

  const getCardStyle = () => [
    styles.loanSummaryCard,
    loanStatus === 'Overdue' ? styles.overdueCard :
    loanStatus === 'Paid' ? styles.paidCard : styles.activeCard
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3A7F0D" />
        <Text style={styles.loadingText}>Loading loan details...</Text>
      </View>
    );
  }

  if (!loanDetails) {
    return (
      <View style={styles.container}>
        <Text style={styles.noLoansText}>No active loan found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={() => navigation.goBack()} 
        style={styles.backButton}
      >
        <MaterialIcons name="arrow-back" size={30} color="#2D5783" />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>Loan Details</Text>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={getCardStyle()}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Current Loan</Text>
            <Text style={[styles.loanStatus, { color: statusColor }]}>
              {loanStatus.toUpperCase()}
            </Text>
          </View>
          
          {[
            { label: 'Loan ID', value: loanDetails.transactionId || 'N/A' },
            { label: 'Loan Type', value: loanDetails.loanType || 'N/A' },
            { label: 'Approved Amount', value: `₱${(loanDetails.loanAmount || 0).toFixed(2)}` },
            { label: 'Outstanding Balance', value: `₱${(loanDetails.outstandingBalance || 0).toFixed(2)}` },
            { label: 'Date Applied', value: formatDisplayDate(loanDetails.dateApplied) },
            { label: 'Date Approved', value: formatDisplayDate(loanDetails.dateApproved) },
            { label: 'Interest Rate', value: `${(loanDetails.interestRate || 0).toFixed(2)}%` },
            { label: 'Total Interest', value: `₱${(loanDetails.interest || 0).toFixed(2)}` },
            { label: 'Terms', value: loanDetails.term ? `${loanDetails.term} months` : 'N/A' },
            { label: 'Monthly Payment', value: `₱${(loanDetails.monthlyPayment || 0).toFixed(2)}` },
            { 
              label: 'Due Date', 
              value: formatDisplayDate(loanDetails.dueDate || loanDetails.nextDueDate),
              style: loanStatus === 'Overdue' ? styles.overdueText : null 
            }
          ].map((item, index) => (
            <View key={index} style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{item.label}</Text>
              <Text style={[styles.summaryValue, item.style]}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Payment History</Text>
        
        {transactionHistory.length > 0 ? (
          transactionHistory.map((transaction) => (
            <View key={transaction.transactionId} style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                <Text style={styles.transactionType}>{transaction.type}</Text>
                <Text style={[
                  styles.transactionStatus, 
                  { color: getStatusColor(transaction.status) }
                ]}>
                  {transaction.status.toUpperCase()}
                </Text>
              </View>
              
              {[
                { label: 'Amount:', value: `₱${transaction.amountToBePaid.toFixed(2)}` },
                { label: 'Transaction ID:', value: transaction.transactionId },
                { label: 'Payment Date:', value: formatDisplayDate(transaction.dateApproved) },
                { label: 'Mode of Payment:', value: transaction.paymentOption }
              ].map((item, index) => (
                <View key={index} style={styles.transactionRow}>
                  <Text style={styles.transactionLabel}>{item.label}</Text>
                  <Text style={styles.transactionValue}>{item.value}</Text>
                </View>
              ))}
              
              {transaction.description && (
                <Text style={styles.transactionDescription}>
                  Notes: {transaction.description}
                </Text>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="receipt" size={48} color="#D3D3D3" />
            <Text style={styles.emptyText}>No payment history found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 16
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D5783',
    textAlign: 'center',
    marginBottom: 20
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#555'
  },
  noLoansText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 40,
    color: '#666'
  },
  scrollContent: {
    paddingBottom: 30
  },
  loanSummaryCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  activeCard: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 5,
    borderLeftColor: '#2D5783'
  },
  overdueCard: {
    backgroundColor: '#FFF0F0',
    borderLeftWidth: 5,
    borderLeftColor: '#D32F2F'
  },
  paidCard: {
    backgroundColor: '#F0FFF4',
    borderLeftWidth: 5,
    borderLeftColor: '#3A7F0D'
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D5783'
  },
  loanStatus: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666'
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D5783'
  },
  overdueText: {
    color: '#D32F2F',
    fontWeight: 'bold'
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D5783',
    marginBottom: 12,
    marginTop: 8
  },
  transactionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D5783'
  },
  transactionStatus: {
    fontSize: 14,
    fontWeight: '500'
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  transactionLabel: {
    fontSize: 14,
    color: '#666'
  },
  transactionValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D5783'
  },
  transactionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic'
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 16
  }
});

export default ExistingLoan;