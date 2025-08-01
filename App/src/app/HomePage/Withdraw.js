import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, Modal, ActivityIndicator, BackHandler } from 'react-native';
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
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [balance, setBalance] = useState(0);
  const [memberId, setMemberId] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const withdrawOptions = [
    { key: 'GCash', label: 'GCash' },
    { key: 'Bank', label: 'Bank' },
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

  const handleWithdrawOptionChange = (option) => {
    setWithdrawOption(option.key);
    // Reset account fields when withdraw option changes
    setAccountName('');
    setAccountNumber('');
  };

 const handleSubmit = async () => {
  if (!withdrawOption || !accountName || !accountNumber || !withdrawAmount) {
    Alert.alert('Error', 'All fields are required');
    return;
  }

  if (isNaN(withdrawAmount) || parseFloat(withdrawAmount) <= 0) {
    Alert.alert('Error', 'Please enter a valid amount');
    return;
  }

  if (parseFloat(withdrawAmount) > balance) {
    Alert.alert('Error', 'Insufficient balance');
    return;
  }

  Alert.alert(
    'Confirm Withdrawal',
    `Balance: ₱${balance}\nWithdraw Option: ${withdrawOption}\nAccount Name: ${accountName}\nAccount Number: ${accountNumber}\nAmount to be Withdrawn: ₱${parseFloat(withdrawAmount).toFixed(2)}`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          setIsLoading(true);
          try {
            const transactionId = generateTransactionId();
            const newWithdrawRef = dbRef(database, `Withdrawals/WithdrawalApplications/${memberId}/${transactionId}`);

            await set(newWithdrawRef, {
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
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })
              .replace(',', '')
              .replace(/(\d{1,2}):(\d{2})/, (match, h, m) => `${h.padStart(2,'0')}:${m.padStart(2,'0')}`)
              .replace(/(\d{4}) (\d{2}:\d{2})/, '$1 at $2'),
              status: 'Pending',
            });

            Alert.alert(
              'Success',
              'Withdrawal recorded successfully',
              [
                {
                  text: 'OK',
                  onPress: async () => {
                    try {
                      await MemberWithdraw({
                        email,
                        firstName,
                        lastName,
                        withdrawOption,
                        accountName,
                        accountNumber,
                        amountWithdrawn: parseFloat(withdrawAmount),
                      });
                      navigation.goBack();
                    } catch (apiError) {
                      console.error('API Error:', apiError);
                      Alert.alert('Error', 'There was an issue sending the withdrawal notification');
                    }
                  }
                }
              ]
            );
          } catch (error) {
            console.error('Error during withdrawal submission:', error);
            Alert.alert('Error', 'Error recording withdrawal');
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]
  );
};

  const formatCurrency = (amount) => {
    return `₱${parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  const generateTransactionId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <MaterialIcons name="arrow-back" size={30} color="white" />
      </TouchableOpacity>
      <Text style={styles.title}>Withdraw</Text>
      <View style={styles.content}>


        <Text style={styles.label}>Balance</Text>
        <Text style={styles.balanceText}>{formatCurrency(balance)}</Text>

        <Text style={styles.label}>Disbursement</Text>
        <ModalSelector
          data={withdrawOptions}
          initValue="Select Withdraw Option"
          onChange={handleWithdrawOptionChange}
          style={styles.picker}
        >
          <TouchableOpacity style={styles.pickerContainer}>
            <Text style={styles.pickerText}>{withdrawOption || 'Select Withdraw Option'}</Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="black" /> 
          </TouchableOpacity>
        </ModalSelector>

        <Text style={styles.label}>Account Name</Text>
        <TextInput
          placeholder="Enter Account Name"
          value={accountName}
          onChangeText={setAccountName}
          style={styles.input}
        />

        <Text style={styles.label}>Account Number</Text>
        <TextInput
          placeholder="Enter Account Number"
          value={accountNumber}
          onChangeText={setAccountNumber}
          style={styles.input}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Withdraw Amount</Text>
        <TextInput
          placeholder="Enter Amount"
          value={withdrawAmount}
          onChangeText={setWithdrawAmount}
          style={styles.input}
          keyboardType="numeric"
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
    flex: 1, // To make it take the full height up to the bottom
    paddingStart: 50,
    paddingEnd: 50,
    paddingTop: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 20,
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalText: {
    marginTop: 10,
    fontSize: 16,
    color: 'white',
  },
});

export default Withdraw;