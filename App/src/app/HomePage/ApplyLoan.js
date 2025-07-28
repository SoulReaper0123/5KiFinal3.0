import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import ModalSelector from 'react-native-modal-selector';
import { ref as dbRef, set, get } from 'firebase/database';
import { database, auth } from '../../firebaseConfig';
import { MemberLoan } from '../../api';

const ApplyLoan = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [term, setTerm] = useState('');
  const [loanType, setLoanType] = useState('Regular Loan');
  const [interestRate, setInterestRate] = useState(0);
  const [disbursement, setDisbursement] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [balance, setBalance] = useState(0);
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const accountNumberInput = useRef(null);

  const termsOptions = [
    { key: '3', label: '3 Months', interestRate: 0.01 },
    { key: '6', label: '6 Months', interestRate: 0.015 },
    { key: '9', label: '9 Months', interestRate: 0.02 },
    { key: '12', label: '12 Months', interestRate: 0.03 },
  ];

  const loanTypeOptions = [
    { key: 'Regular Loan', label: 'Regular Loan' },
    { key: 'Quick Cash', label: 'Quick Cash' },
  ];

  const disbursementOptions = [
    { key: 'GCash', label: 'GCash' },
    { key: 'Bank', label: 'Bank' },
  ];

  const handleLoanTypeChange = (option) => {
    setLoanType(option.key);
    if (option.key === 'Quick Cash') {
      setTerm('1');
      setInterestRate(0.03);
    } else {
      setTerm('');
      setInterestRate(0);
    }
  };

  const handleTermChange = (option) => {
    setTerm(option.key);
    setInterestRate(option.interestRate);
  };

  const validateAccountNumber = (value) => {
    const maxLength = disbursement === 'GCash' ? 11 : disbursement === 'Bank' ? 16 : 0;
    if (maxLength > 0 && value.length > maxLength) {
      Alert.alert(`Error`, `Account Number for ${disbursement} must be ${maxLength} digits long`);
      return value.slice(0, maxLength);
    }
    return value;
  };

  const handleAccountNumberChange = (value) => {
    setAccountNumber(validateAccountNumber(value));
  };

  const fetchUserData = async (userEmail) => {
    const membersRef = dbRef(database, 'Members');
    try {
      const snapshot = await get(membersRef);
      if (snapshot.exists()) {
        const members = snapshot.val();
        const foundUser = Object.entries(members).find(([_, member]) => member.email === userEmail);
        if (foundUser) {
          const [key, userData] = foundUser;
          setUserId(key);
          setBalance(userData.balance || 0);
          setFirstName(userData.firstName || '');
          setLastName(userData.lastName || '');
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    const user = auth.currentUser;
    const userEmail = user ? user.email : route.params?.user?.email;
    if (userEmail) {
      setEmail(userEmail);
      fetchUserData(userEmail);
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

  const generateTransactionId = () => Math.floor(100000 + Math.random() * 900000).toString();

const storeLoanApplicationInDatabase = async (applicationData) => {
  try {
    const transactionId = generateTransactionId();
    const now = new Date();
    const dateApplied = now.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const applicationDataWithMeta = {
      ...applicationData,
      id: userId,
      firstName,
      lastName,
      email,
      transactionId,
      dateApplied,
      loanType,
    };

    const applicationRef = dbRef(database, `Loans/LoanApplications/${userId}/${transactionId}`);
    await set(applicationRef, applicationDataWithMeta);
  } catch (error) {
    console.error('Failed to store loan application:', error);
    Alert.alert('Error', 'Failed to submit loan application');
  }
};


const handleSubmit = async () => {
  if (!loanAmount || !term || !disbursement || !accountName || !accountNumber) {
    Alert.alert('Error', 'All fields are required');
    return;
  }

  // Step 1: Show confirmation modal
  Alert.alert(
    'Confirm Loan Application',
    `Loan Type: ${loanType}\n` +
    `Loan Amount: ₱${loanAmount}\n` +
    `Term: ${term} ${term === '1' ? 'Month' : 'Months'}\n` +
    `Disbursement: ${disbursement}\n` +
    `Account Name: ${accountName}\n` +
    `Account Number: ${accountNumber}\n\n` +
    `Are you sure you want to submit this loan application?`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Submit',
        onPress: async () => {
          setIsLoading(true);
          try {
            // Step 2: Store data in database
            const applicationData = {
              loanAmount: parseFloat(loanAmount),
              term,
              disbursement,
              accountName,
              accountNumber,
              interestRate,
              firstName,
              lastName,
              email,
              userId,
              loanType,
            };

            await storeLoanApplicationInDatabase(applicationData);

            // Prepare loan data for API
            const loanApplication = {
              email,
              firstName,
              lastName,
              loanType,
              loanAmount: parseFloat(loanAmount),
              term,
              interestRate,
              disbursement,
              accountName,
              accountNumber,
            };

            // Step 3: Show success modal
            Alert.alert(
              'Success',
              'Loan application submitted successfully',
              [
                {
                  text: 'OK',
                  onPress: async () => {
                    try {
                      // Step 4: Make API call after success modal is dismissed
                      await MemberLoan(loanApplication);
                      navigation.goBack();
                      resetForm();
                    } catch (apiError) {
                      console.error('API Error:', apiError);
                      Alert.alert('Error', 'There was an issue sending the loan notification');
                    }
                  }
                }
              ]
            );
          } catch (error) {
            console.error('Error during loan submission:', error);
            Alert.alert('Error', 'Error recording loan application');
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]
  );
};

  const resetForm = () => {
    setLoanAmount('');
    setTerm('');
    setAccountNumber('');
    setAccountName('');
    setDisbursement('');
  };

  const formatCurrency = (amount) => {
    return `₱${parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={30} color="white" />
      </TouchableOpacity>
      <Text style={styles.title}>Apply Loan</Text>

      <View style={styles.content}>
        <Text style={styles.label}>Balance</Text>
        <Text style={styles.balanceText}>{formatCurrency(balance)}</Text>

        <Text style={styles.label}>Loan Type</Text>
        <ModalSelector
          data={loanTypeOptions}
          initValue="Select Loan Type"
          onChange={handleLoanTypeChange}
          style={styles.picker}
          modalStyle={{ justifyContent: 'flex-end', margin: 0 }}
          overlayStyle={{ justifyContent: 'flex-end' }}
        >
          <TouchableOpacity style={styles.pickerContainer}>
            <Text style={styles.pickerText}>{loanType}</Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="black" />
          </TouchableOpacity>
        </ModalSelector>

        <Text style={styles.label}>Loan Amount</Text>
        <TextInput
          placeholder="Enter Loan Amount"
          value={loanAmount}
          onChangeText={setLoanAmount}
          style={styles.input}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Term</Text>
        <ModalSelector
          data={termsOptions}
          initValue="Select Loan Term"
          onChange={handleTermChange}
          style={styles.picker}
          disabled={loanType === 'Quick Cash'}
          modalStyle={{ justifyContent: 'flex-end', margin: 0 }}
          overlayStyle={{ justifyContent: 'flex-end' }}
        >
          <TouchableOpacity style={styles.pickerContainer}>
            <Text style={styles.pickerText}>
              {term ? `${term} ${term === '1' ? 'Month' : 'Months'}` : 'Select Loan Term'}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="black" />
          </TouchableOpacity>
        </ModalSelector>

        <Text style={styles.label}>Disbursement</Text>
        <ModalSelector
          data={disbursementOptions}
          initValue="Select Disbursement Method"
          onChange={(option) => setDisbursement(option.key)}
          style={styles.picker}
          modalStyle={{ justifyContent: 'flex-end', margin: 0 }}
          overlayStyle={{ justifyContent: 'flex-end' }}
        >
          <TouchableOpacity style={styles.pickerContainer}>
            <Text style={styles.pickerText}>
              {disbursement || 'Select Disbursement Method'}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="black" />
          </TouchableOpacity>
        </ModalSelector>

        <Text style={styles.label}>Account Name</Text>
        <TextInput value={accountName} onChangeText={setAccountName} style={styles.input} />

        <Text style={styles.label}>Account Number</Text>
        <TextInput
          value={accountNumber}
          onChangeText={handleAccountNumberChange}
          style={styles.input}
          keyboardType="numeric"
          ref={accountNumberInput}
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>

      <Modal transparent={true} visible={isLoading}>
        <View style={styles.modalContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.modalText}>Please wait...</Text>
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
    paddingStart: 50,
    paddingEnd: 50,
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
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
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
  submitButton: {
    backgroundColor: '#4FE7AF',
    marginTop: 15,
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalText: {
    marginTop: 15,
    color: '#ffffff',
    fontSize: 18,
  },
});

export default ApplyLoan;