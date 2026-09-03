import os

with open('/Users/kiranbmayan.host/Desktop/clinic-app/mobile/src/screens/HomeScreen.tsx', 'r') as f:
    content = f.read()

# Target block to remove
target = """        {/* Quick Menu Options */}
        <View style={{ width: '100%', gap: 10, marginTop: 12 }}>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => {
              fetchPatientLedger();
              setShowLedgerModal(true);
            }}
          >
            <Text style={styles.navBtnText}>💳 Payment Ledger Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => {
              fetchPatientHistory();
              setShowHistoryModal(true);
            }}
          >
            <Text style={styles.navBtnText}>📜 Visited History</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navBtn} onPress={openEditModal}>
            <Text style={styles.navBtnText}>👤 My Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navBtn} onPress={() => setShowClinicDetailsModal(true)}>
            <Text style={styles.navBtnText}>🏥 Clinic Details</Text>
          </TouchableOpacity>
        </View>"""

if target in content:
    new_content = content.replace(target, "")
    with open('/Users/kiranbmayan.host/Desktop/clinic-app/mobile/src/screens/HomeScreen.tsx', 'w') as f:
        f.write(new_content)
    print("Successfully removed bottom menu buttons from HomeScreen.tsx")
else:
    print("Could not find exact target block, checking alternative matching...")
