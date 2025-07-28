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
import Icon from 'react-native-vector-icons/MaterialIcons';

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

  const navigation = useNavigation();

  const middleNameInput = useRef(null);
  const lastNameInput = useRef(null);
  const emailInput = useRef(null);
  const phoneNumberInput = useRef(null);
  const addressInput = useRef(null);
  const placeOfBirthInput = useRef(null);

  useEffect(() => {
    const handleBackPress = () => {
      navigation.navigate('Login');
      return true;
    };
  
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
  
    return () => backHandler.remove(); // ✅ modern remove
  }, [navigation]);

  useEffect(() => {
    if (dateOfBirth) {
      const currentYear = new Date().getFullYear();
      const birthYear = dateOfBirth.getFullYear();
      setAge(currentYear - birthYear);
    }
  }, [dateOfBirth]);

  // Update isFormComplete to NOT require middleName
const isFormComplete = () => {
  return (
    firstName &&
    lastName &&
    email &&
    phoneNumber &&
    gender &&
    civilStatus &&
    placeOfBirth &&
    address &&
    governmentId &&
    age >= 21
  );
};

  const handleNext = () => {
    if (!firstName || !lastName || !email || !phoneNumber || !gender || !civilStatus || !placeOfBirth || !address) {
      Alert.alert('Incomplete Form', 'Please fill in all required fields before proceeding.');
      return;
    }

    if (!email.includes('@') || !email.endsWith('.com')) {
      Alert.alert('Invalid Email', 'Please provide a valid email address (e.g., example@domain.com).');
      return;
    }

    if (phoneNumber.length < 11) {
      Alert.alert('Invalid Phone Number', 'Phone numbers should be at least 11 digits long.');
      return;
    }
    if (age < 21) {
      Alert.alert('Age Restriction', 'You must be at least 21 years old to register.');
      return;
    }

    // Show confirmation alert before navigating
    Alert.alert(
      'Verify Your Information',
      'Please double-check all the information you have provided. Make sure everything is accurate before proceeding.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Proceed', onPress: () => {
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
              governmentId,
            });
          }
        }
      ]
    );
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
  ];

  const civilStatusOptions = [
    { key: 'Single', label: 'Single' },
    { key: 'Married', label: 'Married' },
    { key: 'Widowed', label: 'Widowed' },
    { key: 'Separated', label: 'Separated' },
  ];
    
 const governmentIdOptions = [
  {
    key: 'message',
    section: true,
    label: '',
    component: (
      <View
        style={{
          paddingVertical: 10,
          paddingHorizontal: 12,
          backgroundColor: '#E2ECF8', // softer blue tone
          borderRadius: 8,
          marginBottom: 8,
        }}
      >
        <Text
          style={{
            color: '#1A365D', // deeper blue for contrast
            fontWeight: '600',
            fontSize: 15,
            lineHeight: 22,
          }}
        >
          Kindly choose the type of government-issued ID you will be using to proceed with your registration.
        </Text>
      </View>
    ),
  },
  { key: 'national', label: 'National ID (PhilSys)' },
  { key: 'sss', label: 'SSS ID' },
  { key: 'philhealth', label: 'PhilHealth ID' },
  { key: 'drivers_license', label: 'Driver’s License' },
];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { flexGrow: 1 }]} // Ensure flexGrow is applied
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={30} color="white" />
        </TouchableOpacity>

        <Text style={styles.title}>Register</Text>

        <View style={styles.formContainer}>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>First Name <Text style={styles.required}>*</Text> </Text>
          <TextInput
            placeholder="Enter First Name"
            value={firstName}
            onChangeText={setFirstName}
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
            cancelText="Cancel" // Capital C
            onChange={(option) => setGender(option.key)}
            style={styles.picker}
            selectStyle={styles.pickerWithIcon}
          >
            <View style={styles.pickerContent}>
              <Text style={[styles.pickerText, gender ? styles.selectedText : styles.placeholderText]}>
                {gender || 'Select Gender'}
              </Text>
              <Icon name="arrow-drop-down" size={24} color={gender ? '#000' : 'grey'} style={styles.pickerIcon} />
            </View>
          </ModalSelector>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Date of Birth <Text style={styles.required}>*</Text> </Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInput}>
            <Text style={[styles.dateText, dateOfBirth.toDateString() !== new Date().toDateString() ? { color: 'black' } : { color: 'grey' }]}>
              {dateText}
            </Text>
            <Icon name="calendar-today" size={24} color="grey" style={styles.calendarIcon} />
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
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Place of Birth <Text style={styles.required}>*</Text> </Text>
          <TextInput
            placeholder="Enter Place of Birth"
            value={placeOfBirth}
            onChangeText={setPlaceOfBirth}
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
            cancelText="Cancel" // Capital C
            onChange={(option) => setCivilStatus(option.key)}
            style={styles.picker}
            selectStyle={styles.pickerWithIcon}
          >
            <View style={styles.pickerContent}>
              <Text style={[styles.pickerText, civilStatus ? styles.selectedText : styles.placeholderText]}>
                {civilStatus || 'Select Civil Status'}
              </Text>
              <Icon name="arrow-drop-down" size={24} color={civilStatus ? '#000' : 'grey'} style={styles.pickerIcon} />
            </View>
          </ModalSelector>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email <Text style={styles.required}>*</Text> </Text>
          <TextInput
            placeholder="example@domain.com"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            returnKeyType="next"
            blurOnSubmit={false}
            ref={emailInput}
            onSubmitEditing={() => phoneNumberInput.current?.focus()}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone Number <Text style={styles.required}>*</Text> </Text>
          <TextInput
            placeholder="Enter Phone Number"
            value={phoneNumber}
            onChangeText={handlePhoneNumberChange}
            style={styles.input}
            keyboardType="phone-pad"
            returnKeyType="next"
            blurOnSubmit={false}
            ref={phoneNumberInput}
            onSubmitEditing={() => passwordInput.current?.focus()}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Government ID <Text style={styles.required}>*</Text></Text>
          <ModalSelector
            data={governmentIdOptions}
            initValue="Select Government ID"
            cancelText="Cancel" // This will show "Cancel" with a capital C
            onChange={(option) => {
              if (option.key !== 'message') setGovernmentId(option.label);
            }}
            style={styles.picker}
            selectStyle={styles.pickerWithIcon}
            optionTextStyle={{ fontSize: 16, color: '#222' }}
            optionContainerStyle={{ backgroundColor: '#fff' }}
          >
            <View style={styles.pickerContent}>
              <Text style={[
                styles.pickerText,
                governmentId ? styles.selectedText : styles.placeholderText
              ]}>
                {governmentId || 'Select Government ID'}
              </Text>
              <Icon name="arrow-drop-down" size={24} color={governmentId ? '#000' : 'grey'} style={styles.pickerIcon} />
            </View>
          </ModalSelector>
        </View>

        <TouchableOpacity
          style={[
            styles.nextButton,
            { backgroundColor: isFormComplete() ? '#4FE7AF' : '#B0B0B0' }
          ]}
          onPress={handleNext}
          disabled={!isFormComplete()}
        >
          <Text style={styles.nextButtonText}>Next</Text>
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
    flexGrow: 1, // To make it take the full height up to the bottom
    paddingStart: 40,
    paddingEnd: 40,
    paddingTop: 40,
    paddingBottom: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 80,
    textAlign: 'center',
    color: 'white',
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
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  pickerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  pickerText: {
    fontSize: 16,
  },
  pickerWithIcon: {
    paddingVertical: 5,
  },
  pickerIcon: {
    marginLeft: 10,
  },
  selectedText: {
    color: '#000',
  },
  placeholderText: {
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
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
  nextButton: {
    backgroundColor: '#4FE7AF', // Change color as needed
    borderRadius: 10, // Adjust the border radius
    paddingVertical: 10, // Adjust padding
    paddingHorizontal: 20, // Adjust padding
    alignItems: 'center', // Center text
    marginTop: 10, // Add margin if needed
    width: '50%',
    alignSelf: 'center',
  },
  nextButtonText: {
    color: 'black', // Text color
    fontSize: 18, // Font size
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
    color: '#4FE7AF', // Change to your preferred color
    fontWeight: 'bold',
  },
  required: {
  color: 'red',
},

});

export default RegisterPage;