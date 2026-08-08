import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image, Modal, TextInput, Linking } from 'react-native';
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
  const [tokenConfig, setTokenConfig] = useState<any>(null);

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

      await fetchProfileAndToken();
      setShowEditModal(false);
      Alert.alert('Profile Updated', 'Your profile details have been updated successfully!');
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Failed to update profile details.');
    } finally {
      setSavingProfile(false);
    }
  };

  const fetchProfileAndToken = async () => {
    setError('');
    try {
      const prof = await api.get('/patients/profile', token);
      setProfile(prof);

      const cfg = await api.get('/settings/tokens', token);
      setTokenConfig(cfg);

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

    // 15-second fallback polling interval
    const fallbackInterval = setInterval(fetchProfileAndToken, 15000);

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
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Image
            source={require('../../assets/logo.png')}
            style={{ width: 48, height: 48, resizeMode: 'contain', borderRadius: 8 }}
          />
          <View>
            <Text style={styles.welcomeText}>Welcome,</Text>
            <Text style={styles.nameText}>{profile?.fullName || 'Patient'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* Account Info card */}
      <View style={styles.card}>
        <View>
          <Text style={styles.cardLabel}>Patient ID</Text>
          <Text style={styles.cardValue}>
            {profile?.patientId || 'Pending Verification'}
          </Text>
        </View>
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

              {/* Missed Token Warning Banner */}
              {todayToken.isMissed ? (
                <View style={{ backgroundColor: '#fffbe6', borderWidth: 1, borderColor: '#ffe58f', borderRadius: 12, padding: 14, marginVertical: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#d46b08', marginBottom: 4 }}>
                    ⚠️ MISSED TOKEN ALERT
                  </Text>
                  <Text style={{ fontSize: 13, color: '#ad4e00', lineHeight: 18 }}>
                    {todayToken.missedMessage || `You missed your turn! The doctor is currently serving ${todayToken.currentServing}. Please report to the doctor right after Token ${todayToken.lastTokenNumber}.`}
                  </Text>
                </View>
              ) : null}

              <View style={styles.divider} />

              <View style={styles.grid}>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>SERVING</Text>
                  <Text style={styles.gridValue}>{todayToken.currentServing}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>TOTAL TOKENS</Text>
                  <Text style={styles.gridValue}>{todayToken.lastTokenNumber || '1'}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>AHEAD / WAIT</Text>
                  <Text style={styles.gridValue}>{todayToken.isMissed ? 'After Last' : `${todayToken.patientsAhead} Patients`}</Text>
                </View>
              </View>

              <View style={styles.statusFooter}>
                <Text style={styles.footerLabel}>Token State:</Text>
                <Text style={[styles.badge, todayToken.isMissed ? { backgroundColor: '#fffbe6', color: '#d46b08', borderColor: '#ffe58f' } : ((styles as any)[`badge_${todayToken.status}`] || styles.badge_waiting)]}>
                  {todayToken.isMissed ? 'MISSED (WAIT AFTER LAST TOKEN)' : todayToken.status.toUpperCase()}
                </Text>
              </View>
            </View>
          ) : (
            /* Generate token choices */
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Generate Daily Token</Text>
              <Text style={styles.sectionSub}>Tokens are valid only for the current day and expire at 5:00 PM.</Text>

              <View style={{ gap: 12, marginTop: 16 }}>
                {(() => {
                  const now = new Date();
                  const todayDay = now.getDay(); // 0: Sun, 1: Mon, ...
                  const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

                  const isGloballyEnabled = tokenConfig ? tokenConfig.enabled : true;
                  const isSaturday = todayDay === 6;
                  const startTimeStr = isSaturday
                    ? (tokenConfig?.saturdayStartTime || '07:30')
                    : (tokenConfig?.startTime || '07:00');
                  const endTimeStr = isSaturday
                    ? (tokenConfig?.saturdayEndTime || '13:00')
                    : (tokenConfig?.endTime || '15:30');

                  const medAllowedDays = tokenConfig?.medicineAllowedDays || [1, 2, 3, 4, 5, 6];
                  const treatAllowedDays = tokenConfig?.treatmentAllowedDays || [2, 3, 4];

                  const isMedicineDay = medAllowedDays.includes(todayDay);
                  const isTreatmentDay = treatAllowedDays.includes(todayDay);

                  const medDayText = medAllowedDays.map(d => DAY_SHORT[d]).join(', ');
                  const treatDayText = treatAllowedDays.map(d => DAY_SHORT[d]).join(', ');

                  if (!isGloballyEnabled) {
                    return (
                      <View style={{ backgroundColor: '#fff5f5', borderWidth: 1, borderColor: '#feb2b2', borderRadius: 12, padding: 16 }}>
                        <Text style={{ fontSize: 15, fontWeight: '800', color: '#c53030', marginBottom: 4 }}>
                          ⏸️ Token Generation Paused
                        </Text>
                        <Text style={{ fontSize: 13, color: '#9b2c2c', lineHeight: 18 }}>
                          Token generation is currently paused by the clinic doctor. Please check back shortly.
                        </Text>
                      </View>
                    );
                  }

                  const format12H = (tStr?: string | null) => {
                    if (!tStr) return '';
                    if (/am|pm/i.test(tStr)) return tStr;
                    const [hStr, mStr] = tStr.split(':');
                    let h = parseInt(hStr, 10);
                    const m = mStr || '00';
                    if (isNaN(h)) return tStr;
                    const p = h >= 12 ? 'PM' : 'AM';
                    h = h % 12;
                    if (h === 0) h = 12;
                    return `${h}:${m} ${p}`;
                  };

                  const startTimeFormatted = format12H(startTimeStr);
                  const endTimeFormatted = format12H(endTimeStr);

                  return (
                    <>
                      <TouchableOpacity
                        style={[styles.genButton, !isMedicineDay ? { backgroundColor: '#e2e8f0', opacity: 0.6 } : {}]}
                        onPress={() => handleGenerateToken('medicine')}
                        disabled={tokenLoading || !isMedicineDay}
                      >
                        <Text style={[styles.genButtonText, !isMedicineDay ? { color: '#64748b' } : {}]}>Medicine Consultation</Text>
                        <Text style={[styles.genButtonSub, !isMedicineDay ? { color: '#64748b' } : {}]}>
                          {isMedicineDay
                            ? `Available Today • Hours: ${startTimeFormatted} - ${endTimeFormatted}`
                            : `Not Available Today • Allowed Days: ${medDayText}`}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.genButton,
                          { backgroundColor: isTreatmentDay ? '#f59e0b' : '#e2e8f0', opacity: isTreatmentDay ? 1 : 0.65 }
                        ]}
                        onPress={() => handleGenerateToken('treatment')}
                        disabled={tokenLoading || !isTreatmentDay}
                      >
                        <Text style={[styles.genButtonText, { color: isTreatmentDay ? '#0d1117' : '#64748b' }]}>
                          Treatment / Dressing
                        </Text>
                        <Text style={[styles.genButtonSub, { color: isTreatmentDay ? '#27272a' : '#64748b' }]}>
                          {isTreatmentDay
                            ? `Available Today • Hours: ${startTimeFormatted} - ${endTimeFormatted}`
                            : `Not Available Today • Allowed Days: ${treatDayText}`}
                        </Text>
                      </TouchableOpacity>
                    </>
                  );
                })()}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Doctor & Clinic Info Card */}
      <View style={styles.card}>
        <Text style={{ fontSize: 14, fontWeight: '800', color: '#213932', marginBottom: 12 }}>👨‍⚕️ OUR CLINIC DOCTORS</Text>
        <View style={{ marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#1a202c' }}>Dr. Anit Goswami, B.A.M.S</Text>
          <Text style={{ fontSize: 12, color: '#4a5568' }}>Proctologist • Piles, Fistula & Skin Specialist</Text>
        </View>
        <View style={{ marginBottom: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#1a202c' }}>Dr. Poonam Goswami, B.A.M.S</Text>
          <Text style={{ fontSize: 12, color: '#4a5568' }}>General Physician • Panchakarma Specialist</Text>
        </View>
        <View style={{ marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0' }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#718096' }}>CLINIC ADDRESS:</Text>
          <Text style={{ fontSize: 13, color: '#2d3748', fontWeight: '600', marginTop: 2 }}>#226/4, 7th Cross, R.T.Street, Bengaluru - 560053</Text>
          <Text style={{ fontSize: 12, color: '#2b6cb0', fontWeight: '600', marginTop: 4 }}>Ph: 080 - 22268269, 080 - 41136539</Text>
          <TouchableOpacity
            onPress={() => {
              Linking.openURL('https://maps.app.goo.gl/v6DAwnEmM3ofYDM88').catch((err) => console.error('Failed to open Google Maps', err));
            }}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#f0fdf4',
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#86efac',
              marginTop: 8,
              gap: 6
            }}
          >
            <Text style={{ fontSize: 15 }}>📍</Text>
            <Text style={{ color: '#166534', fontWeight: '800', fontSize: 12, textDecorationLine: 'underline' }}>
              Open in Google Maps ↗
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation Options */}
      <View style={{ width: '100%', gap: 12, marginTop: 12 }}>
        <TouchableOpacity style={styles.navBtn} onPress={onNavigateToProfile}>
          <Text style={styles.navBtnText}>My profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={onNavigateToContact}>
          <Text style={styles.navBtnText}>Clinic Details</Text>
        </TouchableOpacity>
      </View>


    </ScrollView>

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
                <Text style={styles.modalLabel}>DATE OF BIRTH * (DD/MM/YYYY)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editDateOfBirth}
                  onChangeText={(t) => setEditDateOfBirth(formatDobText(t))}
                  placeholder="30/12/1985"
                  placeholderTextColor="#a0aec0"
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>

              <View>
                <Text style={styles.modalLabel}>EMAIL ADDRESS (REQUIRED FOR UPDATES)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editEmail}
                  onChangeText={(t) => {
                    setEditEmail(t);
                    if (t.trim().toLowerCase() !== (profile?.email || '').toLowerCase()) {
                      setEmailVerified(false);
                      setEmailOtpSent(false);
                    }
                  }}
                  placeholder="name@example.com"
                  placeholderTextColor="#a0aec0"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Email OTP Verification Box */}
              {editEmail.trim().toLowerCase() !== (profile?.email || '').toLowerCase() && (
                <View style={{ backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 10, padding: 12, gap: 10 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#166534' }}>
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
                <Text style={styles.modalLabel}>CITY / ADDRESS (KARNATAKA) *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editTown}
                  onChangeText={setEditTown}
                  placeholder="e.g. Bengaluru / Mysore"
                  placeholderTextColor="#a0aec0"
                />
              </View>

              <View>
                <Text style={styles.modalLabel}>PROFESSION (OPTIONAL)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editProfession}
                  onChangeText={setEditProfession}
                  placeholder="Engineer / Teacher / Businessman"
                  placeholderTextColor="#a0aec0"
                />
              </View>

              <View>
                <Text style={styles.modalLabel}>BLOOD GROUP (OPTIONAL)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editBloodGroup}
                  onChangeText={setEditBloodGroup}
                  placeholder="e.g. O+, A+, B+"
                  placeholderTextColor="#a0aec0"
                />
              </View>

              <View>
                <Text style={styles.modalLabel}>PREVIOUS SURGERY FOR PILES/FISTULA/FISSURES (OPTIONAL)</Text>
                <TextInput
                  style={[styles.modalInput, { height: 70, textAlignVertical: 'top' }]}
                  value={editPreviousSurgeryDetails}
                  onChangeText={setEditPreviousSurgeryDetails}
                  placeholder="Mention year or details if any surgery was performed previously"
                  placeholderTextColor="#a0aec0"
                  multiline={true}
                />
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 18, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#edf2f7' }}>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#edf2f7', alignItems: 'center' }}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={{ color: '#4a5568', fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flex: 1.5, paddingVertical: 12, borderRadius: 10, backgroundColor: '#213932', alignItems: 'center', opacity: savingProfile ? 0.7 : 1 }}
                onPress={handleSaveProfile}
                disabled={savingProfile}
              >
                <Text style={{ color: '#ffffff', fontWeight: '800' }}>{savingProfile ? 'Saving...' : 'Save Changes'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gridValue: {
    color: '#1a202c',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
  statusFooter: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
    gap: 10,
  },
  footerLabel: {
    color: '#213932',
    fontSize: 15,
    fontWeight: '800',
  },
  badge: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '800',
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
  modalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4a5568',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1a202c',
  },
  genderChip: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#edf2f7',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  genderChipActive: {
    backgroundColor: '#213932',
    borderColor: '#213932',
  },
  genderChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4a5568',
  },
  genderChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
