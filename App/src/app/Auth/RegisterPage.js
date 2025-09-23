import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  Button,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import ModalSelector from 'react-native-modal-selector';
import { getDatabase, ref, get } from 'firebase/database';
import CustomConfirmModal from '../../components/CustomConfirmModal';

// RadioButton component
const RadioButton = ({ selected, onPress }) => (
  <TouchableOpacity 
    onPress={onPress} 
    style={[
      styles.radioButton,
      selected && styles.radioButtonSelected
    ]}
  >
    {selected && <View style={styles.radioButtonInner} />}
  </TouchableOpacity>
);

const RegisterPage = () => {
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('');
  const [civilStatus, setCivilStatus] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [age, setAge] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateText, setDateText] = useState('Select Date of Birth');
  const [governmentId, setGovernmentId] = useState('');
  const [isOtherGovernmentId, setIsOtherGovernmentId] = useState(false);
  const [otherGovernmentId, setOtherGovernmentId] = useState('');
  const [attendedOrientation, setAttendedOrientation] = useState(false);
  const [orientationCode, setOrientationCode] = useState('');
  const [validOrientationCode, setValidOrientationCode] = useState('');
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Optional Employment fields
  const [occupation, setOccupation] = useState('');
  const [employer, setEmployer] = useState('');
  const [employmentAddress, setEmploymentAddress] = useState('');
  const [employmentContactNo, setEmploymentContactNo] = useState('');
  
  // Error states
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneNumberError, setPhoneNumberError] = useState('');
  const [genderError, setGenderError] = useState('');
  const [civilStatusError, setCivilStatusError] = useState('');
  const [placeOfBirthError, setPlaceOfBirthError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [governmentIdError, setGovernmentIdError] = useState('');
  const [ageError, setAgeError] = useState('');
  const [orientationError, setOrientationError] = useState('');

  const navigation = useNavigation();

  const middleNameInput = useRef(null);
  const lastNameInput = useRef(null);
  const emailInput = useRef(null);
  const phoneNumberInput = useRef(null);
  const addressInput = useRef(null);
  const placeOfBirthInput = useRef(null);
  const orientationCodeInput = useRef(null);
  // Optional Employment refs
  const occupationInput = useRef(null);
  const employerInput = useRef(null);
  const employmentAddressInput = useRef(null);
  const employmentContactInput = useRef(null);

  useEffect(() => {
    const handleBackPress = () => {
      navigation.navigate('Login');
      return true;
    };
  
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
  
    return () => backHandler.remove();
  }, [navigation]);

  useEffect(() => {
    if (dateOfBirth) {
      // Calculate accurate age considering full date
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      
      // Check if birthday hasn't occurred this year yet
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      
      setAge(calculatedAge);
      validateAge(calculatedAge);
    }
  }, [dateOfBirth]);

  // Fetch the valid orientation code from Firebase
  useEffect(() => {
    const fetchOrientationCode = async () => {
      try {
        const db = getDatabase();
        const orientationRef = ref(db, 'Settings/OrientationCode');
        const snapshot = await get(orientationRef);
        
        if (snapshot.exists()) {
          setValidOrientationCode(snapshot.val());
        }
      } catch (error) {
        console.error('Error fetching orientation code:', error);
      }
    };

    fetchOrientationCode();
  }, []);

  // Validation functions
  const validateFirstName = (value) => {
    if (!value || !value.trim()) {
      setFirstNameError('First name is required');
      return false;
    }
    setFirstNameError('');
    return true;
  };

  const validateLastName = (value) => {
    if (!value || !value.trim()) {
      setLastNameError('Last name is required');
      return false;
    }
    setLastNameError('');
    return true;
  };

  const validateEmail = (value) => {
    const email = (value || '').trim();
    if (!email) {
      setEmailError(''); // No "is required" message
      return true; // Don't block form on empty; rely on asterisk and final check
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address (e.g., name@example.com)');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePhoneNumber = (value) => {
    const digits = String(value || '').replace(/\D/g, '');
    if (!digits) {
      setPhoneNumberError(''); // No "is required" message
      return true; // Don't block form on empty; rely on asterisk and final check
    }
    if (digits.length < 11) {
      setPhoneNumberError('Phone number should be at least 11 digits');
      return false;
    }
    setPhoneNumberError('');
    return true;
  };

  const validateGender = (value) => {
    if (!value) {
      setGenderError('Gender is required');
      return false;
    }
    setGenderError('');
    return true;
  };

  const validateCivilStatus = (value) => {
    if (!value) {
      setCivilStatusError('Civil status is required');
      return false;
    }
    setCivilStatusError('');
    return true;
  };

  const validatePlaceOfBirth = (value) => {
    setPlaceOfBirthError('');
    return true;
  };

  const validateAddress = (value) => {
    if (!value || !value.trim()) {
      setAddressError('Address is required');
      return false;
    }
    setAddressError('');
    return true;
  };

  const validateGovernmentId = (value) => {
    // If "Other" is selected, ensure the custom text is provided
    if (isOtherGovernmentId) {
      if (!otherGovernmentId || !otherGovernmentId.trim()) {
        setGovernmentIdError('Please specify your government ID');
        return false;
      }
      setGovernmentIdError('');
      return true;
    }

    // Otherwise validate the selected option
    if (!value || !String(value).trim()) {
      setGovernmentIdError('Government ID is required');
      return false;
    }
    setGovernmentIdError('');
    return true;
  };

  const validateAge = (ageValue) => {
    if (!ageValue || ageValue < 21) {
      setAgeError('You must be at least 21 years old to register');
      return false;
    }
    setAgeError('');
    return true;
  };

  const validateOrientation = () => {
    if (!attendedOrientation) {
      setOrientationError('You are required to attend the Orientation');
      return false;
    }
    if (attendedOrientation && (!orientationCode || orientationCode !== validOrientationCode)) {
      setOrientationError('Please enter a valid orientation code');
      return false;
    }
    setOrientationError('');
    return true;
  };

  // Real-time validation effect
  useEffect(() => {
    validateFirstName(firstName);
  }, [firstName]);

  useEffect(() => {
    validateLastName(lastName);
  }, [lastName]);

  useEffect(() => {
    validateEmail(email);
  }, [email]);

  useEffect(() => {
    validatePhoneNumber(phoneNumber);
  }, [phoneNumber]);

  useEffect(() => {
    validateGender(gender);
  }, [gender]);

  useEffect(() => {
    validateCivilStatus(civilStatus);
  }, [civilStatus]);

  useEffect(() => {
    validatePlaceOfBirth(placeOfBirth);
  }, [placeOfBirth]);

  useEffect(() => {
    validateAddress(address);
  }, [address]);

  useEffect(() => {
    validateGovernmentId(governmentId);
  }, [governmentId]);

  useEffect(() => {
    validateAge(age);
  }, [age]);

  useEffect(() => {
    validateOrientation();
  }, [attendedOrientation, orientationCode]);

  const isFormComplete = () => {
    const hasNoErrors = !firstNameError && !lastNameError && !emailError && 
                       !phoneNumberError && !genderError && !civilStatusError && 
                       !placeOfBirthError && !addressError && !governmentIdError && 
                       !ageError && !orientationError;
    
    // Optional employment fields are NOT required for completeness
    const basicInfoComplete = firstName && lastName && email && phoneNumber && 
                             gender && civilStatus && placeOfBirth && address && 
                             (isOtherGovernmentId ? otherGovernmentId : governmentId) && age >= 21;
    
    const orientationComplete = attendedOrientation ? 
      (orientationCode && orientationCode === validOrientationCode) : true;
    
    return hasNoErrors && basicInfoComplete && orientationComplete;
  };

  const validateOrientationCode = async () => {
    if (!orientationCode) {
      Alert.alert('Error', 'Please enter an orientation code');
      return false;
    }

    setIsCheckingCode(true);
    try {
      const db = getDatabase();
      const orientationRef = ref(db, 'Settings/OrientationCode');
      const snapshot = await get(orientationRef);

      if (!snapshot.exists()) {
        Alert.alert('Error', 'Orientation system not configured. Please contact support.');
        setIsCheckingCode(false);
        return false;
      }

      const validCode = snapshot.val();
      setIsCheckingCode(false);
      
      if (orientationCode !== validCode) {
        Alert.alert('Invalid Code', 'The orientation code you entered is incorrect. Please try again or contact support.');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating orientation code:', error);
      setIsCheckingCode(false);
      Alert.alert('Error', 'Failed to validate orientation code. Please try again.');
      return false;
    }
  };

  const handleProceedToNext = () => {
    const dateOfBirthISO = dateOfBirth.toISOString();
    navigation.navigate('Register2', {
      firstName,
      middleName,
      lastName,
      email,
      phoneNumber,
      gender,
      civilStatus,
      placeOfBirth,
      address,
      age,
      dateOfBirth: dateOfBirthISO,
      governmentId: isOtherGovernmentId ? otherGovernmentId : governmentId,
      attendedOrientation,
      orientationCode,
      // Optional employment fields
      occupation: occupation || null,
      employer: employer || null,
      employmentAddress: employmentAddress || null,
      employmentContactNo: employmentContactNo || null,
    });
  };

  const handleNext = async () => {
    // Validate all fields
    const validations = [
      validateFirstName(firstName),
      validateLastName(lastName),
      validateEmail(email),
      validatePhoneNumber(phoneNumber),
      validateGender(gender),
      validateCivilStatus(civilStatus),
      validatePlaceOfBirth(placeOfBirth),
      validateAddress(address),
      validateGovernmentId(governmentId),
      validateAge(age),
      validateOrientation()
    ];

    // Check if all validations passed
    const isAllValid = validations.every(isValid => isValid === true);
    
    if (!isAllValid) {
      return; // Don't proceed if there are validation errors
    }

    // Orientation code validation if attended
    if (attendedOrientation && orientationCode !== validOrientationCode) {
      const isValidCode = await validateOrientationCode();
      if (!isValidCode) return;
    }

    // Show custom confirmation modal before navigating
    setShowConfirmModal(true);
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || dateOfBirth;
    setShowDatePicker(Platform.OS === 'ios');
    setDateOfBirth(currentDate);
    setDateText(currentDate.toDateString());
  };

  const handlePhoneNumberChange = (text) => {
    if (text.length <= 11) {
      setPhoneNumber(text);
    }
  };

  const genderOptions = [
    { key: 'Male', label: 'Male' },
    { key: 'Female', label: 'Female' },
    { key: 'Prefer not to say', label: 'Prefer not to say' },
  ];

  const civilStatusOptions = [
    { key: 'Single', label: 'Single' },
    { key: 'Married', label: 'Married' },
    { key: 'Widowed', label: 'Widowed' },
    { key: 'Separated', label: 'Separated' },
  ];
    
  const governmentIdOptions = [
    { key: 'national', label: 'National ID (PhilSys)' },
    { key: 'sss', label: 'SSS ID' },
    { key: 'philhealth', label: 'PhilHealth ID' },
    { key: 'drivers_license', label: 'Drivers License' },
    { key: 'other', label: 'Other' },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { flexGrow: 1 }]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={28} color="#0F172A" />
        </TouchableOpacity>

        <View style={{ marginBottom: 16 }}>
          <Text style={styles.title}>Basic Information</Text>
          <Text style={styles.subLabel}>Step 1 of 5 • Tell us about you</Text>
          <View style={{ height: 6, backgroundColor: '#E5E7EB', borderRadius: 999, marginTop: 8 }}>
            <View style={{ width: '20%', height: 6, backgroundColor: '#1E3A5F', borderRadius: 999 }} />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>First Name <Text style={styles.required}>*</Text> </Text>
            <TextInput
              placeholder="Enter First Name"
              value={firstName}
              onChangeText={setFirstName}
              onBlur={() => validateFirstName(firstName)}
              style={styles.input}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => middleNameInput.current?.focus()}
            />

          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Middle Name</Text>
            <TextInput
              placeholder="Enter Middle Name"
              value={middleName}
              onChangeText={setMiddleName}
              style={styles.input}
              returnKeyType="next"
              blurOnSubmit={false}
              ref={middleNameInput}
              onSubmitEditing={() => lastNameInput.current?.focus()}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Last Name <Text style={styles.required}>*</Text> </Text>
            <TextInput
              placeholder="Enter Last Name"
              value={lastName}
              onChangeText={setLastName}
              onBlur={() => validateLastName(lastName)}
              style={styles.input}
              returnKeyType="next"
              blurOnSubmit={false}
              ref={lastNameInput}
              onSubmitEditing={() => placeOfBirthInput.current?.focus()}
            />

          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Gender <Text style={styles.required}>*</Text> </Text>
            <ModalSelector
              data={genderOptions}
              initValue="Select Gender"
              cancelText="Cancel"
              onChange={(option) => {
                setGender(option.key);
                validateGender(option.key);
              }}
              style={styles.picker}
              modalStyle={{ justifyContent: 'flex-end', margin: 0 }}
              overlayStyle={{ justifyContent: 'flex-end' }}
            >
              <TouchableOpacity style={styles.pickerContainer}>
                <Text style={styles.pickerText}>
                  {gender || 'Select Gender'}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="black" />
              </TouchableOpacity>
            </ModalSelector>

          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Date of Birth <Text style={styles.required}>*</Text> </Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInput}>
              <Text style={[styles.dateText, dateOfBirth.toDateString() !== new Date().toDateString() ? { color: 'black' } : { color: 'grey' }]}>
                {dateText}
              </Text>
              <MaterialIcons name="calendar-today" size={24} color="grey" style={styles.calendarIcon} />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                testID="dateTimePicker"
                value={dateOfBirth}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              placeholder="Age"
              value={age.toString()}
              onChangeText={text => setAge(text)}
              style={styles.input}
              keyboardType="numeric"
              editable={false}
            />
            {ageError ? <Text style={styles.errorText}>{ageError}</Text> : null}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Place of Birth <Text style={styles.required}>*</Text> </Text>
            <TextInput
              placeholder="Enter Place of Birth"
              value={placeOfBirth}
              onChangeText={setPlaceOfBirth}
              onBlur={() => validatePlaceOfBirth(placeOfBirth)}
              style={styles.input}
              returnKeyType="next"
              blurOnSubmit={false}
              ref={placeOfBirthInput}
              onSubmitEditing={() => addressInput.current?.focus()}
            />

          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Current Address <Text style={styles.required}>*</Text> </Text>
            <TextInput
              placeholder="Enter Address"
              value={address}
              onChangeText={setAddress}
              onBlur={() => validateAddress(address)}
              style={styles.input}
              returnKeyType="next"
              blurOnSubmit={false}
              ref={addressInput}
              onSubmitEditing={() => emailInput.current?.focus()}
            />

          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Civil Status <Text style={styles.required}>*</Text> </Text>
            <ModalSelector
              data={civilStatusOptions}
              initValue="Select Civil Status"
              cancelText="Cancel"
              onChange={(option) => {
                setCivilStatus(option.key);
                validateCivilStatus(option.key);
              }}
              style={styles.picker}
              modalStyle={{ justifyContent: 'flex-end', margin: 0 }}
              overlayStyle={{ justifyContent: 'flex-end' }}
            >
              <TouchableOpacity style={styles.pickerContainer}>
                <Text style={styles.pickerText}>
                  {civilStatus || 'Select Civil Status'}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="black" />
              </TouchableOpacity>
            </ModalSelector>

          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email <Text style={styles.required}>*</Text> </Text>
            <TextInput
              placeholder="example@domain.com"
              value={email}
              onChangeText={setEmail}
              onBlur={() => validateEmail(email)}
              style={styles.input}
              keyboardType="email-address"
              returnKeyType="next"
              blurOnSubmit={false}
              ref={emailInput}
              onSubmitEditing={() => phoneNumberInput.current?.focus()}
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number <Text style={styles.required}>*</Text> </Text>
            <TextInput
              placeholder="Enter Phone Number"
              value={phoneNumber}
              onChangeText={(text) => {
                handlePhoneNumberChange(text);
                validatePhoneNumber(text);
              }}
              onBlur={() => validatePhoneNumber(phoneNumber)}
              style={styles.input}
              keyboardType="phone-pad"
              returnKeyType="next"
              blurOnSubmit={false}
              ref={phoneNumberInput}
              onSubmitEditing={() => occupationInput.current?.focus()}
            />
            {phoneNumberError ? <Text style={styles.errorText}>{phoneNumberError}</Text> : null}
          </View>

          {/* Optional Employment Section */}
          <View style={{ marginTop: 10, marginBottom: 6 }}>
            <Text style={[styles.subLabel, { fontWeight: '600', color: '#334155' }]}>Employment (Optional)</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Occupation</Text>
            <TextInput
              placeholder="Enter Occupation"
              value={occupation}
              onChangeText={setOccupation}
              style={styles.input}
              returnKeyType="next"
              blurOnSubmit={false}
              ref={occupationInput}
              onSubmitEditing={() => employerInput.current?.focus()}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Employer</Text>
            <TextInput
              placeholder="Enter Employer"
              value={employer}
              onChangeText={setEmployer}
              style={styles.input}
              returnKeyType="next"
              blurOnSubmit={false}
              ref={employerInput}
              onSubmitEditing={() => employmentAddressInput.current?.focus()}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              placeholder="Enter Employer Address"
              value={employmentAddress}
              onChangeText={setEmploymentAddress}
              style={styles.input}
              returnKeyType="next"
              blurOnSubmit={false}
              ref={employmentAddressInput}
              onSubmitEditing={() => employmentContactInput.current?.focus()}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contact No.</Text>
            <TextInput
              placeholder="Enter Employer Contact No."
              value={employmentContactNo}
              onChangeText={setEmploymentContactNo}
              style={styles.input}
              keyboardType="phone-pad"
              returnKeyType="done"
              ref={employmentContactInput}
              onSubmitEditing={() => Keyboard.dismiss()}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Government ID <Text style={styles.required}>*</Text></Text>
            <ModalSelector
              data={governmentIdOptions}
              initValue="Select Government ID"
              cancelText="Cancel"
              onChange={(option) => {
                const isOther = option.key === 'other';
                setIsOtherGovernmentId(isOther);
                if (isOther) {
                  setGovernmentId('Other');
                  setOtherGovernmentId('');
                } else {
                  setGovernmentId(option.label);
                  setOtherGovernmentId('');
                }
                validateGovernmentId(isOther ? otherGovernmentId : option.label);
              }}
              style={styles.picker}
              modalStyle={{ justifyContent: 'flex-end', margin: 0 }}
              overlayStyle={{ justifyContent: 'flex-end' }}
            >
              <TouchableOpacity style={styles.pickerContainer}>
                <Text style={styles.pickerText}>
                  {isOtherGovernmentId ? `Other: ${otherGovernmentId || ''}` : (governmentId || 'Select Government ID')}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="black" />
              </TouchableOpacity>
            </ModalSelector>
            {isOtherGovernmentId && (
              <View style={{ marginTop: 8 }}>
                <TextInput
                  placeholder="Please specify your Government ID"
                  value={otherGovernmentId}
                  onChangeText={(text) => {
                    setOtherGovernmentId(text);
                    // Keep the main field in sync for form completeness checks
                    setGovernmentId(text);
                    validateGovernmentId(text);
                  }}
                  style={styles.input}
                />
              </View>
            )}
            {governmentIdError ? <Text style={styles.errorText}>{governmentIdError}</Text> : null}
          </View>

          <View style={styles.radioContainer}>
            <Text style={styles.radioLabel}>
              Have you attended the Orientation Conducted by the Company? <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.radioGroup}>
              <View style={styles.radioOption}>
                <RadioButton 
                  selected={attendedOrientation} 
                  onPress={() => {
                    setAttendedOrientation(true);
                    setOrientationError(''); // Clear any existing error
                  }} 
                />
                <Text style={styles.radioOptionText}>Yes</Text>
              </View>
              <View style={styles.radioOption}>
                <RadioButton 
                  selected={!attendedOrientation} 
                  onPress={() => {
                    setAttendedOrientation(false);
                    setOrientationError(''); // Clear any existing error
                  }} 
                />
                <Text style={styles.radioOptionText}>No</Text>
              </View>
            </View>
            
            {/* Note at the bottom of options */}
            <View style={styles.orientationNote}>
              <Text style={styles.orientationNoteText}>
                <Text style={styles.noteIcon}>ℹ️</Text> Note: Orientation attendance is required to proceed with registration.
              </Text>
            </View>
            
            {/* Show explanation when "No" is selected */}
            {attendedOrientation === false && (
              <View style={styles.noOrientationWarning}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <View style={styles.warningTextContainer}>
                  <Text style={styles.warningTitle}>Cannot Proceed with Registration</Text>
                  <Text style={styles.warningText}>
                    You must attend the company orientation before you can complete your registration. 
                    Please contact the company to schedule your orientation session.
                  </Text>
                  <Text style={styles.warningSubText}>
                    Once you have attended the orientation, you will receive a code that allows you to continue with the registration process.
                  </Text>
                </View>
              </View>
            )}
          </View>

          {attendedOrientation && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Orientation Code <Text style={styles.required}>*</Text></Text>
              <TextInput
                placeholder="Enter Orientation Code"
                value={orientationCode}
                onChangeText={(text) => {
                  setOrientationCode(text);
                  // Clear any existing orientation error when user starts typing
                  if (orientationError) {
                    setOrientationError('');
                  }
                  // Auto-validate when the code matches the length of the valid code
                  if (text.length === validOrientationCode?.length) {
                    validateOrientation();
                    // If code is valid, show proceed dialog automatically
                    if (text === validOrientationCode) {
                      // Small delay to allow the UI to update with the valid indicator
                      setTimeout(() => {
                        if (isFormComplete()) {
                          handleNext();
                        }
                      }, 500);
                    }
                  }
                }}
                onBlur={() => validateOrientation()}
                style={[
                  styles.input,
                  orientationCode && validOrientationCode && orientationCode === validOrientationCode ? 
                    styles.validInput : 
                    (orientationCode && validOrientationCode && orientationCode !== validOrientationCode ? 
                      styles.invalidInput : null)
                ]}
                returnKeyType="done"
                ref={orientationCodeInput}
              />
              {isCheckingCode && <Text style={styles.checkingText}>Verifying code...</Text>}
              {orientationCode && validOrientationCode && orientationCode === validOrientationCode && (
                <Text style={styles.validText}>✓ Valid orientation code</Text>
              )}
              {orientationCode && validOrientationCode && orientationCode !== validOrientationCode && (
                <Text style={styles.invalidText}>✗ Invalid orientation code</Text>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.primaryButton,
              !isFormComplete() && styles.buttonDisabled
            ]}
            onPress={handleNext}
            disabled={!isFormComplete()}
          >
            <Text style={styles.primaryButtonText}>Next</Text>
          </TouchableOpacity>
          
          <View style={styles.loginRedirect}>
            <Text style={styles.loginRedirectText}>
              Already have an account? 
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.loginRedirectText, styles.loginText]}>
                Login Here
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Custom Confirmation Modal */}
      <CustomConfirmModal
        visible={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Verify Your Information"
        message="Please double-check all the information you have provided. Make sure everything is accurate before proceeding."
        type="info"
        cancelText="Cancel"
        confirmText="Proceed"
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={() => {
          setShowConfirmModal(false);
          handleProceedToNext();
        }}
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
  formContainer: {
    // deprecated in favor of card style
  },
  card: {
    backgroundColor: '#FFFFFF',
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
    marginBottom: 5,
    color: 'black',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  inputContainer: {
    marginBottom: 15,
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
  dateInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 16,
  },
  calendarIcon: {
    marginLeft: 10,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    marginTop: 20,
  },
  // Primary button style (shared)
  primaryButton: {
    backgroundColor: '#1E3A5F',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 12,
    width: '100%',
    alignSelf: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    backgroundColor: '#94A3B8',
  },
  loginRedirect: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginRedirectText: {
    color: 'black',
    paddingHorizontal: 3,
  },
  loginText: {
    color: '#1E3A5F',
    fontWeight: '700',
  },
  required: {
    color: 'red',
  },
  radioContainer: {
    marginBottom: 15,
    marginTop: 10,
  },
  radioLabel: {
    fontSize: 16,
    color: 'black',
    marginBottom: 8,
  },
  radioGroup: {
    flexDirection: 'row',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  radioOptionText: {
    marginLeft: 8,
    fontSize: 16,
    color: 'black',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#1E3A5F',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1E3A5F',
  },
  checkingText: {
    color: '#666',
    fontSize: 14,
    marginTop: 5,
  },
  validText: {
    color: 'green',
    fontSize: 14,
    marginTop: 5,
  },
  invalidText: {
    color: 'red',
    fontSize: 14,
    marginTop: 5,
  },
  validInput: {
    borderColor: 'green',
    borderWidth: 1.5,
  },
  invalidInput: {
    borderColor: 'red',
    borderWidth: 1.5,
  },
  orientationNote: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#E8F4FD',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  orientationNoteText: {
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20,
  },
  noteIcon: {
    fontSize: 16,
    marginRight: 5,
  },
  noOrientationWarning: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 10,
    marginTop: 2,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#BF360C',
    lineHeight: 20,
    marginBottom: 8,
  },
  warningSubText: {
    fontSize: 13,
    color: '#8D6E63',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  errorInput: {
    borderColor: 'red',
    borderWidth: 1.5,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 2,
  },
});

export default RegisterPage;