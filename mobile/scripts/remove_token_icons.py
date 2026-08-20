import os

with open('/Users/kiranbmayan.host/Desktop/clinic-app/mobile/src/screens/HomeScreen.tsx', 'r') as f:
    code = f.read()

# Replace Medicine button title icon
code = code.replace('💊 Medicine Consultation Token', 'Medicine Consultation Token')

# Replace Treatment button title icon
code = code.replace('🩺 Treatment / Dressing Token', 'Treatment / Dressing Token')

with open('/Users/kiranbmayan.host/Desktop/clinic-app/mobile/src/screens/HomeScreen.tsx', 'w') as f:
    f.write(code)

print("Successfully removed icons from Medicine and Treatment token creation buttons.")
