import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Platform, StatusBar as RNStatusBar, Text, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ContactScreen } from './src/screens/ContactScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { registerForPushNotificationsAsync } from './src/services/notificationService';

import registerRootComponent from 'expo/build/launch/registerRootComponent';

// Set a safe maximum font scaling ceiling to prevent display size/large font overflows
if ((Text as any).defaultProps == null) (Text as any).defaultProps = {};
(Text as any).defaultProps.maxFontSizeMultiplier = 1.18;

if ((TextInput as any).defaultProps == null) (TextInput as any).defaultProps = {};
(TextInput as any).defaultProps.maxFontSizeMultiplier = 1.18;

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [screen, setScreen] = useState<'home' | 'contact' | 'profile'>('home');

  useEffect(() => {
    if (token) {
      registerForPushNotificationsAsync(token).catch(() => {});
    }

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('[PUSH TAP] User tapped notification:', response.notification.request.content.data);
      setScreen('home');
    });

    return () => {
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, [token]);

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
        <ContactScreen token={token} onGoBack={() => setScreen('home')} />
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
