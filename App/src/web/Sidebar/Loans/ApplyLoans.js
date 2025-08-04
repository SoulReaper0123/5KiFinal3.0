import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Modal, Button, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getDatabase, ref, set, get, push } from 'firebase/database';
import { ApproveLoans } from '../../../api';
import { RejectLoans } from '../../../api';
import { Table, Row, Rows } from 'react-native-table-component';

// Function to format date to "MM/DD/YYYY, h:mm A"
const formatDate = (dateString) => {
  const options = {  
    month: 'long', 
    day: 'numeric',
    year: 'numeric',
  };
  return new Date(dateString).toLocaleString('en-US', options);
};

const ApplyLoans = () => {
  const [loans, setLoans] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentAction, setCurrentAction] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [successMessageModalVisible, setSuccessMessageModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(0); // State for current page
  const pageSize = 20; // Number of registrations to display
  const [searchQuery, setSearchQuery] = useState('');
 

  const fetchLoans = async () => {
    try {
      const db = getDatabase();
      const loansSnapshot = await get(ref(db, 'ApplyLoans'));
      
      if (loansSnapshot.exists()) {
        const loansData = loansSnapshot.val();
        const formattedLoans = Object.keys(loansData).map(key => ({
          id: key,
          ...loansData[key]
        }));
        setLoans(formattedLoans);
      } else {
        setLoans([]);
      }
    } catch (error) {
      console.error('Error fetching loans:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleAction = (item, action) => {
    setSelectedLoan(item);
    setCurrentAction(action);
    setModalVisible(true); // Show confirmation modal
  };

  const handleApprove = async () => {
    if (selectedLoan) {
      const db = getDatabase();
      const releaseAmountFloat = parseFloat(selectedLoan.releaseAmount); // Ensure this is a float
      const currentDate = new Date();
      const formattedDateApproved = formatDate(currentDate.toISOString());
  
      // Calculate dueDateMonth (30 days from date approved)
      const dueDateMonth = new Date(currentDate);
      dueDateMonth.setDate(dueDateMonth.getDate() + 30);
      const formattedDueDateMonth = formatDate(dueDateMonth.toISOString());
  
      // Calculate dueDateTerm based on loan term
      const termInMonths = parseInt(selectedLoan.term, 10);
      const dueDateTerm = new Date(currentDate);
      dueDateTerm.setDate(dueDateTerm.getDate() + termInMonths * 30);
      const formattedDueDateTerm = formatDate(dueDateTerm.toISOString());
  
      try {
        // Move all loan data to ApprovedLoans
        await set(ref(db, `ApprovedLoans/${selectedLoan.id}`), {
          accountName: selectedLoan.accountName,
          accountNumber: selectedLoan.accountNumber,
          currentBalance: selectedLoan.currentBalance,
          dateApplied: formatDate(selectedLoan.dateApplied),
          dateApproved: formattedDateApproved,
          disbursement: selectedLoan.disbursement,
          email: selectedLoan.email,
          id: selectedLoan.id,
          loanType: selectedLoan.loanType,
          firstName: selectedLoan.firstName,
          lastName: selectedLoan.lastName,
          transactionId: selectedLoan.transactionId,
          totalMonthlyPayment: selectedLoan.totalMonthlyPayment,
          monthlyPayment: selectedLoan.monthlyPayment,
          totalPayment: selectedLoan.totalPayment,
          loanAmount: selectedLoan.loanAmount,
          interest: selectedLoan.interest,
          interestPercentage: selectedLoan.interestPercentage,
          interestRate: selectedLoan.interestRate,
          processingFee: selectedLoan.processingFee,
          releaseAmount: releaseAmountFloat, // Use releaseAmount
          term: selectedLoan.term,
          dueDateMonth: formattedDueDateMonth,
          dueDateTerm: formattedDueDateTerm,
        });
  
        // Update fundsAmount (subtracting releaseAmount)
        const fundsRef = ref(db, 'Funds/fundsAmount'); // Ensure the correct path to fundsAmount
        const fundsSnapshot = await get(fundsRef);
        if (fundsSnapshot.exists()) {
          const fundsAmount = parseFloat(fundsSnapshot.val()); // Ensure this is a float
          const newFundsAmount = fundsAmount - releaseAmountFloat; // Subtract releaseAmount
          await set(fundsRef, newFundsAmount);
        }
  
        // Update loans in Members
        const memberLoanRef = ref(db, `Members/${selectedLoan.id}/loans`);
        const currentLoansSnapshot = await get(memberLoanRef);
        const currentLoansFloat = currentLoansSnapshot.exists() ? parseFloat(currentLoansSnapshot.val()) : 0;
        const updatedLoans = (currentLoansFloat + parseFloat(selectedLoan.loanAmount)).toFixed(2);
        await set(memberLoanRef, parseFloat(updatedLoans)); // Store as float
  
        // Update member balance after deducting the loan amount
        const memberBalanceRef = ref(db, `Members/${selectedLoan.id}/balance`);
        const currentBalanceSnapshot = await get(memberBalanceRef);
        if (currentBalanceSnapshot.exists()) {
          const currentBalanceFloat = parseFloat(currentBalanceSnapshot.val()).toFixed(2);
          const updatedBalance = (parseFloat(currentBalanceFloat) - parseFloat(selectedLoan.loanAmount)).toFixed(2);
          await set(memberBalanceRef, parseFloat(updatedBalance)); // Store as float
        }
  
        // Send a copy of the approved loan to Transactions
        await set(ref(db, `Transactions/ApplyLoans/${selectedLoan.id}/${selectedLoan.transactionId}`), {
          accountName: selectedLoan.accountName,
          accountNumber: selectedLoan.accountNumber,
          currentBalance: selectedLoan.currentBalance,
          dateApplied: formatDate(selectedLoan.dateApplied), // Format date
          disbursement: selectedLoan.disbursement,
          email: selectedLoan.email,
          id: selectedLoan.id,
          firstName: selectedLoan.firstName,
          lastName: selectedLoan.lastName,
          transactionId: selectedLoan.transactionId,
          loanAmount: parseFloat(selectedLoan.loanAmount).toFixed(2), // Convert back to float
          interest: parseFloat(selectedLoan.interest).toFixed(2),
          processingFee: parseFloat(selectedLoan.processingFee).toFixed(2),
          releaseAmount: parseFloat(selectedLoan.releaseAmount).toFixed(2),
          term: selectedLoan.term,
          dateApproved: formattedDateApproved, // Format date
          dueDateMonth: formattedDueDateMonth, // Add dueDateMonth
          dueDateTerm: formattedDueDateTerm, // Add dueDateTerm
        });
  
        // Remove loan from ApplyLoans
        await set(ref(db, `ApplyLoans/${selectedLoan.id}`), null);
        // Update success message
        setSuccessMessage(`Loan Application approved for Member ID: ${selectedLoan.id} \nDate Approved: ${formattedDateApproved}`);
        setSuccessMessageModalVisible(true); // Show success modal
  
        // Prepare and send loan application data to the backend
        const approveLoanApplication = {
          memberId: selectedLoan.id, // Define the correct member ID here
          transactionId: selectedLoan.transactionId, // Define the correct transaction ID here
          amount: releaseAmountFloat,
          dateApproved: formattedDateApproved,
          accountName: selectedLoan.accountName,
          firstName: selectedLoan.firstName,
          lastName: selectedLoan.lastName,
          email: selectedLoan.email,
        };
  
        const response = await ApproveLoans(approveLoanApplication);
        if (response.status === 200) {
          
        } else {
          console.error("Failed to approve loan:", response);
        }
      } catch (error) {
        console.error("Error approving loan:", error);
        // Optionally handle error (e.g., show a notification to the user)
      }
    }
  };
  
  const handleReject = async () => {
    if (selectedLoan) {
      const db = getDatabase();
      const loanAmountFloat = parseFloat(selectedLoan.loanAmount).toFixed(2);
      const currentDate = new Date();
      const formattedDateRejected = formatDate(currentDate.toISOString());
  
      try {
        // Reference to the existing member's RejectedLoans
        const rejectedLoanRef = ref(db, `RejectedLoans/${selectedLoan.memberId}/${selectedLoan.transactionId}`);
  
       // Move all loan data to ApprovedLoans
       await set(ref(db, `RejectedLoans/${selectedLoan.id}/${selectedLoan.transactionId}`), {
        accountName: selectedLoan.accountName,
        accountNumber: selectedLoan.accountNumber,
        dateApplied: formatDate(selectedLoan.dateApplied),
        dateRejected: formattedDateRejected,
        disbursement: selectedLoan.disbursement,
        email: selectedLoan.email,
        term: Number(parseFloat(selectedLoan.term).toFixed(2)),
        id: selectedLoan.id,
        firstName: selectedLoan.firstName,
        lastName: selectedLoan.lastName,
        transactionId: selectedLoan.transactionId,
        loanAmount: Number(parseFloat(selectedLoan.loanAmount).toFixed(2)),
        processingFee: Number(parseFloat(selectedLoan.processingFee).toFixed(2)),
        releaseAmount: Number(parseFloat(selectedLoan.releaseAmount).toFixed(2)),
        interest: Number(parseFloat(selectedLoan.interest).toFixed(2)),
        interestPercentage: Number(parseFloat(selectedLoan.interestPercentage).toFixed(2)),
      });
        // Remove loan from ApplyLoans
        await set(ref(db, `Loans/LoanApplications/${selectedLoan.id}`), null);
        // Update success message
        setSuccessMessage(`Loan Application rejected for Member ID: ${selectedLoan.id} \nDate Rejected: ${formattedDateRejected}`);
        setSuccessMessageModalVisible(true); // Show success modal
  
        // Prepare and send loan rejection data to the backend
        const rejectLoanApplication = {
          memberId: selectedLoan.id, // Define the correct member ID here
          transactionId: selectedLoan.transactionId, // Define the correct transaction ID here
          amount: loanAmountFloat,
          dateRejected: formattedDateRejected,
          accountName: selectedLoan.accountName,
          email: selectedLoan.email,
        };
  
        const response = await RejectLoans(rejectLoanApplication);
        if (response.status === 200) {
          
        } else {
          console.error("Failed to reject loan:", response);
        }
      } catch (error) {
        console.error("Error rejecting loan:", error);
        // Optionally handle error (e.g., show a notification to the user)
      }
    }
  };
  
  
  

  const confirmAction = () => {
    if (currentAction === 'approve') {
      handleApprove(); // Call handleApprove without parameters
    } else if (currentAction === 'reject') {
      handleReject(); // Call handleReject without parameters
    }
    setModalVisible(false); // Close the confirmation modal
  };
  
  
  if (loading) {
    return <ActivityIndicator size="large" color="#001F3F" />;
  }

  const tableHead = ['Member ID', 'Loan Amount', 'Term', 'Disbursement', 'Account Name', 'Account Number', 'Interest', 'Processing Fee', 'Release Amount', 'Date Applied', 'Transaction ID' , 'Action'];

  // Filter deposits based on search query
  const filteredLoans = loans.filter(item =>
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

 const formatTerm = (term) => {
  return `${term} ${term === 1 ? 'Month' : 'Months'}`;
};
// Pagination logic
const paginatedData = filteredLoans.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
const totalPages = Math.ceil(filteredLoans.length / pageSize);
 
  const tableData = paginatedData.map(item => [
    item.id,
    formatCurrency(item.loanAmount),
    formatTerm(item.term),
    item.disbursement,
    item.accountName,
    item.accountNumber,
    `${item.interestPercentage}%`,
    formatCurrency(item.processingFee),
    formatCurrency(item.releaseAmount),
    item.dateApplied,
    item.transactionId,
    <View style={{  flexDirection: 'row', justifyContent: 'space-around' }}>
            <TouchableOpacity style={styles.button} onPress={() => handleAction(item, 'approve')}>
                        <Text style={styles.buttonText}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.button, { backgroundColor: '#8E0B16' }]} onPress={() => handleAction(item, 'reject')}>
                        <Text style={styles.buttonText}>Reject</Text>
                      </TouchableOpacity>
            </View>
  ]);

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
       {filteredLoans.length === 0 ? (
        <Text style={styles.noDataMessage}>No loan Applications available.</Text>
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
      </ScrollView>
    )}

      {/* Modal for Confirmation */}
      <Modal visible={modalVisible} transparent animationType="fade">
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
              <View style={{ backgroundColor: '#FFFFFF', padding: 20, borderRadius: 10, width: '35%', height: '35%', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 15 }}> {/* Increased marginBottom for better spacing */}
                  {`Confirm ${currentAction === 'approve' ? 'Approval' : 'Rejection'}`}
                </Text>
                <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 30 }}> {/* Increased marginBottom for better spacing */}
                  {`Are you sure you want to ${currentAction} this LOAN APPLICATION?`}
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

    </View>
  );
};
const styles = {
  button: {
    backgroundColor: '#008000',
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
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
};


export default ApplyLoans;