import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const Terms = () => {
  const navigation = useNavigation(); // Use the navigation hook

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()} // Go back to the previous screen
      >
        <MaterialIcons name="arrow-back" size={30} color="black" />
      </TouchableOpacity>
        <Text style={styles.title}>Terms and Conditions</Text>

        <Text style={styles.paragraph}>
          Welcome to 5KI Financial Services! By using our platform, you agree to abide by the following terms and conditions.
          Please read them carefully.
        </Text>
        <Text style={styles.heading}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By accessing or using our loan system services ("5KI Financial Services"), you acknowledge that you have read, understood,
          and agree to be bound by these Terms and Conditions. If you do not agree, you must not use the Service.
        </Text>
        <Text style={styles.heading}>2. Eligibility</Text>
        <Text style={styles.paragraph}>
          To be eligible for a loan, you must be at least 18 years old, provide valid identification, and agree to
          undergo credit assessments.
        </Text>
        <Text style={styles.heading}>3. Loan Terms</Text>
        <Text style={styles.paragraph}>
          Loan amounts, interest rates, and repayment schedules are subject to approval. Late payments may result in 
          penalties or additional charges.
        </Text>
        <Text style={styles.heading}>4. User Responsibilities</Text>
        <Text style={styles.paragraph}>
          You are responsible for providing accurate information and complying with repayment terms. Failure to do so 
          may result in loan denial or legal action.
        </Text>
        <Text style={styles.heading}>5. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          We reserve the right to modify these terms at any time. Changes will be communicated via our platform, and continued 
          use of the Service constitutes acceptance of the revised terms.
        </Text>
        <Text style={styles.heading}>6. Governing Law</Text>
        <Text style={styles.paragraph}>
          These terms are governed by the laws of the Philippines. Any disputes will be resolved in accordance with applicable laws.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
  },
  backButton: {
    marginRight: 10,
    marginTop: 20,
  },
  scrollView: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  paragraph: {
    fontSize: 16,
    marginTop: 10,
  },
});

export default Terms;
