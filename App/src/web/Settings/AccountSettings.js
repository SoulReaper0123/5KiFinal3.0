import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TextInput, Button, Modal, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase, ref, get, update } from 'firebase/database';

const AccountSettings = () => {
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState({ name: '', email: '', contactNumber: '' });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const adminId = await AsyncStorage.getItem('adminId');
        if (!adminId) {
          throw new Error('No admin ID found in local storage.');
        }

        const db = getDatabase();
        const adminRef = ref(db, `Users/Admin/${adminId}`);
        const snapshot = await get(adminRef);

        if (snapshot.exists()) {
          setAdminData(snapshot.val());
          setEditableData(snapshot.val()); // Initialize editable data
        } else {
          throw new Error('Admin data not found.');
        }
      } catch (error) {
        console.error('Error fetching admin data:', error.message);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const handleEditChange = (field, value) => {
    setEditableData(prevState => ({
      ...prevState,
      [field]: value,
    }));
  };

  const handleSaveChanges = async () => {
    try {
      const adminId = await AsyncStorage.getItem('adminId');
      if (!adminId) {
        throw new Error('No admin ID found in local storage.');
      }

      const db = getDatabase();
      const adminRef = ref(db, `Users/Admin/${adminId}`);

      await update(adminRef, editableData); // Update data in Firebase
      setAdminData(editableData); // Update state with new data
      setIsEditing(false); // Exit edit mode
      setShowModal(false); // Close modal
    } catch (error) {
      console.error('Error saving changes:', error.message);
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} />;
  }

  if (error) {
    return <Text style={styles.errorText}>Error: {error}</Text>;
  }

  if (!adminData) {
    return <Text style={styles.errorText}>Failed to load admin data.</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Account Settings</Text>

      <View style={styles.card}>
        <Text style={styles.title}>Name:</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={editableData.name}
            onChangeText={value => handleEditChange('name', value)}
          />
        ) : (
          <Text>{adminData.name}</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Email:</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={editableData.email}
            onChangeText={value => handleEditChange('email', value)}
          />
        ) : (
          <Text>{adminData.email}</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Role:</Text>
        <Text>{adminData.role}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Contact Number:</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={editableData.contactNumber}
            onChangeText={value => handleEditChange('contactNumber', value)}
          />
        ) : (
          <Text>{adminData.contactNumber}</Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        {isEditing ? (
          <TouchableOpacity style={styles.saveBtn} onPress={() => setShowModal(true)}>
            <Text style={styles.btnText}>Save Changes</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
            <Text style={styles.btnText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Confirmation Modal */}
      <Modal transparent={true} visible={showModal} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Are you sure you want to save these changes?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowModal(false)}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnConfirm} onPress={handleSaveChanges}>
                <Text style={styles.modalBtnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    marginBottom: 15,
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#ccc',
  },
  title: {
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
  },
  buttonContainer: {
    marginTop: 20,
  },
  editBtn: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveBtn: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalBtnCancel: {
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  modalBtnConfirm: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default AccountSettings;
