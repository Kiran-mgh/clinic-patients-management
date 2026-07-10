import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { api } from '../api';

interface ProfileScreenProps {
  token: string | null;
  onGoBack: () => void;
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ token, onGoBack, onLogout }) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/patients/profile', token);
      setProfile(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#213932" />
        <Text style={{ color: '#718096', marginTop: 12 }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
        <TouchableOpacity style={styles.backBtn} onPress={onGoBack}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {profile && (
        <>
          {/* Card containing user details */}
          <View style={styles.card}>
            <View style={styles.avatarRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarLetter}>
                  {profile.fullName?.charAt(0).toUpperCase() || 'P'}
                </Text>
              </View>
              <View>
                <Text style={styles.profileName}>{profile.fullName}</Text>
                <Text style={styles.profileIdLabel}>
                  ID: <Text style={{ color: '#213932', fontWeight: '800' }}>{profile.patientId || 'Unassigned'}</Text>
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Profile Grid */}
            <View style={styles.infoList}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>MOBILE NUMBER</Text>
                <Text style={styles.infoValue}>{profile.user?.mobileNumber || 'N/A'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>GENDER</Text>
                <Text style={styles.infoValue}>{profile.gender}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>DATE OF BIRTH</Text>
                <Text style={styles.infoValue}>{profile.dateOfBirth}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>TOWN / RESIDENCE</Text>
                <Text style={styles.infoValue}>{profile.town}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>PROFESSION</Text>
                <Text style={styles.infoValue}>{profile.profession}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>BLOOD GROUP</Text>
                <Text style={styles.infoValue}>{profile.bloodGroup || 'Not Specified'}</Text>
              </View>

              {profile.email ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>EMAIL ADDRESS</Text>
                  <Text style={styles.infoValue}>{profile.email}</Text>
                </View>
              ) : null}

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>REGISTRATION STATUS</Text>
                <Text style={[
                  styles.statusValue,
                  profile.status === 'active' ? styles.statusActive : styles.statusPending
                ]}>
                  {profile.status?.replace('_', ' ')?.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* Logout Action */}
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
            <Text style={styles.logoutText}>Log Out from Device</Text>
          </TouchableOpacity>
        </>
      )}
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
  title: {
    color: '#213932',
    fontSize: 22,
    fontWeight: '800',
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
  },
  backText: {
    color: '#213932',
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#213932',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(33, 57, 50, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#213932',
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'Outfit',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#213932',
  },
  profileIdLabel: {
    fontSize: 13,
    color: '#718096',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 20,
  },
  infoList: {
    gap: 16,
  },
  infoRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#f7f6f2',
    paddingBottom: 10,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#718096',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a202c',
  },
  statusValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusActive: {
    color: '#10b981',
  },
  statusPending: {
    color: '#f59e0b',
  },
  logoutBtn: {
    borderWidth: 1,
    borderColor: '#f43f5e',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutText: {
    color: '#f43f5e',
    fontSize: 14,
    fontWeight: '700',
  },
  errorText: {
    color: '#f43f5e',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});
