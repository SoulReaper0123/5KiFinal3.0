import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { get, ref } from 'firebase/database';
import { database, auth } from '../../firebaseConfig';
import * as SecureStore from 'expo-secure-store';

export default function Inbox() {
  const navigation = useNavigation();
  const route = useRoute();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // State for email
  const [userEmail, setUserEmail] = useState(null);
  
  // Get email from all possible sources
  useEffect(() => {
    const getEmail = async () => {
      try {
        // Try to get email from different sources
        const routeEmail = route.params?.email;
        const routeUserEmail = route.params?.user?.email;
        const parentRouteEmail = navigation.getParent()?.getState()?.routes?.[0]?.params?.email;
        const authEmail = auth.currentUser?.email;
        
        // Try to get email from SecureStore (for biometric login)
        let storedEmail = null;
        try {
          storedEmail = await SecureStore.getItemAsync('currentUserEmail');
        } catch (error) {
          console.error('Error getting email from SecureStore:', error);
        }
        
        // Use the first available email
        const email = routeEmail || routeUserEmail || parentRouteEmail || authEmail || storedEmail;
        
        console.log('Inbox - Using email:', email, 'from sources:', { 
          routeEmail, 
          routeUserEmail,
          parentRouteEmail, 
          authEmail, 
          storedEmail 
        });
        
        setUserEmail(email);
      } catch (error) {
        console.error('Error getting email in Inbox:', error);
      }
    };
    
    getEmail();
  }, [route.params, navigation]);

  // Helper functions
  const getRawDateFromFirebase = (dateObj) => {
    if (!dateObj) return 'Date not available';
    
    // If it's a Firebase timestamp object
    if (typeof dateObj === 'object' && dateObj.seconds) {
      const date = new Date(dateObj.seconds * 1000);
      return date.toLocaleString();
    }
    
    // If it's already a string, return as-is
    if (typeof dateObj === 'string') {
      return dateObj;
    }
    
    return 'Date not available';
  };

  const getStatusMessage = (status, amount, type, rejectionReason) => {
    switch (status) {
      case 'approved':
        return `Your ${type} of ${amount} has been approved.`;
      case 'rejected':
        return `Your ${type} of ${amount} was rejected. Reason: ${rejectionReason}`;
      default:
        return `Your ${type} of ${amount} is pending approval.`;
    }
  };

  const getIcon = (status) => {
    switch (status) {
      case 'approved': return 'check-circle';
      case 'rejected': return 'cancel';
      case 'reminder': return 'alarm';
      default: return 'hourglass-empty';
    }
  };

  const getColor = (status) => {
    switch (status) {
      case 'approved': return '#4CAF50';
      case 'rejected': return '#F44336';
      case 'reminder': return '#FFC107';
      default: return '#FFC107';
    }
  };

  const parseMessages = (data) => {
    const parsed = [];
    
    for (const [type, members] of Object.entries(data)) {
      for (const [memberId, transactions] of Object.entries(members)) {
        for (const [transactionId, details] of Object.entries(transactions)) {
          try {
            const status = (details.status || 'pending').toLowerCase();
            let displayDate, timestamp;

            // Get the appropriate date based on status and create reliable timestamp
            const getReliableTimestamp = (dateObj, details) => {
              // First, check if there's already a timestamp field from web approval
              if (details.timestamp && typeof details.timestamp === 'number') {
                return details.timestamp;
              }
              
              if (!dateObj) return Date.now();
              
              // Handle Firebase timestamp objects
              if (typeof dateObj === 'object' && dateObj.seconds) {
                return dateObj.seconds * 1000;
              }
              
              // Handle string dates
              if (typeof dateObj === 'string') {
                const parsed = new Date(dateObj);
                return isNaN(parsed.getTime()) ? Date.now() : parsed.getTime();
              }
              
              // Handle Date objects
              if (dateObj instanceof Date) {
                return dateObj.getTime();
              }
              
              return new Date(dateObj).getTime() || Date.now();
            };

            if (status === 'approved') {
              displayDate = getRawDateFromFirebase(details.dateApproved);
              timestamp = getReliableTimestamp(details.dateApproved, details);
            } else if (status === 'rejected') {
              displayDate = getRawDateFromFirebase(details.dateRejected);
              timestamp = getReliableTimestamp(details.dateRejected, details);
            } else {
              // For pending items, show the date applied instead of a placeholder
              displayDate = getRawDateFromFirebase(details.dateApplied);
              timestamp = getReliableTimestamp(details.dateApplied, details);
            }

            // normalized payload for each message item
            let amount = 0;
            let title = '';
            let label = '';
            let method = null; // payment/deposit/withdraw option
            let message = '';
            let rejectionReason = details.rejectionReason || 'No reason provided';

            switch (type) {
              case 'Deposits':
                amount = Number(details.amountToBeDeposited || 0);
                title = 'Deposit';
                label = 'Deposit';
                method = details.depositOption || null;
                message = getStatusMessage(status, `₱${amount.toFixed(2)}`, 'deposit', rejectionReason);
                break;
              case 'Loans':
                amount = Number(details.loanAmount || 0);
                const monthlyPayment = Number(details.monthlyPayment || 0).toFixed(2);
                title = 'Loan';
                label = 'Loan';
                message = getStatusMessage(status, `₱${Number(amount).toFixed(2)}`, 'loan', rejectionReason);
                
                if (status === 'approved' && details.dueDate) {
                  const dueDate = getRawDateFromFirebase(details.dueDate);
                  parsed.push({
                    id: `${type}-${transactionId}-reminder`,
                    title: 'Loan Payment Reminder',
                    label: 'Loan Payment Reminder',
                    message: `Your monthly loan payment of ₱${monthlyPayment} is due on ${dueDate}.`,
                    timestamp: getReliableTimestamp(details.dueDate, details), // Use due date timestamp for proper sorting
                    displayDate: 'Reminder',
                    email: details.email,
                    icon: 'alarm',
                    color: '#FF9800',
                    status: 'reminder',
                    transactionId,
                  });
                }
                break;
              case 'Withdrawals':
                amount = Number(details.amountWithdrawn || 0);
                title = 'Withdrawal';
                label = 'Withdrawal';
                method = details.withdrawOption || null;
                message = getStatusMessage(status, `₱${amount.toFixed(2)}`, 'withdrawal', rejectionReason);
                break;
              case 'Payments':
                amount = Number(details.amountToBePaid || 0);
                title = 'Payment';
                label = 'Loan Payment';
                method = details.paymentOption || null;
                message = getStatusMessage(status, `₱${amount.toFixed(2)}`, 'payment', rejectionReason);
                break;
              case 'Registrations':
                amount = Number(details.amount || details.registrationFee || 0);
                title = 'Registration';
                label = 'Registration';
                message = getStatusMessage(status, `₱${amount.toFixed(2)}`, 'registration', rejectionReason);
                break;
              default:
                title = type;
                label = type;
                message = `${type} update`;
            }

            parsed.push({
              id: `${type}-${transactionId}`,
              title,
              label,
              type: title,
              message,
              timestamp,
              displayDate,
              email: details.email,
              icon: getIcon(status),
              color: getColor(status),
              rejectionReason,
              status,
              amount,
              paymentOption: details.paymentOption,
              depositOption: details.depositOption,
              withdrawOption: details.withdrawOption,
              // Bare DB key for this Transactions entry
              transactionId,
              // Preserve originalTransactionId if explicitly stored in DB; fallback to details.transactionId or the key
              originalTransactionId: details.originalTransactionId || details.transactionId || transactionId,
              dateApplied: details.dateApplied || null,
              dateApproved: details.dateApproved || null,
              dateRejected: details.dateRejected || null,
            });
          } catch (error) {
            console.error(`Error parsing ${type} transaction ${transactionId}:`, error);
          }
        }
      }
    }
    return parsed;
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const transactionsRef = ref(database, 'Transactions');
      const snapshot = await get(transactionsRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const parsedMessages = parseMessages(data);

        const filteredMessages = parsedMessages.filter(
          message => message.email?.toLowerCase() === userEmail?.toLowerCase()
        );

        filteredMessages.sort((a, b) => b.timestamp - a.timestamp);
        
        setMessages(filteredMessages);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMessages();
  };

  useEffect(() => {
    if (userEmail) {
      console.log('Fetching messages for email:', userEmail);
      fetchMessages();
    }
  }, [userEmail]);

  const handleMessagePress = (message) => {
    // Prefer explicit originalTransactionId from DB; fallback to key; finally derive from id
    const originalTxnId = message.originalTransactionId || message.transactionId || (() => {
      const raw = String(message.id || '');
      let core = raw.endsWith('-reminder') ? raw.slice(0, -'-reminder'.length) : raw;
      const firstDash = core.indexOf('-');
      return firstDash >= 0 ? core.slice(firstDash + 1) : core;
    })();

    // Navigate to Inbox Details (separate from Transaction Details)
    const item = {
      id: message.id, // new reference for the notification
      transactionId: message.transactionId, // bare DB key under Transactions
      originalTransactionId: originalTxnId, // exact original id to show on top line
      label: message.label || (message.title === 'Payment' ? 'Loan Payment' : message.title),
      title: message.title,
      type: message.label || message.title,
      amount: typeof message.amount === 'number' ? message.amount : 0,
      timeApproved: message.timeApproved,
      dateApproved: message.dateApproved || (message.status === 'approved' ? message.displayDate : null),
      dateApplied: message.dateApplied || message.displayDate,
      message: message.message,
      status: message.status,
      paymentOption: message.paymentOption || null,
      depositOption: message.depositOption || null,
      withdrawOption: message.withdrawOption || null,
    };
    navigation.navigate('InboxDetails', { item });
  };

  const formatDisplayTime = (displayDate) => {
    if (!displayDate || displayDate === 'Pending approval' || displayDate === 'Reminder') {
      return displayDate;
    }
    try {
      const date = new Date(displayDate);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return displayDate;
    }
  };

  const renderItem = ({ item }) => {
    const ts = typeof item.timestamp === 'number' ? new Date(item.timestamp) : new Date();
    const timeStr = ts.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const peso = (n) => `₱${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const title = item.title === 'Payment' ? 'Loan Payment' : item.title;
    const amount = item.amount || item.amountToBePaid || item.amountToBeDeposited || item.amountWithdrawn || 0;
    const method = item.paymentOption || item.depositOption || item.withdrawOption || 'N/A';
    const txnId = item.transactionId || (item.id && String(item.id).split('-').slice(-1)[0]) || '';

    const dateObj = ts;
    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    // Simplified summary like Transactions list
    let summary;
    if (item.status === 'approved') {
      summary = `Approved: ${dateStr}`;
    } else if (item.status === 'rejected') {
      summary = 'Rejected';
    } else {
      summary = `Applied: ${dateStr}`;
    }

    return (
      <TouchableOpacity 
        style={styles.compactCard}
        onPress={() => handleMessagePress(item)}
      >
        <View style={styles.iconContainer}>
          <MaterialIcons name={item.icon} size={24} color={item.color} />
        </View>
        <View style={styles.messageInfo}>
          <Text style={styles.messageTitle}>{title}</Text>
          <Text numberOfLines={1} style={styles.messagePreview}>{item.message}</Text>
        </View>
        <Text style={styles.messageTime}>{timeStr}</Text>
      </TouchableOpacity>
    );
  };

  const renderMessageModal = () => {
    if (!selectedMessage) return null;

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
              <View style={styles.modalTitleContainer}>
                <MaterialIcons name={selectedMessage.icon} size={24} color={selectedMessage.color} />
                <Text style={styles.modalTitle}>{selectedMessage.title}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.statusBadge}>
                <Text style={[styles.statusText, { color: selectedMessage.color }]}>
                  {selectedMessage.status.toUpperCase()}
                </Text>
              </View>
              
              <Text style={styles.modalMessage}>{selectedMessage.message}</Text>
              
              {selectedMessage.status === 'rejected' && (
                <View style={styles.rejectionContainer}>
                  <Text style={styles.rejectionTitle}>Rejection Reason:</Text>
                  <Text style={styles.rejectionReason}>{selectedMessage.rejectionReason}</Text>
                </View>
              )}
              
              <View style={styles.dateContainer}>
                <Text style={styles.dateLabel}>Date:</Text>
                <Text style={styles.dateValue}>{selectedMessage.displayDate}</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.headerIconButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={22} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitleText}>Inbox</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#234E70" style={{ marginTop: 30 }} />
      ) : messages.length === 0 ? (
        <Text style={styles.noMessagesText}>No notifications found</Text>
      ) : (
        <FlatList
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20, paddingTop: 10, paddingHorizontal: 15 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
}

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
  centeredIconWrap: { alignItems: 'center' },
  smallTimeCenter: { marginTop: 4, fontSize: 12, color: '#64748B' },
  centeredTitle: { marginTop: 8, fontSize: 16, fontWeight: '700', color: '#1E3A5F', textAlign: 'center' },
  divider: { height: 1, backgroundColor: '#E2E8F0', width: '100%', marginVertical: 10 },
  messageBody: { fontSize: 14, color: '#0F172A', lineHeight: 20, textAlign: 'left', width: '100%' },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  messageInfo: {
    flex: 1,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  messagePreview: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  statusIndicator: {
    marginLeft: 8,
  },
  noMessagesText: {
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
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  modalContent: {
    padding: 20,
  },
  statusBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalMessage: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 16,
  },
  rejectionContainer: {
    backgroundColor: '#ffeaea',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffcccc',
  },
  rejectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#c62828',
    marginBottom: 4,
  },
  rejectionReason: {
    fontSize: 14,
    color: '#c62828',
    fontStyle: 'italic',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  dateValue: {
    fontSize: 14,
    color: '#333',
  },
});