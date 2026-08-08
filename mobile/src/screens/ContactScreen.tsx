import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Linking } from 'react-native';

interface ContactScreenProps {
  onGoBack: () => void;
}

export const ContactScreen: React.FC<ContactScreenProps> = ({ onGoBack }) => {
  const openGoogleMaps = () => {
    const url = 'https://maps.app.goo.gl/v6DAwnEmM3ofYDM88';
    Linking.openURL(url).catch((err) => console.error('Failed to open Google Maps', err));
  };
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hospital Info</Text>
        <TouchableOpacity style={styles.backBtn} onPress={onGoBack}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      {/* Doctors & Specialists */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>👨‍⚕️ Our Specialists</Text>
        
        <View style={{ marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#213932' }}>Dr. Anit Goswami, B.A.M.S</Text>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#2b6cb0', marginTop: 2 }}>Proctologist</Text>
          <Text style={{ fontSize: 13, color: '#4a5568', marginTop: 2 }}>Specialist in Piles, Fistula & Skin Care</Text>
        </View>

        <View style={{ marginBottom: 4 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#213932' }}>Dr. Poonam Goswami, B.A.M.S</Text>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#2b6cb0', marginTop: 2 }}>General Physician</Text>
          <Text style={{ fontSize: 13, color: '#4a5568', marginTop: 2 }}>Panchakarma Specialist</Text>
        </View>
      </View>

      {/* Treatments & Specialties */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🌿 Specialized Treatments</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {['Piles', 'Fissure', 'Fistula', 'Sinus', 'Panchakarma', 'Skin Specialist', 'General Healthcare'].map((item) => (
            <View key={item} style={{ backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#166534' }}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Clinic Timings */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📅 Clinic Timings & Token Generation</Text>
        <View style={styles.timingRow}>
          <Text style={styles.dayText}>Monday - Friday (Token Window)</Text>
          <Text style={styles.timeText}>7:00 AM – 3:30 PM</Text>
        </View>
        <View style={styles.timingRow}>
          <Text style={styles.dayText}>Saturday (Special Token Window)</Text>
          <Text style={styles.timeText}>7:30 AM – 1:00 PM</Text>
        </View>
        <View style={styles.timingRow}>
          <Text style={styles.dayText}>Sunday</Text>
          <Text style={[styles.timeText, { color: '#f43f5e' }]}>Closed</Text>
        </View>
      </View>

      {/* Patient Guidelines */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📋 Patient Guidelines</Text>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Follow your assigned token number strictly.</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Medicine services are available daily.</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Treatment services are available only on Tuesday, Wednesday, and Thursday.</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Medicine patients will be attended before Treatment patients on treatment days.</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>Patients are advised to rest after treatment as instructed by the doctor.</Text>
        </View>
      </View>

      {/* Contact Details */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📞 Contact Details</Text>
        <View style={styles.contactItem}>
          <Text style={styles.contactLabel}>Clinic Name:</Text>
          <Text style={styles.contactValue}>Amar Ayurveda</Text>
        </View>
        <View style={styles.contactItem}>
          <Text style={styles.contactLabel}>Address:</Text>
          <Text style={styles.contactValue}>#226/4, 7th Cross, R.T.Street, Bengaluru - 560053</Text>
        </View>
        <View style={styles.contactItem}>
          <Text style={styles.contactLabel}>Phone Numbers:</Text>
          <Text style={styles.contactValue}>080 - 22268269, 080 - 41136539</Text>
        </View>
        <View style={styles.contactItem}>
          <TouchableOpacity
            onPress={openGoogleMaps}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#f0fdf4',
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: '#86efac',
              marginTop: 2,
              marginBottom: 4,
              gap: 8
            }}
          >
            <Text style={{ fontSize: 16 }}>📍</Text>
            <Text style={{ color: '#166534', fontWeight: '800', fontSize: 13, textDecorationLine: 'underline' }}>
              Open in Google Maps ↗
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.contactItem}>
          <Text style={styles.contactLabel}>Email:</Text>
          <Text style={styles.contactValue}>dranitgoswami@gmail.com</Text>
        </View>
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
    padding: 20,
    shadowColor: '#213932',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#213932',
    marginBottom: 16,
  },
  timingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dayText: {
    color: '#718096',
    fontSize: 14,
  },
  timeText: {
    color: '#1a202c',
    fontSize: 14,
    fontWeight: '600',
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  bullet: {
    color: '#213932',
    fontSize: 16,
    fontWeight: '800',
  },
  bulletText: {
    color: '#4a5568',
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  contactItem: {
    marginBottom: 12,
  },
  contactLabel: {
    color: '#718096',
    fontSize: 12,
    marginBottom: 2,
  },
  contactValue: {
    color: '#1a202c',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
});
