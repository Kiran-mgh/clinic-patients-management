# Amar Hospital Healthcare Management Platform

This repository contains the complete, production-ready source code structure for the **Amar Hospital Healthcare Management Platform**.

## Platform Components

1. **NestJS Backend APIs** ([backend/](file:///Users/kiranbmayan.host/Desktop/clinic-app/backend))
   - REST API engine built using NestJS, TypeScript, TypeORM, and PostgreSQL.
   - Passwordless authentication (OTP verification & 90-day JWT sessions).
   - Core token rules validation (timing limits, weekday availability, single token limit, daily cron expiration at 5:00 PM).
   - Graceful dev fallback to SQLite database (`amar_hospital.sqlite`) if PG environment is offline.

2. **Doctor & Admin Web Portal** ([portal/](file:///Users/kiranbmayan.host/Desktop/clinic-app/portal))
   - High-fidelity dashboard interface built with React, Vite, and TypeScript.
   - Clean, modern, responsive Dark Theme using custom HSL color systems.
   - Operational features: Dashboard indicators, Patient verification panel, ID assignment, Queue Desk manager, and Patient database search.
   - Dual-Mode API Client: automatically falls back to browser-based mockup DB simulation if backend is offline.

3. **Patient Mobile Application** ([mobile/](file:///Users/kiranbmayan.host/Desktop/clinic-app/mobile))
   - Lightweight mobile client code written in React Native (Expo) and TypeScript.
   - Interactive screens: Login, OTP confirmation, Profile registration (New/Existing patient toggles), Home hub, and Clinic Guideline cards.
   - Embedded "Simulator Tools" panel during development mode to mock database statuses instantly.

4. **Operations & Deployment Guides** ([docs/](file:///Users/kiranbmayan.host/Desktop/clinic-app/docs))
   - [AWS Deployment Architecture](file:///Users/kiranbmayan.host/Desktop/clinic-app/docs/aws_deployment_architecture.md)
   - [Production Deployment Guide](file:///Users/kiranbmayan.host/Desktop/clinic-app/docs/production_deployment_guide.md)
   - [CI/CD Pipeline Configurations](file:///Users/kiranbmayan.host/Desktop/clinic-app/docs/ci_cd_pipeline.md)
   - [REST API Endpoints Document](file:///Users/kiranbmayan.host/Desktop/clinic-app/docs/api_documentation.md)

---

## Quick Start Instructions

Ensure Node.js (v18+) is installed on your computer.

### 1. Launch Stack via Docker Compose (Recommended)
Build and start all components (Postgres database, NestJS backend, Nginx-served portal) with one command:
```bash
docker compose up --build
```
- **Web Portal:** Visit [http://localhost:8080](http://localhost:8080)
- **Backend APIs:** Running on [http://localhost:3000](http://localhost:3000)

### 2. Manual Development Launch
1. **NestJS Backend:**
   ```bash
   cd backend
   npm install
   npm run start:dev
   ```
2. **React Portal:**
   ```bash
   cd portal
   npm install
   npm run dev
   ```
3. **Patient Mobile App:**
   ```bash
   cd mobile
   npm install
   npm run web
   ```

---

## Test Credentials (Staff Bypass)
- **Staff Mobile:** `+919999999999`
- **Verification OTP:** `000000`
*(Input these values in the Web Portal to log in with full Admin/Doctor permissions)*.

## Guided Scenarios Walkthrough
For step-by-step verification instructions (patient signup, admin ID assignment, token limits, treatment rules, and queue servicing), read the [Complete Walkthrough Guide](file:///Users/kiranbmayan.host/.gemini/antigravity/brain/74e1e223-c75b-4d6f-9040-0b56cfd9bd80/walkthrough.md).
