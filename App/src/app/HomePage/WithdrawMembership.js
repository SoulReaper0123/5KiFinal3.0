import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
  BackHandler
} from 'react-native';
import CustomModal from '../../components/CustomModal';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { ref as dbRef, get, set } from 'firebase/database';
import { database, auth } from '../../firebaseConfig';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { MemberWithdrawMembership } from '../../api';

export default function WithdrawMembership() {
  const navigation = useNavigation();
  const route = useRoute();
  const [form, setForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    contact: '',
    joined: '',
    reason: '',
    hasLoan: '',
    otherReason: ''
  });
  const [agreed, setAgreed] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [isLoadingMember, setIsLoadingMember] = useState(false);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('error');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [balance, setBalance] = useState(0);
  const [hasExistingLoan, setHasExistingLoan] = useState(false);
  const [showOtherReasonInput, setShowOtherReasonInput] = useState(false);
  const [hasPendingWithdrawal, setHasPendingWithdrawal] = useState(false);

  useEffect(() => {
    const handleBackPress = () => {
      navigation.navigate('Home');
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [navigation]);

  useEffect(() => {
    const initializeUserData = async () => {
      try {
        const user = auth.currentUser;
        const userEmail = user ? user.email : route.params?.user?.email;
        
        if (userEmail) {
          // If user data is passed via navigation (from fingerprint auth), use it
          if (route.params?.user) {
            const userData = route.params.user;
            setMemberId(userData.memberId || '');
            setBalance(userData.balance || 0);
            
            // Pre-fill form with user data
            setForm(prev => ({
              ...prev,
              email: userEmail,
              firstName: userData.firstName || '',
            }));
            
            // Fetch complete member data
            await fetchMemberData(userEmail);
          } else {
            // Set email and let user fetch their own data
            setForm(prev => ({
              ...prev,
              email: userEmail
            }));
            
            // Auto-fetch user data
            await fetchMemberData(userEmail);
          }
        }
      } catch (error) {
        console.error('Error initializing user data:', error);
        setAlertMessage('Error loading user information.');
        setAlertType('error');
        setAlertModalVisible(true);
      }
    };

    initializeUserData();
  }, [route.params]);

  const checkPendingWithdrawal = async (userId) => {
    try {
      const withdrawalRef = dbRef(database, `MembershipWithdrawal/PendingWithdrawals/${userId}`);
      const snapshot = await get(withdrawalRef);
      setHasPendingWithdrawal(snapshot.exists());
      return snapshot.exists();
    } catch (error) {
      console.error('Error checking pending withdrawal:', error);
      return false;
    }
  };

  const checkExistingLoans = async (userId) => {
    try {
      const loansRef = dbRef(database, `Loans/CurrentLoans/${userId}`);
      const snapshot = await get(loansRef);
      
      if (snapshot.exists()) {
        const loans = snapshot.val();
        const activeLoans = Object.values(loans).filter(loan => 
          loan.status !== 'completed' && loan.status !== 'rejected'
        );
        
        setHasExistingLoan(activeLoans.length > 0);
        setForm(prev => ({
          ...prev,
          hasLoan: activeLoans.length > 0 ? 'Yes' : 'No'
        }));
      } else {
        setHasExistingLoan(false);
        setForm(prev => ({
          ...prev,
          hasLoan: 'No'
        }));
      }
    } catch (error) {
      console.error('Error checking existing loans:', error);
      setHasExistingLoan(false);
    }
  };

  const fetchMemberData = async (email) => {
    if (!email.includes('@')) {
      setEmailError('Please enter a valid email');
      return;
    }

    setIsLoadingMember(true);
    setEmailError('');
    
    try {
      const membersRef = dbRef(database, 'Members');
      const snapshot = await get(membersRef);
      
      if (snapshot.exists()) {
        const members = snapshot.val();
        const member = Object.values(members).find(m => 
          m.email && m.email.toLowerCase() === email.toLowerCase()
        );
        
        if (member) {
          setMemberId(member.id);
          setBalance(member.balance || 0);
          await checkExistingLoans(member.id);
          const hasPending = await checkPendingWithdrawal(member.id);
          
          if (hasPending) {
            setEmailError('You already have a pending withdrawal request');
          } else {
            setForm(prev => ({
              ...prev,
              firstName: member.firstName || '',
              lastName: member.lastName || '',
              joined: member.dateApproved || '',
              address: member.address || '',
              contact: member.contact || ''
            }));
          }
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
    setBalance(0);
    setHasExistingLoan(false);
    setHasPendingWithdrawal(false);
    setForm(prev => ({
      ...prev,
      firstName: '',
      lastName: '',
      joined: '',
      address: '',
      contact: '',
      hasLoan: '',
      reason: '',
      otherReason: ''
    }));
  };

  const handleEmailChange = (text) => {
    setForm({...form, email: text});
    setEmailError('');
    if (text === '') {
      resetMemberData();
      return;
    }
    
    if (text.includes('@') && text.length > 5) {
      fetchMemberData(text);
    }
  };

  const handleReasonChange = (reason) => {
    setForm(prev => ({
      ...prev,
      reason,
      otherReason: reason === 'Others' ? '' : prev.otherReason
    }));
    setShowOtherReasonInput(reason === 'Others');
  };

  const handleSubmit = async () => {
    if (!memberId) {
      setAlertMessage('Please enter a valid member email first');
      setAlertType('error');
      setAlertModalVisible(true);
      return;
    }

    if (hasPendingWithdrawal) {
      setAlertMessage('You already have a pending withdrawal request. Please wait for it to be processed.');
      setAlertType('warning');
      setAlertModalVisible(true);
      return;
    }

    if (!form.reason || (form.reason === 'Others' && !form.otherReason) || !agreed) {
      setAlertMessage('Please complete all required fields');
      setAlertType('error');
      setAlertModalVisible(true);
      return;
    }

    if (hasExistingLoan) {
      setAlertMessage('You cannot withdraw your membership while you have an active loan. Please settle your loan first.');
      setAlertType('error');
      setAlertModalVisible(true);
      return;
    }

    const finalReason = form.reason === 'Others' ? form.otherReason : form.reason;

    setConfirmModalVisible(true);
  };

  const handleConfirmSubmit = async () => {
    setConfirmModalVisible(false);
    const finalReason = form.reason === 'Others' ? form.otherReason : form.reason;
    setIsSubmitting(true);
    try {
      const transactionId = generateTransactionId();
      const currentDate = new Date().toISOString();
      
      const withdrawalData = {
        transactionId,
        memberId,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        address: form.address,
        contact: form.contact,
        dateJoined: form.joined,
        reason: finalReason,
        balance: balance,
        date: currentDate,
        hasExistingLoan
      };

      // Save to Firebase
      const withdrawalRef = dbRef(database, `MembershipWithdrawal/PendingWithdrawals/${memberId}`);
      await set(withdrawalRef, {
        ...withdrawalData,
        dateSubmitted: new Date().toLocaleString('en-US', {
          month: 'long',
          day: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).replace(',', '')
          .replace(/(\d{1,2}):(\d{2})/, (match, h, m) => `${h.padStart(2,'0')}:${m.padStart(2,'0')}`)
          .replace(/(\d{4}) (\d{2}:\d{2})/, '$1 at $2'),
        status: 'Pending'
      });

      // Send email notification
      await MemberWithdrawMembership(withdrawalData);
      
      setModalVisible(true);
      resetForm();
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      setAlertMessage('Failed to submit withdrawal request');
      setAlertType('error');
      setAlertModalVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateTransactionId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
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
      otherReason: ''
    });
    setMemberId('');
    setAgreed(false);
    setEmailError('');
    setBalance(0);
    setHasExistingLoan(false);
    setShowOtherReasonInput(false);
    setHasPendingWithdrawal(false);
  };

  const isSubmitDisabled = !memberId || 
                         !form.reason || 
                         (form.reason === 'Others' && !form.otherReason) || 
                         !agreed ||
                         hasExistingLoan ||
                         hasPendingWithdrawal;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <SafeAreaView style={styles.container}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={30} color="white" />
          </TouchableOpacity>

          <Text style={styles.title}>Membership Withdrawal</Text>

          <View style={styles.content}>
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

            {memberId && !hasPendingWithdrawal && (
              <>
                <Text style={styles.balanceText}>Balance: ₱{balance.toFixed(2)}</Text>

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
                    onPress={() => handleReasonChange(r)}
                  >
                    <View style={styles.radioCircle}>
                      {form.reason === r && <View style={styles.selectedRb} />}
                    </View>
                    <Text style={styles.radioText}>{r}</Text>
                  </TouchableOpacity>
                ))}

                {showOtherReasonInput && (
                  <TextInput
                    placeholder="Please specify your reason"
                    value={form.otherReason}
                    onChangeText={(text) => setForm({...form, otherReason: text})}
                    style={styles.input}
                  />
                )}

                <Text style={styles.sectionTitle}>Existing Loans</Text>
                <View style={styles.loanStatusContainer}>
                  <Text style={styles.loanStatusText}>
                    {hasExistingLoan ? 
                      'You have an existing loan. Please settle it before withdrawing.' : 
                      'No existing loans found'}
                  </Text>
                  {hasExistingLoan && (
                    <MaterialIcons 
                      name="error" 
                      size={24} 
                      color="#f44336" 
                      style={styles.warningIcon} 
                    />
                  )}
                </View>

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
                    I understand this action is irreversible and wish to proceed with my membership withdrawal request. *
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {hasPendingWithdrawal && (
              <View style={styles.pendingWarning}>
                <MaterialIcons name="warning" size={24} color="#FFA000" />
                <Text style={styles.pendingText}>
                  You already have a pending withdrawal request. Please wait for it to be processed.
                </Text>
              </View>
            )}

            <TouchableOpacity 
              style={[
                styles.submitButton, 
                isSubmitDisabled && styles.submitButtonDisabled,
                (hasExistingLoan || hasPendingWithdrawal) && styles.blockedButton
              ]} 
              onPress={handleSubmit}
              disabled={isSubmitting || isSubmitDisabled}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitText}>
                  Submit Withdrawal Request
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <Modal
            visible={modalVisible}
            animationType="fade"
            transparent
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalView}>
                <MaterialIcons name="check-circle" size={50} color="#2D5783" />
                <Text style={styles.modalTitle}>Request Submitted</Text>
                <Text style={styles.modalText}>
                  Your membership withdrawal request has been received and is under review.
                </Text>
                <Pressable 
                  style={styles.okButton} 
                  onPress={() => {
                    setModalVisible(false);
                    navigation.navigate('Home');
                  }}
                >
                  <Text style={styles.okButtonText}>OK</Text>
                </Pressable>
              </View>
            </View>
          </Modal>

          <Modal transparent={true} visible={isSubmitting}>
            <View style={styles.loadingModalContainer}>
              <ActivityIndicator size="large" color="#2D5783" />
              <Text style={styles.loadingModalText}>Submitting your request...</Text>
            </View>
          </Modal>

          {/* Custom Alert Modal */}
          <CustomModal
            visible={alertModalVisible}
            onClose={() => setAlertModalVisible(false)}
            message={alertMessage}
            type={alertType}
          />

          {/* Confirmation Modal */}
          <Modal visible={confirmModalVisible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={[styles.modalView, { width: '80%' }]}>
                <Text style={[styles.modalTitle, { textAlign: 'center', marginBottom: 15 }]}>
                  Confirm Membership Withdrawal
                </Text>
                <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
                  You are about to submit a membership withdrawal request. This action cannot be undone. Are you sure you want to proceed?
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                  <TouchableOpacity 
                    style={[styles.submitButton, { backgroundColor: '#cccccc', width: '45%' }]} 
                    onPress={() => setConfirmModalVisible(false)}
                  >
                    <Text style={[styles.submitText, { color: 'black' }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.submitButton, { width: '45%' }]} 
                    onPress={handleConfirmSubmit}
                  >
                    <Text style={styles.submitText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

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
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: 'white',
  },
  content: {
    backgroundColor: 'white',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    flex: 1,
    paddingStart: 25,
    paddingEnd: 25,
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
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
    color: '#333',
    fontSize: 16,
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
    marginTop: 20,
    marginBottom: 25,
  },
  checkboxLabel: {
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
    flex: 1,
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
  submitButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  blockedButton: {
    backgroundColor: '#f44336',
  },
  submitText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 15,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 15,
    color: '#2D5783',
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
    color: '#555',
  },
  okButton: {
    backgroundColor: '#2D5783',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  okButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
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
    fontSize: 12,
  },
  balanceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5783',
    marginBottom: 15,
    textAlign: 'center',
  },
  loanStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  loanStatusText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  warningIcon: {
    marginLeft: 10,
  },
  pendingWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  pendingText: {
    marginLeft: 10,
    color: '#5D4037',
    flex: 1,
  },
  loadingModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  loadingModalText: {
    marginTop: 10,
    fontSize: 16,
    color: 'white',
  },
});