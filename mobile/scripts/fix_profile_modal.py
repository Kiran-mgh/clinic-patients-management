import os

with open('/Users/kiranbmayan.host/Desktop/clinic-app/mobile/src/screens/ProfileScreen.tsx', 'r') as f:
    code = f.read()

old_modal = """      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent={true} onRequestClose={() => setShowEditModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 500, maxHeight: '85%', backgroundColor: '#ffffff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#213932', marginBottom: 4 }}>✏️ EDIT PROFILE DETAILS</Text>
            <Text style={{ fontSize: 12, color: '#718096', marginBottom: 16 }}>Update your details anytime. Changes reflect immediately across clinic systems.</Text>"""

new_modal = """      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent={true} onRequestClose={() => setShowEditModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{ width: '92%', maxWidth: 500, maxHeight: '88%', backgroundColor: '#ffffff', borderRadius: 20, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', width: '100%' }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#213932' }}>✏️ Edit Profile Details</Text>
                <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Update your details anytime. Changes reflect immediately across clinic systems.</Text>
              </View>
              <TouchableOpacity onPress={() => setShowEditModal(false)} style={{ padding: 6, backgroundColor: '#f1f5f9', borderRadius: 10, flexShrink: 0, alignSelf: 'flex-start' }}>
                <Ionicons name="close" size={22} color="#475569" />
              </TouchableOpacity>
            </View>"""

if old_modal in code:
    code = code.replace(old_modal, new_modal)
    with open('/Users/kiranbmayan.host/Desktop/clinic-app/mobile/src/screens/ProfileScreen.tsx', 'w') as f:
        f.write(code)
    print("Successfully updated ProfileScreen.tsx edit profile modal layout.")
else:
    print("Could not match old_modal in ProfileScreen.tsx")
