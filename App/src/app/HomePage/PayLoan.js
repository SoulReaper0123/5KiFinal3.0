import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, StyleSheet, 
  TouchableOpacity, Alert, ScrollView, Image, 
  ActivityIndicator, Modal, BackHandler, KeyboardAvoidingView, Platform, RefreshControl
} from 'react-native';
import CustomModal from '../../components/CustomModal';
import ImagePickerModal from '../../components/ImagePickerModal';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import ModalSelector from 'react-native-modal-selector';
import * as ImagePicker from 'expo-image-picker';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref as dbRef, set, get } from 'firebase/database';
import { storage, database, auth } from '../../firebaseConfig';
import { MemberPayment } from '../../api';

const PayLoan = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const [paymentOption, setPaymentOption] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [amountToBePaid, setAmountToBePaid] = useState('');
  const [proofOfPayment, setProofOfPayment] = useState(null);
  const [email, setEmail] = useState('');
  const [memberId, setMemberId] = useState('');
  const [balance, setBalance] = useState(0);
  const [interest, setInterest] = useState(0);
  const [interestRate, setInterestRate] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingApiData, setPendingApiData] = useState(null);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [alertType, setAlertType] = useState('error');
  const [paymentAccounts, setPaymentAccounts] = useState({
    Bank: { accountName: '', accountNumber: '' },
    GCash: { accountName: '', accountNumber: '' }
  });
  
  // Loan and penalty states
  const [currentLoan, setCurrentLoan] = useState(null);
  const [activeLoans, setActiveLoans] = useState([]); // list of active loans for member
  const [selectedLoanId, setSelectedLoanId] = useState(null); // which loan is selected for payment
  const [penaltyAmount, setPenaltyAmount] = useState(0);
  const [penaltyPerDay, setPenaltyPerDay] = useState(100); // Default penalty
  const [totalAmountDue, setTotalAmountDue] = useState(0);
  const [overdueDays, setOverdueDays] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const paymentOptions = [
    { key: 'Bank', label: 'Bank' },
    { key: 'GCash', label: 'GCash' },
    { key: 'Cash-on-Hand', label: 'Cash-on-Hand' },
  ];

  useEffect(() => {
    const initializeUserData = async () => {
      try {
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
        console.error('Error initializing user data:', error);
        setAlertMessage('Error loading user information.');
        setAlertType('error');
        setAlertModalVisible(true);
      }
    };

    initializeUserData();
    fetchPaymentSettings();
  }, [route.params]);

  useEffect(() => {
    const handleBackPress = () => {
      navigation.navigate('AppHome');
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
  
    return () => backHandler.remove(); 
  }, [navigation]);

  useEffect(() => {
    if (memberId) {
      fetchApprovedLoans();
    }
  }, [memberId]);

  useEffect(() => {
    if (email) {
      fetchCurrentLoans(email);
    }
  }, [email]);

  // Recalculate penalty when interest changes
  useEffect(() => {
    console.log('PayLoan - Interest changed:', interest);
    if (currentLoan) {
      console.log('PayLoan - Recalculating penalty due to interest change');
      calculatePenaltyAndTotal(currentLoan);
    }
  }, [interest]);

  // Refresh function
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh all data
      await fetchPaymentSettings();
      if (email) {
        await fetchUserData(email);
        await fetchCurrentLoan(email);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Recalculate penalty when current loan changes
  useEffect(() => {
    console.log('PayLoan - Current loan changed:', currentLoan);
    if (currentLoan) {
      console.log('PayLoan - Recalculating penalty due to loan change');
      // Calculate even if penaltyPerDay is 0, it will use default or fetch from settings
      calculatePenaltyAndTotal(currentLoan);
    }
  }, [currentLoan]);

  const fetchPaymentSettings = async () => {
    try {
      const settingsRef = dbRef(database, 'Settings/Accounts');
      const snapshot = await get(settingsRef);
      if (snapshot.exists()) {
        setPaymentAccounts(snapshot.val());
      } else {
        // Fallback to old path if Accounts doesn't exist
        const oldSettingsRef = dbRef(database, 'Settings/PaymentAccounts');
        const oldSnapshot = await get(oldSettingsRef);
        if (oldSnapshot.exists()) {
          setPaymentAccounts(oldSnapshot.val());
        }
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error);
    }
  };

  const fetchUserData = async (userEmail) => {
    const membersRef = dbRef(database, 'Members');
    try {
      const snapshot = await get(membersRef);
      if (snapshot.exists()) {
        const members = snapshot.val();
        const foundUser = Object.values(members).find(member => member.email === userEmail);
        if (foundUser) {
          setBalance(foundUser.balance || 0);
          setEmail(userEmail);
          setMemberId(foundUser.id);
          setFirstName(foundUser.firstName || '');
          setLastName(foundUser.lastName || '');
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchSystemSettings = async () => {
    try {
      const settingsRef = dbRef(database, 'Settings');
      const snapshot = await get(settingsRef);
      if (snapshot.exists()) {
        const settings = snapshot.val();
        const penalty = parseFloat(settings.PenaltyValue) || 100; // Default to 100 pesos per day
        console.log('PayLoan - Fetched penalty value from settings:', penalty);
        setPenaltyPerDay(penalty);
      } else {
        console.log('PayLoan - No settings found, using default penalty:', 100);
        setPenaltyPerDay(100);
      }
    } catch (error) {
      console.error('PayLoan - Error fetching system settings:', error);
      // Keep default penalty value
      setPenaltyPerDay(100);
    }
  };

  // Fetch all current loans for the member and support multiple selections
  const fetchCurrentLoans = async (userEmail) => {
    try {
      const currentLoansRef = dbRef(database, 'Loans/CurrentLoans');
      const snapshot = await get(currentLoansRef);
      
      const found = [];
      if (snapshot.exists()) {
        const allCurrentLoans = snapshot.val();
        for (const mId in allCurrentLoans) {
          const loans = allCurrentLoans[mId];
          for (const loanId in loans) {
            const loan = loans[loanId];
            if (loan?.email === userEmail) {
              found.push({ ...loan, _loanId: loanId, _memberId: mId });
            }
          }
        }
      }

      if (found.length > 0) {
        setActiveLoans(found);
        // default to first loan if none selected
        const first = found[0];
        setSelectedLoanId(first._loanId);
        setCurrentLoan(first);
      } else {
        setActiveLoans([]);
        setSelectedLoanId(null);
        setCurrentLoan(null);
      }
    } catch (error) {
      console.error('PayLoan - Error fetching current loans:', error);
    }
  };

  // Robust date formatter (similar to ExistingLoan.js)
  const formatDisplayDate = (dateInput) => {
    try {
      if (!dateInput) return 'N/A';

      // Handle Firebase Timestamp objects
      if (typeof dateInput === 'object' && dateInput.seconds !== undefined) {
        const date = new Date(dateInput.seconds * 1000);
        return date.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
      }

      // Handle string dates
      if (typeof dateInput === 'string') {
        // Try to parse the date
        const parsedDate = new Date(dateInput);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          });
        }
        return dateInput; // Return original if can't parse
      }

      // Handle Date objects
      if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
        return dateInput.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
      }

      return 'N/A';
    } catch (error) {
      console.warn('PayLoan - Date formatting error:', error);
      return 'N/A';
    }
  };

  // Simple overdue check (same as ExistingLoan.js)
  const isSimplyOverdue = (dueDate) => {
    try {
      if (!dueDate) return false;
      
      console.log('=== SIMPLE OVERDUE CHECK START ===');
      console.log('Input due date:', dueDate, typeof dueDate);
      
      // Handle different date formats
      let dueDateObj;
      
      if (typeof dueDate === 'string') {
        // Try direct parsing first
        dueDateObj = new Date(dueDate);
        
        // If that fails, try manual parsing for "August 20, 2025" format
        if (isNaN(dueDateObj.getTime())) {
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
          
          const parts = dueDate.split(' ');
          if (parts.length === 3) {
            const monthName = parts[0];
            const day = parseInt(parts[1].replace(',', ''));
            const year = parseInt(parts[2]);
            const monthIndex = monthNames.indexOf(monthName);
            
            if (monthIndex !== -1) {
              dueDateObj = new Date(year, monthIndex, day);
            }
          }
        }
      } else {
        dueDateObj = new Date(dueDate);
      }
      
      const today = new Date();
      
      // Set both dates to start of day for accurate comparison
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const dueDateStart = new Date(dueDateObj.getFullYear(), dueDateObj.getMonth(), dueDateObj.getDate());
      
      const isOverdue = todayStart > dueDateStart;
      
      console.log('Due date string:', dueDate);
      console.log('Parsed due date:', dueDateObj);
      console.log('Due date (start of day):', dueDateStart);
      console.log('Today (start of day):', todayStart);
      console.log('Is overdue (simple):', isOverdue);
      
      // TEMPORARY: Force August 20, 2025 to be overdue for testing
      if (dueDate === 'August 20, 2025') {
        console.log('PayLoan - FORCING August 20, 2025 to be overdue for testing');
        console.log('=== SIMPLE OVERDUE CHECK END ===');
        return true;
      }
      
      console.log('=== SIMPLE OVERDUE CHECK END ===');
      
      return isOverdue;
    } catch (error) {
      console.warn('Simple overdue check error:', error);
      return false;
    }
  };

  // Robust date parser (similar to ExistingLoan.js)
  const parseDateTime = (dateInput) => {
    try {
      if (!dateInput) return new Date();

      console.log('PayLoan - Parsing date input:', dateInput, typeof dateInput);

      // Firebase Timestamp
      if (typeof dateInput === 'object' && dateInput.seconds !== undefined) {
        const parsed = new Date(dateInput.seconds * 1000);
        console.log('PayLoan - Parsed Firebase timestamp:', parsed);
        return parsed;
      }

      // Handle string dates
      if (typeof dateInput === 'string') {
        // Handle "mm/dd/yyyy at 00:00" format
        if (dateInput.includes(' at ')) {
          const [datePart, timePart] = dateInput.split(' at ');
          if (datePart.includes('/')) {
            const [month, day, year] = datePart.split('/');
            const [hours, minutes] = timePart.split(':');
            const parsed = new Date(year, month - 1, day, hours, minutes);
            console.log('PayLoan - Parsed mm/dd/yyyy at HH:MM format:', parsed);
            return parsed;
          } else {
            // Handle "Month DD, YYYY at HH:MM" format
            const parsed = new Date(dateInput.replace(' at ', ' '));
            if (!isNaN(parsed.getTime())) {
              console.log('PayLoan - Parsed Month DD, YYYY at HH:MM format:', parsed);
              return parsed;
            }
          }
        }

        // Handle "August 20, 2025" format
        if (/^[A-Za-z]+ \d{1,2}, \d{4}$/.test(dateInput)) {
          const parsed = new Date(dateInput + ' 00:00:00');
          console.log('PayLoan - Parsed "Month DD, YYYY" format:', parsed);
          if (!isNaN(parsed.getTime())) {
            return parsed;
          }
        }

        // Try direct parsing for "August 20, 2025" format (alternative method)
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'];
        
        const parts = dateInput.split(' ');
        if (parts.length === 3) {
          const monthName = parts[0];
          const day = parseInt(parts[1].replace(',', ''));
          const year = parseInt(parts[2]);
          const monthIndex = monthNames.indexOf(monthName);
          
          if (monthIndex !== -1) {
            const parsed = new Date(year, monthIndex, day);
            console.log('PayLoan - Parsed using manual method:', parsed);
            if (!isNaN(parsed.getTime())) {
              return parsed;
            }
          }
        }

        // Handle "YYYY-MM-DD" format
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
          const parsed = new Date(dateInput + 'T00:00:00');
          console.log('PayLoan - Parsed YYYY-MM-DD format:', parsed);
          return parsed;
        }

        // Handle ISO string or other standard formats
        const parsed = new Date(dateInput);
        if (!isNaN(parsed.getTime())) {
          console.log('PayLoan - Parsed standard format:', parsed);
          return parsed;
        }
      }

      // Handle Date objects
      if (dateInput instanceof Date) {
        console.log('PayLoan - Already a Date object:', dateInput);
        return dateInput;
      }

      // Fallback to native Date parsing
      const fallback = new Date(dateInput);
      console.log('PayLoan - Fallback parsing:', fallback);
      return fallback;
    } catch (error) {
      console.warn('PayLoan - Date parsing error:', error);
      return new Date(); // Return current date as fallback
    }
  };

  const calculatePenaltyAndTotal = (loan) => {
    console.log('PayLoan - calculatePenaltyAndTotal called with loan:', loan);
    if (!loan || (!loan.dueDate && !loan.nextDueDate)) {
      console.log('PayLoan - No loan or due date found');
      setPenaltyAmount(0);
      setTotalAmountDue(loan?.totalMonthlyPayment || 0);
      setOverdueDays(0);
      return;
    }

    try {
      const currentDueDate = loan.dueDate || loan.nextDueDate;
      console.log('PayLoan - Calculating penalty for due date:', currentDueDate);
      console.log('PayLoan - Current penalty per day from settings:', penaltyPerDay);
      
      // Parse due date using same logic as isSimplyOverdue
      let dueDateObj;
      
      if (typeof currentDueDate === 'string') {
        // Try direct parsing first
        dueDateObj = new Date(currentDueDate);
        
        // If that fails, try manual parsing for "August 20, 2025" format
        if (isNaN(dueDateObj.getTime())) {
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
          
          const parts = currentDueDate.split(' ');
          if (parts.length === 3) {
            const monthName = parts[0];
            const day = parseInt(parts[1].replace(',', ''));
            const year = parseInt(parts[2]);
            const monthIndex = monthNames.indexOf(monthName);
            
            if (monthIndex !== -1) {
              dueDateObj = new Date(year, monthIndex, day);
            }
          }
        }
      } else {
        dueDateObj = new Date(currentDueDate);
      }
      
      const today = new Date();
      
      // Set time to start of day for accurate comparison
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const dueDateStart = new Date(dueDateObj.getFullYear(), dueDateObj.getMonth(), dueDateObj.getDate());
      
      console.log('PayLoan - Due date (start of day):', dueDateStart.toDateString());
      console.log('PayLoan - Today (start of day):', todayStart.toDateString());
      
      // Check if overdue using our isSimplyOverdue function
      const isCurrentlyOverdue = isSimplyOverdue(currentDueDate);
      
      if (isCurrentlyOverdue) {
        // Calculate overdue days
        let daysDiff;
        
        // TEMPORARY: Force 2 days overdue for August 20, 2025 testing
        if (currentDueDate === 'August 20, 2025') {
          daysDiff = 2;
          console.log('PayLoan - FORCING 2 days overdue for August 20, 2025 testing');
        } else {
          const timeDiff = todayStart.getTime() - dueDateStart.getTime();
          daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        }
        
        console.log('PayLoan - Days overdue:', daysDiff);
        console.log('PayLoan - Penalty per day:', penaltyPerDay);
        
        setOverdueDays(daysDiff);
        
        // NEW PENALTY CALCULATION: Interest × (Days Overdue ÷ 30)
        const loanInterest = parseFloat(loan.interest) || parseFloat(interest) || 0;
        const penalty = loanInterest * (daysDiff / 30);
        setPenaltyAmount(penalty);
        
        console.log('PayLoan - Loan interest:', loanInterest);
        console.log('PayLoan - Days overdue:', daysDiff);
        console.log('PayLoan - Penalty calculation: ', loanInterest, '× (', daysDiff, '÷ 30) =', penalty);
        
        const monthlyPayment = loan.totalMonthlyPayment || 0;
        const total = monthlyPayment + penalty;
        setTotalAmountDue(total);
        
        console.log('PayLoan - Monthly payment:', monthlyPayment);
        console.log('PayLoan - Penalty amount:', penalty);
        console.log('PayLoan - Total amount due:', total);
        console.log('PayLoan - === PENALTY CALCULATION COMPLETE ===');
      } else {
        // Not overdue
        console.log('PayLoan - Loan is not overdue');
        setOverdueDays(0);
        setPenaltyAmount(0);
        setTotalAmountDue(loan.totalMonthlyPayment || 0);
      }
    } catch (error) {
      console.error('PayLoan - Error calculating penalty:', error);
      setPenaltyAmount(0);
      setTotalAmountDue(loan?.totalMonthlyPayment || 0);
      setOverdueDays(0);
    }
  };

  const fetchApprovedLoans = async () => {
    const loansRef = dbRef(database, `ApprovedLoans/${memberId}`);
    try {
      const snapshot = await get(loansRef);
      if (snapshot.exists()) {
        const loanData = snapshot.val();
        setInterest(loanData.interest || 0);
        setInterestRate(loanData.interestRate || 0);
      }
    } catch (error) {
      console.error('Error fetching approved loans:', error);
    }
  };

  const handlePaymentOptionChange = (option) => {
    setPaymentOption(option.key);
    if (option.key === 'Cash-on-Hand') {
      setAccountNumber('');
      setAccountName('');
      return;
    }
    const selectedAccount = paymentAccounts[option.key];
    setAccountNumber(selectedAccount?.accountNumber || '');
    setAccountName(selectedAccount?.accountName || '');
  };

  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);

  useEffect(() => {
    setIsSubmitDisabled(!paymentOption || !amountToBePaid || !proofOfPayment);
  }, [paymentOption, amountToBePaid, proofOfPayment]);

  const handleSelectProofOfPayment = () => {
    setShowImagePicker(true);
  };

  const handleImageSelected = (imageUri) => {
    setProofOfPayment(imageUri);
  };

  const uploadImageToFirebase = async (uri, folder) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = uri.substring(uri.lastIndexOf('/') + 1);
      const imageRef = storageRef(storage, `${folder}/${filename}`);
      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);
      return downloadURL;
    } catch (error) {
      console.error('Image upload failed:', error);
      setErrorMessage('Failed to upload image');
      setErrorModalVisible(true);
      throw error;
    }
  };

  const storePaymentDataInDatabase = async (proofOfPaymentUrl, transactionId = null) => {
    const txnId = transactionId || generateTransactionId();
    try {
      const currentDate = new Date();
      const formattedDate = currentDate
        .toLocaleString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })
        .replace(',', '')
        .replace(/(\d{1,2}):(\d{2})/, (match, h, m) => `${String(h).padStart(2, '0')}:${m.padStart(2, '0')}`)
        .replace(/(\d{4}) (\d{2}:\d{2})/, '$1 at $2');

      // Unified payload used for both application and transactions feed
      const paymentData = {
        transactionId: txnId,
        id: memberId,
        email,
        firstName,
        lastName,
        paymentOption,
        interest,
        accountName,
        accountNumber,
        amountToBePaid: parseFloat(amountToBePaid),
        // Include penalty only when applicable
        ...(penaltyAmount > 0 ? { penalty: roundToCents(penaltyAmount), overdueDays } : {}),
        proofOfPaymentUrl,
        dateApplied: formattedDate,
        timestamp: currentDate.getTime(),
        status: 'pending',
        // Persist the selected loan so admin approves against the correct CurrentLoans entry
        selectedLoanId: selectedLoanId || (currentLoan ? currentLoan._loanId : null),
      };

      // Save application record
      const paymentRef = dbRef(database, `Payments/PaymentApplications/${memberId}/${txnId}`);
      await set(paymentRef, paymentData);

      // Also log into Transactions for unified feed (shows immediately in Transactions screen)
      const txnRef = dbRef(database, `Transactions/Payments/${memberId}/${txnId}`);
      await set(txnRef, paymentData);

      return txnId;
    } catch (error) {
      console.error('Failed to store payment data in Realtime Database:', error);
      setErrorMessage('Failed to store payment data');
      setErrorModalVisible(true);
      throw error;
    }
  };

  const generateTransactionId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSubmit = async () => {
    if (!paymentOption || !amountToBePaid || !proofOfPayment) {
      setAlertMessage('All fields are required');
      setAlertType('error');
      setAlertModalVisible(true);
      return;
    }

    if (isNaN(amountToBePaid) || parseFloat(amountToBePaid) <= 0) {
      setAlertMessage('Please enter a valid amount');
      setAlertType('error');
      setAlertModalVisible(true);
      return;
    }

    // Validate payment amount against total amount due
    const paymentAmount = roundToCents(amountToBePaid);
    const totalDueRounded = roundToCents(totalAmountDue);

    // If overdue, require payment >= total due (allow equality). If not overdue, allow any positive amount
    if (overdueDays > 0 && paymentAmount < totalDueRounded) {
      let message = `Payment amount must be at least ₱${totalDueRounded.toFixed(2)}`;
      
      if (penaltyAmount > 0) {
        message += `\n\nBreakdown:
• Monthly Payment: ₱${roundToCents(currentLoan?.totalMonthlyPayment || 0).toFixed(2)}
• Late Fee (${overdueDays} days overdue): ₱${roundToCents(penaltyAmount).toFixed(2)}
• Total Amount Due: ₱${totalDueRounded.toFixed(2)}`;
      }
      
      setAlertMessage(message);
      setAlertType('error');
      setAlertModalVisible(true);
      return;
    }

    // Show confirmation modal
    setConfirmModalVisible(true);
  };
  
  const submitPayment = async () => {
    setIsLoading(true);
    setConfirmModalVisible(false);
    
    try {
      const proofOfPaymentUrl = await uploadImageToFirebase(proofOfPayment, 'proofsOfPayment');
      await storePaymentDataInDatabase(proofOfPaymentUrl);

      // Prepare payment data for API call to run when user clicks OK
      const paymentData = {
        email,
        firstName,
        lastName,
        amount: parseFloat(amountToBePaid),
        paymentMethod: paymentOption,
        date: new Date().toISOString(),
      };

      // Store payment data to be used when user clicks OK
      setPendingApiData(paymentData);

      // Show success modal
      setAlertMessage('Your loan payment has been submitted successfully. It will be processed shortly.');
      setAlertType('success');
      setAlertModalVisible(true);
    } catch (error) {
      console.error('Error during payment submission:', {
        error: error?.message || error || 'Unknown error',
        stack: error?.stack,
        paymentData: {
          email,
          amount: amountToBePaid,
          paymentOption
        }
      });
      
      setAlertMessage('An unexpected error occurred. Please try again later.');
      setAlertType('error');
      setAlertModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const resetFormFields = () => {
    setPaymentOption('');
    setAccountNumber('');
    setAccountName('');
    setAmountToBePaid('');
    setProofOfPayment(null);
    setPendingApiData(null);
  };

  const formatCurrency = (amount) => {
    return `₱${parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  // Round any value to 2 decimal places to avoid floating precision issues
  const roundToCents = (value) => {
    const num = parseFloat(value) || 0;
    return Math.round((num + Number.EPSILON) * 100) / 100;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3A7F0D']}
            tintColor="#3A7F0D"
          />
        }
      >
        {/* Header with centered title and left back button using invisible spacers */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.headerSide} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={28} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pay Loan</Text>
        <View style={styles.headerSide} />
      </View>
        <View style={styles.content}>
          <Text style={styles.label}>Balance</Text>
          <Text style={styles.balanceText}>{formatCurrency(balance)}</Text>

          {/* Loans list and details */}
          {activeLoans.length > 0 && (
            <View style={styles.loanInfoContainer}>
              <Text style={styles.sectionTitle}>Select Loan</Text>
              {activeLoans.map((ln) => (
                <View
                  key={ln._loanId}
                  style={[styles.loanSelectItem, selectedLoanId === ln._loanId ? styles.loanSelectItemActive : null]}
                >
                  {/* Left: tap whole loan row to navigate to details */}
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => {
                      setSelectedLoanId(ln._loanId);
                      setCurrentLoan(ln);
                      navigation.navigate('PayLoanDetails', {
                        item: {
                          ...ln,
                          outstandingBalance: parseFloat(ln.loanAmount || ln.outstandingBalance || 0),
                        }
                      });
                    }}
                  >
                    <Text style={styles.loanSelectTitle}>{ln.loanType || 'Loan'}</Text>
                    <Text style={styles.loanSelectSub}>{`Amount: ${formatCurrency(ln.loanAmount || ln.outstandingBalance || 0)}`}</Text>
                    <Text style={styles.loanSelectSub}>{`Due: ${formatDisplayDate(ln.dueDate || ln.nextDueDate)}`}</Text>
                  </TouchableOpacity>

                  {/* Right: checkbox only toggles selection (no navigation) */}
                  <TouchableOpacity
                    style={styles.checkboxArea}
                    onPress={() => {
                      setSelectedLoanId(ln._loanId);
                      setCurrentLoan(ln);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {selectedLoanId === ln._loanId ? (
                      <MaterialIcons name="check-box" size={22} color="#2D5783" />
                    ) : (
                      <MaterialIcons name="check-box-outline-blank" size={22} color="#94A3B8" />
                    )}
                  </TouchableOpacity>
                </View>
              ))}

              {/* Current Loan Information moved to PayLoanDetails screen */}
            </View>
          )}

          <Text style={styles.label}>Payment Option<Text style={styles.required}>*</Text></Text>
          <ModalSelector
            data={paymentOptions}
            initValue="Select Payment Option"
            onChange={handlePaymentOptionChange}
            style={styles.picker}
            modalStyle={{ justifyContent: 'flex-end', margin: 0 }}
            overlayStyle={{ justifyContent: 'flex-end' }}
          >
            <TouchableOpacity style={styles.pickerContainer}>
              <Text style={styles.pickerText}>{paymentOption || 'Select Payment Option'}</Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="black" /> 
            </TouchableOpacity>
          </ModalSelector>

          <Text style={styles.label}>Account Name</Text>
          <TextInput 
            value={accountName} 
            placeholder={paymentOption === 'Cash-on-Hand' ? 'Not required for Cash-on-Hand' : ''}
            style={[styles.input, styles.fixedInput]} 
            editable={false} 
          />

          <Text style={styles.label}>Account Number</Text>
          <TextInput 
            value={accountNumber} 
            placeholder={paymentOption === 'Cash-on-Hand' ? 'Not required for Cash-on-Hand' : ''}
            style={[styles.input, styles.fixedInput]} 
            editable={false} 
          />

          <Text style={styles.label}>Amount to be Paid<Text style={styles.required}>*</Text></Text>
          <TextInput
            placeholder="Enter Amount"
            value={amountToBePaid}
            onChangeText={setAmountToBePaid}
            style={styles.input}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Proof of Payment<Text style={styles.required}>*</Text></Text>
          <TouchableOpacity 
            onPress={handleSelectProofOfPayment} 
            style={styles.imagePreviewContainer}
          >
            {proofOfPayment ? (
              <Image source={{ uri: proofOfPayment }} style={styles.imagePreview} />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <MaterialIcons name="photo" size={100} color="#ccc" />
                <Text style={styles.uploadPromptText}>Tap to Upload</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.submitButton, isSubmitDisabled && styles.disabledButton]} 
            onPress={handleSubmit}
            disabled={isSubmitDisabled}
          >
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal visible={confirmModalVisible} transparent animationType="fade">
        <View style={styles.centeredModal}>
          <View style={styles.modalCard}>
            <MaterialIcons name="help-outline" size={40} color="#2C5282" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Confirm Payment</Text>
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>Balance: {formatCurrency(balance)}</Text>
              {currentLoan && (
                <>
                  <Text style={styles.modalText}>Loan Amount: {formatCurrency(currentLoan.loanAmount || currentLoan.outstandingBalance || 0)}</Text>
                  <Text style={styles.modalText}>Monthly Payment: {formatCurrency(currentLoan.totalMonthlyPayment || 0)}</Text>
                  <Text style={[
                    styles.modalText, 
                    penaltyAmount > 0 ? { color: '#FF0000', fontWeight: 'bold' } : null
                  ]}>
                    Penalty: {penaltyAmount > 0 ? 
                      `${formatCurrency(penaltyAmount)} (₱${(currentLoan?.interest || interest || 0).toFixed(2)} × ${overdueDays}/30 days)` : 
                      formatCurrency(0)
                    }
                  </Text>
                  <Text style={[
                    styles.modalText, 
                    penaltyAmount > 0 ? { color: '#FF0000', fontWeight: 'bold' } : null
                  ]}>Total Amount Due: {formatCurrency(totalAmountDue)}</Text>
                </>
              )}
              <Text style={styles.modalText}>Payment Option: {paymentOption}</Text>
              <Text style={styles.modalText}>Account Name: {accountName}</Text>
              <Text style={styles.modalText}>Account Number: {accountNumber}</Text>
              <Text style={styles.modalText}>Amount to be Paid: {formatCurrency(amountToBePaid)}</Text>
            </View>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setConfirmModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={submitPayment}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Success Modal */}
      <Modal visible={successModalVisible} transparent animationType="fade">
        <View style={styles.centeredModal}>
          <View style={styles.modalCard}>
            <MaterialIcons name="check-circle" size={40} color="#4CAF50" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Success</Text>
            <Text style={styles.modalText}>
              Payment submitted successfully. You will receive a confirmation email shortly.
            </Text>
            <TouchableOpacity 
              style={[styles.modalButton, styles.confirmButton]} 
              onPress={() => {
                setSuccessModalVisible(false);
                resetFormFields();
                navigation.navigate('Home');
              }}
            >
              <Text style={styles.confirmButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Error Modal */}
      <Modal visible={errorModalVisible} transparent animationType="fade">
        <View style={styles.centeredModal}>
          <View style={styles.modalCard}>
            <MaterialIcons name="error" size={40} color="#f44336" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Error</Text>
            <View style={styles.modalContent}>
              <Text style={[styles.modalText]}>{errorMessage}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.modalButton, styles.confirmButton]} 
              onPress={() => setErrorModalVisible(false)}
            >
              <Text style={styles.confirmButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
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
        type={alertType}
        title={alertType === 'success' ? 'Success' : 'Error'}
        message={alertMessage}
        onClose={() => {
          setAlertModalVisible(false);
          if (alertType === 'success' && pendingApiData) {
            // Navigate immediately and run API in background
            resetFormFields();
            navigation.navigate('Home');
            
            // Run API call in background after navigation
            setTimeout(async () => {
              try {
                await MemberPayment(pendingApiData);
                console.log('Payment API call completed successfully in background');
              } catch (apiError) {
                console.error('Background API call failed:', apiError?.message || apiError || 'Unknown API error');
                // API failure doesn't affect user experience since data is already in database
              }
              // Clear pending data
              setPendingApiData(null);
            }, 100);
          }
        }}
      />

      {/* Image Picker Modal */}
      <ImagePickerModal
        visible={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onImageSelected={handleImageSelected}
        title="Select Proof of Payment"
        showCropOptions={true}
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
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  fixedInput: {
    backgroundColor: 'white',
    color: 'black',
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
  imagePreviewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    height: 150,
    marginBottom: 15,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
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
  submitButtonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 18,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
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
    textAlign: 'left',
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
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  confirmButton: {
    backgroundColor: '#2C5282',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButtonText: {
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
    color: '#2C5282',
  },
  required: {
    color: 'red',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.6,
  },
  uploadPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadPromptText: {
    color: '#2D5783',
    marginTop: 10,
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Loan information styles
  loanInfoContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginVertical: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5783',
    marginBottom: 10,
    textAlign: 'center',
  },
  // Loan select row (each item)
  loanSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },
  loanSelectItemActive: {
    borderColor: '#2D5783',
    backgroundColor: '#F1F5F9',
  },
  loanSelectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  loanSelectSub: {
    fontSize: 12,
    color: '#475569',
  },
  checkboxArea: {
    paddingLeft: 12,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loanInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  loanInfoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  loanInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  loanInfoValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end'
  },
  overdueBadge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#FEE2E2',
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '600',
    borderRadius: 4,
    textAlign: 'center',
  },
  overdueText: {
    color: '#FF0000',
    fontWeight: 'bold',
  },
  normalText: {
    color: '#333',
  },
  totalRow: {
    backgroundColor: '#e9ecef',
    padding: 8,
    borderRadius: 5,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D5783',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D5783',
  },
  // Separator line style
  separatorLine: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 10,
  },
  // Overdue warning styles
  overdueWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE6E6',
    borderColor: '#FF0000',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  overdueWarningText: {
    color: '#FF0000',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  // Overdue total amount styles
  overdueTotal: {
    backgroundColor: '#FFE6E6',
    borderColor: '#FF0000',
    borderWidth: 1,
  },
  overdueTotalLabel: {
    color: '#FF0000',
    fontWeight: 'bold',
  },
  overdueTotalValue: {
    color: '#FF0000',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default PayLoan;