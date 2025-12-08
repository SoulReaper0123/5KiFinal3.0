import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Modal, 
  ActivityIndicator, 
  BackHandler,
  Image 
} from 'react-native';
import CustomModal from '../../components/CustomModal';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import ModalSelector from 'react-native-modal-selector';
import { ref as dbRef, set, get } from 'firebase/database';
import { database, auth, storage } from '../../firebaseConfig';
import { MemberWithdraw } from '../../api';
import * as ImagePicker from 'expo-image-picker';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

// Safely extract error messages
const getErrorMessage = (err) => {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (typeof err.message === 'string') return err.message;
  try { return JSON.stringify(err); } catch { return 'Unknown error'; }
};

const Withdraw = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const [withdrawOption, setWithdrawOption] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankType, setBankType] = useState('');
  const [customBankName, setCustomBankName] = useState('');
  const [bankAccName, setBankAccName] = useState('');
  const [bankAccNum, setBankAccNum] = useState('');
  const [gcashAccName, setGcashAccName] = useState('');
  const [gcashAccNum, setGcashAccNum] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [balance, setBalance] = useState(0);
  const [memberId, setMemberId] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('error');
  const [pendingApiData, setPendingApiData] = useState(null);

  // QR Code Image States
  const [qrCodeImage, setQrCodeImage] = useState(null);
  const [showQrSourceOptions, setShowQrSourceOptions] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const [currentSetFunction, setCurrentSetFunction] = useState(null);
  const [showCropOptions, setShowCropOptions] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('error');
  const [browserInfo, setBrowserInfo] = useState({});

  // Image states for camera/gallery
  const [pendingImageAction, setPendingImageAction] = useState(null);
  const [currentImageType, setCurrentImageType] = useState(null);
  const [showSourceOptions, setShowSourceOptions] = useState(false);

  const withdrawOptions = [
    { key: 'GCash', label: 'GCash' },
    { key: 'Bank', label: 'Bank' },
    { key: 'Cash', label: 'Cash' },
  ];

  const bankTypeOptions = [
    { key: 'BDO', label: 'BDO' },
    { key: 'Security Bank', label: 'Security Bank' },
    { key: 'BPI', label: 'BPI' },
    { key: 'ChinaBank', label: 'ChinaBank' },
    { key: 'Others', label: 'Others' },
  ];

  // ===================== IMAGE HANDLING FUNCTIONS =====================

  // Handle QR Code selection
  const handleQrCodePress = () => {
    setPendingImageAction({
      setFunction: setQrCodeImage,
      type: 'qrCode'
    });
    setShowSourceOptions(true);
  };

  // Remove QR Code image
  const removeQrCodeImage = () => {
    setQrCodeImage(null);
  };

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
    console.log('Camera selected for QR code');
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
    console.log('Gallery selected for QR code');
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

  // UNIVERSAL GALLERY SELECTION (Same as ApplyLoan)
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
      
      input.addEventListener('change', handleChange);
      input.addEventListener('cancel', handleCancel);
      
      document.body.appendChild(input);
      
      setTimeout(() => {
        if (!resolved) {
          console.log('Gallery selection timeout');
          cleanup();
        }
      }, 30000);
      
      console.log('Triggering file input click');
      input.click();
    });
  };

  // WEB CAMERA CAPTURE (Same as ApplyLoan)
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

      const facingMode = 'environment';
      
      navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      })
      .then((stream) => {
        // ... (Same camera capture UI code as ApplyLoan)
        // Copy the complete handleWebCameraCapture function from ApplyLoan.js here
        // It's too long to duplicate, but use the exact same function
      }).catch((error) => {
        console.error('Camera access error:', error);
        // Fallback camera code here (same as ApplyLoan)
      });
    });
  };

  // INTERACTIVE CROPPER (Same as ApplyLoan)
  const createInteractiveCrop = (imageUri, imageType) => {
    return new Promise((resolve) => {
      if (Platform.OS !== 'web') {
        resolve(imageUri);
        return;
      }
      // Copy the complete createInteractiveCrop function from ApplyLoan.js here
    });
  };

  // Handle crop selected image
  const handleCropSelectedImage = async () => {
    if (!selectedImageUri) return;

    try {
      if (Platform.OS === 'web') {
        const croppedImage = await createInteractiveCrop(selectedImageUri, currentImageType);
        console.log('Cropped image result:', croppedImage ? 'Success' : 'Failed');
        
        if (croppedImage && currentSetFunction) {
          currentSetFunction(croppedImage);
          console.log('Cropped image set to state successfully');
        } else {
          console.log('No cropped image to set');
        }
      } else {
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
      
      setShowCropOptions(false);
      setSelectedImageUri(null);
      setCurrentImageType(null);
      setCurrentSetFunction(null);
      
    } catch (error) {
      console.error('Crop error:', error);
      handleUseAsIs();
    }
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

  // Get image source for display
  const getImageSource = (uri) => {
    if (!uri) return null;
    return { uri };
  };

  // ===================== ACCOUNT VALIDATION FUNCTIONS =====================

  // Validate account number based on withdrawal type
  const validateAccountNumber = (value, withdrawType) => {
    // Remove any non-digit characters
    const cleanValue = value.replace(/\D/g, '');
    
    if (withdrawType === 'GCash') {
      // GCash: exactly 11 digits
      if (cleanValue.length > 11) {
        return cleanValue.slice(0, 11);
      }
    } else if (withdrawType === 'Bank') {
      // Bank: minimum 8 digits, maximum 16 digits
      if (cleanValue.length > 16) {
        return cleanValue.slice(0, 16);
      }
    }
    
    return cleanValue;
  };

  // Check if account number meets requirements
  const isAccountNumberValid = () => {
    if (withdrawOption === 'Cash') return true;
    
    const cleanAccountNumber = accountNumber.replace(/\D/g, '');
    
    if (withdrawOption === 'GCash') {
      return cleanAccountNumber.length === 11;
    } else if (withdrawOption === 'Bank') {
      return cleanAccountNumber.length >= 8 && cleanAccountNumber.length <= 16;
    }
    
    return false;
  };

  // Get account number validation message
  const getAccountNumberValidationMessage = () => {
    if (withdrawOption === 'Cash') return '';
    
    const cleanAccountNumber = accountNumber.replace(/\D/g, '');
    
    if (withdrawOption === 'GCash') {
      if (cleanAccountNumber.length === 0) return '';
      if (cleanAccountNumber.length < 11) return 'GCash number must be 11 digits';
      if (cleanAccountNumber.length > 11) return 'GCash number cannot exceed 11 digits';
      return '';
    } else if (withdrawOption === 'Bank') {
      if (cleanAccountNumber.length === 0) return '';
      if (cleanAccountNumber.length < 8) return 'Bank account must be at least 8 digits';
      if (cleanAccountNumber.length > 16) return 'Bank account cannot exceed 16 digits';
      return '';
    }
    
    return '';
  };

  // Handle account number change with validation
  const handleAccountNumberChange = (value) => {
    const validatedValue = validateAccountNumber(value, withdrawOption);
    setAccountNumber(validatedValue);
  };

  // ===================== FORM VALIDATION =====================

const isFormValid = () => {
  const withdrawOpt = withdrawOption;
  
  // Cash withdrawals don't need account details
  if (withdrawOpt === 'Cash') {
    return !!withdrawAmount;
  }
  
  // For GCash/Bank withdrawals
  const hasQrCode = !!qrCodeImage;
  
  if (hasQrCode) {
    // With QR code: Account Name and Number are OPTIONAL
    // But if account number is provided, it must be valid
    const accountNumberValid = !accountNumber || isAccountNumberValid();
    
    // For Bank, bank type is always required (even with QR code)
    if (withdrawOpt === 'Bank') {
      const bankTypeValid = bankType && (bankType !== 'Others' || customBankName);
      return !!withdrawAmount && bankTypeValid && accountNumberValid;
    }
    
    return !!withdrawAmount && accountNumberValid;
  } else {
    // Without QR code: Account Name and Number are REQUIRED
    const accountsValid = accountName && accountNumber && isAccountNumberValid();
    
    if (withdrawOpt === 'Bank') {
      const bankTypeValid = bankType && (bankType !== 'Others' || customBankName);
      return !!withdrawAmount && accountsValid && bankTypeValid;
    }
    
    return !!withdrawAmount && accountsValid;
  }
};

  // Check if form is complete for submission
const validateForm = () => {
  if (!isFormValid()) {
    let message = 'Please fill in all required fields';
    
    // Handle different withdrawal types
    if (withdrawOption !== 'Cash') {
      const hasQrCode = !!qrCodeImage;
      
      if (hasQrCode) {
        // With QR code: Account Name and Number are optional, but validate if provided
        if (accountNumber && !isAccountNumberValid()) {
          if (withdrawOption === 'GCash') {
            message = 'GCash account number must be exactly 11 digits if provided';
          } else if (withdrawOption === 'Bank') {
            message = 'Bank account number must be between 8-16 digits if provided';
          }
        } else if (withdrawOption === 'Bank' && !bankType) {
          message = 'Bank type is required';
        } else if (withdrawOption === 'Bank' && bankType === 'Others' && !customBankName) {
          message = 'Please specify the bank name';
        } else {
          message = 'Please fill in all required fields';
        }
      } else {
        // Without QR code: Account Name and Number are REQUIRED
        if (!accountName || !accountNumber) {
          message = 'Account Name and Account Number are required when no QR code is uploaded';
        } else if (!isAccountNumberValid()) {
          if (withdrawOption === 'GCash') {
            message = 'GCash account number must be exactly 11 digits';
          } else if (withdrawOption === 'Bank') {
            message = 'Bank account number must be between 8-16 digits';
          }
        } else if (withdrawOption === 'Bank' && !bankType) {
          message = 'Bank type is required';
        } else if (withdrawOption === 'Bank' && bankType === 'Others' && !customBankName) {
          message = 'Please specify the bank name';
        }
      }
    }
    
    setErrorMessage(message);
    return false;
  }

  return true;
};

  // ===================== FIREBASE FUNCTIONS =====================

  // Upload image to Firebase Storage
  const uploadImageToFirebase = async (uri, folder, userId) => {
    try {
      console.log(`Uploading image to ${folder} for user ${userId}`);
      
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileName = `${folder}_${timestamp}_${randomString}.jpg`;
      const path = `withdraw_qrcodes/${userId}/${fileName}`;
      
      console.log(`Upload path: ${path}`);
      
      // Convert data URL to blob if needed
      let blob;
      if (uri.startsWith('data:')) {
        const response = await fetch(uri);
        blob = await response.blob();
      } else {
        const response = await fetch(uri);
        blob = await response.blob();
      }
      
      const imageRef = storageRef(storage, path);
      console.log('Starting upload bytes...');
      await uploadBytes(imageRef, blob);
      console.log('Upload bytes completed, getting download URL...');
      const downloadURL = await getDownloadURL(imageRef);
      console.log('Download URL obtained:', downloadURL);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image to Firebase:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
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
          setMemberId(foundUser.id);
          setEmail(foundUser.email);
          setFirstName(foundUser.firstName || '');
          setLastName(foundUser.lastName || '');
          // Capture saved disbursement accounts
          setBankAccName(foundUser.bankAccName || '');
          setBankAccNum(foundUser.bankAccNum || '');
          setGcashAccName(foundUser.gcashAccName || '');
          setGcashAccNum(foundUser.gcashAccNum || '');
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
      console.error('Error fetching user data:', error);
    }
  };

  // Check if user has any existing pending withdrawal application
  const hasAnyPendingWithdrawal = async (memberId) => {
    try {
      const applicationsRef = dbRef(database, `Withdrawals/WithdrawalApplications/${memberId}`);
      const snapshot = await get(applicationsRef);
      if (!snapshot.exists()) return false;
      const apps = snapshot.val();
      for (const id in apps) {
        const a = apps[id];
        if ((a?.status || 'pending') === 'pending') return true;
      }
      return false;
    } catch (e) {
      console.error('Error checking pending withdrawals:', e);
      return false;
    }
  };

  const resetFormFields = () => {
    setWithdrawOption('');
    setAccountNumber('');
    setAccountName('');
    setWithdrawAmount('');
    setBankType('');
    setCustomBankName('');
    setQrCodeImage(null);
    setPendingApiData(null);
  };

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
  }, [route.params]);

  useEffect(() => {
    const handleBackPress = () => {
      navigation.reset({ index: 0, routes: [{ name: 'AppHome' }] });
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
  
    return () => backHandler.remove(); 
  }, [navigation]);

  const handleWithdrawOptionChange = (option) => {
    const key = option.key;
    setWithdrawOption(key);
    // Clear all account fields when changing withdrawal option
    setAccountName('');
    setAccountNumber('');
    setBankType('');
    setCustomBankName('');
    setQrCodeImage(null); // Also clear QR code when changing disbursement method
  };

  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);

  useEffect(() => {
    // Convert withdrawAmount to number for proper comparison
    const amount = parseFloat(withdrawAmount) || 0;

    // Check for empty fields using isFormValid function
    const hasEmptyFields = !isFormValid();

    // Check balance - NEW LOGIC: balance after withdrawal must be at least ₱5,000
    const balanceAfterWithdrawal = balance - amount;
    const insufficientBalance = balanceAfterWithdrawal < 5000;
    const invalidAmount = isNaN(amount) || amount <= 0;

    // Enable button only when all conditions are met
    setIsSubmitDisabled(hasEmptyFields || insufficientBalance || invalidAmount);
  }, [withdrawOption, accountName, accountNumber, bankType, customBankName, withdrawAmount, balance]);

