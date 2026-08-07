# AGENTS.md - Developer & Agent Guide for Amar Ayurveda Clinic System

Welcome to the **Amar Ayurveda Clinic Management System** repository. This document serves as a comprehensive architecture guide, operational handbook, and reference manual for AI agents and human developers working on this codebase.

---

## 🏛️ 1. Project Overview & Architecture

The application provides end-to-end clinic operations, real-time patient queue tracking, token management, and patient record management for **Amar Ayurveda Clinic**.

### Technology Stack
- **Backend (`/backend`)**: NestJS (TypeScript), TypeORM, PostgreSQL (Production) / SQLite (Development), WebSockets (`Socket.io`), NestJS Schedule (Cron), JWT Authentication, SMTP Mailer.
- **Web Portal (`/portal`)**: React (TypeScript), Vite, Lucide Icons, Glassmorphism CSS, `Socket.io-client`.
- **Mobile App (`/mobile`)**: React Native (TypeScript), Expo SDK 49, Android Native Bundle (`index.android.bundle`).

---

## 📁 2. Repository Structure

```
clinic-app/
├── backend/                  # NestJS REST API & WebSocket Server
│   ├── src/
│   │   ├── auth/             # JWT, Local strategy, Roles guards
│   │   ├── entities/         # TypeORM entities (Patient, Token, User, OtpSession, AuditLog, SystemSetting)
│   │   ├── queue/            # Queue management, status updates, gateway events
│   │   ├── patients/         # Patient registry, profile updates, Email OTP verification
│   │   ├── settings/         # System settings (Token timings, allowed days, pause toggle)
│   │   └── tokens/           # IST token generation, daily sequences, IST cron expiry
│   └── main.ts               # NestJS bootstrap with ValidationPipe({ whitelist: true })
├── portal/                   # Web Console for Doctor & Staff
│   ├── src/
│   │   ├── pages/            # Dashboard, PatientManagement, QueueManagement, Reports
│   │   ├── components/       # Custom 12H TimePicker, Modal portals, UI controls
│   │   └── api.ts            # Production API client wrapper
├── mobile/                   # Android Mobile App for Patients
│   ├── src/
│   │   └── screens/          # LoginScreen, RegisterScreen, HomeScreen, ProfileScreen
│   ├── android/              # Native Android project (built via Android Studio / Gradle)
│   └── App.tsx               # Root App component registered with registerRootComponent(App)
└── docker-compose.yml        # Docker composition for AWS EC2 deployment
```

---

## ⚙️ 3. Core Features & Business Rules

### 🕒 A. Token Generation Rules & Timings (IST Timezone)
- **Timezone Standard**: All server time evaluations (current hour, current minute, day of week) MUST be evaluated in **Indian Standard Time (IST - `Asia/Kolkata`, UTC+5:30)**.
- **Configurable Operating Windows**: Clinic admins/doctors configure start time (e.g. `07:30 AM`) and end time (e.g. `03:00 PM`) via the portal.
- **Allowed Days per Service**:
  - **Medicine Consultation**: Configurable allowed days (Default: Mon–Sat).
  - **Treatment / Dressing**: Configurable allowed days (Default: Tue, Wed, Thu).
- **Pause Switch**: Token generation can be paused/resumed dynamically from the portal dashboard.
- **One Token Per Patient**: Patients can generate a maximum of 1 token per day.
- **Postgres Sequence Reset**: Token sequences (e.g. `M001`, `T001`) utilize atomic PostgreSQL sequences prefixed by the IST date (e.g. `medicine_token_seq_2026_08_07`).
- **Daily Expiration Cron**: Active/waiting tokens automatically expire at 5:00 PM IST daily via `@Cron('0 17 * * *', { timeZone: 'Asia/Kolkata' })`.

### 💳 B. Payment Status & Billing Notes
- **Serve Token Confirmation**: Staff/doctor records payment status (`✓ Paid` vs `⏳ Unpaid`) and alphanumeric transaction notes (e.g., `Cash ₹500`, `UPI #9821`) when marking a token served.
- **Interactive Payment Badge**: Clicking the payment badge (`[ ⏳ Unpaid ✏️ ]`) on the Queue Desk opens an instant payment update modal.
- **Reports & Export Logs**: Payment statuses and transaction notes are logged in the **Visited Patient Details Log** and included in CSV/Excel/PDF exports.

### 📧 C. Mobile Email Verification via OTP
- **Profile Updates**: Email modifications in the mobile app require a 6-digit OTP dispatched to the new email address.
- **Verification Session**: Verification state is validated on the backend before updating the patient record.

---

## 🛠️ 4. Essential Guidelines for AI Agents

### Rule 1: DTO Validation & Whitelisting in NestJS
- `main.ts` enforces `new ValidationPipe({ whitelist: true, transform: true })`.
- **CRITICAL**: Every `@Body()` request parameter MUST use a dedicated DTO class with `class-validator` annotations (e.g. `@IsString()`, `@IsOptional()`, `@IsArray()`). Plain TypeScript interfaces or unannotated classes will cause `ValidationPipe` to strip incoming properties down to `{}`.

### Rule 2: Timezone Handling
- Never use raw `now.getHours()` or `now.getDay()` on the backend for business logic comparisons. Always use `Intl.DateTimeFormat` with `timeZone: 'Asia/Kolkata'` to ensure consistent IST behavior on AWS EC2 servers.

### Rule 3: Android Studio & Mobile Bundling
- The Android mobile app packages a pre-bundled static asset at `mobile/android/app/src/main/assets/index.android.bundle`.
- After modifying any React Native screen in `mobile/src/`, re-generate the bundle before building in Android Studio:
  ```bash
  cd mobile
  npx react-native bundle --platform android --dev false --entry-file node_modules/expo/AppEntry.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res
  ```

---

## 🚀 5. Development & Build Commands

### Backend (`/backend`)
```bash
npm run build      # Compile NestJS TypeScript to /dist
npm run test       # Run Jest unit test suite
npm run start:dev  # Launch dev server with hot reload
```

### Web Portal (`/portal`)
```bash
npm run build      # Build Vite production bundle to /dist
npm run dev        # Launch Vite development server
```

### Deployment (AWS EC2 Docker)
```bash
cd ~/clinic-patients-management
git pull origin main
sudo docker compose build backend
sudo docker compose up -d backend
cd portal && npm run build
```
