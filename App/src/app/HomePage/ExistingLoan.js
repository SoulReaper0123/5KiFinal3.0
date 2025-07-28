import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, BackHandler } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ref as dbRef, get } from 'firebase/database';
import { auth, database } from '../../firebaseConfig';

const ExistingLoan = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [loanDetails, setLoanDetails] = useState(null);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setEmail(user.email);
      fetchApprovedLoan(user.email);
      fetchTransactionHistory(user.email);
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

  // Fetch loan data for the current user
  const fetchApprovedLoan = async (userEmail) => {
    try {
      const loansRef = dbRef(database, 'ApprovedLoans');
      const snapshot = await get(loansRef);

      if (snapshot.exists()) {
        const approvedLoans = snapshot.val();
        const userLoan = Object.entries(approvedLoans).find(
          ([, loan]) => loan.email === userEmail
        );

        if (userLoan) {
          const [, loanData] = userLoan;
          setLoanDetails(loanData);
        } else {
          Alert.alert('No Loans Found', 'No loans are approved for this user.');
        }
      } else {
        Alert.alert('No Data Available', 'No approved loans found in the database.');
      }
    } catch (error) {
      console.error('Error fetching approved loans:', error);
      Alert.alert('Fetch Error', 'Failed to retrieve approved loans. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch transaction history for ApplyLoans and PayLoans
  const fetchTransactionHistory = async (userEmail) => {
    try {
      const transactionsRef = dbRef(database, 'Transactions');
      const snapshot = await get(transactionsRef);

      if (snapshot.exists()) {
        const transactionsData = snapshot.val();
        const filteredTransactions = parseTransactions(transactionsData, userEmail);
        setTransactionHistory(filteredTransactions);
      } else {
        Alert.alert('No Data Available', 'No transactions found in the database.');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      Alert.alert('Fetch Error', 'Failed to retrieve transactions. Please try again.');
    }
  };

  // Helper function to parse transactions
  const parseTransactions = (data, userEmail) => {
    const parsed = [];
    for (const [type, members] of Object.entries(data)) {
      for (const [memberId, transactionsList] of Object.entries(members)) {
        for (const [transactionId, details] of Object.entries(transactionsList)) {
          if (details.email === userEmail && (type === 'ApplyLoans' || type === 'PayLoans')) {
            parsed.push({
              type,
              transactionId,
              label: type === 'ApplyLoans' ? 'Loan Applied' : 'Loan Payment',
              amount: type === 'ApplyLoans' ? -parseFloat(details.loanAmount) : parseFloat(details.amount),
              dateApplied: details.dateApplied,
              dateApproved: details.dateApproved,
            });
          }
        }
      }
    }
    return parsed;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={30} color="white" />
      </TouchableOpacity>

      <Text style={styles.title}>Existing Loan</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading loan details...</Text>
        </View>
      ) : loanDetails ? (
        <LoanCard loanDetails={loanDetails} />
      ) : (
        <Text style={styles.noLoansText}>No loans found.</Text>
      )}

      <TransactionHistory transactionHistory={transactionHistory} />
    </ScrollView>
  );
};

// Function to render loan details
const LoanCard = ({ loanDetails }) => (
  <View style={styles.loanCard}>
    <Text style={styles.loanText}><Text style={styles.label}>Loan Type:</Text> {loanDetails.loanType}</Text>
    <Text style={styles.loanText}><Text style={styles.label}>Loan Amount:</Text> ₱{parseFloat(loanDetails.loanAmount).toFixed(2)}</Text>
    <Text style={styles.loanText}><Text style={styles.label}>Term:</Text> {loanDetails.term} Months</Text>
    <Text style={styles.loanText}><Text style={styles.label}>Interest:</Text> {parseFloat(loanDetails.interestPercentage).toFixed(2)}%</Text>
    <Text style={styles.loanText}><Text style={styles.label}>Monthly Payment:</Text> ₱{parseFloat(loanDetails.monthlyPayment).toFixed(2)}</Text>
    <Text style={styles.loanText}><Text style={styles.label}>Interest Amount:</Text> ₱{parseFloat(loanDetails.interest).toFixed(2)}</Text>
    <Text style={styles.loanText}><Text style={styles.label}>Total Payment:</Text> ₱{parseFloat(loanDetails.totalMonthlyPayment).toFixed(2)}</Text>
    <Text style={styles.loanText}><Text style={styles.label}>Monthly Due Date:</Text> {loanDetails.dueDateMonth}</Text>
    <Text style={styles.loanText}><Text style={styles.label}>Due Date Term:</Text> {loanDetails.dueDateTerm}</Text>
  </View>
);

// Transaction History Component
const TransactionHistory = ({ transactionHistory }) => (
  <View style={styles.historySection}>
    <Text style={styles.historyTitle}>History</Text>
    {transactionHistory.length > 0 ? (
      transactionHistory.map((transaction) => (
        <View key={transaction.transactionId} style={styles.transactionCard}>
          <Text style={styles.transactionLabel}>{transaction.label}</Text>
          <TouchableOpacity onPress={() => showTransactionAmount(transaction.amount)}>
            <Text style={transaction.amount >= 0 ? styles.transactionAmountPositive : styles.transactionAmountNegative}>
              {formatTransactionAmount(transaction.amount)}
            </Text>
          </TouchableOpacity>
          <Text style={styles.transactionText}>Transaction ID: {transaction.transactionId}</Text>
          <Text style={styles.transactionText}>Date Approved: {transaction.dateApproved}</Text>
        </View>
      ))
    ) : (
      <Text style={styles.noHistoryText}>No transaction history found.</Text>
    )}
  </View>
);

// Helper functions for transaction formatting
const formatTransactionAmount = (amount) => {
  return amount >= 0 ? `+ ₱${parseFloat(amount).toFixed(2)}` : `- ₱${Math.abs(parseFloat(amount)).toFixed(2)}`;
};

const showTransactionAmount = (amount) => {
  Alert.alert('Transaction Amount', formatTransactionAmount(amount));
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    backgroundColor: '#2D5783',
    paddingBottom: 30,
  },
  backButton: {
    marginBottom: 10,
    marginTop: 50,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: 'white',
    marginBottom: 30,
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: 'white',
  },
  loanCard: {

    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
    borderColor: '#eee',
    borderWidth: 1,
  },
  loanText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#444',
  },
  label: {
    fontWeight: '600',
    color: '#000',
  },
  noLoansText: {
    fontSize: 18,
    color: '#999',
    textAlign: 'center',
    marginTop: 50,
  },
  historySection: {
    marginTop: 20,
  },
  historyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: 'white',
    marginBottom: 15,
  },
  transactionCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 2,
  },
  transactionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
  },
  transactionAmountPositive: {
    fontSize: 18,
    color: 'green',
  },
  transactionAmountNegative: {
    fontSize: 18,
    color: 'red',
  },
  transactionText: {
    fontSize: 14,
    color: '#555',
  },
  noHistoryText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 30,
  },
});

export default ExistingLoan;
