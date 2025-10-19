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
  Platform,
  Modal
} from 'react-native';
import CustomModal from '../../components/CustomModal';
import ImagePickerModal from '../../components/ImagePickerModal';
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
  const [minRegistrationFee, setMinRegistrationFee] = useState(5000);
  const [amount, setAmount] = useState('');
  
  // State for image selection
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('error');

  const registrationData = route.params || {};

  useEffect(() => {
    fetchPaymentSettings();
    fetchMinRegistrationFee();
  }, []);

  useEffect(() => {
    const validAmount = parseFloat(amount) >= parseFloat(minRegistrationFee);
    setIsSubmitDisabled(!paymentOption || !proofOfPayment || !validAmount);
  }, [paymentOption, proofOfPayment, amount, minRegistrationFee]);

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

  const fetchMinRegistrationFee = async () => {
    try {
      const feeRef = dbRef(database, 'Settings/RegistrationMinimumFee');
      const snapshot = await get(feeRef);
      if (snapshot.exists()) {
        const val = snapshot.val();
        const num = parseFloat(val);
        if (!isNaN(num)) setMinRegistrationFee(num);
      }
    } catch (error) {
      console.error('Error fetching minimum registration fee:', error);
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

  const handleSelectProofOfPayment = () => {
    setShowImageOptions(true);
  };



  const handleSubmit = () => {
    if (!paymentOption || !proofOfPayment) {
      setAlertMessage('All fields are required');
      setAlertType('error');
      setAlertModalVisible(true);
      return;
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < parseFloat(minRegistrationFee)) {
      setAlertMessage(`Minimum registration fee is ₱${minRegistrationFee.toFixed(2)}`);
      setAlertType('error');
      setAlertModalVisible(true);
      return;
    }

    setLoading(true);
    
    // Navigate to AccountDetails step with accumulated registration data
    navigation.navigate('CreatePassword', {
      ...registrationData,
      paymentOption,
      accountNumber,
      accountName,
      proofOfPayment,
      registrationFee: amt
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
          <MaterialIcons name="arrow-back" size={28} color="#0F172A" />
        </TouchableOpacity>

        <View style={{ marginBottom: 16 }}>
          <Text style={styles.title}>Registration Fee</Text>
          <Text style={styles.subLabel}>Step 3 of 4 • Deposit and provide proof</Text>
          <View style={{ height: 6, backgroundColor: '#E5E7EB', borderRadius: 999, marginTop: 8 }}>
            <View style={{ width: '60%', height: 6, backgroundColor: '#1E3A5F', borderRadius: 999 }} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Minimum Registration Fee: ₱{minRegistrationFee.toFixed(2)}</Text>
          <Text style={styles.label}>Enter Amount<Text style={styles.required}>*</Text></Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            style={styles.input}
            keyboardType="numeric"
            placeholder={`Enter amount (min ₱${minRegistrationFee.toFixed(2)})`}
          />

          <Text style={styles.label}>Payment Option<Text style={styles.required}>*</Text></Text>
          <ModalSelector
            data={paymentOptions}
            initValue="Select Payment Option"
            cancelText="Cancel"
            onChange={handlePaymentOptionChange}
            style={styles.picker}
            modalStyle={{ justifyContent: 'flex-end', margin: 0 }}
            overlayStyle={{ justifyContent: 'flex-end' }}
          >
            <TouchableOpacity style={styles.pickerContainer}>
              <Text style={styles.pickerText}>
                {paymentOption || 'Select Payment Option'}
              </Text>
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
            style={[
              styles.submitButton, 
              isSubmitDisabled && styles.disabledButton,
              { backgroundColor: isSubmitDisabled ? '#94A3B8' : '#1E3A5F' }
            ]} 
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

      {/* Image Picker Modal */}
      <ImagePickerModal
        visible={showImageOptions}
        onClose={() => setShowImageOptions(false)}
        onImageSelected={(imageUri) => {
          setProofOfPayment(imageUri);
        }}
        title="Select Proof of Payment"
        showCropOptions={true}
      />

      {/* Custom Alert Modal */}
      <CustomModal
        visible={alertModalVisible}
        onClose={() => setAlertModalVisible(false)}
        message={alertMessage}
        type={alertType}
        buttonText="OK"
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 32,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    marginTop: 20,
  },
  card: {
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
  },
  subLabel: {
    fontSize: 13,
    marginTop: 2,
    color: '#475569',
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
    backgroundColor: '#1E3A5F',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
    alignSelf: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '700',
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
  },
  uploadPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadPromptText: {
    color: '#1E3A5F',
    fontWeight: '700',
    marginTop: 10,
    fontSize: 16,
  },

  // Modal styles (matching RegisterPage2 design)

});

export default RegistrationFeePage;