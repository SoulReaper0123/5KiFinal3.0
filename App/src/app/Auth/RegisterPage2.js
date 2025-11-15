import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Modal,
  TextInput,
  Platform,
  Dimensions
} from 'react-native';
import CustomModal from '../../components/CustomModal';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ModalSelector from 'react-native-modal-selector';

const RegisterPage2 = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const [governmentId, setGovernmentId] = useState('');
    const [isOtherGovernmentId, setIsOtherGovernmentId] = useState(false);
    const [otherGovernmentId, setOtherGovernmentId] = useState('');
    const [validIdFront, setValidIdFront] = useState(null);
    const [selfie, setSelfie] = useState(null);
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

    const {
        firstName, middleName, lastName, email, phoneNumber, placeOfBirth,
        address, dateOfBirth,
    } = route.params;

    // Detect browser and platform information
    useEffect(() => {
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
            console.log('Browser detected:', {
                isChrome,
                isFirefox,
                isSafari,
                isMobile,
                isIOS,
                isAndroid,
                userAgent
            });
        }
    }, []);

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

    // COMPLETELY REWRITTEN: Handle gallery selection for Chrome Mobile
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

    // COMPLETELY REWRITTEN: Universal Gallery Selection with Chrome Mobile Fix
    const handleUniversalGallerySelection = () => {
        return new Promise((resolve) => {
            if (Platform.OS !== 'web') {
                resolve(null);
                return;
            }

            console.log('Creating file input for Chrome Mobile');

            // Create a more visible file input that Chrome Mobile can handle
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.multiple = false;
            
            // Make it more visible and accessible for Chrome Mobile
            input.style.cssText = `
                position: fixed !important;
                top: 50% !important;
                left: 50% !important;
                transform: translate(-50%, -50%) !important;
                width: 200px !important;
                height: 50px !important;
                opacity: 1 !important;
                z-index: 10000 !important;
                background: #1E3A5F !important;
                color: white !important;
                border: none !important;
                border-radius: 10px !important;
                font-size: 16px !important;
                padding: 10px !important;
                cursor: pointer !important;
                display: block !important;
                visibility: visible !important;
            `;

            // Create a wrapper div for better control
            const wrapper = document.createElement('div');
            wrapper.style.cssText = `
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background: rgba(0,0,0,0.7) !important;
                z-index: 9999 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            `;

            let resolved = false;

            const cleanup = () => {
                if (!resolved) {
                    resolved = true;
                    if (document.body.contains(wrapper)) {
                        document.body.removeChild(wrapper);
                    }
                    resolve(null);
                }
            };

            const handleChange = (event) => {
                console.log('File input change event fired');
                const file = event.target.files[0];
                
                if (file) {
                    console.log('File selected:', file.name, file.type, file.size);
                    
                    // Validate file type
                    if (!file.type.startsWith('image/')) {
                        console.error('Selected file is not an image');
                        setModalMessage('Please select a valid image file (JPEG, PNG, etc.)');
                        setModalType('error');
                        setModalVisible(true);
                        cleanup();
                        return;
                    }
                    
                    // Validate file size (max 10MB)
                    if (file.size > 10 * 1024 * 1024) {
                        console.error('File too large:', file.size);
                        setModalMessage('Image size should be less than 10MB');
                        setModalType('error');
                        setModalVisible(true);
                        cleanup();
                        return;
                    }

                    const reader = new FileReader();
                    
                    reader.onload = (e) => {
                        console.log('File read successfully');
                        if (!resolved) {
                            resolved = true;
                            if (document.body.contains(wrapper)) {
                                document.body.removeChild(wrapper);
                            }
                            resolve(e.target.result);
                        }
                    };
                    
                    reader.onerror = () => {
                        console.error('File read error');
                        if (!resolved) {
                            resolved = true;
                            if (document.body.contains(wrapper)) {
                                document.body.removeChild(wrapper);
                            }
                            setModalMessage('Failed to read the selected image');
                            setModalType('error');
                            setModalVisible(true);
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
                    console.log('No file selected or selection cancelled');
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
            input.addEventListener('blur', handleCancel);

            // Create instruction text
            const instruction = document.createElement('div');
            instruction.textContent = 'Select an image from your gallery';
            instruction.style.cssText = `
                color: white !important;
                font-size: 18px !important;
                margin-bottom: 20px !important;
                text-align: center !important;
                font-weight: bold !important;
            `;

            // Create close button
            const closeButton = document.createElement('button');
            closeButton.textContent = 'Cancel';
            closeButton.style.cssText = `
                position: absolute !important;
                top: 20px !important;
                right: 20px !important;
                background: #dc2626 !important;
                color: white !important;
                border: none !important;
                border-radius: 8px !important;
                padding: 10px 20px !important;
                font-size: 14px !important;
                cursor: pointer !important;
                z-index: 10001 !important;
            `;
            closeButton.onclick = cleanup;

            // Assemble the UI
            const contentDiv = document.createElement('div');
            contentDiv.style.cssText = `
                background: #1E3A5F !important;
                padding: 30px !important;
                border-radius: 15px !important;
                text-align: center !important;
                max-width: 300px !important;
                position: relative !important;
            `;

            contentDiv.appendChild(instruction);
            contentDiv.appendChild(input);
            wrapper.appendChild(contentDiv);
            wrapper.appendChild(closeButton);
            document.body.appendChild(wrapper);

            // Set timeout for safety
            const timeoutId = setTimeout(() => {
                if (!resolved) {
                    console.log('Gallery selection timeout');
                    cleanup();
                }
            }, 60000);

            console.log('File input created, triggering click...');

            // Multiple strategies to trigger file dialog
            const triggerFileDialog = () => {
                try {
                    // Focus first
                    input.focus();
                    
                    // Then click with a small delay
                    setTimeout(() => {
                        try {
                            input.click();
                            console.log('File input click triggered');
                        } catch (error) {
                            console.error('Error in file input click:', error);
                        }
                    }, 100);

                    // Additional retry for Chrome Mobile
                    setTimeout(() => {
                        if (!resolved && document.body.contains(wrapper)) {
                            console.log('Retrying file input click');
                            try {
                                input.click();
                            } catch (error) {
                                console.error('Error in retry click:', error);
                            }
                        }
                    }, 500);

                } catch (error) {
                    console.error('Error triggering file dialog:', error);
                    cleanup();
                }
            };

            // Trigger with a delay to ensure DOM is ready
            setTimeout(triggerFileDialog, 200);

            // Clean up timeout when resolved
            const originalResolve = resolve;
            resolve = (value) => {
                clearTimeout(timeoutId);
                originalResolve(value);
            };
        });
    };

    // Alternative simple method for Chrome Mobile
    const handleSimpleGallerySelection = () => {
        return new Promise((resolve) => {
            if (Platform.OS !== 'web') {
                resolve(null);
                return;
            }

            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.001;';
            
            let resolved = false;

            const cleanup = () => {
                if (!resolved && document.body.contains(input)) {
                    document.body.removeChild(input);
                    resolved = true;
                }
            };

            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        if (!resolved) {
                            resolved = true;
                            cleanup();
                            resolve(event.target.result);
                        }
                    };
                    reader.readAsDataURL(file);
                } else {
                    cleanup();
                    resolve(null);
                }
            };

            input.oncancel = () => {
                cleanup();
                resolve(null);
            };

            document.body.appendChild(input);
            
            // Try multiple click methods
            const tryClick = () => {
                try {
                    input.click();
                } catch (error) {
                    console.error('Click failed:', error);
                }
            };

            tryClick();
            setTimeout(tryClick, 100);
            setTimeout(tryClick, 300);
            
            setTimeout(() => {
                if (!resolved) {
                    cleanup();
                    resolve(null);
                }
            }, 30000);
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

            // Use back camera for ID, front camera for selfie
            const facingMode = imageType === 'selfie' ? 'user' : 'environment';
            
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
                    
                    // For front camera preview, we want the mirrored view (like a mirror)
                    // This is what users expect to see when taking selfies
                    if (imageType === 'selfie') {
                        video.style.transform = 'scaleX(-1)'; // Mirror the preview
                    }
                    
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    
                    captureButton.onclick = () => {
                        // FIX: For selfies, we need to handle the captured image differently
                        if (imageType === 'selfie') {
                            // Method 1: Draw normally but flip horizontally to correct the mirroring
                            context.save();
                            context.scale(-1, 1); // Flip horizontally
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
            }).catch((error) => {
                console.error('Camera access error:', error);
                setModalMessage('Camera not available. Please use gallery instead.');
                setModalType('error');
                setModalVisible(true);
                resolve(null);
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
                // For native, use Expo's built-in cropping
                const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: currentImageType === 'selfie' ? [1, 1] : [4, 3],
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

    // Handle ID Front selection
    const handleIdFrontPress = () => {
        showSourceSelection(setValidIdFront, 'idFront');
    };

    // Handle Selfie selection
    const handleSelfiePress = () => {
        showSourceSelection(setSelfie, 'selfie');
    };

    // Get image source for display
    const getImageSource = (uri) => {
        if (!uri) return null;
        return { uri };
    };

    const handleNext = () => {
        if (!governmentId || !validIdFront || !selfie) {
            setModalMessage('Please select government ID and upload all required images');
            setModalType('error');
            setModalVisible(true);
            return;
        }

        navigation.navigate('RegistrationFee', {
            ...route.params,
            governmentId: isOtherGovernmentId ? otherGovernmentId : governmentId,
            validIdFront,
            selfie
        });
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.container}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={28} color="#0F172A" />
                </TouchableOpacity>

                <View style={{ marginBottom: 16 }}>
                    <Text style={styles.title}>Identity Verification</Text>
                    <Text style={styles.subLabel}>Step 2 of 4 • Provide ID and selfie</Text>
                    <View style={{ height: 6, backgroundColor: '#E5E7EB', borderRadius: 999, marginTop: 8 }}>
                        <View style={{ width: '40%', height: 6, backgroundColor: '#1E3A5F', borderRadius: 999 }} />
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Government ID <Text style={styles.required}>*</Text></Text>
                        <ModalSelector
                            data={governmentIdOptions}
                            initValue="Select Government ID"
                            cancelText="Cancel"
                            onChange={(option) => {
                                const isOther = option.key === 'other';
                                setIsOtherGovernmentId(isOther);
                                if (isOther) {
                                    setGovernmentId('Other');
                                    setOtherGovernmentId('');
                                } else {
                                    setGovernmentId(option.label);
                                    setOtherGovernmentId('');
                                }
                            }}
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
                                <Text style={styles.pickerText}>
                                    {isOtherGovernmentId ? `Other: ${otherGovernmentId || ''}` : (governmentId || 'Select Government ID')}
                                </Text>
                                <MaterialIcons name="arrow-drop-down" size={24} color="black" />
                            </TouchableOpacity>
                        </ModalSelector>
                        {isOtherGovernmentId && (
                            <View style={{ marginTop: 8 }}>
                                <TextInput
                                    placeholder="Please specify your Government ID"
                                    value={otherGovernmentId}
                                    onChangeText={(text) => {
                                        setOtherGovernmentId(text);
                                        setGovernmentId(text);
                                    }}
                                    style={styles.input}
                                />
                            </View>
                        )}
                    </View>

                    <View style={styles.grid}>
                        <View style={styles.tile}>
                            <Text style={styles.label}>Valid ID - Front</Text>
                            <TouchableOpacity 
                                onPress={handleIdFrontPress} 
                                style={styles.imagePreviewContainer}
                            >
                                {validIdFront ? (
                                    <Image source={getImageSource(validIdFront)} style={styles.imagePreview} />
                                ) : (
                                    <View style={styles.iconContainer}>
                                        <Icon name="add" size={40} color="#1E3A5F" />
                                        <Text style={styles.uploadText}>Tap to upload</Text>
                                        <Text style={styles.uploadSubText}>Camera or Gallery</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.tile}>
                            <Text style={styles.label}>Selfie</Text>
                            <TouchableOpacity 
                                onPress={handleSelfiePress} 
                                style={styles.imagePreviewContainer}
                            >
                                {selfie ? (
                                    <Image source={getImageSource(selfie)} style={styles.imagePreview} />
                                ) : (
                                    <View style={styles.iconContainer}>
                                        <Icon name="photo-camera" size={40} color="#1E3A5F" />
                                        <Text style={styles.uploadText}>Tap to upload</Text>
                                        <Text style={styles.uploadSubText}>Camera or Gallery</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        onPress={handleNext}
                        style={[
                            styles.primaryButton,
                            (!governmentId || !validIdFront || !selfie) && styles.buttonDisabled
                        ]}
                        disabled={!governmentId || !validIdFront || !selfie}
                    >
                        <Text style={styles.primaryButtonText}>Next</Text>
                    </TouchableOpacity>
                </View>

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
                                {currentImageType === 'selfie' ? 'Selfie Preview' : 'ID Photo Preview'}
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

                {/* Custom Modal */}
                <CustomModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    message={modalMessage}
                    type={modalType}
                />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        padding: 16,
        backgroundColor: '#F8FAFC',
    },
    container: {
        flex: 1,
    },
    backButton: {
        alignSelf: 'flex-start',
        marginBottom: 10,
        marginTop: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#0F172A',
        textAlign: 'left',
    },
    subLabel: {
        fontSize: 13,
        marginTop: 2,
        color: '#475569',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    inputContainer: {
        marginBottom: 15,
    },
    label: {
        fontSize: 15,
        marginBottom: 8,
        color: '#0F172A',
        fontWeight: '600',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    tile: {
        width: '48%',
        marginBottom: 14,
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
    buttonContainer: {
        marginTop: 8,
    },
    primaryButton: {
        backgroundColor: '#1E3A5F',
        borderRadius: 10,
        paddingVertical: 14,
        paddingHorizontal: 20,
        alignItems: 'center',
        width: '100%',
        marginTop: 12,
    },
    buttonDisabled: {
        backgroundColor: '#94A3B8',
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
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
    input: {
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        backgroundColor: 'white',
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
    required: {
        color: 'red',
    },
});

const governmentIdOptions = [
    { key: 'national', label: 'National ID (PhilSys)' },
    { key: 'sss', label: 'SSS ID' },
    { key: 'philhealth', label: 'PhilHealth ID' },
    { key: 'drivers_license', label: 'Drivers License' },
    { key: 'other', label: 'Others' },
];

export default RegisterPage2;
