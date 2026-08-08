import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
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

  // Edit Profile States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editGender, setEditGender] = useState('Male');
  const [editDateOfBirth, setEditDateOfBirth] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [editTown, setEditTown] = useState('');
  const [editProfession, setEditProfession] = useState('');
  const [editBloodGroup, setEditBloodGroup] = useState('');
  const [editPreviousSurgeryDetails, setEditPreviousSurgeryDetails] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const formatDobText = (text: string): string => {
    let cleaned = text.replace(/\D/g, '').slice(0, 8);
    if (cleaned.length > 4) return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4) + '/' + cleaned.slice(4, 8);
    if (cleaned.length > 2) return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    return cleaned;
  };

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

  const openEditModal = () => {
    if (!profile) return;
    setEditFullName(profile.fullName || '');
    setEditGender(profile.gender || 'Male');

    // Format DOB to DD/MM/YYYY
    let dobFormatted = profile.dateOfBirth || '';
    if (/^\d{4}-\d{2}-\d{2}/.test(dobFormatted)) {
      const [y, m, d] = dobFormatted.split('T')[0].split('-');
      dobFormatted = `${d}/${m}/${y}`;
    }
    setEditDateOfBirth(dobFormatted);
    setEditEmail(profile.email || '');
    setEmailOtpCode('');
    setEmailOtpSent(false);
    setEmailVerified(false);

    setEditTown(profile.town || '');
    setEditProfession(profile.profession || '');
    setEditBloodGroup(profile.bloodGroup || '');
    setEditPreviousSurgeryDetails(profile.previousSurgeryDetails || '');
    setShowEditModal(true);
  };

  const handleRequestEmailOtp = async () => {
    if (!editEmail.trim() || !editEmail.includes('@')) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }
    setSendingOtp(true);
    try {
      const res = await api.post('/patients/request-email-otp', { email: editEmail.trim() }, token);
      setEmailOtpSent(true);
      Alert.alert(
        'OTP Sent',
        `${res.message || 'Verification OTP sent to your new email.'}\n\n[Dev OTP Code: ${res.otpCode || '123456'}]`
      );
    } catch (err: any) {
      Alert.alert('OTP Request Failed', err.message || 'Could not send verification OTP.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtpCode.trim() || emailOtpCode.trim().length !== 6) {
      Alert.alert('Validation Error', 'Please enter the 6-digit OTP code.');
      return;
    }
    setVerifyingOtp(true);
    try {
      await api.post('/patients/verify-email-otp', { email: editEmail.trim(), otpCode: emailOtpCode.trim() }, token);
      setEmailVerified(true);
      Alert.alert('Success', 'Your new email address has been verified successfully!');
    } catch (err: any) {
      Alert.alert('Verification Failed', err.message || 'Invalid or expired OTP code.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editFullName.trim()) {
      Alert.alert('Validation Error', 'Full Name is required.');
      return;
    }
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(editDateOfBirth.trim())) {
      Alert.alert('Validation Error', 'Date of Birth must match DD/MM/YYYY format.');
      return;
    }
    if (!editTown.trim()) {
      Alert.alert('Validation Error', 'City / Address is required.');
      return;
    }

    const emailChanged = editEmail.trim().toLowerCase() !== (profile?.email || '').toLowerCase();
    if (emailChanged && !emailVerified) {
      Alert.alert('Email Verification Required', 'Please verify your new email address via OTP before saving.');
      return;
    }

    setSavingProfile(true);
    try {
      await api.put('/patients/profile', {
        fullName: editFullName.trim(),
        gender: editGender,
        dateOfBirth: editDateOfBirth.trim(),
        email: editEmail.trim() || undefined,
        otpCode: emailChanged ? emailOtpCode.trim() : undefined,
        town: editTown.trim(),
        profession: editProfession.trim() || undefined,
        bloodGroup: editBloodGroup || undefined,
        previousSurgeryDetails: editPreviousSurgeryDetails.trim() || undefined,
      }, token);

      await fetchProfile();
      setShowEditModal(false);
      Alert.alert('Profile Updated', 'Your profile details have been updated successfully!');
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Failed to update profile details.');
    } finally {
      setSavingProfile(false);
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
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

              <TouchableOpacity
                style={{ backgroundColor: '#f0fdf4', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#bbf7d0' }}
                onPress={openEditModal}
              >
                <Text style={{ color: '#166534', fontWeight: '700', fontSize: 13 }}>✏️ Edit Profile</Text>
              </TouchableOpacity>
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
                <Text style={styles.infoValue}>{profile.profession || 'N/A'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>BLOOD GROUP</Text>
                <Text style={styles.infoValue}>{profile.bloodGroup || 'Not Specified'}</Text>
              </View>

              {profile.previousSurgeryDetails ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>SURGERY HISTORY</Text>
                  <Text style={styles.infoValue}>{profile.previousSurgeryDetails}</Text>
                </View>
              ) : null}

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

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent={true} onRequestClose={() => setShowEditModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 500, maxHeight: '85%', backgroundColor: '#ffffff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#213932', marginBottom: 4 }}>✏️ EDIT PROFILE DETAILS</Text>
            <Text style={{ fontSize: 12, color: '#718096', marginBottom: 16 }}>Update your details anytime. Changes reflect immediately across clinic systems.</Text>

            <ScrollView contentContainerStyle={{ gap: 14 }}>
              <View>
                <Text style={styles.modalLabel}>FULL NAME *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editFullName}
                  onChangeText={setEditFullName}
                  placeholder="Your Full Name"
                  placeholderTextColor="#a0aec0"
                />
              </View>

              <View>
                <Text style={styles.modalLabel}>GENDER *</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  {['Male', 'Female', 'Other'].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.genderChip, editGender === g && styles.genderChipActive]}
                      onPress={() => setEditGender(g)}
                    >
                      <Text style={[styles.genderChipText, editGender === g && styles.genderChipTextActive]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View>
                <Text style={styles.modalLabel}>DATE OF BIRTH (DD/MM/YYYY) *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editDateOfBirth}
                  onChangeText={(txt) => setEditDateOfBirth(formatDobText(txt))}
                  placeholder="DD/MM/YYYY e.g. 15/08/1990"
                  placeholderTextColor="#a0aec0"
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>

              <View>
                <Text style={styles.modalLabel}>EMAIL ADDRESS (OPTIONAL)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editEmail}
                  onChangeText={(txt) => {
                    setEditEmail(txt);
                    setEmailOtpSent(false);
                    setEmailVerified(false);
                  }}
                  placeholder="example@gmail.com"
                  placeholderTextColor="#a0aec0"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Conditional Email OTP Verification Block */}
              {editEmail.trim() && editEmail.trim().toLowerCase() !== (profile?.email || '').toLowerCase() && (
                <View style={{ backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 12, padding: 12, gap: 10 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#166534' }}>
                    📧 EMAIL OTP VERIFICATION REQUIRED
                  </Text>
                  <Text style={{ fontSize: 11, color: '#15803d', lineHeight: 15 }}>
                    Changing your email address requires OTP verification to confirm ownership.
                  </Text>

                  {!emailVerified ? (
                    <>
                      <TouchableOpacity
                        style={{
                          backgroundColor: '#213932',
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderRadius: 8,
                          alignItems: 'center',
                          opacity: sendingOtp ? 0.7 : 1
                        }}
                        onPress={handleRequestEmailOtp}
                        disabled={sendingOtp}
                      >
                        <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 12 }}>
                          {sendingOtp ? 'Sending OTP...' : 'Send OTP to New Email'}
                        </Text>
                      </TouchableOpacity>

                      {emailOtpSent && (
                        <View style={{ gap: 8, marginTop: 4 }}>
                          <TextInput
                            style={[styles.modalInput, { height: 40, fontSize: 16, fontWeight: '800', letterSpacing: 3, textAlign: 'center' }]}
                            value={emailOtpCode}
                            onChangeText={setEmailOtpCode}
                            placeholder="Enter 6-digit OTP"
                            placeholderTextColor="#a0aec0"
                            keyboardType="numeric"
                            maxLength={6}
                          />
                          <TouchableOpacity
                            style={{
                              backgroundColor: '#166534',
                              paddingVertical: 8,
                              paddingHorizontal: 12,
                              borderRadius: 8,
                              alignItems: 'center',
                              opacity: verifyingOtp ? 0.7 : 1
                            }}
                            onPress={handleVerifyEmailOtp}
                            disabled={verifyingOtp}
                          >
                            <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 12 }}>
                              {verifyingOtp ? 'Verifying...' : 'Verify Email OTP'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </>
                  ) : (
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#15803d' }}>
                      ✓ Email Verified via OTP
                    </Text>
                  )}
                </View>
              )}

              <View>
                <Text style={styles.modalLabel}>CITY / RESIDENCE *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editTown}
                  onChangeText={setEditTown}
                  placeholder="e.g. Bangalore"
                  placeholderTextColor="#a0aec0"
                />
              </View>

              <View>
                <Text style={styles.modalLabel}>PROFESSION (OPTIONAL)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editProfession}
                  onChangeText={setEditProfession}
                  placeholder="e.g. Teacher, Engineer"
                  placeholderTextColor="#a0aec0"
                />
              </View>

              <View>
                <Text style={styles.modalLabel}>BLOOD GROUP (OPTIONAL)</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                    <TouchableOpacity
                      key={bg}
                      style={[styles.bloodChip, editBloodGroup === bg && styles.bloodChipActive]}
                      onPress={() => setEditBloodGroup(bg)}
                    >
                      <Text style={[styles.bloodChipText, editBloodGroup === bg && styles.bloodChipTextActive]}>{bg}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View>
                <Text style={styles.modalLabel}>PREVIOUS SURGERY / MEDICAL DETAILS (OPTIONAL)</Text>
                <TextInput
                  style={[styles.modalInput, { height: 60, textAlignVertical: 'top' }]}
                  value={editPreviousSurgeryDetails}
                  onChangeText={setEditPreviousSurgeryDetails}
                  placeholder="e.g. Piles surgery 2 years ago"
                  placeholderTextColor="#a0aec0"
                  multiline={true}
                />
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 18, borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 14 }}>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: '#f1f5f9', flex: 1 }]}
                onPress={() => setShowEditModal(false)}
                disabled={savingProfile}
              >
                <Text style={{ color: '#475569', fontWeight: '700', textAlign: 'center' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: '#213932', flex: 1 }]}
                onPress={handleSaveProfile}
                disabled={savingProfile}
              >
                <Text style={{ color: '#ffffff', fontWeight: '700', textAlign: 'center' }}>
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    flex: 1,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(33, 57, 50, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#213932',
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'Outfit',
  },
  profileName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#213932',
  },
  profileIdLabel: {
    fontSize: 13,
    color: '#718096',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 18,
  },
  infoList: {
    gap: 14,
  },
  infoRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#f7f6f2',
    paddingBottom: 8,
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
  modalLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#213932',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1e293b',
  },
  genderChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  genderChipActive: {
    backgroundColor: '#213932',
    borderColor: '#213932',
  },
  genderChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  genderChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  bloodChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  bloodChipActive: {
    backgroundColor: '#213932',
    borderColor: '#213932',
  },
  bloodChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  bloodChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  btn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
});
