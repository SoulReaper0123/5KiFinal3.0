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

  const storeDepositDataInDatabase = async (proofOfDepositUrl) => {
    try {
      const transactionId = generateTransactionId();
      const newDepositRef = dbRef(database, `Deposits/DepositApplications/${memberId}/${transactionId}`);
  
      const depositAmount = parseFloat(amountToBeDeposited);
  
      await set(newDepositRef, {
        transactionId,
        id: memberId,
        email,
        firstName,
        lastName,
        accountName: accountName,
        depositOption,
        accountNumber,
        amountToBeDeposited: depositAmount,
        proofOfDepositUrl,
        dateApplied: new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        status: 'pending',
      });

    } catch (error) {
      console.error('Failed to store deposit data in Realtime Database:', error);
      Alert.alert('Error', 'Failed to store deposit data');
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!depositOption || !amountToBeDeposited || !proofOfDeposit) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    if (isNaN(amountToBeDeposited) || parseFloat(amountToBeDeposited) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    Alert.alert(
      'Confirm Deposit',
      `Balance: ₱${balance}\nDeposit Option: ${depositOption}\nAccount Name: ${accountName}\nAccount Number: ${accountNumber}\nAmount to be Deposited: ₱${parseFloat(amountToBeDeposited).toFixed(2)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setLoading(true);
            try {
              const proofOfDepositUrl = await uploadImageToFirebase(proofOfDeposit, 'proofsOfDeposit');
              await storeDepositDataInDatabase(proofOfDepositUrl);

              const depositData = {
                email,
                accountName,
                firstName,
                lastName,
                depositOption,
                accountNumber,
                amountToBeDeposited: parseFloat(amountToBeDeposited),
                proofOfDepositUrl,
                transactionId: generateTransactionId(),
              };

              await MemberDeposit(depositData);
              
              Alert.alert(
                'Success', 
                'Deposit application submitted successfully',
                [{ 
                  text: 'OK', 
                  onPress: () => {
                    navigation.goBack();
                    resetFormFields();
                  }
                }]
              );
            } catch (error) {
              console.error('Error during deposit submission:', error);
              Alert.alert(
                'Error', 
                error.response?.data?.message || 
                'There was an issue processing your deposit. Please try again.'
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
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

      <Modal transparent={true} visible={loading}>
        <View style={styles.modalOverlay}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Please wait...</Text>
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
});

export default Deposit;