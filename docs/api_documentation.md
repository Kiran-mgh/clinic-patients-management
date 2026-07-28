# 🔌 REST API Reference & Specification

## 🔓 Authentication Endpoints (`/api/auth`)

### 1. `POST /api/auth/register`
- **Description**: Registers a new patient account.
- **Request Body**:
  ```json
  {
    "fullName": "Rahul Kumar",
    "phone": "9035706668",
    "email": "rahul@gmail.com",
    "password": "Password123!",
    "isExistingPatient": true,
    "patientId": "AH000007"
  }
  ```
- **Response**: `{ "success": true, "token": "jwt_bearer_token", "user": { ... } }`

### 2. `POST /api/auth/login`
- **Description**: User authentication for patients, doctors, and receptionists.
- **Request Body**:
  ```json
  {
    "identifier": "9035706668",
    "password": "Password123!"
  }
  ```
- **Response**: `{ "token": "jwt_bearer_token", "user": { ... } }`

### 3. `POST /api/auth/forgot-password`
- **Description**: Sends a 6-digit verification code to user email.
- **Request Body**: `{ "email": "rahul@gmail.com" }`

### 4. `POST /api/auth/reset-password`
- **Description**: Resets password using valid 6-digit code.
- **Request Body**:
  ```json
  {
    "email": "rahul@gmail.com",
    "code": "699504",
    "newPassword": "NewSecurePassword123!"
  }
  ```

---

## 👥 Patient Management Endpoints (`/api/patients`)

### 1. `GET /api/patients/pending`
- **Auth**: Required (`Bearer <JWT>`)
- **Description**: Fetches all pending patient registrations requiring staff approval.

### 2. `POST /api/patients/:id/approve`
- **Auth**: Required (`Bearer <JWT>`)
- **Description**: Approves a pending patient and assigns an official Patient ID (`AH000007`). Emits `queue_updated` WebSocket event.

---

## 🎟️ Queue & Token Endpoints (`/api/queue`)

### 1. `POST /api/queue/generate`
- **Description**: Generates a daily sequential token (`M001` or `T001`). Token expires automatically at end of day (5:00 PM).
- **Request Body**: `{ "patientId": "AH000007", "category": "MEDICINE" }`
- **Response**: `{ "tokenNumber": "M001", "servingToken": "M001", "aheadCount": 0 }`

### 2. `GET /api/queue/today`
- **Description**: Returns all tokens generated for today (`generatedAt >= startOfToday`).
