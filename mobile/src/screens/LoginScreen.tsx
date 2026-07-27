import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ImageBackground, Modal } from 'react-native';
import { api } from '../api';

interface LoginScreenProps {
  onLoginSuccess: (token: string, user: any, isNewUser: boolean) => void;
  onNavigateRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onNavigateRegister }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot Password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

  const handleLogin = async () => {
    if (!identifier || !password) {
      setError('Please enter your Identifier (Mobile / Email / Name) and Password.');
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
      setResetMsg('Please enter your mandatory registered Email address.');
      return;
    }

    setResetLoading(true);
    setResetMsg('');

    try {
      const res = await api.post('/auth/password/reset-request', { email: resetEmail.trim() });
      setResetMsg(res.message || 'Reset link requested successfully.');
    } catch (err: any) {
      setResetMsg(err.message || 'Failed to request password reset.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/waiting_room.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          {/* Header section */}
          <View style={styles.heroSection}>
            <View style={styles.logoRow}>
              <Text style={styles.logoIcon}>🏥</Text>
              <Text style={styles.logoText}>Amar Hospital</Text>
            </View>
            <Text style={styles.subTitle}>Ayurvedic Healthcare Patient Console</Text>
          </View>

          {/* Form card */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Sign In</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Identifier (Mobile / Email / Username)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 9035706668 or patient@gmail.com"
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
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#999"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
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
          onRequestClose={() => setShowForgotModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Reset Password</Text>
              <Text style={styles.modalSubtitle}>
                Enter your registered Email address to receive a password reset token.
              </Text>

              {resetMsg ? <Text style={styles.resetMsgText}>{resetMsg}</Text> : null}

              <TextInput
                style={styles.modalInput}
                placeholder="Enter mandatory registered email"
                placeholderTextColor="#999"
                value={resetEmail}
                onChangeText={setResetEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => { setShowForgotModal(false); setResetMsg(''); }}
                >
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
                    <Text style={styles.modalSubmitText}>Request Reset</Text>
                  )}
                </TouchableOpacity>
              </View>
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
    marginBottom: 16,
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
