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

    const {
        firstName, middleName, lastName, email, phoneNumber, placeOfBirth,
        address, dateOfBirth,
    } = route.params;

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

    // Handle gallery selection
    const handleGallerySelection = async () => {
        setShowSourceOptions(false);
        
        try {
            if (Platform.OS === 'web') {
                const imageUri = await handleUniversalGallerySelection();
                if (imageUri) {
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

            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.style.cssText = 'position: fixed; top: -1000px; left: -1000px; opacity: 0;';
            
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        resolve(event.target.result);
                    };
                    reader.onerror = () => resolve(null);
                    reader.readAsDataURL(file);
                } else {
                    resolve(null);
                }
                document.body.removeChild(input);
            };
            
            input.oncancel = () => {
                document.body.removeChild(input);
                resolve(null);
            };
            
            document.body.appendChild(input);
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

    // SIMPLE CROP FUNCTION - NO ZOOM INTERFERENCE
    const handleCropSelectedImage = async () => {
        if (!selectedImageUri) return;

        try {
            if (Platform.OS === 'web') {
                const croppedImage = await createSimpleCropInterface(selectedImageUri);
                if (croppedImage && currentSetFunction) {
                    currentSetFunction(croppedImage);
                    setShowCropOptions(false);
                    setSelectedImageUri(null);
                    setCurrentImageType(null);
                    setCurrentSetFunction(null);
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
                    setShowCropOptions(false);
                    setSelectedImageUri(null);
                    setCurrentImageType(null);
                    setCurrentSetFunction(null);
                }
            }
        } catch (error) {
            console.error('Crop error:', error);
            handleUseAsIs();
        }
    };

    // SIMPLE CROP INTERFACE - NO ZOOM INTERFERENCE
    const createSimpleCropInterface = (imageUri) => {
        return new Promise((resolve) => {
            if (Platform.OS !== 'web') {
                resolve(imageUri);
                return;
            }

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
            title.textContent = 'Crop Image - Click and Drag to Select Area';
            title.style.cssText = `
                color: #1E3A5F;
                margin-bottom: 10px;
                text-align: center;
                font-size: 16px;
            `;

            const instructions = document.createElement('p');
            instructions.innerHTML = `
                <strong>How to crop:</strong><br>
                1. <strong>Click and drag</strong> to draw a rectangle<br>
                2. Release to set the crop area<br>
                3. Click <strong>Apply Crop</strong> to confirm
            `;
            instructions.style.cssText = `
                color: #64748B;
                text-align: center;
                margin-bottom: 10px;
                font-size: 12px;
                line-height: 1.4;
            `;

            const imageContainer = document.createElement('div');
            imageContainer.style.cssText = `
                position: relative;
                margin-bottom: 10px;
                border: 2px solid #1E3A5F;
                border-radius: 8px;
                overflow: hidden;
                max-width: 100%;
                background: #f8fafc;
                user-select: none;
                -webkit-user-select: none;
            `;

            const img = new Image();
            img.src = imageUri;
            
            img.onload = () => {
                // Set image size
                const maxWidth = Math.min(400, window.innerWidth - 40);
                const maxHeight = Math.min(400, window.innerHeight - 200);
                const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
                const displayWidth = img.width * scale;
                const displayHeight = img.height * scale;
                
                img.style.cssText = `
                    width: ${displayWidth}px;
                    height: ${displayHeight}px;
                    display: block;
                    cursor: crosshair;
                `;

                // Create overlay canvas for selection
                const overlayCanvas = document.createElement('canvas');
                overlayCanvas.width = displayWidth;
                overlayCanvas.height = displayHeight;
                overlayCanvas.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: ${displayWidth}px;
                    height: ${displayHeight}px;
                    cursor: crosshair;
                `;
                
                const ctx = overlayCanvas.getContext('2d');
                
                // Crop state
                let isDrawing = false;
                let startX = 0;
                let startY = 0;
                let currentX = 0;
                let currentY = 0;

                const drawSelection = () => {
                    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
                    
                    if (isDrawing) {
                        const width = currentX - startX;
                        const height = currentY - startY;
                        
                        // Draw semi-transparent overlay
                        ctx.fillStyle = 'rgba(30, 58, 95, 0.3)';
                        ctx.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height);
                        
                        // Clear selected area
                        ctx.clearRect(startX, startY, width, height);
                        
                        // Draw selection border
                        ctx.strokeStyle = '#1E3A5F';
                        ctx.lineWidth = 3;
                        ctx.strokeRect(startX, startY, width, height);
                    }
                };

                // Mouse events
                const handleMouseDown = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    isDrawing = true;
                    const rect = overlayCanvas.getBoundingClientRect();
                    startX = e.clientX - rect.left;
                    startY = e.clientY - rect.top;
                    currentX = startX;
                    currentY = startY;
                    drawSelection();
                };

                const handleMouseMove = (e) => {
                    if (!isDrawing) return;
                    e.preventDefault();
                    e.stopPropagation();
                    const rect = overlayCanvas.getBoundingClientRect();
                    currentX = e.clientX - rect.left;
                    currentY = e.clientY - rect.top;
                    drawSelection();
                };

                const handleMouseUp = (e) => {
                    if (!isDrawing) return;
                    e.preventDefault();
                    e.stopPropagation();
                    isDrawing = false;
                };

                // Touch events
                const handleTouchStart = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    isDrawing = true;
                    const rect = overlayCanvas.getBoundingClientRect();
                    const touch = e.touches[0];
                    startX = touch.clientX - rect.left;
                    startY = touch.clientY - rect.top;
                    currentX = startX;
                    currentY = startY;
                    drawSelection();
                };

                const handleTouchMove = (e) => {
                    if (!isDrawing) return;
                    e.preventDefault();
                    e.stopPropagation();
                    const rect = overlayCanvas.getBoundingClientRect();
                    const touch = e.touches[0];
                    currentX = touch.clientX - rect.left;
                    currentY = touch.clientY - rect.top;
                    drawSelection();
                };

                const handleTouchEnd = (e) => {
                    if (!isDrawing) return;
                    e.preventDefault();
                    e.stopPropagation();
                    isDrawing = false;
                };

                // Add event listeners
                overlayCanvas.addEventListener('mousedown', handleMouseDown);
                overlayCanvas.addEventListener('mousemove', handleMouseMove);
                overlayCanvas.addEventListener('mouseup', handleMouseUp);
                overlayCanvas.addEventListener('touchstart', handleTouchStart, { passive: false });
                overlayCanvas.addEventListener('touchmove', handleTouchMove, { passive: false });
                overlayCanvas.addEventListener('touchend', handleTouchEnd, { passive: false });

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
                    padding: 12px 20px;
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
                    padding: 12px 20px;
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
                        if (!isDrawing && startX !== currentX && startY !== currentY) {
                            // Calculate actual crop coordinates
                            const scaleX = img.width / displayWidth;
                            const scaleY = img.height / displayHeight;
                            
                            const cropX = Math.min(startX, currentX) * scaleX;
                            const cropY = Math.min(startY, currentY) * scaleY;
                            const cropWidth = Math.abs(currentX - startX) * scaleX;
                            const cropHeight = Math.abs(currentY - startY) * scaleY;
                            
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
                            
                            // Clean up
                            overlayCanvas.removeEventListener('mousedown', handleMouseDown);
                            overlayCanvas.removeEventListener('mousemove', handleMouseMove);
                            overlayCanvas.removeEventListener('mouseup', handleMouseUp);
                            overlayCanvas.removeEventListener('touchstart', handleTouchStart);
                            overlayCanvas.removeEventListener('touchmove', handleTouchMove);
                            overlayCanvas.removeEventListener('touchend', handleTouchEnd);
                            
                            document.body.removeChild(cropUI);
                            resolve(croppedDataUrl);
                        } else {
                            alert('Please select a crop area first by clicking and dragging on the image.');
                        }
                    } catch (error) {
                        console.error('Crop processing error:', error);
                        document.body.removeChild(cropUI);
                        resolve(imageUri);
                    }
                };

                cancelCropButton.onclick = () => {
                    // Clean up
                    overlayCanvas.removeEventListener('mousedown', handleMouseDown);
                    overlayCanvas.removeEventListener('mousemove', handleMouseMove);
                    overlayCanvas.removeEventListener('mouseup', handleMouseUp);
                    overlayCanvas.removeEventListener('touchstart', handleTouchStart);
                    overlayCanvas.removeEventListener('touchmove', handleTouchMove);
                    overlayCanvas.removeEventListener('touchend', handleTouchEnd);
                    
                    document.body.removeChild(cropUI);
                    resolve(null);
                };

                imageContainer.appendChild(img);
                imageContainer.appendChild(overlayCanvas);
                container.appendChild(title);
                container.appendChild(instructions);
                container.appendChild(imageContainer);
                buttonContainer.appendChild(cropButton);
                buttonContainer.appendChild(cancelCropButton);
                container.appendChild(buttonContainer);
                cropUI.appendChild(container);
                document.body.appendChild(cropUI);

                // Initial empty draw
                drawSelection();
            };

            img.onerror = () => {
                document.body.removeChild(cropUI);
                resolve(imageUri);
            };
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

                {Platform.OS === 'web' && (
                    <View style={styles.webWarning}>
                        <MaterialIcons name="info" size={16} color="#856404" />
                        <Text style={styles.webWarningText}>
                            💡 Click and drag on the image to select crop area. No zoom interference!
                        </Text>
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
                            
                            <Text style={styles.cropInstructions}>
                                {currentImageType === 'selfie' 
                                    ? 'Crop your selfie: Click and drag to select area'
                                    : 'Crop your ID: Click and drag to select area'
                                }
                            </Text>

                            {Platform.OS === 'web' && (
                                <View style={styles.cropNote}>
                                    <Text style={styles.cropNoteText}>
                                        💡 Simple click-and-drag selection. No zoom interference!
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
                                    <Text style={styles.cropOptionButtonText}>Open Crop Tool</Text>
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
    webWarning: {
        backgroundColor: '#D1ECF1',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#0CA678',
        flexDirection: 'row',
        alignItems: 'center',
    },
    webWarningText: {
        color: '#055160',
        fontSize: 12,
        marginLeft: 8,
        fontWeight: '600',
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
    cropInstructions: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 10,
        lineHeight: 20,
    },
    cropNote: {
        backgroundColor: '#EFF6FF',
        padding: 10,
        borderRadius: 8,
        marginBottom: 15,
    },
    cropNoteText: {
        color: '#1E40AF',
        fontSize: 12,
        textAlign: 'center',
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
