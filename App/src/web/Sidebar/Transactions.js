import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { database } from '../../firebaseConfig';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const Transactions = () => {
  const [transactions, setTransactions] = useState({});
  const [members, setMembers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [memberTransactions, setMemberTransactions] = useState([]);
  const [memberName, setMemberName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const [
          depositsSnapshot,
          applyLoansSnapshot,
          payLoansSnapshot,
          withdrawalsSnapshot,
          membersSnapshot,
        ] = await Promise.all([
          database.ref('Transactions/Deposits').once('value'),
          database.ref('Transactions/ApplyLoans').once('value'),
          database.ref('Transactions/PayLoans').once('value'),
          database.ref('Transactions/Withdrawals').once('value'),
          database.ref('Members').once('value'),
        ]);

        const allTransactions = {};

        const formatData = (data, type) => {
          Object.keys(data).forEach((memberId) => {
            if (!allTransactions[memberId]) {
              allTransactions[memberId] = [];
            }
            Object.keys(data[memberId]).forEach((transactionId) => {
              allTransactions[memberId].push({
                type,
                transactionId,
                ...data[memberId][transactionId],
                dateApproved: data[memberId][transactionId].dateApproved,
              });
            });
          });
        };

        if (depositsSnapshot.exists()) {
          formatData(depositsSnapshot.val(), 'Deposits');
        }
        if (applyLoansSnapshot.exists()) {
          formatData(applyLoansSnapshot.val(), 'ApplyLoans');
        }
        if (payLoansSnapshot.exists()) {
          formatData(payLoansSnapshot.val(), 'PayLoans');
        }
        if (withdrawalsSnapshot.exists()) {
          formatData(withdrawalsSnapshot.val(), 'Withdrawals');
        }

        setTransactions(allTransactions);

        if (membersSnapshot.exists()) {
          setMembers(membersSnapshot.val());
        }
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('An error occurred while fetching transactions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const handleMemberPress = (memberId) => {
    setSelectedMemberId(memberId);
    setMemberTransactions(transactions[memberId] || []);

    if (members[memberId]) {
      const { firstName, middleName, lastName } = members[memberId];
      setMemberName(`${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`);
    } else {
      setMemberName('');
    }

    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedMemberId(null);
    setMemberTransactions([]);
    setMemberName('');
  };

  const filteredMembers = Object.keys(transactions).filter((memberId) => {
    const member = members[memberId];
    const memberFullName = `${member.firstName} ${member.middleName ? member.middleName + ' ' : ''}${member.lastName}`.toLowerCase();
    return (
      memberId.includes(searchQuery) ||
      memberFullName.includes(searchQuery.toLowerCase())
    );
  });

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4B0082" />
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const hasTransactions = Object.keys(transactions).length > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Transaction List</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search by ID, First Name or Last Name"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      {hasTransactions ? (
        <FlatList
          data={filteredMembers}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <MemberButton
              memberId={item}
              members={members}
              onPress={handleMemberPress}
            />
          )}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <Text style={styles.noDataText}>No transactions available.</Text>
      )}
      <TransactionModal
        visible={modalVisible}
        onClose={closeModal}
        memberName={memberName}
        selectedMemberId={selectedMemberId}
        memberTransactions={memberTransactions}
      />
    </View>
  );
};

const MemberButton = ({ memberId, members, onPress }) => {
  const member = members[memberId];
  const memberName = member
    ? `${member.firstName} ${member.middleName ? member.middleName + ' ' : ''}${member.lastName}`
    : 'Unknown Member';

  return (
    <TouchableOpacity onPress={() => onPress(memberId)} style={styles.memberItem}>
      <Text style={styles.memberText}> (ID: {memberId}) {memberName}</Text>
    </TouchableOpacity>
  );
};

const TransactionModal = ({ visible, onClose, memberName, selectedMemberId, memberTransactions }) => {
  return (
    <Modal visible={visible} transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <MaterialIcons name="close" size={30} color="#4B0082" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Transactions for (ID: {selectedMemberId})</Text>
          <ScrollView contentContainerStyle={styles.scrollView}>
            {memberTransactions.length === 0 ? (
              <Text style={styles.noTransactionsText}>No transactions found.</Text>
            ) : (
              memberTransactions.map((transaction) => (
                <TransactionItem key={transaction.transactionId} transaction={transaction} />
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const TransactionItem = ({ transaction }) => {

  const formatAmount = (amount) => 
    `₱${parseFloat(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;

  return (
    <View style={styles.transactionItem}>
      <Text style={styles.transactionType}>Type: {transaction.type}</Text>
      <Text style={styles.transactionDetail}>Account Number: {transaction.accountNumber}</Text>
      <Text style={styles.transactionAmount}>
        Amount: {formatAmount(
          transaction.amountToBeDeposited ||
          transaction.loanAmount ||
          transaction.amount ||
          transaction.amountWithdrawn
        )}
      </Text>
      <Text style={styles.transactionDetail}>Transaction ID: {transaction.transactionId}</Text>
      {transaction.dateApproved && (
        <Text style={styles.transactionDetail}>Date Approved: {transaction.dateApproved}</Text> 
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f7f9fc',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#001F3F',
    marginBottom: 15,
    textAlign: 'center',
  },
  searchInput: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  memberItem: {
    padding: 15,
    backgroundColor: '#ffffff',
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  memberText: {
    fontSize: 16,
    color: '#333',
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#001F3F',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '60%', // Make the modal narrower
    maxHeight: '60%', // Limit the modal height
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  scrollView: {
    maxHeight: '60%', // Limit the height of the ScrollView content
  },
  modalCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#001F3F',
  },
  scrollView: {
    paddingBottom: 20,
  },
  noTransactionsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  transactionItem: {
    padding: 15,
    marginVertical: 5,
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  transactionType: {
    fontWeight: 'bold',
    color: '#001F3F',
  },
  transactionDetail: {
    marginTop: 5,
    color: '#555',
  },
  transactionAmount: {
    marginTop: 5,
    fontSize: 16,
    color: '#001F3F',
    fontWeight: 'bold',
  },
});

export default Transactions;