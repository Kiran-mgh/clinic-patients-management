import React, { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Image, Modal, TextInput, Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { io } from 'socket.io-client';
import { registerForPushNotificationsAsync, sendLocalNotification } from '../services/notificationService';

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
  const [announcement, setAnnouncement] = useState<any>(null);
  const [pushStatusInfo, setPushStatusInfo] = useState<string>('Syncing push notifications...');
  const [syncingPush, setSyncingPush] = useState<boolean>(false);

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

  // Menu Drawer & Section Modal States
  const [showMenuDrawer, setShowMenuDrawer] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showClinicDetailsModal, setShowClinicDetailsModal] = useState(false);

  const [patientHistory, setPatientHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [patientLedger, setPatientLedger] = useState<any>(null);
  const [loadingLedger, setLoadingLedger] = useState(false);

  const fetchPatientHistory = async () => {
    setLoadingHistory(true);
    try {
      const history = await api.get('/tokens/my-history', token);
      setPatientHistory(history || []);
    } catch (err: any) {
      console.error('Failed to fetch patient history:', err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchPatientLedger = async () => {
    setLoadingLedger(true);
    try {
      const ledger = await api.get('/billing/my-ledger', token);
      setPatientLedger(ledger || null);
    } catch (err: any) {
      console.error('Failed to fetch patient ledger:', err.message);
    } finally {
      setLoadingLedger(false);
    }
  };

  const formatToIndianDate = (dateStr?: string | Date | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

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

  const prevTokenStatusRef = React.useRef<string | null>(null);
  const prevProfileStatusRef = React.useRef<string | null>(null);
  const prevAheadRef = React.useRef<number | null>(null);

  const handleManualPushSync = async () => {
    setSyncingPush(true);
    try {
      const pTok = await registerForPushNotificationsAsync(token);
      if (pTok) {
        const res = await api.post('/patients/push-token', { pushToken: pTok }, token);
        setPushStatusInfo(`Active (${pTok.slice(0, 18)}...)`);
        Alert.alert('Push Notifications Active', `Device push token registered successfully with clinic server!\n\nToken: ${pTok}`);
      } else {
        setPushStatusInfo('Permission Denied / Token Unavailable');
        Alert.alert(
          'Notification Permission Required',
          'Could not register push token. Please enable Notifications permission for Amar Ayurveda in your Android phone settings (Settings > Apps > Amar Ayurveda > Notifications > Allowed).'
        );
      }
    } catch (err: any) {
      setPushStatusInfo(`Failed: ${err.message}`);
      Alert.alert('Push Sync Error', err.message || 'Failed to register device push token.');
    } finally {
      setSyncingPush(false);
    }
  };

  const fetchProfileAndToken = async () => {
    setError('');
    try {
      const pushTok = await registerForPushNotificationsAsync(token).catch((err) => {
        setPushStatusInfo(`Failed: ${err.message}`);
        return null;
      });
      if (pushTok) {
        setPushStatusInfo(`Active (${pushTok.slice(0, 16)}...)`);
      } else {
        setPushStatusInfo('Not Registered (Tap Sync)');
      }
      const prof = await api.get('/patients/profile', token, pushTok);
      if (prof) {
        if (prevProfileStatusRef.current && prevProfileStatusRef.current !== 'active' && prof.status === 'active') {
          sendLocalNotification(
            '🎉 Account Approved!',
            `Welcome ${prof.fullName}, your registration is approved. Your Patient ID is ${prof.patientId}. You can now generate daily tokens!`
          );
        }
        prevProfileStatusRef.current = prof.status;
      }
      setProfile(prof);

      const cfg = await api.get('/settings/tokens', token);
      setTokenConfig(cfg);

      try {
        const ann = await api.get('/settings/announcement', token);
        setAnnouncement(ann);
      } catch (e) {
        // Optional announcement
      }

      if (prof && prof.status === 'active') {
        const tokRes = await api.get('/tokens/today', token);
        const currentTok = tokRes.token;
        if (currentTok) {
          if (prevTokenStatusRef.current && prevTokenStatusRef.current !== 'in_progress' && currentTok.status === 'in_progress') {
            sendLocalNotification(
              `🔔 It's Your Turn! (Token ${currentTok.tokenNumber})`,
              `Token ${currentTok.tokenNumber}: Please proceed to Doctor Consultation Room now.`
            );
          }
          if (prevAheadRef.current !== null && prevAheadRef.current !== currentTok.patientsAhead && currentTok.status === 'waiting') {
            if (currentTok.patientsAhead === 1) {
              sendLocalNotification(
                `⏳ You are Next! (Token ${currentTok.tokenNumber})`,
                `Token ${currentTok.tokenNumber}: The doctor is now serving ${currentTok.currentServing || 'the previous patient'}. You are next in line.`
              );
            } else if (currentTok.patientsAhead === 2 || currentTok.patientsAhead === 5) {
              sendLocalNotification(
                `⏳ Turn Approaching (Token ${currentTok.tokenNumber})`,
                `Token ${currentTok.tokenNumber}: ${currentTok.patientsAhead} patients ahead for Consultation.`
              );
            }
          }
          prevTokenStatusRef.current = currentTok.status;
          prevAheadRef.current = currentTok.patientsAhead;
        }
        setTodayToken(currentTok);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch status updates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndToken();

    // Foreground notification listener to pop up Alert dialog when push notification arrives
    const notificationSubscription = Notifications.addNotificationReceivedListener((notification) => {
      const { title, body } = notification.request.content;
      console.log('[NOTIFICATION RECEIVED IN FOREGROUND]', title, body);
      if (title && body) {
        Alert.alert(title, body);
      }
    });

    const socketUrl = 'https://pms-api-staging.amarayurveda.in';
    const socket = io(socketUrl);

    socket.on('connect', () => {
      console.log('[Socket] Connected to Mobile Client Server');
    });

    socket.on('queue_updated', () => {
      console.log('[Socket] Received queue_updated event, syncing status...');
      fetchProfileAndToken();
    });

    const fallbackInterval = setInterval(fetchProfileAndToken, 15000);

    return () => {
      notificationSubscription.remove();
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

  const summary = patientLedger?.summary || { totalCoursesFee: 0, totalPaid: 0, totalBalanceDue: 0 };
  const courses = patientLedger?.courses || [];
  const allPayments = patientLedger?.allPayments || [];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        {/* Header with 3-Line Menu */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.hamburgerBtn}
            onPress={() => setShowMenuDrawer(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="menu" size={26} color="#213932" />
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginLeft: 4 }}>
            <Image
              source={require('../../assets/logo.png')}
              style={{ width: 38, height: 38, resizeMode: 'contain', borderRadius: 8 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.welcomeText} numberOfLines={1}>Welcome,</Text>
              <Text style={styles.nameText} numberOfLines={1}>{profile?.fullName || 'Patient'}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        {/* Doctor Vacation & Clinic Announcements Banner */}
        {announcement && announcement.enabled ? (
          <View style={[
            styles.announcementBanner,
            announcement.type === 'vacation' 
              ? styles.announcementVacation 
              : announcement.type === 'emergency' 
              ? styles.announcementEmergency 
              : styles.announcementGeneral
          ]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Text style={{ fontSize: 22 }}>
                {announcement.type === 'vacation' ? '🏖️' : announcement.type === 'emergency' ? '⚠️' : '📢'}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={[
                  styles.announcementTitle,
                  announcement.type === 'vacation' 
                    ? styles.announcementTitleVacation 
                    : announcement.type === 'emergency' 
                    ? styles.announcementTitleEmergency 
                    : styles.announcementTitleGeneral
                ]}>
                  {announcement.title || (announcement.type === 'vacation' ? 'Dr Anit Goswamy on Leave' : 'Clinic Notice')}
                </Text>
                {(announcement.startDate || announcement.endDate) ? (
                  <Text style={styles.announcementDateText}>
                    🗓️ {announcement.startDate || 'Current'} {announcement.endDate ? `to ${announcement.endDate}` : ''}
                  </Text>
                ) : null}
              </View>
            </View>

            {announcement.message ? (
              <Text style={[
                styles.announcementMessage,
                announcement.type === 'vacation' 
                  ? styles.announcementMessageVacation 
                  : announcement.type === 'emergency' 
                  ? styles.announcementMessageEmergency 
                  : styles.announcementMessageGeneral
              ]}>
                {announcement.message}
              </Text>
            ) : null}

            {announcement.autoPauseTokens ? (
              <View style={styles.announcementPauseTag}>
                <Text style={styles.announcementPauseTagText}>⏸️ Token Generation Currently Paused</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Patient Record Card */}
        <View style={styles.card}>
          <View style={styles.patientIdRow}>
            <Text style={styles.patientIdLabel}>PATIENT ID</Text>
            <Text style={styles.patientIdVal}>{profile?.patientId || 'ASSIGNING...'}</Text>
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
          <View style={[styles.statusRow, { marginTop: 8, justifyContent: 'space-between' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
              <Text style={styles.statusLabel}>Push Alert:</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: pushStatusInfo.startsWith('Active') ? '#16a34a' : '#d97706' }} numberOfLines={1}>
                {pushStatusInfo}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleManualPushSync}
              disabled={syncingPush}
              style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1' }}
            >
              {syncingPush ? <ActivityIndicator size="small" color="#213932" /> : <Text style={{ fontSize: 11, fontWeight: '800', color: '#213932' }}>🔔 Sync Push</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Verification Pending or Token Section */}
        {profile?.status !== 'active' ? (
          <View style={styles.verificationBanner}>
            <Text style={styles.bannerEmoji}>⏳</Text>
            <Text style={styles.verificationTitle}>Verification Pending</Text>
            <Text style={styles.verificationBody}>
              Your registration is under verification. You will be able to generate tokens once your Patient ID has been assigned by the clinic.
            </Text>
          </View>
        ) : (
          <View style={{ width: '100%', gap: 20 }}>
            {todayToken ? (
              <View style={[styles.card, styles.tokenCard]}>
                <Text style={styles.tokenTitle}>TODAY'S TOKEN</Text>
                <Text style={styles.tokenNumber}>{todayToken.tokenNumber}</Text>

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
                    <Text style={styles.gridValue}>
                      {todayToken.currentServing?.replace('Last Served: ', 'Last: ') || 'None'}
                    </Text>
                  </View>
                  <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>TOTAL TOKENS</Text>
                    <Text style={styles.gridValue}>
                      {todayToken.lastTokenNumber || '1'}
                    </Text>
                  </View>
                  <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>AHEAD / WAIT</Text>
                    <Text style={styles.gridValue}>
                      {todayToken.isMissed ? 'After Last' : `${todayToken.patientsAhead} Patients`}
                    </Text>
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
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Generate Daily Token</Text>
                <Text style={styles.sectionSub}>Tokens are valid only for the current day and expire at 5:00 PM.</Text>

                <View style={{ gap: 12, marginTop: 16 }}>
                  {(() => {
                    const now = new Date();
                    const todayDay = now.getDay();
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

                    if (announcement && announcement.enabled && announcement.autoPauseTokens) {
                      return (
                        <View style={{ backgroundColor: '#fffbeb', borderWidth: 1.5, borderColor: '#fde68a', borderRadius: 12, padding: 16 }}>
                          <Text style={{ fontSize: 15, fontWeight: '800', color: '#92400e', marginBottom: 4 }}>
                            🏖️ Token Booking Suspended (Dr Anit Goswamy on Leave)
                          </Text>
                          <Text style={{ fontSize: 13, color: '#78350f', lineHeight: 18 }}>
                            {announcement.message || 'Daily consultation tokens are temporarily suspended. Please check announcement above.'}
                          </Text>
                        </View>
                      );
                    }

                    if (!isGloballyEnabled) {
                      return (
                        <View style={{ backgroundColor: '#fef2f2', borderWidth: 1.5, borderColor: '#fecaca', borderRadius: 12, padding: 16 }}>
                          <Text style={{ fontSize: 15, fontWeight: '800', color: '#991b1b', marginBottom: 4 }}>
                            ⏸️ Token Generation Paused
                          </Text>
                          <Text style={{ fontSize: 13, color: '#7f1d1d', lineHeight: 18 }}>
                            Token generation is currently paused by the clinic administration.
                          </Text>
                        </View>
                      );
                    }

                    const format12H = (tStr: string) => {
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
                          style={[
                            styles.genButton,
                            styles.genMedicineBtn,
                            (!isMedicineDay || tokenLoading) && styles.disabledGenBtn,
                          ]}
                          onPress={() => handleGenerateToken('medicine')}
                          disabled={!isMedicineDay || tokenLoading}
                          activeOpacity={0.8}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={[styles.genButtonTitle, { color: isMedicineDay ? '#ffffff' : '#64748b' }]}>
                              Medicine Consultation Token
                            </Text>
                            {tokenLoading && <ActivityIndicator color="#ffffff" size="small" />}
                          </View>
                          <Text style={[styles.genButtonSub, { color: isMedicineDay ? '#e2e8f0' : '#94a3b8' }]}>
                            {isMedicineDay
                              ? `Available Today • Hours: ${startTimeFormatted} - ${endTimeFormatted}`
                              : `Not Available Today • Allowed Days: ${medDayText}`}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.genButton,
                            styles.genTreatmentBtn,
                            (!isTreatmentDay || tokenLoading) && styles.disabledGenBtn,
                          ]}
                          onPress={() => handleGenerateToken('treatment')}
                          disabled={!isTreatmentDay || tokenLoading}
                          activeOpacity={0.8}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={[styles.genButtonTitle, { color: isTreatmentDay ? '#18181b' : '#64748b' }]}>
                              Treatment / Dressing Token
                            </Text>
                            {tokenLoading && <ActivityIndicator color="#18181b" size="small" />}
                          </View>
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


      </ScrollView>

      {/* ☰ 3-Line Hamburger Menu Drawer Modal */}
      <Modal visible={showMenuDrawer} animationType="fade" transparent={true} onRequestClose={() => setShowMenuDrawer(false)}>
        <TouchableOpacity style={styles.drawerBackdrop} activeOpacity={1} onPress={() => setShowMenuDrawer(false)}>
          <View style={styles.drawerContent} onStartShouldSetResponder={() => true}>
            <View style={styles.drawerHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.drawerTitle}>Amar Ayurveda</Text>
                <Text style={styles.drawerSubtitle}>{profile?.fullName || 'Patient Profile'}</Text>
                <Text style={styles.drawerIdText}>ID: {profile?.patientId || profile?.id?.slice(0, 8)}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowMenuDrawer(false)} style={styles.drawerCloseBtn}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 12 }}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowMenuDrawer(false);
                  fetchPatientLedger();
                  setShowLedgerModal(true);
                }}
              >
                <View style={[styles.menuIconBg, { backgroundColor: '#ecfdf5' }]}>
                  <Ionicons name="card-outline" size={22} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuItemTitle}>Payment Ledger Details</Text>
                  <Text style={styles.menuItemSub}>Treatment packages, receipts & balance</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowMenuDrawer(false);
                  fetchPatientHistory();
                  setShowHistoryModal(true);
                }}
              >
                <View style={[styles.menuIconBg, { backgroundColor: '#eff6ff' }]}>
                  <Ionicons name="time-outline" size={22} color="#2563eb" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuItemTitle}>Visited History</Text>
                  <Text style={styles.menuItemSub}>Past consultation tokens & doctor notes</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowMenuDrawer(false);
                  openEditModal();
                }}
              >
                <View style={[styles.menuIconBg, { backgroundColor: '#fef3c7' }]}>
                  <Ionicons name="person-outline" size={22} color="#d97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuItemTitle}>My Profile</Text>
                  <Text style={styles.menuItemSub}>Personal info, email OTP & address</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowMenuDrawer(false);
                  setShowClinicDetailsModal(true);
                }}
              >
                <View style={[styles.menuIconBg, { backgroundColor: '#f3e8ff' }]}>
                  <Ionicons name="business-outline" size={22} color="#7c3aed" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuItemTitle}>Clinic Details</Text>
                  <Text style={styles.menuItemSub}>Doctors, address, timings & Google Maps</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>

              <View style={{ height: 1, backgroundColor: '#e2e8f0', marginVertical: 12, marginHorizontal: 16 }} />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowMenuDrawer(false);
                  onLogout();
                }}
              >
                <View style={[styles.menuIconBg, { backgroundColor: '#fef2f2' }]}>
                  <Ionicons name="log-out-outline" size={22} color="#dc2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuItemTitle, { color: '#dc2626' }]}>Log Out</Text>
                  <Text style={styles.menuItemSub}>Sign out of clinic mobile account</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>

            <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0', alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '600' }}>Amar Ayurveda Management System</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 💳 Treatment Package Payment Ledger Modal (Doctor Portal Mirror) */}
      <Modal visible={showLedgerModal} animationType="slide" transparent={true} onRequestClose={() => setShowLedgerModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.modalTitleText}>💳 Payment Ledger Details</Text>
                <Text style={styles.modalSubText}>
                  {profile?.fullName} • ID: {profile?.patientId || profile?.id?.slice(0, 8)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowLedgerModal(false)} style={styles.modalCloseIconBtn}>
                <Ionicons name="close" size={22} color="#475569" />
              </TouchableOpacity>
            </View>

            {loadingLedger ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#213932" />
                <Text style={{ color: '#64748b', marginTop: 12 }}>Loading treatment ledger...</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 20 }}>
                {/* Package Financial Summary Card */}
                <View style={styles.ledgerSummaryCard}>
                  <View style={styles.ledgerStatBox}>
                    <Text style={styles.ledgerStatLabel}>PACKAGE FEE</Text>
                    <Text style={styles.ledgerStatVal}>₹{summary.totalCoursesFee.toLocaleString()}</Text>
                  </View>
                  <View style={[styles.ledgerStatBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#e2e8f0' }]}>
                    <Text style={styles.ledgerStatLabel}>TOTAL PAID</Text>
                    <Text style={[styles.ledgerStatVal, { color: '#16a34a' }]}>₹{summary.totalPaid.toLocaleString()}</Text>
                  </View>
                  <View style={styles.ledgerStatBox}>
                    <Text style={styles.ledgerStatLabel}>BALANCE DUE</Text>
                    <Text style={[styles.ledgerStatVal, { color: summary.totalBalanceDue > 0 ? '#dc2626' : '#16a34a' }]}>
                      ₹{summary.totalBalanceDue.toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Treatment Package / Course Breakdown */}
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#1e293b', marginTop: 4 }}>
                  🩺 TREATMENT PACKAGES & COURSES
                </Text>

                {courses.length === 0 ? (
                  <View style={{ padding: 24, alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
                    <Text style={{ fontSize: 28 }}>📦</Text>
                    <Text style={{ color: '#64748b', marginTop: 6, fontWeight: '600', textAlign: 'center' }}>
                      No active treatment packages assigned yet.
                    </Text>
                  </View>
                ) : (
                  courses.map((c: any) => (
                    <View key={c.id} style={styles.coursePackageCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={styles.courseTitle}>{c.title}</Text>
                          {c.notes ? <Text style={styles.courseSubNotes}>{c.notes}</Text> : null}
                          <Text style={styles.courseDateText}>🗓️ Started: {formatToIndianDate(c.startDate || c.createdAt)}</Text>
                        </View>
                        <Text style={[
                          styles.courseStatusBadge,
                          c.status === 'active' ? styles.courseActiveBadge : styles.courseCompletedBadge
                        ]}>
                          {c.status.toUpperCase()}
                        </Text>
                      </View>

                      {/* Package Fee Progress */}
                      <View style={styles.packageFeeRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 11, color: '#64748b', fontWeight: '700' }}>TOTAL FEE: ₹{c.totalFee}</Text>
                          <Text style={{ fontSize: 11, color: '#16a34a', fontWeight: '800', marginTop: 2 }}>PAID: ₹{c.totalPaid}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ fontSize: 11, color: '#dc2626', fontWeight: '800' }}>
                            BALANCE: ₹{c.balanceDue}
                          </Text>
                          <Text style={{ fontSize: 10, color: c.isFullyPaid ? '#16a34a' : '#d97706', fontWeight: '800', marginTop: 2 }}>
                            {c.isFullyPaid ? '✓ FULLY PAID' : '⏳ UNPAID BALANCE'}
                          </Text>
                        </View>
                      </View>

                      {/* Itemized Installment Receipts for this Course */}
                      {c.payments && c.payments.length > 0 ? (
                        <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: '#475569', marginBottom: 8, letterSpacing: 0.5 }}>
                            🧾 PAYMENT INSTALLMENT RECEIPTS ({c.payments.length})
                          </Text>
                          {c.payments.map((p: any) => (
                            <View key={p.id} style={styles.installmentReceiptRow}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.installmentAmountText}>
                                  ₹{p.amount} <Text style={styles.installmentModeText}>({p.paymentMode || 'Cash'})</Text>
                                </Text>
                                {p.transactionNotes ? (
                                  <Text style={styles.installmentNoteText}>Txn Note: {p.transactionNotes}</Text>
                                ) : null}
                              </View>
                              <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.installmentDateText}>{formatToIndianDate(p.paidAt)}</Text>
                                <Text style={styles.recordedByText}>By: {p.recordedBy || 'Staff'}</Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <Text style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', marginTop: 8 }}>
                          No payment receipts recorded for this package yet.
                        </Text>
                      )}
                    </View>
                  ))
                )}

                {/* Complete Payment Receipts Log */}
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#1e293b', marginTop: 6 }}>
                  🧾 ALL PAYMENT TRANSACTIONS LOG ({allPayments.length})
                </Text>

                {allPayments.length === 0 ? (
                  <View style={{ padding: 24, alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
                    <Text style={{ fontSize: 28 }}>💳</Text>
                    <Text style={{ color: '#64748b', marginTop: 6, fontWeight: '600', textAlign: 'center' }}>
                      No payment receipts issued yet.
                    </Text>
                  </View>
                ) : (
                  allPayments.map((p: any) => (
                    <View key={p.id} style={styles.paymentReceiptCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.receiptAmountText}>₹{p.amount.toLocaleString()}</Text>
                        <Text style={styles.receiptModeBadge}>{p.paymentMode || 'Cash'}</Text>
                      </View>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                        <Text style={styles.receiptDateText}>🗓️ {formatToIndianDate(p.paidAt)}</Text>
                        <Text style={styles.receiptRecordedBy}>Recorded By: {p.recordedBy || 'Clinic Staff'}</Text>
                      </View>

                      {p.transactionNotes ? (
                        <View style={styles.receiptTxnBox}>
                          <Text style={styles.receiptTxnText}>💳 Ref / Receipt: {p.transactionNotes}</Text>
                        </View>
                      ) : null}
                    </View>
                  ))
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* 📜 Visited History Modal */}
      <Modal visible={showHistoryModal} animationType="slide" transparent={true} onRequestClose={() => setShowHistoryModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.modalTitleText}>📜 Visited Consultation History</Text>
                <Text style={styles.modalSubText}>
                  All past tokens for {profile?.fullName}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowHistoryModal(false)} style={styles.modalCloseIconBtn}>
                <Ionicons name="close" size={22} color="#475569" />
              </TouchableOpacity>
            </View>

            {loadingHistory ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#213932" />
                <Text style={{ color: '#64748b', marginTop: 12 }}>Loading consultation history...</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
                {patientHistory.length === 0 ? (
                  <View style={{ padding: 30, alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12 }}>
                    <Text style={{ fontSize: 32 }}>🗓️</Text>
                    <Text style={{ color: '#64748b', marginTop: 8, fontWeight: '600' }}>No visited history records found.</Text>
                  </View>
                ) : (
                  patientHistory.map((tok: any) => (
                    <View key={tok.id} style={styles.historyCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, flexWrap: 'wrap', marginRight: 6 }}>
                          <Text style={styles.historyTokenNum}>{tok.tokenNumber}</Text>
                          <Text style={styles.historyServiceText}>
                            {tok.serviceType === 'medicine' ? 'Medicine Consultation' : 'Treatment / Dressing'}
                          </Text>
                        </View>
                        <Text style={[styles.statusBadgeSmall, (styles as any)[`status_${tok.status}`] || styles.status_waiting]}>
                          {tok.status.toUpperCase()}
                        </Text>
                      </View>

                      <View style={{ marginTop: 8 }}>
                        <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '600' }}>
                          🗓️ Date: {formatToIndianDate(tok.generatedAt)}
                        </Text>
                      </View>

                      {tok.notes ? (
                        <View style={styles.historyNoteBox}>
                          <Text style={styles.historyNoteText}>💬 Doctor Note: {tok.notes}</Text>
                        </View>
                      ) : null}
                    </View>
                  ))
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* 🏥 Clinic Details Modal */}
      <Modal visible={showClinicDetailsModal} animationType="slide" transparent={true} onRequestClose={() => setShowClinicDetailsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.modalTitleText}>🏥 Amar Ayurveda Clinic Details</Text>
                <Text style={styles.modalSubText}>Healthcare services, doctors & timings</Text>
              </View>
              <TouchableOpacity onPress={() => setShowClinicDetailsModal(false)} style={styles.modalCloseIconBtn}>
                <Ionicons name="close" size={22} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 20 }}>
              <View style={styles.clinicInfoCard}>
                <Text style={styles.clinicSectionHeader}>👨‍⚕️ OUR CLINIC DOCTORS</Text>
                <View style={styles.doctorRow}>
                  <Text style={styles.doctorName}>Dr. Anit Goswami, B.A.M.S</Text>
                  <Text style={styles.doctorSpec}>Proctologist • Piles, Fistula & Skin Specialist</Text>
                </View>
                <View style={styles.doctorRow}>
                  <Text style={styles.doctorName}>Dr. Poonam Goswami, B.A.M.S</Text>
                  <Text style={styles.doctorSpec}>General Physician • Panchakarma Specialist</Text>
                </View>
              </View>

              <View style={styles.clinicInfoCard}>
                <Text style={styles.clinicSectionHeader}>🕒 CLINIC OPERATING HOURS</Text>
                <Text style={styles.timingText}>• Weekdays (Mon - Fri): 07:00 AM - 03:30 PM</Text>
                <Text style={styles.timingText}>• Saturdays: 07:30 AM - 01:00 PM</Text>
                <Text style={styles.timingText}>• Token Expiry: 05:00 PM Daily (IST)</Text>
              </View>

              <View style={styles.clinicInfoCard}>
                <Text style={styles.clinicSectionHeader}>📍 CLINIC LOCATION & CONTACT</Text>
                <Text style={styles.addressText}>#226/4, 7th Cross, R.T. Street, Bengaluru - 560053</Text>
                <Text style={styles.phoneText}>☎️ 080 - 22268269, 080 - 41136539</Text>

                <TouchableOpacity
                  onPress={() => {
                    Linking.openURL('https://maps.app.goo.gl/v6DAwnEmM3ofYDM88').catch((err) => console.error('Failed to open Google Maps', err));
                  }}
                  activeOpacity={0.7}
                  style={styles.googleMapsBtn}
                >
                  <Text style={{ fontSize: 18 }}>📍</Text>
                  <Text style={styles.googleMapsBtnText}>Open in Google Maps ↗</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ✏️ Edit Profile Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent={true} onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.modalTitleText}>✏️ Edit Profile Details</Text>
                <Text style={styles.modalSubText}>Update your details anytime. Changes reflect immediately across clinic systems.</Text>
              </View>
              <TouchableOpacity onPress={() => setShowEditModal(false)} style={styles.modalCloseIconBtn}>
                <Ionicons name="close" size={22} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 14 }}>
              <View>
                <Text style={styles.modalLabel}>FULL NAME *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editFullName}
                  onChangeText={setEditFullName}
                  placeholder="Enter full name"
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
                  onChangeText={(t) => setEditDateOfBirth(formatDobText(t))}
                  placeholder="DD/MM/YYYY"
                  keyboardType="numeric"
                  maxLength={10}
                  placeholderTextColor="#a0aec0"
                />
              </View>

              <View>
                <Text style={styles.modalLabel}>EMAIL ADDRESS (REQUIRED OTP VERIFICATION)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editEmail}
                  onChangeText={(text) => {
                    setEditEmail(text);
                    setEmailVerified(false);
                    setEmailOtpSent(false);
                  }}
                  placeholder="name@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#a0aec0"
                />

                {editEmail.trim().toLowerCase() !== (profile?.email || '').toLowerCase() && editEmail.trim() !== '' ? (
                  <View style={{ marginTop: 8 }}>
                    {!emailVerified ? (
                      <>
                        <TouchableOpacity
                          style={[styles.otpBtn, sendingOtp && { opacity: 0.6 }]}
                          onPress={handleRequestEmailOtp}
                          disabled={sendingOtp}
                        >
                          {sendingOtp ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.otpBtnText}>{emailOtpSent ? 'Resend Verification OTP' : 'Send Email OTP'}</Text>}
                        </TouchableOpacity>

                        {emailOtpSent ? (
                          <View style={{ marginTop: 10, gap: 8 }}>
                            <TextInput
                              style={styles.modalInput}
                              value={emailOtpCode}
                              onChangeText={setEmailOtpCode}
                              placeholder="Enter 6-digit OTP code"
                              keyboardType="numeric"
                              maxLength={6}
                              placeholderTextColor="#a0aec0"
                            />
                            <TouchableOpacity
                              style={[styles.verifyBtn, verifyingOtp && { opacity: 0.6 }]}
                              onPress={handleVerifyEmailOtp}
                              disabled={verifyingOtp}
                            >
                              {verifyingOtp ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.verifyBtnText}>Verify OTP Code</Text>}
                            </TouchableOpacity>
                          </View>
                        ) : null}
                      </>
                    ) : (
                      <Text style={{ fontSize: 12, color: '#16a34a', fontWeight: '700', marginTop: 4 }}>✓ Email Verified via OTP!</Text>
                    )}
                  </View>
                ) : null}
              </View>

              <View>
                <Text style={styles.modalLabel}>CITY / TOWN *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editTown}
                  onChangeText={setEditTown}
                  placeholder="Enter city or town"
                  placeholderTextColor="#a0aec0"
                />
              </View>

              <View>
                <Text style={styles.modalLabel}>BLOOD GROUP</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editBloodGroup}
                  onChangeText={setEditBloodGroup}
                  placeholder="e.g. O+, A+, B+"
                  placeholderTextColor="#a0aec0"
                />
              </View>

              <View>
                <Text style={styles.modalLabel}>PROFESSION</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editProfession}
                  onChangeText={setEditProfession}
                  placeholder="Enter profession"
                  placeholderTextColor="#a0aec0"
                />
              </View>

              <View>
                <Text style={styles.modalLabel}>PREVIOUS SURGERY DETAILS</Text>
                <TextInput
                  style={[styles.modalInput, { height: 70, textAlignVertical: 'top' }]}
                  value={editPreviousSurgeryDetails}
                  onChangeText={setEditPreviousSurgeryDetails}
                  placeholder="Any previous surgery or medical history"
                  multiline={true}
                  placeholderTextColor="#a0aec0"
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                <TouchableOpacity
                  style={[styles.modalCancelBtn, { flex: 1 }]}
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalSaveBtn, { flex: 1 }, savingProfile && { opacity: 0.6 }]}
                  onPress={handleSaveProfile}
                  disabled={savingProfile}
                >
                  {savingProfile ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.modalSaveBtnText}>Save Changes</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  hamburgerBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  welcomeText: {
    fontSize: 12,
    color: '#718096',
  },
  nameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#213932',
  },
  logoutBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  logoutText: {
    color: '#e53e3e',
    fontWeight: 'bold',
    fontSize: 13,
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  patientIdRow: {
    marginBottom: 8,
  },
  patientIdLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#a0aec0',
    letterSpacing: 1,
  },
  patientIdVal: {
    fontSize: 22,
    fontWeight: '800',
    color: '#213932',
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusLabel: {
    fontSize: 13,
    color: '#718096',
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  statusActive: {
    color: '#38a169',
  },
  statusPending: {
    color: '#dd6b20',
  },
  errorText: {
    color: '#e53e3e',
    marginBottom: 16,
    textAlign: 'center',
  },
  verificationBanner: {
    width: '100%',
    backgroundColor: '#fffaf0',
    borderWidth: 1,
    borderColor: '#fbd38d',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  bannerEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#c05621',
    marginBottom: 6,
  },
  verificationBody: {
    fontSize: 13,
    color: '#7b341e',
    textAlign: 'center',
    lineHeight: 18,
  },
  tokenCard: {
    alignItems: 'center',
    backgroundColor: '#fffdfa',
    borderWidth: 1,
    borderColor: '#f6ad55',
  },
  tokenTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#c05621',
    letterSpacing: 1,
  },
  tokenNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#7b341e',
    marginVertical: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#feebc8',
    width: '100%',
    marginVertical: 14,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  gridItem: {
    alignItems: 'center',
    flex: 1,
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#a0aec0',
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  statusFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  footerLabel: {
    fontSize: 13,
    color: '#718096',
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  badge_waiting: {
    backgroundColor: '#edf2f7',
    color: '#4a5568',
  },
  badge_in_progress: {
    backgroundColor: '#feebc8',
    color: '#c05621',
  },
  badge_served: {
    backgroundColor: '#c6f6d5',
    color: '#22543d',
  },
  badge_cancelled: {
    backgroundColor: '#fed7d7',
    color: '#9b2c2c',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#213932',
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 12,
    color: '#718096',
  },
  genButton: {
    padding: 16,
    borderRadius: 14,
    gap: 4,
  },
  genMedicineBtn: {
    backgroundColor: '#213932',
  },
  genTreatmentBtn: {
    backgroundColor: '#f4f4f5',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  disabledGenBtn: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    opacity: 0.7,
  },
  genButtonTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  genButtonSub: {
    fontSize: 12,
  },
  navBtn: {
    width: '100%',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  navBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#213932',
  },
  // Menu Drawer Styles
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    flexDirection: 'row',
  },
  drawerContent: {
    width: '80%',
    maxWidth: 320,
    height: '100%',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  drawerHeader: {
    backgroundColor: '#213932',
    padding: 20,
    paddingTop: 44,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  drawerTitle: {
    color: '#a7f3d0',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  drawerSubtitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  drawerIdText: {
    color: '#cbd5e1',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  drawerCloseBtn: {
    padding: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  menuItemSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  // Common Section Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '92%',
    maxWidth: 520,
    maxHeight: '88%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#213932',
  },
  modalSubText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  modalCloseIconBtn: {
    padding: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  // Treatment Package Ledger Specific Styles
  ledgerSummaryCard: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  ledgerStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  ledgerStatLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  ledgerStatVal: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 4,
  },
  coursePackageCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#213932',
  },
  courseSubNotes: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  courseDateText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 4,
  },
  courseStatusBadge: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  courseActiveBadge: {
    backgroundColor: '#ecfdf5',
    color: '#059669',
  },
  courseCompletedBadge: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
  },
  packageFeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  installmentReceiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  installmentAmountText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16a34a',
  },
  installmentModeText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  installmentNoteText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  installmentDateText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  recordedByText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  paymentReceiptCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  receiptAmountText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#16a34a',
  },
  receiptModeBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3b82f6',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  receiptDateText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  receiptRecordedBy: {
    fontSize: 11,
    color: '#94a3b8',
  },
  receiptTxnBox: {
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 6,
    marginTop: 6,
  },
  receiptTxnText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  // History Modal Styles
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  historyTokenNum: {
    fontSize: 18,
    fontWeight: '900',
    color: '#213932',
  },
  historyServiceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  historyNoteBox: {
    backgroundColor: '#eff6ff',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  historyNoteText: {
    fontSize: 12,
    color: '#1e40af',
  },
  statusBadgeSmall: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  status_served: { backgroundColor: '#dcfce7', color: '#166534' },
  status_waiting: { backgroundColor: '#f1f5f9', color: '#475569' },
  status_in_progress: { backgroundColor: '#fef3c7', color: '#92400e' },
  status_cancelled: { backgroundColor: '#fee2e2', color: '#991b1b' },
  // Clinic Details Styles
  clinicInfoCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  clinicSectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#213932',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  doctorRow: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  doctorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  doctorSpec: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  timingText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
    fontWeight: '600',
  },
  addressText: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '700',
  },
  phoneText: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '700',
    marginTop: 4,
  },
  googleMapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#86efac',
    marginTop: 12,
    gap: 8,
  },
  googleMapsBtnText: {
    color: '#166534',
    fontWeight: '800',
    fontSize: 13,
  },
  // Edit Profile Styles
  modalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#4a5568',
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#cbd5e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#1a202c',
    backgroundColor: '#ffffff',
  },
  genderChip: {
    flex: 1,
    paddingVertical: 10,
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
  otpBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  otpBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  verifyBtn: {
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  verifyBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  modalCancelBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e0',
  },
  modalCancelBtnText: {
    color: '#4a5568',
    fontWeight: 'bold',
  },
  modalSaveBtn: {
    backgroundColor: '#213932',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalSaveBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  announcementBanner: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  announcementVacation: {
    backgroundColor: '#fffbeb',
    borderWidth: 1.5,
    borderColor: '#fde68a',
  },
  announcementEmergency: {
    backgroundColor: '#fef2f2',
    borderWidth: 1.5,
    borderColor: '#fecaca',
  },
  announcementGeneral: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
  },
  announcementTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  announcementTitleVacation: {
    color: '#92400e',
  },
  announcementTitleEmergency: {
    color: '#991b1b',
  },
  announcementTitleGeneral: {
    color: '#166534',
  },
  announcementDateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b45309',
    marginTop: 2,
  },
  announcementMessage: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  announcementMessageVacation: {
    color: '#78350f',
  },
  announcementMessageEmergency: {
    color: '#7f1d1d',
  },
  announcementMessageGeneral: {
    color: '#14532d',
  },
  announcementPauseTag: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  announcementPauseTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b91c1c',
  },
});
