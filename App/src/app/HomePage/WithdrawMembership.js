import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Pressable,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { database } from '../../firebaseConfig'; // Adjust the import path as necessary
import { ref, get, set } from 'firebase/database';

export default function WithdrawMembership() {
  const navigation = useNavigation();

  const [form, setForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    contact: '',
    joined: '',
    reason: '',
    hasLoan: '',
  });

  const [agreed, setAgreed] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [isLoadingMember, setIsLoadingMember] = useState(false);
  const [emailError, setEmailError] = useState('');

  const fetchMemberData = async (email) => {
    if (!email.includes('@')) {
      setEmailError('Please enter a valid email');
      return;
    }

    setIsLoadingMember(true);
    setEmailError('');
    
    try {
      const membersRef = ref(database, 'Members');
      const snapshot = await get(membersRef);
      
      if (snapshot.exists()) {
        const members = snapshot.val();
        const member = Object.values(members).find(m => 
          m.email && m.email.toLowerCase() === email.toLowerCase()
        );
        
        if (member) {
          setMemberId(member.memberId);
          setForm(prev => ({
            ...prev,
            firstName: member.firstName || '',
            lastName: member.lastName || '',
            joined: member.dateApproved || '',
            address: member.address || '',
            contact: member.contact || ''
          }));
        } else {
          setEmailError('No member found with this email');
          resetMemberData();
        }
      } else {
        setEmailError('No members found in database');
        resetMemberData();
      }
    } catch (error) {
      console.error('Error fetching member data:', error);
      setEmailError('Failed to fetch member data');
      resetMemberData();
    } finally {
      setIsLoadingMember(false);
    }
  };

  const resetMemberData = () => {
    setMemberId('');
    setForm(prev => ({
      ...prev,
      firstName: '',
      lastName: '',
      joined: '',
      address: '',
      contact: ''
    }));
  };

  const handleEmailChange = (text) => {
    setForm({...form, email: text});
    setEmailError('');
    if (text.includes('@') && text.length > 5) {
      fetchMemberData(text);
    } else if (text === '') {
      resetMemberData();
    }
  };

  const handleSubmit = async () => {
    if (!memberId) {
      Alert.alert('Error', 'Please enter a valid member email first');
      return;
    }

    if (!form.reason || !form.hasLoan || !agreed) {
      Alert.alert('Incomplete Form', 'Please complete all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const withdrawalRef = ref(database, `Withdrawals/PermanentWithdrawal/${memberId}`);
      
      await set(withdrawalRef, {
        memberId,
        ...form,
        dateSubmitted: new Date().toISOString(),
        status: 'Pending'
      });
      
      setModalVisible(true);
      resetForm();
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      Alert.alert('Error', 'Failed to submit withdrawal request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      email: '',
      firstName: '',
      lastName: '',
      address: '',
      contact: '',
      joined: '',
      reason: '',
      hasLoan: '',
    });
    setMemberId('');
    setAgreed(false);
    setEmailError('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={30} color="white" />
      </TouchableOpacity>

      <Text style={styles.title}>Membership Withdrawal</Text>

      <View style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.emailContainer}>
            <TextInput
              placeholder="Email *"
              value={form.email}
              onChangeText={handleEmailChange}
              style={[styles.input, emailError ? styles.inputError : null]}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {isLoadingMember && (
              <ActivityIndicator style={styles.loader} color="#2D5783" />
            )}
          </View>
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

          <TextInput
            placeholder="First Name"
            value={form.firstName}
            editable={false}
            style={[styles.input, styles.disabledInput]}
          />

          <TextInput
            placeholder="Last Name"
            value={form.lastName}
            editable={false}
            style={[styles.input, styles.disabledInput]}
          />

          <TextInput
            placeholder="Address"
            value={form.address}
            onChangeText={(text) => setForm({...form, address: text})}
            style={styles.input}
          />

          <TextInput
            placeholder="Contact Number"
            value={form.contact}
            onChangeText={(text) => setForm({...form, contact: text})}
            style={styles.input}
            keyboardType="phone-pad"
          />

          <TextInput
            placeholder="Date Joined"
            value={form.joined}
            editable={false}
            style={[styles.input, styles.disabledInput]}
          />

          <Text style={styles.sectionTitle}>Reason for withdrawal *</Text>
          {['Relocation', 'Financial', 'No longer interested', 'Others'].map((r) => (
            <TouchableOpacity
              key={r}
              style={styles.radioOption}
              onPress={() => setForm({...form, reason: r})}
            >
              <View style={styles.radioCircle}>
                {form.reason === r && <View style={styles.selectedRb} />}
              </View>
              <Text style={styles.radioText}>{r}</Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.sectionTitle}>Do you have existing loans? *</Text>
          {['Yes', 'No'].map((opt) => (
            <TouchableOpacity
              key={opt}
              style={styles.radioOption}
              onPress={() => setForm({...form, hasLoan: opt})}
            >
              <View style={styles.radioCircle}>
                {form.hasLoan === opt && <View style={styles.selectedRb} />}
              </View>
              <Text style={styles.radioText}>{opt}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setAgreed(!agreed)}
          >
            <MaterialIcons
              name={agreed ? 'check-box' : 'check-box-outline-blank'}
              size={24}
              color={agreed ? '#2D5783' : '#888'}
            />
            <Text style={styles.checkboxLabel}>
              I agree and wish to proceed with my request. *
            </Text>
          </TouchableOpacity>

         <TouchableOpacity 
  style={[
    styles.submitButton, 
    (isSubmitting || !memberId || !form.reason || !form.hasLoan || !agreed) && styles.submitButtonDisabled
  ]} 
  onPress={handleSubmit}
  disabled={isSubmitting || !memberId || !form.reason || !form.hasLoan || !agreed}
>
  {isSubmitting ? (
    <ActivityIndicator color="white" />
  ) : (
    <Text style={styles.submitText}>
      {!memberId ? 'Enter Valid Email First' : 
       !form.reason ? 'Select Reason' :
       !form.hasLoan ? 'Select Loan Status' :
       !agreed ? 'Agree to Terms' : 
       'Submit'}
    </Text>
  )}
</TouchableOpacity>
        </ScrollView>
      </View>

      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalIcon}>✅</Text>
            <Text style={styles.modalText}>
              Your membership withdrawal request has been submitted.
            </Text>
            <Pressable 
              style={styles.okButton} 
              onPress={() => {
                setModalVisible(false);
                navigation.goBack();
              }}
            >
              <Text style={{ color: 'white' }}>Ok</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 15,
    color: '#333',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2D5783',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  selectedRb: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2D5783',
  },
  radioText: {
    fontSize: 14,
    color: '#333',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 25,
  },
  checkboxLabel: {
    marginLeft: 10,
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#00c853',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 10,
    width: 300,
    alignItems: 'center',
  },
  modalIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  okButton: {
    backgroundColor: '#2D5783',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  emailContainer: {
    position: 'relative',
  },
  loader: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
    marginTop: -10,
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
});