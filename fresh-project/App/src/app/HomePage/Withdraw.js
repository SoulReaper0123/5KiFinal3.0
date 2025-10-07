import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform, Modal, ActivityIndicator, BackHandler } from 'react-native';
import CustomModal from '../../components/CustomModal';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import ModalSelector from 'react-native-modal-selector';
import { ref as dbRef, set, get } from 'firebase/database';
import { database, auth } from '../../firebaseConfig';
import { MemberWithdraw } from '../../api';

const Withdraw = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const [withdrawOption, setWithdrawOption] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  // Saved accounts from Members
  const [bankAccName, setBankAccName] = useState('');
  const [bankAccNum, setBankAccNum] = useState('');
  const [gcashAccName, setGcashAccName] = useState('');
  const [gcashAccNum, setGcashAccNum] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [balance, setBalance] = useState(0);
  const [memberId, setMemberId] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('error');
  const [pendingApiData, setPendingApiData] = useState(null);

  // Cash on hand fields
  const [receivedBy, setReceivedBy] = useState('');
  const [dateReceived, setDateReceived] = useState('');

  const withdrawOptions = [
    { key: 'GCash', label: 'GCash' },
    { key: 'Bank', label: 'Bank' },
    { key: 'Cash', label: 'Cash' },
  ];

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
          setEmail(foundUser.email);
          setFirstName(foundUser.firstName || ''); // Fetch firstName
          setLastName(foundUser.lastName || '');   // Fetch lastName
          // Capture saved disbursement accounts
          setBankAccName(foundUser.bankAccName || '');
          setBankAccNum(foundUser.bankAccNum || '');
          setGcashAccName(foundUser.gcashAccName || '');
          setGcashAccNum(foundUser.gcashAccNum || '');
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
 const resetFormFields = () => {
    setWithdrawOption('');
    setAccountNumber('');
    setAccountName('');
    setWithdrawAmount('');
    setReceivedBy('');
    setDateReceived('');
    setPendingApiData(null);
  };
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
  }, [route.params]);

  useEffect(() => {
    const handleBackPress = () => {
      navigation.reset({ index: 0, routes: [{ name: 'AppHomeStandalone' }] });
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
  
    return () => backHandler.remove(); 
  }, [navigation]);

  const handleWithdrawOptionChange = (option) => {
    const key = option.key;
    setWithdrawOption(key);
    // Auto-fill from saved accounts
    if (key === 'Bank') {
      setAccountName(bankAccName || '');
      setAccountNumber((bankAccNum || '').toString());
    } else if (key === 'GCash') {
      setAccountName(gcashAccName || '');
      setAccountNumber((gcashAccNum || '').toString());
    } else if (key === 'Cash') {
      setAccountName('');
      setAccountNumber('');
    } else {
      setAccountName('');
      setAccountNumber('');
    }
  };

const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);

