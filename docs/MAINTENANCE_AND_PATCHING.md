# 🛠️ Regular Maintenance & Patching Guide

This guide outlines standard operating procedures for regularly updating, patching, and maintaining the **Amar Ayurveda Management System** across backend servers, web portals, and mobile apps.

---

## 📋 Table of Contents
1. [Backend API & Database Patching (EC2)](#1-backend-api--database-patching-ec2)
2. [Web Portal UI Updates](#2-web-portal-ui-updates)
3. [Mobile App Patching & Version Bumping](#3-mobile-app-patching--version-bumping)
4. [NPM Security Vulnerability Audits](#4-npm-security-vulnerabilities--dependency-audits)

---

## 1. Backend API & Database Patching (EC2)

When you make bug fixes, database schema updates, or API logic changes:

### Step 1: Commit and Push Changes locally
```bash
git add .
git commit -m "fix: resolve patient verification edge case"
git push origin main
```

### Step 2: Deploy Hotfix on EC2 Server
Connect to your EC2 instance via SSH:
```bash
ssh ubuntu@amar.vistarafabtech.com

cd ~/clinic-patients-management
git pull origin main

# Rebuild backend container without downtime
sudo docker compose build backend
sudo docker compose up -d backend
```

---

## 2. Web Portal UI Updates

When you update web portal features or styles:

```bash
# On EC2 server
cd ~/clinic-patients-management
git pull origin main

# Rebuild static production bundle
cd portal
npm run build
```

---

## 3. Mobile App Patching & Version Bumping

When releasing a bug fix or feature update for Android:

### Step 1: Increment Version Numbers
Open `mobile/app.json` and bump `version` and `versionCode`:
```json
{
  "expo": {
    "name": "Amar Ayurveda",
    "version": "1.0.1",
    "android": {
      "versionCode": 2
    }
  }
}
```

### Step 2: Re-bundle JS Code & Rebuild App
```bash
cd mobile

# Re-bundle JavaScript assets
npx react-native bundle --platform android --dev false --entry-file node_modules/expo/AppEntry.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res
```

In **Android Studio**:
- Select **Build > Clean Project**.
- Select **Build > Generate Signed Bundle / APK** to upload a new `.aab` to Google Play Console.

---

## 4. NPM Security Vulnerabilities & Dependency Audits

Run security checks quarterly:

```bash
# Check for security vulnerabilities in dependencies
npm audit

# Automatically update non-breaking security patches
npm audit fix
```
