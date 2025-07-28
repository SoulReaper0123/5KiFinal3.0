import React, { useEffect, useState } from 'react';
import { View, Text, TextInput , FlatList, TouchableOpacity, Modal, ActivityIndicator, ScrollView } from 'react-native';
import { database } from '../../../firebaseConfig';
import { ref, onValue, set, update, get } from 'firebase/database';
import { ApproveWithdraws } from '../../../api';
import { RejectWithdraws } from '../../../api';
import { Table, Row } from 'react-native-table-component';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const WithdrawApplications = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [successMessageModalVisible, setSuccessMessageModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0); // State for current page
  const pageSize = 20; // Number of registrations to display
  
  useEffect(() => {
    const withdrawalsRef = ref(database, 'Withdrawals');
    const unsubscribe = onValue(withdrawalsRef, (snapshot) => {
      const data = snapshot.val();
      const withdrawalsArray = [];
      if (data) {
        for (const memberId in data) {
          const memberTransactions = data[memberId];
          for (const transactionId in memberTransactions) {
            withdrawalsArray.push({
              memberId,
              transactionId,
              ...memberTransactions[transactionId],
            });
          }
        }
      }
      setWithdrawals(withdrawalsArray);
      setLoading(false); // Set loading to false after data is fetched
    });

    return () => unsubscribe();
  }, []);

  const handleAction = (item, action) => {
    setSelectedItem(item);
    setCurrentAction(action);
    setModalVisible(true); // Show confirmation modal
  };

  const handleApprove = async (item) => {
    const { memberId, transactionId, amountWithdrawn, email, firstName, lastName } = item;
    const amountWithdrawnFloat = parseFloat(amountWithdrawn); // Ensure float type for the amount
  
    try {
      const currentDate = new Date();
      const options = {
        month: 'long', 
        day: 'numeric',
        year: 'numeric',
      };

      const dateApproved = currentDate.toLocaleString('en-US', options);

      
            // Show success message modal
            setSuccessMessage(`Withdrawal approved for Member ID: ${memberId} \nDate Approved: ${dateApproved}`);
            setSuccessMessageModalVisible(true); // Show success modal


  
      // Step 1: Move the transaction to the ApprovedWithdraws table
      const approvedWithdrawRef = ref(database, `ApprovedWithdraws/${memberId}/${transactionId}`);
      await set(approvedWithdrawRef, { ...item, dateApproved });
  
      // Step 2: Log the transaction
      const transactionRef = ref(database, `Transactions/Withdrawals/${memberId}/${transactionId}`);
      await set(transactionRef, { ...item, dateApproved });
  
      // Step 3: Get the member's current balance
      const memberBalanceRef = ref(database, `Members/${memberId}/balance`);
      const memberBalanceSnapshot = await get(memberBalanceRef);
      const currentBalance = memberBalanceSnapshot.val() || 0;
  
      // Step 4: Subtract the withdrawal amount from the member's balance
      const newBalance = currentBalance - amountWithdrawnFloat;
      await update(ref(database, `Members/${memberId}`), { balance: newBalance });
  
      // Step 5: Update the Funds table
      const fundsRef = ref(database, 'Funds/fundsAmount');
      const fundsSnapshot = await get(fundsRef);
      const currentFunds = fundsSnapshot.val() || 0;
      const newFundsAmount = currentFunds - amountWithdrawnFloat;
      await update(ref(database, 'Funds'), { fundsAmount: newFundsAmount });
  
      // Step 6: Remove the approved withdrawal from the Withdrawals table
      const withdrawalRef = ref(database, `Withdrawals/${memberId}/${transactionId}`);
      await set(withdrawalRef, null); // Deleting the entry


  
      // Prepare data for the API
      const approveWithdrawApplication = {
        memberId,
        transactionId,
        amount: amountWithdrawn,
        dateApproved,
        firstName,
        lastName,
        email,
      };
  
      // Send data to backend API for approval and email notification
      const response = await ApproveWithdraws(approveWithdrawApplication);
      if (response.error) {
        throw new Error(response.error); // Handle API error if present
      }
  
      
    } catch (error) {
      console.error('Error approving withdrawal: ', error);
    }
  };
  
  const handleReject = async (item) => {
    const { memberId, transactionId, amountWithdrawn, email, firstName, lastName } = item;
  
    // Create a new date object and format it
    const dateRejected = new Date().toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    
                  // Show success message modal
                  setSuccessMessage(`Withdrawal rejected for Member ID: ${memberId} \nDate Rejected: ${dateRejected}`);
                  setSuccessMessageModalVisible(true); // Show success modal
  
    try {
      // Create a new object to store the rejection details
      const updatedItem = { 
        ...item, 
        dateRejected // Add dateRejected to the item
      };
  
      // Move the data to the RejectedWithdraws table and include dateRejected
      const rejectedWithdrawRef = ref(database, `RejectedWithdraws/${memberId}/${transactionId}`);
      await set(rejectedWithdrawRef, updatedItem);
  
      // Remove the withdrawal from the Withdrawals table
      const withdrawalRef = ref(database, `Withdrawals/${memberId}/${transactionId}`);
      await set(withdrawalRef, null);
                  
      // Prepare data for the API
      const rejectWithdrawApplication = {
        memberId,
        transactionId,
        amount: amountWithdrawn,
        dateRejected,
        firstName,
        lastName,
        email,
      };
  
      // Send data to backend API for rejection and email notification
      const response = await RejectWithdraws(rejectWithdrawApplication);
      if (response.error) {
        throw new Error(response.error); // Handle API error if present
      } 
    } catch (error) {
      console.error('Error rejecting withdrawal: ', error);
    }
  };
  

  const confirmAction = () => {
    setModalVisible(false); // Hide the modal
    if (currentAction === 'approve') {
      handleApprove(selectedItem);
    } else if (currentAction === 'reject') {
      handleReject(selectedItem);
    }
  };

  const tableHead = ['Member ID',  'Withdraw Amount', 'Disbursement', 'Account Name', 'Account Number',  'Date Applied', 'Transaction ID', 'Action'];

      // Filter deposits based on search query
    const filteredwithdrawals = withdrawals.filter(item =>
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
const paginatedData = filteredwithdrawals.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
const totalPages = Math.ceil(filteredwithdrawals.length / pageSize);

  const tableData = paginatedData.map((item, index) => (
    [
      item.id,
      formatCurrency(item.amountWithdrawn),
      item.withdrawOption,
      item.accountName,
      item.accountNumber,
      item.dateApplied,
      item.transactionId,
      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                      <TouchableOpacity style={styles.button} onPress={() => handleAction(item, 'approve')}>
                        <Text style={styles.buttonText}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.button, { backgroundColor: '#8E0B16' }]} onPress={() => handleAction(item, 'reject')}>
                        <Text style={styles.buttonText}>Reject</Text>
                      </TouchableOpacity>
                    </View>

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
        <ActivityIndicator size="large" color="#001F3F" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} />
      ) : (
        <>
          {filteredwithdrawals.length === 0 ? (
            <Text  style={styles.noDataMessage}>No withdrawal applications available.</Text>
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

          {/* Modal for Confirmation */}
          <Modal visible={modalVisible} transparent animationType="fade">
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
              <View style={{ backgroundColor: '#FFFFFF', padding: 20, borderRadius: 10, width: '35%', height: '35%', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 15 }}> {/* Increased marginBottom for better spacing */}
                  {`Confirm ${currentAction === 'approve' ? 'Approval' : 'Rejection'}`}
                </Text>
                <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 30 }}> {/* Increased marginBottom for better spacing */}
                  {`Are you sure you want to ${currentAction} this WIITHDRAW APPLICATION?`}
                </Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%' }}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: '#008000' }]}
                    onPress={confirmAction}
                  >
                    <Text style={styles.buttonText}>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: '#8E0B16' }]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.buttonText}>No</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

           {/* Success Message Modal */}
<Modal visible={successMessageModalVisible} transparent animationType="fade">
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
    <View style={{
      backgroundColor: '#FFFFFF', // Updated background color to #6a8f5f
      padding: 20,
      borderRadius: 10,
      width: '35%', // Adjusted width for a more square-like shape
      height: '35%', // Adjusted height for a more square-like shape
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 15, color: '#000000' }}>SUCCESS</Text>
      <Text style={{ fontSize: 18, textAlign: 'center', color: '#000000', lineHeight: 24 }}>
        {/* Added lineHeight for better text wrapping */}
        {successMessage}
      </Text>
      <TouchableOpacity
        style={[styles.modalButton, { backgroundColor: '#4CAF50', marginTop: 25 }]}
        onPress={() => setSuccessMessageModalVisible(false)}
      >
        <Text style={styles.buttonText}>OK</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

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
        </>
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
  button: {
    backgroundColor: '#008000',
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 11,
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
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
};

export default WithdrawApplications;