import os

with open('/Users/kiranbmayan.host/Desktop/clinic-app/mobile/src/screens/HomeScreen.tsx', 'r') as f:
    content = f.read()

target = """                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                        <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '600' }}>
                          🗓️ Date: {formatToIndianDate(tok.generatedAt)}
                        </Text>
                        <Text style={{ fontSize: 12, color: tok.paymentStatus === 'paid' ? '#16a34a' : '#d97706', fontWeight: '700' }}>
                          {tok.paymentStatus === 'paid' ? '✓ Paid' : '⏳ Unpaid'}
                        </Text>
                      </View>"""

replacement = """                      <View style={{ marginTop: 8 }}>
                        <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '600' }}>
                          🗓️ Date: {formatToIndianDate(tok.generatedAt)}
                        </Text>
                      </View>"""

if target in content:
    new_content = content.replace(target, replacement)
    with open('/Users/kiranbmayan.host/Desktop/clinic-app/mobile/src/screens/HomeScreen.tsx', 'w') as f:
        f.write(new_content)
    print("Successfully removed payment status from Visited Consultation History in HomeScreen.tsx")
else:
    print("Target block not found, checking...")
