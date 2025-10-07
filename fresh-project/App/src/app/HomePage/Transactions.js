import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  BackHandler,
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

        const filteredTransactions = parsedTransactions.filter(transaction => (transaction.email || '').toLowerCase() === (email || '').toLowerCase());

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
          // Only include approved transactions
          if ((details.status || '').toLowerCase() !== 'approved') {
            continue;
          }

          // Create timestamp for sorting - prioritize existing timestamp field
          const getTimestamp = (details) => {
            // First, check if there's already a timestamp field from web approval
            if (details.timestamp && typeof details.timestamp === 'number') {
              return details.timestamp;
            }
            
            // Fallback to date parsing - prioritize approved date, then applied date
            const dateToUse = details.dateApproved || details.dateRejected || details.dateApplied;
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
            
            // Handle Date objects
            if (dateToUse instanceof Date) {
              return dateToUse.getTime();
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
              transactionData.amount = parseFloat(details.amount || details.registrationFee || 0).toFixed(2);
              transactionData.label = 'Registration';
              transactionData.description = details.description || 'Registration application';
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
    // Navigate to GCASH-like details screen
    const approvedAt = transaction.dateApproved || transaction.dateApplied || null;
    const timeApproved = transaction.timeApproved || (typeof transaction.timestamp === 'number' ? new Date(transaction.timestamp).toISOString() : null);
    navigation.navigate('TransactionDetails', { item: {
      ...transaction,
      label: transaction.label,
      type: transaction.label,
      approvedAt,
      timeApproved,
      timestamp: transaction.timestamp,
    }});
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

  // Helpers for grouping and time display
  const toStartOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const getSectionLabel = (tsMs) => {
    if (!tsMs) return '';
    const now = new Date();
    const todayStart = toStartOfDay(now).getTime();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
    const d = new Date(tsMs);
    const dayStart = toStartOfDay(d).getTime();
    if (dayStart === todayStart) return 'Today';
    if (dayStart === yesterdayStart) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  const getTimeStr = (transaction) => {
    const base = typeof transaction.timestamp === 'number' ? new Date(transaction.timestamp)
      : (transaction.dateApproved || transaction.dateApplied ? new Date(transaction.dateApproved || transaction.dateApplied) : null);
    if (!base || isNaN(base)) return '';
    return base.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const renderTransaction = (transaction, idx, arr) => {
    const tsMs = typeof transaction.timestamp === 'number' ? transaction.timestamp
      : (transaction.dateApproved || transaction.dateApplied ? new Date(transaction.dateApproved || transaction.dateApplied).getTime() : null);
    const section = tsMs ? getSectionLabel(tsMs) : '';

    const prev = idx > 0 ? arr[idx - 1] : null;
    const prevTs = prev && (typeof prev.timestamp === 'number' ? prev.timestamp : (prev.dateApproved || prev.dateApplied ? new Date(prev.dateApproved || prev.dateApplied).getTime() : null));
    const prevSection = prevTs ? getSectionLabel(prevTs) : '';

    const showHeader = section && section !== prevSection;

    return (
      <View key={transaction.transactionId}>
        {showHeader && (
          <Text style={styles.sectionHeader}>{section}</Text>
        )}
        <TouchableOpacity 
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
            <Text style={styles.transactionDate}>{getTimeStr(transaction)}</Text>
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
      </View>
    );
  };

  // Modal no longer needed; we navigate to details screen.
  const renderTransactionModal = () => null;

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.headerIconButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={22} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitleText}>Transactions</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#234E70" style={{ marginTop: 30 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {transactions.length > 0 ? (
            transactions.map((t, i) => renderTransaction(t, i, transactions))
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
    backgroundColor: '#F8FAFC',
    paddingTop: 30,
  },
  headerBar: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#E8F1FB',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  scrollContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  sectionHeader: {
    marginTop: 12,
    marginBottom: 6,
    marginLeft: 4,
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700'
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