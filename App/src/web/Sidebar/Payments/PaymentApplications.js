
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, TextInput, ScrollView, Modal, Button, StyleSheet, Image } from 'react-native';
import { database } from '../../../firebaseConfig'; // Adjust this based on your file structure
import { ref, set, get } from 'firebase/database';
import { ApprovePayments } from '../../../api';
import { RejectPayments } from '../../../api';
import { Table, Row } from 'react-native-table-component';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const formatDate = (dateString) => {
  if (!dateString || isNaN(new Date(dateString))) {
    return 'Invalid Date'; // Return a fallback value if date is invalid
  }

  const options = {
    month: 'long',
    day: 'numeric',
    year: 'numeric',

  };
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', options).format(date);
};

const PaymentApplications = () => {
  const [payLoans, setPayLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const [currentAction, setCurrentAction] = useState(null);
  const [successMessageModalVisible, setSuccessMessageModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0); // State for current page
  const pageSize = 20; // Number of registrations to display
  
  useEffect(() => {
    const fetchPayLoans = async () => {
      try {
        const snapshot = await database.ref('PayLoans').once('value');
        if (!snapshot.exists()) {
          setPayLoans([]);
        } else {
          const data = snapshot.val();
          const payLoansData = [];

          for (const accountId in data) {
            const transactions = data[accountId];
            for (const transactionId in transactions) {
              const transaction = transactions[transactionId];
              payLoansData.push({
                id: transaction.id,
                accountName: transaction.accountName,
                accountNumber: transaction.accountNumber,
                transactionId: transactionId,
                proofOfPaymentUrl: transaction.proofOfPaymentUrl,
                paymentOption: transaction.paymentOption,
                amount: transaction.amount,
                interest: transaction.interest, // Fetching interest
                dateApplied: transaction.dateApplied,
                email: transaction.email,
                ...transaction,
              });
            }
          }

          setPayLoans(payLoansData);
        }
      } catch (err) {
        console.error('Error fetching pay loans:', err);
        setError('An error occurred while fetching pay loans. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPayLoans();
  }, []);

  const handleAction = (payment, action) => {
    setSelectedPayment(payment);
    setCurrentAction(action);
    setModalVisible(true);
  };

  const confirmAction = async () => {
    // Close modal immediately
    setModalVisible(false);
  
    if (currentAction === 'approve') {
      await handleApprove();
    } else if (currentAction === 'reject') {
      await handleReject();
    }
  
    // Ensure confirmation modal is closed after action is processed
    setConfirmModalVisible(false);
  };
  
  
  const handleApprove = async () => {
    if (selectedPayment) {
      const paymentAmount = Math.floor(parseFloat(selectedPayment.amountToBePaid)); // Payment amount from the selected payment
      const interestAmount = Math.floor(parseFloat(selectedPayment.interest)) || 0; // Interest amount from the selected payment
  
      try {
        const currentDate = new Date();
        const dateApproved = formatDate(currentDate);
        const timeApproved = currentDate.toLocaleString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        const timestamp = currentDate.getTime(); // Unix timestamp in milliseconds
        const memberSnapshot = await database.ref(`Members/${selectedPayment.id}`).once('value');
        const memberData = memberSnapshot.val();
  
        if (!memberData) {
          Alert.alert('Error', 'Member data not found');
          return;
        }

                  // Show success message
                  setSuccessMessage(`Payment approved for Member ID: ${selectedPayment.id} \nDate Approved: ${currentDate}`);
                  setSuccessMessageModalVisible(true);
  
        const { firstName, lastName } = memberData; // Fetch first name and last name
        const fundsSnapshot = await database.ref('Funds/fundsAmount').once('value');
        const fundsAmount = Math.floor(parseFloat(fundsSnapshot.val())) || 0; // Total funds available
  
        const currentBalance = Math.floor(parseFloat(memberData.balance)) || 0; // Current balance of the member
  
        // Fetch current approved loan data
        const approvedLoansSnapshot = await database.ref(`ApprovedLoans/${selectedPayment.id}`).once('value');
        const approvedLoansData = approvedLoansSnapshot.val();
  
        if (approvedLoansData) {
          const loanAmount = Math.floor(parseFloat(approvedLoansData.loanAmount)) || 0; // Total loan amount
          let updatedLoanAmount = loanAmount;
          let updatedInterest = interestAmount;
          let excessPayment = 0;
  
          // Step 1: Deduct payment from interest first
          if (paymentAmount >= updatedInterest) {
            excessPayment = paymentAmount - updatedInterest;
          } else {
            updatedInterest -= paymentAmount; // Remaining interest
            excessPayment = 0;
          }
  
          // Step 2: Deduct any remaining excess from the loan principal
          if (excessPayment > 0) {
            if (excessPayment >= updatedLoanAmount) {
              excessPayment -= updatedLoanAmount;
              updatedLoanAmount = 0; // All principal has been covered
            } else {
              updatedLoanAmount -= excessPayment; // Reduce the principal by the excess payment
              excessPayment = 0;
            }
          }
  
          // Calculate the new balance
          const newBalance = currentBalance + paymentAmount - interestAmount;
  
          // Step 4: Update ApprovedLoans data with new loan and interest values
          await set(ref(database, `ApprovedLoans/${selectedPayment.id}`), {
            ...approvedLoansData,
            loanAmount: updatedLoanAmount, // Updated loan amount
          });
  
          // Step 5: Update member's balance and loans
          await set(ref(database, `Members/${selectedPayment.id}`), {
            ...memberData,
            balance: newBalance, // Updated member balance
            loans: updatedLoanAmount, // Updated loans, reflecting the new loan amount
          });
  
          // Calculate updated monthly payment and total monthly payment
          const monthlyPayment = Math.floor(parseFloat(approvedLoansData.monthlyPayment)) || 0; // Fetch current monthly payment
          const totalMonthlyPayment = monthlyPayment + updatedInterest; // Calculate new total monthly payment
  
          // Calculate the new monthly payment after deducting the excess payment
          const updatedMonthlyPayment = monthlyPayment - excessPayment;
  
          // Ensure monthly payment doesn't go negative
          const finalMonthlyPayment = Math.max(updatedMonthlyPayment, 0);
  
          // Step 6: Update ApprovedLoans with new monthly and total monthly payments
          await set(ref(database, `ApprovedLoans/${selectedPayment.id}`), {
            ...approvedLoansData,
            loanAmount: updatedLoanAmount, // Updated loan amount
            interest: updatedInterest, // Updated interest
            monthlyPayment: finalMonthlyPayment, // Updated monthly payment
            totalMonthlyPayment: totalMonthlyPayment, // Updated total monthly payment
          });
  
          // Check if loanAmount is 0 and remove entry from ApprovedLoans
          if (updatedLoanAmount === 0) {
            await set(ref(database, `ApprovedLoans/${selectedPayment.id}`), null);
          }
  
          // Step 7: Update funds with the actual payment amount
          const updatedFunds = fundsAmount + paymentAmount;
          await set(ref(database, 'Funds/fundsAmount'), updatedFunds); // Update funds total
  
          // Record the payment in ApprovedPayments and Transactions
          await set(ref(database, `ApprovedPayments/${selectedPayment.id}/${selectedPayment.transactionId}`), {
            accountName: selectedPayment.accountName,
            accountNumber: selectedPayment.accountNumber,
            dateApplied: selectedPayment.dateApplied,
            email: selectedPayment.email,
            id: selectedPayment.id,
            transactionId: selectedPayment.transactionId,
            amount: paymentAmount,
            interest: interestAmount,
            paymentOption: selectedPayment.paymentOption,
            proofOfPaymentUrl: selectedPayment.proofOfPaymentUrl,
            dateApproved: dateApproved,
            timeApproved: timeApproved,
            timestamp: timestamp,
          });

          await set(ref(database, `Transactions/Payments/${selectedPayment.id}/${selectedPayment.transactionId}`), {
            accountName: selectedPayment.accountName,
            accountNumber: selectedPayment.accountNumber,
            dateApplied: selectedPayment.dateApplied,
            email: selectedPayment.email,
            id: selectedPayment.id,
            transactionId: selectedPayment.transactionId,
            amount: paymentAmount,
            interest: interestAmount,
            paymentOption: selectedPayment.paymentOption,
            proofOfPaymentUrl: selectedPayment.proofOfPaymentUrl,
            dateApproved: dateApproved,
            timeApproved: timeApproved,
            timestamp: timestamp,
            status: 'approved'
          });
  

  
          // Remove the payment from PayLoans after approval
          await set(ref(database, `PayLoans/${selectedPayment.id}/${selectedPayment.transactionId}`), null);
  
          // Update dueDateMonth: Add 30 days to the current dueDateMonth
          const currentDueDate = new Date(approvedLoansData.dueDateMonth);
          const newDueDate = new Date(currentDueDate.setDate(currentDueDate.getDate() + 30));
          const formattedNewDueDate = formatDate(newDueDate); // Format the new due date to your desired format
  
          await set(ref(database, `ApprovedLoans/${selectedPayment.id}`), {
            ...approvedLoansData,
            loanAmount: updatedLoanAmount,
            dueDateMonth: formattedNewDueDate, // Update with new due date
          });
  

  
          // Remove the approved payment from the list
          const updatedPayLoans = payLoans.filter((loan) => loan.transactionId !== selectedPayment.transactionId);
          setPayLoans(updatedPayLoans);
                    // Include firstName and lastName in the approvePaymentApplication
                    const approvePaymentApplication = {
                      memberId: selectedPayment.id,
                      transactionId: selectedPayment.transactionId,
                      amount: paymentAmount,
                      dateApproved: dateApproved,
                      accountName: selectedPayment.accountName,
                      email: selectedPayment.email,
                      firstName: firstName, // Include firstName
                      lastName: lastName,   // Include lastName
                    };
            
                    const response = await ApprovePayments(approvePaymentApplication);
                    if (response.error) {
                      throw new Error(response.error);
                    }
        }
      } catch (error) {
        console.error('Error processing payment:', error);
        Alert.alert('Error', 'There was a problem processing your payment. Please try again.');
      } finally {
        setModalVisible(false);
        setSelectedPayment(null);
      }
    }
  };
  
  
  const handleReject = async () => {
    if (selectedPayment) {
      try {
        const currentDate = new Date();
        const dateRejected = formatDate(currentDate);
        const timeRejected = currentDate.toLocaleString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        const timestamp = currentDate.getTime(); // Unix timestamp in milliseconds
        const memberSnapshot = await database.ref(`Members/${selectedPayment.id}`).once('value');
        const memberData = memberSnapshot.val();
  
        if (!memberData) {
          Alert.alert('Error', 'Member data not found');
          return;
        }
  
        const firstName = memberData.firstName;
        const lastName = memberData.lastName;
  
        await set(ref(database, `RejectedPayments/${selectedPayment.id}/${selectedPayment.transactionId}`), {
          memberId: selectedPayment.id,
          firstName: firstName,
          lastName: lastName,
          accountName: selectedPayment.accountName,
          accountNumber: selectedPayment.accountNumber,
          amount: parseFloat(selectedPayment.amountToBePaid),
          paymentOption: selectedPayment.paymentOption,
          proofOfPaymentUrl: selectedPayment.proofOfPaymentUrl,
          transactionId: selectedPayment.transactionId,
          dateApplied: selectedPayment.dateApplied,
          dateRejected: dateRejected,
          timeRejected: timeRejected,
          timestamp: timestamp,
          email: selectedPayment.email,
        });

        // Also add to Transactions table for rejected payments
        await set(ref(database, `Transactions/Payments/${selectedPayment.id}/${selectedPayment.transactionId}`), {
          accountName: selectedPayment.accountName,
          accountNumber: selectedPayment.accountNumber,
          dateApplied: selectedPayment.dateApplied,
          email: selectedPayment.email,
          id: selectedPayment.id,
          transactionId: selectedPayment.transactionId,
          amount: parseFloat(selectedPayment.amountToBePaid),
          paymentOption: selectedPayment.paymentOption,
          proofOfPaymentUrl: selectedPayment.proofOfPaymentUrl,
          dateRejected: dateRejected,
          timeRejected: timeRejected,
          timestamp: timestamp,
          status: 'rejected'
        });

        setSuccessMessage(`Withdrawal rejected for ${firstName} ${lastName} (Member ID: ${selectedPayment.id}) \nDate Rejected: ${dateRejected}`);
        setSuccessMessageModalVisible(true);
  

        await set(ref(database, `PayLoans/${selectedPayment.id}/${selectedPayment.transactionId}`), null);
  

  
        const updatedPayLoans = payLoans.filter((loan) => loan.transactionId !== selectedPayment.transactionId);
        setPayLoans(updatedPayLoans);

        const rejectPaymentApplication = {
          memberId: selectedPayment.id,
          firstName: firstName,
          lastName: lastName,
          transactionId: selectedPayment.transactionId,
          amount: parseFloat(selectedPayment.amountToBePaid),
          dateRejected: dateRejected,
          accountName: selectedPayment.accountName,
          email: selectedPayment.email,
        };
  
        const response = await RejectPayments(rejectPaymentApplication);
        if (response.error) {
          throw new Error(response.error);
        }

      } catch (error) {
        console.error('Error rejecting payment:', error);
        Alert.alert('Error', 'There was a problem rejecting the payment. Please try again.');
      }
    }
  };

  
const openImageModal = (imageUrl) => {
    setSelectedImageUrl(imageUrl);
    setImageModalVisible(true);
  };

  const closeImageModal = () => {
    setImageModalVisible(false);
    setSelectedImageUrl(null);
  };  

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#001F3F" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'red', fontSize: 18 }}>{error}</Text>
      </View>
    );
  }

  if (loading) {
    return <ActivityIndicator size="large" color="#6a8f5f" />;
  }

  const tableHead = ['Member ID', 'Payment Amount', 'Mode of Payment', 'Date Applied', 'Transaction ID', 'Proof OF Payment', 'Action'];
// Filter deposits based on search query
const filteredpayLoans = payLoans.filter(item =>
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
 const paginatedData = filteredpayLoans.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
 const totalPages = Math.ceil(filteredpayLoans.length / pageSize);

  const tableData = paginatedData.map((item, index) => (
    [
      item.id,
      formatCurrency(item.amountToBePaid),
      item.paymentOption, 
      item.dateApplied,
      item.transactionId,
      item.proofOfPaymentUrl ? (
        <TouchableOpacity onPress={() => openImageModal(item.proofOfPaymentUrl)} style={styles.proofContainer}>
          <Image source={{ uri: item.proofOfPaymentUrl }} style={{ width: 40, height: 40, borderRadius: 10 }} />
        </TouchableOpacity>
      ) : (
        <Text>No proof</Text>
      ),
      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => handleAction(item, 'approve')}  // Using handleAction for approve
        >
          <Text style={styles.buttonText}>Approve</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: '#8E0B16' }]} 
          onPress={() => handleAction(item, 'reject')}  // Using handleAction for reject
        >
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
        {payLoans.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 20 }}>No Payment Applications available.</Text>
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

<Modal visible={modalVisible} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <View style={{ backgroundColor: '#FFFFFF', padding: 20, borderRadius: 10, width: '35%', height: '35%', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 15 }}>
              {`Confirm ${currentAction === 'approve' ? 'Approval' : 'Rejection'}`}
            </Text>
            <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 30 }}>
              {`Are you sure you want to ${currentAction} this PAYMENT APPLICATION?`}
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
                backgroundColor: '#FFFFFF',
                padding: 20,
                borderRadius: 10,
                width: '35%',
                height: '35%',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 15, color: '#000000' }}>SUCCESS</Text>
                <Text style={{ fontSize: 18, textAlign: 'center', color: '#000000', lineHeight: 24 }}>
                  {successMessage}
                </Text>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#4CAF50', marginTop: 25 }]}
                  onPress={() => setSuccessMessageModalVisible(false)} // Hides success message
                >
                  <Text style={styles.buttonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

       {/* Modal for Enlarged Image */}
       <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeImageModal}
      >
        <View style={styles.modalContainer}>
          <Image
            source={{ uri: selectedImageUrl }}
            style={styles.enlargedImage}
            resizeMode="contain"
          />
          <TouchableOpacity onPress={closeImageModal} style={styles.closeButton}>
            <Text style={{ color: '#fff', fontSize: 18 }}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      
        {/* Pagination and "X of Y" Display */}
        <View style={styles.paginationContainer}>
        <Text style={styles.paginationInfo}>
          {paginatedData.length} of {filteredpayLoans.length}
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

const styles = StyleSheet.create({
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
  proofContainer: {
    justifyContent: 'center', // Center the thumbnail container
    alignItems: 'center', // Center the thumbnail container
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  enlargedImage: {
    width: '90%',
    height: '80%',
    borderRadius: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
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
});


export default PaymentApplications;