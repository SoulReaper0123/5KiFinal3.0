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

    // Debug alerts helper
    const showDebugAlert = (message) => {
        if (Platform.OS === 'web') {
            alert(`DEBUG: ${message}`);
        }
        console.log(`DEBUG: ${message}`);
    };

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
            
            showDebugAlert(`Browser detected: ${isChrome ? 'Chrome' : isFirefox ? 'Firefox' : isSafari ? 'Safari' : 'Other'} - Mobile: ${isMobile ? 'Yes' : 'No'}`);
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
        showDebugAlert(`Starting image selection for: ${imageType}`);
        setPendingImageAction({
            setFunction: setImageFunction,
            type: imageType
        });
        setShowSourceOptions(true);
    };

    // Handle camera selection
    const handleCameraSelection = async () => {
        showDebugAlert('Camera selected');
        setShowSourceOptions(false);
        
        try {
            if (Platform.OS === 'web') {
                showDebugAlert('Starting web camera capture');
                const imageUri = await handleWebCameraCapture(pendingImageAction.type);
                showDebugAlert(imageUri ? 'Image captured successfully' : 'Camera cancelled');
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

    // SIMPLIFIED GALLERY SELECTION FOR CHROME
    const handleGallerySelection = async () => {
        showDebugAlert('Gallery selected - starting process');
        setShowSourceOptions(false);
        
        try {
            if (Platform.OS === 'web') {
                showDebugAlert('Using web gallery selection');
                
                // Add small delay to ensure modal is closed
                await new Promise(resolve => setTimeout(resolve, 300));
                
                const imageUri = await handleUniversalGallerySelection();
                showDebugAlert(imageUri ? 'Gallery SUCCESS - image selected' : 'Gallery FAILED - no image');
                
                if (imageUri) {
                    showDebugAlert('Setting crop options with selected image');
                    setSelectedImageUri(imageUri);
                    setCurrentSetFunction(() => pendingImageAction.setFunction);
                    setCurrentImageType(pendingImageAction.type);
                    setShowCropOptions(true);
                } else {
                    showDebugAlert('No image selected from gallery');
                }
            } else {
                showDebugAlert('Using native gallery selection');
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
            showDebugAlert(`Gallery ERROR: ${error.message}`);
            setModalMessage('Failed to select image from gallery. Please try again.');
            setModalType('error');
            setModalVisible(true);
        }
        
        setPendingImageAction(null);
    };

    // SIMPLIFIED UNIVERSAL GALLERY SELECTION - FIXED FOR CHROME
    const handleUniversalGallerySelection = () => {
        return new Promise((resolve) => {
            if (Platform.OS !== 'web') {
                resolve(null);
                return;
            }

            showDebugAlert('Creating file input for gallery');
            
            let isResolved = false;
            
            const resolvePromise = (result) => {
                if (!isResolved) {
                    isResolved = true;
                    showDebugAlert(`Gallery result: ${result ? 'SUCCESS' : 'FAILED/CANCELLED'}`);
                    resolve(result);
                }
            };

            // Create file input - SIMPLE VERSION
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.style.cssText = 'position: fixed; top: 0; left: 0; width: 100px; height: 100px; opacity: 1;';
            
            const handleChange = (event) => {
                showDebugAlert('File input change event triggered');
                const file = event.target.files[0];
                
                if (file && file.type.startsWith('image/')) {
                    showDebugAlert(`File selected: ${file.name} (${Math.round(file.size/1024)}KB)`);
                    
                    const reader = new FileReader();
                    
                    reader.onload = (loadEvent) => {
                        showDebugAlert('File read successfully');
                        resolvePromise(loadEvent.target.result);
                    };
                    
                    reader.onerror = () => {
                        showDebugAlert('File read ERROR');
                        resolvePromise(null);
                    };
                    
                    try {
                        reader.readAsDataURL(file);
                    } catch (error) {
                        showDebugAlert(`FileReader error: ${error}`);
                        resolvePromise(null);
                    }
                } else {
                    showDebugAlert('No valid file selected');
                    resolvePromise(null);
                }
            };

            const handleCancel = () => {
                showDebugAlert('File selection cancelled');
                setTimeout(() => {
                    resolvePromise(null);
                }, 1000);
            };

            // Add event listeners
            input.addEventListener('change', handleChange, { once: true });
            input.addEventListener('cancel', handleCancel, { once: true });

            // Add to document
            document.body.appendChild(input);
            
            // Safety timeout
            setTimeout(() => {
                if (!isResolved) {
                    showDebugAlert('Gallery selection TIMEOUT');
                    resolvePromise(null);
                }
            }, 30000);

            // Try to click the input
            try {
                showDebugAlert('Attempting to click file input');
                input.click();
                showDebugAlert('File input click completed');
            } catch (error) {
                showDebugAlert(`Click error: ${error}`);
                resolvePromise(null);
            }

            // Cleanup after a moment
            setTimeout(() => {
                if (document.body.contains(input)) {
                    document.body.removeChild(input);
                }
            }, 1000);
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

    // FIXED CROPPER WITH PROPER CENTERING
    const handleCropSelectedImage = async () => {
        if (!selectedImageUri) return;

        try {
            if (Platform.OS === 'web') {
                showDebugAlert('Starting web image cropping');
                const croppedImage = await createInteractiveCrop(selectedImageUri, currentImageType);
                showDebugAlert(croppedImage ? 'Cropping SUCCESS' : 'Cropping FAILED');
                if (croppedImage && currentSetFunction) {
                    currentSetFunction(croppedImage);
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
            
            setShowCropOptions(false);
            setSelectedImageUri(null);
            setCurrentImageType(null);
            setCurrentSetFunction(null);
            
        } catch (error) {
            console.error('Crop error:', error);
            showDebugAlert(`Crop ERROR: ${error.message}`);
            // If crop fails, just use the original image
            handleUseAsIs();
        }
    };

    // FIXED INTERACTIVE CROPPER WITH PROPER CENTERING
    const createInteractiveCrop = (imageUri, imageType) => {
        return new Promise((resolve) => {
            if (Platform.OS !== 'web') {
                resolve(imageUri);
                return;
            }

            showDebugAlert('Creating interactive crop interface');
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

            // FIXED: Proper image centering logic
            const centerImage = () => {
                const containerWidth = cropArea.clientWidth;
                const containerHeight = cropArea.clientHeight;
                const imgWidth = img.naturalWidth;
                const imgHeight = img.naturalHeight;
                
                console.log('Centering image:', { imgWidth, imgHeight, containerWidth, containerHeight });
                
                // Calculate scale to fit container while maintaining aspect ratio
                const scaleX = containerWidth / imgWidth;
                const scaleY = containerHeight / imgHeight;
                scale = Math.min(scaleX, scaleY) * 0.9; // 90% of max fit to show borders
                
                // Calculate centered position
                const scaledWidth = imgWidth * scale;
                const scaledHeight = imgHeight * scale;
                posX = (containerWidth - scaledWidth) / 2;
                posY = (containerHeight - scaledHeight) / 2;
                
                console.log('Centered position:', { posX, posY, scale, scaledWidth, scaledHeight });
                updateImageTransform();
                img.style.cursor = 'grab';
            };

            img.onload = () => {
                console.log('Image loaded in cropper');
                centerImage();
            };

            img.onerror = () => {
                console.error('Failed to load image in cropper');
                document.body.removeChild(cropUI);
                resolve(null);
            };

            // FIXED: Proper cropping logic with correct coordinate transformation
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
                
                // Set canvas size to crop area size
                canvas.width = containerWidth;
                canvas.height = containerHeight;
                
                // Calculate the visible portion of the image in the crop area
                // Convert crop area coordinates to original image coordinates
                const sourceX = -posX / scale;
                const sourceY = -posY / scale;
                const sourceWidth = containerWidth / scale;
                const sourceHeight = containerHeight / scale;
                
                console.log('Source crop coordinates:', {
                    sourceX, sourceY, sourceWidth, sourceHeight
                });
                
                // Ensure we don't try to crop outside the image bounds
                const boundedSourceX = Math.max(0, sourceX);
                const boundedSourceY = Math.max(0, sourceY);
                const boundedSourceWidth = Math.min(imgWidth - boundedSourceX, sourceWidth);
                const boundedSourceHeight = Math.min(imgHeight - boundedSourceY, sourceHeight);
                
                console.log('Bounded source coordinates:', {
                    boundedSourceX, boundedSourceY, boundedSourceWidth, boundedSourceHeight
                });
                
                // Draw the cropped image
                ctx.drawImage(
                    img,
                    boundedSourceX, boundedSourceY,           // Source x, y
                    boundedSourceWidth, boundedSourceHeight,   // Source width, height
                    0, 0,                                     // Destination x, y
                    canvas.width, canvas.height               // Destination width, height
                );
                
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
            
            console.log('Crop interface created successfully');
        });
    };

    // Handle using the image as-is (no cropping)
    const handleUseAsIs = () => {
        showDebugAlert('Using image as-is without cropping');
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

    // TEST FUNCTION FOR DEBUGGING
    const testGalleryFunction = async () => {
        showDebugAlert('Testing gallery function directly');
        const result = await handleUniversalGallerySelection();
        showDebugAlert(`Direct test result: ${result ? 'SUCCESS' : 'FAILED'}`);
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.container}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={28} color="#0F172A" />
                </TouchableOpacity>

                {/* TEMPORARY TEST BUTTON - REMOVE AFTER FIXING */}
                <TouchableOpacity 
                    style={styles.testButton}
                    onPress={testGalleryFunction}
                >
                    <Text style={styles.testButtonText}>🧪 TEST GALLERY</Text>
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
    // TEST BUTTON STYLES
    testButton: {
        backgroundColor: 'orange',
        padding: 12,
        margin: 10,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'darkorange',
    },
    testButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
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
