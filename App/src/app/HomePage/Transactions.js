import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity, // ✅ added
} from 'react-native';
import { ref, get } from 'firebase/database';
import { database } from '../../firebaseConfig';
import { MaterialIcons } from '@expo/vector-icons'; // ✅ added
import { useNavigation } from '@react-navigation/native'; // ✅ added

const Transactions = ({ route }) => {
  const navigation = useNavigation(); // ✅ added
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const email = route.params?.email;

  const fetchTransactions = async () => {
    setLoading(true);
    const transactionsRef = ref(database, 'Transactions');

    try {
      const snapshot = await get(transactionsRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const parsedTransactions = parseTransactions(data);

        const filteredTransactions = parsedTransactions.filter(transaction => transaction.email === email);

        filteredTransactions.sort((a, b) => new Date(b.dateApproved) - new Date(a.dateApproved));

        setTransactions(filteredTransactions);
      } else {
        console.log('No data available');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [email]);

  const parseTransactions = (data) => {
    const parsed = [];
    for (const [type, members] of Object.entries(data)) {
      for (const [memberId, transactionsList] of Object.entries(members)) {
        for (const [transactionId, details] of Object.entries(transactionsList)) {
          const transactionData = {
            memberId,
            type,
            transactionId,
            email: details.email,
            dateApplied: details.dateApplied,
            dateApproved: details.dateApproved,
            amount: 0,
          };

          switch (type) {
            case 'Loans':
              transactionData.amount = parseFloat(details.loanAmount).toFixed(2) * -1;
              transactionData.label = 'Loan Applied';
              transactionData.disbursement = details.disbursement;
              break;
            case 'Deposits':
              transactionData.amount = parseFloat(details.amountToBeDeposited).toFixed(2);
              transactionData.label = 'Deposit';
              transactionData.depositOption = details.depositOption;
              break;
            case 'PayLoans':
              transactionData.amount = parseFloat(details.amount).toFixed(2);
              transactionData.label = 'Loan Payment';
              transactionData.paymentOption = details.paymentOption;
              break;
            case 'Withdrawals':
              transactionData.amount = parseFloat(details.amountWithdrawn).toFixed(2) * -1;
              transactionData.label = 'Withdraw';
              transactionData.withdrawOption = details.withdrawOption;
              break;
            default:
              transactionData.amount = 0;
              transactionData.label = 'Unknown';
              break;
          }

          parsed.push(transactionData);
        }
      }
    }
    return parsed;
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions().then(() => setRefreshing(false));
  };

  const renderTransaction = (transaction) => (
    <View key={transaction.transactionId} style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <Text style={styles.transactionLabel}>{transaction.label}</Text>
        <Text style={styles.transactionAmount}>
          {transaction.amount >= 0
            ? `+ ₱${parseFloat(transaction.amount).toFixed(2)}`
            : `- ₱${Math.abs(parseFloat(transaction.amount)).toFixed(2)}`}
        </Text>
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionText}>Transaction ID: {transaction.transactionId}</Text>
        <Text style={styles.transactionText}>Date Applied: {transaction.dateApplied}</Text>
        <Text style={styles.transactionText}>Date Approved: {transaction.dateApproved}</Text>
        {transaction.disbursement && <Text style={styles.transactionText}>Disbursement: {transaction.disbursement}</Text>}
        {transaction.depositOption && <Text style={styles.transactionText}>Deposit Option: {transaction.depositOption}</Text>}
        {transaction.paymentOption && <Text style={styles.transactionText}>Payment Option: {transaction.paymentOption}</Text>}
        {transaction.withdrawOption && <Text style={styles.transactionText}>Withdraw Option: {transaction.withdrawOption}</Text>}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* ✅ Back button only */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ position: 'absolute', top: 50, left: 20, zIndex: 1 }}>
        <MaterialIcons name="arrow-back" size={28} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.title}>Transactions</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={styles.loading} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {transactions.length > 0 ? (
            transactions.map(renderTransaction)
          ) : (
            <Text style={styles.noTransactionsText}>No transactions found</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#2D5783',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 40,
    color: 'white',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
    marginTop: 5,
  },
  transactionCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  transactionLabel: {
    fontWeight: '600',
    fontSize: 18,
    color: 'black',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'green',
  },
  transactionDetails: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 10,
  },
  transactionText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  loading: {
    marginTop: 50,
  },
  noTransactionsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginTop: 20,
  },
});

export default Transactions;