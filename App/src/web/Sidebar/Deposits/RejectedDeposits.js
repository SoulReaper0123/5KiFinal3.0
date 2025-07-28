import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Modal, TouchableOpacity, Image, ScrollView, StyleSheet, TextInput } from 'react-native';
import { database } from '../../../firebaseConfig'; // Adjust the path based on your project structure
import { Table, Row } from 'react-native-table-component';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'

const RejectedDeposits = () => {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0); // State for current page
  const pageSize = 20; // Number of registrations to display

  useEffect(() => {
    const fetchRejectedDeposits = async () => {
      try {
        const snapshot = await database.ref('Deposits/RejectedDeposits').once('value');
        if (snapshot.exists()) {
          const data = snapshot.val();
          const depositsData = [];

          // Extract deposits
          Object.keys(data).forEach((id) => {
            const transactions = data[id];
            Object.keys(transactions).forEach((transactionId) => {
              const transaction = transactions[transactionId];
              depositsData.push({ id, transactionId, ...transaction });
            });
          });

          setDeposits(depositsData);
        } else {
          setDeposits([]);
        }
      } catch (err) {
        console.error('Error fetching rejected deposits:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRejectedDeposits();
  }, []);

  const openImageModal = (imageUri) => {
    setSelectedImage(imageUri);
    setModalVisible(true);
  };

  const closeImageModal = () => {
    setModalVisible(false);
    setSelectedImage(null);
  };
 

  if (loading) {
    return <ActivityIndicator size="large" color="#001F3F" />;
  }

 

  const tableHead = ['Member ID', 'Deposit Amount', 'Mode of Deposit', 'Date Applied', 'Transaction ID', 'Proof of Deposit', 'Date Rejected'];

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

  const tableData = paginatedData.map(item => [
    item.id,
      formatCurrency(item.amountToBeDeposited),
      item.depositOption,
      item.dateApplied,
      item.transactionId,
    item.proofOfDepositUrl ? (
      <TouchableOpacity onPress={() => openImageModal(item.proofOfDepositUrl)} style={styles.proofContainer}>
        <Image
          source={{ uri: item.proofOfDepositUrl }}
          style={styles.proofImage}
        />
      </TouchableOpacity>
    ) : (
      <Text>No Proof</Text>
    ),
    item.dateRejected, // Changed from dateApproved to dateRejected
  ]);

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
        </ScrollView>
      )}

      {/* Modal for Enlarged Image */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeImageModal}
      >
        <View style={styles.modalContainer}>
          <Image
            source={{ uri: selectedImage }}
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
  
  proofContainer: {
    justifyContent: 'center', // Center the thumbnail container
    alignItems: 'center', // Center the thumbnail container
  },
  proofImage: {
    width: 40, // Set width for thumbnail
    height: 40, // Set height for thumbnail
    borderRadius: 5,
    alignSelf: 'center', // Center the image within its container
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
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
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
});

export default RejectedDeposits;