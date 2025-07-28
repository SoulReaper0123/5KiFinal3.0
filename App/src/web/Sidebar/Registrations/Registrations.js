import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
  Image,
  TextInput,
  StyleSheet,
} from 'react-native';
import { database, auth } from '../../../firebaseConfig'; // Firebase configuration
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ApproveRegistration } from '../../../api';
import { RejectRegistration } from '../../../api';
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

const Registrations = () => {
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState([]);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [currentAction, setCurrentAction] = useState(null);
  const [successMessageModalVisible, setSuccessMessageModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(0); // State for current page
  const pageSize = 20; // Number of registrations to display
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data from Firebase
  useEffect(() => {
    const fetchRegistrations = async () => {
      setLoading(true); // Set loading to true before fetching
      try {
        const snapshot = await database.ref('Registrations/RegistrationApplications').once('value');
        const data = snapshot.val() || {};
        const registrationsArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setRegistrations(registrationsArray);
      } catch (error) {
        console.error('Error fetching registrations:', error);
        Alert.alert('Error', 'Unable to fetch registrations.');
      } finally {
        setLoading(false); // Ensure loading is set to false here
      }
    };

    // Call fetchRegistrations when the component mounts
    fetchRegistrations();

    // Set up a real-time listener for registrations (optional)
    const registrationsRef = database.ref('Registrations/RegistrationApplications');
    const onValueChange = registrationsRef.on('value', (snapshot) => {
      const data = snapshot.val() || {};
      const registrationsArray = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));
      setRegistrations(registrationsArray);
    });

    // Cleanup the listener on unmount
    return () => registrationsRef.off('value', onValueChange);
  }, []);

  // useEffect to hide confirmation modal when success modal is visible
  useEffect(() => {
    if (successMessageModalVisible) {
      setConfirmModalVisible(false); // Hide confirmation modal when success modal is visible
    }
  }, [successMessageModalVisible]); // Dependency on successMessageModalVisible

  const handleAction = (registration, action) => {
    setSelectedRegistration(registration);
    setCurrentAction(action);
    setConfirmModalVisible(true); // Open confirmation modal
  };

  const confirmAction = async () => {
    setConfirmModalVisible(false); // Hide the confirmation modal immediately

    if (currentAction === 'approve') {
      await handleApprove(selectedRegistration.id); // Call the approval action
    } else if (currentAction === 'reject') {
      await handleReject(selectedRegistration.id); // Call the rejection action
    }

    setSelectedRegistration(null); // Clear the selected registration after action
  };

  const openModal = (registration) => {
    setSelectedRegistration(registration);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedRegistration(null);
  };

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
    setImageModalVisible(true);
  };

  const closeImageModal = () => {
    setImageModalVisible(false);
    setSelectedImage('');
  };

  const handleApprove = async (registrationId) => {
    const registrationToApprove = registrations.find((item) => item.id === registrationId);
    if (!registrationToApprove) return;

    try {
      const { id, email, password, ...registrationData } = registrationToApprove;

      // Check if email and password are present
      if (!email || !password) {
        throw new Error('Email and password must be provided');
      }

      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch existing members to determine new ID
      const existingMembersSnapshot = await database.ref('Members').once('value');
      const existingMembers = existingMembersSnapshot.val() || {};
      const memberIds = Object.keys(existingMembers).map(Number);
      const newId = Math.max(...memberIds, 5000) + 1;

      const approvalDate = new Date();
      const options = {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      };
      const formattedApprovalDate = approvalDate.toLocaleString('en-US', options);

      // Add new member to the database
      await database.ref(`Members/${newId}`).set({
        id: newId,
        ...registrationData,
        dateApproved: formattedApprovalDate,
        email,
        balance: 0.0,
        loans: 0.0,
      });

      // move to approved
      // Also save with approval date inside ApprovedRegistrations
      await database.ref(`Registrations/ApprovedRegistrations/${registrationId}`).set({
        ...registrationData,
        dateApproved: formattedApprovalDate,
        email,
      });
      // Remove the approved registration from the database
      // await database.ref(`Registrations/${id}`).remove();

      // Update the state to reflect the removal of the registration
      setRegistrations((prev) => prev.filter((item) => item.id !== id));

      // Close the "More Details" modal if it's open
      setModalVisible(false);

      // Show success message after removing the data
      setSuccessMessage('Registration Application has been Approved.');
      setSuccessMessageModalVisible(true); // Trigger success modal to show

      const approveRegistrationApplication = {
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
        email,
      };

      // Send data to backend API for approval and email notification
      const response = await ApproveRegistration(approveRegistrationApplication);
      if (response.error) {
        throw new Error(response.error); // Handle API error if present
      }

    } catch (error) {
      console.error('Error approving registration:', error);
      handleError(error); // Ensure this function properly handles and logs errors
    }
  };

  const handleReject = async (registrationId) => {
    try {
      const registrationData = registrations.find((item) => item.id === registrationId);
      if (registrationData) {

        const rejectionDate = new Date();
        const options = {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        };
        const formattedRejectionDate = rejectionDate.toLocaleString('en-US', options);

       // Save with rejection date included
       await database.ref(`Registrations/RejectedRegistrations/${registrationId}`).set({
        ...registrationData,
        dateRejected: formattedRejectionDate,
      });

        // Remove the registration from the original list
        // await database.ref(`Registrations/${registrationId}`).remove();
        // Update state to remove the registration from the list
        setRegistrations((prev) => prev.filter((item) => item.id !== registrationId));

        // Prepare data for backend rejection notification
        const rejectRegistrationApplication = {
          firstName: registrationData.firstName,
          lastName: registrationData.lastName,
          email: registrationData.email,
          dateRejected: formattedRejectionDate,
        };

        // Close the "More Details" modal if it's open
        setModalVisible(false);

        // Set the success message and show the modal immediately
        setSuccessMessage('Registration Application has been Rejected.');
        setSuccessMessageModalVisible(true); // Trigger success modal to show

        // Send data to backend API for rejection and email notification
        const response = await RejectRegistration(rejectRegistrationApplication);
        if (response.error) {
          throw new Error(response.error); // Handle API error if present
        }
      }
    } catch (error) {
      console.error('Error rejecting registration:', error);
      handleError(error);
    }
  };

  // Show loading spinner while data is being fetched
  if (loading) {
    return <ActivityIndicator size="large" color="#001F3F" />;
  }

  // Prepare table data
  const tableHead = ['Email', 'Contact Number', 'First Name', 'Middle Name', 'Last Name', 'More'];
  // Filter deposits based on search query
  const filteredRegistrations = registrations.filter(item =>
    (item.firstName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (item.lastName?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );
  // Pagination logic
  const paginatedData = filteredRegistrations.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const totalPages = Math.ceil(filteredRegistrations.length / pageSize);

  const tableData = paginatedData.map((item) => [
    item.email,
    item.phoneNumber,
    item.firstName,
    item.middleName,
    item.lastName,
    <TouchableOpacity
      style={styles.moreButton}
      onPress={() => openModal(item)} // Ensure this opens the modal correctly
    >
      <Text style={styles.moreButtonText}>•••</Text>
    </TouchableOpacity>,
  ]);

  return (
    <View style={styles.container}>
    <View style={styles.searchContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <TouchableOpacity style={styles.searchIconContainer}>
        <MaterialIcons name="search" size={30} color="#000000" />
      </TouchableOpacity>
    </View>

      {filteredRegistrations.length === 0 ? (
        <Text style={styles.noDataMessage}>
          No registration applications available.
        </Text>
      ) : (
        <>
         <View style={styles.tableContainer}>
            <Table>
              <Row data={tableHead} style={styles.tableHeader} textStyle={styles.tableHeaderText} />
              {tableData.map((rowData, index) => (
                <Row key={index} data={rowData} style={styles.row} textStyle={styles.rowText} />
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

<Modal visible={modalVisible} animationType="slide" transparent={true}>
  <View style={styles.modalView}>
    <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
      <MaterialIcons name="close" size={30} color="black" />
    </TouchableOpacity>
    {selectedRegistration && (
      <View style={styles.modalContent}>
        <View style={styles.detailsSection}>
        <Text style={styles.modalTitle}>More Details</Text>
          <Text style={styles.modalText}>Email: {selectedRegistration.email}</Text>
          <Text style={styles.modalText}>Contact Number: {selectedRegistration.phoneNumber}</Text>
          <Text style={styles.modalText}>First Name: {selectedRegistration.firstName}</Text>
          <Text style={styles.modalText}>Middle Name: {selectedRegistration.middleName}</Text>
          <Text style={styles.modalText}>Last Name: {selectedRegistration.lastName}</Text>
          <Text style={styles.modalText}>Age: {selectedRegistration.age}</Text>
          <Text style={styles.modalText}>Date of Birth: {selectedRegistration.dateOfBirth}</Text>
          <Text style={styles.modalText}>Place of Birth: {selectedRegistration.placeOfBirth}</Text>
          <Text style={styles.modalText}>Current Address: {selectedRegistration.address}</Text>
        </View>
        <View style={styles.imagesSection}>
          <Text style={styles.modalTitle}>Images</Text>
          <TouchableOpacity onPress={() => openImageModal(selectedRegistration.validIdFrontUrl)}>
            <Text style={styles.imageLabel}>Valid ID Front</Text>
            <Image source={{ uri: selectedRegistration.validIdFrontUrl }} style={styles.imageThumbnail} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => openImageModal(selectedRegistration.validIdBackUrl)}>
            <Text style={styles.imageLabel}>Valid ID Back</Text>
            <Image source={{ uri: selectedRegistration.validIdBackUrl }} style={styles.imageThumbnail} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => openImageModal(selectedRegistration.selfieUrl)}>
            <Text style={styles.imageLabel}>Selfie</Text>
            <Image source={{ uri: selectedRegistration.selfieUrl }} style={styles.imageThumbnail} />
          </TouchableOpacity>
        </View>
      </View>
    )}
    {selectedRegistration && (
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={() => handleAction(selectedRegistration, 'approve')}
          style={[styles.actionButton, styles.approveButton]} // Use approveButton style
        >
          <Text style={styles.buttonText}>Approve</Text>
        </TouchableOpacity>

        <View style={styles.buttonSpacer} /> {/* Space between buttons */}

        <TouchableOpacity
          onPress={() => handleAction(selectedRegistration, 'reject')}
          style={[styles.actionButton, styles.rejectButton]} // Use rejectButton style
        >
          <Text style={styles.buttonText}>Reject</Text>
        </TouchableOpacity>
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

{/* Confirmation Modal */}
<Modal visible={confirmModalVisible} transparent animationType="fade">
  <View style={styles.confirmModalBackdrop}>
    <View style={styles.confirmModalView}>
      <Text style={styles.confirmationText}>
        Are you sure you want to {currentAction} this REGISTRATION APPLICATION?
      </Text>
      <View style={styles.confirmationButtons}>
        <TouchableOpacity
          style={[styles.modalButton, { backgroundColor: '#4CAF50' }]}
          onPress={confirmAction}
        >
          <Text style={styles.buttonText}>Yes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modalButton, { backgroundColor: '#8E0B16' }]}
          onPress={() => setConfirmModalVisible(false)}
        >
          <Text style={styles.buttonText}>No</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>

{/* Success Message Modal */}
<Modal visible={successMessageModalVisible} transparent animationType="fade">
  <View style={styles.successModalBackdrop}>
    <View style={styles.successModalView}>
      <Text style={styles.successMessageText}>{successMessage}</Text>
      <TouchableOpacity
        style={[styles.modalButton, { backgroundColor: '#4CAF50' }]}
        onPress={() => setSuccessMessageModalVisible(false)}
      >
        <Text style={styles.buttonText}>OK</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Table Container
  tableContainer: {
    marginRight: 10,
    marginTop: 20,
    marginLeft: 25,
    marginRight: 25,
    borderRadius: 10, // Rounded corners for the table container
    overflow: 'hidden',
  },
  // Table Header
  tableHeader: { 
    height: 50, 
    backgroundColor: '#2D5783',
  },
  tableHeaderText: { 
    textAlign: 'center', 
    color: '#ffffff',
  },
  // Table Row
  row: { 
    height: 50, 
    backgroundColor: '#EEEEEE',
  },
  rowText: { 
    textAlign: 'center',
  },

  // Modal View
  modalView: {
    width: '40%',
    maxWidth: 700,
    flex: 0.6,
    backgroundColor: '#FFFFFF',
    margin: 0,
    padding: 20,
    borderRadius: 10,
    position: 'absolute',
    top: '50%',
    left: '55%',
    transform: [{ translateX: -300 }, { translateY: -300 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1, 
  },
  modalTitle: {
    fontSize: 22, // Increase font size for the title
    fontWeight: 'bold', // Make title bold
    marginBottom: 20, // Add space below the title
    color: '#333', // Darker color for better contrast
  },
  modalText: {
    fontSize: 16, // Smaller text for the content
    marginBottom: 5, // Space between lines
    color: '#555', // Lighter color for content
  },
  modalContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,  // Add padding for better spacing
  },
  detailsSection: {
    flex: 1, // Take up equal space with the imagesSection
    marginStart: 10,
  },
  imagesSection: {
    flex: 1, // Take up equal space with the detailsSection
    marginStart: 10,
 
  },
  imageLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  imageThumbnail: {
    width: 100,
    height: 100,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    width: '100%',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
  },
  rejectButton: {
    backgroundColor: '#f44336',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  buttonSpacer: {
    width: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1, 
  },
  // Image
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  imageThumbnail: {
    width: 100,
    height: 100,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },

  // Action Buttons
  actionButton: {
    backgroundColor: '#6a8f5f',
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
  },
  actionButtonText: {
    color: '#fff',
    textAlign: 'center',
  },

  // Confirmation Modal
  confirmationText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    margin: 5,
  },
  confirmButtonText: {
    color: 'white',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#f44336',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    margin: 5,
  },
  cancelButtonText: {
    color: 'white',
    textAlign: 'center',
  },

  // Modal Content
  modalContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
    fontSize: 20,
  },

  // Button Styles
  button: {
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },

  // Success Modal
  successMessageText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  successCloseButton: {
    backgroundColor: '#6a8f5f',
    padding: 10,
    borderRadius: 5,
  },
  successCloseButtonText: {
    color: '#fff',
    textAlign: 'center',
  },

  // More Button
  moreButton: {
    backgroundColor: "#5A8DB8",
    padding: 5,
    borderRadius: 10,
    marginHorizontal: 5,
    width: 60,
    alignItems: 'center',
    alignSelf: 'center',
  },
  moreButtonText: {
    color: '#fff',
    textAlign: 'center',
  },

  // Confirmation Modal Styles
  confirmModalView: {
    top: '100%',
    left: '40%', // Position it in the middle horizontally
    width: '30%', // Adjust the width as needed
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  modalButton: {
    padding: 10,
    borderRadius: 5,
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Success Modal View
  successModalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  // Image Modal View
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

  // Pagination
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    marginRight: 20,
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
  },
  disabledButton: {
    backgroundColor: '#C1C0B8',
  },
  paginationText: {
    fontWeight: 'bold',
    color: '#fff',
  },

  // No Data Message
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

  // Modal Content Adjustments
  modalImageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Aligns images to the right side
    marginLeft: 20, // Adds some space between text and images
  },
  modalDetailsContainer: {
    flexDirection: 'column',
    flex: 1, // Ensures text content takes the available space
    justifyContent: 'center',
    padding: 10,
  },

  // Approve and Reject Buttons
  buttonContainer: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 20, 
    width: '100%',
  },
  approveButton: {
    backgroundColor: '#008000',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
  },
  rejectButton: {
    backgroundColor: '#FF0000',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
  },
});


export default Registrations;