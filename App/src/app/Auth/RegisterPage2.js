import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Alert, 
  ScrollView,
  Modal,
  ActivityIndicator
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as FaceDetector from 'expo-face-detector';
import { MaterialIcons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/MaterialIcons';

const RegisterPage2 = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const [validIdFront, setValidIdFront] = useState(null);
    const [validIdBack, setValidIdBack] = useState(null);
    const [selfie, setSelfie] = useState(null);
    const [selfieWithId, setSelfieWithId] = useState(null);
    const [showIdFrontOptions, setShowIdFrontOptions] = useState(false);
    const [showIdBackOptions, setShowIdBackOptions] = useState(false);
    const [showSelfieOptions, setShowSelfieOptions] = useState(false);
    const [showSelfieWithIdOptions, setShowSelfieWithIdOptions] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (route.params?.selfieWithId) {
            setSelfieWithId(route.params.selfieWithId);
        }
        if (route.params?.selfie) {
            setSelfie(route.params.selfie);
        }
    }, [route.params]);

    const {
        firstName, middleName, lastName, email, phoneNumber, gender, civilStatus, placeOfBirth,
        address, governmentId, age, dateOfBirth,
    } = route.params;

    // Check if image contains a face (for selfies)
    const detectFace = async (imageUri) => {
        try {
            const faces = await FaceDetector.detectFacesAsync(imageUri, {
                mode: FaceDetector.FaceDetectorMode.fast,
                detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
                runClassifications: FaceDetector.FaceDetectorClassifications.none,
            });
            return faces.faces.length > 0;
        } catch (error) {
            console.error('Face detection error:', error);
            return false;
        }
    };

    const handleSelectImage = async (source, setImageFunction, isSelfie = false) => {
        const { status } = source === 'camera' 
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();
            
        if (status !== 'granted') {
            Alert.alert('Permission denied', `We need permission to access your ${source === 'camera' ? 'camera' : 'media library'}`);
            return;
        }

        try {
            setIsProcessing(true);
            const result = await (source === 'camera' 
                ? ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.7,
                })
                : ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.7,
                }));

            if (!result.canceled && result.assets && result.assets[0]) {
                const uri = result.assets[0].uri;
                
                // Validate selfie (must contain a face)
                if (isSelfie) {
                    const hasFace = await detectFace(uri);
                    if (!hasFace) {
                        Alert.alert('Invalid Selfie', 'No face detected. Please try again.');
                        return;
                    }
                }

                setImageFunction(uri);
            }
        } catch (error) {
            console.error('Error selecting image:', error);
            Alert.alert('Error', 'Failed to process image');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleNext = () => {
        if (!validIdFront || !validIdBack || !selfie || !selfieWithId) {
            Alert.alert('Incomplete Information', 'Please upload all required images');
            return;
        }

        navigation.navigate('CreatePassword', {
            ...route.params,
            validIdFront,
            validIdBack,
            selfie,
            selfieWithId
        });
    };

    const renderOptionsModal = (visible, setVisible, onCameraPress, onLibraryPress, title, showLibraryOption = true) => (
        <Modal
            transparent={true}
            visible={visible}
            onRequestClose={() => setVisible(false)}
            animationType="slide"
        >
            <View style={styles.modalBackground}>
                <View style={styles.optionsModal}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <View style={styles.optionButtonsContainer}>
                        <TouchableOpacity 
                            style={[styles.optionButton, !showLibraryOption && styles.fullWidthOption]}
                            onPress={() => {
                                setVisible(false);
                                onCameraPress();
                            }}
                        >
                            <Icon name="photo-camera" size={24} color="#2D5783" style={styles.optionIcon} />
                            <Text style={styles.optionText}>Take Photo</Text>
                        </TouchableOpacity>
                        {showLibraryOption && (
                            <TouchableOpacity 
                                style={styles.optionButton}
                                onPress={() => {
                                    setVisible(false);
                                    onLibraryPress();
                                }}
                            >
                                <Icon name="photo-library" size={24} color="#2D5783" style={styles.optionIcon} />
                                <Text style={styles.optionText}>Choose from Gallery</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity 
                        style={styles.cancelButton}
                        onPress={() => setVisible(false)}
                    >
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.container}>
                {isProcessing && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#2D5783" />
                        <Text style={styles.loadingText}>Verifying image...</Text>
                    </View>
                )}

                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={30} color="white" />
                </TouchableOpacity>

                <Text style={styles.title}>Complete Registration</Text>

                <View style={styles.section}>
                    <Text style={styles.label}>Valid ID Front</Text>
                    <TouchableOpacity 
                        onPress={() => setShowIdFrontOptions(true)} 
                        style={styles.imagePreviewContainer}
                    >
                        {validIdFront ? (
                            <Image source={{ uri: validIdFront }} style={styles.imagePreview} />
                        ) : (
                            <View style={styles.iconContainer}>
                                <Icon name="add" size={50} color="#2D5783" />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Valid ID Back</Text>
                    <TouchableOpacity 
                        onPress={() => setShowIdBackOptions(true)} 
                        style={styles.imagePreviewContainer}
                    >
                        {validIdBack ? (
                            <Image source={{ uri: validIdBack }} style={styles.imagePreview} />
                        ) : (
                            <View style={styles.iconContainer}>
                                <Icon name="add" size={50} color="#2D5783" />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Selfie</Text>
                    <TouchableOpacity 
                        onPress={() => setShowSelfieOptions(true)} 
                        style={styles.imagePreviewContainer}
                    >
                        {selfie ? (
                            <Image source={{ uri: selfie }} style={styles.imagePreview} />
                        ) : (
                            <View style={styles.iconContainer}>
                                <Icon name="photo-camera" size={50} color="#2D5783" />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Selfie with ID</Text>
                    <Text style={styles.subLabel}>Hold your ID next to your face</Text>
                    <TouchableOpacity 
                        onPress={() => setShowSelfieWithIdOptions(true)} 
                        style={styles.imagePreviewContainer}
                    >
                        {selfieWithId ? (
                            <Image source={{ uri: selfieWithId }} style={styles.imagePreview} />
                        ) : (
                            <View style={styles.iconContainer}>
                                <Icon name="photo-camera" size={50} color="#2D5783" />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        onPress={handleNext}
                        style={[
                            styles.registerButton,
                            (!validIdFront || !validIdBack || !selfie || !selfieWithId) && styles.disabledButton
                        ]}
                        disabled={!validIdFront || !validIdBack || !selfie || !selfieWithId}
                    >
                        <Text style={styles.registerButtonText}>Next</Text>
                    </TouchableOpacity>
                </View>

                {/* Option Modals */}
                {renderOptionsModal(
                    showIdFrontOptions, 
                    setShowIdFrontOptions, 
                    () => handleSelectImage('camera', setValidIdFront), 
                    () => handleSelectImage('library', setValidIdFront),
                    'Select ID Front Source',
                    true
                )}

                {renderOptionsModal(
                    showIdBackOptions, 
                    setShowIdBackOptions, 
                    () => handleSelectImage('camera', setValidIdBack), 
                    () => handleSelectImage('library', setValidIdBack),
                    'Select ID Back Source',
                    true
                )}

                {renderOptionsModal(
                    showSelfieOptions, 
                    setShowSelfieOptions, 
                    () => handleSelectImage('camera', setSelfie, true), 
                    () => handleSelectImage('library', setSelfie, true),
                    'Take Selfie',
                    false
                )}

                {renderOptionsModal(
                    showSelfieWithIdOptions, 
                    setShowSelfieWithIdOptions, 
                    () => handleSelectImage('camera', setSelfieWithId, true), 
                    () => handleSelectImage('library', setSelfieWithId, true),
                    'Take Selfie with ID',
                    false
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'space-between',
        padding: 15,
        paddingBottom: 30,
        backgroundColor: '#2C5282',
    },
    container: {
        flex: 1,
        justifyContent: 'space-between',
    },
    backButton: {
        marginBottom: 10,
        marginTop: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        color: 'white',
        marginBottom: 20,
    },
    section: {
        alignItems: 'center',
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        color: 'white',
        fontWeight: 'bold',
    },
    subLabel: {
        fontSize: 14,
        marginBottom: 8,
        color: 'white',
        fontStyle: 'italic',
    },
    imagePreviewContainer: {
        backgroundColor: '#F6F6F6',
        borderWidth: 2,
        borderColor: '#ccc',
        borderRadius: 8,
        width: 230,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    buttonContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    registerButton: {
        backgroundColor: '#4FE7AF',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 30,
        marginBottom: 40,
        alignItems: 'center',
        width: '80%',
    },
    disabledButton: {
        backgroundColor: '#cccccc',
    },
    registerButtonText: {
        color: 'black',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalBackground: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    optionsModal: {
        backgroundColor: 'white',
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        width: '100%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#2D5783',
    },
    optionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    optionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderWidth: 1,
        borderColor: '#2D5783',
        borderRadius: 8,
        marginHorizontal: 5,
    },
    fullWidthOption: {
        flex: 1,
        marginHorizontal: 0,
    },
    optionText: {
        fontSize: 16,
        marginLeft: 10,
        color: '#2D5783',
    },
    optionIcon: {
        marginRight: 5,
    },
    cancelButton: {
        padding: 15,
        marginTop: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 16,
        color: 'red',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingText: {
        color: 'white',
        marginTop: 10,
    },
});

export default RegisterPage2;