import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ImageBackground } from 'react-native';
import { api } from '../api';

interface LoginScreenProps {
  onOtpRequested: (mobile: string, testOtp?: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onOtpRequested }) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestOtp = async () => {
    if (!mobileNumber) {
      setError('Please enter your mobile number.');
      return;
    }

    const trimmed = mobileNumber.trim();
    const isBypass = trimmed === '+919999999999';
    const isTenDigits = /^\d{10}$/.test(trimmed);

    if (!isBypass && !isTenDigits) {
      setError('Mobile number must be exactly 10 digits.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/otp/request', { mobileNumber: trimmed });
      onOtpRequested(trimmed, res.otpCode);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please check your network.');
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
      {/* Gradient overlay simulation */}
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          {/* Header section with brand and typography matching portal */}
          <View style={styles.heroSection}>
            <View style={styles.logoRow}>
              <Text style={styles.logoIcon}>🏥</Text>
              <Text style={styles.logoText}>Amar Hospital</Text>
            </View>
            <Text style={styles.heroTitle}>Skip the wait.{"\n"}Save the chair.</Text>
            <Text style={styles.heroDesc}>
              Generate your queue token in seconds. No paperwork, no crowds — just walk in when it's your turn.
            </Text>
          </View>

          {/* White login card floating at bottom */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>PATIENT LOGIN</Text>
            <Text style={styles.cardTitle}>Get today's token</Text>
            <Text style={styles.cardSub}>Use your mobile number to receive access OTP.</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.formGroup}>
              <Text style={styles.label}>MOBILE NUMBER (PASSWORD)</Text>
              <TextInput
                style={styles.input}
                placeholder="+91 98765 43210"
                placeholderTextColor="#a0aec0"
                keyboardType="phone-pad"
                value={mobileNumber}
                onChangeText={(text) => { setMobileNumber(text.replace(/[^0-9+]/g, '')); setError(''); }}
                maxLength={mobileNumber.startsWith('+') ? 13 : 10}
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleRequestOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Login & Generate Token</Text>
              )}
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
    backgroundColor: 'rgba(33, 57, 50, 0.65)', // Forest green shading matching web portal
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
    fontSize: 20,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 16,
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
    fontSize: 15,
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
  errorText: {
    color: '#f43f5e',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
});
