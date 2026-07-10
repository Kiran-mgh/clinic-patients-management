# REST API Documentation - Amar Hospital

This document details the REST API endpoints, payload formats, and schemas for the **Amar Hospital Healthcare Management Platform**.

---

## Authentication & Headers

All authenticated requests must include the JWT token in the HTTP Authorization header:
```http
Authorization: Bearer <JWT_TOKEN>
```

---

## 1. Authentication Endpoints

### Request OTP
* **URL:** `/api/auth/otp/request`
* **Method:** `POST`
* **Payload:**
  ```json
  {
    "mobileNumber": "+919876543210"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "message": "OTP sent successfully",
    "otpCode": "123456" 
  }
  ```
  *(Note: OTP code is returned directly in Development environment for easier testing).*

### Verify OTP & Login
* **URL:** `/api/auth/otp/verify`
* **Method:** `POST`
* **Payload:**
  ```json
  {
    "mobileNumber": "+919876543210",
    "otpCode": "123456"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
    "isNewUser": true,
    "user": {
      "id": "e422fbcd-b14e-4f7f-bd30-6dbca432650a",
      "mobileNumber": "+919876543210",
      "role": "patient"
    }
  }
  ```

---

## 2. Patient Profile & Verification Endpoints

### Register Patient Profile
* **URL:** `/api/patients/register`
* **Method:** `POST`
* **Headers:** `Authorization: Bearer <token>`
* **Payload:**
  ```json
  {
    "fullName": "Kiran Mayan",
    "gender": "Male",
    "dateOfBirth": "1990-05-15",
    "email": "kiran@example.com",
    "bloodGroup": "O+",
    "profession": "Software Engineer",
    "town": "Kochi",
    "isExisting": false,
    "existingPatientId": null
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "id": "e422fbcd-b14e-4f7f-bd30-6dbca432650a",
    "fullName": "Kiran Mayan",
    "status": "pending_approval"
  }
  ```

### Get Current Profile
* **URL:** `/api/patients/profile`
* **Method:** `GET`
* **Headers:** `Authorization: Bearer <token>`
* **Response (200 OK):**
  ```json
  {
    "id": "e422fbcd-b14e-4f7f-bd30-6dbca432650a",
    "patientId": "AH000001",
    "fullName": "Kiran Mayan",
    "gender": "Male",
    "dateOfBirth": "1990-05-15",
    "status": "active",
    "user": {
      "mobileNumber": "+919876543210"
    }
  }
  ```

### List Pending Approvals (Admin/Doctor)
* **URL:** `/api/patients/pending`
* **Method:** `GET`
* **Headers:** `Authorization: Bearer <admin-token>`
* **Response (200 OK):**
  ```json
  [
    {
      "id": "e422fbcd-b14e-4f7f-bd30-6dbca432650a",
      "fullName": "Kiran Mayan",
      "gender": "Male",
      "dateOfBirth": "1990-05-15",
      "status": "pending_approval",
      "isExisting": false,
      "user": {
        "mobileNumber": "+919876543210"
      }
    }
  ]
  ```

### Verify/Approve Patient Profile (Admin/Doctor)
* **URL:** `/api/patients/:id/approve`
* **Method:** `POST`
* **Headers:** `Authorization: Bearer <admin-token>`
* **Payload:**
  ```json
  {
    "patientId": "AH000001"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "message": "Patient approved successfully",
    "patientId": "AH000001",
    "status": "active"
  }
  ```

### Search Patients (Admin/Doctor)
* **URL:** `/api/patients/search`
* **Method:** `GET`
* **Headers:** `Authorization: Bearer <admin-token>`
* **Query Params:** `query=Kiran` (Searches by patient ID, name, or phone number)
* **Response (200 OK):**
  ```json
  [
    {
      "id": "e422fbcd-b14e-4f7f-bd30-6dbca432650a",
      "patientId": "AH000001",
      "fullName": "Kiran Mayan",
      "status": "active"
    }
  ]
  ```

---

## 3. Token & Queue Management Endpoints

### Generate Token (Patient)
* **URL:** `/api/tokens/generate`
* **Method:** `POST`
* **Headers:** `Authorization: Bearer <token>`
* **Payload:**
  ```json
  {
    "serviceType": "medicine" // or "treatment"
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "id": "83cf923d-0129-450f-a42e-839ab136e098",
    "tokenNumber": "M023",
    "serviceType": "medicine",
    "status": "waiting",
    "sequenceNumber": 23,
    "generatedAt": "2026-06-25T08:14:00Z"
  }
  ```

### Get Patient's Token for Today
* **URL:** `/api/tokens/today`
* **Method:** `GET`
* **Headers:** `Authorization: Bearer <token>`
* **Response (200 OK):**
  ```json
  {
    "token": {
      "tokenNumber": "M023",
      "status": "waiting",
      "patientsAhead": 8,
      "estimatedWaitingTimeMinutes": 40
    }
  }
  ```

### Public Queue Status
* **URL:** `/api/tokens/queue-status`
* **Method:** `GET`
* **Response (200 OK):**
  ```json
  {
    "medicine": {
      "currentServing": "M015",
      "totalWaiting": 12
    },
    "treatment": {
      "currentServing": "T002",
      "totalWaiting": 3
    }
  }
  ```

---

## 4. Admin Queue Controls

### Call Next Patient
* **URL:** `/api/queue/call-next`
* **Method:** `POST`
* **Headers:** `Authorization: Bearer <admin-token>`
* **Payload:**
  ```json
  {
    "serviceType": "medicine"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "calledToken": {
      "id": "83cf923d-0129-450f-a42e-839ab136e098",
      "tokenNumber": "M016",
      "status": "in_progress"
    }
  }
  ```

### Update Token Status
* **URL:** `/api/queue/tokens/:id/status`
* **Method:** `PATCH`
* **Headers:** `Authorization: Bearer <admin-token>`
* **Payload:**
  ```json
  {
    "status": "served" // or "cancelled"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "id": "83cf923d-0129-450f-a42e-839ab136e098",
    "status": "served"
  }
  ```

### Get Admin Dashboard Metrics
* **URL:** `/api/queue/dashboard`
* **Method:** `GET`
* **Headers:** `Authorization: Bearer <admin-token>`
* **Response (200 OK):**
  ```json
  {
    "totalPatients": 35,
    "activeTokens": 10,
    "servedTokens": 22,
    "cancelledTokens": 3,
    "pendingApprovalsCount": 4,
    "currentServingMedicine": "M016",
    "currentServingTreatment": "T002"
  }
  ```

### Get Today's Queue List
* **URL:** `/api/queue/today`
* **Method:** `GET`
* **Headers:** `Authorization: Bearer <admin-token>`
* **Response (200 OK):**
  ```json
  [
    {
      "id": "83cf923d-0129-450f-a42e-839ab136e098",
      "tokenNumber": "M016",
      "status": "in_progress",
      "patient": {
        "fullName": "Kiran Mayan",
        "patientId": "AH000001"
      }
    }
  ]
  ```
