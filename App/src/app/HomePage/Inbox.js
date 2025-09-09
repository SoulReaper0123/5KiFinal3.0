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

            let amount = 0;
            let title = '';
            let message = '';
            let rejectionReason = details.rejectionReason || 'No reason provided';

            switch (type) {
              case 'Deposits':
                amount = parseFloat(details.amountToBeDeposited || 0).toFixed(2);
                title = 'Deposit';
                message = getStatusMessage(status, `₱${amount}`, 'deposit', rejectionReason);
                break;
              case 'Loans':
                amount = parseFloat(details.loanAmount || 0).toFixed(2);
                const monthlyPayment = parseFloat(details.monthlyPayment || 0).toFixed(2);
                title = 'Loan';
                message = getStatusMessage(status, `₱${amount}`, 'loan', rejectionReason);
                
                if (status === 'approved' && details.dueDate) {
                  const dueDate = getRawDateFromFirebase(details.dueDate);
                  parsed.push({
                    id: `${type}-${transactionId}-reminder`,
                    title: 'Loan Payment Reminder',
                    message: `Your monthly loan payment of ₱${monthlyPayment} is due on ${dueDate}.`,
                    timestamp: getReliableTimestamp(details.dueDate, details), // Use due date timestamp for proper sorting
                    displayDate: 'Reminder',
                    email: details.email,
                    icon: 'alarm',
                    color: '#FF9800',
                    status: 'reminder',
                  });
                }
                break;
              case 'Withdrawals':
                amount = parseFloat(details.amountWithdrawn || 0).toFixed(2);
                title = 'Withdrawal';
                message = getStatusMessage(status, `₱${amount}`, 'withdrawal', rejectionReason);
                break;
              case 'Payments':
                amount = parseFloat(details.amountToBePaid || 0).toFixed(2);
                title = 'Payment';
                message = getStatusMessage(status, `₱${amount}`, 'payment', rejectionReason);
                break;
              case 'Registrations':
                amount = parseFloat(details.amount || 0).toFixed(2);
                title = 'Registration';
                message = getStatusMessage(status, `₱${amount}`, 'registration', rejectionReason);
                break;
              default:
                title = type;
                message = `${type} update`;
            }

            parsed.push({
              id: `${type}-${transactionId}`,
              title,
              message,
              timestamp,
              displayDate,
              email: details.email,
              icon: getIcon(status),
              color: getColor(status),
              rejectionReason,
              status,
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
    setSelectedMessage(message);
    setModalVisible(true);
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

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.compactCard, { borderLeftWidth: 4, borderLeftColor: item.color }]}
      onPress={() => handleMessagePress(item)}
    >
      <View style={styles.iconContainer}>
        <MaterialIcons name={item.icon} size={24} color={item.color} />
      </View>
      <View style={styles.messageInfo}>
        <Text style={styles.messageTitle} numberOfLines={1}>
          {item.title} - {item.status.toUpperCase()}
        </Text>
        <Text style={styles.messagePreview} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.messageTime}>
          {formatDisplayTime(item.displayDate)}
        </Text>
      </View>
      <View style={styles.statusIndicator}>
        <MaterialIcons name="chevron-right" size={20} color="#666" />
      </View>
    </TouchableOpacity>
  );

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
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={30} color="#2D5783" />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>Inbox</Text>

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

      {renderMessageModal()}
    </View>
  );
}

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
  compactCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
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