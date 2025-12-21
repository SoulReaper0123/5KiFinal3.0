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
  KeyboardAvoidingView, 
  Platform,
  Image
} from 'react-native';
import CustomModal from '../../components/CustomModal';
import CustomConfirmModal from '../../components/CustomConfirmModal';
import { MaterialIcons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import ModalSelector from 'react-native-modal-selector';
import * as ImagePicker from 'expo-image-picker';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref as dbRef, get, set } from 'firebase/database';
import { storage, database, auth, uploadImageToFirebaseWithRetry, writeToDatabaseWithRetry } from '../../firebaseConfig';
import { MemberLoan } from '../../api';

// Safely extract an error message without assuming shape
const getErrorMessage = (err) => {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (typeof err.message === 'string') return err.message;
  try { return JSON.stringify(err); } catch { return 'Unknown error'; }
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
  const [bankType, setBankType] = useState('');
  const [customBankName, setCustomBankName] = useState('');
  // Saved accounts from Members
  const [bankAccName, setBankAccName] = useState('');
  const [bankAccNum, setBankAccNum] = useState('');
  const [gcashAccName, setGcashAccName] = useState('');
  const [gcashAccNum, setGcashAccNum] = useState('');
  const [balance, setBalance] = useState(0);
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [loading, setLoading] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Collateral related states
  const [requiresCollateral, setRequiresCollateral] = useState(false);
  const [collateralType, setCollateralType] = useState('');
  const [collateralValue, setCollateralValue] = useState('');
  const [collateralDescription, setCollateralDescription] = useState('');
  const [showCollateralModal, setShowCollateralModal] = useState(false);
  const [proofOfCollateral, setProofOfCollateral] = useState([]); // Now an array for multiple images
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

  // IMAGE HANDLING STATES
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

  const accountNumberInput = useRef(null);
  const scrollViewRef = useRef(null);
  const collateralModalScrollRef = useRef(null);

  // Per-loan-type interest rates from System Settings
  const [interestRatesByType, setInterestRatesByType] = useState({});
  const [availableTerms, setAvailableTerms] = useState([]); // [{ key, label, interestRate }]

const [qrCodeImage, setQrCodeImage] = useState(null);
const [showQrSourceOptions, setShowQrSourceOptions] = useState(false);

// Handle QR Code selection
const handleQrCodePress = () => {
  showSourceSelection(setQrCodeImage, 'qrCode');
};

// Remove QR Code image
const removeQrCodeImage = () => {
  setQrCodeImage(null);
};
  const disbursementOptions = [
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

  const collateralOptions = [
    { key: 'Property', label: 'Property' },
    { key: 'Vehicle', label: 'Vehicle' },
    { key: 'Jewelry', label: 'Jewelry' },
    { key: 'Electronics', label: 'Electronics' },
    { key: 'Other', label: 'Other' },
  ];

  // FIXED: Upload multiple images to Firebase Storage
const uploadMultipleImages = async (images, folder, userId) => {
  try {
    console.log(`Uploading ${images.length} images to ${folder} folder`);
    
    const uploadPromises = images.map(async (imageUri, index) => {
      console.log(`Uploading image ${index + 1} of ${images.length}`);
      
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileName = `${folder}_${timestamp}_${index}_${randomString}.jpg`;
      const path = `loan_collaterals/${userId}/${fileName}`;
      
      console.log(`Upload path for image ${index + 1}: ${path}`);
      
      // Convert data URL to blob if needed
      let blob;
      if (imageUri.startsWith('data:')) {
        const response = await fetch(imageUri);
        blob = await response.blob();
      } else {
        const response = await fetch(imageUri);
        blob = await response.blob();
      }
      
      const imageRef = storageRef(storage, path);
      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);
      console.log(`Image ${index + 1} uploaded successfully`);
      
      return downloadURL;
    });
    
    const uploadedUrls = await Promise.all(uploadPromises);
    console.log(`All ${images.length} images uploaded successfully`);
    
    return uploadedUrls;
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw new Error(`Failed to upload images: ${error.message}`);
  }
};

  // FIXED: Upload image to Firebase Storage with retry logic
  const uploadImageToFirebase = async (uri, folder, userId) => {
    try {
      console.log(`Uploading image to ${folder} for user ${userId}`);
      
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileName = `${folder}_${timestamp}_${randomString}.jpg`;
      const path = `loan_collaterals/${userId}/${fileName}`;
      
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

// FIXED: Upload all images including QR code
const uploadAllImages = async (imageData) => {
  try {
    console.log('Starting upload of all images');
    
    const uploadedUrls = {};
    
    // Upload collateral images if any
    if (imageData.collateralImages && imageData.collateralImages.length > 0) {
      console.log(`Uploading ${imageData.collateralImages.length} collateral images`);
      uploadedUrls.collateralUrls = await uploadMultipleImages(
        imageData.collateralImages, 
        'collateral', 
        userId
      );
    }
    
    // Upload QR code image if exists
    if (imageData.qrCodeImage) {
      console.log('Uploading QR code image');
      uploadedUrls.qrCodeUrl = await uploadImageToFirebase(
        imageData.qrCodeImage, 
        'qr_code', 
        userId
      );
    }
    
    console.log('All images uploaded successfully:', uploadedUrls);
    return uploadedUrls;
  } catch (error) {
    console.error('Failed to upload images:', error);
    throw error;
  }
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

  // Web camera capture
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
          video.style.width = '100%';
          video.style.height = '100%';
          video.style.objectFit = 'cover';
          
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          captureButton.onclick = () => {
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
        const fallbackFacingMode = 'user';
        
        navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: fallbackFacingMode,
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
            width: '100%';
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
            video.style.width = '100%';
            video.style.height = '100%';
            video.style.objectFit = 'cover';
            
            if (fallbackFacingMode === 'user') {
              video.style.transform = 'scaleX(-1)';
            }
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            captureButton.onclick = () => {
              if (fallbackFacingMode === 'user') {
                context.save();
                context.scale(-1, 1);
                context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
                context.restore();
              } else {
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

  // Handle crop selected image
  const handleCropSelectedImage = async () => {
    if (!selectedImageUri) return;

    try {
      if (Platform.OS === 'web') {
        const croppedImage = await createInteractiveCrop(selectedImageUri, currentImageType);
        console.log('Cropped image result:', croppedImage ? 'Success' : 'Failed');
        
        if (croppedImage && currentSetFunction) {
          if (currentSetFunction === setProofOfCollateral) {
            currentSetFunction(prev => [...prev, croppedImage]);
          } else {
            currentSetFunction(croppedImage);
          }
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
          if (currentSetFunction === setProofOfCollateral) {
            currentSetFunction(prev => [...prev, result.assets[0].uri]);
          } else {
            currentSetFunction(result.assets[0].uri);
          }
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

  // INTERACTIVE CROPPER
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

      let scale = 1;
      let posX = 0;
      let posY = 0;
      let isDragging = false;
      let startX, startY;
      let initialDistance = null;

      const handleTouchStart = (e) => {
        e.preventDefault();
        if (e.touches.length === 1) {
          isDragging = true;
          startX = e.touches[0].clientX - posX;
          startY = e.touches[0].clientY - posY;
          img.style.cursor = 'grabbing';
        } else if (e.touches.length === 2) {
          initialDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
        }
      };

      const handleTouchMove = (e) => {
        e.preventDefault();
        
        if (isDragging && e.touches.length === 1) {
          posX = e.touches[0].clientX - startX;
          posY = e.touches[0].clientY - startY;
          updateImageTransform();
        } else if (e.touches.length === 2 && initialDistance !== null) {
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

      const handleWheel = (e) => {
        e.preventDefault();
        const delta = -e.deltaY * 0.01;
        const newScale = Math.max(0.5, Math.min(3, scale + delta));
        
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

      img.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      cropArea.addEventListener('wheel', handleWheel, { passive: false });
      
      cropArea.addEventListener('touchstart', handleTouchStart, { passive: false });
      cropArea.addEventListener('touchmove', handleTouchMove, { passive: false });
      cropArea.addEventListener('touchend', handleTouchEnd);

      const centerImage = () => {
        const containerWidth = cropArea.clientWidth;
        const containerHeight = cropArea.clientHeight;
        
        img.onload = function() {
          const imgWidth = this.naturalWidth;
          const imgHeight = this.naturalHeight;
          const imgAspectRatio = imgWidth / imgHeight;
          const containerAspectRatio = containerWidth / containerHeight;
          
          if (imgAspectRatio > containerAspectRatio) {
            scale = (containerWidth / imgWidth) * 0.9;
          } else {
            scale = (containerHeight / imgHeight) * 0.9;
          }
          
          const scaledWidth = imgWidth * scale;
          const scaledHeight = imgHeight * scale;
          posX = (containerWidth - scaledWidth) / 2;
          posY = (containerHeight - scaledHeight) / 2;
          
          updateImageTransform();
          img.style.cursor = 'grab';
        };
      };

      cropButton.onclick = () => {
        console.log('Crop button clicked');
        
        const containerWidth = cropArea.clientWidth;
        const containerHeight = cropArea.clientHeight;
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = containerWidth;
        canvas.height = containerHeight;
        
        const visibleSourceX = Math.max(0, -posX / scale);
        const visibleSourceY = Math.max(0, -posY / scale);
        const visibleSourceWidth = Math.min(imgWidth - visibleSourceX, containerWidth / scale);
        const visibleSourceHeight = Math.min(imgHeight - visibleSourceY, containerHeight / scale);
        
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (visibleSourceWidth > 0 && visibleSourceHeight > 0) {
          ctx.drawImage(
            img,
            visibleSourceX, visibleSourceY,
            visibleSourceWidth, visibleSourceHeight,
            0, 0,
            canvas.width, canvas.height
          );
        }
        
        const croppedImageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        console.log('Image cropped successfully');
        
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
      
      setTimeout(centerImage, 100);
      
      console.log('Crop interface created successfully');
    });
  };

  // Handle using the image as-is (no cropping)
  const handleUseAsIs = () => {
    if (currentSetFunction && selectedImageUri) {
      if (currentSetFunction === setProofOfCollateral) {
        currentSetFunction(prev => [...prev, selectedImageUri]);
      } else {
        currentSetFunction(selectedImageUri);
      }
      setShowCropOptions(false);
      setSelectedImageUri(null);
      setCurrentImageType(null);
      setCurrentSetFunction(null);
    }
  };

  // Handle Proof of Collateral selection - NOW SUPPORTS MULTIPLE IMAGES
  const handleProofOfCollateralPress = () => {
    showSourceSelection(setProofOfCollateral, 'proofOfCollateral');
  };

  // Remove individual collateral image
  const removeCollateralImage = (index) => {
    setProofOfCollateral(prev => prev.filter((_, i) => i !== index));
  };

  // Get image source for display
  const getImageSource = (uri) => {
    if (!uri) return null;
    return { uri };
  };

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

  // Validate account number based on disbursement type
  const validateAccountNumber = (value, disbursementType) => {
    // Remove any non-digit characters
    const cleanValue = value.replace(/\D/g, '');
    
    if (disbursementType === 'GCash') {
      // GCash: exactly 11 digits
      if (cleanValue.length > 11) {
        return cleanValue.slice(0, 11);
      }
    } else if (disbursementType === 'Bank') {
      // Bank: minimum 8 digits, maximum 16 digits
      if (cleanValue.length > 16) {
        return cleanValue.slice(0, 16);
      }
    }
    
    return cleanValue;
  };

  // Check if account number meets requirements
  const isAccountNumberValid = () => {
    if (disbursement === 'Cash') return true;
    
    const cleanAccountNumber = accountNumber.replace(/\D/g, '');
    
    if (disbursement === 'GCash') {
      return cleanAccountNumber.length === 11;
    } else if (disbursement === 'Bank') {
      return cleanAccountNumber.length >= 8 && cleanAccountNumber.length <= 16;
    }
    
    return false;
  };

  // Get account number validation message
  const getAccountNumberValidationMessage = () => {
    if (disbursement === 'Cash') return '';
    
    const cleanAccountNumber = accountNumber.replace(/\D/g, '');
    
    if (disbursement === 'GCash') {
      if (cleanAccountNumber.length === 0) return '';
      if (cleanAccountNumber.length < 11) return 'GCash number must be 11 digits';
      if (cleanAccountNumber.length > 11) return 'GCash number cannot exceed 11 digits';
      return;
    } else if (disbursement === 'Bank') {
      if (cleanAccountNumber.length === 0) return '';
      if (cleanAccountNumber.length < 8) return 'Bank account must be at least 8 digits';
      if (cleanAccountNumber.length > 16) return 'Bank account cannot exceed 16 digits';
      return;
    }
    
    return '';
  };

  // Check if all required fields are filled
// Update the isFormValid() function:

const isFormValid = () => {
  // Basic required fields
  if (!loanAmount || !term || !disbursement) {
    return false;
  }

  // Handle disbursement-specific validation
  if (disbursement !== 'Cash') {
    const hasQrCode = !!qrCodeImage;
    
    if (!hasQrCode) {
      // Without QR code: Account Name and Number are REQUIRED
      if (!accountName || !accountNumber) {
        return false;
      }
      
      // Validate account number format
      if (!isAccountNumberValid()) {
        return false;
      }
    } else {
      // With QR code: Account Name and Number are OPTIONAL
      // But if account number is provided, it must be valid
      if (accountNumber && !isAccountNumberValid()) {
        return false;
      }
    }
    
    // Bank type is always required for Bank disbursement
    if (disbursement === 'Bank') {
      if (!bankType) {
        return false;
      }
      if (bankType === 'Others' && !customBankName) {
        return false;
      }
    }
  }

  // Collateral validation if required
  if (requiresCollateral) {
    return isCollateralValid();
  }

  return true;
};

  const logTransactionApplication = async (memberId, transactionId, payload) => {
    try {
      const txnRef = dbRef(database, `Transactions/Loans/${memberId}/${transactionId}`);
      await set(txnRef, { ...payload, label: 'Loan', type: 'Loans' });
    } catch (e) { /* ignore */ }
  };

  // Check if all collateral fields are filled
  const isCollateralValid = () => {
    return collateralType && collateralValue && collateralDescription && proofOfCollateral.length > 0;
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

  const handleAccountNumberChange = (value) => {
    const validatedValue = validateAccountNumber(value, disbursement);
    setAccountNumber(validatedValue);
  };

  const fetchSystemSettings = async () => {
    try {
      const settingsRef = dbRef(database, 'Settings');
      const snapshot = await get(settingsRef);
      if (snapshot.exists()) {
        const settings = snapshot.val();
        const loanPercentage = settings.LoanPercentage || 80;
        setLoanableAmountPercentage(loanPercentage);
        
        const processingFeeValue = settings.ProcessingFee || 0;
        setProcessingFee(processingFeeValue);
        
        const lt = settings.LoanTypes;
        const isMap = lt && typeof lt === 'object' && !Array.isArray(lt);
        const typesArr = isMap ? Object.keys(lt) : [];
        const formattedLoanTypes = typesArr.map(type => ({ key: type, label: type }));
        setLoanTypeOptions(formattedLoanTypes);

        const byType = isMap ? lt : {};
        setInterestRatesByType(byType);

        const mapForType = (byType && byType[loanType]) || {};
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
      }
    } catch (error) {
      console.error('Error fetching system settings:', getErrorMessage(error));
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
          const userInvestment = foundUser.investment || foundUser.investments || 0;
          setBalance(userBalance);
          setInvestment(Number(userInvestment) || 0);
          setMemberId(foundUser.id || '');
          setUserId(foundUser.id || '');
          setFirstName(foundUser.firstName || '');
          setLastName(foundUser.lastName || '');

          setBankAccName(foundUser.bankAccName || '');
          setBankAccNum(foundUser.bankAccNum || '');
          setGcashAccName(foundUser.gcashAccName || '');
          setGcashAccNum(foundUser.gcashAccNum || '');
          
          calculateMaxLoanableAmount(userBalance, loanableAmountPercentage);
          
          await checkExistingLoans(userEmail);
        } else {
          setErrorMessage('User not found');
          setErrorModalVisible(true);
        }
      } else {
        setErrorMessage('No members found');
        setErrorModalVisible(true);
      }
    } catch (error) {
      console.error('Error fetching user data:', getErrorMessage(error));
      setErrorMessage('Error loading user information.');
      setErrorModalVisible(true);
    }
  };

  const checkExistingLoans = async (userEmail) => {
    try {
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
      const applicationsRef = dbRef(database, `Loans/LoanApplications/${memberId}`);
      const snapshot = await get(applicationsRef);
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
        await fetchSystemSettings();
        
        const user = auth.currentUser;
        const userEmail = user ? user.email : route.params?.user?.email;
        
        if (userEmail) {
          setEmail(userEmail);
          
          if (route.params?.user) {
            const userData = route.params.user;
            setMemberId(userData.memberId || '');
            setFirstName(userData.firstName || '');
            setBalance(userData.balance || 0);
            await fetchUserData(userEmail);
          } else {
            await fetchUserData(userEmail);
          }
        } else {
          setErrorMessage('Unable to identify user. Please log in again.');
          setErrorModalVisible(true);
        }
      } catch (error) {
        console.error('Error initializing data:', error);
        setErrorMessage('Error loading information.');
        setErrorModalVisible(true);
      }
    };

    initializeData();

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
        if (!requiresCollateral) {
          setRequiresCollateral(true);
          setErrorMessage('Loan amount exceeds your balance. Collateral is required for this loan.');
          setErrorModalVisible(true);
        }
      }
    }
  }, [loanAmount, balance, requiresCollateral]);

  useEffect(() => {
    const handleBackPress = () => {
      navigation.reset({ index: 0, routes: [{ name: 'AppHome' }] });
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => subscription.remove();
  }, [navigation]);

  const generateTransactionId = () => Math.floor(100000 + Math.random() * 900000).toString();

  // FIXED: Store loan application with retry logic - NOW PROPERLY INCLUDES COLLATERAL DATA
  const storeLoanApplicationInDatabase = async (applicationData) => {
    try {
      const transactionId = generateTransactionId();
      const now = new Date();
      
      const dateApplied = now.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

      const timeApplied = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      const timestamp = now.getTime();

      // Include ALL application data including collateral image URLs
      const applicationDataWithMeta = {
        ...applicationData, // This now includes proofOfCollateralUrls
        id: userId,
        firstName,
        lastName,
        email,
        transactionId,
        dateApplied,
        timeApplied,
        timestamp,
        loanType,
        status: 'pending'
      };

      console.log('Storing loan application with data:', applicationDataWithMeta);

      const applicationRefPath = `Loans/LoanApplications/${userId}/${transactionId}`;
      await writeToDatabaseWithRetry(applicationRefPath, applicationDataWithMeta);

      const txnRefPath = `Transactions/Loans/${userId}/${transactionId}`;
      await writeToDatabaseWithRetry(txnRefPath, { 
        ...applicationDataWithMeta, 
        label: 'Loan', 
        type: 'Loans' 
      });

      return true;
    } catch (error) {
      console.error('Failed to store loan application:', getErrorMessage(error));
      setErrorMessage('Failed to submit loan application');
      setErrorModalVisible(true);
      return false;
    }
  };

  // Function to run API operations in background after user navigates to home
  const runApiOperationsInBackground = async (loanData) => {
    try {
      console.log('Running API operations in background...');
      await MemberLoan(loanData);
      console.log('API call completed successfully in background');
    } catch (error) {
      console.log('API error in background (non-critical):', error?.message || error || 'Unknown API error');
    }
  };

// Inside the validateForm() function, update it to:

const validateForm = () => {
  // Basic validation - check if loan amount, term, and disbursement are filled
  if (!loanAmount || !term || !disbursement) {
    setErrorMessage('Please fill in all required fields: Loan Amount, Term, and Disbursement');
    return false;
  }

  // Handle different disbursement types
  if (disbursement !== 'Cash') {
    // Check if QR code is uploaded
    const hasQrCode = !!qrCodeImage;
    
    if (hasQrCode) {
      // If QR code is uploaded, Account Name and Number are OPTIONAL
      // But we still need to validate if they're provided (partial validation)
      if (accountNumber && !isAccountNumberValid()) {
        if (disbursement === 'GCash') {
          setErrorMessage('GCash account number must be exactly 11 digits if provided');
        } else if (disbursement === 'Bank') {
          setErrorMessage('Bank account number must be between 8-16 digits if provided');
        }
        return false;
      }
    } else {
      // If NO QR code is uploaded, Account Name and Number are REQUIRED
      if (!accountName || !accountNumber) {
        setErrorMessage('Account Name and Account Number are required when no QR code is uploaded');
        return false;
      }
      
      // Validate account number format
      if (!isAccountNumberValid()) {
        if (disbursement === 'GCash') {
          setErrorMessage('GCash account number must be exactly 11 digits');
        } else if (disbursement === 'Bank') {
          setErrorMessage('Bank account number must be between 8-16 digits');
        }
        return false;
      }
    }
    
    // For Bank disbursement, bank type is always required (regardless of QR code)
    if (disbursement === 'Bank') {
      if (!bankType) {
        setErrorMessage('Bank type is required');
        return false;
      }
      if (bankType === 'Others' && !customBankName) {
        setErrorMessage('Please specify the bank name');
        return false;
      }
    }
  }

  // Collateral validation (if required)
  if (requiresCollateral && !isCollateralValid()) {
    setErrorMessage('Please complete all collateral details including uploading at least one proof of collateral image');
    return false;
  }

  return true;
};
// FIXED: Submit loan application with QR code
const submitLoanApplication = async () => {
  if (!validateForm()) {
    setErrorModalVisible(true);
    return;
  }

  try {
    setLoading(true);

    const loanAmountNum = parseFloat(loanAmount);
    
    // Upload all images (collateral + QR code)
    let uploadedImageUrls = {};
    if ((requiresCollateral && proofOfCollateral.length > 0) || qrCodeImage) {
      try {
        console.log('Starting image uploads...');
        
        uploadedImageUrls = await uploadAllImages({
          collateralImages: requiresCollateral ? proofOfCollateral : [],
          qrCodeImage: qrCodeImage
        });
        
        console.log('All images uploaded successfully:', uploadedImageUrls);
      } catch (uploadError) {
        console.error('Failed to upload images:', uploadError);
        setErrorMessage(uploadError.message || 'Failed to upload images. Please try again.');
        setErrorModalVisible(true);
        setLoading(false);
        return;
      }
    }
    
    // Prepare application data
    const applicationData = {
      loanAmount: loanAmountNum,
      term,
      disbursement,
      accountName,
      accountNumber,
      bankType: disbursement === 'Bank' ? (bankType === 'Others' ? customBankName : bankType) : null,
      interestRate: Number(interestRatesByType?.[loanType]?.[term]) || 0,
      firstName,
      lastName,
      email,
      userId,
      loanType,
      requiresCollateral,
      processingFee: processingFee,
      qrCodeUrl: uploadedImageUrls.qrCodeUrl || null, // Add QR code URL
      // Include collateral data if required
      ...(requiresCollateral && {
        collateralType,
        collateralValue,
        collateralDescription,
        proofOfCollateralUrls: uploadedImageUrls.collateralUrls || []
      })
    };

    console.log('Starting database operation with complete data:', applicationData);
    const storedSuccessfully = await storeLoanApplicationInDatabase(applicationData);
    
    if (!storedSuccessfully) {
      setLoading(false);
      return;
    }

    console.log('Database operation completed successfully');

    const loanData = {
      email,
      firstName,
      lastName,
      amount: loanAmountNum,
      term,
      date: new Date().toISOString(),
      qrCodeUrl: uploadedImageUrls.qrCodeUrl // Add to API data
    };

    setPendingApiData(loanData);
    setSuccessModalVisible(true);
    
  } catch (error) {
    console.error('Error during loan submission:', error);
    setErrorMessage('An unexpected error occurred. Please try again later.');
    setErrorModalVisible(true);
  } finally {
    setLoading(false);
  }
};

  const handleSuccessOk = () => {
    setSuccessModalVisible(false);
    
    // Navigate immediately to AppHome
    navigation.reset({ index: 0, routes: [{ name: 'AppHome' }] });
    
    // Run API call in background after navigation
    if (pendingApiData) {
      // Use setTimeout to ensure navigation happens first
      setTimeout(async () => {
        try {
          await MemberLoan(pendingApiData);
          console.log('Loan API call completed successfully in background');
        } catch (apiError) {
          console.error('Background API call failed:', apiError);
          // API failure doesn't affect user experience since data is already in database
        }
      }, 100);
      
      // Clear pending data
      setPendingApiData(null);
    }
  };

  const handleErrorOk = () => {
    setErrorModalVisible(false);
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
      `Disbursement: ${disbursement}`;

    if (disbursement !== 'Cash') {
      message += `\nAccount Name: ${accountName}\nAccount Number: ${accountNumber}`;
      if (disbursement === 'Bank') {
        message += `\nBank Type: ${bankType === 'Others' ? customBankName : bankType}`;
      }
    }

    if (requiresCollateral) {
      message += `\n\nCollateral Details\n` +
        `Type: ${collateralType}\n` +
        `Value: ₱${collateralValue}\n` +
        `Description: ${collateralDescription}\n` +
        `Images: ${proofOfCollateral.length} uploaded`;
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
      proofOfCollateral: proofOfCollateral.length,
      loanAmount,
      term,
      disbursement,
      accountName,
      accountNumber,
      isAccountNumberValid: isAccountNumberValid()
    });
    
    if (!validateForm()) {
      setErrorModalVisible(true);
      return;
    }

    if (memberId) {
      const exists = await hasAnyPendingApplication(memberId);
      if (exists) {
        setErrorMessage('You already have a pending loan application. Please wait for it to be processed before submitting another.');
        setErrorModalVisible(true);
        return;
      }
    }

    const loanAmountNum = Number(loanAmount) || 0;
    const userBalance = Number(balance) || 0;

    if (loanAmountNum > userBalance) {
      if (!isCollateralValid()) {
        setRequiresCollateral(true);
        setErrorMessage('Loan amount exceeds your balance. Please add collateral or lower the amount.');
        setErrorModalVisible(true);
        return;
      }
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
    setProofOfCollateral([]);
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

  // Fix for collateral modal closing and scrolling issue
  const handleSaveCollateral = () => {
    if (isCollateralValid()) {
      setRequiresCollateral(true);
      setShowCollateralModal(false);
      setTimeout(() => {
        setErrorMessage('Collateral details saved successfully!');
        setErrorModalVisible(true);
      }, 100);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingView}
    >
      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={true}
        bounces={true}
        alwaysBounceVertical={true}
        keyboardShouldPersistTaps="handled"
      >
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
              <Text style={styles.collateralSummaryText}>Images: {proofOfCollateral.length} uploaded</Text>
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
              setAccountName('');
              setAccountNumber('');
              setBankType('');
              setCustomBankName('');
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

{disbursement !== 'Cash' && (
  <>
    <Text style={styles.label}>
      Account Name
      {!qrCodeImage && <Text style={{color: 'red'}}>*</Text>}
      <Text style={{fontSize: 12, color: '#666'}}>
        {qrCodeImage ? '' : ''}
      </Text>
    </Text>
    <TextInput
      value={accountName}
      onChangeText={setAccountName}
      style={styles.input}
      placeholder={
        qrCodeImage 
          ? "Enter account name" 
          : "Enter account name "
      }
    />

    <Text style={styles.label}>
      Account Number
      {!qrCodeImage && <Text style={{color: 'red'}}>*</Text>}
      <Text style={{fontSize: 12, color: '#666'}}>
        {qrCodeImage ? '' : ''}
      </Text>
    </Text>
    <TextInput
      value={accountNumber}
      onChangeText={handleAccountNumberChange}
      style={styles.input}
      keyboardType="numeric"
      ref={accountNumberInput}
      placeholder={
        disbursement === 'GCash' 
          ? qrCodeImage 
            ? 'Enter 11-digit GCash number' 
            : 'Enter 11-digit GCash number '
          : qrCodeImage 
            ? 'Enter 8-16 digit bank account number (optional with QR code)' 
            : 'Enter 8-16 digit bank account number'
      }
      maxLength={disbursement === 'GCash' ? 11 : 16}
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

    {/* QR Code Upload */}
    {(disbursement === 'GCash' || disbursement === 'Bank') && (
      <>
        <View style={{ marginTop: 10, marginBottom: 15 }}>
          <Text style={styles.label}>
            <Text style={{ color: '#1E3A5F', fontSize: 16, fontWeight: '600' }}>
              QR Code Upload
            </Text>
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
  
              </View>
            </TouchableOpacity>
          )}
          
        </View>
  </>
)}
              {disbursement === 'Bank' && (
                <>
                  <Text style={styles.label}><RequiredField>Type of Bank</RequiredField></Text>
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

          <TouchableOpacity 
            style={[styles.submitButton, (!isFormValid() || loading) && styles.disabledButton]} 
            onPress={handleSubmit}
            disabled={!isFormValid() || loading}
          >
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Collateral Modal */}
      <Modal
        visible={showCollateralModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowCollateralModal(false)}
      >
        <View style={styles.modalContainer}>
          <ScrollView 
            ref={collateralModalScrollRef}
            style={styles.collateralScreen}
            contentContainerStyle={styles.collateralScreenContent}
            showsVerticalScrollIndicator={true}
            bounces={true}
            keyboardShouldPersistTaps="handled"
          >
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

              {/* Proof of Collateral - MULTIPLE IMAGES */}
              <Text style={styles.label}><RequiredField>Proof of Collateral</RequiredField></Text>
              <Text style={styles.uploadSubText}>You can upload multiple images</Text>
              
              {/* Image Grid */}
              <View style={styles.imageGrid}>
                {proofOfCollateral.map((imageUri, index) => (
                  <View key={index} style={styles.imageItem}>
                    <Image source={getImageSource(imageUri)} style={styles.collateralImage} />
                    <TouchableOpacity 
                      style={styles.removeImageButton}
                      onPress={() => removeCollateralImage(index)}
                    >
                      <MaterialIcons name="close" size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
                
                {/* Add Image Button */}
                <TouchableOpacity 
                  style={styles.addImageButton} 
                  onPress={handleProofOfCollateralPress}
                >
                  <View style={styles.iconContainer}>
                    <Icon name="add" size={30} color="#1E3A5F" />
                    <Text style={styles.uploadText}>Add Image</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={{ height: 8 }} />

              <View style={{ marginTop: 20, gap: 12 }}>
                <TouchableOpacity 
                  style={[styles.submitButton, !isCollateralValid() && styles.disabledButton]}
                  onPress={handleSaveCollateral}
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
        </View>
      </Modal>

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
              Proof of Collateral Preview
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

      {/* Success Modal */}
      <Modal visible={successModalVisible} transparent animationType="fade">
        <View style={styles.centeredModal}>
          <View style={styles.modalCard}>
            <MaterialIcons name="check-circle" size={40} color="#4CAF50" style={styles.modalIcon} />
            <Text style={styles.modalText}>
              Loan application submitted successfully! You will receive a confirmation email shortly.
            </Text>
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={handleSuccessOk}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal visible={errorModalVisible} transparent animationType="fade">
        <View style={styles.centeredModal}>
          <View style={styles.modalCard}>
            <MaterialIcons name="error" size={40} color="#f44336" style={styles.modalIcon} />
            <Text style={styles.modalText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleErrorOk}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#4FE7AF" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        </View>
      )}

      {/* Custom Modal for general errors */}
      <CustomModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        message={modalMessage}
        type={modalType}
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
                  {disbursement !== 'Cash' && (
                    <>
                      <Text style={styles.modalText}>Account Name: {accountName}</Text>
                      <Text style={styles.modalText}>Account Number: {accountNumber}</Text>
                      {disbursement === 'Bank' && (
                        <Text style={styles.modalText}>Bank Type: {bankType === 'Others' ? customBankName : bankType}</Text>
                      )}
                    </>
                  )}
                  {requiresCollateral && (
                    <>
                      <Text style={[styles.modalText, { marginTop: 8, fontWeight: '700', color: '#2C5282' }]}>Collateral Details</Text>
                      <Text style={styles.modalText}>Type: {collateralType}</Text>
                      <Text style={styles.modalText}>Value: {formatCurrency(collateralValue || 0)}</Text>
                      <Text style={styles.modalText}>Description: {collateralDescription}</Text>
                      <Text style={styles.modalText}>Images: {proofOfCollateral.length} uploaded</Text>
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
  keyboardAvoidingView: {
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
    backgroundColor: '#F8FAFC',
  },
  collateralScreen: {
    flex: 1,
  },
  collateralScreenContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 32,
  },
  modalText: {
    marginTop: 15,
    color: '#ffffff',
    fontSize: 18,
  },
  // Image Grid Styles for Multiple Images
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
  },
  imageItem: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  collateralImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  removeImageButton: {
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
  addImageButton: {
    width: 100,
    height: 100,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
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
    marginBottom: 10,
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
    color: '#2C5282',
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
  // Image Picker Modal Styles
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
});

export default ApplyLoan;
