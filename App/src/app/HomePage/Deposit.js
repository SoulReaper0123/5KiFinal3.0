import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TextInput, StyleSheet, 
  TouchableOpacity, Alert, ScrollView, Image, 
  ActivityIndicator, Modal, BackHandler, KeyboardAvoidingView, Platform 
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
import { storage, database, auth } from '../../firebaseConfig';
import { MemberDeposit } from '../../api';

const Deposit = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // Deposit states
  const [depositOption, setDepositOption] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [amountToBeDeposited, setAmountToBeDeposited] = useState('');
  const [proofOfDeposit, setProofOfDeposit] = useState(null);
  const [email, setEmail] = useState('');
  const [balance, setBalance] = useState(0);
  const [memberId, setMemberId] = useState('');
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [depositAccounts, setDepositAccounts] = useState({
    Bank: { accountName: '', accountNumber: '' },
    GCash: { accountName: '', accountNumber: '' }
  });
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('error');
  const [pendingDepositData, setPendingDepositData] = useState(null);

  // Cash on hand fields
  const [receivedBy, setReceivedBy] = useState('');
  const [dateReceived, setDateReceived] = useState('');

  // Image handling states
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

  useEffect(() => {
    const initializeUserData = async () => {
      try {
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
    fetchDepositSettings();
    
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

  const fetchDepositSettings = async () => {
    try {
      const settingsRef = dbRef(database, 'Settings/Accounts');
      const snapshot = await get(settingsRef);
      if (snapshot.exists()) {
        setDepositAccounts(snapshot.val());
      } else {
        const oldSettingsRef = dbRef(database, 'Settings/DepositAccounts');
        const oldSnapshot = await get(oldSettingsRef);
        if (oldSnapshot.exists()) {
          setDepositAccounts(oldSnapshot.val());
        }
      }
    } catch (error) {
      console.error('Error fetching deposit settings:', error);
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
          setFirstName(foundUser.firstName || ''); 
          setLastName(foundUser.lastName || '');  
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

  const depositOptions = [
    { key: 'Bank', label: 'Bank' },
    { key: 'GCash', label: 'GCash' },
    { key: 'Cash', label: 'Cash' },
  ];

  const handleDepositOptionChange = (option) => {
    setDepositOption(option.key);
    if (option.key === 'Cash') {
      setAccountNumber('');
      setAccountName('');
      return;
    }
    const selectedAccount = depositAccounts[option.key];
    setAccountNumber(selectedAccount?.accountNumber || '');
    setAccountName(selectedAccount?.accountName || '');
  };

  // FIXED: Upload image to Firebase Storage - SIMPLIFIED AND WORKING
  const uploadImageToFirebase = async (uri, folder, userId) => {
    try {
      console.log(`Starting upload for ${folder}, user: ${userId}`);
      
      const timestamp = new Date().getTime();
      const uniqueFilename = `${userId}_${timestamp}_${Math.floor(Math.random() * 1000)}`;
      const fileExtension = uri.split('.').pop() || 'jpg';
      const filename = `${uniqueFilename}.${fileExtension}`;
      
      const imageRef = storageRef(storage, `users/${userId}/${folder}/${filename}`);
      
      console.log('Fetching image blob...');
      const response = await fetch(uri);
      const blob = await response.blob();
      
      console.log('Uploading to Firebase Storage...');
      await uploadBytes(imageRef, blob);
      
      console.log('Getting download URL...');
      const downloadURL = await getDownloadURL(imageRef);
      console.log('Image upload successful');
      return downloadURL;
    } catch (error) {
      console.error('Image upload failed:', error);
      throw new Error('Failed to upload image: ' + error.message);
    }
  };

  // IMAGE HANDLING FUNCTIONS

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
      currentSetFunction(selectedImageUri);
      setShowCropOptions(false);
      setSelectedImageUri(null);
      setCurrentImageType(null);
      setCurrentSetFunction(null);
    }
  };

  // Handle Proof of Deposit selection
  const handleProofOfDepositPress = () => {
    showSourceSelection(setProofOfDeposit, 'proofOfDeposit');
  };

  // Get image source for display
  const getImageSource = (uri) => {
    if (!uri) return null;
    return { uri };
  };

  const storeDepositDataInDatabase = async (proofOfDepositUrl, transactionId = null) => {
    try {
      const txnId = transactionId || generateTransactionId();
      
      const newDepositRef = dbRef(database, `Deposits/DepositApplications/${memberId}/${txnId}`);
  
      const depositAmount = parseFloat(amountToBeDeposited);
  
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      
      const depositData = {
        transactionId: txnId,
        id: memberId,
        email,
        firstName,
        lastName,
        accountName: accountName,
        depositOption,
        accountNumber,
        amountToBeDeposited: depositAmount,
        proofOfDepositUrl,
        dateApplied: formattedDate,
        timestamp: currentDate.getTime(),
        status: 'pending',
      };
      
      await set(newDepositRef, depositData);

      const txnRef = dbRef(database, `Transactions/Deposits/${memberId}/${txnId}`);
      await set(txnRef, {
        ...depositData,
        amountToBeDeposited: parseFloat(depositAmount).toFixed(2),
        label: 'Deposit',
        type: 'Deposits',
      });
      
      return txnId;
    } catch (error) {
      console.error('Failed to store deposit data in Realtime Database:', error);
      
      setErrorMessage('Failed to store deposit data: ' + (error.message || 'Unknown error'));
      
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!depositOption || !amountToBeDeposited) {
      setAlertMessage('All fields are required');
      setAlertType('error');
      setAlertModalVisible(true);
      return;
    }

    if (depositOption !== 'Cash' && !proofOfDeposit) {
      setAlertMessage('All fields are required');
      setAlertType('error');
      setAlertModalVisible(true);
      return;
    }

    if (isNaN(amountToBeDeposited) || parseFloat(amountToBeDeposited) <= 0) {
      setAlertMessage('Please enter a valid amount');
      setAlertType('error');
      setAlertModalVisible(true);
      return;
    }

    setConfirmModalVisible(true);
  };
  
  const submitDeposit = async () => {
    setLoading(true);
    setConfirmModalVisible(false);

    try {
      const transactionId = generateTransactionId();

      let proofOfDepositUrl = null;
      if (depositOption !== 'Cash') {
        proofOfDepositUrl = await uploadImageToFirebase(proofOfDeposit, 'deposit_proofs', memberId);
      }

      await storeDepositDataInDatabase(proofOfDepositUrl, transactionId);

      const depositData = {
        email,
        accountName,
        firstName,
        lastName,
        depositOption,
        accountNumber,
        amountToBeDeposited: parseFloat(amountToBeDeposited),
        proofOfDepositUrl,
        transactionId,
        date: new Date().toISOString(),
      };

      setPendingDepositData(depositData);

      setAlertMessage('Your deposit request has been submitted successfully. It will be processed shortly.');
      setAlertType('success');
      setAlertModalVisible(true);
      
    } catch (error) {
      console.error('Error during deposit submission:', error);
      
      if (error.code && error.code.startsWith('storage/')) {
        setAlertMessage(errorMessage || 'Failed to upload image');
        setAlertType('error');
        setAlertModalVisible(true);
      } else {
        setAlertMessage('An unexpected error occurred. Please try again later.');
        setAlertType('error');
        setAlertModalVisible(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetFormFields = () => {
    setDepositOption('');
    setAccountNumber('');
    setAccountName('');
    setAmountToBeDeposited('');
    setProofOfDeposit(null);
    setReceivedBy('');
    setDateReceived('');
    setPendingDepositData(null);
  };

  const formatCurrency = (amount) => {
    return `₱${parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  const generateTransactionId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
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
          <Text style={styles.headerTitle}>Deposit</Text>
          {/* Right spacer to balance the back button width */}
          <View style={styles.headerSide} />
        </View>

        <View style={styles.content}>
        <Text style={styles.label}>Balance</Text>
        <Text style={styles.balanceText}>{formatCurrency(balance)}</Text>

        <Text style={styles.label}>Deposit Option</Text>
        <ModalSelector
          data={depositOptions}
          initValue="Select Deposit Option"
          onChange={handleDepositOptionChange}
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
            <Text style={styles.pickerText}>{depositOption || 'Select Deposit Option'}</Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="black" /> 
          </TouchableOpacity>
        </ModalSelector>

        {depositOption !== 'Cash' && (
          <>
            <Text style={styles.label}>Account Name</Text>
            <TextInput
              value={accountName}
              placeholder={''}
              style={[styles.input, styles.fixedInput]}
              editable={false}
            />

            <Text style={styles.label}>Account Number</Text>
            <TextInput
              value={accountNumber}
              placeholder={''}
              style={[styles.input, styles.fixedInput]}
              editable={false}
            />
          </>
        )}

        <Text style={styles.label}>
          Deposit Amount <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          placeholder="Enter Amount"
          value={amountToBeDeposited}
          onChangeText={setAmountToBeDeposited}
          style={styles.input}
          keyboardType="numeric"
        />

        {depositOption !== 'Cash' && (
          <>
            <Text style={styles.label}>
              Proof of Deposit <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity onPress={handleProofOfDepositPress} style={styles.imagePreviewContainer}>
              {proofOfDeposit ? (
                <Image source={getImageSource(proofOfDeposit)} style={styles.imagePreview} />
              ) : (
                <View style={styles.iconContainer}>
                  <Icon name="add" size={40} color="#1E3A5F" />
                  <Text style={styles.uploadText}>Tap to upload</Text>
                  <Text style={styles.uploadSubText}>Camera or Gallery</Text>
                </View>
              )}
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={[
            styles.submitButton,
            (
              !depositOption ||
              !amountToBeDeposited ||
              isNaN(parseFloat(amountToBeDeposited)) ||
              parseFloat(amountToBeDeposited) <= 0 ||
              (depositOption !== 'Cash' && !proofOfDeposit) ||
              loading
            ) && styles.disabledButton
          ]}
          onPress={handleSubmit}
          disabled={
            !depositOption ||
            !amountToBeDeposited ||
            isNaN(parseFloat(amountToBeDeposited)) ||
            parseFloat(amountToBeDeposited) <= 0 ||
            (depositOption !== 'Cash' && !proofOfDeposit) ||
            loading
          }
        >
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>

      {/* Full-screen loading modal */}
      <Modal transparent={true} visible={loading} animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#4FE7AF" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
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
              Proof of Deposit Preview
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

      {/* Custom Confirmation Modal */}
      <CustomConfirmModal
        visible={confirmModalVisible}
        onClose={() => setConfirmModalVisible(false)}
        title="Confirm Deposit"
        message={`Are you sure you want to submit this deposit request for ${formatCurrency(amountToBeDeposited)}?`}
        type="info"
        cancelText="Cancel"
        confirmText="Confirm"
        onCancel={() => setConfirmModalVisible(false)}
        onConfirm={() => {
          setConfirmModalVisible(false);
          submitDeposit();
        }}
      />

      {/* Custom Alert Modal */}
      <CustomModal
        visible={alertModalVisible}
        onClose={() => {
          setAlertModalVisible(false);
          if (alertType === 'success' && pendingDepositData) {
            resetFormFields();
            navigation.navigate('AppHome');
            
            setTimeout(async () => {
              try {
                await MemberDeposit(pendingDepositData);
                console.log('Deposit API call completed successfully in background');
              } catch (apiError) {
                console.error('Background API call failed:', apiError);
              }
              setPendingDepositData(null);
            }, 100);
          } else if (alertType === 'success') {
            resetFormFields();
            navigation.navigate('AppHome');
          }
        }}
        message={alertMessage}
        type={alertType}
        buttonText="OK"
      />

      {/* Custom Modal for general errors */}
      <CustomModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        message={modalMessage}
        type={modalType}
      />
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
  // Header styles for centered title with left back button
  headerRow: {
    marginTop: 10, // not too upper
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSide: {
    width: 44, // balances the icon width and touch area
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
  required: {
    color: 'red',
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
});

export default Deposit;
