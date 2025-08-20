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
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import ModalSelector from 'react-native-modal-selector';
import Icon from 'react-native-vector-icons/MaterialIcons';
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
  
  // State for image selection and cropping
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showCropOptions, setShowCropOptions] = useState(false);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('error');
  const [selectedImageUri, setSelectedImageUri] = useState(null);

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

  const handleSelectProofOfPayment = () => {
    setShowImageOptions(true);
  };

  const handleSelectImage = async (source) => {
    const { status } = source === 'camera' 
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
      
    if (status !== 'granted') {
      setAlertMessage(`We need permission to access your ${source === 'camera' ? 'camera' : 'media library'}`);
      setAlertType('error');
      setAlertModalVisible(true);
      return;
    }

    try {
      const result = await (source === 'camera' 
        ? ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.8,
          })
        : ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.8,
          }));

      if (!result.canceled && result.assets && result.assets[0]) {
        if (source === 'camera') {
          // For camera: automatically use the image as is
          setProofOfPayment(result.assets[0].uri);
        } else {
          // For gallery: show crop options
          setSelectedImageUri(result.assets[0].uri);
          setShowCropOptions(true);
        }
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      setAlertMessage('Failed to select image');
      setAlertType('error');
      setAlertModalVisible(true);
    }
  };

  const handleUseAsIs = () => {
    if (selectedImageUri) {
      setProofOfPayment(selectedImageUri);
      setShowCropOptions(false);
      setSelectedImageUri(null);
    }
  };

  const handleCropImage = async () => {
    if (!selectedImageUri) return;

    try {
      setShowCropOptions(false);
      
      Alert.alert(
        'Crop Image',
        'You can now crop the image with flexible dimensions. Drag the corners to adjust both height and width as needed.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setShowCropOptions(true)
          },
          {
            text: 'Continue',
            onPress: async () => {
              try {
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  quality: 0.8,
                });

                if (!result.canceled && result.assets && result.assets[0]) {
                  setProofOfPayment(result.assets[0].uri);
                  setSelectedImageUri(null);
                } else {
                  setShowCropOptions(true);
                }
              } catch (error) {
                console.error('Error cropping image:', error);
                setAlertMessage('Failed to crop image');
                setAlertType('error');
                setAlertModalVisible(true);
                setShowCropOptions(true);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error with crop:', error);
      setAlertMessage('Failed to crop image');
      setAlertType('error');
      setAlertModalVisible(true);
    }
  };

  const handleSubmit = () => {
    if (!paymentOption || !proofOfPayment) {
      setAlertMessage('All fields are required');
      setAlertType('error');
      setAlertModalVisible(true);
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
            cancelText="Cancel"
            onChange={handlePaymentOptionChange}
            style={styles.picker}
            selectStyle={styles.pickerWithIcon}
            optionTextStyle={{ fontSize: 16, color: '#222' }}
            optionContainerStyle={{ backgroundColor: '#fff' }}
            modalStyle={{ justifyContent: 'flex-end', margin: 0 }}
            overlayStyle={{ justifyContent: 'flex-end' }}
          >
            <View style={styles.pickerContent}>
              <Text style={[
                styles.pickerText,
                paymentOption ? styles.selectedText : styles.placeholderText
              ]}>
                {paymentOption || 'Select Payment Option'}
              </Text>
              <Icon name="arrow-drop-down" size={24} color={paymentOption ? '#000' : 'grey'} style={styles.pickerIcon} />
            </View>
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
              { backgroundColor: isSubmitDisabled ? '#cccccc' : '#4FE7AF' }
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

      {/* Image Options Modal */}
      <Modal
        transparent={true}
        visible={showImageOptions}
        onRequestClose={() => setShowImageOptions(false)}
        animationType="slide"
      >
        <View style={styles.modalBackground}>
          <View style={styles.optionsModal}>
            <Text style={styles.modalTitle}>Select Proof of Payment</Text>
            <View style={styles.optionButtonsContainer}>
              <TouchableOpacity 
                style={styles.optionButton}
                onPress={() => {
                  setShowImageOptions(false);
                  setTimeout(() => {
                    handleSelectImage('camera');
                  }, 300);
                }}
              >
                <Icon name="photo-camera" size={24} color="#2D5783" style={styles.optionIcon} />
                <Text style={styles.optionText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.optionButton}
                onPress={() => {
                  setShowImageOptions(false);
                  setTimeout(() => {
                    handleSelectImage('gallery');
                  }, 300);
                }}
              >
                <Icon name="photo-library" size={24} color="#2D5783" style={styles.optionIcon} />
                <Text style={styles.optionText}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowImageOptions(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Crop Options Modal */}
      <Modal
        transparent={true}
        visible={showCropOptions}
        onRequestClose={() => setShowCropOptions(false)}
        animationType="slide"
      >
        <View style={styles.modalBackground}>
          <View style={styles.cropModal}>
            <Text style={styles.modalTitle}>Image Selected</Text>
            
            {selectedImageUri && (
              <Image source={{ uri: selectedImageUri }} style={styles.previewImage} />
            )}
            
            <Text style={styles.cropInstructions}>
              Choose how you want to use this selected image. "Crop Image" will open a cropping interface where you can adjust the size by dragging the corners.
            </Text>
            
            <View style={styles.cropButtonsContainer}>
              <TouchableOpacity 
                style={styles.cropButton}
                onPress={handleUseAsIs}
              >
                <Text style={styles.cropButtonText}>Use As Is</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cropButton}
                onPress={handleCropImage}
              >
                <Text style={styles.cropButtonText}>Crop Image</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => {
                setShowCropOptions(false);
                setSelectedImageUri(null);
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  pickerWithIcon: {
    borderWidth: 0,
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
    color: '#2D5783',
    fontWeight: 'bold',
    marginTop: 10,
    fontSize: 16,
  },
  // Modal selector styles
  pickerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderColor: '#ccc',
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  selectedText: {
    color: '#000',
    fontSize: 16,
  },
  placeholderText: {
    color: 'grey',
    fontSize: 16,
  },
  pickerIcon: {
    marginLeft: 10,
  },
  // Modal styles (matching RegisterPage2 design)
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
  cropModal: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2D5783',
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
  optionIcon: {
    marginRight: 5,
  },
  optionText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#2D5783',
  },
  cancelButton: {
    padding: 15,
    marginTop: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: 'red',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cropInstructions: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
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
  cropButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RegistrationFeePage;