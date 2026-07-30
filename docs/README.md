# 📚 Amar Ayurveda Management System - Documentation Index

Welcome to the official developer and architecture documentation for the **Amar Ayurveda Management System**.

---

## 📂 Documentation Map

| Guide | Description | Target Audience |
| :--- | :--- | :--- |
| 🏗️ [Architecture & Technical Design](./ARCHITECTURE.md) | High-level system architecture, database ERD, WebSocket sync, and security design. | Architects, Senior Engineers, Lead Developers |
| 🛠️ [Setup & Deployment Guide](./SETUP_AND_DEPLOYMENT.md) | Step-by-step local development setup, Docker containerization, EC2 deployment, and Nginx SSL setup. | DevOps, Full-Stack Engineers |
| 🧪 [Testing & Quality Assurance Guide](./TESTING.md) | Automated Jest unit tests, WebSocket test workflows, and manual QA validation. | QA Engineers, Backend Developers |
| 🔌 [API Reference & OpenAPI Docs](./API_DOCUMENTATION.md) | REST API endpoints, DTO schemas, authentication headers, and Swagger Basic Auth. | Frontend/Mobile Developers, Integrators |
| 🚀 [Play Store Publishing Guide](./PLAY_STORE_PUBLISHING_GUIDE.md) | Step-by-step walkthrough to publish Amar Ayurveda to Google Play Store from scratch. | Product Managers, Mobile Developers |
| 🛠️ [Maintenance & Patching Guide](./MAINTENANCE_AND_PATCHING.md) | Regular patching workflows for EC2, Web Portal, and Mobile App version updates. | DevOps, Mobile Developers |

---

## 🚀 Quick Overview

- **Mobile App**: Expo React Native (Android compiled APK)
- **Web Portal**: React 18 + Vite (Doctor & Receptionist Console)
- **Backend API**: NestJS (TypeScript + TypeORM)
- **Database**: PostgreSQL 15 (Dockerized)
- **Real-Time Sync**: Socket.io WebSockets (`queue_updated` event channel)
- **Hosted Domain**: `https://amar.vistarafabtech.com`
- **Swagger Docs**: `https://amar.vistarafabtech.com/api/docs` (Auth: `admin` / `AmarAyurveda2026!`)
