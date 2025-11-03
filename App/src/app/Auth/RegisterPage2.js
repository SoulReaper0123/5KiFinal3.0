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
            const isEdge = /edg/i.test(userAgent);
            const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
            const isIOS = /iphone|ipad|ipod/i.test(userAgent);
            const isAndroid = /android/i.test(userAgent);

            setBrowserInfo({
                isChrome,
                isFirefox,
                isSafari,
                isEdge,
                isMobile,
                isIOS,
                isAndroid,
                userAgent
            });
            console.log('Browser detected:', {
                isChrome,
                isFirefox,
                isSafari,
                isEdge,
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

    // UNIVERSAL GALLERY SELECTION - CHROME COMPATIBLE VERSION
    const handleGallerySelection = async () => {
        console.log('Gallery selected');
        setShowSourceOptions(false);
        
        try {
            if (Platform.OS === 'web') {
                console.log('Using universal web gallery selection');
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

    // UNIVERSAL GALLERY SELECTION - COMPATIBLE WITH ALL BROWSERS INCLUDING CHROME
    const handleUniversalGallerySelection = () => {
        return new Promise((resolve) => {
            if (Platform.OS !== 'web') {
                resolve(null);
                return;
            }

            console.log('Creating universal file input for gallery');
            
            // Create file input element
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.style.cssText = 'position: fixed; top: -1000px; left: -1000px; opacity: 0; width: 1px; height: 1px;';
            input.setAttribute('data-testid', 'file-input');
            
            let resolved = false;
            let cleanupDone = false;
            
            const cleanup = () => {
                if (cleanupDone) return;
                cleanupDone = true;
                
                if (!resolved) {
                    resolved = true;
                }
                
                // Remove event listeners
                input.removeEventListener('change', handleChange);
                input.removeEventListener('cancel', handleCancel);
                input.removeEventListener('click', handleInputClick);
                
                // Remove from DOM safely
                if (document.body.contains(input)) {
                    document.body.removeChild(input);
                }
                
                console.log('Cleanup completed');
            };
            
            const handleInputClick = (e) => {
                console.log('File input clicked directly');
            };
            
            const handleChange = (e) => {
                console.log('File input change event triggered');
                const file = e.target.files[0];
                
                if (file) {
                    console.log('File selected:', {
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        lastModified: file.lastModified
                    });
                    
                    // Validate file type
                    if (!file.type.startsWith('image/')) {
                        console.error('Invalid file type:', file.type);
                        setModalMessage('Please select a valid image file (JPEG, PNG, etc.)');
                        setModalType('error');
                        setModalVisible(true);
                        cleanup();
                        resolve(null);
                        return;
                    }
                    
                    // Validate file size (max 10MB)
                    if (file.size > 10 * 1024 * 1024) {
                        console.error('File too large:', file.size);
                        setModalMessage('Image size should be less than 10MB');
                        setModalType('error');
                        setModalVisible(true);
                        cleanup();
                        resolve(null);
                        return;
                    }
                    
                    const reader = new FileReader();
                    
                    reader.onload = (event) => {
                        console.log('File read successfully, result length:', event.target.result?.length);
                        if (!resolved) {
                            resolved = true;
                            cleanup();
                            resolve(event.target.result);
                        }
                    };
                    
                    reader.onerror = (error) => {
                        console.error('File read error:', error);
                        if (!resolved) {
                            resolved = true;
                            cleanup();
                            setModalMessage('Error reading image file. Please try again.');
                            setModalType('error');
                            setModalVisible(true);
                            resolve(null);
                        }
                    };
                    
                    reader.onabort = () => {
                        console.log('File read aborted by user');
                        if (!resolved) {
                            resolved = true;
                            cleanup();
                            resolve(null);
                        }
                    };
                    
                    try {
                        console.log('Starting file read as DataURL');
                        reader.readAsDataURL(file);
                    } catch (error) {
                        console.error('Error reading file:', error);
                        if (!resolved) {
                            resolved = true;
                            cleanup();
                            setModalMessage('Unable to read the selected image. Please try another file.');
                            setModalType('error');
                            setModalVisible(true);
                            resolve(null);
                        }
                    }
                } else {
                    console.log('No file selected in change event');
                    if (!resolved) {
                        resolved = true;
                        cleanup();
                        resolve(null);
                    }
                }
            };
            
            const handleCancel = () => {
                console.log('File selection cancelled by user');
                if (!resolved) {
                    resolved = true;
                    cleanup();
                    resolve(null);
                }
            };
            
            // Add event listeners with proper error handling
            try {
                input.addEventListener('change', handleChange, { once: true });
                input.addEventListener('cancel', handleCancel, { once: true });
                input.addEventListener('click', handleInputClick, { once: true });
            } catch (error) {
                console.error('Error adding event listeners:', error);
            }
            
            // Add to document
            document.body.appendChild(input);
            
            // Set multiple timeouts for different scenarios
            const safetyTimeout = setTimeout(() => {
                console.log('Safety timeout reached - cleaning up');
                if (!resolved) {
                    resolved = true;
                    cleanup();
                    resolve(null);
                }
            }, 45000); // 45 second timeout
            
            // Additional check for Chrome-specific issues
            const chromeCheckTimeout = setTimeout(() => {
                if (!resolved && browserInfo.isChrome) {
                    console.log('Chrome-specific timeout check');
                    // Try to trigger click again if it might have failed
                    try {
                        input.click();
                    } catch (error) {
                        console.error('Error in chrome retry:', error);
                    }
                }
            }, 1000);
            
            // Cleanup timeouts when done
            const cleanupTimeouts = () => {
                clearTimeout(safetyTimeout);
                clearTimeout(chromeCheckTimeout);
            };
            
            // Override cleanup to include timeout clearing
            const originalCleanup = cleanup;
            cleanup = () => {
                cleanupTimeouts();
                originalCleanup();
            };
            
            console.log('Triggering file input click for gallery selection');
            try {
                // Multiple approaches to trigger file dialog
                if (input.click) {
                    input.click();
                } else if (input.dispatchEvent) {
                    const clickEvent = new MouseEvent('click', {
                        view: window,
                        bubbles: true,
                        cancelable: true
                    });
                    input.dispatchEvent(clickEvent);
                }
                
                console.log('File input click triggered successfully');
            } catch (error) {
                console.error('Error triggering file input:', error);
                if (!resolved) {
                    resolved = true;
                    cleanup();
                    setModalMessage('Cannot open file selector. Please check browser permissions.');
                    setModalType('error');
                    setModalVisible(true);
                    resolve(null);
                }
            }
        });
    };

    // Web camera capture - Chrome compatible
    const handleWebCameraCapture = (imageType) => {
        return new Promise((resolve) => {
            if (Platform.OS !== 'web') {
                resolve(null);
                return;
            }

            // Check camera support
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.error('Camera not supported in this browser');
                setModalMessage('Camera not supported in this browser. Please use gallery instead.');
                setModalType('error');
                setModalVisible(true);
                resolve(null);
                return;
            }

            const facingMode = imageType === 'selfie' ? 'user' : { exact: 'environment' };
            
            // Camera constraints with fallback
            const constraints = {
                video: { 
                    facingMode: facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            };

            console.log('Requesting camera with constraints:', constraints);

            navigator.mediaDevices.getUserMedia(constraints)
            .then((stream) => {
                console.log('Camera access granted');
                
                const video = document.createElement('video');
                video.srcObject = stream;
                video.autoplay = true;
                video.playsInline = true;
                video.muted = true;
                
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                
                // Create camera UI
                const captureUI = document.createElement('div');
                captureUI.style.cssText = `
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
                    box-sizing: border-box;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                `;
                
                const videoContainer = document.createElement('div');
                videoContainer.style.cssText = `
                    width: 100%;
                    max-width: 400px;
                    max-height: 400px;
                    border-radius: 12px;
                    overflow: hidden;
                    background: #000;
                    margin-bottom: 20px;
                    position: relative;
                    aspect-ratio: 4/3;
                `;
                
                const controlsContainer = document.createElement('div');
                controlsContainer.style.cssText = `
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    width: 100%;
                    max-width: 400px;
                `;
                
                const captureButton = document.createElement('button');
                captureButton.innerHTML = '📸 CAPTURE PHOTO';
                captureButton.style.cssText = `
                    padding: 16px 32px;
                    background: #1E3A5F;
                    color: white;
                    border: none;
                    border-radius: 50px;
                    font-size: 16px;
                    font-weight: 700;
                    cursor: pointer;
                    width: 100%;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 12px rgba(30, 58, 95, 0.3);
                `;
                captureButton.onmouseover = () => captureButton.style.background = '#0F2A4A';
                captureButton.onmouseout = () => captureButton.style.background = '#1E3A5F';
                captureButton.ontouchstart = () => captureButton.style.transform = 'scale(0.95)';
                captureButton.ontouchend = () => captureButton.style.transform = 'scale(1)';
                
                const cancelButton = document.createElement('button');
                cancelButton.innerHTML = '✕ CANCEL';
                cancelButton.style.cssText = `
                    padding: 14px 28px;
                    background: #dc2626;
                    color: white;
                    border: none;
                    border-radius: 50px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    width: 100%;
                    transition: all 0.2s ease;
                `;
                cancelButton.onmouseover = () => cancelButton.style.background = '#b91c1c';
                cancelButton.onmouseout = () => cancelButton.style.background = '#dc2626';
                cancelButton.ontouchstart = () => cancelButton.style.transform = 'scale(0.95)';
                cancelButton.ontouchend = () => cancelButton.style.transform = 'scale(1)';
                
                const instructions = document.createElement('div');
                instructions.innerHTML = `
                    <div style="color: white; text-align: center; margin-bottom: 16px; font-size: 14px; line-height: 1.4;">
                        <strong>Position your ${imageType === 'selfie' ? 'face' : 'ID'} in the frame</strong><br>
                        Ensure good lighting and clear visibility
                    </div>
                `;
                
                let streamActive = true;
                
                const cleanupCamera = () => {
                    if (!streamActive) return;
                    streamActive = false;
                    
                    try {
                        stream.getTracks().forEach(track => {
                            track.stop();
                        });
                    } catch (error) {
                        console.error('Error stopping camera tracks:', error);
                    }
                    
                    if (document.body.contains(captureUI)) {
                        document.body.removeChild(captureUI);
                    }
                };
                
                video.onloadedmetadata = () => {
                    console.log('Video metadata loaded');
                    try {
                        video.play().catch(e => console.error('Video play error:', e));
                    } catch (error) {
                        console.error('Error playing video:', error);
                    }
                    
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    
                    captureButton.onclick = () => {
                        console.log('Capture button clicked');
                        if (!streamActive) return;
                        
                        try {
                            context.drawImage(video, 0, 0, canvas.width, canvas.height);
                            const imageDataUrl = canvas.toDataURL('image/jpeg', 0.85);
                            console.log('Image captured, size:', imageDataUrl.length);
                            
                            cleanupCamera();
                            resolve(imageDataUrl);
                        } catch (error) {
                            console.error('Error capturing image:', error);
                            cleanupCamera();
                            resolve(null);
                        }
                    };
                    
                    cancelButton.onclick = () => {
                        console.log('Cancel button clicked');
                        cleanupCamera();
                        resolve(null);
                    };
                    
                    // Handle page visibility change
                    const handleVisibilityChange = () => {
                        if (document.hidden && streamActive) {
                            console.log('Page hidden, cleaning up camera');
                            cleanupCamera();
                            resolve(null);
                        }
                    };
                    
                    document.addEventListener('visibilitychange', handleVisibilityChange);
                    
                    // Cleanup event listener on close
                    const originalCleanup = cleanupCamera;
                    cleanupCamera = () => {
                        document.removeEventListener('visibilitychange', handleVisibilityChange);
                        originalCleanup();
                    };
                };
                
                video.onerror = (error) => {
                    console.error('Video error:', error);
                    cleanupCamera();
                    resolve(null);
                };
                
                // Add elements to DOM
                videoContainer.appendChild(video);
                controlsContainer.appendChild(instructions);
                controlsContainer.appendChild(captureButton);
                controlsContainer.appendChild(cancelButton);
                captureUI.appendChild(videoContainer);
                captureUI.appendChild(controlsContainer);
                document.body.appendChild(captureUI);
                
                // Safety timeout
                setTimeout(() => {
                    if (streamActive) {
                        console.log('Camera safety timeout reached');
                        cleanupCamera();
                        resolve(null);
                    }
                }, 300000); // 5 minute timeout
                
            }).catch((error) => {
                console.error('Camera access error:', error);
                let errorMessage = 'Camera not available. Please use gallery instead.';
                
                if (error.name === 'NotAllowedError') {
                    errorMessage = 'Camera permission denied. Please allow camera access and try again.';
                } else if (error.name === 'NotFoundError') {
                    errorMessage = 'No camera found. Please use gallery instead.';
                } else if (error.name === 'NotSupportedError') {
                    errorMessage = 'Camera not supported. Please use gallery instead.';
                }
                
                setModalMessage(errorMessage);
                setModalType('error');
                setModalVisible(true);
                resolve(null);
            });
        });
    };

    // FIXED: Handle crop selected image - PROPERLY SET THE CROPPED IMAGE
    const handleCropSelectedImage = async () => {
        if (!selectedImageUri) {
            console.log('No selected image URI for cropping');
            setShowCropOptions(false);
            return;
        }

        try {
            console.log('Starting crop process for:', currentImageType);
            
            if (Platform.OS === 'web') {
                const croppedImage = await createInteractiveCrop(selectedImageUri, currentImageType);
                console.log('Cropped image result:', croppedImage ? 'Success' : 'Failed');
                
                if (croppedImage && currentSetFunction) {
                    // IMPORTANT: Actually set the cropped image to the state
                    currentSetFunction(croppedImage);
                    console.log('Cropped image set to state successfully');
                    
                    // Show success message
                    setModalMessage('Image cropped and saved successfully!');
                    setModalType('success');
                    setModalVisible(true);
                } else {
                    console.log('No cropped image to set - user cancelled or error');
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
            
        } catch (error) {
            console.error('Crop error:', error);
            // If crop fails, use the original image and show error
            setModalMessage('Crop failed. Using original image instead.');
            setModalType('error');
            setModalVisible(true);
            handleUseAsIs();
        } finally {
            // Always close crop options
            setShowCropOptions(false);
            setSelectedImageUri(null);
            setCurrentImageType(null);
            setCurrentSetFunction(null);
        }
    };

    // IMPROVED INTERACTIVE CROPPER WITH CHROME COMPATIBILITY
    const createInteractiveCrop = (imageUri, imageType) => {
        return new Promise((resolve) => {
            if (Platform.OS !== 'web') {
                resolve(imageUri);
                return;
            }

            console.log('Creating interactive crop interface for:', imageType);
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
                touch-action: none;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
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
                margin-bottom: 16px;
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
                touch-action: none;
            `;
            img.draggable = false;

            const instructions = document.createElement('div');
            instructions.innerHTML = `
                <div style="color: #64748B; text-align: center; margin: 0 0 16px 0; font-size: 14px; line-height: 1.4; flex-shrink: 0;">
                    <strong>Pinch to zoom & drag to reposition</strong><br>
                    For best results, ensure the image is clear and properly framed
                </div>
            `;

            const buttonContainer = document.createElement('div');
            buttonContainer.style.cssText = `
                display: flex;
                gap: 12px;
                justify-content: center;
                flex-wrap: wrap;
                margin-top: auto;
                flex-shrink: 0;
            `;

            const cropButton = document.createElement('button');
            cropButton.innerHTML = '✓ Use This Crop';
            cropButton.style.cssText = `
                padding: 14px 24px;
                background: #1E3A5F;
                color: white;
                border: none;
                border-radius: 10px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                flex: 1;
                min-width: 140px;
                transition: background 0.2s;
            `;
            cropButton.onmouseover = () => cropButton.style.background = '#0F2A4A';
            cropButton.onmouseout = () => cropButton.style.background = '#1E3A5F';

            const cancelCropButton = document.createElement('button');
            cancelCropButton.innerHTML = '✕ Cancel';
            cancelCropButton.style.cssText = `
                padding: 14px 24px;
                background: #dc2626;
                color: white;
                border: none;
                border-radius: 10px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                flex: 1;
                min-width: 140px;
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
            let lastTouchTime = 0;

            // Prevent default touch behaviors
            const preventDefault = (e) => {
                if (e.cancelable) {
                    e.preventDefault();
                }
            };

            // Touch event handlers for mobile
            const handleTouchStart = (e) => {
                preventDefault(e);
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
                preventDefault(e);
                
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

            const handleTouchEnd = (e) => {
                preventDefault(e);
                isDragging = false;
                initialDistance = null;
                img.style.cursor = 'grab';
            };

            // Mouse event handlers for desktop
            const handleMouseDown = (e) => {
                preventDefault(e);
                isDragging = true;
                startX = e.clientX - posX;
                startY = e.clientY - posY;
                img.style.cursor = 'grabbing';
            };

            const handleMouseMove = (e) => {
                if (isDragging) {
                    preventDefault(e);
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
                preventDefault(e);
                const delta = -Math.sign(e.deltaY) * 0.1;
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

            // Add event listeners with passive false for better control
            img.addEventListener('mousedown', handleMouseDown);
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            cropArea.addEventListener('wheel', handleWheel, { passive: false });
            
            // Touch events
            cropArea.addEventListener('touchstart', handleTouchStart, { passive: false });
            cropArea.addEventListener('touchmove', handleTouchMove, { passive: false });
            cropArea.addEventListener('touchend', handleTouchEnd, { passive: false });
            cropArea.addEventListener('touchcancel', handleTouchEnd, { passive: false });

            // Center image function
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
                    
                    // Determine initial scale
                    if (imgAspectRatio > containerAspectRatio) {
                        // Landscape image - fit to width
                        scale = containerWidth / imgWidth;
                    } else {
                        // Portrait image - fit to height
                        scale = containerHeight / imgHeight;
                    }
                    
                    // Add some padding
                    scale *= 0.9;
                    
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

            // Improved cropping logic
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
                console.log('Image cropped successfully, data URL length:', croppedImageDataUrl.length);
                
                // Cleanup
                cleanupEventListeners();
                if (document.body.contains(cropUI)) {
                    document.body.removeChild(cropUI);
                }
                resolve(croppedImageDataUrl);
            };

            cancelCropButton.onclick = () => {
                console.log('Cancel crop button clicked');
                cleanupEventListeners();
                if (document.body.contains(cropUI)) {
                    document.body.removeChild(cropUI);
                }
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
                cropArea.removeEventListener('touchcancel', handleTouchEnd);
            };

            // Add elements to DOM
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
            
            // Safety cleanup
            const safetyTimeout = setTimeout(() => {
                console.log('Crop safety timeout');
                if (document.body.contains(cropUI)) {
                    cleanupEventListeners();
                    document.body.removeChild(cropUI);
                    resolve(null);
                }
            }, 120000); // 2 minute timeout
            
            // Update cleanup to include safety timeout
            const originalCleanup = cleanupEventListeners;
            cleanupEventListeners = () => {
                clearTimeout(safetyTimeout);
                originalCleanup();
            };
            
            console.log('Crop interface created successfully');
        });
    };

    // Handle using the image as-is (no cropping)
    const handleUseAsIs = () => {
        if (currentSetFunction && selectedImageUri) {
            console.log('Using image as-is without cropping');
            currentSetFunction(selectedImageUri);
            setModalMessage('Image saved successfully!');
            setModalType('success');
            setModalVisible(true);
        } else {
            console.log('No image to use as-is');
        }
        setShowCropOptions(false);
        setSelectedImageUri(null);
        setCurrentImageType(null);
        setCurrentSetFunction(null);
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
        height: 200,
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
    },
    cropOptionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
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
