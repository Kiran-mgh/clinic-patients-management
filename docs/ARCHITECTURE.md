# 🏗️ Architecture & Technical Design

## 🏛️ System Overview

The **Amar Ayurveda Management System** is an end-to-end healthcare platform designed to streamline patient registration, identity verification, daily token generation, and real-time waiting room queue management across mobile and desktop applications.

```
                   +---------------------------------------+
                   |  Mobile Patient App (React Native)    |
                   +-------------------+-------------------+
                                       | HTTP / REST + WS
                                       v
+------------------------+    +--------+------------------+    +-----------------------+
|  Web Portal (Vite React|--->|  NestJS API & WS Gateway  |<---| PostgreSQL 15 Database|
|  Doctor & Admin)       |    +---------------------------+    +-----------------------+
+------------------------+
```

---

## 🔑 Core Architecture Modules

### 1. Backend Service (`backend/`)
- **Framework**: NestJS 10 (TypeScript)
- **Architecture**: Domain-Driven Modular Monolith (`AuthModule`, `PatientsModule`, `QueueModule`, `TokensModule`, `SmsModule`).
- **ORM**: TypeORM with PostgreSQL connection pooling.
- **WebSocket Gateway**: `QueueGateway` powered by `socket.io`. Emits real-time `queue_updated` events whenever a token is created, a patient is approved, or queue status changes.

### 2. Web Portal (`portal/`)
- **Framework**: React 18 + Vite + TypeScript.
- **Role**: Staff console for Receptionists and Doctors.
- **Real-Time Sync**: Connects to `socket.io-client`. Listens for `queue_updated` events to silently trigger instant background data refetches (`loadData()`) without requiring page refreshes.

### 3. Mobile App (`mobile/`)
- **Framework**: React Native 0.72.6 + Expo SDK 49.
- **Target Platform**: Android APK (`.apk` binary compiled with Gradle 8.2).
- **Features**: Patient authentication, instant daily token generation, real-time queue position tracking, doctor profile viewing, and password reset.

---

## 🗄️ Database Entity Schema (PostgreSQL)

### `User` Entity
- `id` (UUID, Primary Key)
- `email` (String, Unique)
- `phone` (String, Unique)
- `password` (String, Hashed / Null for whitelisted accounts requiring initial reset)
- `role` (Enum: `ADMIN`, `DOCTOR`, `RECEPTIONIST`, `PATIENT`)
- `patientId` (String, Foreign key to `Patient`)

### `Patient` Entity
- `id` (UUID, Primary Key)
- `patientId` (String, Unique Identifier e.g., `AH000007`)
- `fullName` (String)
- `phone` (String)
- `email` (String)
- `verificationStatus` (Enum: `PENDING`, `APPROVED`, `REJECTED`)
- `isExistingPatient` (Boolean)
- `createdAt` (Timestamp)

### `Token` Entity
- `id` (UUID, Primary Key)
- `tokenNumber` (String, Sequential e.g., `M001`, `M002`, `T001`)
- `category` (Enum: `MEDICINE`, `TREATMENT`)
- `status` (Enum: `WAITING`, `SERVING`, `COMPLETED`, `CANCELLED`, `EXPIRED`)
- `generatedAt` (Timestamp)
- `patient` (ManyToOne relationship to `Patient`)

---

## 🔄 Real-Time WebSocket Synchronization Protocol

1. When a patient registers on the mobile app or staff creates a token:
   - Backend persists record to PostgreSQL.
   - `this.queueGateway.emitQueueUpdate()` broadcasts `{ event: 'queue_updated', timestamp: Date.now() }` over the global WebSocket channel.
2. Web Portal & Mobile App receive `queue_updated`:
   - Triggers background data refetching.
   - Patient verification table updates in real time with **0ms delay**.
3. **Polling Fallback**: A 15-second background polling interval ensures data sync even if the WebSocket temporarily disconnects.
