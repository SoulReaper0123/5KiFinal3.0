import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import CustomModal from '../../components/CustomModal';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { auth } from '../../firebaseConfig';
import { EmailAuthProvider } from 'firebase/auth';

const ChangePassword = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { email } = route.params;
  const user = auth.currentUser;

  const [currentPassword, setCurrentPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('error');

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasSpecialChar = /[!@#$%^&*_(),.?":{}|<>]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);

    return {
      isValid: minLength && hasSpecialChar && hasNumber && hasUpper && hasLower,
      requirements: {
        minLength,
        hasSpecialChar,
        hasNumber,
        hasUpper,
        hasLower,
      },
    };
  };

  const passwordValidation = validatePassword(newPassword);
  const passwordsMatch = newPassword === confirmPassword;
  const isFormValid = currentPassword && 
                     newPassword && 
                     confirmPassword && 
                     passwordValidation.isValid && 
                     passwordsMatch;

   const handleChangePassword = async () => {
  if (!isFormValid) return;

  setLoading(true);
  try {
    // Verify current password
    const credential = EmailAuthProvider.credential(email, currentPassword);
    await auth.currentUser.reauthenticateWithCredential(credential);
    
    // Update password
    await auth.currentUser.updatePassword(newPassword);
    
    setAlertMessage('Password changed successfully!');
    setAlertType('success');
    setAlertModalVisible(true);
  } catch (error) {
    console.error('Password change error:', error);
    
    let errorMessage = 'Failed to change password. Please try again.';
    switch (error.code) {
      case 'auth/wrong-password':
        errorMessage = 'The current password is incorrect.';
        break;
      case 'auth/weak-password':
        errorMessage = 'The new password is too weak. Please use a stronger password.';
        break;
      case 'auth/requires-recent-login':
        errorMessage = 'This operation requires recent authentication. Please log out and log back in.';
        break;
      default:
        errorMessage = 'An error occurred. Please try again.';
    }
    
    setAlertMessage(errorMessage);
    setAlertType('error');
    setAlertModalVisible(true);
  } finally {
    setLoading(false);
  }
};
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={30} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Change Password</Text>
        </View>

        <View style={styles.formContainer}>
          {/* Current Password Field */}
          <Text style={styles.label}>
            Current Password <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter current password"
              secureTextEntry={!showCurrentPassword}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              <Ionicons
                name={showCurrentPassword ? 'eye-off' : 'eye'}
                size={24}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          {/* New Password Field */}
          <Text style={styles.label}>
            New Password <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter new password"
              secureTextEntry={!showNewPassword}
              value={newPassword}
              onChangeText={setNewPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={() => setShowNewPassword(!showNewPassword)}
            >
              <Ionicons
                name={showNewPassword ? 'eye-off' : 'eye'}
                size={24}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          {/* Password Requirements */}
          <View style={styles.requirementsContainer}>
            <View style={styles.requirementItem}>
              <MaterialIcons
                name={passwordValidation.requirements.minLength ? 'check-circle' : 'radio-button-unchecked'}
                size={20}
                color={passwordValidation.requirements.minLength ? 'green' : 'black'}
              />
              <Text style={[
                styles.requirementText,
                passwordValidation.requirements.minLength && styles.requirementMet
              ]}>
                Minimum of 8 characters
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <MaterialIcons
                name={passwordValidation.requirements.hasSpecialChar ? 'check-circle' : 'radio-button-unchecked'}
                size={20}
                color={passwordValidation.requirements.hasSpecialChar ? 'green' : 'black'}
              />
              <Text style={[
                styles.requirementText,
                passwordValidation.requirements.hasSpecialChar && styles.requirementMet
              ]}>
                At least one special character (including _)
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <MaterialIcons
                name={passwordValidation.requirements.hasNumber ? 'check-circle' : 'radio-button-unchecked'}
                size={20}
                color={passwordValidation.requirements.hasNumber ? 'green' : 'black'}
              />
              <Text style={[
                styles.requirementText,
                passwordValidation.requirements.hasNumber && styles.requirementMet
              ]}>
                At least one numeric digit
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <MaterialIcons
                name={passwordValidation.requirements.hasUpper && passwordValidation.requirements.hasLower ? 'check-circle' : 'radio-button-unchecked'}
                size={20}
                color={passwordValidation.requirements.hasUpper && passwordValidation.requirements.hasLower ? 'green' : 'black'}
              />
              <Text style={[
                styles.requirementText,
                passwordValidation.requirements.hasUpper && passwordValidation.requirements.hasLower && styles.requirementMet
              ]}>
                Includes both uppercase and lowercase letters
              </Text>
            </View>
          </View>

          {/* Confirm Password Field */}
          <Text style={styles.label}>
            Confirm Password <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm new password"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off' : 'eye'}
                size={24}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          {/* Password Match Indicator */}
          {confirmPassword.length > 0 && (
            <View style={styles.requirementItem}>
              <MaterialIcons
                name={passwordsMatch ? 'check-circle' : 'radio-button-unchecked'}
                size={20}
                color={passwordsMatch ? 'green' : 'black'}
              />
              <Text style={[
                styles.requirementText,
                passwordsMatch && styles.requirementMet
              ]}>
                Passwords match
              </Text>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleChangePassword}
            style={[styles.changeButton, !isFormValid && styles.disabledButton]}
            disabled={!isFormValid || loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.changeButtonText}>Next</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Custom Alert Modal */}
      <CustomModal
        visible={alertModalVisible}
        onClose={() => {
          setAlertModalVisible(false);
          if (alertType === 'success') {
            navigation.goBack();
          }
        }}
        message={alertMessage}
        type={alertType}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D5783',
  },
  scrollContainer: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 30,
  },
  backButton: {
    marginRight: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 2,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: 'black',
  },
  required: {
    color: 'red',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    padding: 10,
    color: 'black',
  },
  eyeIcon: {
    padding: 10,
  },
  requirementsContainer: {
    marginVertical: 15,
    padding: 10,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  requirementText: {
    marginLeft: 5,
    color: 'black',
  },
  requirementMet: {
    color: 'green',
  },
  changeButton: {
    backgroundColor: '#4FE7AF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 30,
    alignItems: 'center',
    marginTop: 20,
    width: '50%',
    alignSelf: 'center',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  changeButtonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default ChangePassword;