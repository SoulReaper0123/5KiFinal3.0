import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, BackHandler, Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ref as dbRef, get } from 'firebase/database';
import { auth, database } from '../../firebaseConfig';

const ExistingLoan = () => {
  const navigation = useNavigation();
  const [loanDetails, setLoanDetails] = useState(null);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (user && user.email) {
      fetchUserLoan(user.email);
    }
  }, []);

  useEffect(() => {
    const handleBackPress = () => {
      navigation.navigate('Home');
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [navigation]);

  const fetchUserLoan = async (userEmail) => {
    try {
      const loansRef = dbRef(database, 'Loans/CurrentLoans');
      const snapshot = await get(loansRef);

      if (snapshot.exists()) {
        const allLoans = snapshot.val();
        let found = false;

        for (const memberId in allLoans) {
          const transactions = allLoans[memberId];
          for (const transactionId in transactions) {
            const loan = transactions[transactionId];
            if (loan.email === userEmail) {
              setLoanDetails(loan);
              checkOverdueStatus(loan);
              fetchTransactionHistory(memberId);
              found = true;
              break;
            }
          }
          if (found) break;
        }

        if (!found) {
          setLoanDetails(null);
        }
      } else {
        setLoanDetails(null);
      }
    } catch (error) {
      console.error('Error fetching loans:', error);
      setLoanDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const checkOverdueStatus = (loan) => {
    if (loan.dueDate || loan.nextDueDate) {
      const dueDate = new Date(loan.dueDate || loan.nextDueDate);
      const today = new Date();
      if (today > dueDate) {
        setIsOverdue(true);
        Alert.alert(
          'Overdue Payment',
          'You have an overdue payment. Please make your payment as soon as possible to avoid penalties.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const fetchTransactionHistory = async (memberId) => {
    try {
      const transactionsRef = dbRef(database, `Transactions/Payments/${memberId}`);
      const snapshot = await get(transactionsRef);

      if (snapshot.exists()) {
        const transactionsData = snapshot.val();
        const transactions = [];

        Object.entries(transactionsData).forEach(([transactionId, transactionData]) => {
          transactions.push({
            transactionId,
            type: transactionData.type || 'Payment',
            amount: transactionData.amount ? parseFloat(transactionData.amount) : 0,
            date: transactionData.date || '',
            description: transactionData.description || '',
            status: transactionData.status || 'Pending',
            paymentMethod: transactionData.paymentMethod || 'Not specified',
          });
        });

        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        setTransactionHistory(transactions);
      } else {
        setTransactionHistory([]);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'approved':
      case 'paid':
        return '#3A7F0D';
      case 'pending':
        return '#FFA000';
      case 'rejected':
        return '#D32F2F';
      default:
        return '#2D5783';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Invalid Date';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <MaterialIcons name="arrow-back" size={30} color="#2D5783" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Loan Details</Text>
      <View style={{ width: 24 }} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3A7F0D" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {loanDetails && (
            <View style={[styles.loanSummaryCard, isOverdue && styles.overdueCard]}>
              <Text style={styles.summaryTitle}>Current Loan {isOverdue && '⚠️'}</Text>
              
              {isOverdue && (
                <View style={styles.overdueBanner}>
                  <Text style={styles.overdueText}>OVERDUE PAYMENT</Text>
                </View>
              )}
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Loan Type</Text>
                <Text style={styles.summaryValue}>{loanDetails.loanType || 'N/A'}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Loan Amount</Text>
                <Text style={styles.summaryValue}>₱{parseFloat(loanDetails.loanAmount || 0).toFixed(2)}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Date Applied</Text>
                <Text style={styles.summaryValue}>{formatDate(loanDetails.dateApplied)}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Outstanding Balance</Text>
                <Text style={styles.summaryValue}>₱{parseFloat(loanDetails.outstandingBalance || loanDetails.balance || 0).toFixed(2)}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Monthly Payment</Text>
                <Text style={styles.summaryValue}>₱{parseFloat(loanDetails.totalMonthlyPayment || loanDetails.monthlyPayment || 0).toFixed(2)}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Due Date</Text>
                <Text style={[styles.summaryValue, isOverdue && styles.overdueText]}>
                  {formatDate(loanDetails.dueDate || loanDetails.nextDueDate)}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Status</Text>
                <Text style={[styles.summaryValue, { color: getStatusColor(loanDetails.status) }]}>
                  {loanDetails.status || 'Active'}
                </Text>
              </View>
            </View>
          )}

          <Text style={styles.sectionTitle}>Payment History</Text>
          
          {transactionHistory.length > 0 ? (
            transactionHistory.map((transaction, index) => (
              <View key={index} style={styles.transactionCard}>
                <View style={styles.transactionHeader}>
                  <Text style={styles.transactionType}>{transaction.type}</Text>
                  <Text style={[styles.transactionStatus, { color: getStatusColor(transaction.status) }]}>
                    {transaction.status.toUpperCase()}
                  </Text>
                </View>
                
                <View style={styles.transactionRow}>
                  <Text style={styles.transactionLabel}>Amount:</Text>
                  <Text style={styles.transactionValue}>₱{transaction.amount.toFixed(2)}</Text>
                </View>
                
                <View style={styles.transactionRow}>
                  <Text style={styles.transactionLabel}>Transaction ID:</Text>
                  <Text style={styles.transactionValue}>{transaction.transactionId}</Text>
                </View>
                
                <View style={styles.transactionRow}>
                  <Text style={styles.transactionLabel}>Payment Date:</Text>
                  <Text style={styles.transactionValue}>{formatDate(transaction.date)}</Text>
                </View>
                
                <View style={styles.transactionRow}>
                  <Text style={styles.transactionLabel}>Mode of Payment:</Text>
                  <Text style={styles.transactionValue}>{transaction.paymentMethod}</Text>
                </View>
                
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
              <Text style={styles.emptyText}>No transactions found</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffffff',
    paddingTop: 50,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#2D5783',
    textAlign: 'center',
    marginBottom: 15,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#555',
  },
  loanSummaryCard: {
    backgroundColor: '#d3e8fdff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  overdueCard: {
    borderWidth: 2,
    borderColor: '#D32F2F',
  },
  overdueBanner: {
    backgroundColor: '#D32F2F',
    padding: 5,
    borderRadius: 4,
    marginBottom: 10,
  },
  overdueText: {
    color: '#D32F2F',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D5783',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D5783',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D5783',
    marginBottom: 12,
  },
  transactionCard: {
    backgroundColor: '#d3e8fdff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D5783',
  },
  transactionStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  transactionLabel: {
    fontSize: 14,
    color: '#666',
  },
  transactionValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D5783',
  },
  transactionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 16,
  },
});

export default ExistingLoan;