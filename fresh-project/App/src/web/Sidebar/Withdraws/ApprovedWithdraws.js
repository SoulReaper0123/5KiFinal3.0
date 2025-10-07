import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { database } from '../../../firebaseConfig';
import { ref, onValue } from 'firebase/database';
import { Table, Row } from 'react-native-table-component';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const ApprovedWithdraws = () => {
  const [approvedWithdraws, setApprovedWithdrawsRef] = useState([]);
  const [loading, setLoading] = useState(true); // New loading state
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0); // State for current page
  const pageSize = 20; // Number of registrations to display
  
  useEffect(() => {
    const approvedWithdrawsRef = ref(database, 'ApprovedWithdraws'); // Path to Withdrawals table
    const unsubscribe = onValue(approvedWithdrawsRef, (snapshot) => {
      const data = snapshot.val();
      const withdrawsArray = [];
      if (data) {
        for (const memberId in data) {
          const memberTransactions = data[memberId];
          for (const transactionId in memberTransactions) {
            withdrawsArray.push({
              memberId,
              transactionId,
              ...memberTransactions[transactionId],
            });
          }
        }
      }
      setApprovedWithdrawsRef(withdrawsArray);
      setLoading(false); // Set loading to false after data is fetched
    });

    return () => unsubscribe();
  }, []);

  const tableHead = ['Member ID',  'Withdraw Amount', 'Disbursement', 'Account Name', 'Account Number',  'Date Applied', 'Transaction ID', 'Date Approved'];

  // Filter deposits based on search query
const filteredApprovedWithdraws = approvedWithdraws.filter(item =>
  String(item.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
  String(item.transactionId).toLowerCase().includes(searchQuery.toLowerCase())
);

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount);
};
// Pagination logic
const paginatedData = filteredApprovedWithdraws.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
const totalPages = Math.ceil(filteredApprovedWithdraws.length / pageSize);

  const tableData = paginatedData.map((item, index) => (
    [
      item.id,
      formatCurrency(item.amountWithdrawn),
      item.withdrawOption,
      item.accountName,
      item.accountNumber,
      item.dateApplied,
      item.transactionId,
     item.dateApproved,
    ]
  ));

  return (
    <View style={styles.container}>
    <View style={styles.searchContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search by Member ID or Transaction ID"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <TouchableOpacity style={styles.searchIconContainer}>
        <MaterialIcons name="search" size={24} color="#001F3F" />
      </TouchableOpacity>
    </View>
      {loading ? (
        // Loading state
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <ActivityIndicator size="large" color="#001F3F" />
        </View>
      ) : filteredApprovedWithdraws.length === 0 ? (
        // No approved withdrawals message
        <View style={styles.noDataMessage}>
          <Text>No Approved Withdrawals Available</Text>
        </View>
      ) : (
        <ScrollView>
          <View style={styles.tableContainer}>
            <Table borderStyle={styles.tableBorder}>
              <Row data={tableHead} style={styles.tableHead} textStyle={styles.tableHeadText} />
              {tableData.map((rowData, index) => (
                <Row key={index} data={rowData} style={styles.tableRow} textStyle={styles.tableRowText} />
              ))}
            </Table>
          </View>

{/* Pagination and "X of Y" Display */}
<View style={styles.paginationContainer}>
  <Text style={styles.paginationInfo}>
    {`Page ${currentPage + 1} of ${totalPages}`} {/* Use 1-based index for display */}
  </Text>

  <TouchableOpacity 
    onPress={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
    disabled={currentPage === 0}
    style={[styles.paginationButton, currentPage === 0 && styles.disabledButton]}
  >
    <Text style={styles.paginationText}>Previous</Text>
  </TouchableOpacity>

  <TouchableOpacity 
    onPress={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
    disabled={currentPage === totalPages - 1}
    style={[styles.paginationButton, currentPage === totalPages - 1 && styles.disabledButton]}
  >
    <Text style={styles.paginationText}>Next</Text>
  </TouchableOpacity>
</View>

        </ScrollView>
      )}
    </View>
  );
};
const styles = {
  tableContainer: {
    marginRight:10,
    marginTop: 10,
  },
  tableBorder: {
    borderWidth: 1,
    borderColor: '#C1C0B9',
  },
  tableHead: {
    height: 50,
    backgroundColor: '#001F3F',
  },
  tableHeadText: {
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#ffffff'
  },
  tableRow: {
    height: 50,
    backgroundColor: '#FFFFFF',
  },
  tableRowText: {
    textAlign: 'center',
  },
  noDataMessage: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
    color: 'gray',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center', // Center vertically
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    marginRight: 25,
    marginLeft: 15,
  },
  searchInput: {
    flex: 1, // Take available space
    height: 40, // Adjust as needed
    paddingVertical: 5, // Adjust vertical padding
    paddingHorizontal: 10, // Add some padding to avoid text touching edges
    fontSize: 16,
  },
  searchIconContainer: {
    marginLeft: 10, // Add space between input and icon
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    marginRight: 10,
  },
  paginationInfo: {
    fontSize: 16,
    marginRight: 10,
    alignSelf: 'center',
  },
  paginationButton: {
    padding: 10,
    backgroundColor: '#001F3F',
    borderRadius: 5,
    marginHorizontal: 5,
    color: '#fff',
  },
  disabledButton: {
    backgroundColor: '#C1C0B8',
  },
  paginationText: {
    fontWeight: 'bold',
    color: '#fff',
  },
}

export default ApprovedWithdraws;