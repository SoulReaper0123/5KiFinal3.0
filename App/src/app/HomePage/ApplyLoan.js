import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView, Platform
} from 'react-native';
import CustomModal from '../../components/CustomModal';
import CustomConfirmModal from '../../components/CustomConfirmModal';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import ModalSelector from 'react-native-modal-selector';
import { ref as dbRef, set, get } from 'firebase/database';
import { database, auth } from '../../firebaseConfig';

const ApplyLoan = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // Basic loan information
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [term, setTerm] = useState('');
  const [loanType, setLoanType] = useState('Regular Loan');
  const [interestRate, setInterestRate] = useState(0);
  const [disbursement, setDisbursement] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [balance, setBalance] = useState(0);
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Collateral related states
  const [requiresCollateral, setRequiresCollateral] = useState(false);
  const [collateralType, setCollateralType] = useState('');
  const [collateralValue, setCollateralValue] = useState('');
  const [collateralDescription, setCollateralDescription] = useState('');
  const [showCollateralModal, setShowCollateralModal] = useState(false);
  
  // Modal states
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('error');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [successAction, setSuccessAction] = useState(null);
  const [pendingApiData, setPendingApiData] = useState(null);
  const [hasExistingLoan, setHasExistingLoan] = useState(false);
  const [hasPendingApplication, setHasPendingApplication] = useState(false);
  const [loanableAmountPercentage, setLoanableAmountPercentage] = useState(80); // Default 80%
  const [maxLoanableAmount, setMaxLoanableAmount] = useState(0);
  const [loanTypeOptions, setLoanTypeOptions] = useState([
    { key: 'Regular Loan', label: 'Regular Loan' },
    { key: 'Quick Cash', label: 'Quick Cash' },
  ]);

  const accountNumberInput = useRef(null);

  const termsOptions = [
    { key: '3', label: '3 Months', interestRate: 0.01 },
    { key: '6', label: '6 Months', interestRate: 0.015 },
    { key: '9', label: '9 Months', interestRate: 0.02 },
    { key: '12', label: '12 Months', interestRate: 0.03 },
  ];



  const disbursementOptions = [
    { key: 'GCash', label: 'GCash' },
    { key: 'Bank', label: 'Bank' },
  ];

  const collateralOptions = [
    { key: 'Property', label: 'Property' },
    { key: 'Vehicle', label: 'Vehicle' },
    { key: 'Jewelry', label: 'Jewelry' },
    { key: 'Electronics', label: 'Electronics' },
    { key: 'Other', label: 'Other' },
  ];

  // Check if all required fields are filled
  const isFormValid = () => {
    const basicFieldsValid = 
      loanAmount && 
      term && 
      disbursement && 
      accountName && 
      accountNumber;
    
    if (requiresCollateral) {
      return basicFieldsValid && 
        collateralType && 
        collateralValue && 
        collateralDescription;
    }
    
    return basicFieldsValid;
  };

  // Check if all collateral fields are filled
  const isCollateralValid = () => {
    return collateralType && collateralValue && collateralDescription;
  };

  const handleLoanTypeChange = (option) => {
    setLoanType(option.key);
    if (option.key === 'Quick Cash') {
      setTerm('1');
      setInterestRate(0.03);
    } else {
      setTerm('');
      setInterestRate(0);
    }
  };

  const handleTermChange = (option) => {
    setTerm(option.key);
    setInterestRate(option.interestRate);
  };

  const validateAccountNumber = (value) => {
    const maxLength = disbursement === 'GCash' ? 11 : disbursement === 'Bank' ? 16 : 0;
    if (maxLength > 0 && value.length > maxLength) {
      setAlertMessage(`Account Number for ${disbursement} must be ${maxLength} digits long`);
      setAlertType('error');
      setAlertModalVisible(true);
      return value.slice(0, maxLength);
    }
    return value;
  };

  const handleAccountNumberChange = (value) => {
    setAccountNumber(validateAccountNumber(value));
  };

  const fetchSystemSettings = async () => {
    try {
      const settingsRef = dbRef(database, 'Settings');
      const snapshot = await get(settingsRef);
      if (snapshot.exists()) {
        const settings = snapshot.val();
        const loanPercentage = settings.LoanPercentage || 80; // Default to 80%
        setLoanableAmountPercentage(loanPercentage);
        
        // Fetch loan types from settings
        const loanTypes = settings.LoanTypes || ['Regular Loan', 'Quick Cash'];
        const formattedLoanTypes = loanTypes.map(type => ({
          key: type,
          label: type
        }));
        setLoanTypeOptions(formattedLoanTypes);
      }
    } catch (error) {
      console.error('Error fetching system settings:', error?.message || error || 'Unknown error');
      // Keep defaults if error
    }
  };

  const calculateMaxLoanableAmount = (userBalance, percentage) => {
    const maxAmount = (userBalance * percentage) / 100;
    setMaxLoanableAmount(maxAmount);
    return maxAmount;
  };

  const fetchUserData = async (userEmail) => {
    const membersRef = dbRef(database, 'Members');
    try {
      const snapshot = await get(membersRef);
      if (snapshot.exists()) {
        const members = snapshot.val();
        const foundUser = Object.values(members).find(member => member.email === userEmail);
        if (foundUser) {
          const userBalance = foundUser.balance || 0;
          setBalance(userBalance);
          setMemberId(foundUser.id || '');
          setUserId(foundUser.id || '');
          setFirstName(foundUser.firstName || '');
          setLastName(foundUser.lastName || '');
          
          // Calculate max loanable amount
          calculateMaxLoanableAmount(userBalance, loanableAmountPercentage);
          
          // Check for existing loans after setting user data
          await checkExistingLoans(userEmail);
        } else {
          setAlertMessage('User not found');
          setAlertType('error');
          setAlertModalVisible(true);
        }
      } else {
        setAlertMessage('No members found');
        setAlertType('error');
        setAlertModalVisible(true);
      }
    } catch (error) {
      console.error('Error fetching user data:', error?.message || error || 'Unknown error');
      setAlertMessage('Error loading user information.');
      setAlertType('error');
      setAlertModalVisible(true);
    }
  };

  const checkExistingLoans = async (userEmail) => {
    try {
      // Check CurrentLoans table for existing active loans
      const currentLoansRef = dbRef(database, 'Loans/CurrentLoans');
      const currentSnapshot = await get(currentLoansRef);

      if (currentSnapshot.exists()) {
        const allCurrentLoans = currentSnapshot.val();
        for (const memberId in allCurrentLoans) {
          const loans = allCurrentLoans[memberId];
          for (const loanId in loans) {
            const currentLoan = loans[loanId];
            if (currentLoan?.email === userEmail) {
              setHasExistingLoan(true);
              return;
            }
          }
        }
      }
      setHasExistingLoan(false);

      // Check LoanApplications table for pending applications
      const applicationsRef = dbRef(database, 'Loans/LoanApplications');
      const applicationsSnapshot = await get(applicationsRef);

      if (applicationsSnapshot.exists()) {
        const allApplications = applicationsSnapshot.val();
        for (const memberId in allApplications) {
          const applications = allApplications[memberId];
          for (const applicationId in applications) {
            const application = applications[applicationId];
            if (application?.email === userEmail && application?.status === 'pending') {
              setHasPendingApplication(true);
              return;
            }
          }
        }
      }
      setHasPendingApplication(false);
    } catch (error) {
      console.error('Error checking existing loans and applications:', error);
      setHasExistingLoan(false);
      setHasPendingApplication(false);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        // First fetch system settings
        await fetchSystemSettings();
        
        const user = auth.currentUser;
        const userEmail = user ? user.email : route.params?.user?.email;
        
        if (userEmail) {
          setEmail(userEmail);
          
          // If user data is passed via navigation (from fingerprint auth), use it
          if (route.params?.user) {
            const userData = route.params.user;
            setMemberId(userData.memberId || '');
            setFirstName(userData.firstName || '');
            setBalance(userData.balance || 0);
            // Still fetch fresh data from database for consistency
            await fetchUserData(userEmail);
          } else {
            // Fallback to database lookup
            await fetchUserData(userEmail);
          }
        } else {
          setAlertMessage('Unable to identify user. Please log in again.');
          setAlertType('error');
          setAlertModalVisible(true);
        }
      } catch (error) {
        console.error('Error initializing data:', error);
        setAlertMessage('Error loading information.');
        setAlertType('error');
        setAlertModalVisible(true);
      }
    };

    initializeData();
  }, [route.params]);

  // Recalculate max loanable amount when balance or percentage changes
  useEffect(() => {
    if (balance > 0 && loanableAmountPercentage > 0) {
      calculateMaxLoanableAmount(balance, loanableAmountPercentage);
    }
  }, [balance, loanableAmountPercentage]);

  useEffect(() => {
    const handleBackPress = () => {
      navigation.navigate('Home');
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [navigation]);

  const generateTransactionId = () => Math.floor(100000 + Math.random() * 900000).toString();

 // In your ApplyLoan.js, update the storeLoanApplicationInDatabase function:

const storeLoanApplicationInDatabase = async (applicationData) => {
  try {
    const transactionId = generateTransactionId();
    const now = new Date();
    
    // Format date exactly as "August 01, 2025 at 20:15"
    const dateApplied = now.toLocaleString('en-US', {
      month: 'long',
      day: '2-digit',
      year: 'numeric',
    }).replace(',', '').replace(/(\d{1,2}):(\d{2})/, (match, h, m) => {
      // Ensure 2-digit hour and minute
      const hours = h.padStart(2, '0');
      const minutes = m.padStart(2, '0');
      return `${hours}:${minutes}`;
    }).replace(/(\d{4}) (\d{2}:\d{2})/, '$1 at $2');

    const applicationDataWithMeta = {
      ...applicationData,
      id: userId,
      firstName,
      lastName,
      email,
      transactionId,
      dateApplied, // Now in "August 01, 2025 at 20:15" format
      loanType,
      status: 'pending' // Explicit status
    };

    const applicationRef = dbRef(database, `Loans/LoanApplications/${userId}/${transactionId}`);
    await set(applicationRef, applicationDataWithMeta);
    return true;
  } catch (error) {
    console.error('Failed to store loan application:', error?.message || error || 'Unknown error');
    setAlertMessage('Failed to submit loan application');
    setAlertType('error');
    setAlertModalVisible(true);
    return false;
  }
};

  // Function to run API operations in background after user navigates to home
  const runApiOperationsInBackground = async (loanData) => {
    try {
      console.log('Running API operations in background...');
      
      // Make API call for loan application
      const response = await fetch('http://192.168.1.9:3000/apply-loan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loanData),
      });

      if (response.ok) {
        console.log('API call completed successfully in background');
      } else {
        console.log('API call failed, but user already navigated away');
      }
    } catch (error) {
      console.log('API error in background (non-critical):', error?.message || error || 'Unknown API error');
      // Don't show error to user since they've already moved on
    }
  };

  const submitLoanApplication = async () => {
  setIsLoading(true);
  setConfirmModalVisible(false);
  
  try {
    const loanAmountNum = parseFloat(loanAmount);
    const applicationData = {
      loanAmount: loanAmountNum,
      term,
      disbursement,
      accountName,
      accountNumber,
      interestRate,
      firstName,
      lastName,
      email,
      userId,
      loanType,
      requiresCollateral,
      ...(requiresCollateral && {
        collateralType,
        collateralValue,
        collateralDescription
      })
    };

    // Store in database first and wait for completion
    console.log('Starting database operation...');
    const storedSuccessfully = await storeLoanApplicationInDatabase(applicationData);
    
    if (!storedSuccessfully) {
      setIsLoading(false);
      return;
    }

    console.log('Database operation completed successfully');

    // Prepare loan data for API call to run when user clicks OK
    const loanData = {
      email,
      firstName,
      lastName,
      amount: loanAmountNum,
      term,
      date: new Date().toISOString(),
    };

    // Store loan data to be used when user clicks OK
    setPendingApiData(loanData);

    // Only show success modal after database operations are complete
    setIsLoading(false);
    setAlertMessage('Loan application submitted successfully. You will receive a confirmation email shortly.');
    setAlertType('success');
    setSuccessAction(() => () => {
      resetForm();
      navigation.navigate('Home');
      // Run API operations in background after navigation
      if (loanData) {
        runApiOperationsInBackground(loanData);
      }
    });
    setAlertModalVisible(true);

  } catch (error) {
    console.error('Error during loan submission:', error?.message || error || 'Unknown error');
    setAlertMessage('An unexpected error occurred. Please try again later.');
    setAlertType('error');
    setAlertModalVisible(true);
    setIsLoading(false);
  }
};
 const showConfirmationAlert = () => {
    let message = `Loan Type: ${loanType}\n` +
      `Loan Amount: ₱${loanAmount}\n` +
      `Term: ${term} ${term === '1' ? 'Month' : 'Months'}\n` +
      `Disbursement: ${disbursement}\n` +
      `Account Name: ${accountName}\n` +
      `Account Number: ${accountNumber}`;

    // Include collateral details if required
    if (requiresCollateral) {
      message += `\n\nCollateral Details\n` +
        `Type: ${collateralType}\n` +
        `Value: ₱${collateralValue}\n` +
        `Description: ${collateralDescription}`;
    }

    setConfirmMessage(message);
    setConfirmAction(() => () => {
      submitLoanApplication();
    });
    setConfirmModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      setAlertMessage('All required fields must be filled');
      setAlertType('error');
      setAlertModalVisible(true);
      return;
    }

    // Check for existing loans first
    if (hasExistingLoan) {
      setAlertMessage('You already have an active loan. Please complete your current loan before applying for a new one.');
      setAlertType('error');
      setAlertModalVisible(true);
      return;
    }

    // Check for pending applications
    if (hasPendingApplication) {
      setAlertMessage('You already have a pending loan application. Please wait for approval or rejection before submitting a new application.');
      setAlertType('error');
      setAlertModalVisible(true);
      return;
    }

    const loanAmountNum = parseFloat(loanAmount);
    
    // Check if loan amount exceeds loanable amount (based on percentage)
    if (loanAmountNum > maxLoanableAmount) {
      setConfirmMessage(`Your loan amount exceeds the maximum loanable amount of ₱${maxLoanableAmount.toFixed(2)} (${loanableAmountPercentage}% of your balance). You need to provide collateral to proceed.`);
      setConfirmAction(() => () => {
        setRequiresCollateral(true);
        setShowCollateralModal(true);
      });
      setConfirmModalVisible(true);
      return;
    }

    showConfirmationAlert();
  };

  const resetForm = () => {
    setLoanAmount('');
    setTerm('');
    setAccountNumber('');
    setAccountName('');
    setDisbursement('');
    setRequiresCollateral(false);
    setCollateralType('');
    setCollateralValue('');
    setCollateralDescription('');
  };

  const formatCurrency = (amount) => {
    return `₱${parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  const RequiredField = ({ children }) => (
    <Text style={{flexDirection: 'row'}}>
      {children}
      <Text style={{color: 'red'}}>*</Text>
    </Text>
  );

  return (
    <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={30} color="white" />
      </TouchableOpacity>
      <Text style={styles.title}>Apply Loan</Text>

      <View style={styles.content}>
        <Text style={styles.label}>Balance</Text>
        <Text style={styles.balanceText}>{formatCurrency(balance)}</Text>
        
        <Text style={styles.label}>Maximum Loanable Amount ({loanableAmountPercentage}%)</Text>
        <Text style={styles.balanceText}>{formatCurrency(maxLoanableAmount)}</Text>

        <Text style={styles.label}><RequiredField>Loan Type</RequiredField></Text>
        <ModalSelector
          data={loanTypeOptions}
          initValue="Select Loan Type"
          onChange={handleLoanTypeChange}
          style={styles.picker}
          modalStyle={{ justifyContent: 'flex-end', margin: 0 }}
          overlayStyle={{ justifyContent: 'flex-end' }}
        >
          <TouchableOpacity style={styles.pickerContainer}>
            <Text style={styles.pickerText}>{loanType}</Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="black" />
          </TouchableOpacity>
        </ModalSelector>

        <Text style={styles.label}><RequiredField>Loan Amount</RequiredField></Text>
        <TextInput
          placeholder="Enter Loan Amount"
          value={loanAmount}
          onChangeText={setLoanAmount}
          style={styles.input}
          keyboardType="numeric"
        />

        <Text style={styles.label}><RequiredField>Term</RequiredField></Text>
        <ModalSelector
          data={termsOptions}
          initValue="Select Loan Term"
          onChange={handleTermChange}
          style={styles.picker}
          disabled={loanType === 'Quick Cash'}
          modalStyle={{ justifyContent: 'flex-end', margin: 0 }}
          overlayStyle={{ justifyContent: 'flex-end' }}
        >
          <TouchableOpacity style={styles.pickerContainer}>
            <Text style={styles.pickerText}>
              {term ? `${term} ${term === '1' ? 'Month' : 'Months'}` : 'Select Loan Term'}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="black" />
          </TouchableOpacity>
        </ModalSelector>

        <Text style={styles.label}><RequiredField>Disbursement</RequiredField></Text>
        <ModalSelector
          data={disbursementOptions}
          initValue="Select Disbursement Method"
          onChange={(option) => setDisbursement(option.key)}
          style={styles.picker}
          modalStyle={{ justifyContent: 'flex-end', margin: 0 }}
          overlayStyle={{ justifyContent: 'flex-end' }}
        >
          <TouchableOpacity style={styles.pickerContainer}>
            <Text style={styles.pickerText}>
              {disbursement || 'Select Disbursement Method'}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="black" />
          </TouchableOpacity>
        </ModalSelector>

        <Text style={styles.label}><RequiredField>Account Name</RequiredField></Text>
        <TextInput 
          value={accountName} 
          onChangeText={setAccountName} 
          style={styles.input} 
          placeholder="Enter account name"
        />

        <Text style={styles.label}><RequiredField>Account Number</RequiredField></Text>
        <TextInput
          value={accountNumber}
          onChangeText={handleAccountNumberChange}
          style={styles.input}
          keyboardType="numeric"
          ref={accountNumberInput}
          placeholder="Enter account number"
        />

        {/* Collateral Modal */}
        <Modal
          visible={showCollateralModal}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowCollateralModal(false)}
        >
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Collateral Information</Text>
              <TouchableOpacity onPress={() => setShowCollateralModal(false)}>
                <MaterialIcons name="close" size={24} color="black" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}><RequiredField>Collateral Type</RequiredField></Text>
            <ModalSelector
              data={collateralOptions}
              initValue="Select Collateral Type"
              onChange={(option) => setCollateralType(option.key)}
              style={styles.picker}
            >
              <TouchableOpacity style={styles.pickerContainer}>
                <Text style={styles.pickerText}>
                  {collateralType || 'Select Collateral Type'}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="black" />
              </TouchableOpacity>
            </ModalSelector>

            <Text style={styles.label}><RequiredField>Collateral Value (₱)</RequiredField></Text>
            <TextInput
              placeholder="Estimated value of collateral"
              value={collateralValue}
              onChangeText={setCollateralValue}
              style={styles.input}
              keyboardType="numeric"
            />

            <Text style={styles.label}><RequiredField>Collateral Description</RequiredField></Text>
            <Text style={styles.descriptionHint}>
              Please include the following details if applicable:
            </Text>
            <Text style={styles.descriptionBullet}>• Make, model, and serial number</Text>
            <Text style={styles.descriptionBullet}>• Physical condition</Text>
            <Text style={styles.descriptionBullet}>• Location</Text>
            <Text style={styles.descriptionBullet}>• Ownership documents</Text>
            <Text style={styles.descriptionBullet}>• Any identifying marks</Text>
            <TextInput
              placeholder="Describe your collateral in detail..."
              value={collateralDescription}
              onChangeText={setCollateralDescription}
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.continueButton, !isCollateralValid() && styles.disabledButton]}
                onPress={() => {
                  if (isCollateralValid()) {
                    setRequiresCollateral(true);
                    setShowCollateralModal(false);
                    showConfirmationAlert();
                  }
                }}
                disabled={!isCollateralValid()}
              >
                <Text style={styles.modalButtonText}>Continue</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowCollateralModal(false);
                  setRequiresCollateral(false);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Modal>

        <TouchableOpacity 
          style={[styles.submitButton, !isFormValid() && styles.disabledButton]} 
          onPress={handleSubmit}
          disabled={!isFormValid()}
        >
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>

      <Modal transparent={true} visible={isLoading}>
        <View style={styles.modalContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.modalText}>Please wait...</Text>
        </View>
      </Modal>

      {/* Custom Alert Modal */}
      <CustomModal
        visible={alertModalVisible}
        onClose={() => {
          setAlertModalVisible(false);
          // Execute success action (navigation + background API) if it exists
          if (alertType === 'success' && successAction) {
            successAction();
            setSuccessAction(null);
          }
          // Clear any pending data
          setPendingApiData(null);
        }}
        message={alertMessage}
        type={alertType}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#4FE7AF" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        </View>
      )}

      {/* Custom Confirmation Modal */}
      <CustomConfirmModal
        visible={confirmModalVisible}
        onClose={() => setConfirmModalVisible(false)}
        title={confirmMessage.includes('Collateral Required') ? 'Collateral Required' : 'Confirm Loan Application'}
        message={confirmMessage}
        type={confirmMessage.includes('Collateral Required') ? 'warning' : 'info'}
        cancelText="Cancel"
        confirmText={confirmMessage.includes('Collateral Required') ? 'Continue' : 'Submit'}
        onCancel={() => {
          setConfirmModalVisible(false);
          if (requiresCollateral) {
            setShowCollateralModal(true);
          }
        }}
        onConfirm={() => {
          setConfirmModalVisible(false);
          if (confirmAction) {
            confirmAction();
            setConfirmAction(null);
          }
        }}
      />
    </KeyboardAvoidingView>
  );
};


const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#2D5783',
  },
  backButton: {
    marginTop: 40,
    marginStart: 20,
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
    minHeight: '100%',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: 'white',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#2D5783',
  },
  label: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 5,
  },
  balanceText: {
    fontSize: 30,
    marginBottom: 15,
    textAlign: 'center',
    color: '#008000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
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
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  submitButtonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 18,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalText: {
    marginTop: 15,
    color: '#ffffff',
    fontSize: 18,
  },
  // Collateral Modal Styles
  modalContent: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5783',
  },
  descriptionHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  descriptionBullet: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    marginBottom: 3,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
    minWidth: '48%',
  },
  cancelButton: {
    backgroundColor: '#cccccc',
  },
  continueButton: {
    backgroundColor: '#2D5783',
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
    color: '#2D5783',
  },
});

export default ApplyLoan;