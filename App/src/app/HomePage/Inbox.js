import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
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
  
  // State for email
  const [userEmail, setUserEmail] = useState(null);
  
  // Get email from all possible sources
  useEffect(() => {
    const getEmail = async () => {
      try {
        // Try to get email from different sources
        const routeEmail = route.params?.email;
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
        const email = routeEmail || parentRouteEmail || authEmail || storedEmail;
        
        console.log('Inbox - Using email:', email, 'from sources:', { 
          routeEmail, 
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

            // Get the appropriate date based on status
            if (status === 'approved') {
              displayDate = getRawDateFromFirebase(details.dateApproved);
              timestamp = details.dateApproved?.seconds ? details.dateApproved.seconds * 1000 : Date.now();
            } else if (status === 'rejected') {
              displayDate = getRawDateFromFirebase(details.dateRejected);
              timestamp = details.dateRejected?.seconds ? details.dateRejected.seconds * 1000 : Date.now();
            } else {
              displayDate = 'Pending approval';
              timestamp = Date.now();
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
                    timestamp: Date.now(),
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
              default:
                title = 'Transaction';
                message = 'Transaction update';
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
    }
  };

  useEffect(() => {
    if (userEmail) {
      console.log('Fetching messages for email:', userEmail);
      fetchMessages();
    }
  }, [userEmail]);

  const renderItem = ({ item }) => (
  <View style={[styles.card, { borderLeftWidth: 5, borderLeftColor: item.color }]}>
    <MaterialIcons name={item.icon} size={32} color={item.color} style={styles.icon} />
    <View style={styles.textContainer}>
      <Text style={styles.title}>{item.title} - {item.status.toUpperCase()}</Text>
      <Text style={styles.message}>{item.message}</Text>
      {item.status === 'rejected' && (
        <Text style={styles.rejectionReason}>Reason: {item.rejectionReason}</Text>
      )}
      {item.displayDate !== 'Pending approval' && (
        <Text style={styles.time}>{item.displayDate}</Text>  // Removed the labels here
      )}
    </View>
  </View>
);

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
          contentContainerStyle={{ paddingBottom: 20, paddingTop: 10 }}
        />
      )}
    </View>
  );
}

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
  card: {
    flexDirection: 'row',
    backgroundColor: '#d3e8fdff',
    borderRadius: 8,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 10,
    alignItems: 'center',
    elevation: 2,
  },
  icon: {
    marginRight: 15,
  },
  textContainer: {
    flexShrink: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  rejectionReason: {
    fontSize: 13,
    color: '#E53935',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#666',
  },
  noMessagesText: {
    marginTop: 30,
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
});