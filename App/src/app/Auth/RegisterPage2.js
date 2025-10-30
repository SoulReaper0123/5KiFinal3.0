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
    
    // State for modals
    const [showSourceOptions, setShowSourceOptions] = useState(false);
    const [showCropOptions, setShowCropOptions] = useState(false);
    
    // State for image handling
    const [selectedImageUri, setSelectedImageUri] = useState(null);
    const [currentImageType, setCurrentImageType] = useState(null);
    const [currentSetFunction, setCurrentSetFunction] = useState(null);
    
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
    const showSourceSelection = (setImageFunction, imageType) => {
        setCurrentSetFunction(() => setImageFunction);
        setCurrentImageType(imageType);
        setShowSourceOptions(true);
    };

    // Handle camera selection
    const handleCameraSelection = async () => {
        setShowSourceOptions(false);
        
        try {
            if (Platform.OS === 'web') {
                // Use the improved web camera handler
                const imageUri = await handleWebCameraCapture(currentImageType);
                if (imageUri) {
                    setSelectedImageUri(imageUri);
                    setShowCropOptions(true);
                }
            } else {
                // Native camera handling
                const result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: false,
                    aspect: [4, 3],
                    quality: 0.8,
                    base64: false,
                });

                if (!result.canceled && result.assets && result.assets[0]) {
                    const imageUri = result.assets[0].uri;
                    setSelectedImageUri(imageUri);
                    setShowCropOptions(true);
                }
            }
        } catch (error) {
            console.error('Camera error:', error);
            setModalMessage('Failed to capture image. Please try again.');
            setModalType('error');
            setModalVisible(true);
        }
    };

    // Handle gallery selection
    const handleGallerySelection = async () => {
        setShowSourceOptions(false);
        
        try {
            if (Platform.OS === 'web') {
                // Universal web gallery handling
                const imageUri = await handleUniversalGallerySelection();
                if (imageUri) {
                    setSelectedImageUri(imageUri);
                    setShowCropOptions(true);
                }
            } else {
                // Native gallery handling
                const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: false,
                    aspect: [4, 3],
                    quality: 0.8,
                    base64: false,
                });

                if (!result.canceled && result.assets && result.assets[0]) {
                    const imageUri = result.assets[0].uri;
                    setSelectedImageUri(imageUri);
                    setShowCropOptions(true);
                }
            }
        } catch (error) {
            console.error('Gallery error:', error);
            setModalMessage('Failed to select image from gallery. Please try again.');
            setModalType('error');
            setModalVisible(true);
        }
    };

    // UNIVERSAL GALLERY SELECTION - SIMPLIFIED AND RELIABLE
    const handleUniversalGallerySelection = () => {
        return new Promise((resolve) => {
            if (Platform.OS !== 'web') {
                resolve(null);
                return;
            }

            try {
                // Simple file input method that works everywhere
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                
                input.style.cssText = `
                    position: fixed;
                    top: -1000px;
                    left: -1000px;
                    opacity: 0;
                `;
                
                document.body.appendChild(input);
                
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        // Check file size (max 10MB)
                        if (file.size > 10 * 1024 * 1024) {
                            setModalMessage('Image size too large. Please select an image smaller than 10MB.');
                            setModalType('error');
                            setModalVisible(true);
                            document.body.removeChild(input);
                            resolve(null);
                            return;
                        }
                        
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            const imageUri = event.target.result;
                            document.body.removeChild(input);
                            resolve(imageUri);
                        };
                        reader.onerror = () => {
                            document.body.removeChild(input);
                            resolve(null);
                        };
                        reader.readAsDataURL(file);
                    } else {
                        document.body.removeChild(input);
                        resolve(null);
                    }
                };
                
                input.oncancel = () => {
                    document.body.removeChild(input);
                    resolve(null);
                };
                
                // Trigger click
                setTimeout(() => {
                    try {
                        input.click();
                    } catch (error) {
                        document.body.removeChild(input);
                        resolve(null);
                    }
                }, 100);
                
            } catch (error) {
                console.error('Gallery selection error:', error);
                resolve(null);
            }
        });
    };

    // Web camera capture - SIMPLIFIED AND RELIABLE
    const handleWebCameraCapture = (imageType) => {
        return new Promise((resolve) => {
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
                
                navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: facingMode,
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
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
                    
                    video.style.cssText = `
                        width: 100%;
                        height: auto;
                        border-radius: 8px;
                        transform: ${facingMode === 'user' ? 'scaleX(-1)' : 'none'};
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
                        font-weight: bold;
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
                    
                    if (error.name === 'NotAllowedError') {
                        errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.';
                    } else if (error.name === 'NotFoundError') {
                        errorMessage = 'No camera found on this device.';
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

    // SIMPLIFIED CROP FUNCTIONALITY - WORKS EVERYWHERE
    const handleCropSelectedImage = async () => {
        if (!selectedImageUri) return;

        try {
            if (Platform.OS === 'web') {
                // For web, use a simple canvas-based crop that works everywhere
                const croppedImage = await createSimpleCropInterface(selectedImageUri);
                if (croppedImage) {
                    currentSetFunction(croppedImage);
                    setShowCropOptions(false);
                    setSelectedImageUri(null);
                } else {
                    // If crop fails, use original
                    handleUseAsIs();
                }
            } else {
                // For native, use Expo's built-in image picker with cropping
                const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: currentImageType === 'selfie' ? [1, 1] : [4, 3],
                    quality: 0.8,
                    base64: false,
                });

                if (!result.canceled && result.assets && result.assets[0]) {
                    currentSetFunction(result.assets[0].uri);
                }
                setShowCropOptions(false);
                setSelectedImageUri(null);
            }
        } catch (error) {
            console.error('Crop error:', error);
            // If anything fails, use the original image
            handleUseAsIs();
        }
    };

    // SIMPLE CROP INTERFACE - RELIABLE AND WORKS EVERYWHERE
    const createSimpleCropInterface = (imageUri) => {
        return new Promise((resolve) => {
            if (Platform.OS !== 'web') {
                resolve(imageUri);
                return;
            }

            try {
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
                            padding: 20px;
                            box-sizing: border-box;
                        `;

                        const container = document.createElement('div');
                        container.style.cssText = `
                            background: white;
                            border-radius: 12px;
                            padding: 20px;
                            max-width: 95%;
                            max-height: 90%;
                            overflow: auto;
                            width: 400px;
                        `;

                        const title = document.createElement('h3');
                        title.textContent = 'Crop Image';
                        title.style.cssText = `
                            color: #1E3A5F;
                            margin-bottom: 15px;
                            text-align: center;
                        `;

                        const canvasContainer = document.createElement('div');
                        canvasContainer.style.cssText = `
                            position: relative;
                            margin-bottom: 15px;
                            border: 2px solid #1E3A5F;
                            border-radius: 8px;
                            overflow: hidden;
                            background: #f8fafc;
                        `;

                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        // Set canvas size
                        const maxWidth = 350;
                        const scale = maxWidth / img.width;
                        const displayHeight = img.height * scale;
                        
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

                        // Simple selection
                        let startX = maxWidth * 0.1;
                        let startY = displayHeight * 0.1;
                        let endX = maxWidth * 0.9;
                        let endY = displayHeight * 0.9;
                        let isDrawing = false;

                        const drawSelection = () => {
                            // Redraw image
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            ctx.drawImage(img, 0, 0, maxWidth, displayHeight);
                            
                            // Draw selection
                            const rectX = Math.min(startX, endX);
                            const rectY = Math.min(startY, endY);
                            const rectWidth = Math.abs(endX - startX);
                            const rectHeight = Math.abs(endY - startY);
                            
                            // Draw overlay
                            ctx.fillStyle = 'rgba(0,0,0,0.5)';
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                            
                            // Clear selected area
                            ctx.clearRect(rectX, rectY, rectWidth, rectHeight);
                            
                            // Draw border
                            ctx.strokeStyle = '#1E3A5F';
                            ctx.lineWidth = 2;
                            ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
                        };

                        // Mouse events
                        canvas.onmousedown = (e) => {
                            isDrawing = true;
                            const rect = canvas.getBoundingClientRect();
                            startX = e.clientX - rect.left;
                            startY = e.clientY - rect.top;
                            endX = startX;
                            endY = startY;
                        };

                        canvas.onmousemove = (e) => {
                            if (!isDrawing) return;
                            const rect = canvas.getBoundingClientRect();
                            endX = e.clientX - rect.left;
                            endY = e.clientY - rect.top;
                            drawSelection();
                        };

                        canvas.onmouseup = () => {
                            isDrawing = false;
                        };

                        // Touch events
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
                            gap: 10px;
                            justify-content: center;
                        `;

                        const cropButton = document.createElement('button');
                        cropButton.textContent = 'Apply Crop';
                        cropButton.style.cssText = `
                            padding: 10px 20px;
                            background: #1E3A5F;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            font-size: 14px;
                            cursor: pointer;
                        `;

                        const cancelButton = document.createElement('button');
                        cancelButton.textContent = 'Cancel';
                        cancelButton.style.cssText = `
                            padding: 10px 20px;
                            background: #dc2626;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            font-size: 14px;
                            cursor: pointer;
                        `;

                        cropButton.onclick = () => {
                            try {
                                const rectX = Math.min(startX, endX);
                                const rectY = Math.min(startY, endY);
                                const rectWidth = Math.abs(endX - startX);
                                const rectHeight = Math.abs(endY - startY);
                                
                                // Calculate actual crop coordinates
                                const scaleX = img.width / maxWidth;
                                const scaleY = img.height / displayHeight;
                                
                                const cropX = rectX * scaleX;
                                const cropY = rectY * scaleY;
                                const cropWidth = rectWidth * scaleX;
                                const cropHeight = rectHeight * scaleY;
                                
                                // Create cropped image
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
                                console.error('Crop error:', error);
                                document.body.removeChild(cropUI);
                                resolve(imageUri);
                            }
                        };

                        cancelButton.onclick = () => {
                            document.body.removeChild(cropUI);
                            resolve(null);
                        };

                        canvasContainer.appendChild(canvas);
                        container.appendChild(title);
                        container.appendChild(canvasContainer);
                        buttonContainer.appendChild(cropButton);
                        buttonContainer.appendChild(cancelButton);
                        container.appendChild(buttonContainer);
                        cropUI.appendChild(container);
                        document.body.appendChild(cropUI);

                        // Initial draw
                        drawSelection();
                    } catch (error) {
                        console.error('Crop UI error:', error);
                        resolve(imageUri);
                    }
                };

                img.onerror = () => {
                    resolve(imageUri);
                };
            } catch (error) {
                console.error('Crop interface error:', error);
                resolve(imageUri);
            }
        });
    };

    // Handle using the image as-is (no cropping)
    const handleUseAsIs = () => {
        if (currentSetFunction && selectedImageUri) {
            currentSetFunction(selectedImageUri);
            setShowCropOptions(false);
            setSelectedImageUri(null);
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

    // Improved image display
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

                {/* Browser-specific instructions */}
                {Platform.OS === 'web' && (
                    <View style={styles.webWarning}>
                        <MaterialIcons name="info" size={16} color="#856404" />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.webWarningText}>
                                Tap on the image areas to upload photos. Works on all mobile browsers.
                            </Text>
                            {browserInfo.isMobile && (
                                <Text style={styles.mobileTipText}>
                                    💡 Tip: For best results, use Chrome or Safari browser.
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
                            
                            <Text style={styles.sourceInstructions}>
                                How would you like to add your {currentImageType === 'idFront' ? 'ID photo' : 'selfie'}?
                            </Text>
                            
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
                    onRequestClose={() => {
                        setShowCropOptions(false);
                        setSelectedImageUri(null);
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
                                </View>
                            )}
                            
                            <Text style={styles.cropInstructions}>
                                Would you like to use this image as is or crop it?
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
                                onPress={() => {
                                    setShowCropOptions(false);
                                    setSelectedImageUri(null);
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
    mobileTipText: {
        color: '#856404',
        fontSize: 11,
        marginLeft: 8,
        marginTop: 4,
        fontWeight: '500',
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
        marginBottom: 20,
        paddingHorizontal: 10,
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
