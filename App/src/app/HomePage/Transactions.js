import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { ref, get } from 'firebase/database';
import { database } from '../../firebaseConfig';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { auth } from '../../firebaseConfig';

const Transactions = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Get email from multiple sources for better compatibility
  const getEmailFromSources = () => {
    const user = auth.currentUser;
    return user?.email || route.params?.user?.email || route.params?.email;
  };
  
  const email = getEmailFromSources();

  const fetchTransactions = async () => {
    setLoading(true);
    const transactionsRef = ref(database, 'Transactions');

    try {
      const snapshot = await get(transactionsRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const parsedTransactions = parseTransactions(data);

        const filteredTransactions = parsedTransactions.filter(transaction => transaction.email === email);

        // Sort by timestamp in descending order (newest first)
        filteredTransactions.sort((a, b) => b.timestamp - a.timestamp);

        setTransactions(filteredTransactions);
      } else {
        console.log('No data available');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  useEffect(() => {
    fetchTransactions();
  }, [email]);

  const parseTransactions = (data) => {
    const parsed = [];
    for (const [type, members] of Object.entries(data)) {
      for (const [memberId, transactionsList] of Object.entries(members)) {
        for (const [transactionId, details] of Object.entries(transactionsList)) {
          // Skip rejected applications
          if (details.status === 'rejected') {
            continue;
          }

          // Create timestamp for sorting - prioritize existing timestamp field
          const getTimestamp = (details) => {
            // First, check if there's already a timestamp field from web approval
            if (details.timestamp && typeof details.timestamp === 'number') {
              return details.timestamp;
            }
            
            // Fallback to date parsing
            const dateToUse = details.dateApproved || details.dateApplied;
            if (!dateToUse) return Date.now();
            
            // Handle Firebase timestamp objects
            if (typeof dateToUse === 'object' && dateToUse.seconds) {
              return dateToUse.seconds * 1000;
            }
            
            // Handle string dates
            if (typeof dateToUse === 'string') {
              const parsed = new Date(dateToUse);
              return isNaN(parsed.getTime()) ? Date.now() : parsed.getTime();
            }
            
            return new Date(dateToUse).getTime() || Date.now();
          };

          const transactionData = {
            memberId,
            type,
            transactionId,
            email: details.email,
            dateApplied: details.dateApplied,
            dateApproved: details.dateApproved,
            timestamp: getTimestamp(details),
            amount: 0,
            label: '',
            status: details.status,
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
            case 'Payments':
              transactionData.amount = parseFloat(details.amountToBePaid).toFixed(2);
              transactionData.label = 'Loan Payment';
              transactionData.paymentOption = details.paymentOption;
              break;
            case 'Withdrawals':
              transactionData.amount = parseFloat(details.amountWithdrawn).toFixed(2) * -1;
              transactionData.label = 'Withdraw';
              transactionData.withdrawOption = details.withdrawOption;
              break;
            case 'Registrations':
              transactionData.amount = parseFloat(details.amount || 0).toFixed(2);
              transactionData.label = 'Registration Fee';
              transactionData.description = details.description;
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

  const handleTransactionPress = (transaction) => {
    setSelectedTransaction(transaction);
    setModalVisible(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'Deposits': return 'arrow-downward';
      case 'Withdrawals': return 'arrow-upward';  
      case 'Loans': return 'account-balance';
      case 'Payments': return 'payment';
      case 'Registrations': return 'person-add';
      default: return 'receipt';
    }
  };

  const renderTransaction = (transaction) => (
    <TouchableOpacity 
      key={transaction.transactionId} 
      style={styles.compactCard}
      onPress={() => handleTransactionPress(transaction)}
    >
      <View style={styles.iconContainer}>
        <MaterialIcons 
          name={getTransactionIcon(transaction.type)} 
          size={24} 
          color={transaction.amount >= 0 ? '#4CAF50' : '#E53935'} 
        />
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionTitle}>{transaction.label}</Text>
        <Text style={styles.transactionDate}>
          {formatDate(transaction.dateApproved || transaction.dateApplied)}
        </Text>
      </View>
      <Text style={[
        styles.transactionAmount,
        { color: transaction.amount >= 0 ? '#4CAF50' : '#E53935' }
      ]}>
        {transaction.amount >= 0
          ? `+₱${parseFloat(transaction.amount).toFixed(2)}`
          : `-₱${Math.abs(parseFloat(transaction.amount)).toFixed(2)}`}
      </Text>
    </TouchableOpacity>
  );

  const renderTransactionModal = () => {
    if (!selectedTransaction) return null;

    const details = [];
    details.push({ label: 'Transaction ID', value: selectedTransaction.transactionId });
    details.push({ label: 'Type', value: selectedTransaction.label });
    details.push({ label: 'Amount', value: `₱${Math.abs(parseFloat(selectedTransaction.amount)).toFixed(2)}` });
    details.push({ label: 'Date Applied', value: selectedTransaction.dateApplied || 'N/A' });
    details.push({ label: 'Date Approved', value: selectedTransaction.dateApproved || 'N/A' });
    
    if (selectedTransaction.disbursement) details.push({ label: 'Disbursement', value: selectedTransaction.disbursement });
    if (selectedTransaction.depositOption) details.push({ label: 'Deposit Method', value: selectedTransaction.depositOption });
    if (selectedTransaction.paymentOption) details.push({ label: 'Payment Method', value: selectedTransaction.paymentOption });
    if (selectedTransaction.withdrawOption) details.push({ label: 'Withdraw Method', value: selectedTransaction.withdrawOption });
    if (selectedTransaction.description) details.push({ label: 'Description', value: selectedTransaction.description });

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Transaction Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              {details.map((detail, index) => (
                <View key={index} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{detail.label}:</Text>
                  <Text style={styles.detailValue}>{detail.value}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

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

      {renderTransactionModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  compactCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 14,
    color: '#666',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  noTransactionsText: {
    marginTop: 30,
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
    flex: 1,
  },
});

export default Transactions;