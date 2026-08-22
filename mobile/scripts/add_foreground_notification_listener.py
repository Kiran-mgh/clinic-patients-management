import os

with open('/Users/kiranbmayan.host/Desktop/clinic-app/mobile/src/screens/HomeScreen.tsx', 'r') as f:
    code = f.read()

# Add prevAheadRef
old_ref = "  const prevProfileStatusRef = React.useRef<string | null>(null);"
new_ref = """  const prevProfileStatusRef = React.useRef<string | null>(null);
  const prevAheadRef = React.useRef<number | null>(null);"""

if old_ref in code:
    code = code.replace(old_ref, new_ref)

# Update fetchProfileAndToken with proximity alert trigger
old_token_check = """          if (prevTokenStatusRef.current && prevTokenStatusRef.current !== 'in_progress' && currentTok.status === 'in_progress') {
            sendLocalNotification(
              `🔔 It's Your Turn! (Token ${currentTok.tokenNumber})`,
              `Token ${currentTok.tokenNumber}: Please proceed to Doctor Consultation Room now.`
            );
          }
          prevTokenStatusRef.current = currentTok.status;"""

new_token_check = """          if (prevTokenStatusRef.current && prevTokenStatusRef.current !== 'in_progress' && currentTok.status === 'in_progress') {
            sendLocalNotification(
              `🔔 It's Your Turn! (Token ${currentTok.tokenNumber})`,
              `Token ${currentTok.tokenNumber}: Please proceed to Doctor Consultation Room now.`
            );
          }
          if (prevAheadRef.current !== null && prevAheadRef.current > 1 && currentTok.patientsAhead === 1 && currentTok.status === 'waiting') {
            sendLocalNotification(
              `⏳ You are Next! (Token ${currentTok.tokenNumber})`,
              `Token ${currentTok.tokenNumber}: The doctor is now serving ${currentTok.currentServing || 'the previous patient'}. You are next in line.`
            );
          }
          prevTokenStatusRef.current = currentTok.status;
          prevAheadRef.current = currentTok.patientsAhead;"""

if old_token_check in code:
    code = code.replace(old_token_check, new_token_check)

# Add Notifications import if needed and Notification Listener in useEffect
old_use_effect = """  useEffect(() => {
    fetchProfileAndToken();"""

new_use_effect = """  useEffect(() => {
    fetchProfileAndToken();

    // Foreground notification listener to pop up Alert dialog when push notification arrives
    const notificationSubscription = Notifications.addNotificationReceivedListener((notification) => {
      const { title, body } = notification.request.content;
      console.log('[NOTIFICATION RECEIVED IN FOREGROUND]', title, body);
      if (title && body) {
        Alert.alert(title, body);
      }
    });"""

if old_use_effect in code:
    code = code.replace(old_use_effect, new_use_effect)

# Update cleanup in useEffect
old_cleanup = """    return () => {
      socket.disconnect();
      clearInterval(fallbackInterval);
    };"""

new_cleanup = """    return () => {
      notificationSubscription.remove();
      socket.disconnect();
      clearInterval(fallbackInterval);
    };"""

if old_cleanup in code:
    code = code.replace(old_cleanup, new_cleanup)

with open('/Users/kiranbmayan.host/Desktop/clinic-app/mobile/src/screens/HomeScreen.tsx', 'w') as f:
    f.write(code)

print("Successfully added foreground notification listener and proximity alerts to HomeScreen.tsx")
