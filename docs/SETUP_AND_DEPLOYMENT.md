# 🛠️ Setup & Deployment Guide

## 💻 1. Local Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- PostgreSQL (v15) or Docker

### Step 1: Clone Repository & Install Dependencies
```bash
# Clone repository
git clone https://github.com/Kiran-mgh/clinic-patients-management.git
cd clinic-patients-management

# Install Backend dependencies
cd backend && npm install

# Install Web Portal dependencies
cd ../portal && npm install

# Install Mobile App dependencies
cd ../mobile && npm install
```

### Step 2: Configure Environment Variables
Create `.env` inside `backend/`:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=amar_ayurveda
JWT_SECRET=your_jwt_secret_key_2026

# SMTP Gmail Password Reset Settings
SMTP_USER=dranitgoswami@gmail.com
SMTP_PASS=your_gmail_app_password

# Swagger Basic Auth Settings
SWAGGER_USER=admin
SWAGGER_PASS=AmarAyurveda2026!
```

### Step 3: Run Services Locally
```bash
# Run Backend API
cd backend && npm run start:dev

# Run Web Portal
cd portal && npm run dev

# Run Mobile App
cd mobile && npm run android
```

---

## ☁️ 2. Production EC2 Deployment Guide

### Architecture on EC2
- Domain: `https://amar.vistarafabtech.com`
- Host OS: Ubuntu 22.04 LTS
- Docker Compose: Multi-container setup (`amar-backend` + `amar-db`)

### Deployment Commands on EC2:
```bash
# Connect to EC2
ssh ubuntu@amar.vistarafabtech.com

# Navigate to project directory
cd ~/clinic-patients-management

# Pull latest commits from GitHub
git pull origin main

# Build & restart Docker backend container
sudo docker compose build backend
sudo docker compose up -d backend

# Check container status & logs
sudo docker compose ps
sudo docker compose logs -f backend
```

---

## 📱 3. Android APK Build Guide (Android Studio)

1. Open `mobile/android` folder in **Android Studio**.
2. Run **File > Sync Project with Gradle Files**.
3. Select **Build > Clean Project**.
4. Select **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
5. Retrieve compiled APK from `mobile/android/app/build/outputs/apk/debug/app-debug.apk`.
