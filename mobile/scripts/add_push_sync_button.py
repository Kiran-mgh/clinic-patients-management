import os

with open('/Users/kiranbmayan.host/Desktop/clinic-app/mobile/src/screens/HomeScreen.tsx', 'r') as f:
    code = f.read()

# Add pushStatus state
old_states = "  const [announcement, setAnnouncement] = useState<any>(null);"
new_states = """  const [announcement, setAnnouncement] = useState<any>(null);
  const [pushStatusInfo, setPushStatusInfo] = useState<string>('Syncing push notifications...');
  const [syncingPush, setSyncingPush] = useState<boolean>(false);"""

if old_states in code:
    code = code.replace(old_states, new_states)

# Add manual sync handler
old_fetch_start = "  const fetchProfileAndToken = async () => {"
new_fetch_handler = """  const handleManualPushSync = async () => {
    setSyncingPush(true);
    try {
      const pTok = await registerForPushNotificationsAsync(token);
      if (pTok) {
        const res = await api.post('/patients/push-token', { pushToken: pTok }, token);
        setPushStatusInfo(`Active (${pTok.slice(0, 18)}...)`);
        Alert.alert('Push Notifications Active', `Device push token registered successfully with clinic server!\\n\\nToken: ${pTok}`);
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

  const fetchProfileAndToken = async () => {"""

if old_fetch_start in code:
    code = code.replace(old_fetch_start, new_fetch_handler)

# Update fetchProfileAndToken pushTok capture
old_push_fetch = "      const pushTok = await registerForPushNotificationsAsync(token).catch(() => null);"
new_push_fetch = """      const pushTok = await registerForPushNotificationsAsync(token).catch((err) => {
        setPushStatusInfo(`Failed: ${err.message}`);
        return null;
      });
      if (pushTok) {
        setPushStatusInfo(`Active (${pushTok.slice(0, 16)}...)`);
      } else {
        setPushStatusInfo('Not Registered (Tap Sync)');
      }"""

if old_push_fetch in code:
    code = code.replace(old_push_fetch, new_push_fetch)

# Add Push Status Row to Patient Record Card
old_patient_card = """          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Account Status:</Text>
            <Text style={[
              styles.statusText,
              profile?.status === 'active' ? styles.statusActive : styles.statusPending
            ]}>
              {profile?.status?.replace('_', ' ')?.toUpperCase() || 'PENDING'}
            </Text>
          </View>
        </View>"""

new_patient_card = """          <View style={styles.statusRow}>
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
        </View>"""

if old_patient_card in code:
    code = code.replace(old_patient_card, new_patient_card)

with open('/Users/kiranbmayan.host/Desktop/clinic-app/mobile/src/screens/HomeScreen.tsx', 'w') as f:
    f.write(code)

print("Successfully added push status and manual sync button to HomeScreen.tsx")