useEffect(() => {
  const hasEmptyFields = !withdrawOption || !withdrawAmount ||
    (withdrawOption !== 'Cash' && (!accountName || !accountNumber));
  const amount = parseFloat(withdrawAmount);
  const insufficientBalance = amount > balance;
  const belowMinimum = !isNaN(amount) && amount < 5000;
  setIsSubmitDisabled(hasEmptyFields || insufficientBalance || belowMinimum);
}, [withdrawOption, accountName, accountNumber, withdrawAmount, balance]);

 const handleSubmit = async () => {
  const missingFields = !withdrawOption || !withdrawAmount ||
    (withdrawOption !== 'Cash' && (!accountName || !accountNumber));
  
  if (missingFields) {
    setAlertMessage('All fields are required');
    setAlertType('error');
    setAlertModalVisible(true);
    return;
  }

  const amount = parseFloat(withdrawAmount);
  if (isNaN(amount) || amount <= 0) {
    setAlertMessage('Please enter a valid amount');
    setAlertType('error');
    setAlertModalVisible(true);
    return;
  }

  if (amount < 5000) {
    setAlertMessage('Minimum withdrawal amount is ₱5,000');
    setAlertType('error');
    setAlertModalVisible(true);
    return;
  }

  if (amount > balance) {
    setAlertMessage('Insufficient balance');
    setAlertType('error');
    setAlertModalVisible(true);
    return;
  }

  // Show confirmation modal
  setConfirmModalVisible(true);
};

  const formatCurrency = (amount) => {
    return `₱${parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  const generateTransactionId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };
  
  const submitWithdrawal = async () => {
    setIsLoading(true);
    setConfirmModalVisible(false);
    
    try {
      const transactionId = generateTransactionId();
      const currentDate = new Date().toISOString();

      // Prepare withdrawal data
      const withdrawalData = {
        transactionId,
        id: memberId,
        email,
        firstName,
        lastName,
        withdrawOption,
        accountName,
        accountNumber,
        amountWithdrawn: parseFloat(withdrawAmount).toFixed(2),
        dateApplied: new Date().toLocaleString('en-US', {
          month: 'long',
          day: '2-digit',
          year: 'numeric',
        })
        .replace(',', '')
        .replace(/(\d{1,2}):(\d{2})/, (match, h, m) => `${h.padStart(2,'0')}:${m.padStart(2,'0')}`)
        .replace(/(\d{4}) (\d{2}:\d{2})/, '$1 at $2'),
        status: 'Pending',
      };

      // Save to Firebase first
      const newWithdrawRef = dbRef(database, `Withdrawals/WithdrawalApplications/${memberId}/${transactionId}`);
      await set(newWithdrawRef, withdrawalData);

      // Also log into Transactions for unified feed (Applications table)
      const txnRef = dbRef(database, `Transactions/Withdrawals/${memberId}/${transactionId}`);
      await set(txnRef, {
        ...withdrawalData,
        label: 'Withdraw',
        type: 'Withdrawals',
      });

      // Prepare withdrawal data for API call to run when user clicks OK
      const apiData = {
        email,
        firstName,
        lastName,
        amount: parseFloat(withdrawAmount),
        date: currentDate,
        recipientAccount: accountNumber,
        referenceNumber: transactionId,
        withdrawOption,
        accountName
      };

      // Store withdrawal data to be used when user clicks OK
      setPendingApiData(apiData);

      // Show success modal
      setAlertMessage('Your withdrawal request has been submitted successfully. It will be processed shortly.');
      setAlertType('success');
      setAlertModalVisible(true);

    } catch (error) {
      console.error('Error during withdrawal submission:', error);
      setAlertMessage('An unexpected error occurred. Please try again later.');
      setAlertType('error');
      setAlertModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
          >
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header with centered title and left back button using invisible spacers */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.headerSide} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={28} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdraw</Text>
        <View style={styles.headerSide} />
      </View>
      <View style={styles.content}>


        <Text style={styles.label}>Balance</Text>
        <Text style={styles.balanceText}>{formatCurrency(balance)}</Text>

        <Text style={styles.label}>Disbursement<Text style={styles.required}>*</Text></Text>
        <ModalSelector
          data={withdrawOptions}
          initValue="Select Withdraw Option"
          onChange={handleWithdrawOptionChange}
          style={styles.picker}
          modalStyle={{ justifyContent: 'flex-end', margin: 0 }}
          overlayStyle={{ justifyContent: 'flex-end' }}
        >
          <TouchableOpacity style={styles.pickerContainer}>
            <Text style={styles.pickerText}>{withdrawOption || 'Select Withdraw Option'}</Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="black" /> 
          </TouchableOpacity>
        </ModalSelector>

        {withdrawOption !== 'Cash' && (
          <>
            <Text style={styles.label}>Account Name<Text style={styles.required}>*</Text></Text>
            <TextInput
              value={accountName}
              editable={false}
              style={[styles.input, { backgroundColor: '#F3F4F6' }]}
              placeholder="Auto-filled from your profile"
            />

            <Text style={styles.label}>Account Number<Text style={styles.required}>*</Text></Text>
            <TextInput
              value={accountNumber}
              editable={false}
              style={[styles.input, { backgroundColor: '#F3F4F6' }]}
              keyboardType="numeric"
              placeholder="Auto-filled from your profile"
            />
          </>
        )}

        <Text style={styles.label}>Withdraw Amount<Text style={styles.required}>*</Text></Text>
        <TextInput
          placeholder="Enter Amount"
          value={withdrawAmount}
          onChangeText={setWithdrawAmount}
          style={styles.input}
          keyboardType="numeric"
        />

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
            <Text style={styles.modalTitle}>Confirm Withdrawal</Text>
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>Balance: {formatCurrency(balance)}</Text>
              <Text style={styles.modalText}>Withdraw Option: {withdrawOption}</Text>
              <Text style={styles.modalText}>Account Name: {accountName}</Text>
              <Text style={styles.modalText}>Account Number: {accountNumber}</Text>
              <Text style={styles.modalText}>Amount to be Withdrawn: {formatCurrency(withdrawAmount)}</Text>
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
                onPress={submitWithdrawal}
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
              Withdrawal recorded successfully
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
        onClose={() => {
          setAlertModalVisible(false);
          if (alertType === 'success' && pendingApiData) {
            // Navigate immediately and run API in background
            resetFormFields();
            navigation.navigate('Home');
            
            // Run API call in background after navigation
            setTimeout(async () => {
              try {
                await MemberWithdraw(pendingApiData);
                console.log('Withdraw API call completed successfully in background');
              } catch (apiError) {
                console.error('Background API call failed:', apiError?.message || apiError || 'Unknown API error');
                // API failure doesn't affect user experience since data is already in database
              }
              // Clear pending data
              setPendingApiData(null);
            }, 100);
          }
        }}
        message={alertMessage}
        type={alertType}
      />
      </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
    paddingBottom: 32,
  },
  // Header styles for centered title with left back button
  headerRow: {
    marginTop: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSide: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'left',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 5,
  },
  balanceText: {
    fontSize: 28,
    marginBottom: 12,
    textAlign: 'center',
    color: '#1E3A5F',
    fontWeight: '700',
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
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  submitButton: {
    backgroundColor: '#4FE7AF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 30,
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
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
  modalText: {
    marginTop: 10,
    fontSize: 16,
    color: 'white',
  },
  required: {
    color: 'red',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.6,
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
});

export default Withdraw;