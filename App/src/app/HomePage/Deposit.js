import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, StyleSheet, 
  TouchableOpacity, Alert, ScrollView, Image, 
  ActivityIndicator, Modal, BackHandler 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import ModalSelector from 'react-native-modal-selector';
import * as ImagePicker from 'expo-image-picker';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref as dbRef, get, set } from 'firebase/database';
import { storage, database, auth } from '../../firebaseConfig';
import { MemberDeposit } from '../../api';

const Deposit = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const [depositOption, setDepositOption] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [amountToBeDeposited, setAmountToBeDeposited] = useState('');
  const [proofOfDeposit, setProofOfDeposit] = useState(null);
  const [email, setEmail] = useState('');
  const [balance, setBalance] = useState(0);
  const [memberId, setMemberId] = useState('');
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [depositAccounts, setDepositAccounts] = useState({
    Bank: { accountName: '', accountNumber: '' },
    GCash: { accountName: '', accountNumber: '' }
  });

  useEffect(() => {
    const user = auth.currentUser;
    const userEmail = user ? user.email : route.params?.user?.email;
    if (userEmail) {
      setEmail(userEmail);
      fetchUserData(userEmail);
    }
    fetchDepositSettings();
  }, [route.params]);

  useEffect(() => {
    const handleBackPress = () => {
      navigation.navigate('Home');
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
  
    return () => backHandler.remove(); 
  }, [navigation]);

  const fetchDepositSettings = async () => {
    try {
      const settingsRef = dbRef(database, 'Settings/Accounts');
      const snapshot = await get(settingsRef);
      if (snapshot.exists()) {
        setDepositAccounts(snapshot.val());
      } else {
        // Fallback to old path if Accounts doesn't exist
        const oldSettingsRef = dbRef(database, 'Settings/DepositAccounts');
        const oldSnapshot = await get(oldSettingsRef);
        if (oldSnapshot.exists()) {
          setDepositAccounts(oldSnapshot.val());
        }
      }
    } catch (error) {
      console.error('Error fetching deposit settings:', error);
    }
  };

  const fetchUserData = async (userEmail) => {
    const membersRef = dbRef(database, 'Members');
    try {
      const snapshot = await get(membersRef);
      if (snapshot.exists()) {
        const members = snapshot.val();
        const foundUser = Object.values(members).find(member => member.email === userEmail);
        if (foundUser) {
          setBalance(foundUser.balance || 0);
          setMemberId(foundUser.id);
          setFirstName(foundUser.firstName || ''); 
          setLastName(foundUser.lastName || '');  
        } else {
          Alert.alert('Error', 'User not found');
        }
      } else {
        Alert.alert('Error', 'No members found');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const depositOptions = [
    { key: 'Bank', label: 'Bank' },
    { key: 'GCash', label: 'GCash' },
  ];

  const handleDepositOptionChange = (option) => {
    setDepositOption(option.key);
    const selectedAccount = depositAccounts[option.key];
    setAccountNumber(selectedAccount.accountNumber || '');
    setAccountName(selectedAccount.accountName || '');
  };

  const handleSelectProofOfDeposit = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setProofOfDeposit(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting proof of deposit:', error);
      Alert.alert('Error', 'Failed to select proof of deposit');
    }
  };

  const uploadImageToFirebase = async (uri, folder) => {
    try {
      // Create a unique filename with timestamp and user ID to avoid collisions
      const timestamp = new Date().getTime();
      const uniqueFilename = `${memberId}_${timestamp}_${Math.floor(Math.random() * 1000)}`;
      const fileExtension = uri.split('.').pop() || 'jpeg';
      const filename = `${uniqueFilename}.${fileExtension}`;
      
      // Use a user-specific folder path to improve security
      const userFolder = `users/${memberId}/${folder}`;
      const imageRef = storageRef(storage, `${userFolder}/${filename}`);
      
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Upload the image
      await uploadBytes(imageRef, blob);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(imageRef);
      return downloadURL;
    } catch (error) {
      console.error('Image upload failed:', error);
      
      // Provide more specific error messages based on the error type
      if (error.code === 'storage/unauthorized') {
        setErrorMessage('Permission denied: You do not have permission to upload images. Please contact support.');
      } else if (error.code === 'storage/canceled') {
        setErrorMessage('Upload was canceled');
      } else if (error.code === 'storage/unknown') {
        setErrorMessage('An unknown error occurred during upload');
      } else {
        setErrorMessage('Failed to upload image: ' + error.message);
      }
      
      throw error;
    }
  };

  const storeDepositDataInDatabase = async (proofOfDepositUrl, transactionId = null) => {
    try {
      // Use provided transaction ID or generate a new one
      const txnId = transactionId || generateTransactionId();
      
      // Create a reference to the deposit application in the database
      const newDepositRef = dbRef(database, `Deposits/DepositApplications/${memberId}/${txnId}`);
  
      // Parse the deposit amount
      const depositAmount = parseFloat(amountToBeDeposited);
  
      // Format the current date
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      
      // Create the deposit data object
      const depositData = {
        transactionId: txnId,
        id: memberId,
        email,
        firstName,
        lastName,
        accountName: accountName,
        depositOption,
        accountNumber,
        amountToBeDeposited: depositAmount,
        proofOfDepositUrl,
        dateApplied: formattedDate,
        timestamp: currentDate.getTime(), // Add timestamp for easier sorting
        status: 'pending',
      };
      
      // Store the data in the database
      await set(newDepositRef, depositData);
      
      // Return the transaction ID in case it was generated here
      return txnId;
    } catch (error) {
      console.error('Failed to store deposit data in Realtime Database:', error);
      
      // Set error message for the modal
      setErrorMessage('Failed to store deposit data: ' + (error.message || 'Unknown error'));
      
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!depositOption || !amountToBeDeposited || !proofOfDeposit) {
      setErrorMessage('All fields are required');
      setErrorModalVisible(true);
      return;
    }

    if (isNaN(amountToBeDeposited) || parseFloat(amountToBeDeposited) <= 0) {
      setErrorMessage('Please enter a valid amount');
      setErrorModalVisible(true);
      return;
    }

    // Show confirmation modal
    setConfirmModalVisible(true);
  };
  
  const submitDeposit = async () => {
    setLoading(true);
    setConfirmModalVisible(false);
    
    try {
      // Generate a single transaction ID to use for both database entries
      const transactionId = generateTransactionId();
      
      // Use 'deposit_proofs' instead of 'proofsOfDeposit' for better naming consistency
      const proofOfDepositUrl = await uploadImageToFirebase(proofOfDeposit, 'deposit_proofs');
      
      // Store in Firebase Realtime Database with the transaction ID
      await storeDepositDataInDatabase(proofOfDepositUrl, transactionId);

      // Prepare data for API call
      const depositData = {
        email,
        accountName,
        firstName,
        lastName,
        depositOption,
        accountNumber,
        amountToBeDeposited: parseFloat(amountToBeDeposited),
        proofOfDepositUrl,
        transactionId,
      };

      // Make API call
      await MemberDeposit(depositData);
      
      // Show success modal
      setSuccessModalVisible(true);
    } catch (error) {
      console.error('Error during deposit submission:', error);
      
      // Handle different types of errors
      if (error.code && error.code.startsWith('storage/')) {
        // Firebase Storage errors are already handled in uploadImageToFirebase
        setErrorModalVisible(true);
      } else if (error.response && error.response.data) {
        // API errors
        setErrorMessage(error.response.data.message || 
          'There was an issue processing your deposit. Please try again.');
        setErrorModalVisible(true);
      } else {
        // Generic errors
        setErrorMessage('An unexpected error occurred. Please try again later.');
        setErrorModalVisible(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetFormFields = () => {
    setDepositOption('');
    setAccountNumber('');
    setAccountName('');
    setAmountToBeDeposited('');
    setProofOfDeposit(null);
  };

  const formatCurrency = (amount) => {
    return `₱${parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  const generateTransactionId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={30} color="white" />
      </TouchableOpacity>
      <Text style={styles.title}>Deposit</Text>

      <View style={styles.content}>
        <Text style={styles.label}>Balance</Text>
        <Text style={styles.balanceText}>{formatCurrency(balance)}</Text>

        <Text style={styles.label}>Deposit Option</Text>
        <ModalSelector
          data={depositOptions}
          initValue="Select Deposit Option"
          onChange={handleDepositOptionChange}
          style={styles.picker}
          modalStyle={{ justifyContent: 'flex-end', margin: 0 }}
          overlayStyle={{ justifyContent: 'flex-end' }}
        >
          <TouchableOpacity style={styles.pickerContainer}>
            <Text style={styles.pickerText}>{depositOption || 'Select Deposit Option'}</Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="black" /> 
          </TouchableOpacity>
        </ModalSelector>

        <Text style={styles.label}>Account Name</Text>
        <TextInput 
          value={accountName} 
          style={[styles.input, styles.fixedInput]} 
          editable={false} 
        />

        <Text style={styles.label}>Account Number</Text>
        <TextInput 
          value={accountNumber} 
          style={[styles.input, styles.fixedInput]} 
          editable={false} 
        />

        <Text style={styles.label}>Deposit Amount</Text>
        <TextInput
          placeholder="Enter Amount"
          value={amountToBeDeposited}
          onChangeText={setAmountToBeDeposited}
          style={styles.input}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Proof of Deposit</Text>
        <View style={styles.imagePreviewContainer}>
          {proofOfDeposit ? (
            <Image source={{ uri: proofOfDeposit }} style={styles.imagePreview} />
          ) : (
            <MaterialIcons name="photo" size={100} color="#ccc" />
          )}
        </View>
        <TouchableOpacity onPress={handleSelectProofOfDeposit} style={styles.uploadButton}>
          <Text style={styles.uploadButtonText}>{proofOfDeposit ? 'Change Proof of Deposit' : 'Upload Proof of Deposit'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>

      {/* Loading Modal */}
      <Modal transparent={true} visible={loading}>
        <View style={styles.modalOverlay}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Please wait...</Text>
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <Modal transparent={true} visible={confirmModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Deposit</Text>
            <Text style={styles.modalText}>
              Are you sure you want to submit this deposit request for {formatCurrency(amountToBeDeposited)}?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setConfirmModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={submitDeposit}
              >
                <Text style={styles.modalButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal transparent={true} visible={successModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <MaterialIcons name="check-circle" size={60} color="#4FE7AF" />
            <Text style={styles.modalTitle}>Success!</Text>
            <Text style={styles.modalText}>
              Your deposit request has been submitted successfully. It will be processed shortly.
            </Text>
            <TouchableOpacity 
              style={[styles.modalButton, styles.confirmButton, {width: '100%'}]} 
              onPress={() => {
                setSuccessModalVisible(false);
                resetFormFields();
                navigation.navigate('Home');
              }}
            >
              <Text style={styles.modalButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal transparent={true} visible={errorModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <MaterialIcons name="error" size={60} color="#FF6B6B" />
            <Text style={styles.modalTitle}>Error</Text>
            <Text style={styles.modalText}>{errorMessage}</Text>
            <TouchableOpacity 
              style={[styles.modalButton, styles.confirmButton, {width: '100%', backgroundColor: '#FF6B6B'}]} 
              onPress={() => setErrorModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#2D5783',
  },
  backButton: {
    marginTop: 40,
    marginStart: 20,
  },
  content: {
    backgroundColor: 'white',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    flex: 1,
    paddingStart: 40,
    paddingEnd: 40,
    paddingTop: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: 'white',
  },
  label: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 5,
  },
  balanceText: {
    fontSize: 30,
    marginBottom: 15,
    textAlign: 'center',
    color: '#008000',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  fixedInput: {
    backgroundColor: 'white',
    color: 'black',
  },
  picker: {
    marginBottom: 10,
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderColor: '#ccc',
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
  },
  pickerText: {
    fontSize: 14,
    color: 'grey',
  },
  imagePreviewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    height: 150,
    marginBottom: 15,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  uploadButton: {
    backgroundColor: '#001F3F',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  uploadButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#4FE7AF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  loadingText: {
    marginTop: 10,
    color: 'white',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 10,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  confirmButton: {
    backgroundColor: '#4FE7AF',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Deposit;