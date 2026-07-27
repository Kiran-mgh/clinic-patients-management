import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Platform, StatusBar as RNStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LoginScreen } from './src/screens/LoginScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ContactScreen } from './src/screens/ContactScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signUp'>('login');

  // Navigation State
  const [screen, setScreen] = useState<'register' | 'home' | 'contact' | 'profile'>('home');

  // Step 1: User creates account via /auth/register → gets JWT
  const handleSignUpSuccess = (newToken: string, user: any) => {
    setToken(newToken);
    // After account creation, always show the patient profile registration form
    setScreen('register');
  };

  // Step 2: User logs in → if isNewUser (no patient profile yet) → go to register profile
  const handleLoginSuccess = (newToken: string, user: any, isNewUser: boolean) => {
    setToken(newToken);
    if (isNewUser) {
      setScreen('register');
    } else {
      setScreen('home');
    }
  };

  const handleLogout = () => {
    setToken(null);
    setAuthMode('login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {!token ? (
        authMode === 'login' ? (
          <LoginScreen
            onLoginSuccess={handleLoginSuccess}
            onNavigateRegister={() => setAuthMode('signUp')}
          />
        ) : (
          <SignUpScreen
            onSignUpSuccess={handleSignUpSuccess}
            onGoBack={() => setAuthMode('login')}
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
    backgroundColor: '#0a2318',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
});
