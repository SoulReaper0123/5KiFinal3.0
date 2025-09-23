import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

const AccountDetailsPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const registrationData = route.params || {};

  const [bankAccName, setBankAccName] = useState('');
  const [bankAccNum, setBankAccNum] = useState('');
  const [gcashAccName, setGcashAccName] = useState('');
  const [gcashAccNum, setGcashAccNum] = useState('');

  const isNextDisabled = !bankAccName.trim() || !bankAccNum.trim() || !gcashAccName.trim() || !gcashAccNum.trim();

  const handleNext = () => {
    if (isNextDisabled) return;
    navigation.navigate('CreatePassword', {
      ...registrationData,
      bankAccName: bankAccName.trim(),
      bankAccNum: bankAccNum.trim(),
      gcashAccName: gcashAccName.trim(),
      gcashAccNum: gcashAccNum.trim(),
    });
  };

  const numericOnly = (text) => text.replace(/[^0-9]/g, '');

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={28} color="#0F172A" />
        </TouchableOpacity>

        <View style={{ marginBottom: 16 }}>
          <Text style={styles.title}>Account Details</Text>
          <Text style={styles.subLabel}>Step 4 of 5 • Bank and GCash for disbursement and payment confirmation</Text>
          <View style={{ height: 6, backgroundColor: '#E5E7EB', borderRadius: 999, marginTop: 8 }}>
            <View style={{ width: '80%', height: 6, backgroundColor: '#1E3A5F', borderRadius: 999 }} />
          </View>
        </View>

        <View style={styles.noticeBox}>
          <MaterialIcons name="info" size={20} color="#1E3A5F" style={{ marginRight: 6 }} />
          <Text style={styles.noticeText}>
            These accounts will be used for loan disbursements and to verify that future payment confirmations came from your registered accounts.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Bank Account</Text>
          <Text style={styles.label}>Account Name<Text style={styles.required}>*</Text></Text>
          <TextInput
            value={bankAccName}
            onChangeText={setBankAccName}
            placeholder="e.g., Juan D. Dela Cruz"
            style={styles.input}
          />
          <Text style={styles.label}>Account Number<Text style={styles.required}>*</Text></Text>
          <TextInput
            value={bankAccNum}
            onChangeText={(t) => setBankAccNum(numericOnly(t))}
            keyboardType="numeric"
            placeholder="e.g., 0123456789"
            style={styles.input}
            maxLength={20}
          />

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>GCash Account</Text>
          <Text style={styles.label}>Account Name<Text style={styles.required}>*</Text></Text>
          <TextInput
            value={gcashAccName}
            onChangeText={setGcashAccName}
            placeholder="e.g., Maria S. Santos"
            style={styles.input}
          />
          <Text style={styles.label}>Account Number<Text style={styles.required}>*</Text></Text>
          <TextInput
            value={gcashAccNum}
            onChangeText={(t) => setGcashAccNum(numericOnly(t))}
            keyboardType="numeric"
            placeholder="e.g., 09XXXXXXXXX"
            style={styles.input}
            maxLength={20}
          />

          <TouchableOpacity
            style={[styles.submitButton, isNextDisabled && styles.disabledButton, { backgroundColor: isNextDisabled ? '#94A3B8' : '#1E3A5F' }]}
            onPress={handleNext}
            disabled={isNextDisabled}
          >
            <Text style={styles.submitButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    marginTop: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  subLabel: {
    fontSize: 13,
    marginTop: 2,
    color: '#475569',
  },
  noticeBox: {
    flexDirection: 'row',
    backgroundColor: '#E6EEF9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  noticeText: {
    flex: 1,
    color: '#1E3A5F',
    fontSize: 13,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
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
    backgroundColor: 'white',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
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
  disabledButton: {
    backgroundColor: '#cccccc',
  },
});

export default AccountDetailsPage;