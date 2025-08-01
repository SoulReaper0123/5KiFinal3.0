import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { ref, get } from 'firebase/database';
import { database } from '../../firebaseConfig';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const Transactions = ({ route }) => {
  const navigation = useNavigation();
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
            label: '',
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
    <View key={transaction.transactionId} style={styles.card}>
      <View style={styles.textContainer}>
        <View style={styles.transactionHeader}>
          <Text style={styles.title}>{transaction.label}</Text>
          <Text style={[
            styles.amount,
            { color: transaction.amount >= 0 ? '#4CAF50' : '#E53935' }
          ]}>
            {transaction.amount >= 0
              ? `+ ₱${parseFloat(transaction.amount).toFixed(2)}`
              : `- ₱${Math.abs(parseFloat(transaction.amount)).toFixed(2)}`}
          </Text>
        </View>
        <Text style={styles.detail}>Transaction ID: {transaction.transactionId}</Text>
        <Text style={styles.detail}>Date Applied: {transaction.dateApplied}</Text>
        <Text style={styles.detail}>Date Approved: {transaction.dateApproved}</Text>
        {transaction.disbursement && <Text style={styles.detail}>Disbursement: {transaction.disbursement}</Text>}
        {transaction.depositOption && <Text style={styles.detail}>Deposit Option: {transaction.depositOption}</Text>}
        {transaction.paymentOption && <Text style={styles.detail}>Payment Option: {transaction.paymentOption}</Text>}
        {transaction.withdrawOption && <Text style={styles.detail}>Withdraw Option: {transaction.withdrawOption}</Text>}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={30} color="#2D5783" />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>Transactions</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#234E70" style={{ marginTop: 30 }} />
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
    marginBottom: 20,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#d3e8fdff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
  },
  textContainer: {
    flexShrink: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  detail: {
    fontSize: 14,
    color: '#333',
    marginVertical: 2,
  },
  noTransactionsText: {
    marginTop: 30,
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
});

export default Transactions;