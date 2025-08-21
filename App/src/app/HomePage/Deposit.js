import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, StyleSheet, 
  TouchableOpacity, Alert, ScrollView, Image, 
  ActivityIndicator, Modal, BackHandler 
} from 'react-native';
import CustomModal from '../../components/CustomModal';
import CustomConfirmModal from '../../components/CustomConfirmModal';
import ImagePickerModal from '../../components/ImagePickerModal';
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
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('error');
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [pendingDepositData, setPendingDepositData] = useState(null);

  useEffect(() => {
    const initializeUserData = async () => {
      try {
        const user = auth.currentUser;
        const userEmail = user ? user.email : route.params?.user?.email;
        
        if (userEmail) {
          setEmail(userEmail);
          
          // If user data is passed via navigation (from fingerprint auth), use it
          if (route.params?.user) {
            const userData = route.params.user;
            setMemberId(userData.memberId || '');
            setFirstName(userData.firstName || '');
            setBalance(userData.balance || 0);
            // Still fetch fresh data from database for consistency
            await fetchUserData(userEmail);
          } else {
            // Fallback to database lookup
            await fetchUserData(userEmail);
          }
        } else {
          setAlertMessage('Unable to identify user. Please log in again.');
          setAlertType('error');
          setAlertModalVisible(true);
        }
      } catch (error) {
        console.error('Error initializing user data:', error);
        setAlertMessage('Error loading user information.');
        setAlertType('error');
        setAlertModalVisible(true);
      }
    };

    initializeUserData();
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
          setAlertMessage('User not found');
          setAlertType('error');
          setAlertModalVisible(true);
        }
      } else {
        setAlertMessage('No members found');
        setAlertType('error');
        setAlertModalVisible(true);
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

  const handleSelectProofOfDeposit = () => {
    setShowImageOptions(true);
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
      setAlertMessage('All fields are required');
      setAlertType('error');
      setAlertModalVisible(true);
      return;
    }

    if (isNaN(amountToBeDeposited) || parseFloat(amountToBeDeposited) <= 0) {
      setAlertMessage('Please enter a valid amount');
      setAlertType('error');
      setAlertModalVisible(true);
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

      // Prepare data for API call to run when user clicks OK
      const depositData = {
        email,
        accountName,
        firstName,
        lastName,
        depositOption,
        accountNumber,
        amountToBeDeposited: parseFloat(amountToBeDeposited), // Keep original field name
        proofOfDepositUrl,
        transactionId,
        date: new Date().toISOString(), // Added date field
      };

      // Store deposit data to be used when user clicks OK
      setPendingDepositData(depositData);

      // Show success modal
      setAlertMessage('Your deposit request has been submitted successfully. It will be processed shortly.');
      setAlertType('success');
      setAlertModalVisible(true);
      
    } catch (error) {
      console.error('Error during deposit submission:', error);
      
      // Handle different types of errors
      if (error.code && error.code.startsWith('storage/')) {
        // Firebase Storage errors are already handled in uploadImageToFirebase
        setAlertMessage(errorMessage || 'Failed to upload image');
        setAlertType('error');
        setAlertModalVisible(true);
      } else {
        // Generic errors
        setAlertMessage('An unexpected error occurred. Please try again later.');
        setAlertType('error');
        setAlertModalVisible(true);
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
    setPendingDepositData(null);
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

        <Text style={styles.label}>
          Deposit Amount <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          placeholder="Enter Amount"
          value={amountToBeDeposited}
          onChangeText={setAmountToBeDeposited}
          style={styles.input}
          keyboardType="numeric"
        />

        <Text style={styles.label}>
          Proof of Deposit <Text style={styles.required}>*</Text>
        </Text>
        <TouchableOpacity onPress={handleSelectProofOfDeposit} style={styles.imagePreviewContainer}>
          {proofOfDeposit ? (
            <Image source={{ uri: proofOfDeposit }} style={styles.imagePreview} />
          ) : (
            <View style={styles.uploadPlaceholder}>
              <MaterialIcons name="photo" size={100} color="#ccc" />
              <Text style={styles.uploadPromptText}>Tap To Upload</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>

      {/* Image Picker Modal */}
      <ImagePickerModal
        visible={showImageOptions}
        onClose={() => setShowImageOptions(false)}
        onImageSelected={(imageUri) => {
          setProofOfDeposit(imageUri);
        }}
        title="Select Proof of Deposit"
        showCropOptions={true}
      />



      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#4FE7AF" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        </View>
      )}

      {/* Custom Confirmation Modal */}
      <CustomConfirmModal
        visible={confirmModalVisible}
        onClose={() => setConfirmModalVisible(false)}
        title="Confirm Deposit"
        message={`Are you sure you want to submit this deposit request for ${formatCurrency(amountToBeDeposited)}?`}
        type="info"
        cancelText="Cancel"
        confirmText="Confirm"
        onCancel={() => setConfirmModalVisible(false)}
        onConfirm={() => {
          setConfirmModalVisible(false);
          submitDeposit();
        }}
      />

      {/* Custom Alert Modal */}
      <CustomModal
        visible={alertModalVisible}
        onClose={() => {
          setAlertModalVisible(false);
          if (alertType === 'success' && pendingDepositData) {
            // Navigate immediately and run API in background
            resetFormFields();
            navigation.navigate('Home');
            
            // Run API call in background after navigation
            setTimeout(async () => {
              try {
                await MemberDeposit(pendingDepositData);
                console.log('Deposit API call completed successfully in background');
              } catch (apiError) {
                console.error('Background API call failed:', apiError);
                // API failure doesn't affect user experience since data is already in database
              }
              // Clear pending data
              setPendingDepositData(null);
            }, 100);
          } else if (alertType === 'success') {
            // Fallback for success without pending data
            resetFormFields();
            navigation.navigate('Home');
          }
        }}
        message={alertMessage}
        type={alertType}
        buttonText="OK"
      />
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
  required: {
    color: 'red',
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
    backgroundColor: '#f5f5f5',
  },
  uploadPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadPromptText: {
    color: '#2D5783',
    fontWeight: 'bold',
    marginTop: 10,
    fontSize: 16,
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
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 30,
    alignItems: 'center',
    marginTop: 20,
    width: '50%',
    alignSelf: 'center',
  },
  submitButtonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 18,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingBox: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
    color: '#2D5783',
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
  modalBackground: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  optionsModal: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
  },
  optionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#2D5783',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  fullWidthOption: {
    flex: 1,
    marginHorizontal: 0,
  },
  optionText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#2D5783',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cropButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    width: '100%',
  },
  cropButton: {
    backgroundColor: '#2D5783',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  useAsIsButton: {
    backgroundColor: '#4FE7AF',
  },
  cropButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Deposit;