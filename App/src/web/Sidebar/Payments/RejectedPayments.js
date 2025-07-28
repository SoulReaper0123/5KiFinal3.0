import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Image, Modal, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { database } from '../../../firebaseConfig'; // Adjust this import to your Firebase configuration
import { Table, Row } from 'react-native-table-component';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const RejectedPayments = () => {
  const [rejectedPayments, setRejectedPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setImageModalVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0); // State for current page
  const pageSize = 20; // Number of registrations to display
  
  useEffect(() => {
    const fetchRejectedPayments = async () => {
      try {
        const snapshot = await database.ref('RejectedPayments').once('value');
        if (snapshot.exists()) {
          const data = snapshot.val();
          const rejectedPaymentsData = [];

          // Traverse the structure: memberId -> transactionId -> data
          for (const memberId in data) {
            const transactions = data[memberId];
            for (const transactionId in transactions) {
              const transaction = transactions[transactionId];
              rejectedPaymentsData.push({
                memberId: memberId, // Store memberId separately
                transactionId: transactionId, // Store transactionId
                accountName: transaction.accountName,
                accountNumber: transaction.accountNumber,
                proofOfPaymentUrl: transaction.proofOfPaymentUrl,
                paymentOption: transaction.paymentOption,
                amount: transaction.amount,
                dateApplied: transaction.dateApplied,
                dateRejected: transaction.dateRejected,
                email: transaction.email,
                ...transaction,
              });
            }
          }

          setRejectedPayments(rejectedPaymentsData);
        } else {
          setRejectedPayments([]); // Set empty if no data exists
        }
      } catch (err) {
        console.error('Error fetching rejected payments:', err);
        setError('An error occurred while fetching rejected payments. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRejectedPayments();
  }, []);


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
        <Text style={{ color: 'red' }}>{error}</Text>
      </View>
    );
  }

  if (rejectedPayments.length === 0) {
    return (
      <View>
        <Text style={{ textAlign: 'center', marginTop: 20 }}>No rejected payments available.</Text>
      </View>
    );
  }
  const openImageModal = (imageUrl) => {
    setSelectedImageUrl(imageUrl);
    setImageModalVisible(true);
  };

  const closeImageModal = () => {
    setImageModalVisible(false);
    setSelectedImageUrl(null);
  };
  const tableHead = ['Member ID', 'Payment Amount', 'Mode of Payment', 'Date Applied', 'Transaction ID', 'Proof OF Payment', 'Date Rejected'];

  // Filter deposits based on search query
  const filteredRejectedPayments = rejectedPayments.filter(item =>
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
const paginatedData = filteredRejectedPayments.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
const totalPages = Math.ceil(filteredRejectedPayments.length / pageSize);

  const tableData = paginatedData.map((item, index) => (
    [
      item.memberId,
      formatCurrency(item.amount),
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
      item.dateRejected,
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
    {filteredRejectedPayments.length === 0 ? (
        <Text style={styles.noDataMessage}>No approved payments found.</Text>
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
        {/* Modal for Enlarged Image (if needed) */}
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={closeImageModal}
        >
          <View style={styles.modalContainer}>
            <Image
              source={{ uri: setSelectedImageUrl }}
              style={styles.enlargedImage}
              resizeMode="contain"
            />
            <TouchableOpacity onPress={closeImageModal} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
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
export default RejectedPayments;