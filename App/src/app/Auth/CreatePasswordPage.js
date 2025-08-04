import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  ActivityIndicator, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Modal
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ref as dbRef, set } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { database, storage } from '../../firebaseConfig';
import { registerUser } from '../../api';
import * as Crypto from 'expo-crypto';

const CreatePasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const navigation = useNavigation();
  const route = useRoute();
  const confirmPasswordInput = useRef(null);

  const registrationData = route.params;

  // Password requirements
  const minLength = password.length >= 8;
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);

  const hashPassword = async (password) => {
    try {
      const hashedPassword = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        password
      );
      return hashedPassword;
    } catch (error) {
      console.error('Error hashing password:', error);
      throw error;
    }
  };

  const uploadImageToFirebase = async (uri, path) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const imageRef = storageRef(storage, path);
      await uploadBytes(imageRef, blob);
      return await getDownloadURL(imageRef);
    } catch (error) {
      console.error('Image upload failed:', error);
      throw error;
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12;
    
    return `${hours}:${minutes}:${seconds} ${ampm}`;
  };

  const validateForm = () => {
    if (!password || !confirmPassword) {
      setErrorMessage('Please enter and confirm your password.');
      return false;
    }

    if (!minLength || !hasSpecial || !hasNumber || !hasLower || !hasUpper) {
      setErrorMessage('Please meet all password requirements.');
      return false;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return false;
    }

    if (!agreed) {
      setErrorMessage('You must agree to the Terms and Conditions and Privacy Policy to proceed.');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setErrorModalVisible(true);
      return;
    }

    try {
      setLoading(true);

      const sanitizedEmail = registrationData.email.replace(/[.#$[\]]/g, '_');
      const hashedPassword = await hashPassword(password);
      const now = new Date();

      // Prepare all upload promises
      const uploadPromises = [
        uploadImageToFirebase(registrationData.selfie, `users/${sanitizedEmail}/selfie`),
        uploadImageToFirebase(registrationData.validIdFront, `users/${sanitizedEmail}/id_front`),
        uploadImageToFirebase(registrationData.validIdBack, `users/${sanitizedEmail}/id_back`),
        uploadImageToFirebase(registrationData.selfieWithId, `users/${sanitizedEmail}/selfie_with_id`)
      ];

      // Add payment proof if exists
      if (registrationData.proofOfPayment) {
        uploadPromises.push(
          uploadImageToFirebase(registrationData.proofOfPayment, `users/${sanitizedEmail}/payment_proof`)
        );
      }

      // Execute all uploads
      const [selfieUrl, validIdFrontUrl, validIdBackUrl, selfieWithIdUrl, paymentProofUrl] = 
        await Promise.all(uploadPromises);

      // Prepare user data
      const userData = {
        email: registrationData.email,
        firstName: registrationData.firstName,
        middleName: registrationData.middleName,
        lastName: registrationData.lastName,
        address: registrationData.address,
        governmentId: registrationData.governmentId,
        validIdFront: validIdFrontUrl,
        validIdBack: validIdBackUrl,
        selfie: selfieUrl,
        selfieWithId: selfieWithIdUrl,
        phoneNumber: registrationData.phoneNumber,
        password: password,
        hashedPassword: hashedPassword,
        gender: registrationData.gender,
        civilStatus: registrationData.civilStatus,
        placeOfBirth: registrationData.placeOfBirth,
        age: registrationData.age,
        dateOfBirth: formatDate(new Date(registrationData.dateOfBirth)),
        dateCreated: formatDate(now),
        timeCreated: formatTime(now),
        status: 'pending',
        registrationFee: 5000,
        paymentStatus: registrationData.proofOfPayment ? 'paid' : 'unpaid'
      };

      // Add payment details if available
      if (registrationData.proofOfPayment) {
        userData.paymentProof = paymentProofUrl;
        userData.paymentOption = registrationData.paymentOption;
        userData.paymentAccountNumber = registrationData.accountNumber;
        userData.paymentDate = formatDate(now);
      }

      // Save to database
      const userRef = dbRef(database, `Registrations/RegistrationApplications/${sanitizedEmail}`);
      await set(userRef, userData);

      // Prepare API data (includes plain password for initial verification)
      const apiData = {
        ...userData,
        password: password
      };

      setSuccessModalVisible(true);
      
      // Make API call in background
      registerUser(apiData)
        .then(() => console.log('Registration API call completed'))
        .catch(err => console.error('API error:', err));
      
    } catch (error) {
      console.error('Registration error:', error);
      setErrorMessage('Registration submission failed. Please try again later.');
      setErrorModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessOk = () => {
    setSuccessModalVisible(false);
    navigation.navigate('Login');
  };

  const handleErrorOk = () => {
    setErrorModalVisible(false);
  };

  const Requirement = ({ met, label }) => (
    <View style={styles.requirementRow}>
      <MaterialIcons
        name={met ? "check-circle" : "radio-button-unchecked"}
        size={18}
        color={met ? "#4FE7AF" : "#B0B0B0"}
        style={{ marginRight: 6 }}
      />
      <Text style={[styles.requirementText, { color: met ? "#4FE7AF" : "#B0B0B0" }]}>
        {label}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={30} color="white" />
        </TouchableOpacity>
        
        <Text style={styles.title}>Create Password</Text>
        
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Password <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                placeholder="Enter Password"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry={!showPassword}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => confirmPasswordInput.current?.focus()}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword((prev) => !prev)}
              >
                <MaterialIcons 
                  name={showPassword ? "visibility" : "visibility-off"} 
                  size={24} 
                  color="#888" 
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.requirementsContainer}>
              <Requirement met={minLength} label="Minimum of 8 characters" />
              <Requirement met={hasSpecial} label="At least one special character" />
              <Requirement met={hasNumber} label="At least one numeric digit" />
              <Requirement 
                met={hasLower && hasUpper} 
                label="Includes both uppercase and lowercase letters" 
              />
            </View>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Confirm Password <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={styles.input}
                secureTextEntry={!showConfirmPassword}
                returnKeyType="done"
                ref={confirmPasswordInput}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword((prev) => !prev)}
              >
                <MaterialIcons 
                  name={showConfirmPassword ? "visibility" : "visibility-off"} 
                  size={24} 
                  color="#888" 
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.checkboxContainer}>
            <TouchableOpacity 
              onPress={() => setAgreed((prev) => !prev)} 
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={agreed ? "check-box" : "check-box-outline-blank"}
                size={24}
                color={agreed ? "#4FE7AF" : "#B0B0B0"}
              />
            </TouchableOpacity>
            <Text style={styles.checkboxLabel}>
              I agree to the{' '}
              <Text 
                style={styles.link} 
                onPress={() => navigation.navigate('Terms')}
              >
                Terms and Conditions
              </Text>{' '}
              and{' '}
              <Text 
                style={styles.link} 
                onPress={() => navigation.navigate('Privacy')}
              >
                Privacy Policy
              </Text>.
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              (password !== confirmPassword || !password || !confirmPassword || !agreed || loading) && 
                styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={
              password !== confirmPassword ||
              !password ||
              !confirmPassword ||
              !agreed ||
              loading
            }
          >
            <Text style={styles.buttonText}>Submit</Text>
          </TouchableOpacity>
        </View>

        {/* Success Modal */}
        <Modal visible={successModalVisible} transparent animationType="fade">
          <View style={styles.centeredModal}>
            <View style={styles.modalCard}>
              <MaterialIcons name="check-circle" size={40} color="#4CAF50" style={styles.modalIcon} />
              <Text style={styles.modalText}>
                Registration submitted successfully! You will be notified once your account is approved.
              </Text>
              <TouchableOpacity 
                style={styles.modalButton} 
                onPress={handleSuccessOk}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Error Modal */}
        <Modal visible={errorModalVisible} transparent animationType="fade">
          <View style={styles.centeredModal}>
            <View style={styles.modalCard}>
              <MaterialIcons name="error" size={40} color="#f44336" style={styles.modalIcon} />
              <Text style={styles.modalText}>{errorMessage}</Text>
              <TouchableOpacity style={styles.modalButton} onPress={handleErrorOk}>
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#4FE7AF" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#2C5282',
  },
  formContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    flexGrow: 1,
    paddingStart: 40,
    paddingEnd: 40,
    paddingBottom: 40,
    marginTop: 30,
    minHeight: 300,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 80,
    textAlign: 'center',
    color: 'white',
  },
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: 'black',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    flex: 1,
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  eyeIcon: {
    position: 'absolute',
    right: 10,
    padding: 4,
  },
  requirementsContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  requirementText: {
    fontSize: 14,
  },
  button: {
    backgroundColor: '#4FE7AF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 10,
    width: '50%',
    alignSelf: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  buttonText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
  },
  required: {
    color: 'red',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 15,
    color: 'black',
  },
  link: {
    color: '#007BFF',
    textDecorationLine: 'underline',
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
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#2C5282',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
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

export default CreatePasswordPage;