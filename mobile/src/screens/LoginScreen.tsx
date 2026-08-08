import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ImageBackground, Modal, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';

interface LoginScreenProps {
  onLoginSuccess: (token: string, user: any, isNewUser: boolean) => void;
  onNavigateRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onNavigateRegister }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot Password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetStep, setResetStep] = useState<'request' | 'submit'>('request');
  const [resetEmail, setResetEmail] = useState('');
  const [resetTokenInput, setResetTokenInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState('');
  const [resetError, setResetError] = useState('');

  const handleLogin = async () => {
    if (!identifier || !password) {
      setError('Please enter your Username and Password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', {
        identifier: identifier.trim(),
        password: password.trim(),
      });

      onLoginSuccess(res.accessToken, res.user, res.isNewUser);
    } catch (err: any) {
      setError(err.message || 'Login failed. Check your identifier and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPasswordReset = async () => {
    if (!resetEmail) {
      setResetError('Please enter your registered Email address.');
      return;
    }

    setResetLoading(true);
    setResetMsg('');
    setResetError('');

    try {
      const res = await api.post('/auth/password/reset-request', { email: resetEmail.trim() });
      setResetMsg(res.message || 'Reset code sent to your email.');
      setResetTokenInput('');
      setResetStep('submit');
    } catch (err: any) {
      setResetError(err.message || 'Failed to request password reset.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmitPasswordReset = async () => {
    if (!resetTokenInput.trim()) {
      setResetError('Please enter the reset code sent to your email.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setResetError('New password must be at least 6 characters.');
      return;
    }

    setResetLoading(true);
    setResetMsg('');
    setResetError('');

    try {
      const res = await api.post('/auth/password/reset', {
        token: resetTokenInput.trim(),
        newPassword,
      });
      Alert.alert('Success', 'Password reset successfully! You can now log in.');
      closeResetModal();
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password. Check your code.');
    } finally {
      setResetLoading(false);
    }
  };

  const closeResetModal = () => {
    setShowForgotModal(false);
    setResetStep('request');
    setResetMsg('');
    setResetError('');
  };

  return (
    <ImageBackground
      source={require('../../assets/waiting_room.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
        >
          {/* Header section */}
          <View style={styles.heroSection}>
            <View style={styles.logoRow}>
              <Image
                source={require('../../assets/logo.png')}
                style={{ width: 56, height: 56, resizeMode: 'contain', marginRight: 12, borderRadius: 10, backgroundColor: '#ffffff', padding: 4 }}
              />
              <Text style={styles.logoText}>Amar Ayurveda</Text>
            </View>
            <Text style={styles.subTitle}>Ayurvedic Healthcare Patient Console</Text>
          </View>

          {/* Form card */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Sign In</Text>

            <View style={styles.inputContainer}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={[styles.inputLabel, { marginBottom: 0 }]}>Username</Text>
                <Text style={{ fontSize: 11, color: '#718096', fontWeight: '600' }}>
                  (Mobile / Email / Username)
                </Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Mobile number, Email, or Username"
                placeholderTextColor="#999"
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.passwordRow}>
                <Text style={styles.inputLabel}>Password</Text>
                <TouchableOpacity onPress={() => setShowForgotModal(true)}>
                  <Text style={styles.forgotLink}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#999"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#718096"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Log In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={onNavigateRegister}>
                <Text style={styles.registerLink}>Register Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* Forgot Password Modal */}
        <Modal
          visible={showForgotModal}
          transparent
          animationType="fade"
          onRequestClose={closeResetModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Reset Password</Text>

              {resetMsg ? <Text style={styles.resetMsgText}>{resetMsg}</Text> : null}
              {resetError ? <Text style={styles.errorText}>{resetError}</Text> : null}

              {resetStep === 'request' ? (
                <>
                  <Text style={styles.modalSubtitle}>
                    Enter your registered email address. We will send a reset code to your inbox.
                  </Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter registered email"
                    placeholderTextColor="#999"
                    value={resetEmail}
                    onChangeText={setResetEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={{ marginBottom: 12 }}
                    onPress={() => setResetStep('submit')}
                  >
                    <Text style={{ fontSize: 12, color: '#1a4d36', fontWeight: '600' }}>
                      Already have a reset code? Tap here
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.modalButtonRow}>
                    <TouchableOpacity style={styles.modalCancelButton} onPress={closeResetModal}>
                      <Text style={styles.modalCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalSubmitButton}
                      onPress={handleRequestPasswordReset}
                      disabled={resetLoading}
                    >
                      {resetLoading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.modalSubmitText}>Send Code</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.modalSubtitle}>
                    Enter the reset code sent to your email along with your new password.
                  </Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="6-digit Reset Code (e.g. 482910)"
                    placeholderTextColor="#999"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={resetTokenInput}
                    onChangeText={setResetTokenInput}
                  />
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="New Password (min 6 chars)"
                      placeholderTextColor="#999"
                      secureTextEntry={!showResetPassword}
                      value={newPassword}
                      onChangeText={setNewPassword}
                    />
                    <TouchableOpacity
                      style={styles.eyeBtn}
                      onPress={() => setShowResetPassword(!showResetPassword)}
                    >
                      <Ionicons
                        name={showResetPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#718096"
                      />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={{ marginBottom: 12 }}
                    onPress={() => setResetStep('request')}
                  >
                    <Text style={{ fontSize: 12, color: '#718096' }}>
                      ← Need to resend email code?
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.modalButtonRow}>
                    <TouchableOpacity style={styles.modalCancelButton} onPress={closeResetModal}>
                      <Text style={styles.modalCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalSubmitButton}
                      onPress={handleSubmitPasswordReset}
                      disabled={resetLoading}
                    >
                      {resetLoading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.modalSubmitText}>Set New Password</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 30, 15, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoIcon: {
    fontSize: 28,
    marginRight: 8,
  },
  logoText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  subTitle: {
    fontSize: 14,
    color: '#e2e8f0',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  cardHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a365d',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorText: {
    backgroundColor: '#fff5f5',
    color: '#e53e3e',
    padding: 10,
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: 6,
  },
  passwordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2b6cb0',
  },
  input: {
    backgroundColor: '#f7fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#2d3748',
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingRight: 12,
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#2d3748',
  },
  eyeBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeText: {
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#1a4d36',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  registerText: {
    fontSize: 14,
    color: '#718096',
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a4d36',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a4d36',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#718096',
    marginBottom: 14,
  },
  resetMsgText: {
    backgroundColor: '#edf2f7',
    color: '#2d3748',
    padding: 10,
    borderRadius: 8,
    fontSize: 12,
    marginBottom: 12,
  },
  modalInput: {
    backgroundColor: '#f7fafc',
    borderWidth: 1,
    borderColor: '#cbd5e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
    color: '#2d3748',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e0',
  },
  modalCancelText: {
    color: '#4a5568',
    fontSize: 14,
  },
  modalSubmitButton: {
    backgroundColor: '#1a4d36',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalSubmitText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
