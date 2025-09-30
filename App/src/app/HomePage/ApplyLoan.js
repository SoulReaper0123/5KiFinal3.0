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
  KeyboardAvoidingView, Platform,
  Image
} from 'react-native';
import CustomModal from '../../components/CustomModal';
import CustomConfirmModal from '../../components/CustomConfirmModal';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import ModalSelector from 'react-native-modal-selector';
import ImagePickerModal from '../../components/ImagePickerModal';
import { database, auth, storage } from '../../firebaseConfig';
import { MemberLoan } from '../../api';

// Safely extract an error message without assuming shape
const getErrorMessage = (err) => {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (typeof err.message === 'string') return err.message;
  try { return JSON.stringify(err); } catch { return 'Unknown error'; }
};

// Upload image to Firebase Storage using v8 compat
const uploadImageToFirebase = async (uri, folder, memberId) => {
  try {
    // Create a unique filename with timestamp and user ID to avoid collisions
    const timestamp = new Date().getTime();
    const uniqueFilename = `${memberId}_${timestamp}_${Math.floor(Math.random() * 1000)}`;
    const fileExtension = uri.split('.').pop() || 'jpeg';
    const filename = `${uniqueFilename}.${fileExtension}`;
    
    // Use a user-specific folder path to improve security
    const userFolder = `users/${memberId}/${folder}`;
    const imageRef = storage.ref(`${userFolder}/${filename}`);
    
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Upload the image using v8 compat syntax
    await imageRef.put(blob);
    
    // Get the download URL
    const downloadURL = await imageRef.getDownloadURL();
    return downloadURL;
  } catch (error) {
    console.error('Image upload failed:', error);
    
    // Provide more specific error messages based on the error type
    if (error.code === 'storage/unauthorized') {
      throw new Error('Permission denied: You do not have permission to upload images. Please contact support.');
    } else if (error.code === 'storage/canceled') {
      throw new Error('Upload was canceled');
    } else if (error.code === 'storage/unknown') {
      throw new Error('An unknown error occurred during upload');
    } else {
      throw new Error('Failed to upload image: ' + error.message);
    }
  }
};

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
  // Saved accounts from Members
  const [bankAccName, setBankAccName] = useState('');
  const [bankAccNum, setBankAccNum] = useState('');
  const [gcashAccName, setGcashAccName] = useState('');
  const [gcashAccNum, setGcashAccNum] = useState('');
  const [balance, setBalance] = useState(0);
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // Collateral related states
  const [requiresCollateral, setRequiresCollateral] = useState(false);
  const [collateralType, setCollateralType] = useState('');
  const [collateralValue, setCollateralValue] = useState('');
  const [collateralDescription, setCollateralDescription] = useState('');
  const [showCollateralModal, setShowCollateralModal] = useState(false);
  const [proofOfCollateral, setProofOfCollateral] = useState(null);
  const [showImageOptions, setShowImageOptions] = useState(false);
  
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
  const [processingFee, setProcessingFee] = useState(0);
  const [loanTypeOptions, setLoanTypeOptions] = useState([
    { key: 'Regular Loan', label: 'Regular Loan' },
    { key: 'Quick Cash', label: 'Quick Cash' },
  ]);

  // Track member investment only (pending applications not shown)
  const [investment, setInvestment] = useState(0);

  const accountNumberInput = useRef(null);

  // Per-loan-type interest rates from System Settings
  // Structure: { [loanType]: { [termMonths]: ratePercent } }
  const [interestRatesByType, setInterestRatesByType] = useState({});
  const [availableTerms, setAvailableTerms] = useState([]); // [{ key, label, interestRate }]



  const disbursementOptions = [
    { key: 'GCash', label: 'GCash' },
    { key: 'Bank', label: 'Bank' },
    { key: 'Cash', label: 'Cash' },
  ];

  const collateralOptions = [
    { key: 'Property', label: 'Property' },
    { key: 'Vehicle', label: 'Vehicle' },
    { key: 'Jewelry', label: 'Jewelry' },
    { key: 'Electronics', label: 'Electronics' },
    { key: 'Other', label: 'Other' },
  ];

  // Auto-toggle collateral requirement based on amount vs balance
  useEffect(() => {
    const amt = Number(loanAmount) || 0;
    const bal = Number(balance) || 0;
    if (amt > bal) {
      setRequiresCollateral(true);
    } else {
      setRequiresCollateral(false);
    }
  }, [loanAmount, balance]);

  // Check if all required fields are filled
  const isFormValid = () => {
    const disb = disbursement;
    const accountsOk = disb === 'Cash' || (accountName && accountNumber);
    const basicFieldsValid =
      loanAmount &&
      term &&
      disbursement &&
      accountsOk;

    if (requiresCollateral) {
      return basicFieldsValid &&
        collateralType &&
        collateralValue &&
        collateralDescription &&
        proofOfCollateral;
    }

    return basicFieldsValid;
  };

  const logTransactionApplication = async (memberId, transactionId, payload) => {
    try {
      const txnRef = database.ref(`Transactions/Loans/${memberId}/${transactionId}`);
      await txnRef.set({ ...payload, label: 'Loan', type: 'Loans' });
    } catch (e) { /* ignore */ }
  };

  // Check if all collateral fields are filled
  const isCollateralValid = () => {
    return collateralType && collateralValue && collateralDescription && proofOfCollateral;
  };

  const handleLoanTypeChange = (option) => {
    const selectedType = option.key;
    setLoanType(selectedType);

    // Build available terms from per-type interest map
    const mapForType = (interestRatesByType && interestRatesByType[selectedType]) || {};
    const sortedTerms = Object.keys(mapForType).sort((a, b) => Number(a) - Number(b));
    const computed = sortedTerms.map((t) => ({
      key: t,
      label: `${t} ${t === '1' ? 'Month' : 'Months'}`,
      // Convert percent stored in DB to decimal for calculations
      interestRate: (Number(mapForType[t]) || 0) / 100,
    }));
    setAvailableTerms(computed);

    // Auto-pick first allowed term (if any) and set rate
    if (computed.length > 0) {
      setTerm(computed[0].key);
      setInterestRate(computed[0].interestRate);
    } else {
      setTerm('');
      setInterestRate(0);
    }
  };

  const handleTermChange = (option) => {
    setTerm(option.key);
    setInterestRate(option.interestRate);
  };

  // Update available terms when loanType or interest map changes (e.g., initial load)
  useEffect(() => {
    if (!loanType) return;

    const mapForType = (interestRatesByType && interestRatesByType[loanType]) || {};
    const sorted = Object.keys(mapForType).sort((a,b)=>Number(a)-Number(b));
    const computed = sorted.map((t) => ({
      key: t,
      label: `${t} ${t === '1' ? 'Month' : 'Months'}`,
      interestRate: (Number(mapForType[t]) || 0) / 100
    }));
    setAvailableTerms(computed);

    if (!computed.find(o => o.key === term)) {
      if (computed.length > 0) {
        setTerm(computed[0].key);
        setInterestRate(computed[0].interestRate);
      } else {
        setTerm('');
        setInterestRate(0);
      }
    } else {
      const current = computed.find(o => o.key === term);
      if (current) setInterestRate(current.interestRate);
    }
  }, [loanType, interestRatesByType]);

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
      const settingsRef = database.ref('Settings');
      const snapshot = await settingsRef.once('value');
      if (snapshot.exists()) {
        const settings = snapshot.val();
        const loanPercentage = settings.LoanPercentage || 80; // Default to 80%
        setLoanableAmountPercentage(loanPercentage);
        
        // Processing fee
        const processingFeeValue = settings.ProcessingFee || 0; // Default to 0
        setProcessingFee(processingFeeValue);
        
        // Loan types (canonical map under Settings/LoanTypes only)
        const lt = settings.LoanTypes;
        const isMap = lt && typeof lt === 'object' && !Array.isArray(lt);
        const typesArr = isMap ? Object.keys(lt) : [];
        const formattedLoanTypes = typesArr.map(type => ({ key: type, label: type }));
        setLoanTypeOptions(formattedLoanTypes);

        // Per-loan-type interest rates map from canonical LoanTypes only
        const byType = isMap ? lt : {};
        setInterestRatesByType(byType);

        // Initialize available terms for current loanType from per-type map
        const mapForType = (byType && byType[loanType]) || {};
        const sorted = Object.keys(mapForType).sort((a,b)=>Number(a)-Number(b));
        const computed = sorted.map((t) => ({
          key: t,
          label: `${t} ${t === '1' ? 'Month' : 'Months'}`,
          interestRate: (Number(mapForType[t]) || 0) / 100
        }));
        setAvailableTerms(computed);

        // If current selected term isn't allowed anymore, reset it
        if (!computed.find(o => o.key === term)) {
          if (computed.length > 0) {
            setTerm(computed[0].key);
            setInterestRate(computed[0].interestRate);
          } else {
            setTerm('');
            setInterestRate(0);
          }
        } else {
          // Ensure interest matches selected term
          const current = computed.find(o => o.key === term);
          if (current) setInterestRate(current.interestRate);
        }
      }
    } catch (error) {
      console.error('Error fetching system settings:', getErrorMessage(error));
      // Keep defaults if error
    }
  };

  const calculateMaxLoanableAmount = (userBalance, percentage) => {
    const maxAmount = (userBalance * percentage) / 100;
    setMaxLoanableAmount(maxAmount);
    return maxAmount;
  };

  const fetchUserData = async (userEmail) => {
    const membersRef = database.ref('Members');
    try {
      const snapshot = await membersRef.once('value');
      if (snapshot.exists()) {
        const members = snapshot.val();
        const foundUser = Object.values(members).find(member => member.email === userEmail);
        if (foundUser) {
          const userBalance = foundUser.balance || 0;
          const userInvestment = foundUser.investment || foundUser.investments || 0;
          setBalance(userBalance);
          setInvestment(Number(userInvestment) || 0);
          setMemberId(foundUser.id || '');
          setUserId(foundUser.id || '');
          setFirstName(foundUser.firstName || '');
          setLastName(foundUser.lastName || '');

          // Capture saved disbursement accounts
          setBankAccName(foundUser.bankAccName || '');
          setBankAccNum(foundUser.bankAccNum || '');
          setGcashAccName(foundUser.gcashAccName || '');
          setGcashAccNum(foundUser.gcashAccNum || '');
          
          // Calculate max loanable amount (legacy, but not used for gating anymore)
          calculateMaxLoanableAmount(userBalance, loanableAmountPercentage);
          
          // Check for existing loans and pending applications
          await checkExistingLoans(userEmail);
          // no need to compute total amount anymore
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
      console.error('Error fetching user data:', getErrorMessage(error));
      setAlertMessage('Error loading user information.');
      setAlertType('error');
      setAlertModalVisible(true);
    }
  };

  const checkExistingLoans = async (userEmail) => {
    try {
      // Check CurrentLoans table for existing active loans
      const currentLoansRef = database.ref('Loans/CurrentLoans');
      const currentSnapshot = await currentLoansRef.once('value');

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

      // No longer block for "any" pending application; we'll compute total amount instead
      setHasPendingApplication(false);
    } catch (error) {
      console.error('Error checking existing loans and applications:', error);
      setHasExistingLoan(false);
      setHasPendingApplication(false);
    }
  };

  // Check if user has any existing pending application in LoanApplications
  const hasAnyPendingApplication = async (memberId) => {
    try {
      const applicationsRef = database.ref(`Loans/LoanApplications/${memberId}`);
      const snapshot = await applicationsRef.once('value');
      if (!snapshot.exists()) return false;
      const apps = snapshot.val();
      for (const id in apps) {
        const a = apps[id];
        if ((a?.status || 'pending') === 'pending') return true;
      }
      return false;
    } catch (e) {
      console.error('Error checking pending applications:', e);
      return false;
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

  // Auto-trigger collateral requirement when loan amount exceeds member balance
  useEffect(() => {
    const loanAmountNum = parseFloat(loanAmount) || 0;
    const memberBalance = parseFloat(balance) || 0;
    
    if (loanAmountNum > 0 && memberBalance > 0) {
      if (loanAmountNum > memberBalance) {
        // Loan amount exceeds balance, require collateral
        if (!requiresCollateral) {
          setRequiresCollateral(true);
          // Show a brief message to inform the user
          setAlertMessage('Loan amount exceeds your balance. Collateral is required for this loan.');
          setAlertType('info');
          setAlertModalVisible(true);
        }
      } else {
        // Loan amount is within balance, collateral not required (but user can still choose to provide it)
        // Don't automatically set to false as user might want to provide collateral anyway
      }
    }
  }, [loanAmount, balance, requiresCollateral]);

  useEffect(() => {
    const handleBackPress = () => {
      navigation.reset({ index: 0, routes: [{ name: 'AppHome' }] });
      return true; // prevent default pop
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => subscription.remove();
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

    // Also capture a separate time and a numeric timestamp for consistency with approvals
    const timeApplied = now.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const timestamp = now.getTime();

    const applicationDataWithMeta = {
      ...applicationData,
      id: userId,
      firstName,
      lastName,
      email,
      transactionId,
      dateApplied, // "August 01, 2025 at 20:15"
      timeApplied, // e.g., "20:15"
      timestamp, // Unix ms
      loanType,
      status: 'pending' // Explicit status
    };

    const applicationRef = database.ref(`Loans/LoanApplications/${userId}/${transactionId}`);
    await applicationRef.set(applicationDataWithMeta);

    // Log into Transactions for unified feed (Applications table)
    const txnRef = database.ref(`Transactions/Loans/${userId}/${transactionId}`);
    await txnRef.set({ ...applicationDataWithMeta, label: 'Loan', type: 'Loans' });

    return true;
  } catch (error) {
    console.error('Failed to store loan application:', getErrorMessage(error));
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
      // Use centralized API client (picks URL from api.js)
      await MemberLoan(loanData);
      console.log('API call completed successfully in background');
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
    
    // Upload collateral image to Firebase Storage if provided
    let proofOfCollateralUrl = '';
    if (requiresCollateral && proofOfCollateral) {
      try {
        setIsUploadingImage(true);
        console.log('Uploading collateral image to Firebase Storage...');
        proofOfCollateralUrl = await uploadImageToFirebase(proofOfCollateral, 'collateral_proofs', memberId);
        console.log('Collateral image uploaded successfully:', proofOfCollateralUrl);
        setIsUploadingImage(false);
      } catch (uploadError) {
        console.error('Failed to upload collateral image:', uploadError);
        setIsUploadingImage(false);
        setAlertMessage(uploadError.message || 'Failed to upload collateral image. Please try again.');
        setAlertType('error');
        setAlertModalVisible(true);
        setIsLoading(false);
        return;
      }
    }
    
    const applicationData = {
      loanAmount: loanAmountNum,
      term,
      disbursement,
      accountName,
      accountNumber,
      // Store percent value (e.g., 3 for 3%) from canonical LoanTypes only
      interestRate: Number(interestRatesByType?.[loanType]?.[term]) || 0,
      firstName,
      lastName,
      email,
      userId,
      loanType,
      requiresCollateral,
      ...(requiresCollateral && {
        collateralType,
        collateralValue,
        collateralDescription,
        proofOfCollateralUrl // Now contains the Firebase Storage URL
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
      // Reset to Home to avoid stacking ApplyLoan on back stack
      navigation.reset({ index: 0, routes: [{ name: 'AppHome' }] });
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
    const loanAmountNum = parseFloat(loanAmount) || 0;
    const processingFeeNum = parseFloat(processingFee) || 0;
    const releaseAmount = loanAmountNum - processingFeeNum;

    let message = `Loan Type: ${loanType}\n` +
      `Loan Amount: ₱${loanAmountNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
      `Processing Fee: ₱${processingFeeNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
      `Release Amount: ₱${releaseAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
      `Term: ${term} ${term === '1' ? 'Month' : 'Months'}\n` +
      `Disbursement: ${disbursement}` +
      (disbursement === 'Cash' ? '' : `\nAccount Name: ${accountName}\nAccount Number: ${accountNumber}`);

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
    console.log('Form validation debug:', {
      isFormValid: isFormValid(),
      requiresCollateral,
      isCollateralValid: isCollateralValid(),
      collateralType,
      collateralValue,
      collateralDescription,
      proofOfCollateral: !!proofOfCollateral,
      loanAmount,
      term,
      disbursement,
      accountName,
      accountNumber
    });
    
    if (!isFormValid()) {
      let message = 'All required fields must be filled';
      if (requiresCollateral && !isCollateralValid()) {
        message = 'Please complete all collateral details including uploading proof of collateral';
      }
      setAlertMessage(message);
      setAlertType('error');
      setAlertModalVisible(true);
      return;
    }

    // Allow multiple active loans as long as member's investment won't go down to 0

    // 1) Optional: still prevent duplicate pending applications for same member
    if (memberId) {
      const exists = await hasAnyPendingApplication(memberId);
      if (exists) {
        setAlertMessage('You already have a pending loan application. Please wait for it to be processed before submitting another.');
        setAlertType('error');
        setAlertModalVisible(true);
        return;
      }
    }

    // 2) Collateral rule: you can borrow up to your full balance without collateral. Above balance requires collateral.
    const loanAmountNum = Number(loanAmount) || 0;
    const userBalance = Number(balance) || 0;

    if (userBalance <= 0) {
      setAlertMessage('You have no available balance to support a new loan.');
      setAlertType('error');
      setAlertModalVisible(true);
      return;
    }

    // If amount exceeds balance, require collateral; otherwise, no collateral needed
    if (loanAmountNum > userBalance) {
      // Ensure collateral details are provided
      if (!isCollateralValid()) {
        setRequiresCollateral(true);
        setAlertMessage('Loan amount exceeds your balance. Please add collateral or lower the amount.');
        setAlertType('error');
        setAlertModalVisible(true);
        return;
      }
      // Collateral provided; proceed
      setRequiresCollateral(true);
    } else {
      setRequiresCollateral(false);
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
    setProofOfCollateral(null);
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

  const handleSelectProofOfCollateral = () => {
    setShowImageOptions(true);
  };

  return (
    <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header with centered title and left back button using invisible spacers */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.headerSide} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={28} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Apply Loan</Text>
        <View style={styles.headerSide} />
      </View>

      <View style={styles.content}>
        {/* Investment only */}
        <Text style={styles.label}>Investment Limit</Text>
        <Text style={styles.balanceText}>{formatCurrency(investment)}</Text>

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
        
        {/* Collateral Required Indicator */}
        {requiresCollateral && parseFloat(loanAmount) > parseFloat(balance) && (
          <View style={styles.collateralIndicator}>
            <MaterialIcons name="security" size={16} color="#ff9800" />
            <Text style={styles.collateralIndicatorText}>
              Collateral required - Loan amount exceeds your balance
            </Text>
          </View>
        )}

        {/* Collateral Details Button */}
        {requiresCollateral && (
          <TouchableOpacity 
            style={styles.collateralButton}
            onPress={() => setShowCollateralModal(true)}
          >
            <MaterialIcons name="security" size={20} color="#2D5783" />
            <Text style={styles.collateralButtonText}>
              {collateralType ? 'Edit Collateral Details' : 'Add Collateral Details'}
            </Text>
            <MaterialIcons name="arrow-forward-ios" size={16} color="#2D5783" />
          </TouchableOpacity>
        )}

        {/* Collateral Summary */}
        {requiresCollateral && collateralType && (
          <View style={styles.collateralSummary}>
            <Text style={styles.collateralSummaryTitle}>Collateral Summary</Text>
            <Text style={styles.collateralSummaryText}>Type: {collateralType}</Text>
            <Text style={styles.collateralSummaryText}>Value: ₱{parseFloat(collateralValue || 0).toLocaleString()}</Text>
            <Text style={styles.collateralSummaryText}>Description: {collateralDescription}</Text>
          </View>
        )}

        <Text style={styles.label}><RequiredField>Term</RequiredField></Text>
        <ModalSelector
          data={availableTerms}
          initValue="Select Loan Term"
          onChange={handleTermChange}
          style={styles.picker}
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
          onChange={(option) => {
            const key = option.key;
            setDisbursement(key);
            // Auto-fill from saved accounts, clear for Cash
            if (key === 'Bank') {
              setAccountName(bankAccName || '');
              setAccountNumber((bankAccNum || '').toString());
            } else if (key === 'GCash') {
              setAccountName(gcashAccName || '');
              setAccountNumber((gcashAccNum || '').toString());
            } else if (key === 'Cash') {
              setAccountName('');
              setAccountNumber('');
            } else {
              setAccountName('');
              setAccountNumber('');
            }
          }}
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
          editable={false}
          style={[styles.input, { backgroundColor: '#F3F4F6' }]} 
          placeholder={disbursement === 'Cash' ? 'Not required for Cash' : 'Auto-filled from your profile'}
        />

        <Text style={styles.label}><RequiredField>Account Number</RequiredField></Text>
        <TextInput
          value={accountNumber}
          editable={false}
          style={[styles.input, { backgroundColor: '#F3F4F6' }]}
          keyboardType="numeric"
          ref={accountNumberInput}
          placeholder={disbursement === 'Cash' ? 'Not required for Cash' : 'Auto-filled from your profile'}
        />

        {/* Collateral Modal */}
        <Modal
          visible={showCollateralModal}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowCollateralModal(false)}
        >
          <ScrollView style={styles.collateralScreen}>
            <View style={styles.headerRow}>
              <TouchableOpacity style={styles.headerSide} onPress={() => setShowCollateralModal(false)}>
                <MaterialIcons name="arrow-back" size={28} color="#0F172A" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Collateral Details</Text>
              <View style={styles.headerSide} />
            </View>

            <View style={styles.content}>
              <Text style={styles.label}><RequiredField>Collateral Type</RequiredField></Text>
              <ModalSelector
                data={collateralOptions}
                initValue="Select Collateral Type"
                onChange={(option) => setCollateralType(option.key)}
                style={styles.picker}
                modalStyle={{ justifyContent: 'flex-end', margin: 0 }}
                overlayStyle={{ justifyContent: 'flex-end' }}
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
                style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
                multiline
              />

              {/* Proof of Collateral */}
              <Text style={styles.label}><RequiredField>Proof of Collateral</RequiredField></Text>
              {proofOfCollateral ? (
                <TouchableOpacity onPress={() => setShowImageOptions(true)}>
                  <Image source={{ uri: proofOfCollateral }} style={styles.proofPreview} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.uploadButton} onPress={() => setShowImageOptions(true)}>
                  <MaterialIcons name="photo-camera" size={24} color="#2D5783" />
                  <Text style={styles.uploadButtonText}>Add Photo</Text>
                </TouchableOpacity>
              )}

              <View style={{ height: 8 }} />

              <View style={{ marginTop: 20, gap: 12 }}>
                <TouchableOpacity 
                  style={[styles.submitButton, !isCollateralValid() && styles.disabledButton]}
                  onPress={() => {
                    if (isCollateralValid()) {
                      setRequiresCollateral(true);
                      setShowCollateralModal(false);
                      setAlertMessage('Collateral details saved successfully!');
                      setAlertType('success');
                      setAlertModalVisible(true);
                    }
                  }}
                  disabled={!isCollateralValid()}
                >
                  <Text style={styles.submitButtonText}>Save Collateral Details</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.submitButton, styles.secondaryButton]}
                  onPress={() => setShowCollateralModal(false)}
                >
                  <Text style={[styles.submitButtonText, styles.secondaryButtonText]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </Modal>

        {/* Image Picker for Proof of Collateral */}
        <ImagePickerModal
          visible={showImageOptions}
          onClose={() => setShowImageOptions(false)}
          onImageSelected={(uri) => setProofOfCollateral(uri)}
          title="Select Proof of Collateral"
        />

        <TouchableOpacity 
          style={[styles.submitButton, (!isFormValid() || isLoading) && styles.disabledButton]} 
          onPress={handleSubmit}
          disabled={!isFormValid() || isLoading}
        >
          {isLoading ? (
            <>
              <ActivityIndicator size="small" color="#000" />
              <Text style={[styles.submitButtonText, { marginLeft: 8 }]}>
                {isUploadingImage ? 'Uploading Image...' : 'Submitting...'}
              </Text>
            </>
          ) : (
            <Text style={styles.submitButtonText}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>
      </ScrollView>



      {/* Loading Overlay */}
      {isLoading && (
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



      {/* Detailed Confirmation Modal - match PayLoan structure */}
      <Modal visible={confirmModalVisible} transparent animationType="fade">
        <View style={styles.centeredModal}>
          <View style={styles.modalCard}>
            <MaterialIcons name="info" size={40} color="#2C5282" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>
              {requiresCollateral || confirmMessage.toLowerCase().includes('requires collateral') ? 'Collateral Required' : 'Confirm Loan Application'}
            </Text>
            <View style={styles.modalContent}>
              {requiresCollateral || confirmMessage.toLowerCase().includes('requires collateral') ? (
                <Text style={styles.modalText}>
                  loan amount is more than the loanable amount, this requires collateral, do you want to continue?
                </Text>
              ) : (
                <>
                  <Text style={styles.modalText}>Balance: {formatCurrency(balance)}</Text>
                  <Text style={styles.modalText}>Loan Type: {loanType}</Text>
                  <Text style={styles.modalText}>Loan Amount: {formatCurrency(loanAmount || 0)}</Text>
                  <Text style={styles.modalText}>Processing Fee: {formatCurrency(processingFee || 0)}</Text>
                  <Text style={styles.modalText}>Release Amount: {formatCurrency((parseFloat(loanAmount || 0) - parseFloat(processingFee || 0)) || 0)}</Text>
                  <Text style={styles.modalText}>Term: {term} {term === '1' ? 'Month' : 'Months'}</Text>
                  <Text style={styles.modalText}>Interest Rate: {(Number(interestRate) * 100).toFixed(1)}%</Text>
                  <Text style={styles.modalText}>Disbursement: {disbursement}</Text>
                  <Text style={styles.modalText}>Account Name: {accountName}</Text>
                  <Text style={styles.modalText}>Account Number: {accountNumber}</Text>
                  {requiresCollateral && (
                    <>
                      <Text style={[styles.modalText, { marginTop: 8, fontWeight: '700', color: '#2C5282' }]}>Collateral Details</Text>
                      <Text style={styles.modalText}>Type: {collateralType}</Text>
                      <Text style={styles.modalText}>Value: {formatCurrency(collateralValue || 0)}</Text>
                      <Text style={styles.modalText}>Description: {collateralDescription}</Text>
                    </>
                  )}
                </>
              )}
            </View>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  setConfirmModalVisible(false);
                  if (requiresCollateral && confirmMessage.toLowerCase().includes('requires collateral')) {
                    setShowCollateralModal(true);
                  }
                }}
              >
                <Text style={styles.cancelButtonText}>{requiresCollateral ? 'No' : 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={() => {
                  setConfirmModalVisible(false);
                  if (confirmAction) { confirmAction(); setConfirmAction(null); }
                }}
              >
                <Text style={styles.confirmButtonText}>{requiresCollateral ? 'Yes' : 'Submit'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'left',
    marginBottom: 16,
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
    fontSize: 28,
    marginBottom: 12,
    textAlign: 'center',
    color: '#1E3A5F',
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  collateralIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    gap: 8,
  },
  collateralIndicatorText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '500',
    flex: 1,
  },
  collateralButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF3FF',
    borderColor: '#2D5783',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    gap: 8,
  },
  collateralButtonText: {
    fontSize: 14,
    color: '#2D5783',
    fontWeight: '600',
    flex: 1,
  },
  collateralSummary: {
    backgroundColor: '#f8f9fa',
    borderColor: '#dee2e6',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  collateralSummaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D5783',
    marginBottom: 8,
  },
  collateralSummaryText: {
    fontSize: 13,
    color: '#495057',
    marginBottom: 4,
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
    width: '100%',
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
  secondaryButton: {
    backgroundColor: '#f8f9fa',
    borderColor: '#6c757d',
    borderWidth: 1,
  },
  secondaryButtonText: {
    color: '#6c757d',
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
  proofPreview: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2D5783',
    borderRadius: 10,
    backgroundColor: '#EAF3FF',
  },
  uploadButtonText: {
    color: '#2D5783',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Collateral screen container using same card layout as ApplyLoan form
  collateralScreen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
    minWidth: '48%',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  continueButton: {
    backgroundColor: '#4FE7AF',
  },
  modalButtonText: {
    color: 'black',
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
  // Modal styles matching PayLoan.js structure
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
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2C5282',
  },
  modalContent: {
    width: '100%',
    marginBottom: 20,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    minWidth: '45%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#2C5282',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ApplyLoan;