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
    const [showCropOptions, setShowCropOptions] = useState(false);
    const [selectedImageUri, setSelectedImageUri] = useState(null);
    const [currentImageType, setCurrentImageType] = useState(null);
    const [currentSetFunction, setCurrentSetFunction] = useState(null);
    const [showSourceOptions, setShowSourceOptions] = useState(false);
    const [pendingImageAction, setPendingImageAction] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [modalType, setModalType] = useState('error');
    const [isMobile, setIsMobile] = useState(false);

    const {
        firstName, middleName, lastName, email, phoneNumber, placeOfBirth,
        address, dateOfBirth,
    } = route.params;

    // Detect mobile device
    useEffect(() => {
        if (Platform.OS === 'web') {
            const userAgent = navigator.userAgent || navigator.vendor || window.opera;
            const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
            setIsMobile(isMobileDevice);
            console.log('Mobile detected:', isMobileDevice);
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
    const showSourceSelection = (setImageFunction, imageType, allowCrop = true) => {
        setPendingImageAction({
            setFunction: setImageFunction,
            type: imageType,
            allowCrop: allowCrop
        });
        setShowSourceOptions(true);
    };

    // SIMPLIFIED: Handle camera selection for mobile Chrome
    const handleCameraSelection = async () => {
        setShowSourceOptions(false);
        
        try {
            if (Platform.OS === 'web') {
                // Use a simple file input with camera capture for mobile Chrome
                const imageUri = await handleMobileCameraCapture();
                if (imageUri) {
                    if (pendingImageAction.allowCrop) {
                        setSelectedImageUri(imageUri);
                        setCurrentSetFunction(() => pendingImageAction.setFunction);
                        setCurrentImageType(pendingImageAction.type);
                        setShowCropOptions(true);
                    } else {
                        pendingImageAction.setFunction(imageUri);
                    }
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
                    if (pendingImageAction.allowCrop) {
                        setSelectedImageUri(imageUri);
                        setCurrentSetFunction(() => pendingImageAction.setFunction);
                        setCurrentImageType(pendingImageAction.type);
                        setShowCropOptions(true);
                    } else {
                        pendingImageAction.setFunction(imageUri);
                    }
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

    // FIXED: Simple gallery selection that works on mobile Chrome
    const handleGallerySelection = async () => {
        setShowSourceOptions(false);
        
        try {
            if (Platform.OS === 'web') {
                // Use a simple file input that works everywhere
                const imageUri = await handleSimpleFileInput();
                if (imageUri) {
                    if (pendingImageAction.allowCrop) {
                        setSelectedImageUri(imageUri);
                        setCurrentSetFunction(() => pendingImageAction.setFunction);
                        setCurrentImageType(pendingImageAction.type);
                        setShowCropOptions(true);
                    } else {
                        pendingImageAction.setFunction(imageUri);
                    }
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
                    if (pendingImageAction.allowCrop) {
                        setSelectedImageUri(imageUri);
                        setCurrentSetFunction(() => pendingImageAction.setFunction);
                        setCurrentImageType(pendingImageAction.type);
                        setShowCropOptions(true);
                    } else {
                        pendingImageAction.setFunction(imageUri);
                    }
                }
            }
        } catch (error) {
            console.error('Gallery error:', error);
            setModalMessage('Failed to select image. Please try again.');
            setModalType('error');
            setModalVisible(true);
        }
        
        setPendingImageAction(null);
    };

    // SIMPLE FILE INPUT - Works on ALL browsers including mobile Chrome
    const handleSimpleFileInput = () => {
        return new Promise((resolve) => {
            try {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                
                // Add capture attribute for mobile devices to use camera
                if (isMobile) {
                    input.setAttribute('capture', 'environment');
                }
                
                input.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    opacity: 0;
                    z-index: 9999;
                `;

                const cleanup = () => {
                    if (document.body.contains(input)) {
                        document.body.removeChild(input);
                    }
                };

                const timeoutId = setTimeout(() => {
                    cleanup();
                    resolve(null);
                }, 60000); // 60 second timeout

                input.onchange = (e) => {
                    clearTimeout(timeoutId);
                    const file = e.target.files[0];
                    if (file) {
                        // Validate file size (max 5MB for mobile)
                        if (file.size > 5 * 1024 * 1024) {
                            setModalMessage('Image too large. Please select image smaller than 5MB.');
                            setModalType('error');
                            setModalVisible(true);
                            cleanup();
                            resolve(null);
                            return;
                        }

                        const reader = new FileReader();
                        reader.onload = (event) => {
                            cleanup();
                            resolve(event.target.result);
                        };
                        reader.onerror = () => {
                            cleanup();
                            setModalMessage('Failed to read image file.');
                            setModalType('error');
                            setModalVisible(true);
                            resolve(null);
                        };
                        reader.readAsDataURL(file);
                    } else {
                        cleanup();
                        resolve(null);
                    }
                };

                input.oncancel = () => {
                    clearTimeout(timeoutId);
                    cleanup();
                    resolve(null);
                };

                input.onerror = () => {
                    clearTimeout(timeoutId);
                    cleanup();
                    setModalMessage('Error accessing file picker.');
                    setModalType('error');
                    setModalVisible(true);
                    resolve(null);
                };

                document.body.appendChild(input);
                input.click();

            } catch (error) {
                console.error('File input error:', error);
                setModalMessage('File selection not working. Please try again.');
                setModalType('error');
                setModalVisible(true);
                resolve(null);
            }
        });
    };

    // SIMPLE MOBILE CAMERA CAPTURE - Works on mobile Chrome
    const handleMobileCameraCapture = () => {
        return new Promise((resolve) => {
            try {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                
                // Force camera usage on mobile
                input.setAttribute('capture', 'environment');
                
                input.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    opacity: 0;
                    z-index: 9999;
                `;

                const cleanup = () => {
                    if (document.body.contains(input)) {
                        document.body.removeChild(input);
                    }
                };

                const timeoutId = setTimeout(() => {
                    cleanup();
                    resolve(null);
                }, 60000);

                input.onchange = (e) => {
                    clearTimeout(timeoutId);
                    const file = e.target.files[0];
                    if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                            setModalMessage('Image too large. Please take a smaller photo.');
                            setModalType('error');
                            setModalVisible(true);
                            cleanup();
                            resolve(null);
                            return;
                        }

                        const reader = new FileReader();
                        reader.onload = (event) => {
                            cleanup();
                            resolve(event.target.result);
                        };
                        reader.onerror = () => {
                            cleanup();
                            setModalMessage('Failed to process photo.');
                            setModalType('error');
                            setModalVisible(true);
                            resolve(null);
                        };
                        reader.readAsDataURL(file);
                    } else {
                        cleanup();
                        resolve(null);
                    }
                };

                input.oncancel = () => {
                    clearTimeout(timeoutId);
                    cleanup();
                    resolve(null);
                };

                document.body.appendChild(input);
                input.click();

            } catch (error) {
                console.error('Mobile camera error:', error);
                setModalMessage('Camera not available. Please use gallery instead.');
                setModalType('error');
                setModalVisible(true);
                resolve(null);
            }
        });
    };

    // Handle crop selection
    const handleCropSelectedImage = async () => {
        if (!selectedImageUri) return;

        try {
            if (Platform.OS === 'web') {
                setModalMessage('Crop functionality is limited on web. Using image as is.');
                setModalType('info');
                setModalVisible(true);
                
                if (currentSetFunction) {
                    currentSetFunction(selectedImageUri);
                }
            } else {
                const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [4, 3],
                    quality: 0.8,
                });

                if (!result.canceled && result.assets && result.assets[0]) {
                    if (currentSetFunction) {
                        currentSetFunction(result.assets[0].uri);
                    }
                } else {
                    return;
                }
            }
            
            setShowCropOptions(false);
            setSelectedImageUri(null);
            setCurrentImageType(null);
            setCurrentSetFunction(null);
            
        } catch (error) {
            console.error('Error cropping image:', error);
            setModalMessage('Failed to crop image. Using image as is.');
            setModalType('error');
            setModalVisible(true);
        }
    };

    // Handle using the image as-is
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
        showSourceSelection(setValidIdFront, 'idFront', true);
    };

    // Handle Selfie selection
    const handleSelfiePress = () => {
        showSourceSelection(setSelfie, 'selfie', false);
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

                {/* Mobile-specific instructions */}
                {Platform.OS === 'web' && isMobile && (
                    <View style={styles.mobileWarning}>
                        <MaterialIcons name="smartphone" size={16} color="#055160" />
                        <Text style={styles.mobileWarningText}>
                            📱 Mobile Detected: Tap "Take Photo" for camera or "Choose from Gallery" for files. Works on Chrome!
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
                                        {isMobile && (
                                            <Text style={styles.mobileHint}>📷 Works on Mobile Chrome!</Text>
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
                                        <Text style={styles.uploadSubText}>Camera or Gallery</Text>
                                        {isMobile && (
                                            <Text style={styles.mobileHint}>🤳 Use front camera</Text>
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

                            {isMobile && (
                                <View style={styles.mobileTip}>
                                    <Text style={styles.mobileTipText}>
                                        ✅ Guaranteed to work on Mobile Chrome!
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
                                        {isMobile ? 'Opens camera directly' : 'Use camera'}
                                    </Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={[styles.sourceOptionButton, styles.galleryButton]}
                                    onPress={handleGallerySelection}
                                >
                                    <MaterialIcons name="photo-library" size={30} color="#fff" />
                                    <Text style={styles.sourceOptionButtonText}>Choose from Gallery</Text>
                                    <Text style={styles.sourceOptionSubText}>
                                        {isMobile ? 'Select from photos' : 'Select from device'}
                                    </Text>
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

                {/* Crop Options Modal */}
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
                            <Text style={styles.modalTitle}>Image Preview</Text>
                            
                            {selectedImageUri && (
                                <View style={styles.previewImageContainer}>
                                    <Image source={getImageSource(selectedImageUri)} style={styles.previewImage} />
                                    <Text style={styles.previewText}>Your selected image</Text>
                                </View>
                            )}
                            
                            <Text style={styles.cropInstructions}>
                                Would you like to use this image as is?
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
                                    <Text style={styles.cropOptionButtonText}>
                                        {Platform.OS === 'web' ? 'Try Crop' : 'Crop Image'}
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
    subLabel: {
        fontSize: 13,
        marginTop: 2,
        color: '#475569',
    },
    mobileWarning: {
        backgroundColor: '#D1ECF1',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#0CA678',
        flexDirection: 'row',
        alignItems: 'center',
    },
    mobileWarningText: {
        color: '#055160',
        fontSize: 12,
        marginLeft: 8,
        flex: 1,
        fontWeight: '600',
    },
    mobileTip: {
        backgroundColor: '#E7F3FF',
        padding: 10,
        borderRadius: 8,
        marginBottom: 15,
        borderLeftWidth: 4,
        borderLeftColor: '#1E3A5F',
    },
    mobileTipText: {
        color: '#1E3A5F',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
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
    mobileHint: {
        fontSize: 9,
        color: '#1E3A5F',
        textAlign: 'center',
        marginTop: 4,
        fontWeight: '600',
        fontStyle: 'italic',
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
