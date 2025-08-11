import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ScrollView, 
  Image, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import ModalSelector from 'react-native-modal-selector';
import { ref as dbRef, get } from 'firebase/database';
import { database } from '../../firebaseConfig';

const RegistrationFeePage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [paymentOption, setPaymentOption] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [proofOfPayment, setProofOfPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
  const [paymentAccounts, setPaymentAccounts] = useState({
    Bank: { accountName: '', accountNumber: '' },
    GCash: { accountName: '', accountNumber: '' }
  });

  const registrationData = route.params;

  useEffect(() => {
    fetchPaymentSettings();
  }, []);

  useEffect(() => {
    setIsSubmitDisabled(!paymentOption || !proofOfPayment);
  }, [paymentOption, proofOfPayment]);

  const fetchPaymentSettings = async () => {
    try {
      const settingsRef = dbRef(database, 'Settings/Accounts');
      const snapshot = await get(settingsRef);
      if (snapshot.exists()) {
        setPaymentAccounts(snapshot.val());
      } else {
        // Fallback to old path if Accounts doesn't exist
        const oldSettingsRef = dbRef(database, 'Settings/DepositAccounts');
        const oldSnapshot = await get(oldSettingsRef);
        if (oldSnapshot.exists()) {
          setPaymentAccounts(oldSnapshot.val());
        }
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error);
    }
  };

  const paymentOptions = [
    { key: 'Bank', label: 'Bank' },
    { key: 'GCash', label: 'GCash' },
  ];

  const handlePaymentOptionChange = (option) => {
    setPaymentOption(option.key);
    const selectedAccount = paymentAccounts[option.key];
    setAccountNumber(selectedAccount.accountNumber || '');
    setAccountName(selectedAccount.accountName || '');
  };

  const handleSelectProofOfPayment = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setProofOfPayment(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting proof of payment:', error);
      Alert.alert('Error', 'Failed to select proof of payment');
    }
  };

  const handleSubmit = () => {
    if (!paymentOption || !proofOfPayment) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    setLoading(true);
    
    // Navigate to CreatePassword page with all registration data including payment proof
    navigation.navigate('CreatePassword', {
      ...registrationData,
      paymentOption,
      accountNumber,
      accountName,
      proofOfPayment,
      registrationFee: 5000 // Adding the registration fee amount
    });
    
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={30} color="white" />
        </TouchableOpacity>

        <Text style={styles.title}>Registration Fee</Text>

        <View style={styles.content}>
          <Text style={styles.label}>Registration Fee: ₱5000.00</Text>

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
                <Text style={styles.uploadPromptText}>Tap To Upload</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.submitButton, isSubmitDisabled && styles.disabledButton]} 
            onPress={handleSubmit}
            disabled={isSubmitDisabled}
          >
            <Text style={styles.submitButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Loading Modal */}
      {loading && (
        <View style={styles.modalOverlay}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D5783',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  backButton: {
    marginTop: 40,
    marginStart: 20,
  },
  content: {
    backgroundColor: 'white',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    padding: 40,
    paddingBottom: 60,
    marginTop: 20,
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
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  loadingText: {
    marginTop: 10,
    color: 'white',
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
    fontWeight: 'bold',
    marginTop: 10,
    fontSize: 16,
  },
});

export default RegistrationFeePage;