import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TextInput, StyleSheet, 
  TouchableOpacity, Alert, ScrollView, Image, 
  ActivityIndicator, Modal, BackHandler, KeyboardAvoidingView, Platform, RefreshControl
} from 'react-native';
import CustomModal from '../../components/CustomModal';
import CustomConfirmModal from '../../components/CustomConfirmModal';
import { MaterialIcons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/MaterialIcons';
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

  // Loan payment states
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

  // Image handling states (same as RegisterPage2)
  const [showSourceOptions, setShowSourceOptions] = useState(false);
  const [showCropOptions, setShowCropOptions] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const [currentImageType, setCurrentImageType] = useState(null);
  const [currentSetFunction, setCurrentSetFunction] = useState(null);
  const [pendingImageAction, setPendingImageAction] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('error');
  const [browserInfo, setBrowserInfo] = useState({});

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
    fetchSystemSettings();
    
    // Detect browser and platform information
    if (Platform.OS === 'web') {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isChrome = /chrome|chromium/i.test(userAgent);
      const isFirefox = /firefox/i.test(userAgent);
      const isSafari = /safari/i.test(userAgent) && !/chrome/i.test(userAgent);
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isIOS = /iphone|ipad|ipod/i.test(userAgent);
      const isAndroid = /android/i.test(userAgent);

      setBrowserInfo({
        isChrome,
        isFirefox,
        isSafari,
        isMobile,
        isIOS,
        isAndroid,
        userAgent
      });
    }
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

  // Request permissions
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        try {
          const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
          const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          
          if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
            setModalMessage('Camera and gallery permissions are required for image uploads');
            setModalType('error');
            setModalVisible(true);
          }
        } catch (error) {
          console.log('Permission request error:', error);
        }
      }
    })();
  }, []);

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
      await fetchSystemSettings();
      if (email) {
        await fetchUserData(email);
        await fetchCurrentLoans(email);
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
    // FIXED: Add check for active loans and selected loan
    const hasActiveLoans = activeLoans.length > 0;
    const hasSelectedLoan = selectedLoanId !== null;
    const hasRequiredFields = paymentOption && amountToBePaid && proofOfPayment;
    
    setIsSubmitDisabled(!hasActiveLoans || !hasSelectedLoan || !hasRequiredFields);
  }, [paymentOption, amountToBePaid, proofOfPayment, activeLoans, selectedLoanId]);

  // IMAGE HANDLING FUNCTIONS (same as RegisterPage2)

  // Show source selection options
  const showSourceSelection = (setImageFunction, imageType) => {
    setPendingImageAction({
      setFunction: setImageFunction,
      type: imageType
    });
    setShowSourceOptions(true);
  };

  // Handle camera selection
  const handleCameraSelection = async () => {
    console.log('Camera selected');
    setShowSourceOptions(false);
    
    try {
      if (Platform.OS === 'web') {
        const imageUri = await handleWebCameraCapture(pendingImageAction.type);
        console.log('Camera result:', imageUri ? 'Image captured' : 'Cancelled');
        if (imageUri) {
          setSelectedImageUri(imageUri);
          setCurrentSetFunction(() => pendingImageAction.setFunction);
          setCurrentImageType(pendingImageAction.type);
          setShowCropOptions(true);
        }
      } else {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets[0]) {
          const imageUri = result.assets[0].uri;
          setSelectedImageUri(imageUri);
          setCurrentSetFunction(() => pendingImageAction.setFunction);
          setCurrentImageType(pendingImageAction.type);
          setShowCropOptions(true);
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
      setModalMessage('Failed to capture image. Please try again.');
      setModalType('error');
      setModalVisible(true);
    }
    
    setPendingImageAction(null);
  };

  // Handle gallery selection
  const handleGallerySelection = async () => {
    console.log('Gallery selected');
    setShowSourceOptions(false);
    
    try {
      if (Platform.OS === 'web') {
        console.log('Using web gallery selection');
        const imageUri = await handleUniversalGallerySelection();
        console.log('Gallery result:', imageUri ? 'Image selected' : 'Cancelled');
        
        if (imageUri) {
          console.log('Setting crop options with image');
          setSelectedImageUri(imageUri);
          setCurrentSetFunction(() => pendingImageAction.setFunction);
          setCurrentImageType(pendingImageAction.type);
          setShowCropOptions(true);
        } else {
          console.log('No image selected from gallery');
        }
      } else {
        console.log('Using native gallery selection');
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets[0]) {
          const imageUri = result.assets[0].uri;
          setSelectedImageUri(imageUri);
          setCurrentSetFunction(() => pendingImageAction.setFunction);
          setCurrentImageType(pendingImageAction.type);
          setShowCropOptions(true);
        }
      }
    } catch (error) {
      console.error('Gallery error:', error);
      setModalMessage('Failed to select image from gallery. Please try again.');
      setModalType('error');
      setModalVisible(true);
    }
    
    setPendingImageAction(null);
  };

  // UNIVERSAL GALLERY SELECTION
  const handleUniversalGallerySelection = () => {
    return new Promise((resolve) => {
      if (Platform.OS !== 'web') {
        resolve(null);
        return;
      }

      console.log('Creating file input for gallery');
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.cssText = 'position: fixed; top: -1000px; left: -1000px; opacity: 0;';
      
      let resolved = false;
      
      const cleanup = () => {
        if (!resolved) {
          resolved = true;
          if (document.body.contains(input)) {
            document.body.removeChild(input);
          }
          resolve(null);
        }
      };
      
      const handleChange = (e) => {
        console.log('File input change event');
        const file = e.target.files[0];
        if (file) {
          console.log('File selected:', file.name, file.type, file.size);
          const reader = new FileReader();
          
          reader.onload = (event) => {
            console.log('File read successfully');
            if (!resolved) {
              resolved = true;
              document.body.removeChild(input);
              resolve(event.target.result);
            }
          };
          
          reader.onerror = () => {
            console.error('File read error');
            if (!resolved) {
              resolved = true;
              document.body.removeChild(input);
              resolve(null);
            }
          };
          
          reader.onabort = () => {
            console.log('File read aborted');
            if (!resolved) {
              resolved = true;
              document.body.removeChild(input);
              resolve(null);
            }
          };
          
          try {
            reader.readAsDataURL(file);
          } catch (error) {
            console.error('Error reading file:', error);
            cleanup();
          }
        } else {
          console.log('No file selected');
          cleanup();
        }
      };
      
      const handleCancel = () => {
        console.log('File selection cancelled');
        cleanup();
      };
      
      // Add event listeners
      input.addEventListener('change', handleChange);
      input.addEventListener('cancel', handleCancel);
      
      // Add to document and trigger click
      document.body.appendChild(input);
      
      // Set timeout for safety
      setTimeout(() => {
        if (!resolved) {
          console.log('Gallery selection timeout');
          cleanup();
        }
      }, 30000); // 30 second timeout
      
      console.log('Triggering file input click');
      input.click();
    });
  };

  // Web camera capture - CORRECT SELFIE ORIENTATION
  const handleWebCameraCapture = (imageType) => {
    return new Promise((resolve) => {
      if (Platform.OS !== 'web') {
        resolve(null);
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setModalMessage('Camera not supported in this browser. Please use gallery instead.');
        setModalType('error');
        setModalVisible(true);
        resolve(null);
        return;
      }

      // Use back camera for payment proof
      const facingMode = 'environment';
      
      navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      })
      .then((stream) => {
        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.playsInline = true;
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        const captureUI = document.createElement('div');
        captureUI.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.95);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          box-sizing: border-box;
        `;
        
        const contentContainer = document.createElement('div');
        contentContainer.style.cssText = `
          width: 100%;
          max-width: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        `;
        
        const cameraContainer = document.createElement('div');
        cameraContainer.style.cssText = `
          width: 100%;
          height: 400px;
          border-radius: 12px;
          overflow: hidden;
          background: #000;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        
        // Add camera frame/border that matches the camera size
        const cameraFrame = document.createElement('div');
        cameraFrame.style.cssText = `
          position: absolute;
          top: 10px;
          left: 10px;
          right: 10px;
          bottom: 10px;
          border: 3px solid white;
          border-radius: 8px;
          pointer-events: none;
          z-index: 2;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.3);
        `;
        
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          width: 100%;
        `;
        
        const captureButton = document.createElement('button');
        captureButton.textContent = 'Capture Photo';
        captureButton.style.cssText = `
          padding: 16px 24px;
          background: #1E3A5F;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
          max-width: 400px;
          transition: background 0.2s;
          box-shadow: 0 2px 8px rgba(30, 58, 95, 0.3);
        `;
        captureButton.onmouseover = () => captureButton.style.background = '#0F2A4A';
        captureButton.onmouseout = () => captureButton.style.background = '#1E3A5F';
        
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.style.cssText = `
          padding: 14px 24px;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
          max-width: 400px;
          transition: background 0.2s;
          box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
        `;
        cancelButton.onmouseover = () => cancelButton.style.background = '#b91c1c';
        cancelButton.onmouseout = () => cancelButton.style.background = '#dc2626';
        
        video.onloadedmetadata = () => {
          // Set video to fill the container completely
          video.style.width = '100%';
          video.style.height = '100%';
          video.style.objectFit = 'cover';
          
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          captureButton.onclick = () => {
            // For payment proof, draw normally (back camera)
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
            
            stream.getTracks().forEach(track => track.stop());
            document.body.removeChild(captureUI);
            resolve(imageDataUrl);
          };
          
          cancelButton.onclick = () => {
            stream.getTracks().forEach(track => track.stop());
            document.body.removeChild(captureUI);
            resolve(null);
          };
          
          cameraContainer.appendChild(video);
          cameraContainer.appendChild(cameraFrame);
          buttonContainer.appendChild(captureButton);
          buttonContainer.appendChild(cancelButton);
          contentContainer.appendChild(cameraContainer);
          contentContainer.appendChild(buttonContainer);
          captureUI.appendChild(contentContainer);
          document.body.appendChild(captureUI);
        };
        
        video.onerror = () => {
          stream.getTracks().forEach(track => track.stop());
          if (document.body.contains(captureUI)) {
            document.body.removeChild(captureUI);
          }
          resolve(null);
        };
      }).catch((error) => {
        console.error('Camera access error:', error);
        // If the preferred camera fails, try the other one as fallback
        console.log('Trying fallback camera...');
        const fallbackFacingMode = 'user';
        
        navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: fallbackFacingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          } 
        })
        .then((stream) => {
          // Same camera setup code as above but with fallback camera
          const video = document.createElement('video');
          video.srcObject = stream;
          video.autoplay = true;
          video.playsInline = true;
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          const captureUI = document.createElement('div');
          captureUI.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.95);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-sizing: border-box;
          `;
          
          const contentContainer = document.createElement('div');
          contentContainer.style.cssText = `
            width: 100%;
            max-width: 400px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
          `;
          
          const cameraContainer = document.createElement('div');
          cameraContainer.style.cssText = `
            width: 100%;
            height: 400px;
            border-radius: 12px;
            overflow: hidden;
            background: #000;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          `;
          
          const cameraFrame = document.createElement('div');
          cameraFrame.style.cssText = `
            position: absolute;
            top: 10px;
            left: 10px;
            right: 10px;
            bottom: 10px;
            border: 3px solid white;
            border-radius: 8px;
            pointer-events: none;
            z-index: 2;
            box-shadow: 0 0 0 1px rgba(255,255,255,0.3);
          `;
          
          const buttonContainer = document.createElement('div');
          buttonContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            width: 100%;
          `;
          
          const captureButton = document.createElement('button');
          captureButton.textContent = 'Capture Photo';
          captureButton.style.cssText = `
            padding: 16px 24px;
            background: #1E3A5F;
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            max-width: 400px;
            transition: background 0.2s;
            box-shadow: 0 2px 8px rgba(30, 58, 95, 0.3);
          `;
          captureButton.onmouseover = () => captureButton.style.background = '#0F2A4A';
          captureButton.onmouseout = () => captureButton.style.background = '#1E3A5F';
          
          const cancelButton = document.createElement('button');
          cancelButton.textContent = 'Cancel';
          cancelButton.style.cssText = `
            padding: 14px 24px;
            background: #dc2626;
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            max-width: 400px;
            transition: background 0.2s;
            box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
          `;
          cancelButton.onmouseover = () => cancelButton.style.background = '#b91c1c';
          cancelButton.onmouseout = () => cancelButton.style.background = '#dc2626';
          
          video.onloadedmetadata = () => {
            // Set video to fill the container completely
            video.style.width = '100%';
            video.style.height = '100%';
            video.style.objectFit = 'cover';
            
            // For front camera preview in fallback, mirror it
            if (fallbackFacingMode === 'user') {
              video.style.transform = 'scaleX(-1)';
            }
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            captureButton.onclick = () => {
              // Handle the captured image based on camera type
              if (fallbackFacingMode === 'user') {
                // For front camera, flip the captured image
                context.save();
                context.scale(-1, 1);
                context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
                context.restore();
              } else {
                // For back camera, draw normally
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
              }
              
              const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
              
              stream.getTracks().forEach(track => track.stop());
              document.body.removeChild(captureUI);
              resolve(imageDataUrl);
            };
            
            cancelButton.onclick = () => {
              stream.getTracks().forEach(track => track.stop());
              document.body.removeChild(captureUI);
              resolve(null);
            };
            
            cameraContainer.appendChild(video);
            cameraContainer.appendChild(cameraFrame);
            buttonContainer.appendChild(captureButton);
            buttonContainer.appendChild(cancelButton);
            contentContainer.appendChild(cameraContainer);
            contentContainer.appendChild(buttonContainer);
            captureUI.appendChild(contentContainer);
            document.body.appendChild(captureUI);
          };
          
          video.onerror = () => {
            stream.getTracks().forEach(track => track.stop());
            if (document.body.contains(captureUI)) {
              document.body.removeChild(captureUI);
            }
            resolve(null);
          };
        })
        .catch((fallbackError) => {
          console.error('Fallback camera also failed:', fallbackError);
          setModalMessage('Camera not available. Please use gallery instead.');
          setModalType('error');
          setModalVisible(true);
          resolve(null);
        });
      });
    });
  };

  // Handle crop selected image - PROPERLY SET THE CROPPED IMAGE
  const handleCropSelectedImage = async () => {
    if (!selectedImageUri) return;

    try {
      if (Platform.OS === 'web') {
        const croppedImage = await createInteractiveCrop(selectedImageUri, currentImageType);
        console.log('Cropped image result:', croppedImage ? 'Success' : 'Failed');
        
        if (croppedImage && currentSetFunction) {
          // FIX: Actually set the cropped image to the state
          currentSetFunction(croppedImage);
          console.log('Cropped image set to state successfully');
        } else {
          console.log('No cropped image to set');
        }
      } else {
        // For native, use Expo's built-in cropping
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets[0]) {
          currentSetFunction(result.assets[0].uri);
        }
      }
      
      // Close crop options regardless of success
      setShowCropOptions(false);
      setSelectedImageUri(null);
      setCurrentImageType(null);
      setCurrentSetFunction(null);
      
    } catch (error) {
      console.error('Crop error:', error);
      // If crop fails, just use the original image
      handleUseAsIs();
    }
  };

  // INTERACTIVE CROPPER WITH PROPER LANDSCAPE SUPPORT
  const createInteractiveCrop = (imageUri, imageType) => {
    return new Promise((resolve) => {
      if (Platform.OS !== 'web') {
        resolve(imageUri);
        return;
      }

      console.log('Creating interactive crop interface');
      const cropUI = document.createElement('div');
      cropUI.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.95);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-sizing: border-box;
      `;

      const container = document.createElement('div');
      container.style.cssText = `
        background: white;
        border-radius: 16px;
        padding: 24px;
        max-width: 95vw;
        max-height: 95vh;
        width: 500px;
        height: 600px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3);
        box-sizing: border-box;
      `;

      const title = document.createElement('h3');
      title.textContent = 'Crop Image';
      title.style.cssText = `
        color: #1E3A5F;
        margin: 0 0 16px 0;
        text-align: center;
        font-size: 20px;
        font-weight: 700;
        flex-shrink: 0;
      `;

      const cropArea = document.createElement('div');
      cropArea.style.cssText = `
        width: 100%;
        height: 400px;
        border: 2px solid #1E3A5F;
        border-radius: 12px;
        marginBottom: 16px;
        overflow: hidden;
        background: #f8fafc;
        position: relative;
        touch-action: none;
        flex-shrink: 0;
        box-sizing: border-box;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      `;

      const img = document.createElement('img');
      img.src = imageUri;
      img.style.cssText = `
        position: absolute;
        max-width: none;
        cursor: move;
        user-select: none;
        -webkit-user-select: none;
        -webkit-user-drag: none;
        transform-origin: center center;
        -webkit-touch-callout: none;
        -webkit-tap-highlight-color: transparent;
      `;

      const instructions = document.createElement('div');
      instructions.innerHTML = `
        <div style="color: #64748B; text-align: center; margin: 0 0 16px 0; font-size: 14px; line-height: 1.4; flex-shrink: 0;">
          <strong>Pinch to zoom & drag to reposition</strong><br>
        </div>
      `;

      const buttonContainer = document.createElement('div');
      buttonContainer.style.cssText = `
        display: flex;
        gap: 8px;
        justify-content: center;
        flex-wrap: wrap;
        margin-top: auto;
        flex-shrink: 0;
      `;

      const cropButton = document.createElement('button');
      cropButton.innerHTML = '✓ Use This Crop';
      cropButton.style.cssText = `
        padding: 14px 16px;
        background: #1E3A5F;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        fontWeight: 600;
        cursor: pointer;
        flex: 1;
        min-width: 120px;
        transition: background 0.2s;
      `;
      cropButton.onmouseover = () => cropButton.style.background = '#0F2A4A';
      cropButton.onmouseout = () => cropButton.style.background = '#1E3A5F';

      const cancelCropButton = document.createElement('button');
      cancelCropButton.innerHTML = '✕ Cancel';
      cancelCropButton.style.cssText = `
        padding: 14px 16px;
        background: #dc2626;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        fontWeight: 600;
        cursor: pointer;
        flex: 1;
        min-width: 120px;
        transition: background 0.2s;
      `;
      cancelCropButton.onmouseover = () => cancelCropButton.style.background = '#b91c1c';
      cancelCropButton.onmouseout = () => cancelCropButton.style.background = '#dc2626';

      // Zoom and drag variables
      let scale = 1;
      let posX = 0;
      let posY = 0;
      let isDragging = false;
      let startX, startY;
      let initialDistance = null;

      // Touch event handlers for mobile
      const handleTouchStart = (e) => {
        e.preventDefault();
        if (e.touches.length === 1) {
          // Single touch - start dragging
          isDragging = true;
          startX = e.touches[0].clientX - posX;
          startY = e.touches[0].clientY - posY;
          img.style.cursor = 'grabbing';
        } else if (e.touches.length === 2) {
          // Two touches - start pinch to zoom
          initialDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
        }
      };

      const handleTouchMove = (e) => {
        e.preventDefault();
        
        if (isDragging && e.touches.length === 1) {
          // Dragging
          posX = e.touches[0].clientX - startX;
          posY = e.touches[0].clientY - startY;
          updateImageTransform();
        } else if (e.touches.length === 2 && initialDistance !== null) {
          // Pinch to zoom
          const currentDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          
          scale = Math.max(0.5, Math.min(3, scale * (currentDistance / initialDistance)));
          initialDistance = currentDistance;
          updateImageTransform();
        }
      };

      const handleTouchEnd = () => {
        isDragging = false;
        initialDistance = null;
        img.style.cursor = 'grab';
      };

      // Mouse event handlers for desktop
      const handleMouseDown = (e) => {
        e.preventDefault();
        isDragging = true;
        startX = e.clientX - posX;
        startY = e.clientY - posY;
        img.style.cursor = 'grabbing';
      };

      const handleMouseMove = (e) => {
        if (isDragging) {
          e.preventDefault();
          posX = e.clientX - startX;
          posY = e.clientY - startY;
          updateImageTransform();
        }
      };

      const handleMouseUp = () => {
        isDragging = false;
        img.style.cursor = 'grab';
      };

      // Wheel event for zoom on desktop
      const handleWheel = (e) => {
        e.preventDefault();
        const delta = -e.deltaY * 0.01;
        const newScale = Math.max(0.5, Math.min(3, scale + delta));
        
        // Zoom towards mouse position
        const rect = cropArea.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const scaleChange = newScale - scale;
        posX -= (mouseX - posX - rect.width / 2) * (scaleChange / scale);
        posY -= (mouseY - posY - rect.height / 2) * (scaleChange / scale);
        
        scale = newScale;
        updateImageTransform();
      };

      const updateImageTransform = () => {
        img.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
      };

      // Add event listeners
      img.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      cropArea.addEventListener('wheel', handleWheel, { passive: false });
      
      // Touch events - attach to cropArea for better mobile support
      cropArea.addEventListener('touchstart', handleTouchStart, { passive: false });
      cropArea.addEventListener('touchmove', handleTouchMove, { passive: false });
      cropArea.addEventListener('touchend', handleTouchEnd);

      // Improved image centering logic for both portrait and landscape
      const centerImage = () => {
        const containerWidth = cropArea.clientWidth;
        const containerHeight = cropArea.clientHeight;
        
        img.onload = function() {
          const imgWidth = this.naturalWidth;
          const imgHeight = this.naturalHeight;
          const imgAspectRatio = imgWidth / imgHeight;
          const containerAspectRatio = containerWidth / containerHeight;
          
          console.log('Image dimensions:', { imgWidth, imgHeight, imgAspectRatio });
          console.log('Container dimensions:', { containerWidth, containerHeight, containerAspectRatio });
          
          // Determine if image is portrait or landscape
          if (imgAspectRatio > containerAspectRatio) {
            // Landscape image - fit to width
            scale = (containerWidth / imgWidth) * 0.9;
            console.log('Landscape image - scaling to width');
          } else {
            // Portrait image - fit to height
            scale = (containerHeight / imgHeight) * 0.9;
            console.log('Portrait image - scaling to height');
          }
          
          // Calculate centered position
          const scaledWidth = imgWidth * scale;
          const scaledHeight = imgHeight * scale;
          posX = (containerWidth - scaledWidth) / 2;
          posY = (containerHeight - scaledHeight) / 2;
          
          console.log('Centered position:', { posX, posY, scale, scaledWidth, scaledHeight });
          updateImageTransform();
          img.style.cursor = 'grab';
        };
      };

      // Proper cropping logic for both portrait and landscape images
      cropButton.onclick = () => {
        console.log('Crop button clicked');
        
        // Get actual dimensions
        const containerWidth = cropArea.clientWidth;
        const containerHeight = cropArea.clientHeight;
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;
        
        console.log('Cropping dimensions:', {
          containerWidth, containerHeight, imgWidth, imgHeight, scale, posX, posY
        });
        
        // Create a canvas to crop the image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to match the visible crop area
        canvas.width = containerWidth;
        canvas.height = containerHeight;
        
        // Calculate the visible portion of the image in the crop area
        // Convert crop area coordinates to original image coordinates
        const visibleSourceX = Math.max(0, -posX / scale);
        const visibleSourceY = Math.max(0, -posY / scale);
        const visibleSourceWidth = Math.min(imgWidth - visibleSourceX, containerWidth / scale);
        const visibleSourceHeight = Math.min(imgHeight - visibleSourceY, containerHeight / scale);
        
        console.log('Visible source coordinates:', {
          visibleSourceX, visibleSourceY, visibleSourceWidth, visibleSourceHeight
        });
        
        // Clear canvas with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (visibleSourceWidth > 0 && visibleSourceHeight > 0) {
          // Draw exactly what's visible in the crop area
          ctx.drawImage(
            img,
            visibleSourceX, visibleSourceY,           // Source x, y
            visibleSourceWidth, visibleSourceHeight,   // Source width, height
            0, 0,                                     // Destination x, y
            canvas.width, canvas.height               // Destination width, height
          );
        }
        
        const croppedImageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        console.log('Image cropped successfully');
        
        // Cleanup event listeners
        cleanupEventListeners();
        document.body.removeChild(cropUI);
        resolve(croppedImageDataUrl);
      };

      cancelCropButton.onclick = () => {
        console.log('Cancel crop button clicked');
        cleanupEventListeners();
        document.body.removeChild(cropUI);
        resolve(null);
      };

      const cleanupEventListeners = () => {
        img.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        cropArea.removeEventListener('wheel', handleWheel);
        cropArea.removeEventListener('touchstart', handleTouchStart);
        cropArea.removeEventListener('touchmove', handleTouchMove);
        cropArea.removeEventListener('touchend', handleTouchEnd);
      };

      cropArea.appendChild(img);
      container.appendChild(title);
      container.appendChild(cropArea);
      container.appendChild(instructions);
      buttonContainer.appendChild(cropButton);
      buttonContainer.appendChild(cancelCropButton);
      container.appendChild(buttonContainer);
      cropUI.appendChild(container);
      document.body.appendChild(cropUI);
      
      // Center the image after it's added to DOM
      setTimeout(centerImage, 100);
      
      console.log('Crop interface created successfully');
    });
  };

  // Handle using the image as-is (no cropping)
  const handleUseAsIs = () => {
    if (currentSetFunction && selectedImageUri) {
      currentSetFunction(selectedImageUri);
      setShowCropOptions(false);
      setSelectedImageUri(null);
      setCurrentImageType(null);
      setCurrentSetFunction(null);
    }
  };

  // Handle Proof of Payment selection
  const handleProofOfPaymentPress = () => {
    showSourceSelection(setProofOfPayment, 'proofOfPayment');
  };

  // Get image source for display
  const getImageSource = (uri) => {
    if (!uri) return null;
    return { uri };
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
    // FIXED: Check if there are active loans and a loan is selected
    if (activeLoans.length === 0) {
      setAlertMessage('You have no active loans to pay.');
      setAlertType('error');
      setAlertModalVisible(true);
      return;
    }

    if (!selectedLoanId) {
      setAlertMessage('Please select a loan to pay.');
      setAlertType('error');
      setAlertModalVisible(true);
      return;
    }

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
          <TouchableOpacity 
            style={styles.headerSide} 
            onPress={() => navigation.navigate('AppHome')}  
          >
            <MaterialIcons name="arrow-back" size={28} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pay Loan</Text>
          <View style={styles.headerSide} />
        </View>
        
        <View style={styles.content}>
          <Text style={styles.label}>Balance</Text>
          <Text style={styles.balanceText}>{formatCurrency(balance)}</Text>

          {/* Loans list and details */}
          {activeLoans.length > 0 ? (
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

              {/* Show selected loan information */}
              {currentLoan && (
                <View style={styles.selectedLoanInfo}>
                  <Text style={styles.sectionTitle}>Selected Loan Details</Text>
                  <View style={styles.loanInfoRow}>
                    <Text style={styles.loanInfoLabel}>Loan Type:</Text>
                    <Text style={styles.loanInfoValue}>{currentLoan.loanType || 'N/A'}</Text>
                  </View>
                  <View style={styles.loanInfoRow}>
                    <Text style={styles.loanInfoLabel}>Loan Amount:</Text>
                    <Text style={styles.loanInfoValue}>{formatCurrency(currentLoan.loanAmount || currentLoan.outstandingBalance || 0)}</Text>
                  </View>
                  <View style={styles.loanInfoRow}>
                    <Text style={styles.loanInfoLabel}>Monthly Payment:</Text>
                    <Text style={styles.loanInfoValue}>{formatCurrency(currentLoan.totalMonthlyPayment || 0)}</Text>
                  </View>
                  <View style={styles.loanInfoRow}>
                    <Text style={styles.loanInfoLabel}>Due Date:</Text>
                    <Text style={styles.loanInfoValue}>{formatDisplayDate(currentLoan.dueDate || currentLoan.nextDueDate)}</Text>
                  </View>
                  {penaltyAmount > 0 && (
                    <>
                      <View style={styles.loanInfoRow}>
                        <Text style={styles.loanInfoLabel}>Overdue Days:</Text>
                        <Text style={[styles.loanInfoValue, styles.overdueText]}>{overdueDays} days</Text>
                      </View>
                      <View style={styles.loanInfoRow}>
                        <Text style={styles.loanInfoLabel}>Penalty:</Text>
                        <Text style={[styles.loanInfoValue, styles.overdueText]}>
                          {formatCurrency(penaltyAmount)}
                        </Text>
                      </View>
                    </>
                  )}
                  <View style={[styles.loanInfoRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total Amount Due:</Text>
                    <Text style={[
                      styles.totalValue, 
                      penaltyAmount > 0 ? styles.overdueText : styles.normalText
                    ]}>
                      {formatCurrency(totalAmountDue)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.noLoansContainer}>
              <MaterialIcons name="money-off" size={50} color="#94A3B8" />
              <Text style={styles.noLoansText}>No Active Loans</Text>
              <Text style={styles.noLoansSubText}>
                You don't have any active loans to pay at the moment.
              </Text>
            </View>
          )}

          <Text style={styles.label}>Payment Option<Text style={styles.required}>*</Text></Text>
          <ModalSelector
            data={paymentOptions}
            initValue="Select Payment Option"
            onChange={handlePaymentOptionChange}
            style={styles.picker}
            overlayStyle={{ 
              justifyContent: 'flex-end',
              paddingHorizontal: 0 
            }}
            optionContainerStyle={{
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              paddingVertical: 10,
            }}
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
            onPress={handleProofOfPaymentPress} 
            style={styles.imagePreviewContainer}
          >
            {proofOfPayment ? (
              <Image source={getImageSource(proofOfPayment)} style={styles.imagePreview} />
            ) : (
              <View style={styles.iconContainer}>
                <Icon name="add" size={40} color="#1E3A5F" />
                <Text style={styles.uploadText}>Tap to upload</Text>
                <Text style={styles.uploadSubText}>Camera or Gallery</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.submitButton, isSubmitDisabled && styles.disabledButton]} 
            onPress={handleSubmit}
            disabled={isSubmitDisabled}
          >
            <Text style={styles.submitButtonText}>
              {activeLoans.length === 0 ? 'No Active Loans' : 'Submit Payment'}
            </Text>
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
                navigation.navigate('AppHome');
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

      {/* Source Selection Modal */}
      <Modal
        transparent={true}
        visible={showSourceOptions}
        onRequestClose={() => setShowSourceOptions(false)}
        animationType="slide"
      >
        <View style={styles.modalBackground}>
          <View style={styles.sourceOptionsModal}>
            <Text style={styles.modalTitle}>Select Image Source</Text>
            
            <View style={styles.sourceButtonsContainer}>
              <TouchableOpacity 
                style={[styles.sourceOptionButton, styles.cameraButton]}
                onPress={handleCameraSelection}
              >
                <MaterialIcons name="photo-camera" size={30} color="#fff" />
                <Text style={styles.sourceOptionButtonText}>Take Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.sourceOptionButton, styles.galleryButton]}
                onPress={handleGallerySelection}
              >
                <MaterialIcons name="photo-library" size={30} color="#fff" />
                <Text style={styles.sourceOptionButtonText}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowSourceOptions(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Crop Options Modal */}
      <Modal
        transparent={true}
        visible={showCropOptions}
        onRequestClose={() => setShowCropOptions(false)}
        animationType="slide"
      >
        <View style={styles.modalBackground}>
          <View style={styles.cropOptionsModal}>
            <Text style={styles.modalTitle}>
              Proof of Payment Preview
            </Text>
            
            {selectedImageUri && (
              <View style={styles.previewImageContainer}>
                <Image source={getImageSource(selectedImageUri)} style={styles.previewImage} />
              </View>
            )}
            
            <Text style={styles.cropInstructions}>
              Would you like to crop this image?
            </Text>
            
            <View style={styles.cropButtonsContainer}>
              <TouchableOpacity 
                style={[styles.cropOptionButton, styles.useAsIsButton]}
                onPress={handleUseAsIs}
              >
                <MaterialIcons name="check" size={20} color="#fff" />
                <Text style={styles.cropOptionButtonText}>Use as is</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.cropOptionButton, styles.cropImageButton]}
                onPress={handleCropSelectedImage}
              >
                <MaterialIcons name="crop" size={20} color="#fff" />
                <Text style={styles.cropOptionButtonText}>Crop Image</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowCropOptions(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
            navigation.navigate('AppHome');
            
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

      {/* Custom Modal for general errors */}
      <CustomModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        message={modalMessage}
        type={modalType}
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
    fontSize: 15,
    marginBottom: 8,
    color: '#0F172A',
    fontWeight: '600',
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
    backgroundColor: 'white',
  },
  fixedInput: {
    backgroundColor: '#f8fafc',
    color: '#64748B',
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
    backgroundColor: 'white',
  },
  pickerText: {
    fontSize: 14,
    color: 'grey',
  },
  imagePreviewContainer: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 15,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '600',
  },
  uploadSubText: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 2,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  submitButton: {
    backgroundColor: '#4FE7AF',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '100%',
    marginTop: 12,
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '700',
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
  // Modal styles (matching RegisterPage2 design)
  modalBackground: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  sourceOptionsModal: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  cropOptionsModal: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%', 
    minHeight: 300, 
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    color: '#1E3A5F',
  },
  sourceButtonsContainer: {
    marginBottom: 16,
  },
  sourceOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  cameraButton: {
    backgroundColor: '#1E3A5F',
  },
  galleryButton: {
    backgroundColor: '#059669',
  },
  sourceOptionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  previewImageContainer: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  cropInstructions: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  cropButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  cropOptionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginHorizontal: 6,
  },
  useAsIsButton: {
    backgroundColor: '#059669',
  },
  cropImageButton: {
    backgroundColor: '#1E3A5F',
  },
  cropOptionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    padding: 14,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '600',
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
  selectedLoanInfo: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
  // No loans container
  noLoansContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 30,
    marginVertical: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noLoansText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#64748B',
    marginTop: 10,
    textAlign: 'center',
  },
  noLoansSubText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 20,
  },
});

export default PayLoan;
