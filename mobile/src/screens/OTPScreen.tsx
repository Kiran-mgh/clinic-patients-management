import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ImageBackground } from 'react-native';
import { api } from '../api';

interface OTPScreenProps {
  mobileNumber: string;
  testOtp?: string;
  idToken?: string;
  onOtpVerified: (token: string, user: any, isNewUser: boolean) => void;
  onGoBack: () => void;
}

export const OTPScreen: React.FC<OTPScreenProps> = ({ mobileNumber, testOtp, idToken, onOtpVerified, onGoBack }) => {
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerifyOtp = async () => {
    if (!idToken && (!otpCode || otpCode.length !== 6)) {
      setError('Please enter a valid 6-digit code.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const endpoint = idToken ? '/auth/firebase/login' : '/auth/otp/verify';
      const payload = idToken ? { idToken, isStaff: false } : { mobileNumber, otpCode };
      const res = await api.post(endpoint, payload);
      onOtpVerified(res.accessToken, res.user, res.isNewUser);
    } catch (err: any) {
      setError(err.message || 'OTP verification failed. Try again.');
    } finally {
      setLoading(false);
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
              <Text style={styles.logoIcon}>🔐</Text>
              <Text style={styles.logoText}>Amar Hospital Security</Text>
            </View>
            <Text style={styles.heroTitle}>Verify Access</Text>
            <Text style={styles.heroDesc}>
              A 6-digit OTP code was generated for security purposes. Input the code to sign in.
            </Text>
          </View>

          {/* Verification Card */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>OTP CONFIRMATION</Text>
            <Text style={styles.cardTitle}>Enter 6-digit code</Text>
            <Text style={styles.cardSub}>Code sent to {mobileNumber}.</Text>

            {testOtp ? (
              <View style={styles.testOtpBanner}>
                <Text style={styles.testOtpText}>
                  Test OTP Code: <Text style={styles.testOtpCode}>{testOtp}</Text>
                </Text>
              </View>
            ) : null}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.formGroup}>
              <Text style={styles.label}>OTP CODE</Text>
              <TextInput
                style={styles.input}
                placeholder="000000"
                placeholderTextColor="#a0aec0"
                keyboardType="number-pad"
                maxLength={6}
                value={otpCode}
                onChangeText={(text) => { setOtpCode(text); setError(''); }}
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleVerifyOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Confirm & Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={onGoBack}
              disabled={loading}
            >
              <Text style={styles.backButtonText}>Use Different Mobile Number</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
    backgroundColor: 'rgba(33, 57, 50, 0.65)',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  heroSection: {
    width: '100%',
    marginTop: 20,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  logoIcon: {
    fontSize: 18,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 38,
    marginBottom: 12,
  },
  heroDesc: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    fontWeight: '400',
    maxWidth: '90%',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  cardHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#718096',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#213932',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 12,
    color: '#718096',
    lineHeight: 16,
    marginBottom: 20,
  },
  testOtpBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 20,
    width: '100%',
  },
  testOtpText: {
    color: '#10b981',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
  },
  testOtpCode: {
    fontWeight: '800',
    fontSize: 14,
  },
  formGroup: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    color: '#718096',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fcfbfa',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#1a202c',
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 4,
    fontWeight: '700',
  },
  button: {
    backgroundColor: '#213932',
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  backButton: {
    marginTop: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#718096',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  errorText: {
    color: '#f43f5e',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
});
