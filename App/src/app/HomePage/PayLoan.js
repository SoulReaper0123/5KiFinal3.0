import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, StyleSheet, 
  TouchableOpacity, Alert, ScrollView, Image, 
  ActivityIndicator, Modal, BackHandler, KeyboardAvoidingView, Platform
} from 'react-native';
import CustomModal from '../../components/CustomModal';
import ImagePickerModal from '../../components/ImagePickerModal';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import ModalSelector from 'react-native-modal-selector';
import * as ImagePicker from 'expo-image-picker';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref as dbRef, set, get } from 'firebase/database';
import { storage, database, auth } from '../../firebaseConfig';
import { MemberPayment } from '../../api';

const PayLoan = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const [paymentOption, setPaymentOption] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [amountToBePaid, setAmountToBePaid] = useState('');
  const [proofOfPayment, setProofOfPayment] = useState(null);
  const [email, setEmail] = useState('');
  const [memberId, setMemberId] = useState('');
  const [balance, setBalance] = useState(0);
  const [interest, setInterest] = useState(0);
  const [interestRate, setInterestRate] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingApiData, setPendingApiData] = useState(null);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [alertType, setAlertType] = useState('error');
  const [paymentAccounts, setPaymentAccounts] = useState({
    Bank: { accountName: '', accountNumber: '' },
    GCash: { accountName: '', accountNumber: '' }
  });

  const paymentOptions = [
    { key: 'Bank', label: 'Bank' },
    { key: 'GCash', label: 'GCash' },
  ];

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
    fetchPaymentSettings();
  }, [route.params]);

  useEffect(() => {
    const handleBackPress = () => {
      navigation.navigate('Home');
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
  
    return () => backHandler.remove(); 
  }, [navigation]);

  useEffect(() => {
    if (memberId) {
      fetchApprovedLoans();
    }
  }, [memberId]);

  const fetchPaymentSettings = async () => {
    try {
      const settingsRef = dbRef(database, 'Settings/Accounts');
      const snapshot = await get(settingsRef);
      if (snapshot.exists()) {
        setPaymentAccounts(snapshot.val());
      } else {
        // Fallback to old path if Accounts doesn't exist
        const oldSettingsRef = dbRef(database, 'Settings/PaymentAccounts');
        const oldSnapshot = await get(oldSettingsRef);
        if (oldSnapshot.exists()) {
          setPaymentAccounts(oldSnapshot.val());
        }
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error);
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
          setEmail(userEmail);
          setMemberId(foundUser.id);
          setFirstName(foundUser.firstName || '');
          setLastName(foundUser.lastName || '');
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchApprovedLoans = async () => {
    const loansRef = dbRef(database, `ApprovedLoans/${memberId}`);
    try {
      const snapshot = await get(loansRef);
      if (snapshot.exists()) {
        const loanData = snapshot.val();
        setInterest(loanData.interest || 0);
        setInterestRate(loanData.interestRate || 0);
      }
    } catch (error) {
      console.error('Error fetching approved loans:', error);
    }
  };

  const handlePaymentOptionChange = (option) => {
    setPaymentOption(option.key);
    const selectedAccount = paymentAccounts[option.key];
    setAccountNumber(selectedAccount.accountNumber || '');
    setAccountName(selectedAccount.accountName || '');
  };

  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);

  useEffect(() => {
    setIsSubmitDisabled(!paymentOption || !amountToBePaid || !proofOfPayment);
  }, [paymentOption, amountToBePaid, proofOfPayment]);

  const handleSelectProofOfPayment = () => {
    setShowImagePicker(true);
  };

  const handleImageSelected = (imageUri) => {
    setProofOfPayment(imageUri);
  };

  const uploadImageToFirebase = async (uri, folder) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = uri.substring(uri.lastIndexOf('/') + 1);
      const imageRef = storageRef(storage, `${folder}/${filename}`);
      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);
      return downloadURL;
    } catch (error) {
      console.error('Image upload failed:', error);
      setErrorMessage('Failed to upload image');
      setErrorModalVisible(true);
      throw error;
    }
  };

  const storePaymentDataInDatabase = async (proofOfPaymentUrl) => {
    const transactionId = generateTransactionId();
    try {
      const paymentRef = dbRef(database, `Payments/PaymentApplications/${memberId}/${transactionId}`);

      await set(paymentRef, {
        transactionId,
        id: memberId,
        email,
        firstName,
        lastName,
        paymentOption,
        interest,
        accountName,
        accountNumber,
        amountToBePaid: parseFloat(amountToBePaid),
        proofOfPaymentUrl,
        dateApplied: new Date().toLocaleString('en-US', {
          month: 'long',
          day: '2-digit',
          year: 'numeric',
        })
        .replace(',', '')
        .replace(/(\d{1,2}):(\d{2})/, (match, h, m) => `${h.padStart(2,'0')}:${m.padStart(2,'0')}`)
        .replace(/(\d{4}) (\d{2}:\d{2})/, '$1 at $2'),
        status: 'Pending',
      });
    } catch (error) {
      console.error('Failed to store payment data in Realtime Database:', error);
      setErrorMessage('Failed to store payment data');
      setErrorModalVisible(true);
      throw error;
    }
  };

  const generateTransactionId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSubmit = async () => {
    if (!paymentOption || !amountToBePaid || !proofOfPayment) {
      setAlertMessage('All fields are required');
      setAlertType('error');
      setAlertModalVisible(true);
      return;
    }

    if (isNaN(amountToBePaid) || parseFloat(amountToBePaid) <= 0) {
      setAlertMessage('Please enter a valid amount');
      setAlertType('error');
      setAlertModalVisible(true);
      return;
    }

    // Show confirmation modal
    setConfirmModalVisible(true);
  };
  
  const submitPayment = async () => {
    setIsLoading(true);
    setConfirmModalVisible(false);
    
    try {
      const proofOfPaymentUrl = await uploadImageToFirebase(proofOfPayment, 'proofsOfPayment');
      await storePaymentDataInDatabase(proofOfPaymentUrl);

      // Prepare payment data for API call to run when user clicks OK
      const paymentData = {
        email,
        firstName,
        lastName,
        amount: parseFloat(amountToBePaid),
        paymentMethod: paymentOption,
        date: new Date().toISOString(),
      };

      // Store payment data to be used when user clicks OK
      setPendingApiData(paymentData);

      // Show success modal
      setAlertMessage('Your loan payment has been submitted successfully. It will be processed shortly.');
      setAlertType('success');
      setAlertModalVisible(true);
    } catch (error) {
      console.error('Error during payment submission:', {
        error: error.message,
        stack: error.stack,
        paymentData: {
          email,
          amount: amountToBePaid,
          paymentOption
        }
      });
      
      setAlertMessage('An unexpected error occurred. Please try again later.');
      setAlertType('error');
      setAlertModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const resetFormFields = () => {
    setPaymentOption('');
    setAccountNumber('');
    setAccountName('');
    setAmountToBePaid('');
    setProofOfPayment(null);
    setPendingApiData(null);
  };

  const formatCurrency = (amount) => {
    return `₱${parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={30} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Pay Loan</Text>
        <View style={styles.content}>
          <Text style={styles.label}>Balance</Text>
          <Text style={styles.balanceText}>{formatCurrency(balance)}</Text>

          <Text style={styles.label}>Payment Option<Text style={styles.required}>*</Text></Text>
          <ModalSelector
            data={paymentOptions}
            initValue="Select Payment Option"
            onChange={handlePaymentOptionChange}
            style={styles.picker}
            modalStyle={{ justifyContent: 'flex-end', margin: 0 }}
            overlayStyle={{ justifyContent: 'flex-end' }}
          >
            <TouchableOpacity style={styles.pickerContainer}>
              <Text style={styles.pickerText}>{paymentOption || 'Select Payment Option'}</Text>
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

          <Text style={styles.label}>Amount to be Paid<Text style={styles.required}>*</Text></Text>
          <TextInput
            placeholder="Enter Amount"
            value={amountToBePaid}
            onChangeText={setAmountToBePaid}
            style={styles.input}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Proof of Payment<Text style={styles.required}>*</Text></Text>
          <TouchableOpacity 
            onPress={handleSelectProofOfPayment} 
            style={styles.imagePreviewContainer}
          >
            {proofOfPayment ? (
              <Image source={{ uri: proofOfPayment }} style={styles.imagePreview} />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <MaterialIcons name="photo" size={100} color="#ccc" />
                <Text style={styles.uploadPromptText}>Tap to Upload</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.submitButton, isSubmitDisabled && styles.disabledButton]} 
            onPress={handleSubmit}
            disabled={isSubmitDisabled}
          >
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal visible={confirmModalVisible} transparent animationType="fade">
        <View style={styles.centeredModal}>
          <View style={styles.modalCard}>
            <MaterialIcons name="help-outline" size={40} color="#2C5282" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Confirm Payment</Text>
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>Balance: {formatCurrency(balance)}</Text>
              <Text style={styles.modalText}>Payment Option: {paymentOption}</Text>
              <Text style={styles.modalText}>Account Name: {accountName}</Text>
              <Text style={styles.modalText}>Account Number: {accountNumber}</Text>
              <Text style={styles.modalText}>Amount to be Paid: {formatCurrency(amountToBePaid)}</Text>
            </View>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setConfirmModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={submitPayment}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Success Modal */}
      <Modal visible={successModalVisible} transparent animationType="fade">
        <View style={styles.centeredModal}>
          <View style={styles.modalCard}>
            <MaterialIcons name="check-circle" size={40} color="#4CAF50" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Success</Text>
            <Text style={styles.modalText}>
              Payment submitted successfully. You will receive a confirmation email shortly.
            </Text>
            <TouchableOpacity 
              style={[styles.modalButton, styles.confirmButton]} 
              onPress={() => {
                setSuccessModalVisible(false);
                resetFormFields();
                navigation.navigate('Home');
              }}
            >
              <Text style={styles.confirmButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Error Modal */}
      <Modal visible={errorModalVisible} transparent animationType="fade">
        <View style={styles.centeredModal}>
          <View style={styles.modalCard}>
            <MaterialIcons name="error" size={40} color="#f44336" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Error</Text>
            <Text style={styles.modalText}>{errorMessage}</Text>
            <TouchableOpacity 
              style={[styles.modalButton, styles.confirmButton]} 
              onPress={() => setErrorModalVisible(false)}
            >
              <Text style={styles.confirmButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#4FE7AF" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        </View>
      )}

      {/* Custom Alert Modal */}
      <CustomModal
        visible={alertModalVisible}
        type={alertType}
        title={alertType === 'success' ? 'Success' : 'Error'}
        message={alertMessage}
        onClose={() => {
          setAlertModalVisible(false);
          if (alertType === 'success' && pendingApiData) {
            // Navigate immediately and run API in background
            resetFormFields();
            navigation.navigate('Home');
            
            // Run API call in background after navigation
            setTimeout(async () => {
              try {
                await MemberPayment(pendingApiData);
                console.log('Payment API call completed successfully in background');
              } catch (apiError) {
                console.error('Background API call failed:', apiError);
                // API failure doesn't affect user experience since data is already in database
              }
              // Clear pending data
              setPendingApiData(null);
            }, 100);
          }
        }}
      />

      {/* Image Picker Modal */}
      <ImagePickerModal
        visible={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onImageSelected={handleImageSelected}
        title="Select Proof of Payment"
      />
    </KeyboardAvoidingView>
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
    paddingStart: 50,
    paddingEnd: 50,
    paddingTop: 20,
    paddingBottom: 40,
    minHeight: '100%',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  centeredModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalCard: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalIcon: {
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2C5282',
  },
  modalContent: {
    width: '100%',
    marginBottom: 20,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    minWidth: '45%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  confirmButton: {
    backgroundColor: '#2C5282',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
    color: '#2C5282',
  },
  required: {
    color: 'red',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.6,
  },
  uploadPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadPromptText: {
    color: '#2D5783',
    marginTop: 10,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default PayLoan;