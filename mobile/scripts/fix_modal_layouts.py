import os

# Fix HomeScreen.tsx
with open('/Users/kiranbmayan.host/Desktop/clinic-app/mobile/src/screens/HomeScreen.tsx', 'r') as f:
    hs_code = f.read()

# 1. Update Ledger Modal Header
old_ledger_header = """            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitleText}>💳 Payment Ledger Details</Text>
                <Text style={styles.modalSubText}>
                  {profile?.fullName} • ID: {profile?.patientId || profile?.id?.slice(0, 8)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowLedgerModal(false)} style={styles.modalCloseIconBtn}>
                <Ionicons name="close" size={22} color="#475569" />
              </TouchableOpacity>
            </View>"""

new_ledger_header = """            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.modalTitleText}>💳 Payment Ledger Details</Text>
                <Text style={styles.modalSubText}>
                  {profile?.fullName} • ID: {profile?.patientId || profile?.id?.slice(0, 8)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowLedgerModal(false)} style={styles.modalCloseIconBtn}>
                <Ionicons name="close" size={22} color="#475569" />
              </TouchableOpacity>
            </View>"""

if old_ledger_header in hs_code:
    hs_code = hs_code.replace(old_ledger_header, new_ledger_header)

# 2. Update History Modal Header
old_history_header = """            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitleText}>📜 Visited Consultation History</Text>
                <Text style={styles.modalSubText}>
                  All past tokens for {profile?.fullName}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowHistoryModal(false)} style={styles.modalCloseIconBtn}>
                <Ionicons name="close" size={22} color="#475569" />
              </TouchableOpacity>
            </View>"""

new_history_header = """            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.modalTitleText}>📜 Visited Consultation History</Text>
                <Text style={styles.modalSubText}>
                  All past tokens for {profile?.fullName}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowHistoryModal(false)} style={styles.modalCloseIconBtn}>
                <Ionicons name="close" size={22} color="#475569" />
              </TouchableOpacity>
            </View>"""

if old_history_header in hs_code:
    hs_code = hs_code.replace(old_history_header, new_history_header)

# 3. Update Clinic Details Header
old_clinic_header = """            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitleText}>🏥 Amar Ayurveda Clinic Details</Text>
                <Text style={styles.modalSubText}>Healthcare services, doctors & timings</Text>
              </View>
              <TouchableOpacity onPress={() => setShowClinicDetailsModal(false)} style={styles.modalCloseIconBtn}>
                <Ionicons name="close" size={22} color="#475569" />
              </TouchableOpacity>
            </View>"""

new_clinic_header = """            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.modalTitleText}>🏥 Amar Ayurveda Clinic Details</Text>
                <Text style={styles.modalSubText}>Healthcare services, doctors & timings</Text>
              </View>
              <TouchableOpacity onPress={() => setShowClinicDetailsModal(false)} style={styles.modalCloseIconBtn}>
                <Ionicons name="close" size={22} color="#475569" />
              </TouchableOpacity>
            </View>"""

if old_clinic_header in hs_code:
    hs_code = hs_code.replace(old_clinic_header, new_clinic_header)

# 4. Update Edit Profile Header in HomeScreen
old_edit_header = """            <Text style={{ fontSize: 18, fontWeight: '800', color: '#213932', marginBottom: 4 }}>✏️ EDIT PROFILE DETAILS</Text>
            <Text style={{ fontSize: 12, color: '#718096', marginBottom: 16 }}>Update your details anytime. Changes reflect immediately across clinic systems.</Text>"""

new_edit_header = """            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.modalTitleText}>✏️ Edit Profile Details</Text>
                <Text style={styles.modalSubText}>Update your details anytime. Changes reflect immediately across clinic systems.</Text>
              </View>
              <TouchableOpacity onPress={() => setShowEditModal(false)} style={styles.modalCloseIconBtn}>
                <Ionicons name="close" size={22} color="#475569" />
              </TouchableOpacity>
            </View>"""

if old_edit_header in hs_code:
    hs_code = hs_code.replace(old_edit_header, new_edit_header)

# Update styles in HomeScreen.tsx
old_modal_content_style = """  modalContent: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '88%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },"""

new_modal_content_style = """  modalContent: {
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
  },"""

if old_modal_content_style in hs_code:
    hs_code = hs_code.replace(old_modal_content_style, new_modal_content_style)

old_close_btn_style = """  modalCloseIconBtn: {
    padding: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
  },"""

new_close_btn_style = """  modalCloseIconBtn: {
    padding: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    flexShrink: 0,
    alignSelf: 'flex-start',
  },"""

if old_close_btn_style in hs_code:
    hs_code = hs_code.replace(old_close_btn_style, new_close_btn_style)

with open('/Users/kiranbmayan.host/Desktop/clinic-app/mobile/src/screens/HomeScreen.tsx', 'w') as f:
    f.write(hs_code)

print("Successfully updated HomeScreen.tsx modal layouts and close button constraints.")
