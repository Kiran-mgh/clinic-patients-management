import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { api } from '../api';

interface RegisterScreenProps {
  token: string | null;
  onRegistrationSuccess: () => void;
  onGoBack: () => void;
}

const formatDob = (text: string, prevValue: string = '') => {
  const isDeleting = text.length < prevValue.length;
  let cleaned = text.replace(/\D/g, '');
  
  // 1. Validate Year (cannot be in the future)
  if (cleaned.length >= 4) {
    let year = parseInt(cleaned.slice(0, 4), 10);
    const currentYear = new Date().getFullYear();
    if (year > currentYear) {
      year = currentYear;
    } else if (year < 1900 && cleaned.slice(0, 4).length === 4) {
      if (year === 0) year = 1900;
    }
    cleaned = year.toString().padStart(4, '0') + cleaned.slice(4);
  }

  // 2. Validate Month (01 to 12)
  if (cleaned.length >= 5) {
    let monthPart = cleaned.slice(4, 6);
    if (monthPart.length === 1) {
      const firstDigit = parseInt(monthPart, 10);
      if (firstDigit > 1) {
        monthPart = '0' + monthPart;
        cleaned = cleaned.slice(0, 4) + monthPart + cleaned.slice(5);
      }
    } else if (monthPart.length === 2) {
      let month = parseInt(monthPart, 10);
      if (month < 1) month = 1;
      if (month > 12) month = 12;
      cleaned = cleaned.slice(0, 4) + month.toString().padStart(2, '0') + cleaned.slice(6);
    }
  }

  // 3. Validate Day (01 to max days in month)
  if (cleaned.length >= 7) {
    let dayPart = cleaned.slice(6, 8);
    if (dayPart.length === 1) {
      const firstDigit = parseInt(dayPart, 10);
      if (firstDigit > 3) {
        dayPart = '0' + dayPart;
        cleaned = cleaned.slice(0, 6) + dayPart + cleaned.slice(7);
      }
    } else if (dayPart.length === 2) {
      let day = parseInt(dayPart, 10);
      if (day < 1) day = 1;
      
      const year = parseInt(cleaned.slice(0, 4), 10);
      const month = parseInt(cleaned.slice(4, 6), 10);
      let maxDays = 31;
      if (month === 2) {
        const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        maxDays = isLeap ? 29 : 28;
      } else if ([4, 6, 9, 11].includes(month)) {
        maxDays = 30;
      }
      
      if (day > maxDays) day = maxDays;
      cleaned = cleaned.slice(0, 6) + day.toString().padStart(2, '0');
    }
  }

  cleaned = cleaned.slice(0, 8);

  let formatted = '';
  if (cleaned.length > 0) {
    formatted += cleaned.slice(0, 4);
  }
  
  if (cleaned.length >= 4) {
    const wasDeletingHyphen1 = isDeleting && prevValue.length === 5 && prevValue.endsWith('-');
    if (!wasDeletingHyphen1) {
      formatted += '-';
    }
  }
  
  if (cleaned.length > 4) {
    formatted = cleaned.slice(0, 4) + '-' + cleaned.slice(4, 6);
    if (cleaned.length >= 6) {
      const wasDeletingHyphen2 = isDeleting && prevValue.length === 8 && prevValue.endsWith('-');
      if (!wasDeletingHyphen2) {
        formatted += '-';
      }
    }
  }
  
  if (cleaned.length > 6) {
    formatted = cleaned.slice(0, 4) + '-' + cleaned.slice(4, 6) + '-' + cleaned.slice(6, 8);
  }
  
  return formatted;
};

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ token, onRegistrationSuccess, onGoBack }) => {
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('Male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [email, setEmail] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [profession, setProfession] = useState('');
  const [town, setTown] = useState('');
  const [showBloodGroupSelector, setShowBloodGroupSelector] = useState(false);

  // Patient categories states
  const [isExisting, setIsExisting] = useState(false);
  const [hasPatientId, setHasPatientId] = useState(false);
  const [existingPatientId, setExistingPatientId] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');

    if (!fullName.trim() || !dateOfBirth.trim() || !town.trim() || !email.trim()) {
      setError('Please fill in all mandatory fields (*)');
      return;
    }

    // DOB Validation YYYY-MM-DD
    const dobPattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!dobPattern.test(dateOfBirth.trim())) {
      setError('Date of birth must follow YYYY-MM-DD format (e.g. 1985-12-30).');
      return;
    }

    // Mandatory Email Validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (isExisting && hasPatientId && !existingPatientId.trim()) {
      setError('Please enter your existing Patient ID.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/patients/register', {
        fullName: fullName.trim(),
        gender,
        dateOfBirth: dateOfBirth.trim(),
        email: email.trim(),
        bloodGroup: bloodGroup.trim() || undefined,
        profession: profession.trim(),
        town: town.trim(),
        isExisting,
        existingPatientId: (isExisting && hasPatientId) ? existingPatientId.trim() : null,
      }, token);

      onRegistrationSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to submit registration. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Register Profile</Text>
          <TouchableOpacity style={styles.backBtn} onPress={onGoBack}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>AMAR HOSPITAL REGISTRY</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Full Name */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>FULL NAME *</Text>
          <TextInput
            style={styles.input}
            placeholder="John Doe"
            placeholderTextColor="#a0aec0"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        {/* Gender Toggle */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>GENDER *</Text>
          <View style={styles.toggleRow}>
            {['Male', 'Female', 'Other'].map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.toggleBtn, gender === g ? styles.toggleBtnActive : null]}
                onPress={() => setGender(g)}
              >
                <Text style={[styles.toggleText, gender === g ? styles.toggleTextActive : null]}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date of Birth */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>DATE OF BIRTH * (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            placeholder="1980-05-25"
            placeholderTextColor="#a0aec0"
            value={dateOfBirth}
            onChangeText={(text) => setDateOfBirth(formatDob(text, dateOfBirth))}
          />
        </View>

        {/* Town */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>TOWN / RESIDENCE AREA *</Text>
          <TextInput
            style={styles.input}
            placeholder="Kochi / Palakkad"
            placeholderTextColor="#a0aec0"
            value={town}
            onChangeText={setTown}
          />
        </View>

        {/* Profession */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>PROFESSION (OPTIONAL)</Text>
          <TextInput
            style={styles.input}
            placeholder="Farmer / Engineer / Teacher"
            placeholderTextColor="#a0aec0"
            value={profession}
            onChangeText={setProfession}
          />
        </View>

        {/* Email */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>EMAIL ADDRESS *</Text>
          <TextInput
            style={styles.input}
            placeholder="john@example.com"
            placeholderTextColor="#a0aec0"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Blood Group */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>BLOOD GROUP (OPTIONAL)</Text>
          <TouchableOpacity 
            style={styles.input} 
            activeOpacity={0.7}
            onPress={() => setShowBloodGroupSelector(!showBloodGroupSelector)}
          >
            <Text style={{ color: bloodGroup ? '#1a202c' : '#a0aec0', fontSize: 15 }}>
              {bloodGroup || 'Select Blood Group'}
            </Text>
          </TouchableOpacity>

          {showBloodGroupSelector && (
            <View style={styles.dropdownContainer}>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                <TouchableOpacity 
                  key={bg} 
                  style={[styles.dropdownItem, bloodGroup === bg ? styles.dropdownItemActive : null]}
                  onPress={() => {
                    setBloodGroup(bg);
                    setShowBloodGroupSelector(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, bloodGroup === bg ? styles.dropdownItemTextActive : null]}>
                    {bg}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity 
                style={styles.dropdownClearItem}
                onPress={() => {
                  setBloodGroup('');
                  setShowBloodGroupSelector(false);
                }}
              >
                <Text style={{ color: '#f43f5e', fontWeight: '700', fontSize: 13 }}>
                  Clear / Not Specified
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* PATIENT CLASSIFICATION */}
        <View style={styles.divider} />

        <View style={styles.formGroup}>
          <Text style={styles.label}>Are you an Existing Patient of Amar Hospital?</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, isExisting ? styles.toggleBtnActive : null]}
              onPress={() => setIsExisting(true)}
            >
              <Text style={[styles.toggleText, isExisting ? styles.toggleTextActive : null]}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, !isExisting ? styles.toggleBtnActive : null]}
              onPress={() => { setIsExisting(false); setHasPatientId(false); }}
            >
              <Text style={[styles.toggleText, !isExisting ? styles.toggleTextActive : null]}>No, I am New</Text>
            </TouchableOpacity>
          </View>
        </View>

        {isExisting ? (
          <View style={styles.existingBox}>
            <Text style={styles.label}>Do you already have a Patient ID (e.g. AH000021)?</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, hasPatientId ? styles.toggleBtnActive : null]}
                onPress={() => setHasPatientId(true)}
              >
                <Text style={[styles.toggleText, hasPatientId ? styles.toggleTextActive : null]}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, !hasPatientId ? styles.toggleBtnActive : null]}
                onPress={() => { setHasPatientId(false); setExistingPatientId(''); }}
              >
                <Text style={[styles.toggleText, !hasPatientId ? styles.toggleTextActive : null]}>No</Text>
              </TouchableOpacity>
            </View>

            {hasPatientId ? (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.label}>ENTER PATIENT ID *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="AH000001"
                  placeholderTextColor="#a0aec0"
                  autoCapitalize="characters"
                  value={existingPatientId}
                  onChangeText={setExistingPatientId}
                />
              </View>
            ) : null}
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.button}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Submit Registration</Text>
          )}
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
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 450,
    shadowColor: '#213932',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#fcfbfa',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
  },
  backText: {
    color: '#213932',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#213932',
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#213932',
    letterSpacing: 2,
    marginTop: 4,
    marginBottom: 24,
    opacity: 0.6,
  },
  formGroup: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    color: '#4a5568',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fcfbfa',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#1a202c',
    fontSize: 15,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fcfbfa',
    alignItems: 'center',
  },
  toggleBtnActive: {
    borderColor: '#213932',
    backgroundColor: 'rgba(33, 57, 50, 0.05)',
  },
  toggleText: {
    color: '#718096',
    fontWeight: '600',
    fontSize: 14,
  },
  toggleTextActive: {
    color: '#213932',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 20,
  },
  existingBox: {
    backgroundColor: '#fcfbfa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#213932',
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: '#f43f5e',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 16,
    textAlign: 'center',
  },
  dropdownContainer: {
    backgroundColor: '#fcfbfa',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginTop: 6,
    padding: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  dropdownItem: {
    width: '22%',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  dropdownItemActive: {
    borderColor: '#213932',
    backgroundColor: 'rgba(33, 57, 50, 0.05)',
  },
  dropdownItemText: {
    color: '#718096',
    fontSize: 13,
    fontWeight: '600',
  },
  dropdownItemTextActive: {
    color: '#213932',
    fontWeight: '700',
  },
  dropdownClearItem: {
    width: '100%',
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#f43f5e',
    borderRadius: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.02)',
  },
});
