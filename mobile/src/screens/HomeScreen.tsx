import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { api } from '../api';
import { io } from 'socket.io-client';

interface HomeScreenProps {
  token: string | null;
  onNavigateToContact: () => void;
  onNavigateToProfile: () => void;
  onLogout: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ token, onNavigateToContact, onNavigateToProfile, onLogout }) => {
  const [profile, setProfile] = useState<any>(null);
  const [todayToken, setTodayToken] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchProfileAndToken = async () => {
    setError('');
    try {
      const prof = await api.get('/patients/profile', token);
      setProfile(prof);

      if (prof.status === 'active') {
        const tokRes = await api.get('/tokens/today', token);
        setTodayToken(tokRes.token);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch status updates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndToken();

    // Connect to WebSocket server
    const socketUrl = 'https://amar.vistarafabtech.com';
    const socket = io(socketUrl);

    socket.on('connect', () => {
      console.log('[Socket] Connected to Mobile Client Server');
    });

    socket.on('queue_updated', () => {
      console.log('[Socket] Received queue_updated event, syncing status...');
      fetchProfileAndToken();
    });

    // 60-second fallback polling interval
    const fallbackInterval = setInterval(fetchProfileAndToken, 60000);

    return () => {
      socket.disconnect();
      clearInterval(fallbackInterval);
    };
  }, []);

  const handleGenerateToken = async (serviceType: string) => {
    setTokenLoading(true);
    setError('');
    try {
      const res = await api.post('/tokens/generate', { serviceType }, token);
      await fetchProfileAndToken();
      Alert.alert('Token Generated', `Your token number is ${res.tokenNumber}`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate token.');
      Alert.alert('Timing / Day Restriction', err.message || 'Failed to generate token.');
    } finally {
      setTokenLoading(false);
    }
  };


  if (loading && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#213932" />
        <Text style={{ color: '#718096', marginTop: 12 }}>Syncing with clinic...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome,</Text>
          <Text style={styles.nameText}>{profile?.fullName || 'Patient'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* Account Info card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Patient ID</Text>
        <Text style={styles.cardValue}>
          {profile?.patientId || 'Pending Verification'}
        </Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Account Status:</Text>
          <Text style={[
            styles.statusText,
            profile?.status === 'active' ? styles.statusActive : styles.statusPending
          ]}>
            {profile?.status?.replace('_', ' ')?.toUpperCase() || 'PENDING'}
          </Text>
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Conditional verification banner */}
      {profile?.status !== 'active' ? (
        <View style={styles.verificationBanner}>
          <Text style={styles.bannerEmoji}>⏳</Text>
          <Text style={styles.verificationTitle}>Verification Pending</Text>
          <Text style={styles.verificationBody}>
            Your registration is under verification. You will be able to generate tokens once your Patient ID has been assigned by the clinic.
          </Text>
        </View>
      ) : (
        /* Token Panel */
        <View style={{ width: '100%', gap: 20 }}>
          {todayToken ? (
            /* Active token display */
            <View style={[styles.card, styles.tokenCard]}>
              <Text style={styles.tokenTitle}>TODAY'S TOKEN</Text>
              <Text style={styles.tokenNumber}>{todayToken.tokenNumber}</Text>

              <View style={styles.divider} />

              <View style={styles.grid}>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Serving</Text>
                  <Text style={styles.gridValue}>{todayToken.currentServing}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Ahead</Text>
                  <Text style={styles.gridValue}>{todayToken.patientsAhead} Patients</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Est. Wait</Text>
                  <Text style={styles.gridValue}>{todayToken.estimatedWaitingTimeMinutes} Mins</Text>
                </View>
              </View>

              <View style={styles.statusFooter}>
                <Text style={styles.footerLabel}>Token State:</Text>
                <Text style={[styles.badge, (styles as any)[`badge_${todayToken.status}`] || styles.badge_waiting]}>
                  {todayToken.status.toUpperCase()}
                </Text>
              </View>
            </View>
          ) : (
            /* Generate token choices */
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Generate Daily Token</Text>
              <Text style={styles.sectionSub}>Tokens are valid only for the current day and expire at 5:00 PM.</Text>

              <View style={{ gap: 12, marginTop: 16 }}>
                <TouchableOpacity
                  style={styles.genButton}
                  onPress={() => handleGenerateToken('medicine')}
                  disabled={tokenLoading}
                >
                  <Text style={styles.genButtonText}>Medicine Consultation</Text>
                  <Text style={styles.genButtonSub}>Available Monday to Saturday</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.genButton, { backgroundColor: '#f59e0b' }]}
                  onPress={() => handleGenerateToken('treatment')}
                  disabled={tokenLoading}
                >
                  <Text style={[styles.genButtonText, { color: '#0d1117' }]}>Treatment / Dressing</Text>
                  <Text style={[styles.genButtonSub, { color: '#27272a' }]}>Tuesday & Wednesday Only</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Navigation Options */}
      <View style={{ width: '100%', gap: 12, marginTop: 12 }}>
        <TouchableOpacity style={styles.navBtn} onPress={onNavigateToProfile}>
          <Text style={styles.navBtnText}>View My Profile Registry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={onNavigateToContact}>
          <Text style={styles.navBtnText}>View Clinic Timings & Contact</Text>
        </TouchableOpacity>
      </View>


    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#f7f6f2',
  },
  container: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f7f6f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  welcomeText: {
    color: '#718096',
    fontSize: 14,
  },
  nameText: {
    color: '#213932',
    fontSize: 22,
    fontWeight: '800',
  },
  logoutBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#f43f5e',
    borderRadius: 6,
  },
  logoutText: {
    color: '#f43f5e',
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    shadowColor: '#213932',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  cardLabel: {
    color: '#718096',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardValue: {
    color: '#213932',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    marginTop: 12,
    alignItems: 'center',
  },
  statusLabel: {
    color: '#718096',
    fontSize: 13,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  statusActive: {
    color: '#10b981',
  },
  statusPending: {
    color: '#f59e0b',
  },
  verificationBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
  },
  bannerEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  verificationTitle: {
    color: '#f59e0b',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  verificationBody: {
    color: '#718096',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  tokenCard: {
    borderColor: 'rgba(245, 158, 11, 0.35)',
    backgroundColor: '#fffdf0',
    alignItems: 'center',
  },
  tokenTitle: {
    color: '#b45309',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  tokenNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#92400e',
    marginVertical: 12,
    letterSpacing: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    width: '100%',
    marginVertical: 16,
  },
  grid: {
    flexDirection: 'row',
    width: '100%',
  },
  gridItem: {
    flex: 1,
    alignItems: 'center',
  },
  gridLabel: {
    color: '#718096',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  gridValue: {
    color: '#1a202c',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  statusFooter: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
    gap: 8,
  },
  footerLabel: {
    color: '#718096',
    fontSize: 13,
  },
  badge: {
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 8,
    fontSize: 11,
    fontWeight: '700',
    borderWidth: 1,
  },
  badge_waiting: { backgroundColor: 'rgba(33, 57, 50, 0.05)', borderColor: 'rgba(33, 57, 50, 0.1)', color: '#213932' },
  badge_in_progress: { backgroundColor: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' },
  badge_served: { backgroundColor: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' },
  badge_cancelled: { backgroundColor: 'rgba(244, 63, 94, 0.05)', borderColor: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e' },
  badge_expired: { backgroundColor: 'rgba(113, 128, 150, 0.05)', borderColor: 'rgba(113, 128, 150, 0.1)', color: '#718096' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#213932',
  },
  sectionSub: {
    color: '#718096',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  genButton: {
    backgroundColor: '#213932',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  genButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  genButtonSub: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    marginTop: 2,
  },
  navBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#213932',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 10,
    elevation: 1,
  },
  navBtnText: {
    color: '#213932',
    fontSize: 14,
    fontWeight: '700',
  },
  errorText: {
    color: '#f43f5e',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  simulatorBox: {
    backgroundColor: 'rgba(168, 85, 247, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.15)',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
  },
  simTitle: {
    color: '#a855f7',
    fontSize: 14,
    fontWeight: '700',
  },
  simText: {
    color: '#718096',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  simGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  simBtn: {
    flex: 1,
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.15)',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  simBtnText: {
    color: '#a855f7',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
});
