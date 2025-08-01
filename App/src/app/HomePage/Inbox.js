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

export default function Inbox() {
  const navigation = useNavigation();
  const route = useRoute();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const email = auth.currentUser?.email || route.params?.email;

 const fetchMessages = async () => {
  setLoading(true);
  try {
    const transactionsRef = ref(database, 'Transactions');
    const snapshot = await get(transactionsRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      // Removed the console.log for raw data
      const parsedMessages = parseMessages(data);

      const filteredMessages = parsedMessages.filter(
        message => message.email?.toLowerCase() === email?.toLowerCase()
      );

      // Sort by timestamp (newest first)
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
    if (email) {
      fetchMessages();
    }
  }, [email]);

  const parseDateTime = (dateString, timeString) => {
    // Handle Firebase timestamp objects
    if (typeof dateString === 'object' && dateString.seconds) {
      return dateString.seconds * 1000;
    }

    // Handle separate date and time strings
    if (dateString && timeString) {
      const combined = `${dateString} ${timeString}`;
      return Date.parse(combined) || Date.now();
    }

    // Handle "Month Day, Year at HH:MM" format
    if (dateString && dateString.includes(' at ')) {
      const normalized = dateString.replace(' at ', ' ');
      return Date.parse(normalized) || Date.now();
    }

    // Handle standalone date strings
    if (dateString) {
      return Date.parse(dateString) || Date.now();
    }

    return Date.now();
  };

  const parseMessages = (data) => {
    const parsed = [];
    
    for (const [type, members] of Object.entries(data)) {
      for (const [memberId, transactions] of Object.entries(members)) {
        for (const [transactionId, details] of Object.entries(transactions)) {
          try {
            const status = (details.status || 'pending').toLowerCase();
            let timestamp, displayDate;

            // Determine timestamp based on status
            if (status === 'approved') {
              timestamp = parseDateTime(details.dateApproved);
              displayDate = formatDisplayDate(timestamp);
            } else if (status === 'rejected') {
              timestamp = parseDateTime(details.dateRejected, details.timeRejected);
              displayDate = formatDisplayDate(timestamp);
            } else {
              timestamp = parseDateTime(details.dateApplied || details.date);
              displayDate = formatDisplayDate(timestamp);
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
                title = 'Loan';
                message = getStatusMessage(status, `₱${amount}`, 'loan', rejectionReason);
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

  const formatDisplayDate = (timestamp) => {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Date not available';
    
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      default: return 'hourglass-empty';
    }
  };

  const getColor = (status) => {
    switch (status) {
      case 'approved': return '#4CAF50';
      case 'rejected': return '#E53935';
      default: return '#FFC107';
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, { borderLeftWidth: 5, borderLeftColor: item.color }]}>
      <MaterialIcons name={item.icon} size={32} color={item.color} style={styles.icon} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title} - {item.status.toUpperCase()}</Text>
        <Text style={styles.message}>{item.message}</Text>
        {item.status === 'rejected' && (
          <Text style={styles.rejectionReason}>Reason: {item.rejectionReason}</Text>
        )}
        <Text style={styles.time}>{item.displayDate}</Text>
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