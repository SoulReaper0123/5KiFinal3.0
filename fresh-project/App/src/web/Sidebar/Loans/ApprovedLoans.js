import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ActivityIndicator, Modal, TouchableOpacity, Image, ScrollView, StyleSheet } from 'react-native';
import { database } from '../../../firebaseConfig'; // Adjust the path based on your project structure
import { Table, Row, Rows } from 'react-native-table-component';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const ApprovedLoans = () => {
  const [approvedLoans, setApprovedLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0); // State for current page
  const pageSize = 20; // Number of registrations to display

  useEffect(() => {
    const fetchApprovedLoans = async () => {
      try {
        const snapshot = await database.ref('ApprovedLoans').once('value');
        if (snapshot.exists()) {
          const data = snapshot.val();
          const loansData = [];

          // Extract approved loans
          Object.keys(data).forEach((loanId) => {
            const loan = data[loanId];
            loansData.push({ id: loanId, ...loan });
          });

          setApprovedLoans(loansData);
        } else {
          setApprovedLoans([]);
        }
      } catch (err) {
        console.error('Error fetching approved loans:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchApprovedLoans();
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

  const tableHead = ['Member ID', 'Loan Amount', 'Term', 'Disbursement', 'Account Name', 'Account Number', 'Interest', 'Processing Fee', 'Release Amount', 'Date Applied', 'Transaction ID' , 'Date Approved'];
  
  const filteredApprovedLoans = approvedLoans.filter(item =>
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
const paginatedData = filteredApprovedLoans.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
const totalPages = Math.ceil(filteredApprovedLoans.length / pageSize);
 
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
    item.dateApproved,
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
      {filteredApprovedLoans.length === 0 ? (
        <Text style={styles.noDataMessage}>No approved loans found.</Text>
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

export default ApprovedLoans;