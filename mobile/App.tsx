import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Platform, StatusBar as RNStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ContactScreen } from './src/screens/ContactScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

import registerRootComponent from 'expo/build/launch/registerRootComponent';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [screen, setScreen] = useState<'home' | 'contact' | 'profile'>('home');

  // New user registers → single screen handles /auth/register + /patients/register
  const handleRegistrationSuccess = (newToken: string) => {
    setToken(newToken);
    setShowRegister(false);
    setScreen('home');
  };

  // Existing user logs in
  const handleLoginSuccess = (newToken: string, user: any, isNewUser: boolean) => {
    setToken(newToken);
    setShowRegister(false);
    setScreen('home');
  };

  const handleLogout = () => {
    setToken(null);
    setShowRegister(false);
  };

  if (!token) {
    if (showRegister) {
      return (
        <SafeAreaView style={styles.container}>
          <StatusBar style="dark" />
          <RegisterScreen
            onRegistrationSuccess={handleRegistrationSuccess}
            onGoBack={() => setShowRegister(false)}
          />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onNavigateRegister={() => setShowRegister(true)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a2318',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
});

registerRootComponent(App);
