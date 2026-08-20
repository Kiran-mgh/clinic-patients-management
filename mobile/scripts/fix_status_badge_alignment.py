import os

with open('/Users/kiranbmayan.host/Desktop/clinic-app/mobile/src/screens/HomeScreen.tsx', 'r') as f:
    code = f.read()

# Update Visited Consultation History item card header
old_history_row = """                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={styles.historyTokenNum}>{tok.tokenNumber}</Text>
                          <Text style={styles.historyServiceText}>
                            {tok.serviceType === 'medicine' ? 'Medicine Consultation' : 'Treatment / Dressing'}
                          </Text>
                        </View>
                        <Text style={[styles.statusBadgeSmall, (styles as any)[`status_${tok.status}`] || styles.status_waiting]}>
                          {tok.status.toUpperCase()}
                        </Text>
                      </View>"""

new_history_row = """                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, flexWrap: 'wrap', marginRight: 6 }}>
                          <Text style={styles.historyTokenNum}>{tok.tokenNumber}</Text>
                          <Text style={styles.historyServiceText}>
                            {tok.serviceType === 'medicine' ? 'Medicine Consultation' : 'Treatment / Dressing'}
                          </Text>
                        </View>
                        <Text style={[styles.statusBadgeSmall, (styles as any)[`status_${tok.status}`] || styles.status_waiting]}>
                          {tok.status.toUpperCase()}
                        </Text>
                      </View>"""

if old_history_row in code:
    code = code.replace(old_history_row, new_history_row)

# Update statusBadgeSmall style definition
old_badge_style = """  statusBadgeSmall: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },"""

new_badge_style = """  statusBadgeSmall: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
    flexShrink: 0,
    alignSelf: 'flex-start',
  },"""

if old_badge_style in code:
    code = code.replace(old_badge_style, new_badge_style)

with open('/Users/kiranbmayan.host/Desktop/clinic-app/mobile/src/screens/HomeScreen.tsx', 'w') as f:
    f.write(code)

print("Successfully updated status badge alignment in HomeScreen.tsx")
