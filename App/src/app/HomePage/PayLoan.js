import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, StyleSheet, 
  TouchableOpacity, Alert, ScrollView, Image, 
  ActivityIndicator, Modal, BackHandler, KeyboardAvoidingView, Platform
} from 'react-native';
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
  const [amountToBePaid, setAmountToBePaid] = useState('');
  const [proofOfPayment, setProofOfPayment] = useState(null);
  const [email, setEmail] = useState('');
  const [memberId, setMemberId] = useState('');
  const [balance, setBalance] = useState(0);
  const [interest, setInterest] = useState(0);
  const [interestRate, setInterestRate] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const accountName = '5KI';
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');


  const paymentOptions = [
    { key: 'Bank', label: 'Bank' },
    { key: 'Gcash', label: 'Gcash' },
  ];

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      fetchUserData(user.email);
    } else if (route.params?.user) {
      fetchUserData(route.params.user.email);
    }
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
          setFirstName(foundUser.firstName || ''); // Fetch firstName
          setLastName(foundUser.lastName || '');   // Fetch lastName
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
    setAccountNumber(option.key === 'Bank' ? '9876543' : '0123456');
  };

  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);

useEffect(() => {
  setIsSubmitDisabled(!paymentOption || !amountToBePaid || !proofOfPayment);
}, [paymentOption, amountToBePaid, proofOfPayment]);

  const handleSelectProofOfPayment = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setProofOfPayment(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting proof of payment:', error);
      Alert.alert('Error', 'Failed to select proof of payment');
    }
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
      Alert.alert('Error', 'Failed to upload image');
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
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      .replace(',', '')
      .replace(/(\d{1,2}):(\d{2})/, (match, h, m) => `${h.padStart(2,'0')}:${m.padStart(2,'0')}`)
      .replace(/(\d{4}) (\d{2}:\d{2})/, '$1 at $2'),
      status: 'Pending',
    });
  } catch (error) {
    console.error('Failed to store payment data in Realtime Database:', error);
    Alert.alert('Error', 'Failed to store payment data');
    throw error;
  }
};

  const generateTransactionId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSubmit = async () => {
  if (!paymentOption || !amountToBePaid || !proofOfPayment) {
    Alert.alert('Error', 'All fields are required');
    return;
  }

  if (isNaN(amountToBePaid) || parseFloat(amountToBePaid) <= 0) {
    Alert.alert('Error', 'Please enter a valid amount');
    return;
  }

  Alert.alert(
    'Confirm Payment',
    `Balance: ₱${balance}\nPayment Option: ${paymentOption}\nAccount Name: ${accountName}\nAccount Number: ${accountNumber}\nAmount to be Paid: ₱${parseFloat(amountToBePaid).toFixed(2)}`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          setIsLoading(true);
          try {
            // Step 1: Upload proof of payment
            const proofOfPaymentUrl = await uploadImageToFirebase(proofOfPayment, 'proofsOfPayment');
            
            // Step 2: Store payment data in database
            await storePaymentDataInDatabase(proofOfPaymentUrl);

            // Step 3: Prepare payment data for API (with all required fields)
            const paymentData = {
              email,
              firstName,
              lastName,
              amount: parseFloat(amountToBePaid),
              paymentMethod: paymentOption,
              date: new Date().toISOString(),
              interestPaid: interest,
              principalPaid: parseFloat(amountToBePaid) - interest,
              isLoanPayment: true
            };

            // Step 4: Make API call to trigger emails
            const response = await MemberPayment(paymentData);
            console.log('Payment API response:', response);

            // Step 5: Show success
            Alert.alert(
              'Success', 
              'Payment submitted successfully. You will receive a confirmation email shortly.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    resetFormFields();
                    navigation.navigate('Home');
                  }
                }
              ],
              { cancelable: false }
            );
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
            Alert.alert(
              'Notice',
              'Payment was recorded but email notification failed. Please check your email later.',
              [{ text: 'OK' }]
            );
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]
  );
};

  const resetFormFields = () => {
    setPaymentOption('');
    setAccountNumber('');
    setAmountToBePaid('');
    setProofOfPayment(null);
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
        >
        <TouchableOpacity style={styles.pickerContainer}>
        <Text style={styles.pickerText}>{paymentOption || 'Select Payment Option'}</Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="black" /> 
        </TouchableOpacity>

        </ModalSelector>

        <Text style={styles.label}>Account Name</Text>
        <TextInput value={accountName} style={[styles.input, styles.fixedInput]} editable={false} />

        <Text style={styles.label}>Account Number</Text>
        <TextInput value={accountNumber} style={[styles.input, styles.fixedInput]} editable={false} />

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

      <Modal transparent={true} visible={isLoading}>
        <View style={styles.modalContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.modalText}>Please wait...</Text>
        </View>
      </Modal>
    </ KeyboardAvoidingView>
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
    flex: 1, // To make it take the full height up to the bottom
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
    backgroundColor: '#2D5783',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalText: {
    color: '#fff',
    marginTop: 10,
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