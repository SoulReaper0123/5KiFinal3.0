import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Alert, TouchableOpacity, Modal, Image, TextInput, SafeAreaView, StyleSheet } from 'react-native';
import { Table, Row, Rows } from 'react-native-table-component'; // Import table component
import { database } from '../../firebaseConfig'; // Firebase configuration
import Icon from 'react-native-vector-icons/FontAwesome'; // Import an icon library
import * as XLSX from 'xlsx'; // Import the XLSX library
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const Members = () => {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [fundsAmount, setFundsAmount] = useState(0);
  const [loanApplicationsCount, setLoanApplicationsCount] = useState(0);
  const [depositApplicationsCount, setDepositApplicationsCount] = useState(0);
  const [selectedMember, setSelectedMember] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [searchQuery, setSearchQuery] = useState(''); // State for search input
  const [isModalVisible, setIsModalVisible] = useState(false); 
  const [currentPage, setCurrentPage] = useState(0); // State for current page
  const pageSize = 20; // Number of registrations to display

  const tableHead = ['Member ID', 'Email', 'Name', 'Savings', 'Loans', 'More Details'];
 
  // Filter members based on the search query (Member ID)
  const filteredMembers = searchQuery
    ? members.filter(member => member.id.toString().includes(searchQuery)) // Filter by ID
    : members; // If no search, display all members

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
      }).format(amount);
    };
    
    // Modify the table data mapping to format the savings and loans values
    const tableData = filteredMembers.map(member => [
      member.id,
      member.email,
      `${member.firstName} ${member.middleName} ${member.lastName}`,
      formatCurrency(member.balance), // Format savings
      formatCurrency(member.loans),   // Format loans
      <TouchableOpacity style={styles.button} onPress={() => openModal(member)}>
        <Text style={styles.buttonText}>More</Text>
      </TouchableOpacity>
    ]);

     // Pagination logic
  const paginatedData = filteredMembers.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const totalPages = Math.ceil(filteredMembers.length / pageSize);

  // Fetch data from Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Funds
        const fundsSnapshot = await database.ref('Funds').once('value');
        const fundsData = fundsSnapshot.val() || {};
        setFundsAmount(Number(fundsData.fundsAmount) || 0);

        // Fetch Members
        const membersSnapshot = await database.ref('Members').once('value');
        const membersData = membersSnapshot.val() || {};
        const membersArray = Object.keys(membersData).map((key) => ({ id: key, ...membersData[key] }));
        setMembers(membersArray);

        // Fetch Loan Applications Count
        const loanAppsSnapshot = await database.ref('LoanApplications').once('value');
        const loanApplicationsData = loanAppsSnapshot.val() || {};
        setLoanApplicationsCount(Object.keys(loanApplicationsData).length);

        // Fetch Deposit Applications Count
        const depositAppsSnapshot = await database.ref('Deposits').once('value');
        const depositApplicationsData = depositAppsSnapshot.val() || {};
        setDepositApplicationsCount(Object.keys(depositApplicationsData).length);

      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Unable to fetch data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const openModal = (member) => {
    setSelectedMember(member);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedMember(null);
  };

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
    setImageModalVisible(true);
  };

  const closeImageModal = () => {
    setImageModalVisible(false);
    setSelectedImage('');
  };
  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };


  const handleDownload = () => {
    // Prepare data for export
    const worksheetData = filteredMembers.map(member => ({
      'Member ID': member.id,
      'Email': member.email,
      'Name': `${member.firstName} ${member.middleName} ${member.lastName}`,
      'Phone Number': member.phoneNumber,
      'Savings': member.balance,
      'Loans': member.loans,
      'Address': member.address,
      'Gender': member.gender,
      'Civil Status': member.civilStatus,
      'Birth Date': member.dateOfBirth,
      'Age': member.age,
      'Place Of Birth': member.placeOfBirth,
      'Valid ID Front': member.validIdFrontUrl,
      'Valid ID Back': member.validIdBackUrl,
      'Selfie': member.selfieUrl
    }));

    // Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Members');

    // Convert to binary format
    const excelFile = XLSX.write(workbook, { type: 'binary', bookType: 'xlsx' });

    // Create a Blob from the binary string
    const blob = new Blob([s2ab(excelFile)], { type: 'application/octet-stream' });

    // Create a download link and trigger it
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Members_Table.xlsx';
    link.click();

    // Close the modal after download
    toggleModal();
  };

  const s2ab = (s) => {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i !== s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
    return buf;
  };


  

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#001F3F" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ flex: 1, padding: 10 }}>
      <Text style={styles.headerText}>Members</Text>
     
       {/* Members Table */}
       {filteredMembers.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 20 }}>No members found.</Text>
        ) : (
          <View style={styles.tableContainer}>
            <Table borderStyle={styles.tableBorder}>
              <Row data={tableHead} style={styles.tableHead} textStyle={styles.tableHeadText} />
              <Rows data={tableData} style={styles.tableRow} textStyle={styles.tableRowText} />
            </Table>
          </View>
        )}

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

      {/* Modal for showing more details */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalView}>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>X</Text>
            </TouchableOpacity>
            {selectedMember && (
              <View style={styles.modalContent}>
                <View style={styles.detailsSection}>
                  <Text style={styles.modalTitle}>More Details</Text>
                  <Text style={styles.modalText}>Gender: {selectedMember.gender}</Text>
                  <Text style={styles.modalText}>Current Address: {selectedMember.address}</Text>
                  <Text style={styles.modalText}>Civil Status: {selectedMember.civilStatus}</Text>
                  <Text style={styles.modalText}>Age: {selectedMember.age}</Text>
                  <Text style={styles.modalText}>Place of Birth: {selectedMember.placeOfBirth}</Text>
                </View>

                <View style={styles.imagesSection}>
                  <Text style={styles.modalTitle}>Images</Text>
                  <TouchableOpacity onPress={() => openImageModal(selectedMember.validIdFrontUrl)}>
                    <Text style={styles.imageLabel}>Valid ID Front</Text>
                    <Image source={{ uri: selectedMember.validIdFrontUrl }} style={styles.imageThumbnail} />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => openImageModal(selectedMember.validIdBackUrl)}>
                    <Text style={styles.imageLabel}>Valid ID Back</Text>
                    <Image source={{ uri: selectedMember.validIdBackUrl }} style={styles.imageThumbnail} />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => openImageModal(selectedMember.selfieUrl)}>
                    <Text style={styles.imageLabel}>Selfie</Text>
                    <Image source={{ uri: selectedMember.selfieUrl }} style={styles.imageThumbnail} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            </View>
          </Modal>

      {/* Image Modal */}
      <Modal visible={imageModalVisible} transparent animationType="fade">
        <View style={styles.imageModalView}>
          <TouchableOpacity style={styles.closeImageModalButton} onPress={closeImageModal}>
            <Text style={styles.closeImageModalButtonText}>X</Text>
          </TouchableOpacity>
          <Image source={{ uri: selectedImage }} style={styles.enlargedImage} />
        </View>
      </Modal>

      

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  dashboardSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 34,
    marginBottom: 10,
    marginLeft: 25,
    marginTop: 80,
  },
  card: {
    backgroundColor: '#001F3F',
    padding: 30,
    borderRadius: 5,
    flex: 1,
    marginLeft: 25,
    marginRight: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#ffffff',
  },
  cardValue: {
    fontSize: 26,
    marginTop: 5,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#ffffff',
  },
  container: {
    flexDirection: 'row', // Align children in a row
    alignItems: 'center', // Center items vertically
    marginRight: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    marginRight: 5,
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
  downloadIcon: {
    marginLeft: 10,
  },
  tableContainer: {
    marginTop: 15,
    marginRight:10,
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
    backgroundColor: "#001F3F",
    padding: 8,
    borderRadius: 20,
    marginHorizontal: 5,
    width: 100,
    alignItems: 'center',
    alignSelf: 'center'
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalView: {
    width: '90%',
    maxWidth: 700,
    flex: 0.6,
    backgroundColor: '#FFFFFF',
    margin: 0,
    padding: 20,
    borderRadius: 10,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -300 }, { translateY: -300 }],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 10,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
  },
  modalContent: {
    flexDirection: 'row',
    padding: 20,
  },
  detailsSection: {
    flex: 1,
    marginRight: 10,
  },
  imagesSection: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 18, // Increase text size for better readability
    marginBottom: 5, // Space between each text line
  },
  imageLabel: {
    marginTop: 10,
    fontWeight: 'bold',
  },
  imageThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginTop: 5,
  },
  imageModalView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  closeImageModalButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
  },
  closeImageModalButtonText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  enlargedImage: {
    width: '90%',
    height: '70%',
    resizeMode: 'contain',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContents: {
    width: 300,
    backgroundColor: '#DFE6DA',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTexts: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButtonYes: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    backgroundColor: 'green',
    borderRadius: 5,
    alignItems: 'center',
  },
  modalButtonNo: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    backgroundColor: 'red',
    borderRadius: 5,
    alignItems: 'center',
  },
  
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
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

export default Members;