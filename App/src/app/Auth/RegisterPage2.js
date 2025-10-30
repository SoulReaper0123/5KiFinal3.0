import React, { useState, useEffect } from 'react';
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
  Platform
} from 'react-native';
import CustomModal from '../../components/CustomModal';
import ImagePickerModal from '../../components/ImagePickerModal';
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
    const [showIdFrontOptions, setShowIdFrontOptions] = useState(false);
    const [showSelfieOptions, setShowSelfieOptions] = useState(false);
    // State for crop options modal
    const [showCropOptions, setShowCropOptions] = useState(false);
    const [selectedImageUri, setSelectedImageUri] = useState(null);
    const [currentImageType, setCurrentImageType] = useState(null);
    const [currentSetFunction, setCurrentSetFunction] = useState(null);
    // State for source selection modal
    const [showSourceOptions, setShowSourceOptions] = useState(false);
    const [pendingImageAction, setPendingImageAction] = useState(null);
    // State for custom modal
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
            const isMiBrowser = /miui|xiaomi/i.test(userAgent.toLowerCase());

            setBrowserInfo({
                isChrome,
                isFirefox,
                isSafari,
                isEdge,
                isMobile,
                isIOS,
                isAndroid,
                isMiBrowser,
                userAgent
            });

            console.log('Browser Detection:', {
                isChrome,
                isFirefox,
                isSafari,
                isEdge,
                isMobile,
                isIOS,
                isAndroid,
                isMiBrowser,
                userAgent
            });
        }
    }, []);

    // Request permissions on component mount
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

    // Show source selection options (Camera or Gallery)
    const showSourceSelection = (setImageFunction, imageType, allowCrop = true) => {
        setPendingImageAction({
            setFunction: setImageFunction,
            type: imageType,
            allowCrop: allowCrop
        });
        setShowSourceOptions(true);
    };

    // Handle camera selection - UNIVERSAL BROWSER SUPPORT
    const handleCameraSelection = async () => {
        setShowSourceOptions(false);
        
        try {
            if (Platform.OS === 'web') {
                // Web camera handling with universal browser support
                const imageUri = await handleWebCameraCapture(pendingImageAction.type);
                if (imageUri) {
                    // Store the captured image immediately and show crop options
                    setSelectedImageUri(imageUri);
                    setCurrentSetFunction(() => pendingImageAction.setFunction);
                    setCurrentImageType(pendingImageAction.type);
                    setShowCropOptions(true);
                }
            } else {
                // Native camera handling - FIXED: Use new MediaType format
                const result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: false, // We'll handle editing/cropping ourselves
                    aspect: [4, 3],
                    quality: 0.8,
                    base64: false,
                });

                if (!result.canceled && result.assets && result.assets[0]) {
                    const imageUri = result.assets[0].uri;
                    
                    // Store the captured image immediately and show crop options
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

    // UNIVERSAL GALLERY UPLOAD - WORKS ON ALL BROWSERS
    const handleGallerySelection = async () => {
        setShowSourceOptions(false);
        
        try {
            if (Platform.OS === 'web') {
                // Universal web gallery handling that works on all browsers
                const imageUri = await handleUniversalGallerySelection();
                if (imageUri) {
                    // Store the selected image immediately and show crop options
                    setSelectedImageUri(imageUri);
                    setCurrentSetFunction(() => pendingImageAction.setFunction);
                    setCurrentImageType(pendingImageAction.type);
                    setShowCropOptions(true);
                }
            } else {
                // Native gallery handling - FIXED: Use new MediaType format
                const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: false, // We'll handle editing/cropping ourselves
                    aspect: [4, 3],
                    quality: 0.8,
                    base64: false,
                });

                if (!result.canceled && result.assets && result.assets[0]) {
                    const imageUri = result.assets[0].uri;
                    
                    // Store the selected image immediately and show crop options
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

    // UNIVERSAL GALLERY SELECTION - WORKS ON ALL BROWSERS INCLUDING CHROME AND MI BROWSER
    const handleUniversalGallerySelection = () => {
        return new Promise((resolve) => {
            // Only run on web platform
            if (Platform.OS !== 'web') {
                resolve(null);
                return;
            }

            try {
                // Method 1: Standard input file (works on most browsers)
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                
                // Support for multiple image types across all browsers
                input.accept = 'image/jpeg, image/png, image/jpg, image/gif, image/webp, image/heic, image/heif';
                
                input.style.cssText = `
                    position: fixed;
                    top: -1000px;
                    left: -1000px;
                    opacity: 0;
                    width: 1px;
                    height: 1px;
                `;
                
                let cleanup = () => {
                    if (document.body.contains(input)) {
                        document.body.removeChild(input);
                    }
                };
                
                // Set timeout for cleanup in case something goes wrong
                const cleanupTimeout = setTimeout(() => {
                    cleanup();
                    // Fallback to alternative method
                    attemptAlternativeGalleryMethod(resolve);
                }, 15000); // 15 second timeout
                
                input.onchange = (e) => {
                    clearTimeout(cleanupTimeout);
                    const file = e.target.files[0];
                    if (file) {
                        processSelectedFile(file, resolve, cleanup);
                    } else {
                        cleanup();
                        resolve(null);
                    }
                };
                
                input.oncancel = () => {
                    clearTimeout(cleanupTimeout);
                    cleanup();
                    resolve(null);
                };
                
                input.onerror = () => {
                    clearTimeout(cleanupTimeout);
                    cleanup();
                    // Try alternative method
                    attemptAlternativeGalleryMethod(resolve);
                };
                
                document.body.appendChild(input);
                
                // Trigger click with multiple attempts
                let clickAttempts = 0;
                const tryClick = () => {
                    try {
                        const event = new MouseEvent('click', {
                            view: window,
                            bubbles: true,
                            cancelable: true
                        });
                        input.dispatchEvent(event);
                    } catch (error) {
                        clickAttempts++;
                        if (clickAttempts < 3) {
                            setTimeout(tryClick, 100);
                        } else {
                            cleanup();
                            attemptAlternativeGalleryMethod(resolve);
                        }
                    }
                };
                
                tryClick();
                
            } catch (error) {
                console.error('Primary gallery selection error:', error);
                attemptAlternativeGalleryMethod(resolve);
            }
        });
    };

    // ALTERNATIVE GALLERY METHOD FOR PROBLEMATIC BROWSERS
    const attemptAlternativeGalleryMethod = (resolve) => {
        // Only run on web platform
        if (Platform.OS !== 'web') {
            resolve(null);
            return;
        }

        try {
            // Method 2: Create a more visible input for problematic browsers
            const altInput = document.createElement('input');
            altInput.type = 'file';
            altInput.accept = 'image/*';
            altInput.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 100px;
                height: 40px;
                opacity: 0.01;
                z-index: 10000;
            `;
            
            const instructionDiv = document.createElement('div');
            instructionDiv.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                color: white;
                text-align: center;
                padding: 20px;
                box-sizing: border-box;
            `;
            
            instructionDiv.innerHTML = `
                <h3 style="color: white; margin-bottom: 20px;">Select Image from Gallery</h3>
                <p style="margin-bottom: 20px; line-height: 1.5;">Please select an image from your device's gallery or file manager.</p>
                <div style="background: #1E3A5F; color: white; padding: 15px 30px; border-radius: 10px; margin-bottom: 20px; cursor: pointer;" onclick="document.querySelector('input[type=file]')?.click()">
                    TAP HERE TO SELECT IMAGE
                </div>
                <button id="cancel-alt-gallery" style="padding: 10px 20px; background: #dc2626; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    Cancel
                </button>
            `;
            
            document.body.appendChild(instructionDiv);
            document.body.appendChild(altInput);
            
            const cancelButton = document.getElementById('cancel-alt-gallery');
            
            const cleanup = () => {
                if (document.body.contains(altInput)) document.body.removeChild(altInput);
                if (document.body.contains(instructionDiv)) document.body.removeChild(instructionDiv);
            };
            
            const cleanupTimeout = setTimeout(() => {
                cleanup();
                resolve(null);
            }, 30000);
            
            altInput.onchange = (e) => {
                clearTimeout(cleanupTimeout);
                const file = e.target.files[0];
                if (file) {
                    processSelectedFile(file, resolve, cleanup);
                } else {
                    cleanup();
                    resolve(null);
                }
            };
            
            cancelButton.onclick = () => {
                clearTimeout(cleanupTimeout);
                cleanup();
                resolve(null);
            };
            
            // Auto-trigger after a short delay
            setTimeout(() => {
                try {
                    const event = new MouseEvent('click', {
                        view: window,
                        bubbles: true,
                        cancelable: true
                    });
                    altInput.dispatchEvent(event);
                } catch (error) {
                    console.log('Alternative method click failed');
                }
            }, 500);
            
        } catch (error) {
            console.error('Alternative gallery method error:', error);
            setModalMessage('Gallery access not available in this browser. Please try using the camera instead.');
            setModalType('error');
            setModalVisible(true);
            resolve(null);
        }
    };

    // PROCESS SELECTED FILE
    const processSelectedFile = (file, resolve, cleanup) => {
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setModalMessage('Image size too large. Please select an image smaller than 10MB.');
            setModalType('error');
            setModalVisible(true);
            cleanup();
            resolve(null);
            return;
        }
        
        // Check file type
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];
        if (!validTypes.includes(file.type)) {
            setModalMessage('Please select a valid image file (JPEG, PNG, GIF, WebP).');
            setModalType('error');
            setModalVisible(true);
            cleanup();
            resolve(null);
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = (event) => {
            const imageUri = event.target.result;
            cleanup();
            resolve(imageUri);
        };
        
        reader.onerror = () => {
            setModalMessage('Failed to read the image file. Please try again.');
            setModalType('error');
            setModalVisible(true);
            cleanup();
            resolve(null);
        };
        
        reader.onabort = () => {
            cleanup();
            resolve(null);
        };
        
        reader.readAsDataURL(file);
    };

    // Web camera capture - UNIVERSAL BROWSER SUPPORT
    const handleWebCameraCapture = (imageType) => {
        return new Promise((resolve) => {
            // Only run on web platform
            if (Platform.OS !== 'web') {
                resolve(null);
                return;
            }

            // Check if browser supports camera
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setModalMessage('Camera not supported in this browser. Please use gallery instead.');
                setModalType('error');
                setModalVisible(true);
                resolve(null);
                return;
            }

            try {
                const facingMode = imageType === 'selfie' ? 'user' : 'environment';
                
                // Browser-specific constraints for better compatibility
                const constraints = {
                    video: {
                        facingMode: facingMode,
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                };

                // Safari specific constraints
                if (browserInfo.isSafari) {
                    constraints.video = {
                        facingMode: facingMode,
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    };
                }

                // iOS Safari specific constraints
                if (browserInfo.isIOS) {
                    constraints.video = {
                        facingMode: facingMode,
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    };
                }

                navigator.mediaDevices.getUserMedia(constraints)
                .then((stream) => {
                    const video = document.createElement('video');
                    video.srcObject = stream;
                    video.autoplay = true;
                    video.playsInline = true;
                    video.style.cssText = `
                        width: 100%;
                        height: auto;
                        border-radius: 8px;
                        transform: ${facingMode === 'user' ? 'scaleX(-1)' : 'none'};
                    `;
                    
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
                        box-sizing: border-box;
                    `;
                    
                    const videoContainer = document.createElement('div');
                    videoContainer.style.cssText = `
                        position: relative;
                        width: 100%;
                        max-width: 400px;
                        border-radius: 12px;
                        overflow: hidden;
                        background: #000;
                        margin-bottom: 20px;
                    `;
                    
                    const instructions = document.createElement('div');
                    instructions.textContent = imageType === 'selfie' 
                        ? 'Take a selfie' 
                        : 'Take a photo of your ID';
                    instructions.style.cssText = `
                        color: white;
                        text-align: center;
                        margin-bottom: 15px;
                        font-size: 16px;
                        fontWeight: bold;
                    `;
                    
                    const buttonContainer = document.createElement('div');
                    buttonContainer.style.cssText = `
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        width: 100%;
                        max-width: 400px;
                    `;
                    
                    const captureButton = document.createElement('button');
                    captureButton.textContent = '📸 Capture Photo';
                    captureButton.style.cssText = `
                        padding: 15px 30px;
                        background: #1E3A5F;
                        color: white;
                        border: none;
                        border-radius: 10px;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: pointer;
                        margin-bottom: 10px;
                        width: 100%;
                    `;
                    
                    const cancelButton = document.createElement('button');
                    cancelButton.textContent = '❌ Cancel';
                    cancelButton.style.cssText = `
                        padding: 12px 24px;
                        background: #dc2626;
                        color: white;
                        border: none;
                        border-radius: 10px;
                        font-size: 14px;
                        cursor: pointer;
                        width: 100%;
                    `;
                    
                    video.onloadedmetadata = () => {
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        
                        captureButton.onclick = () => {
                            if (facingMode === 'user') {
                                context.translate(canvas.width, 0);
                                context.scale(-1, 1);
                            }
                            context.drawImage(video, 0, 0, canvas.width, canvas.height);
                            
                            const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
                            
                            // Clean up
                            stream.getTracks().forEach(track => track.stop());
                            document.body.removeChild(captureUI);
                            resolve(imageDataUrl);
                        };
                        
                        cancelButton.onclick = () => {
                            stream.getTracks().forEach(track => track.stop());
                            document.body.removeChild(captureUI);
                            resolve(null);
                        };
                        
                        videoContainer.appendChild(video);
                        captureUI.appendChild(instructions);
                        captureUI.appendChild(videoContainer);
                        buttonContainer.appendChild(captureButton);
                        buttonContainer.appendChild(cancelButton);
                        captureUI.appendChild(buttonContainer);
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
                    let errorMessage = 'Camera not available. Please use gallery instead.';
                    
                    // Specific error messages for different scenarios
                    if (error.name === 'NotAllowedError') {
                        errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.';
                    } else if (error.name === 'NotFoundError') {
                        errorMessage = 'No camera found on this device.';
                    } else if (error.name === 'NotSupportedError') {
                        errorMessage = 'Camera not supported in this browser.';
                    }
                    
                    setModalMessage(errorMessage);
                    setModalType('error');
                    setModalVisible(true);
                    resolve(null);
                });
            } catch (error) {
                console.error('Camera error:', error);
                setModalMessage('Camera not available. Please use gallery instead.');
                setModalType('error');
                setModalVisible(true);
                resolve(null);
            }
        });
    };

    // SIMPLE CROP FUNCTIONALITY THAT WORKS ON ALL BROWSERS
    const handleSimpleCrop = async () => {
        if (!selectedImageUri) return;

        try {
            // Create a simple crop interface that works everywhere
            const croppedImage = await createSimpleCropInterface(selectedImageUri);
            if (croppedImage) {
                if (currentSetFunction) {
                    currentSetFunction(croppedImage);
                }
                setShowCropOptions(false);
                setSelectedImageUri(null);
                setCurrentImageType(null);
                setCurrentSetFunction(null);
            }
        } catch (error) {
            console.error('Simple crop error:', error);
            // If simple crop fails, use the original image
            setModalMessage('Crop feature not available. Using original image instead.');
            setModalType('info');
            setModalVisible(true);
            handleUseAsIs();
        }
    };

    // SIMPLE CROP INTERFACE THAT WORKS ON ALL BROWSERS INCLUDING MI BROWSER
    const createSimpleCropInterface = (imageUri) => {
        return new Promise((resolve) => {
            // FIXED: Only run on web platform, for native use Expo's built-in cropping
            if (Platform.OS !== 'web') {
                // For native platforms, use Expo's built-in image picker with cropping
                handleNativeCrop(imageUri).then(resolve);
                return;
            }

            try {
                // Check if canvas is supported
                if (!document.createElement('canvas').getContext) {
                    console.log('Canvas not supported, using original image');
                    resolve(imageUri);
                    return;
                }

                const img = new Image();
                img.src = imageUri;
                
                img.onload = () => {
                    try {
                        const cropUI = document.createElement('div');
                        cropUI.style.cssText = `
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
                            padding: 10px;
                            box-sizing: border-box;
                        `;

                        const container = document.createElement('div');
                        container.style.cssText = `
                            background: white;
                            border-radius: 12px;
                            padding: 15px;
                            max-width: 95%;
                            max-height: 90%;
                            overflow: auto;
                            width: 100%;
                        `;

                        const title = document.createElement('h3');
                        title.textContent = 'Crop Image - Drag to Select Area';
                        title.style.cssText = `
                            color: #1E3A5F;
                            margin-bottom: 10px;
                            text-align: center;
                            font-size: 16px;
                        `;

                        const instructions = document.createElement('p');
                        instructions.textContent = currentImageType === 'selfie' 
                            ? 'Drag to select the area for your selfie. Make sure your face is clearly visible.' 
                            : 'Drag to select the area containing your ID. Make sure all details are clear.';
                        instructions.style.cssText = `
                            color: #64748B;
                            text-align: center;
                            margin-bottom: 10px;
                            font-size: 12px;
                            line-height: 1.3;
                        `;

                        const canvasContainer = document.createElement('div');
                        canvasContainer.style.cssText = `
                            position: relative;
                            margin-bottom: 10px;
                            border: 2px solid #1E3A5F;
                            border-radius: 8px;
                            overflow: hidden;
                            max-width: 100%;
                            background: #f8fafc;
                            touch-action: none;
                        `;

                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        // Set canvas size with maximum constraints for mobile
                        const maxWidth = Math.min(350, window.innerWidth - 30);
                        const scale = maxWidth / img.width;
                        const displayHeight = Math.min(img.height * scale, window.innerHeight - 200);
                        
                        canvas.width = maxWidth;
                        canvas.height = displayHeight;
                        canvas.style.cssText = `
                            width: 100%;
                            height: auto;
                            display: block;
                            cursor: crosshair;
                        `;
                        
                        // Draw image on canvas
                        ctx.drawImage(img, 0, 0, maxWidth, displayHeight);

                        // Simple selection rectangle
                        let startX = 50;
                        let startY = 50;
                        let endX = maxWidth - 50;
                        let endY = displayHeight - 50;
                        let isDrawing = false;

                        const drawSelection = () => {
                            try {
                                // Redraw canvas with selection
                                ctx.clearRect(0, 0, canvas.width, canvas.height);
                                ctx.drawImage(img, 0, 0, maxWidth, displayHeight);
                                
                                const rectX = Math.min(startX, endX);
                                const rectY = Math.min(startY, endY);
                                const rectWidth = Math.abs(endX - startX);
                                const rectHeight = Math.abs(endY - startY);
                                
                                // Draw semi-transparent overlay
                                ctx.fillStyle = 'rgba(30, 58, 95, 0.3)';
                                ctx.fillRect(0, 0, canvas.width, canvas.height);
                                ctx.clearRect(rectX, rectY, rectWidth, rectHeight);
                                
                                // Draw selection rectangle
                                ctx.strokeStyle = '#1E3A5F';
                                ctx.lineWidth = 3;
                                ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
                            } catch (error) {
                                console.log('Canvas drawing error:', error);
                            }
                        };

                        // Mouse events
                        canvas.onmousedown = (e) => {
                            isDrawing = true;
                            startX = e.offsetX;
                            startY = e.offsetY;
                            endX = startX;
                            endY = startY;
                        };

                        canvas.onmousemove = (e) => {
                            if (!isDrawing) return;
                            endX = e.offsetX;
                            endY = e.offsetY;
                            drawSelection();
                        };

                        canvas.onmouseup = () => {
                            isDrawing = false;
                        };

                        // Touch events for mobile
                        canvas.ontouchstart = (e) => {
                            e.preventDefault();
                            const rect = canvas.getBoundingClientRect();
                            startX = e.touches[0].clientX - rect.left;
                            startY = e.touches[0].clientY - rect.top;
                            endX = startX;
                            endY = startY;
                            isDrawing = true;
                        };

                        canvas.ontouchmove = (e) => {
                            e.preventDefault();
                            if (!isDrawing) return;
                            const rect = canvas.getBoundingClientRect();
                            endX = e.touches[0].clientX - rect.left;
                            endY = e.touches[0].clientY - rect.top;
                            drawSelection();
                        };

                        canvas.ontouchend = () => {
                            isDrawing = false;
                        };

                        const buttonContainer = document.createElement('div');
                        buttonContainer.style.cssText = `
                            display: flex;
                            gap: 8px;
                            justify-content: center;
                            flex-wrap: wrap;
                        `;

                        const cropButton = document.createElement('button');
                        cropButton.textContent = '✓ Apply Crop';
                        cropButton.style.cssText = `
                            padding: 10px 20px;
                            background: #1E3A5F;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            font-size: 14px;
                            font-weight: bold;
                            cursor: pointer;
                            flex: 1;
                            min-width: 120px;
                        `;

                        const cancelCropButton = document.createElement('button');
                        cancelCropButton.textContent = '✕ Cancel';
                        cancelCropButton.style.cssText = `
                            padding: 10px 20px;
                            background: #dc2626;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            font-size: 14px;
                            font-weight: bold;
                            cursor: pointer;
                            flex: 1;
                            min-width: 120px;
                        `;

                        cropButton.onclick = () => {
                            try {
                                // Calculate actual crop coordinates
                                const scaleX = img.width / maxWidth;
                                const scaleY = img.height / displayHeight;
                                
                                const cropX = Math.min(startX, endX) * scaleX;
                                const cropY = Math.min(startY, endY) * scaleY;
                                const cropWidth = Math.abs(endX - startX) * scaleX;
                                const cropHeight = Math.abs(endY - startY) * scaleY;
                                
                                // NO MINIMUM DIMENSION RESTRICTIONS - ALLOW ANY CROP SIZE
                                
                                // Create output canvas for cropped image
                                const outputCanvas = document.createElement('canvas');
                                outputCanvas.width = cropWidth;
                                outputCanvas.height = cropHeight;
                                const outputCtx = outputCanvas.getContext('2d');
                                
                                outputCtx.drawImage(
                                    img, 
                                    cropX, cropY, cropWidth, cropHeight,
                                    0, 0, cropWidth, cropHeight
                                );
                                
                                const croppedDataUrl = outputCanvas.toDataURL('image/jpeg', 0.9);
                                document.body.removeChild(cropUI);
                                resolve(croppedDataUrl);
                            } catch (error) {
                                console.error('Crop processing error:', error);
                                document.body.removeChild(cropUI);
                                resolve(imageUri); // Return original image if crop fails
                            }
                        };

                        cancelCropButton.onclick = () => {
                            document.body.removeChild(cropUI);
                            resolve(null);
                        };

                        canvasContainer.appendChild(canvas);
                        container.appendChild(title);
                        container.appendChild(instructions);
                        container.appendChild(canvasContainer);
                        buttonContainer.appendChild(cropButton);
                        buttonContainer.appendChild(cancelCropButton);
                        container.appendChild(buttonContainer);
                        cropUI.appendChild(container);
                        document.body.appendChild(cropUI);

                        // Initial draw
                        drawSelection();
                    } catch (error) {
                        console.error('Crop UI creation error:', error);
                        resolve(imageUri); // Return original image if UI fails
                    }
                };

                img.onerror = () => {
                    console.error('Image loading error');
                    resolve(imageUri); // Return original image if loading fails
                };
            } catch (error) {
                console.error('Simple crop interface error:', error);
                resolve(imageUri); // Return original image if anything fails
            }
        });
    };

    // NEW: Handle native crop for Expo
    const handleNativeCrop = async (imageUri) => {
        try {
            // For native platforms, use Expo's built-in image picker with editing
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: currentImageType === 'selfie' ? [1, 1] : [4, 3],
                quality: 0.8,
                base64: false,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                return result.assets[0].uri;
            }
            return imageUri; // Return original if user cancels
        } catch (error) {
            console.error('Native crop error:', error);
            return imageUri; // Return original if error
        }
    };

    // FIXED: Handle when user wants to crop the selected image - NOW USES THE ALREADY SELECTED IMAGE
    const handleCropSelectedImage = async () => {
        if (!selectedImageUri) return;

        try {
            if (Platform.OS === 'web') {
                // Use our simple web-based crop solution that works everywhere
                await handleSimpleCrop();
            } else {
                // For native, use Expo's built-in cropping
                const croppedImage = await handleNativeCrop(selectedImageUri);
                if (croppedImage && currentSetFunction) {
                    currentSetFunction(croppedImage);
                    setShowCropOptions(false);
                    setSelectedImageUri(null);
                    setCurrentImageType(null);
                    setCurrentSetFunction(null);
                }
            }
            
        } catch (error) {
            console.error('Error cropping image:', error);
            // If crop fails, use the original image
            setModalMessage('Crop feature not available. Using original image instead.');
            setModalType('info');
            setModalVisible(true);
            handleUseAsIs();
        }
    };

    // Handle using the image as-is (no cropping)
    const handleUseAsIs = () => {
        if (currentSetFunction && selectedImageUri) {
            console.log('Setting image as-is:', selectedImageUri);
            currentSetFunction(selectedImageUri);
            setShowCropOptions(false);
            setSelectedImageUri(null);
            setCurrentImageType(null);
            setCurrentSetFunction(null);
        }
    };

    // Handle ID Front selection - ALWAYS show crop options
    const handleIdFrontPress = () => {
        showSourceSelection(setValidIdFront, 'idFront', true);
    };

    // Handle Selfie selection - ALWAYS show crop options
    const handleSelfiePress = () => {
        showSourceSelection(setSelfie, 'selfie', true);
    };

    // Improved image display for all browsers
    const getImageSource = (uri) => {
        if (!uri) return null;
        
        if (uri.startsWith('data:image') || uri.startsWith('http') || uri.startsWith('file://')) {
            return { uri };
        }
        
        return { uri };
    };

    // Get browser-specific instructions
    const getBrowserInstructions = () => {
        if (!browserInfo.isMobile) return null;

        if (browserInfo.isIOS) {
            return "On iOS: For best results, use Safari browser.";
        } else if (browserInfo.isAndroid) {
            if (browserInfo.isMiBrowser) {
                return "Using Mi Browser: Gallery should now work properly.";
            }
            return "On Android: Chrome works best. Allow camera permissions when prompted.";
        } else if (browserInfo.isChrome) {
            return "Using Chrome: Make sure to allow camera and file access permissions.";
        }
        
        return "For mobile devices: Use Chrome or Safari for best compatibility.";
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

                {/* Browser-specific warnings and instructions */}
                {Platform.OS === 'web' && (
                    <View style={styles.webWarning}>
                        <MaterialIcons name="info" size={16} color="#856404" />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.webWarningText}>
                                Tap on the image areas to upload photos. Works on all mobile browsers.
                            </Text>
                            {getBrowserInstructions() && (
                                <Text style={styles.browserSpecificText}>
                                    {getBrowserInstructions()}
                                </Text>
                            )}
                            {browserInfo.isMobile && (
                                <Text style={styles.mobileTipText}>
                                    💡 Tip: Gallery should now open your local files properly.
                                </Text>
                            )}
                        </View>
                    </View>
                )}

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
                            modalStyle={{ justifyContent: 'flex-end', margin: 0 }}
                            overlayStyle={{ justifyContent: 'flex-end' }}
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
                                        <Text style={styles.uploadSubText}>Camera or Gallery → Crop</Text>
                                        {browserInfo.isMobile && (
                                            <Text style={styles.mobileHintText}>Gallery opens local files</Text>
                                        )}
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
                                        <Text style={styles.uploadSubText}>Camera or Gallery → Crop</Text>
                                        {browserInfo.isMobile && (
                                            <Text style={styles.mobileHintText}>Gallery opens local files</Text>
                                        )}
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
                    onRequestClose={() => {
                        setShowSourceOptions(false);
                        setPendingImageAction(null);
                    }}
                    animationType="slide"
                >
                    <View style={styles.modalBackground}>
                        <View style={styles.sourceOptionsModal}>
                            <Text style={styles.modalTitle}>Select Image Source</Text>
                            
                            <Text style={styles.sourceInstructions}>
                                How would you like to add your {pendingImageAction?.type === 'idFront' ? 'ID photo' : 'selfie'}?
                            </Text>

                            {/* Browser-specific tips */}
                            {Platform.OS === 'web' && (
                                <View style={styles.browserTipContainer}>
                                    <Text style={styles.browserTipText}>
                                        📱 Gallery will open your local files and photo gallery
                                    </Text>
                                </View>
                            )}
                            
                            <View style={styles.sourceButtonsContainer}>
                                <TouchableOpacity 
                                    style={[styles.sourceOptionButton, styles.cameraButton]}
                                    onPress={handleCameraSelection}
                                >
                                    <MaterialIcons name="photo-camera" size={30} color="#fff" />
                                    <Text style={styles.sourceOptionButtonText}>Take Photo</Text>
                                    <Text style={styles.sourceOptionSubText}>
                                        {pendingImageAction?.type === 'selfie' ? 'Use front camera' : 'Use rear camera'}
                                    </Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={[styles.sourceOptionButton, styles.galleryButton]}
                                    onPress={handleGallerySelection}
                                >
                                    <MaterialIcons name="photo-library" size={30} color="#fff" />
                                    <Text style={styles.sourceOptionButtonText}>Choose from Gallery</Text>
                                    <Text style={styles.sourceOptionSubText}>Select from local files</Text>
                                </TouchableOpacity>
                            </View>
                            
                            <TouchableOpacity 
                                style={styles.cancelButton}
                                onPress={() => {
                                    setShowSourceOptions(false);
                                    setPendingImageAction(null);
                                }}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Crop Options Modal - Shows after image selection for BOTH ID Front and Selfie */}
                <Modal
                    transparent={true}
                    visible={showCropOptions}
                    onRequestClose={() => {
                        setShowCropOptions(false);
                        setSelectedImageUri(null);
                        setCurrentImageType(null);
                        setCurrentSetFunction(null);
                    }}
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
                                    <Text style={styles.previewText}>
                                        {currentImageType === 'selfie' 
                                            ? 'Preview of your selfie' 
                                            : 'Preview of your ID photo'
                                        }
                                    </Text>
                                </View>
                            )}
                            
                            <Text style={styles.cropInstructions}>
                                {currentImageType === 'selfie'
                                    ? 'Would you like to use this selfie as is or crop it to focus on your face?'
                                    : 'Would you like to use this ID photo as is or crop it to focus on the ID?'
                                }
                            </Text>

                            {Platform.OS === 'web' && (
                                <View style={styles.cropNote}>
                                    <Text style={styles.cropNoteText}>
                                        💡 Crop works on all browsers. If any issues occur, it will automatically use the original image.
                                    </Text>
                                </View>
                            )}
                            
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
                                    <Text style={styles.cropOptionButtonText}>
                                        {Platform.OS === 'web' ? 'Crop Image' : 'Crop Image'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            
                            <TouchableOpacity 
                                style={styles.cancelButton}
                                onPress={() => {
                                    setShowCropOptions(false);
                                    setSelectedImageUri(null);
                                    setCurrentImageType(null);
                                    setCurrentSetFunction(null);
                                }}
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
        justifyContent: 'flex-start',
        padding: 16,
        paddingBottom: 32,
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
    section: {
        marginBottom: 16,
    },
    label: {
        fontSize: 15,
        marginBottom: 8,
        color: '#0F172A',
        fontWeight: '600',
    },
    subLabel: {
        fontSize: 13,
        marginTop: 2,
        color: '#475569',
    },
    webWarning: {
        backgroundColor: '#FFF3CD',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#FFC107',
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    webWarningText: {
        color: '#856404',
        fontSize: 12,
        marginLeft: 8,
        flex: 1,
        fontWeight: '600',
    },
    browserSpecificText: {
        color: '#856404',
        fontSize: 11,
        marginLeft: 8,
        marginTop: 4,
        fontStyle: 'italic',
    },
    browserTipContainer: {
        backgroundColor: '#D1ECF1',
        padding: 10,
        borderRadius: 8,
        marginBottom: 15,
        borderLeftWidth: 4,
        borderLeftColor: '#0CA678',
    },
    browserTipText: {
        color: '#055160',
        fontSize: 12,
        fontWeight: '500',
    },
    mobileTipText: {
        color: '#856404',
        fontSize: 11,
        marginLeft: 8,
        marginTop: 4,
        fontWeight: '500',
    },
    mobileHintText: {
        fontSize: 9,
        color: '#94A3B8',
        textAlign: 'center',
        marginTop: 2,
        fontStyle: 'italic',
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
        alignSelf: 'center',
        marginTop: 12,
    },
    buttonDisabled: {
        backgroundColor: '#94A3B8',
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
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
        width: '100%',
    },
    cropOptionsModal: {
        backgroundColor: 'white',
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        width: '100%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
        textAlign: 'center',
        color: '#1E3A5F',
    },
    sourceInstructions: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    sourceButtonsContainer: {
        marginBottom: 16,
        width: '100%',
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
        flex: 1,
    },
    sourceOptionSubText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
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
    previewText: {
        position: 'absolute',
        bottom: 8,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 12,
        color: '#64748B',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: 4,
    },
    cropInstructions: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 10,
        paddingHorizontal: 10,
        lineHeight: 20,
    },
    cropNote: {
        backgroundColor: '#EFF6FF',
        padding: 10,
        borderRadius: 8,
        marginBottom: 15,
        borderLeftWidth: 4,
        borderLeftColor: '#3B82F6',
    },
    cropNoteText: {
        color: '#1E40AF',
        fontSize: 12,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    cropButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        width: '100%',
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
    inputContainer: {
        marginBottom: 15,
    },
    input: {
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        backgroundColor: 'white',
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
