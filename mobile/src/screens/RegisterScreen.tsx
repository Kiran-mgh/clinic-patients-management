import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  ActivityIndicator, ScrollView, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';

interface RegisterScreenProps {
  onRegistrationSuccess: (token: string) => void;
  onGoBack: () => void;
}

const formatDob = (text: string, prevValue: string = '') => {
  const isDeleting = text.length < prevValue.length;
  let cleaned = text.replace(/\D/g, '');

  if (cleaned.length >= 4) {
    let year = parseInt(cleaned.slice(0, 4), 10);
    const currentYear = new Date().getFullYear();
    if (year > currentYear) year = currentYear;
    cleaned = year.toString().padStart(4, '0') + cleaned.slice(4);
  }
  if (cleaned.length >= 5) {
    let monthPart = cleaned.slice(4, 6);
    if (monthPart.length === 2) {
      let month = parseInt(monthPart, 10);
      if (month < 1) month = 1;
      if (month > 12) month = 12;
      cleaned = cleaned.slice(0, 4) + month.toString().padStart(2, '0') + cleaned.slice(6);
    }
  }
  if (cleaned.length >= 7) {
    let dayPart = cleaned.slice(6, 8);
    if (dayPart.length === 2) {
      let day = parseInt(dayPart, 10);
      if (day < 1) day = 1;
      const year = parseInt(cleaned.slice(0, 4), 10);
      const month = parseInt(cleaned.slice(4, 6), 10);
      let maxDays = 31;
      if (month === 2) {
        maxDays = ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 29 : 28;
      } else if ([4, 6, 9, 11].includes(month)) {
        maxDays = 30;
      }
      if (day > maxDays) day = maxDays;
      cleaned = cleaned.slice(0, 6) + day.toString().padStart(2, '0');
    }
  }

  cleaned = cleaned.slice(0, 8);
  if (cleaned.length > 6) return cleaned.slice(0, 4) + '-' + cleaned.slice(4, 6) + '-' + cleaned.slice(6, 8);
  if (cleaned.length > 4) return cleaned.slice(0, 4) + '-' + cleaned.slice(4, 6);
  return cleaned;
};

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onRegistrationSuccess, onGoBack }) => {
  // Account fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Patient profile fields
  const [gender, setGender] = useState('Male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [town, setTown] = useState('');
  const [profession, setProfession] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [showBloodGroupSelector, setShowBloodGroupSelector] = useState(false);
  const [isExisting, setIsExisting] = useState(false);
  const [hasPatientId, setHasPatientId] = useState(false);
  const [existingPatientId, setExistingPatientId] = useState('');
  const [previousSurgeryDetails, setPreviousSurgeryDetails] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');

    // Validate all mandatory fields
    if (!fullName.trim()) { setError('Full name is required.'); return; }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailPattern.test(email.trim())) {
      setError('A valid email address is required.');
      return;
    }

    if (!/^\d{10}$/.test(mobileNumber.trim())) {
      setError('Mobile number must be exactly 10 digits.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!dateOfBirth.trim()) { setError('Date of birth is required.'); return; }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth.trim())) {
      setError('Date of birth must be in YYYY-MM-DD format.');
      return;
    }

    if (!town.trim()) { setError('Town / Residence is required.'); return; }

    if (isExisting && hasPatientId && !existingPatientId.trim()) {
      setError('Please enter your existing Patient ID.');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create user account → get JWT
      const authRes = await api.post('/auth/register', {
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        mobileNumber: mobileNumber.trim(),
        password,
      });

      const token = authRes.accessToken;

      // Step 2: Create patient profile using the new JWT
      await api.post('/patients/register', {
        fullName: fullName.trim(),
        gender,
        dateOfBirth: dateOfBirth.trim(),
        email: email.trim().toLowerCase(),
        bloodGroup: bloodGroup.trim() || undefined,
        profession: profession.trim() || undefined,
        town: town.trim(),
        previousSurgeryDetails: previousSurgeryDetails.trim() || undefined,
        isExisting,
        existingPatientId: (isExisting && hasPatientId) ? existingPatientId.trim() : null,
      }, token);

      onRegistrationSuccess(token);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Image
                source={require('../../assets/logo.png')}
                style={{ width: 44, height: 44, resizeMode: 'contain' }}
              />
              <Text style={styles.title}>Create Account</Text>
            </View>
            <TouchableOpacity style={styles.backBtn} onPress={onGoBack}>
              <Text style={styles.backText}>Sign In</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>AMAR AYURVEDA PATIENT REGISTRY</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* ── ACCOUNT SECTION ── */}
          <Text style={styles.sectionTitle}>Account Details</Text>

          <Text style={styles.label}>FULL NAME *</Text>
          <TextInput style={styles.input} placeholder="John Doe" placeholderTextColor="#a0aec0"
            value={fullName} onChangeText={setFullName} />

          <Text style={styles.label}>EMAIL ADDRESS *</Text>
          <TextInput style={styles.input} placeholder="your@email.com" placeholderTextColor="#a0aec0"
            keyboardType="email-address" autoCapitalize="none"
            value={email} onChangeText={setEmail} />

          <Text style={styles.label}>MOBILE NUMBER *</Text>
          <TextInput style={styles.input} placeholder="10-digit number" placeholderTextColor="#a0aec0"
            keyboardType="phone-pad" maxLength={10}
            value={mobileNumber} onChangeText={(t) => setMobileNumber(t.replace(/\D/g, ''))} />

          <Text style={styles.label}>PASSWORD *</Text>
          <View style={styles.passwordWrapper}>
            <TextInput style={styles.passwordInput} placeholder="At least 6 characters" placeholderTextColor="#a0aec0"
              secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#718096" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>CONFIRM PASSWORD *</Text>
          <View style={styles.passwordWrapper}>
            <TextInput style={styles.passwordInput} placeholder="Repeat your password" placeholderTextColor="#a0aec0"
              secureTextEntry={!showConfirmPassword} value={confirmPassword} onChangeText={setConfirmPassword} />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#718096" />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* ── PATIENT PROFILE SECTION ── */}
          <Text style={styles.sectionTitle}>Patient Profile</Text>

          <Text style={styles.label}>GENDER *</Text>
          <View style={styles.toggleRow}>
            {['Male', 'Female', 'Other'].map((g) => (
              <TouchableOpacity key={g}
                style={[styles.toggleBtn, gender === g && styles.toggleBtnActive]}
                onPress={() => setGender(g)}>
                <Text style={[styles.toggleText, gender === g && styles.toggleTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>DATE OF BIRTH * (YYYY-MM-DD)</Text>
          <TextInput style={styles.input} placeholder="1985-12-30" placeholderTextColor="#a0aec0"
            keyboardType="numeric" maxLength={10}
            value={dateOfBirth} onChangeText={(t) => setDateOfBirth(formatDob(t, dateOfBirth))} />

          <Text style={styles.label}>CITY / ADDRESS (KARNATAKA) *</Text>
          <TextInput style={styles.input} placeholder="e.g. Bengaluru, Karnataka / Mysore" placeholderTextColor="#a0aec0"
            value={town} onChangeText={setTown} />

          <Text style={styles.label}>PROFESSION (OPTIONAL)</Text>
          <TextInput style={styles.input} placeholder="Farmer / Engineer / Teacher" placeholderTextColor="#a0aec0"
            value={profession} onChangeText={setProfession} />

          <Text style={styles.label}>BLOOD GROUP (OPTIONAL)</Text>
          <TouchableOpacity style={styles.input} onPress={() => setShowBloodGroupSelector(!showBloodGroupSelector)}>
            <Text style={{ color: bloodGroup ? '#1a202c' : '#a0aec0', fontSize: 15 }}>
              {bloodGroup || 'Select Blood Group'}
            </Text>
          </TouchableOpacity>
          {showBloodGroupSelector && (
            <View style={styles.dropdownContainer}>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                <TouchableOpacity key={bg}
                  style={[styles.dropdownItem, bloodGroup === bg && styles.dropdownItemActive]}
                  onPress={() => { setBloodGroup(bg); setShowBloodGroupSelector(false); }}>
                  <Text style={[styles.dropdownItemText, bloodGroup === bg && styles.dropdownItemTextActive]}>{bg}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.dropdownClearItem}
                onPress={() => { setBloodGroup(''); setShowBloodGroupSelector(false); }}>
                <Text style={{ color: '#f43f5e', fontWeight: '700', fontSize: 13 }}>Clear / Not Specified</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.label}>PREVIOUS SURGERY FOR PILES / FISTULA / FISSURES (OPTIONAL)</Text>
          <TextInput
            style={[styles.input, { height: 60, textAlignVertical: 'top', paddingTop: 10 }]}
            placeholder="e.g. Yes - Piles surgery in 2021 / No / None"
            placeholderTextColor="#a0aec0"
            multiline
            numberOfLines={2}
            value={previousSurgeryDetails}
            onChangeText={setPreviousSurgeryDetails}
          />

          <View style={styles.divider} />

          <Text style={styles.label}>Are you an existing patient of Amar Ayurveda?</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity style={[styles.toggleBtn, isExisting && styles.toggleBtnActive]}
              onPress={() => setIsExisting(true)}>
              <Text style={[styles.toggleText, isExisting && styles.toggleTextActive]}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toggleBtn, !isExisting && styles.toggleBtnActive]}
              onPress={() => { setIsExisting(false); setHasPatientId(false); }}>
              <Text style={[styles.toggleText, !isExisting && styles.toggleTextActive]}>No, I am New</Text>
            </TouchableOpacity>
          </View>

          {isExisting && (
            <View style={styles.existingBox}>
              <Text style={styles.label}>Do you have a Patient ID (e.g. AH000021)?</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity style={[styles.toggleBtn, hasPatientId && styles.toggleBtnActive]}
                  onPress={() => setHasPatientId(true)}>
                  <Text style={[styles.toggleText, hasPatientId && styles.toggleTextActive]}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.toggleBtn, !hasPatientId && styles.toggleBtnActive]}
                  onPress={() => { setHasPatientId(false); setExistingPatientId(''); }}>
                  <Text style={[styles.toggleText, !hasPatientId && styles.toggleTextActive]}>No</Text>
                </TouchableOpacity>
              </View>
              {hasPatientId && (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.label}>ENTER PATIENT ID *</Text>
                  <TextInput style={styles.input} placeholder="AH000001" placeholderTextColor="#a0aec0"
                    autoCapitalize="characters" value={existingPatientId} onChangeText={setExistingPatientId} />
                </View>
              )}
            </View>
          )}

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Create Account & Register</Text>}
          </TouchableOpacity>

          {loading && (
            <Text style={styles.loadingHint}>Setting up your account, please wait…</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f6f2' },
  scroll: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 24, padding: 24,
    shadowColor: '#213932', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04, shadowRadius: 16, elevation: 2,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '800', color: '#213932' },
  backBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#fcfbfa', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8 },
  backText: { color: '#213932', fontSize: 12, fontWeight: '700' },
  subtitle: { fontSize: 10, fontWeight: '700', color: '#213932', letterSpacing: 2, opacity: 0.6, marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#213932', marginBottom: 14, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
  errorText: { color: '#f43f5e', fontSize: 14, fontWeight: '500', marginBottom: 16, textAlign: 'center', backgroundColor: '#fff5f5', padding: 10, borderRadius: 8 },
  label: { color: '#4a5568', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: '#fcfbfa', borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
    color: '#1a202c', fontSize: 15, marginBottom: 14,
  },
  passwordWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fcfbfa', borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 12, paddingRight: 12, marginBottom: 14,
  },
  passwordInput: {
    flex: 1, paddingHorizontal: 16, paddingVertical: 10,
    color: '#1a202c', fontSize: 15,
  },
  eyeBtn: { padding: 4, justifyContent: 'center', alignItems: 'center' },
  eyeText: { fontSize: 16 },
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fcfbfa', alignItems: 'center' },
  toggleBtnActive: { borderColor: '#213932', backgroundColor: 'rgba(33, 57, 50, 0.05)' },
  toggleText: { color: '#718096', fontWeight: '600', fontSize: 14 },
  toggleTextActive: { color: '#213932', fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 20 },
  existingBox: { backgroundColor: '#fcfbfa', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16 },
  dropdownContainer: {
    backgroundColor: '#fcfbfa', borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 12, marginTop: -10, marginBottom: 14, padding: 10,
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  dropdownItem: { width: '22%', paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#ffffff' },
  dropdownItemActive: { borderColor: '#213932', backgroundColor: 'rgba(33, 57, 50, 0.05)' },
  dropdownItemText: { color: '#718096', fontSize: 13, fontWeight: '600' },
  dropdownItemTextActive: { color: '#213932', fontWeight: '700' },
  dropdownClearItem: { width: '100%', paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: '#f43f5e', borderRadius: 8 },
  button: { backgroundColor: '#213932', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  loadingHint: { color: '#718096', fontSize: 12, textAlign: 'center', marginTop: 10 },
});
