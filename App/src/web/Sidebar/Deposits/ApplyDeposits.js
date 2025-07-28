import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ActivityIndicator, FlatList, Modal, TouchableOpacity, ScrollView, Image, StyleSheet, Alert } from 'react-native';
import { database } from '../../../firebaseConfig'; // Adjust the path based on your project structure
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'; // Ensure this is installed
import { ApproveDeposits } from '../../../api';
import { RejectDeposits } from '../../../api';
import { Table, Row } from 'react-native-table-component';

const ApplyDeposits = () => {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [currentTransactionId, setCurrentTransactionId] = useState(null);
  const [currentMemberId, setCurrentMemberId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [successMessageModalVisible, setSuccessMessageModalVisible] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [currentPage, setCurrentPage] = useState(0); // State for current page
  const pageSize = 1; // Number of registrations to display
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const snapshot = await database.ref('Deposits/DepositApplications').once('value');
      if (!snapshot.exists()) {
        setDeposits([]);
      } else {
        const data = snapshot.val();
        const depositsData = [];

        Object.keys(data).forEach((depositId) => {
          const transactions = data[depositId];
          Object.keys(transactions).forEach((transactionId) => {
            depositsData.push({
              id: depositId,
              transactionId: transactionId,
              ...transactions[transactionId],
            });
          });
        });

        setDeposits(depositsData);
       
      }
    } catch (err) {
      console.error('Error fetching deposits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);



  const openImageModal = (imageUri) => {
    setSelectedImage(imageUri);
    setModalVisible(true);
  };

  const closeImageModal = () => {
    setModalVisible(false);
    setSelectedImage(null);
  };
  
  const handleAction = (item, action) => {
    setCurrentAction(action);
    setCurrentMemberId(item.id); // Set currentMemberId from the item
    setCurrentTransactionId(item.transactionId); // Ensure you're also setting currentTransactionId
    setConfirmModalVisible(true); // Show confirmation modal
  };
  
  const handleApprove = async () => {
    let depositData;
  
    try {
      const depositRef = database.ref(`Deposits/DepositApplications/${currentMemberId}/${currentTransactionId}`);
      const approvedDepositRef = database.ref(`Deposits/ApprovedDeposits/${currentMemberId}/${currentTransactionId}`);
      const transactionsRef = database.ref(`Transactions/Deposits/${currentMemberId}/${currentTransactionId}`);
      const memberRef = database.ref(`Members/${currentMemberId}`);
  
      const depositSnapshot = await depositRef.once('value');
      const memberSnapshot = await memberRef.once('value');
  
      if (depositSnapshot.exists() && memberSnapshot.exists()) {
        depositData = depositSnapshot.val();
        const memberData = memberSnapshot.val();
  
        const approvalDate = new Date();
        const options = {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        };
        const formattedApprovalDate = approvalDate.toLocaleString('en-US', options);
  
        await approvedDepositRef.set({
          ...depositData,
          dateApproved: formattedApprovalDate,
          memberId: currentMemberId,
          transactionId: currentTransactionId,
          amount: depositData.amountToBeDeposited,
          firstName: memberData.firstName,
          lastName: memberData.lastName,
          email: memberData.email,
        });
  
        await transactionsRef.set({
          transactionId: currentTransactionId,
          ...depositData,
          dateApproved: formattedApprovalDate,
        });
  
        // await depositRef.remove();
  
        const currentBalance = parseFloat(memberData.balance) || 0;
        const newBalance = currentBalance + parseFloat(depositData.amountToBeDeposited);
        await memberRef.update({ balance: newBalance });
  
        const fundsRef = database.ref('Funds/fundsAmount');
        const fundsSnapshot = await fundsRef.once('value');
        const currentFundsAmount = parseFloat(fundsSnapshot.val()) || 0;
        const newFundsAmount = currentFundsAmount + parseFloat(depositData.amountToBeDeposited);
        await fundsRef.set(newFundsAmount);
  
        setSuccessMessage(`Deposit approved successfully for Member ID: ${currentMemberId} \nDate Approved: ${formattedApprovalDate}`);
        setSuccessMessageModalVisible(true);
  
        const approveDepositsApplication = {
          memberId: currentMemberId,
          transactionId: currentTransactionId,
          amount: depositData.amountToBeDeposited,
          dateApproved: formattedApprovalDate,
          firstName: memberData.firstName,
          lastName: memberData.lastName,
          email: memberData.email,
        };
  
        const response = await ApproveDeposits(approveDepositsApplication);
        if (response.error) {
          throw new Error(response.error);
        }
      } else {
        Alert.alert("Error", "The specified deposit or member does not exist.");
      }
    } catch (err) {
      console.error('Error approving deposit:', err);
      Alert.alert("Error", "There was an error approving the deposit. Please try again.");
    } finally {
      setConfirmModalVisible(false);
      setTimeout(() => {
        fetchDeposits();
      }, 3000);
    }
  };

  
  const handleReject = async () => {
    try {
      const depositRef = database.ref(`Deposits/DepositApplications/${currentMemberId}/${currentTransactionId}`);
      const memberRef = database.ref(`Members/${currentMemberId}`);
  
      const depositSnapshot = await depositRef.once('value');
      const memberSnapshot = await memberRef.once('value');
  
      if (depositSnapshot.exists() && memberSnapshot.exists()) {
        const depositData = depositSnapshot.val();
        const memberData = memberSnapshot.val();
  
        const rejectionDate = new Date();
        const options = {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        };
        const formattedRejectionDate = rejectionDate.toLocaleString('en-US', options);
  
        await database.ref(`Deposits/RejectedDeposits/${currentMemberId}/${currentTransactionId}`).set({
          ...depositData,
          dateRejected: formattedRejectionDate,
          memberId: currentMemberId,
          transactionId: currentTransactionId,
          firstName: memberData.firstName,
          lastName: memberData.lastName,
          email: memberData.email,
        });
  
        // await depositRef.remove();
  
        setSuccessMessage(`Deposit rejected for Member ID: ${currentMemberId} \nDate Rejected: ${formattedRejectionDate}`);
        setSuccessMessageModalVisible(true);
  
        const rejectDepositsApplication = {
          memberId: currentMemberId,
          transactionId: currentTransactionId,
          amount: depositData.amountToBeDeposited,
          dateRejected: formattedRejectionDate,
          firstName: memberData.firstName,
          lastName: memberData.lastName,
          email: memberData.email,
        };
  
        const response = await RejectDeposits(rejectDepositsApplication);
        if (response.error) {
          throw new Error(response.error);
        }
      } else {
        Alert.alert("Error", "The specified deposit or member does not exist.");
      }
    } catch (err) {
      console.error('Error rejecting deposit:', err);
      Alert.alert("Error", "There was an error rejecting the deposit. Please try again.");
    } finally {
      setConfirmModalVisible(false);
      fetchDeposits();
    }
  };

  
  const confirmAction = async () => {
    if (currentAction === 'approve') {
      await handleApprove();
    } else if (currentAction === 'reject') {
      await handleReject();
    }
    setConfirmModalVisible(false); // Ensure this happens after approval/rejection
  };
  
  
  if (loading) {
    return <ActivityIndicator size="large" color="#001F3F" />;
  }

  const tableHead = ['Member ID', 'Transaction ID','Deposit Amount', 'Mode of Deposit', 'Date Applied', 'Proof of Deposit', 'Action'];

   // Filter deposits based on search query
   const filteredDeposits = deposits.filter(item =>
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
 const paginatedData = filteredDeposits.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
 const totalPages = Math.ceil(filteredDeposits.length / pageSize);

  const tableData = paginatedData.map((item, index) => (
    [
      item.id,
      item.transactionId,
      formatCurrency(item.amountToBeDeposited),
      item.depositOption,
      item.dateApplied,
      item.proofOfDepositUrl ? (
        <TouchableOpacity onPress={() => openImageModal(item.proofOfDepositUrl)} style={styles.proofContainer}>
          <Image source={{ uri: item.proofOfDepositUrl }} style={{ width: 40, height: 40, borderRadius: 10 }} />
        </TouchableOpacity>
      ) : (
        <Text>No proof</Text>
      ),
      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        <TouchableOpacity style={styles.button} onPress={() => handleAction(item, 'approve')}>
          <Text style={styles.buttonText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#FF0000' }]} onPress={() => handleAction(item, 'reject')}>
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
          placeholder="Search..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.searchIconContainer}>
          <MaterialIcons name="search" size={24} color="#001F3F" />
        </TouchableOpacity>
    </View>
    
    {filteredDeposits.length === 0 ? (
        <Text style={styles.noDataMessage}>No approved deposits found.</Text>
      ) : (
          <ScrollView>
                  <View style={styles.tableContainer}>
                    <Table borderStyle={styles.tableBorder}>
            <Row data={tableHead} style={styles.tableHead} textStyle={styles.tableHeadText} />
            {
              tableData.map((rowData, index) => (
                <Row
                  key={index}
                  data={rowData}
                  style={styles.tableRow}
                  textStyle={styles.tableRowText}
                />
              ))
            }
          </Table>
          </View>

          {/* Image Modal */}
        <Modal visible={modalVisible} transparent={true} animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TouchableOpacity onPress={closeImageModal} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color="white" />
              </TouchableOpacity>
              <Image source={{ uri: selectedImage }} style={styles.imagePreview} resizeMode="contain" />
            </View>
          </View>
        </Modal>
          {/* Modal for Confirmation */}
          <Modal visible={confirmModalVisible} transparent animationType="fade">
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
              <View style={{ backgroundColor: '#FFFFFF', padding: 20, borderRadius: 10, width: '35%', height: '35%', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 15 }}> {/* Increased marginBottom for better spacing */}
                  {`Confirm ${currentAction === 'approve' ? 'Approval' : 'Rejection'}`}
                </Text>
                <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 30 }}> {/* Increased marginBottom for better spacing */}
                  {`Are you sure you want to ${currentAction} this DEPOSIT APPLICATION?`}
                </Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%' }}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: '#008000' }]}
                    onPress={confirmAction}
                  >
                    <Text style={styles.buttonText}>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: '#FF0000' }]}
                    onPress={() => setConfirmModalVisible(false)}  // Correct state update
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
          <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 15, color: '#000000' }}>CONFIRMED</Text>
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
    </View>
  );
};

const styles = {
  tableContainer: {
    marginRight: 10,
    marginTop: 20,
    marginLeft: 25,
    marginRight: 25,
    borderRadius: 10, // Rounded corners for the table container
    overflow: 'hidden',
  },
  tableBorder: {
    borderWidth: 1,
    borderColor: '#C1C0B9',
  },
  tableHead: {
    height: 50, 
    backgroundColor: '#2D5783',
  },
  tableHeadText: {
    textAlign: 'center', 
    color: '#ffffff',
  },
  tableRow: {
    height: 50, 
    backgroundColor: '#EEEEEE',
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
    fontSize: 11,
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proofContainer: {
    justifyContent: 'center', // Center the thumbnail container
    alignItems: 'center', // Center the thumbnail container
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    width: '90%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  noDataMessage: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
    color: 'gray',
  },

  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 50,
    width: 250,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    marginTop: -60,
    marginRight: 90,
    alignSelf: 'flex-end',
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  searchIconContainer: {
    padding: 5,
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


export default ApplyDeposits;