import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, BackHandler, Alert, RefreshControl
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
  const [refreshing, setRefreshing] = useState(false);
  const [loanStatus, setLoanStatus] = useState('Active');
  const [statusColor, setStatusColor] = useState('#3A7F0D');
  const [activeLoans, setActiveLoans] = useState([]);

  // Robust date formatter
  const formatDisplayDate = (dateInput) => {
    try {
      if (!dateInput) return 'N/A';

      // Handle Firebase Timestamp objects
      if (typeof dateInput === 'object' && dateInput.seconds !== undefined) {
        const date = new Date(dateInput.seconds * 1000);
        return date.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
      }

      // Handle string dates
      if (typeof dateInput === 'string') {
        // Try to parse the date
        const parsedDate = new Date(dateInput);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          });
        }
        return dateInput; // Return original if can't parse
      }

      // Handle Date objects
      if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
        return dateInput.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
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

      console.log('Parsing date input:', dateInput, typeof dateInput);

      // Firebase Timestamp
      if (typeof dateInput === 'object' && dateInput.seconds !== undefined) {
        const parsed = new Date(dateInput.seconds * 1000);
        console.log('Parsed Firebase timestamp:', parsed);
        return parsed;
      }

      // Handle string dates
      if (typeof dateInput === 'string') {
        // Handle "mm/dd/yyyy at 00:00" format
        if (dateInput.includes(' at ')) {
          const [datePart, timePart] = dateInput.split(' at ');
          if (datePart.includes('/')) {
            const [month, day, year] = datePart.split('/');
            const [hours, minutes] = timePart.split(':');
            const parsed = new Date(year, month - 1, day, hours, minutes);
            console.log('Parsed mm/dd/yyyy at HH:MM format:', parsed);
            return parsed;
          } else {
            // Handle "Month DD, YYYY at HH:MM" format
            const parsed = new Date(dateInput.replace(' at ', ' '));
            if (!isNaN(parsed.getTime())) {
              console.log('Parsed Month DD, YYYY at HH:MM format:', parsed);
              return parsed;
            }
          }
        }

        // Handle "August 20, 2025" format
        if (/^[A-Za-z]+ \d{1,2}, \d{4}$/.test(dateInput)) {
          const parsed = new Date(dateInput + ' 00:00:00');
          console.log('Parsed "Month DD, YYYY" format:', parsed);
          if (!isNaN(parsed.getTime())) {
            return parsed;
          }
        }

        // Handle "YYYY-MM-DD" format
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
          const parsed = new Date(dateInput + 'T00:00:00');
          console.log('Parsed YYYY-MM-DD format:', parsed);
          return parsed;
        }

        // Handle ISO string or other standard formats
        const parsed = new Date(dateInput);
        if (!isNaN(parsed.getTime())) {
          console.log('Parsed standard format:', parsed);
          return parsed;
        }
      }

      // Handle Date objects
      if (dateInput instanceof Date) {
        console.log('Already a Date object:', dateInput);
        return dateInput;
      }

      // Fallback to native Date parsing
      const fallback = new Date(dateInput);
      console.log('Fallback parsing:', fallback);
      return fallback;
    } catch (error) {
      console.warn('Date parsing error:', error);
      return new Date(); // Return current date as fallback
    }
  };

  // Check if due date is overdue
  const isDueDateOverdue = (dueDate) => {
    try {
      if (!dueDate) {
        console.log('No due date provided');
        return false;
      }
      
      console.log('Original due date from database:', dueDate, typeof dueDate);
      
      const dueDateObj = parseDateTime(dueDate);
      const today = new Date();
      
      // Set time to start of day for accurate comparison
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const dueDateStart = new Date(dueDateObj.getFullYear(), dueDateObj.getMonth(), dueDateObj.getDate());
      
      const isOverdue = todayStart >= dueDateStart;
      
      console.log('=== DUE DATE CHECK ===');
      console.log('Raw due date:', dueDate);
      console.log('Parsed due date:', dueDateObj.toDateString());
      console.log('Due date (start of day):', dueDateStart.toDateString());
      console.log('Today (start of day):', todayStart.toDateString());
      console.log('Today timestamp:', todayStart.getTime());
      console.log('Due date timestamp:', dueDateStart.getTime());
      console.log('Is overdue?', isOverdue);
      console.log('======================');
      
      return isOverdue;
    } catch (error) {
      console.warn('Due date check error:', error);
      return false;
    }
  };

  useEffect(() => {
    loadUserData();
  }, [route.params]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        navigation.navigate('AppHome');
        return true;
      }
    );
    return () => backHandler.remove();
  }, [navigation]);

  const fetchTransactionHistory = async (memberId) => {
    try {
      // Read from Transactions/Payments/memberId path where approved payments are stored
      const paymentsRef = dbRef(database, `Transactions/Payments/${memberId}`);
      const paymentsSnapshot = await get(paymentsRef);

      const transactions = [];

      if (paymentsSnapshot.exists()) {
        const data = paymentsSnapshot.val();
        Object.entries(data).forEach(([transactionId, payment]) => {
          // Only include approved payments
          if (payment.status === 'approved') {
            const timestamp = typeof payment.timestamp === 'number'
              ? payment.timestamp
              : (payment.dateApproved ? new Date(payment.dateApproved).getTime() : Date.now());
            
            transactions.push({
              transactionId: transactionId,
              type: 'Payment',
              amountToBePaid: parseFloat(payment.amountToBePaid || payment.amount || 0),
              dateApproved: payment.dateApproved,
              timestamp: timestamp,
              description: payment.description || '',
              status: payment.status,
              paymentOption: payment.paymentOption || 'Not specified'
            });
          }
        });

        // Sort by timestamp in descending order (newest first)
        transactions.sort((a, b) => b.timestamp - a.timestamp);
      }

      setTransactionHistory(transactions);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      setTransactionHistory([]);
    }
  };

  // Update the fetchUserLoan function to also fetch transaction history when member ID is found
  const fetchUserLoanWithHistory = async (userEmail) => {
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

      let memberId = null;

      if (approvedSnapshot.exists()) {
        const allApprovedLoans = approvedSnapshot.val();
        for (const mid in allApprovedLoans) {
          const loans = allApprovedLoans[mid];
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
              memberId = mid; // Store member ID for fetching payment history
              break;
            }
          }
          if (memberId) break;
        }
      }

      // Fetch current loans
      const currentLoansRef = dbRef(database, 'Loans/CurrentLoans');
      const currentSnapshot = await get(currentLoansRef);

      if (currentSnapshot.exists()) {
        const allCurrentLoans = currentSnapshot.val();
        const foundLoans = [];
        for (const mid in allCurrentLoans) {
          const loans = allCurrentLoans[mid];
          for (const loanId in loans) {
            const currentLoan = loans[loanId];
            if (currentLoan?.email === userEmail) {
              const loanData = {
                ...currentLoan,
                ...approvedData,
                _memberId: mid,
                _loanId: loanId,
                outstandingBalance: currentLoan.loanAmount,
                dateApplied: currentLoan.dateApplied,
                dateApproved: currentLoan.dateApproved || approvedData.dateApproved,
              };
              foundLoans.push(loanData);
              memberId = mid; // Ensure we have the member ID
            }
          }
        }
        if (foundLoans.length > 0) {
          // Sort newest approved first if possible
          foundLoans.sort((a, b) => {
            const at = a.dateApproved ? new Date(a.dateApproved).getTime() : 0;
            const bt = b.dateApproved ? new Date(b.dateApproved).getTime() : 0;
            return bt - at;
          });
          setActiveLoans(foundLoans);
          
          // Fetch payment history for this member
          if (memberId) {
            await fetchTransactionHistory(memberId);
          }
          
          return;
        }
      }
      setLoanDetails(null);
    } catch (error) {
      console.error('Error fetching loans:', error);
      Alert.alert('Error', 'Failed to load loan data');
      setLoanDetails(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUserData();
  };

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
        await fetchUserLoanWithHistory(userEmail);
      } else {
        setLoading(false);
        setRefreshing(false);
        Alert.alert('Error', 'User email not found');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setLoading(false);
      setRefreshing(false);
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
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const dueStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
      
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
      } else if (todayStart >= dueStart) {
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

  return (
    <View style={styles.container}>
      {/* Header with centered title and left back button using invisible spacers */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.headerSide} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={28} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitleText}>Existing Loans</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3A7F0D']}
            tintColor="#3A7F0D"
          />
        }
      >
        {/* Loan Details summary moved to dedicated LoanDetails screen */}

        <Text style={styles.sectionTitle}>Active Loans</Text>
        {activeLoans && activeLoans.length > 0 ? (
          activeLoans.map((loan) => (
            <TouchableOpacity
              key={loan.transactionId || loan._loanId}
              style={styles.transactionCard}
              onPress={() => {
                navigation.navigate('LoanDetails', {
                  item: {
                    ...loan,
                    outstandingBalance: parseFloat(loan.loanAmount || 0),
                  }
                });
              }}
            >
              {/* Display fields in requested order */}
              <View style={styles.transactionRow}>
                <Text style={styles.transactionLabel}>Loan Type:</Text>
                <Text style={styles.transactionValue}>{loan.loanType || 'Loan'}</Text>
              </View>
              <View style={styles.transactionRow}>
                <Text style={styles.transactionLabel}>Loan ID:</Text>
                <Text style={styles.transactionValue}>{loan.transactionId || loan._loanId || 'N/A'}</Text>
              </View>
              <View style={styles.transactionRow}>
                <Text style={styles.transactionLabel}>Outstanding Balance:</Text>
                <Text style={styles.transactionValue}>{`₱${(parseFloat(loan.loanAmount || 0)).toFixed(2)}`}</Text>
              </View>
              <View style={styles.transactionRow}>
                <Text style={styles.transactionLabel}>DueDate:</Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.transactionValue, isDueDateOverdue(loan.dueDate || loan.nextDueDate) && { color: '#D32F2F' }]}>
                    {formatDisplayDate(loan.dueDate || loan.nextDueDate)}
                  </Text>
                  {isDueDateOverdue(loan.dueDate || loan.nextDueDate) && (
                    <Text style={{ color: '#D32F2F', fontSize: 12, fontWeight: '700', marginTop: 2 }}>Overdue</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="account-balance" size={48} color="#D3D3D3" />
            <Text style={styles.emptyText}>No active loans</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Payment History (Approved Payments)</Text>
        {transactionHistory.length > 0 ? (
          transactionHistory.map((transaction) => (
            <View key={transaction.transactionId} style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                <Text style={styles.transactionType}>{transaction.type}</Text>
                <Text style={[
                  styles.transactionStatus,
                  { color: getStatusColor(transaction.status) }
                ]}>
                  {String(transaction.status || '').toUpperCase()}
                </Text>
              </View>
              {[
                { label: 'Amount:', value: `₱${Number(transaction.amountToBePaid || 0).toFixed(2)}` },
                { label: 'Transaction ID:', value: transaction.transactionId },
                { label: 'Payment Date:', value: formatDisplayDate(transaction.dateApproved) },
                { label: 'Mode of Payment:', value: transaction.paymentOption }
              ].map((item, index) => (
                <View key={index} style={styles.transactionRow}>
                  <Text style={styles.transactionLabel}>{item.label}</Text>
                  <Text style={styles.transactionValue}>{item.value}</Text>
                </View>
              ))}
              {transaction.description ? (
                <Text style={styles.transactionDescription}>Notes: {transaction.description}</Text>
              ) : null}
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
    backgroundColor: '#F8FAFC',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  // Header styles for centered title with left back button
  headerRow: {
    marginTop: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSide: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitleText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
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
  summaryValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end'
  },
  overdueText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 14,
  },
  overdueTextComplete: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF0000',
    backgroundColor: '#FFE6E6',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  overdueBadge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#FEE2E2',
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '600',
    borderRadius: 4,
    textAlign: 'center',
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