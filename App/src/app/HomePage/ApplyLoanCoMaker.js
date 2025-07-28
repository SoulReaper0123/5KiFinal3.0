import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

export default function ApplyLoanCoMaker() {
  const navigation = useNavigation();

  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    membershipId: '',
    email: '',
    loanAmount: '',
    repaymentTerm: '',
    disbursementMethod: '',
    accountName: '',
    accountNumber: '',
    agreed: false,
  });

  const handleChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleSubmit = () => {
    if (!formData.agreed) {
      Alert.alert('Please agree to the declaration before submitting.');
      return;
    }
    console.log('Form Submitted:', formData);
    Alert.alert('Success', 'Loan application submitted successfully!');
    // Send data to backend/Firebase here
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={30} color="white" />
      </TouchableOpacity>

      {/* Header Title */}
      <Text style={styles.title}>Apply Loan as a Co-owner</Text>

      {/* White Rounded Container */}
      <View style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>
            As a co-owner, you're eligible to apply for loans based on your membership and account history.
          </Text>

          {[ // Form fields
            { key: 'firstName', placeholder: 'First Name' },
            { key: 'middleName', placeholder: 'Middle Name' },
            { key: 'lastName', placeholder: 'Last Name' },
            { key: 'membershipId', placeholder: 'Membership ID' },
            { key: 'email', placeholder: 'Email' },
            { key: 'loanAmount', placeholder: 'Loan Amount' },
            { key: 'repaymentTerm', placeholder: 'Repayment Term' },
            { key: 'disbursementMethod', placeholder: 'Disbursement Method' },
            { key: 'accountName', placeholder: 'Account Name' },
            { key: 'accountNumber', placeholder: 'Account Number' },
          ].map((item) => (
            <TextInput
              key={item.key}
              style={styles.input}
              placeholder={item.placeholder}
              value={formData[item.key]}
              onChangeText={(text) => handleChange(item.key, text)}
            />
          ))}

          {/* Checkbox */}
          <TouchableOpacity
            onPress={() => handleChange('agreed', !formData.agreed)}
            style={styles.checkboxWrapper}
          >
            <MaterialIcons
              name={formData.agreed ? 'check-box' : 'check-box-outline-blank'}
              size={24}
              color={formData.agreed ? '#2D5783' : '#888'}
            />
            <Text style={styles.checkboxText}>
              I hereby declare that all the information I have provided is accurate and complete. I agree and wish to proceed with my application.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#2D5783',
  },
  backButton: {
    marginTop: 40,
    marginStart: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: 'white',
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
  subtitle: {
    fontSize: 13,
    color: '#4B6E91',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  checkboxWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    marginTop: 10,
  },
  checkboxText: {
    flex: 1,
    fontSize: 12,
    marginLeft: 8,
    marginTop: Platform.OS === 'ios' ? 6 : 2,
    color: '#444',
  },
  submitButton: {
    backgroundColor: '#00c853',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
