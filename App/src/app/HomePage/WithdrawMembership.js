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
import ModalSelector from 'react-native-modal-selector';
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
    otherReason: '',
    disbursementAccountName: '',
    disbursementAccountNumber: '',
    disbursementBankType: ''
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
  const [bankAccName, setBankAccName] = useState('');
  const [bankAccNum, setBankAccNum] = useState('');
  const [gcashAccName, setGcashAccName] = useState('');
  const [gcashAccNum, setGcashAccNum] = useState('');
  const [disbursementOption, setDisbursementOption] = useState('');
  const [customBankName, setCustomBankName] = useState('');

  const disbursementOptions = [
    { key: 'GCash', label: 'GCash' },
    { key: 'Bank', label: 'Bank' },
  ];

  const bankTypeOptions = [
    { key: 'BDO', label: 'BDO' },
    { key: 'Security Bank', label: 'Security Bank' },
    { key: 'BPI', label: 'BPI' },
    { key: 'ChinaBank', label: 'ChinaBank' },
    { key: 'Others', label: 'Others' },
  ];

  useEffect(() => {
    const handleBackPress = () => {
      navigation.navigate('AppHome');
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

          // Capture saved disbursement accounts
          setBankAccName(member.bankAccName || '');
          setBankAccNum(member.bankAccNum || '');
          setGcashAccName(member.gcashAccName || '');
          setGcashAccNum(member.gcashAccNum || '');

          if (hasPending) {
            setEmailError('You already have a pending withdrawal request');
          } else {
            setForm(prev => ({
              ...prev,
              firstName: member.firstName || '',
              lastName: member.lastName || '',
              joined: member.dateApproved || '',
              address: member.address || '',
              contact: member.phoneNumber || ''
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
    setBankAccName('');
    setBankAccNum('');
    setGcashAccName('');
    setGcashAccNum('');
    setDisbursementOption('');
    setCustomBankName('');
    setForm(prev => ({
      ...prev,
      firstName: '',
      lastName: '',
      joined: '',
      address: '',
      contact: '',
      hasLoan: '',
      reason: '',
      otherReason: '',
      disbursementAccountName: '',
      disbursementAccountNumber: '',
      disbursementBankType: ''
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

  const handleDisbursementOptionChange = (option) => {
    const key = option.key;
    setDisbursementOption(key);
    // Clear all account fields when changing disbursement option
    setForm(prev => ({
      ...prev,
      disbursementAccountName: '',
      disbursementAccountNumber: '',
      disbursementBankType: ''
    }));
    setCustomBankName('');
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

    // Check disbursement fields
    if (!disbursementOption) {
      setAlertMessage('Please select a disbursement option');
      setAlertType('error');
      setAlertModalVisible(true);
      return;
    }

    if (!form.disbursementAccountName || !form.disbursementAccountNumber) {
      setAlertMessage('Please provide disbursement account name and number');
      setAlertType('error');
      setAlertModalVisible(true);
      return;
    }

    if (disbursementOption === 'Bank' && !form.disbursementBankType && !customBankName) {
      setAlertMessage('Please select or specify the bank type');
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
        hasExistingLoan,
        disbursementOption,
        disbursementAccountName: form.disbursementAccountName,
        disbursementAccountNumber: form.disbursementAccountNumber,
        disbursementBankType: disbursementOption === 'Bank' ? (form.disbursementBankType === 'Others' ? customBankName : form.disbursementBankType) : null
      };

      // Save to Firebase
      const withdrawalRef = dbRef(database, `MembershipWithdrawal/PendingWithdrawals/${memberId}`);
      await set(withdrawalRef, {
        ...withdrawalData,
        dateSubmitted: new Date().toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
        timeSubmitted: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        timestamp: new Date().getTime(),
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
      otherReason: '',
      disbursementAccountName: '',
      disbursementAccountNumber: '',
      disbursementBankType: ''
    });
    setMemberId('');
    setAgreed(false);
    setEmailError('');
    setBalance(0);
    setHasExistingLoan(false);
    setShowOtherReasonInput(false);
    setHasPendingWithdrawal(false);
    setDisbursementOption('');
    setCustomBankName('');
  };

  const isSubmitDisabled = !memberId ||
                         !form.reason ||
                         (form.reason === 'Others' && !form.otherReason) ||
                         !agreed ||
                         hasExistingLoan ||
                         hasPendingWithdrawal ||
                         !disbursementOption ||
                         !form.disbursementAccountName ||
                         !form.disbursementAccountNumber ||
                         (disbursementOption === 'Bank' && !form.disbursementBankType && !customBankName);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <SafeAreaView style={styles.container}>
          {/* Header with centered title and left back button using invisible spacers */}
          <View style={styles.headerRow}>
          <TouchableOpacity style={styles.headerSide} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={28} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Membership Withdrawal</Text>
          <View style={styles.headerSide} />
        </View>

        <View style={styles.content}>
            <Text style={styles.label}>Email *</Text>
            <View style={styles.emailContainer}>
              <TextInput
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
                <Text style={styles.label}>Current Balance</Text>
                <Text style={styles.balanceText}>₱{balance.toFixed(2)}</Text>

                <Text style={styles.label}>First Name</Text>
                <TextInput
                  value={form.firstName}
                  editable={false}
                  style={[styles.input, styles.disabledInput]}
                />

                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  value={form.lastName}
                  editable={false}
                  style={[styles.input, styles.disabledInput]}
                />

                <Text style={styles.label}>Address</Text>
                <TextInput
                  value={form.address}
                  editable={false}
                  style={[styles.input, styles.disabledInput]}
                />

                <Text style={styles.label}>Contact Number</Text>
                <TextInput
                  value={form.contact}
                  editable={false}
                  style={[styles.input, styles.disabledInput]}
                  keyboardType="phone-pad"
                />

                <Text style={styles.label}>Date Joined</Text>
                <TextInput
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
                  <>
                    <Text style={styles.label}>Please specify your reason</Text>
                    <TextInput
                      value={form.otherReason}
                      onChangeText={(text) => setForm({...form, otherReason: text})}
                      style={styles.input}
                    />
                  </>
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

                <Text style={styles.sectionTitle}>Disbursement Account *</Text>
                <Text style={styles.label}>Disbursement Option<Text style={styles.required}>*</Text></Text>
                <ModalSelector
                  data={disbursementOptions}
                  initValue="Select Disbursement Option"
                  onChange={handleDisbursementOptionChange}
                  style={styles.picker}
                  modalStyle={{ justifyContent: 'flex-end', margin: 0 }}
                  overlayStyle={{ justifyContent: 'flex-end' }}
                >
                  <TouchableOpacity style={styles.pickerContainer}>
                    <Text style={styles.pickerText}>{disbursementOption || 'Select Disbursement Option'}</Text>
                    <MaterialIcons name="arrow-drop-down" size={24} color="black" />
                  </TouchableOpacity>
                </ModalSelector>

                {disbursementOption && (
                  <>
                    <Text style={styles.label}>Account Name<Text style={styles.required}>*</Text></Text>
                    <TextInput
                      value={form.disbursementAccountName}
                      onChangeText={(text) => setForm({...form, disbursementAccountName: text})}
                      style={styles.input}
                      placeholder="Enter account name"
                    />

                    <Text style={styles.label}>Account Number<Text style={styles.required}>*</Text></Text>
                    <TextInput
                      value={form.disbursementAccountNumber}
                      onChangeText={(text) => setForm({...form, disbursementAccountNumber: text})}
                      style={styles.input}
                      keyboardType="numeric"
                      placeholder="Enter account number"
                    />

                    {disbursementOption === 'Bank' && (
                      <>
                        <Text style={styles.label}>Type of Bank<Text style={styles.required}>*</Text></Text>
                        <ModalSelector
                          data={bankTypeOptions}
                          initValue="Select Bank Type"
                          onChange={(option) => {
                            const key = option.key;
                            setForm(prev => ({
                              ...prev,
                              disbursementBankType: key
                            }));
                            if (key !== 'Others') {
                              setCustomBankName('');
                            }
                          }}
                          style={styles.picker}
                          modalStyle={{ justifyContent: 'flex-end', margin: 0 }}
                          overlayStyle={{ justifyContent: 'flex-end' }}
                        >
                          <TouchableOpacity style={styles.pickerContainer}>
                            <Text style={styles.pickerText}>
                              {form.disbursementBankType === 'Others' && customBankName ? `Others: ${customBankName}` : (form.disbursementBankType || 'Select Bank Type')}
                            </Text>
                            <MaterialIcons name="arrow-drop-down" size={24} color="black" />
                          </TouchableOpacity>
                        </ModalSelector>

                        {form.disbursementBankType === 'Others' && (
                          <View style={{ marginTop: 8 }}>
                            <TextInput
                              placeholder="Please specify the bank name"
                              value={customBankName}
                              onChangeText={setCustomBankName}
                              style={styles.input}
                            />
                          </View>
                        )}
                      </>
                    )}
                  </>
                )}

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
                    navigation.navigate('AppHome');
                  }}
                >
                  <Text style={styles.okButtonText}>OK</Text>
                </Pressable>
              </View>
            </View>
          </Modal>

          {/* Loading Overlay */}
          {isSubmitting && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#4FE7AF" />
                <Text style={styles.loadingText}>Processing...</Text>
              </View>
            </View>
          )}

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
    flexGrow: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
    paddingBottom: 32,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  // Header styles for centered title with left back button
  headerRow: {
    marginTop: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSide: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  label: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 5,
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
    width: '100%',
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
    fontSize: 16,
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
    fontSize: 28,
    marginBottom: 12,
    textAlign: 'center',
    color: '#1E3A5F',
    fontWeight: '700',
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
    color: '#2D5783',
  },
});