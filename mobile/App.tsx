import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Platform, StatusBar as RNStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LoginScreen } from './src/screens/LoginScreen';
import { OTPScreen } from './src/screens/OTPScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ContactScreen } from './src/screens/ContactScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  const [testOtp, setTestOtp] = useState<string | undefined>(undefined);
  const [verificationId, setVerificationId] = useState<string | undefined>(undefined);
  
  // Navigation State
  const [screen, setScreen] = useState<'register' | 'home' | 'contact' | 'profile'>('home');

  const handleOtpRequested = (mobile: string, otp?: string, vId?: string) => {
    setMobileNumber(mobile);
    setTestOtp(otp);
    setVerificationId(vId);
    setOtpSent(true);
  };

  const handleOtpVerified = (newToken: string, user: any, isNewUser: boolean) => {
    setToken(newToken);
    if (isNewUser) {
      setScreen('register');
    } else {
      setScreen('home');
    }
  };

  const handleLogout = () => {
    setToken(null);
    setOtpSent(false);
    setMobileNumber('');
    setTestOtp(undefined);
    setVerificationId(undefined);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {!token ? (
        !otpSent ? (
          <LoginScreen onOtpRequested={handleOtpRequested} />
        ) : (
          <OTPScreen
            mobileNumber={mobileNumber}
            testOtp={testOtp}
            verificationId={verificationId}
            onOtpVerified={handleOtpVerified}
            onGoBack={() => setOtpSent(false)}
          />
        )
      ) : (
        <>
          {screen === 'register' && (
            <RegisterScreen
              token={token}
              onRegistrationSuccess={() => setScreen('home')}
              onGoBack={handleLogout}
            />
          )}
          {screen === 'home' && (
            <HomeScreen
              token={token}
              onNavigateToContact={() => setScreen('contact')}
              onNavigateToProfile={() => setScreen('profile')}
              onLogout={handleLogout}
            />
          )}
          {screen === 'contact' && (
            <ContactScreen onGoBack={() => setScreen('home')} />
          )}
          {screen === 'profile' && (
            <ProfileScreen
              token={token}
              onGoBack={() => setScreen('home')}
              onLogout={handleLogout}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
});
