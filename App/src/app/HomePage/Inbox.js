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
      const parsedMessages = parseMessages(data);

      const filteredMessages = parsedMessages.filter(
        message => message.email?.toLowerCase() === email?.toLowerCase()
      );

      // Sort by date (newest first)
      filteredMessages.sort((a, b) => {
        // Create date objects from the date strings
        const dateA = new Date(a.time);
        const dateB = new Date(b.time);
        
        // Compare dates - newest first
        return dateB - dateA;
      });

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

  const parseMessages = (data) => {
    const parsed = [];
    for (const [type, members] of Object.entries(data)) {
      for (const [memberId, transactionsList] of Object.entries(members)) {
        for (const [transactionId, details] of Object.entries(transactionsList)) {
          const status = (details.status || 'pending').toLowerCase();
          const dateString = details.dateApproved || details.dateApplied || details.date;
          const formattedDate = dateString || 'Date not available';

          let amount = 0;
          let title = '';
          let message = '';

          switch (type) {
            case 'Deposits':
              amount = parseFloat(details.amountToBeDeposited || 0).toFixed(2);
              title = 'Deposit';
              message = getStatusMessage(status, `₱${amount}`, 'deposit');
              break;
            case 'Loans':
              amount = parseFloat(details.loanAmount || 0).toFixed(2);
              title = 'Loan Application';
              message = getStatusMessage(status, `₱${amount}`, 'loan');
              break;
            case 'Withdrawals':
              amount = parseFloat(details.amountWithdrawn || 0).toFixed(2);
              title = 'Withdrawal';
              message = getStatusMessage(status, `₱${amount}`, 'withdrawal');
              break;
            case 'PayLoans':
              amount = parseFloat(details.amount || 0).toFixed(2);
              title = 'Loan Payment';
              message = getStatusMessage(status, `₱${amount}`, 'payment');
              break;
            default:
              title = 'Transaction';
              message = 'A transaction was made.';
          }

          parsed.push({
            id: `${type}-${transactionId}`,
            title,
            message,
            time: formattedDate,
            email: details.email,
            icon: getIcon(status),
            color: getColor(status),
          });
        }
      }
    }
    return parsed;
  };
  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'Date not available';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Date not available';
    
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  const getStatusMessage = (status, amount, type) => {
    switch (status) {
      case 'approved':
        return `Your ${type} of ${amount} has been approved.`;
      case 'rejected':
        return `Your ${type} of ${amount} was rejected.`;
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
    <View style={styles.card}>
      <MaterialIcons name={item.icon} size={32} color={item.color} style={styles.icon} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.time}>{item.time}</Text>
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
    borderRadius: 12,
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
  },
  message: {
    fontSize: 14,
    color: '#333',
    marginVertical: 4,
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