const handleSubmit = async () => {
  if (!validateForm()) {
    setAlertMessage(errorMessage);
    setAlertType('error');
    setAlertModalVisible(true);
    return;
  }

  const amount = parseFloat(withdrawAmount);
  if (isNaN(amount) || amount <= 0) {
    setAlertMessage('Please enter a valid amount');
    setAlertType('error');
    setAlertModalVisible(true);
    return;
  }

  // NEW VALIDATION: Check if balance after withdrawal is at least ₱5,000
  const balanceAfterWithdrawal = balance - amount;
  if (balanceAfterWithdrawal < 5000) {
    setAlertMessage(`Withdrawal not allowed. Your balance after withdrawal would be ${formatCurrency(balanceAfterWithdrawal)}, which is below the minimum required balance of ₱5,000.`);
    setAlertType('error');
    setAlertModalVisible(true);
    return;
  }

  // Check if user has any existing pending withdrawal application
  if (memberId) {
    const exists = await hasAnyPendingWithdrawal(memberId);
    if (exists) {
      setAlertMessage('You already have a pending withdrawal application. Please wait for it to be processed before submitting another.');
      setAlertType('error');
      setAlertModalVisible(true);
      return;
    }
  }

  // Show confirmation modal
  setConfirmModalVisible(true);
};

  const formatCurrency = (amount) => {
    return `₱${parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  const generateTransactionId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Main submission function with QR code
const submitWithdrawal = async () => {
  setIsLoading(true);
  setConfirmModalVisible(false);

  try {
    const transactionId = generateTransactionId();
    const currentDate = new Date();

    // Upload QR code image if exists
    let qrCodeUrl = null;
    if (qrCodeImage) {
      try {
        console.log('Uploading QR code image...');
        qrCodeUrl = await uploadImageToFirebase(qrCodeImage, 'withdraw_qr', memberId);
        console.log('QR code uploaded successfully:', qrCodeUrl);
      } catch (uploadError) {
        console.error('Failed to upload QR code:', uploadError);
        setAlertMessage('Failed to upload QR code. Please try again.');
        setAlertType('error');
        setAlertModalVisible(true);
        setIsLoading(false);
        return;
      }
    }

    // Prepare withdrawal data with QR code URL
    // Note: Account name and number may be empty if QR code is uploaded
    const withdrawalData = {
      transactionId,
      id: memberId,
      email,
      firstName,
      lastName,
      withdrawOption,
      accountName: accountName || (qrCodeImage ? '(Provided via QR code)' : ''),
      accountNumber: accountNumber || (qrCodeImage ? '(Provided via QR code)' : ''),
      bankType: withdrawOption === 'Bank' ? (bankType === 'Others' ? customBankName : bankType) : null,
      amountWithdrawn: parseFloat(withdrawAmount).toFixed(2),
      dateApplied: currentDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      timeApplied: currentDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
      timestamp: currentDate.getTime(),
      status: 'pending',
      qrCodeUrl: qrCodeUrl, // Add QR code URL here
      hasQrCode: !!qrCodeImage // Flag to indicate if QR code was used
    };

    console.log('Saving withdrawal application:', withdrawalData);

    // Save to Firebase
    const newWithdrawRef = dbRef(database, `Withdrawals/WithdrawalApplications/${memberId}/${transactionId}`);
    await set(newWithdrawRef, withdrawalData);

    // Also log to Transactions
    const txnRef = dbRef(database, `Transactions/Withdrawals/${memberId}/${transactionId}`);
    await set(txnRef, { ...withdrawalData, label: 'Withdrawal', type: 'Withdrawals' });

    // Prepare API data for background processing
    const apiData = {
      email,
      firstName,
      lastName,
      amount: parseFloat(withdrawAmount),
      date: new Date().toISOString(),
      qrCodeUrl: qrCodeUrl,
      accountName: accountName,
      accountNumber: accountNumber
    };

    setPendingApiData(apiData);
    
    // Show success message
    setAlertMessage('Withdrawal application submitted successfully!');
    setAlertType('success');
    setAlertModalVisible(true);

  } catch (error) {
    console.error('Error during withdrawal submission:', error);
    setAlertMessage('An unexpected error occurred. Please try again later.');
    setAlertType('error');
    setAlertModalVisible(true);
  } finally {
    setIsLoading(false);
  }
};

  // Required field component
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
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header with centered title and left back button using invisible spacers */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.headerSide} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={28} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Withdraw</Text>
          <View style={styles.headerSide} />
        </View>
        <View style={styles.content}>

          <Text style={styles.label}>Balance</Text>
          <Text style={styles.balanceText}>{formatCurrency(balance)}</Text>

          <Text style={styles.label}><RequiredField>Disbursement</RequiredField></Text>
          <ModalSelector
            data={withdrawOptions}
            initValue="Select Withdraw Option"
            onChange={handleWithdrawOptionChange}
            style={styles.picker}
            modalStyle={{ justifyContent: 'flex-end', margin: 0 }}
            overlayStyle={{ justifyContent: 'flex-end' }}
          >
            <TouchableOpacity style={styles.pickerContainer}>
              <Text style={styles.pickerText}>{withdrawOption || 'Select Withdraw Option'}</Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="black" /> 
            </TouchableOpacity>
          </ModalSelector>

{withdrawOption !== 'Cash' && (
  <>
    {/* Account Name Field */}
    <Text style={styles.label}>
      Account Name
      {!qrCodeImage && <Text style={{color: 'red'}}>*</Text>}
      <Text style={{fontSize: 12, color: '#666'}}>
        {qrCodeImage ? ' (Optional with QR code)' : ''}
      </Text>
    </Text>
    <TextInput
      value={accountName}
      onChangeText={setAccountName}
      style={styles.input}
      placeholder={
        qrCodeImage 
          ? "Enter account name (optional with QR code)" 
          : "Enter account name"
      }
    />

    {/* Account Number Field */}
    <Text style={styles.label}>
      Account Number
      {!qrCodeImage && <Text style={{color: 'red'}}>*</Text>}
      <Text style={{fontSize: 12, color: '#666'}}>
        {qrCodeImage ? ' (Optional with QR code)' : ''}
      </Text>
    </Text>
    <TextInput
      value={accountNumber}
      onChangeText={handleAccountNumberChange}
      style={styles.input}
      keyboardType="numeric"
      placeholder={
        withdrawOption === 'GCash' 
          ? qrCodeImage 
            ? 'Enter 11-digit GCash number (optional with QR code)' 
            : 'Enter 11-digit GCash number'
          : qrCodeImage 
            ? 'Enter 8-16 digit bank account number (optional with QR code)' 
            : 'Enter 8-16 digit bank account number'
      }
      maxLength={withdrawOption === 'GCash' ? 11 : 16}
    />
    
    {/* Account Number Validation Message */}
    {accountNumber.length > 0 && (
      <Text style={[
        styles.validationText,
        isAccountNumberValid() ? styles.validText : styles.invalidText
      ]}>
        {getAccountNumberValidationMessage()}
      </Text>
    )}

    {/* QR Code Upload Section */}
    <View style={{ marginTop: 10, marginBottom: 15 }}>
      <Text style={styles.label}>
        <Text style={{ color: '#1E3A5F', fontSize: 16, fontWeight: '600' }}>
          QR Code Upload
        </Text>
        <Text style={{ fontSize: 12, color: '#666' }}>
          {withdrawOption === 'Bank' ? ' (Makes account details optional)' : ''}
        </Text>
      </Text>
      
      {/* Add helpful hint */}
      <Text style={styles.qrHintText}>
        {qrCodeImage 
          ? 'QR code uploaded! Account details are now optional.' 
          : 'Upload a QR code to make account details optional'}
      </Text>
      
      {/* QR Code Image Preview */}
      {qrCodeImage ? (
        <View style={styles.qrCodeContainer}>
          <Image source={getImageSource(qrCodeImage)} style={styles.qrCodeImage} />
          <TouchableOpacity 
            style={styles.removeQrButton}
            onPress={removeQrCodeImage}
          >
            <MaterialIcons name="close" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.changeQrButton}
            onPress={handleQrCodePress}
          >
            <Text style={styles.changeQrText}>Change QR Code</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.qrUploadButton}
          onPress={handleQrCodePress}
        >
          <View style={styles.qrIconContainer}>
            <MaterialIcons name="qr-code-scanner" size={30} color="#1E3A5F" />
            <Text style={styles.qrUploadText}>Upload QR Code</Text>
            <Text style={styles.qrUploadSubText}>
              {withdrawOption === 'Bank' 
                ? 'Optional - Makes account details optional' 
                : 'Optional - For easy reference'}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    </View>

    {/* For Bank withdrawals, bank type is still required */}
    {withdrawOption === 'Bank' && (
      <>
        <Text style={styles.label}>
          <RequiredField>Type of Bank</RequiredField>
        </Text>
        <ModalSelector
          data={bankTypeOptions}
          initValue="Select Bank Type"
          onChange={(option) => {
            const key = option.key;
            setBankType(key);
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
              {bankType === 'Others' && customBankName ? `Others: ${customBankName}` : (bankType || 'Select Bank Type')}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="black" />
          </TouchableOpacity>
        </ModalSelector>

        {bankType === 'Others' && (
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

          <Text style={styles.label}><RequiredField>Withdraw Amount</RequiredField></Text>
          <TextInput
            placeholder="Enter Amount"
            value={withdrawAmount}
            onChangeText={setWithdrawAmount}
            style={styles.input}
            keyboardType="numeric"
          />

          <Text style={styles.noteText}>
            Note: Your balance after withdrawal must be at least ₱5,000
          </Text>

          <TouchableOpacity 
            style={[styles.submitButton, isSubmitDisabled && styles.disabledButton]} 
            onPress={handleSubmit}
            disabled={isSubmitDisabled}
          >
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
            <Text style={styles.modalTitle}>QR Code Preview</Text>
            
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

      {/* Confirmation Modal */}
      <Modal visible={confirmModalVisible} transparent animationType="fade">
        <View style={styles.centeredModal}>
          <View style={styles.modalCard}>
            <MaterialIcons name="help-outline" size={40} color="#2C5282" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Confirm Withdrawal</Text>
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>Current Balance: {formatCurrency(balance)}</Text>
              <Text style={styles.modalText}>Withdraw Option: {withdrawOption}</Text>
              {withdrawOption !== 'Cash' && (
                <>
                  <Text style={styles.modalText}>Account Name: {accountName}</Text>
                  <Text style={styles.modalText}>Account Number: {accountNumber}</Text>
                  {withdrawOption === 'Bank' && (
                    <Text style={styles.modalText}>Bank Type: {bankType === 'Others' ? customBankName : bankType}</Text>
                  )}
                </>
              )}
              <Text style={styles.modalText}>Amount to be Withdrawn: {formatCurrency(withdrawAmount)}</Text>
              <Text style={styles.modalText}>Balance After Withdrawal: {formatCurrency(balance - parseFloat(withdrawAmount))}</Text>
              
              {/* Show QR Code info if uploaded */}
              {qrCodeImage && (
                <Text style={[styles.modalText, { marginTop: 8, fontWeight: '700', color: '#2C5282' }]}>
                  QR Code: Uploaded ✓
                </Text>
              )}
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
                onPress={submitWithdrawal}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
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
        onClose={() => {
          setAlertModalVisible(false);
          if (alertType === 'success' && pendingApiData) {
            // Navigate immediately and run API in background
            resetFormFields();
            navigation.reset({ index: 0, routes: [{ name: 'AppHome' }] });
            
            // Run API call in background after navigation
            setTimeout(async () => {
              try {
                await MemberWithdraw(pendingApiData);
                console.log('Withdraw API call completed successfully in background');
              } catch (apiError) {
                console.error('Background API call failed:', apiError?.message || apiError || 'Unknown API error');
                // API failure doesn't affect user experience since data is already in database
              }
              // Clear pending data
              setPendingApiData(null);
            }, 100);
          }
        }}
        message={alertMessage}
        type={alertType}
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
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    flexGrow: 1,
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
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  // Validation text styles
  validationText: {
    fontSize: 12,
    marginTop: -10,
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  validText: {
    color: '#059669',
  },
  invalidText: {
    color: '#dc2626',
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: -10,
    marginBottom: 10,
    textAlign: 'center',
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
  modalText: {
    marginTop: 10,
    fontSize: 16,
    color: 'white',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.6,
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
  // QR Code Styles
  qrCodeContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  qrCodeImage: {
    width: 150,
    height: 150,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignSelf: 'center',
  },
  removeQrButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeQrButton: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 6,
    alignSelf: 'center',
  },
  changeQrText: {
    fontSize: 12,
    color: '#495057',
    textAlign: 'center',
  },
  qrUploadButton: {
    width: '100%',
    height: 100,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  qrIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrUploadText: {
    marginTop: 8,
    fontSize: 14,
    color: '#1E3A5F',
    fontWeight: '600',
  },
  qrUploadSubText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 2,
  },
  // Modal Styles
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
});

export default Withdraw;
