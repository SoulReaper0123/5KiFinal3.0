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
        setShowSourceOptions(false);
        
        try {
            if (Platform.OS === 'web') {
                const imageUri = await handleWebCameraCapture(pendingImageAction.type);
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

    // Handle gallery selection - ULTRA RELIABLE VERSION
    const handleGallerySelection = async () => {
        console.log('🖼️ Gallery selected - Starting ultra-reliable gallery process');
        setShowSourceOptions(false);
        
        try {
            if (Platform.OS === 'web') {
                console.log('🌐 Using web gallery selection');
                
                // Method 1: Try the standard file input first
                let imageUri = await handleUniversalGallerySelection();
                
                // Method 2: If that fails, try alternative method for Chrome Mobile
                if (!imageUri && browserInfo.isChrome && browserInfo.isMobile) {
                    console.log('🔄 Trying alternative method for Chrome Mobile');
                    imageUri = await handleChromeMobileGallerySelection();
                }
                
                console.log('🎯 Gallery result:', imageUri ? 'SUCCESS - Image selected' : 'FAILED - No image');
                
                if (imageUri) {
                    console.log('✅ Setting up crop options with selected image');
                    setSelectedImageUri(imageUri);
                    setCurrentSetFunction(() => pendingImageAction.setFunction);
                    setCurrentImageType(pendingImageAction.type);
                    setShowCropOptions(true);
                }
            } else {
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
            console.error('❌ Gallery error:', error);
            setModalMessage('Failed to select image from gallery. Please try again.');
            setModalType('error');
            setModalVisible(true);
        }
        
        setPendingImageAction(null);
    };

    // UNIVERSAL GALLERY SELECTION - ULTRA RELIABLE
    const handleUniversalGallerySelection = () => {
        return new Promise((resolve) => {
            if (Platform.OS !== 'web') {
                resolve(null);
                return;
            }

            console.log('📁 Creating ultra-reliable file input for gallery');

            let fileInput = null;
            let isResolved = false;

            const resolveSafe = (result) => {
                if (!isResolved) {
                    isResolved = true;
                    cleanup();
                    resolve(result);
                }
            };

            const cleanup = () => {
                if (fileInput && document.body.contains(fileInput)) {
                    document.body.removeChild(fileInput);
                }
            };

            // Create file input with maximum compatibility
            fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.capture = 'environment'; // For mobile devices
            fileInput.multiple = false;
            
            // Style to be hidden but accessible
            fileInput.style.cssText = `
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                opacity: 0.001 !important;
                z-index: 100000 !important;
                cursor: pointer !important;
            `;

            const handleChange = (event) => {
                console.log('📸 File input change detected');
                const file = event.target.files[0];
                
                if (file && file.type.startsWith('image/')) {
                    console.log('✅ Valid image file selected:', file.name);
                    const reader = new FileReader();
                    
                    reader.onload = (e) => {
                        console.log('🖼️ File successfully converted to data URL');
                        resolveSafe(e.target.result);
                    };
                    
                    reader.onerror = () => {
                        console.error('❌ Error reading file');
                        resolveSafe(null);
                    };
                    
                    reader.readAsDataURL(file);
                } else {
                    console.log('❌ No valid image file selected or cancelled');
                    resolveSafe(null);
                }
            };

            const handleCancel = () => {
                console.log('❌ File selection cancelled by user');
                // Delay slightly to see if change event fires
                setTimeout(() => resolveSafe(null), 1000);
            };

            // Add all possible event listeners
            fileInput.addEventListener('change', handleChange);
            fileInput.addEventListener('cancel', handleCancel);
            fileInput.addEventListener('blur', handleCancel);
            
            // Add to document
            document.body.appendChild(fileInput);
            console.log('🎯 File input added to body, attempting to trigger...');

            // Multiple ways to trigger the file dialog
            try {
                // Method 1: Direct click
                fileInput.click();
                
                // Method 2: If that doesn't work, try focus + click
                setTimeout(() => {
                    if (!isResolved) {
                        fileInput.focus();
                        fileInput.click();
                    }
                }, 100);

                // Method 3: Last resort - simulate a more complex interaction
                setTimeout(() => {
                    if (!isResolved) {
                        const event = new MouseEvent('click', {
                            view: window,
                            bubbles: true,
                            cancelable: true
                        });
                        fileInput.dispatchEvent(event);
                    }
                }, 200);

            } catch (error) {
                console.error('❌ Error triggering file input:', error);
                resolveSafe(null);
            }

            // Final timeout cleanup
            setTimeout(() => {
                if (!isResolved) {
                    console.log('⏰ File selection timeout - cleaning up');
                    resolveSafe(null);
                }
            }, 10000); // 10 second timeout
        });
    };

    // ALTERNATIVE METHOD FOR CHROME MOBILE
    const handleChromeMobileGallerySelection = () => {
        return new Promise((resolve) => {
            console.log('📱 Trying Chrome Mobile alternative method');
            
            // Create a temporary button that users can click
            const tempUI = document.createElement('div');
            tempUI.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0,0,0,0.8);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 100000;
                padding: 20px;
            `;

            const message = document.createElement('div');
            message.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 12px; text-align: center; max-width: 300px;">
                    <h3 style="color: #1E3A5F; margin-bottom: 10px;">Select Image</h3>
                    <p style="color: #666; margin-bottom: 20px;">Click the file input that appears below to select an image from your gallery.</p>
                    <button id="close-alternative" style="padding: 10px 20px; background: #dc2626; color: white; border: none; border-radius: 8px; cursor: pointer;">Cancel</button>
                </div>
            `;

            tempUI.appendChild(message);
            document.body.appendChild(tempUI);

            // Create the actual file input
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 200px;
                height: 50px;
                opacity: 0.01;
                z-index: 100001;
            `;

            let isResolved = false;

            const resolveSafe = (result) => {
                if (!isResolved) {
                    isResolved = true;
                    document.body.removeChild(tempUI);
                    if (fileInput.parentNode) {
                        document.body.removeChild(fileInput);
                    }
                    resolve(result);
                }
            };

            fileInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (file && file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => resolveSafe(e.target.result);
                    reader.onerror = () => resolveSafe(null);
                    reader.readAsDataURL(file);
                } else {
                    resolveSafe(null);
                }
            });

            document.getElementById('close-alternative').addEventListener('click', () => {
                resolveSafe(null);
            });

            document.body.appendChild(fileInput);
            fileInput.click();

            setTimeout(() => {
                if (!isResolved) {
                    resolveSafe(null);
                }
            }, 15000);
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

            const facingMode = imageType === 'selfie' ? 'user' : 'environment';
            
            navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: facingMode } 
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
                `;
                
                const videoContainer = document.createElement('div');
                videoContainer.style.cssText = `
                    width: 100%;
                    max-width: 400px;
                    border-radius: 12px;
                    overflow: hidden;
                    background: #000;
                    margin-bottom: 20px;
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
                    cursor: pointer;
                    margin-bottom: 10px;
                    width: 100%;
                    max-width: 400px;
                `;
                
                const cancelButton = document.createElement('button');
                cancelButton.textContent = 'Cancel';
                cancelButton.style.cssText = `
                    padding: 12px 24px;
                    background: #dc2626;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 14px;
                    cursor: pointer;
                    width: 100%;
                    max-width: 400px;
                `;
                
                video.onloadedmetadata = () => {
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
                    
                    videoContainer.appendChild(video);
                    captureUI.appendChild(videoContainer);
                    captureUI.appendChild(captureButton);
                    captureUI.appendChild(cancelButton);
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

    // WORKING CROPPER WITH VISIBLE BUTTONS
    const handleCropSelectedImage = async () => {
        if (!selectedImageUri) return;

        try {
            if (Platform.OS === 'web') {
                const croppedImage = await createInteractiveCrop(selectedImageUri, currentImageType);
                if (croppedImage && currentSetFunction) {
                    currentSetFunction(croppedImage);
                }
            } else {
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
            
            setShowCropOptions(false);
            setSelectedImageUri(null);
            setCurrentImageType(null);
            setCurrentSetFunction(null);
            
        } catch (error) {
            console.error('Crop error:', error);
            handleUseAsIs();
        }
    };

    // INTERACTIVE CROPPER WITH VISIBLE BUTTONS
    const createInteractiveCrop = (imageUri, imageType) => {
        return new Promise((resolve) => {
            if (Platform.OS !== 'web') {
                resolve(imageUri);
                return;
            }

            console.log('Creating crop interface with visible buttons');

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
                height: 650px;
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
                height: 350px;
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
            `;

            const instructions = document.createElement('div');
            instructions.innerHTML = `
                <div style="color: #64748B; text-align: center; margin: 0 0 16px 0; font-size: 14px; line-height: 1.4; flex-shrink: 0;">
                    <strong>Pinch to zoom & drag to reposition</strong><br>
                    For best results, ensure the image is clear and properly framed
                </div>
            `;

            // CONTROL BUTTONS CONTAINER - MADE VISIBLE
            const controlButtonsContainer = document.createElement('div');
            controlButtonsContainer.style.cssText = `
                display: flex;
                gap: 10px;
                justify-content: center;
                margin-bottom: 16px;
                flex-shrink: 0;
            `;

            const resetButton = document.createElement('button');
            resetButton.innerHTML = '↺ Center Image';
            resetButton.style.cssText = `
                padding: 12px 20px;
                background: #6B7280;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: background 0.2s;
                min-width: 120px;
            `;
            resetButton.onmouseover = () => resetButton.style.background = '#4B5563';
            resetButton.onmouseout = () => resetButton.style.background = '#6B7280';

            // ACTION BUTTONS CONTAINER - MADE VISIBLE
            const actionButtonsContainer = document.createElement('div');
            actionButtonsContainer.style.cssText = `
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

            // PERFECT CENTERING FUNCTION
            const centerImage = () => {
                const containerWidth = cropArea.clientWidth;
                const containerHeight = cropArea.clientHeight;
                const imgWidth = img.naturalWidth;
                const imgHeight = img.naturalHeight;
                
                if (imgWidth === 0 || imgHeight === 0) return;
                
                const scaleX = containerWidth / imgWidth;
                const scaleY = containerHeight / imgHeight;
                scale = Math.min(Math.max(scaleX, scaleY), 1) * 0.9;
                
                posX = (containerWidth - imgWidth * scale) / 2;
                posY = (containerHeight - imgHeight * scale) / 2;
                
                updateImageTransform();
            };

            // Event handlers (same as before)
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
                startY = e.clientY - startY;
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
                
                const imagePointX = (mouseX - posX) / scale;
                const imagePointY = (mouseY - posY) / scale;
                
                scale = newScale;
                posX = mouseX - imagePointX * scale;
                posY = mouseY - imagePointY * scale;
                
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
            cropArea.addEventListener('touchstart', handleTouchStart, { passive: false });
            cropArea.addEventListener('touchmove', handleTouchMove, { passive: false });
            cropArea.addEventListener('touchend', handleTouchEnd);

            // Center image when loaded
            img.onload = () => {
                setTimeout(() => {
                    centerImage();
                    img.style.cursor = 'grab';
                }, 50);
            };

            img.onerror = () => {
                document.body.removeChild(cropUI);
                resolve(null);
            };

            // Button event handlers
            resetButton.onclick = () => centerImage();

            cropButton.onclick = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = cropArea.clientWidth;
                canvas.height = cropArea.clientHeight;
                
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                const sourceX = Math.max(0, -posX / scale);
                const sourceY = Math.max(0, -posY / scale);
                const sourceWidth = Math.min(img.naturalWidth, canvas.width / scale);
                const sourceHeight = Math.min(img.naturalHeight, canvas.height / scale);
                
                ctx.drawImage(
                    img,
                    sourceX, sourceY,
                    sourceWidth, sourceHeight,
                    0, 0,
                    canvas.width, canvas.height
                );
                
                const croppedImageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
                
                // Cleanup
                img.removeEventListener('mousedown', handleMouseDown);
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                cropArea.removeEventListener('wheel', handleWheel);
                cropArea.removeEventListener('touchstart', handleTouchStart);
                cropArea.removeEventListener('touchmove', handleTouchMove);
                cropArea.removeEventListener('touchend', handleTouchEnd);
                
                document.body.removeChild(cropUI);
                resolve(croppedImageDataUrl);
            };

            cancelCropButton.onclick = () => {
                img.removeEventListener('mousedown', handleMouseDown);
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                cropArea.removeEventListener('wheel', handleWheel);
                cropArea.removeEventListener('touchstart', handleTouchStart);
                cropArea.removeEventListener('touchmove', handleTouchMove);
                cropArea.removeEventListener('touchend', handleTouchEnd);
                
                document.body.removeChild(cropUI);
                resolve(null);
            };

            // ASSEMBLE THE INTERFACE PROPERLY
            cropArea.appendChild(img);
            
            controlButtonsContainer.appendChild(resetButton);
            
            actionButtonsContainer.appendChild(cropButton);
            actionButtonsContainer.appendChild(cancelCropButton);
            
            container.appendChild(title);
            container.appendChild(controlButtonsContainer); // Add control buttons
            container.appendChild(cropArea);
            container.appendChild(instructions);
            container.appendChild(actionButtonsContainer); // Add action buttons
            
            cropUI.appendChild(container);
            document.body.appendChild(cropUI);
            
            console.log('✅ Crop interface created with visible buttons');
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

// ... (styles remain exactly the same as previous code)

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
