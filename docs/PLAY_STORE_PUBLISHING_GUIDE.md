# 🚀 Google Play Store Publishing Guide (From Scratch)

This step-by-step guide walks you through publishing the **Amar Ayurveda** Android Mobile App to the **Google Play Store**, starting from account setup to building your production release bundle (`.aab`) and launching to live users.

---

## 📋 Table of Contents
1. [Phase 1: Create Google Play Developer Account](#phase-1-create-google-play-developer-account)
2. [Phase 2: Generate Signed Production Release Bundle (.aab)](#phase-2-generate-signed-production-release-bundle-aab)
3. [Phase 3: Setup App Store Listing](#phase-3-setup-app-store-listing)
4. [Phase 4: Mandatory Policy & Data Safety Declarations](#phase-4-mandatory-policy--data-safety-declarations)
5. [Phase 5: Submit for Google Review & Rollout](#phase-5-submit-for-google-review--rollout)

---

## 💳 Phase 1: Create Google Play Developer Account

1. Go to the [Google Play Console Registration Page](https://play.google.com/console/signup).
2. Sign in with the primary Google Account you want associated with **Amar Ayurveda**.
3. Choose your account type:
   - **Personal Account**: Requires valid Government ID (Aadhaar / Passport / Voter ID).
   - **Organization Account**: Requires business registration documents and DUNS number.
4. Pay the **one-time $25 USD registration fee** using a credit card / debit card with international transactions enabled.
5. Complete identity verification (takes ~24-48 hours for Google to verify your ID).

---

## 🔑 Phase 2: Generate Signed Production Release Bundle (`.aab`)

Google Play requires an **Android App Bundle (`.aab`)**, which is different from a standard `.apk`.

### Step 1: Create a Production Keystore File (`.jks`)
Run this command in your Mac terminal to generate a secure digital signature key:

```bash
cd ~/Desktop/clinic-app/mobile/android/app

keytool -genkey -v -keystore amar-ayurveda-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias amar-key-alias
```

> ⚠️ **CRITICAL WARNING**: Save your keystore password, alias name, and `amar-ayurveda-key.jks` file in a secure location! If you lose this key, you will never be able to update your app on the Play Store.

### Step 2: Configure Android Signing in `build.gradle`
Open `mobile/android/app/build.gradle` and add signing configurations:

```groovy
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Step 3: Compile JS Bundle & Build `.aab` in Android Studio
1. Open `mobile/android` in **Android Studio**.
2. Run bundle command:
   ```bash
   cd ~/Desktop/clinic-app/mobile
   npx react-native bundle --platform android --dev false --entry-file node_modules/expo/AppEntry.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res
   ```
3. In Android Studio top menu, select:
   **Build > Generate Signed Bundle / APK...**
4. Select **Android App Bundle (.aab)** and click **Next**.
5. Choose `amar-ayurveda-key.jks`, enter your password, select **release**, and click **Create**.
6. Retrieve your final output bundle at:
   `mobile/android/app/release/app-release.aab`

---

## 🎨 Phase 3: Setup App Store Listing

In the [Google Play Console](https://play.google.com/console):

1. Click **Create app**.
2. Fill in basic info:
   - **App name**: `Amar Ayurveda`
   - **Default language**: `English (US)` / `English (IN)`
   - **App or game**: `App`
   - **Free or paid**: `Free`
3. Fill Store Listing Details:
   - **Short Description** (max 80 chars): *Ayurvedic Healthcare Patient Console & Real-time Queue Token Management.*
   - **Full Description**: *Amar Ayurveda Patient Console allows patients to register, verify identity, generate daily consultation and treatment tokens, and track waiting room queues in real time.*
4. Upload Graphics Assets:
   - **App Icon**: `512 x 512 px` (32-bit PNG with alpha channel). Use your cropped leaf logo.
   - **Feature Graphic**: `1024 x 500 px` banner.
   - **Phone Screenshots**: Upload at least **2 to 8 screenshots** of your mobile app (Home Screen, Token Screen, Login Screen).

---

## 🛡️ Phase 4: Mandatory Policy & Data Safety Declarations

Under **App Content** in Google Play Console, complete these required questionnaires:

1. **Privacy Policy URL**:
   Set to `https://amar.vistarafabtech.com/privacy-policy`
2. **Data Safety Questionnaire**:
   - **Does your app collect or share data?**: Select `Yes`.
   - **Data Types Collected**:
     - *Personal Info*: Name, Email Address, Phone Number (for patient registry).
   - **Data Security**: Declare that data is encrypted in transit via SSL/HTTPS.
3. **Content Rating (IARC)**:
   Complete 2-minute questionnaire. Select category **Healthcare / Medical**. Rating generated will be **PEGI 3 / Everyone**.
4. **Target Audience**: Select **18 and above**.
5. **Government / Health Declarations**: Select "Non-Governmental Healthcare Provider".

---

## 🚀 Phase 5: Submit for Google Review & Rollout

1. Go to **Production** (or **Testing > Internal testing** for dry run).
2. Click **Create new release**.
3. Drag & drop your `app-release.aab` file generated in Phase 2.
4. Add **Release Notes**:
   ```text
   Initial release of Amar Ayurveda Patient App featuring:
   - Patient Registration & Verification
   - Real-time Queue Token Generation
   - Live Token Tracker & Doctor Availability Updates
   ```
5. Click **Save** > **Review Release** > **Start Rollout to Production**.

---

### ⌛ What Happens Next?
- **Review Period**: Google reviews new app submissions within **1 to 3 business days**.
- **Status Update**: Once approved, your app status changes to **Live on Google Play**, and patients can search and download **Amar Ayurveda** directly from the Play Store!
