import React, { useState, useEffect } from 'react';
import {
  View, TextInput, TouchableOpacity, Alert, Modal, ScrollView,
  Text, StyleSheet, ActivityIndicator
} from 'react-native';
import { getDatabase, ref, set, onValue, remove } from 'firebase/database';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { Table, Row, Rows } from 'react-native-table-component';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const Admins = () => {
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const db = getDatabase();
    const adminRef = ref(db, 'Users/Admin');
    const unsubscribe = onValue(adminRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const adminList = Object.entries(data).map(([id, adminData]) => ({
          id,
          ...adminData
        }));
        setAdmins(adminList);
      } else {
        setAdmins([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const generateRandomPassword = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    
    // Ensure the password is exactly 6 characters long
    for (let i = 0; i < 6; i++) {
      password += characters.charAt(Math.floor(Math.random() * characters.length));
    }
  
    // Check if the password has at least one lowercase, one uppercase, and one digit
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
  
    // If not, regenerate the password
    if (!(hasUppercase && hasLowercase && hasDigit)) {
      return generateRandomPassword();
    }
  
    return password;
  };
  
  const handleAddAdmin = async () => {
    if (!email || !firstName || !middleName || !lastName || !contactNumber) {
      Alert.alert('Error', 'Please fill in all the fields.');
      return;
    }
  
    if (!/^\d+$/.test(contactNumber)) {
      Alert.alert('Error', 'Contact number must be numeric.');
      return;
    }
  
    const auth = getAuth();
    const generatedPassword = generateRandomPassword();  // Generate a password that meets the criteria
    setAddingAdmin(true);
  
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, generatedPassword);
      const uid = userCredential.user.uid;
  
      const db = getDatabase();
      const highestAdminID = admins.length > 0
        ? Math.max(...admins.map(admin => parseInt(admin.id.replace('admin', '')) || 0))
        : 0;
      const newAdminID = 'admin' + (highestAdminID + 1);
      const dateAdded = new Date().toLocaleString();
  
      const adminRef = ref(db, 'Users/Admin/' + newAdminID);
  
      // Combine names when storing
      const fullName = `${firstName} ${middleName} ${lastName}`;
  
      await set(adminRef, {
        email,
        id: newAdminID,
        uid,
        name: fullName,
        role: 'admin',
        dateAdded,
        contactNumber,
        password: generatedPassword  // Save the generated password
      });
  
      Alert.alert('Success', 'Admin added successfully!');
      setFirstName('');
      setMiddleName('');
      setLastName('');
      setEmail('');
      setContactNumber('');
      setModalVisible(false);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Error', 'The email is already in use. Please use a different email.');
      } else {
        Alert.alert('Error', error.message);
      }
    } finally {
      setAddingAdmin(false);
    }
  };  

  const confirmDeleteAdmin = (adminID) => {
    setAdminToDelete(adminID);
    setShowConfirmDeleteModal(true);
  };

  const handleDeleteAdmin = () => {
    const db = getDatabase();
    const adminRef = ref(db, 'Users/Admin/' + adminToDelete);

    remove(adminRef)
      .then(() => {
        setAdmins(prev => prev.filter(admin => admin.id !== adminToDelete));
        setSuccessMessage('Admin deleted successfully.');
        setShowSuccessModal(true);
      })
      .catch((error) => Alert.alert('Error', error.message))
      .finally(() => setShowConfirmDeleteModal(false));
  };

  const tableHead = ['Admin ID', 'Name', 'Email', 'Contact Number', 'Action'];

  const filteredAdmins = admins.filter(item =>
    item.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tableData = filteredAdmins.map(item => [
    item.id,
    item.name,
    item.email,
    item.contactNumber,
    <TouchableOpacity
      key={item.id}
      style={[styles.button, { backgroundColor: '#8E0B16' }]}
      onPress={() => confirmDeleteAdmin(item.id)}
    >
      <Text style={styles.buttonText}>Delete</Text>
    </TouchableOpacity>
  ]);

  return (
    <View style={{ padding: 40 }}>
      <Text style={{ fontSize: 30, fontWeight: 'bold', marginBottom: 20 }}>Admins</Text>

      <View style={styles.topContainer}>
        <TouchableOpacity style={styles.addAdminButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addAdminButtonText}>Create New Admin</Text>
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.searchIconContainer}>
            <MaterialIcons name="search" size={24} color="#001F3F" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Add Admin Modal */}
      <Modal animationType="slide" transparent visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>New Admin</Text>
            <ScrollView contentContainerStyle={styles.formContainer}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter Email"
                  style={styles.formInput}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>First Name</Text>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Enter First Name"
                  style={styles.formInput}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Middle Name</Text>
                <TextInput
                  value={middleName}
                  onChangeText={setMiddleName}
                  placeholder="Enter Middle Name"
                  style={styles.formInput}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Last Name</Text>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Enter Last Name"
                  style={styles.formInput}
                />
              </View>

              <Text style={styles.formLabel}>Contact Number</Text>
              <TextInput
                  value={contactNumber}
                  onChangeText={(text) => {
                    // Allow only numbers and limit to 11 digits
                    if (/^\d{0,11}$/.test(text)) {
                      setContactNumber(text);
                    }
                  }}
                  placeholder="Enter Contact Number"
                  style={styles.formInput}
                  keyboardType="numeric"
                  maxLength={11} // Enforces the 11 digit limit
                />

              {addingAdmin ? (
                <ActivityIndicator size="large" color="#001F3F" />
              ) : (
                <View style={styles.buttonGroup}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.submitButton} onPress={handleAddAdmin}>
                    <Text style={styles.submitButtonText}>Add Admin</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Admins Table */}
      {loading ? (
        <ActivityIndicator size="large" color="#001F3F" style={{ marginTop: 20 }} />
      ) : filteredAdmins.length === 0 ? (
        <Text style={styles.noDataMessage}>No admins. Click "Add Admin" to add.</Text>
      ) : (
        <Table style={styles.tableContainer}>
          <Row data={tableHead} style={styles.tableHead} textStyle={styles.tableHeaderText} />
          <Rows data={tableData} style={styles.tableData} textStyle={styles.tableDataText} />
        </Table>
      )}

      {/* Confirm Delete Modal */}
      {showConfirmDeleteModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.confirmDeleteModal}>
            <Text style={styles.modalTitle}>Are you sure you want to delete this admin?</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowConfirmDeleteModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleDeleteAdmin}>
                <Text style={styles.submitButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.confirmDeleteModal}>
            <Text style={styles.successMessage}>{successMessage}</Text>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.submitButtonText}>Okay</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  topContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  addAdminButton: {
    backgroundColor: '#008000',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20
  },
  addAdminButtonText: {
    color: 'white',
    fontSize: 16
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  searchInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginRight: 10,
    width: 160
  },
  searchIconContainer: {
    padding: 4
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    backgroundColor: '#D9D9D9',
    width: '40%',
    height: '80%',
    borderRadius: 10,
    padding: 20
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center'
  },
  formContainer: {
    paddingBottom: 20
  },
  formGroup: {
    marginBottom: 15
  },
  formLabel: {
    fontWeight: 'bold',
    marginBottom: 5
  },
  formInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 10,
    borderRadius: 6
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 25
  },
  cancelButton: {
    backgroundColor: '#ddd',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold'
  },
  submitButton: {
    backgroundColor: '#001F3F',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  tableContainer: {
    marginTop: 10,
    borderRadius: 10,
    overflow: 'hidden',
    minWidth: 700,
    width: '100%',
  },
  tableHead: {
    height: 50,
    backgroundColor: '#2D5783',
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    alignItems: 'center',
  },
  tableHeaderText: {
    textAlign: 'center',  
    fontSize: 14,        
    color: 'white',       
    padding: 10,         
  },
  tableData: {
    textAlign: 'center',  
    backgroundColor: '#EEEEEE',
    fontSize: 14,        
    color: 'white',       
    padding: 10,         
  },
  tableDataText: {
    textAlign: 'center',  
    fontSize: 14,        
    color: 'black',       
    padding: 10,         
  },
  button: {
    backgroundColor: '#8E0B16',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'center'
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12
  },
  centeredModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)'
  },
  confirmBox: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 10,
    alignItems: 'center'
  },
  modalMessage: {
    fontSize: 16,
    marginVertical: 10,
    textAlign: 'center'
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 20
  },
  yesButton: {
    backgroundColor: '#8E0B16',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    marginRight: 10
  },
  noButton: {
    backgroundColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6
  },
  successBox: {
    width: '75%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center'
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10
  },
  successMessage: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center'
  },
  okButton: {
    backgroundColor: '#001F3F',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8
  },
  noDataMessage: {
    marginTop: 20,
    textAlign: 'center',
    color: '#666'
  }
});


export default Admins;
