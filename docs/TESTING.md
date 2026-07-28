# 🧪 Testing & Quality Assurance Guide

## ⚙️ Automated Test Suite (Jest)

The NestJS backend includes a Jest testing suite covering core domain services (`AuthService`, `PatientsService`, `TokensService`).

### Running Unit Tests
Navigate to `backend/` and run:
```bash
cd backend
npm run test
```

### Expected Output:
```text
 PASS  src/patients/patients.service.spec.ts
 PASS  src/auth/auth.service.spec.ts
 PASS  src/tokens/tokens.service.spec.ts

Test Suites: 3 passed, 3 total
Tests:       7 passed, 2 skipped, 9 total
Snapshots:   0 total
Time:        2.454 s
```

---

## 🔌 Interactive API Testing via Swagger UI

1. Open **`https://amar.vistarafabtech.com/api/docs`** in your web browser.
2. Enter HTTP Basic Auth credentials:
   - **Username**: `admin`
   - **Password**: `AmarAyurveda2026!`
3. Click on any endpoint (e.g. `POST /api/auth/login`), click **Try it out**, enter request parameters, and click **Execute**.

---

## ⚡ Testing Real-Time WebSocket Synchronization

1. Open the Web Portal **Patient Verification** screen (`https://amar.vistarafabtech.com`).
2. Open the **Amar Ayurveda Mobile App** on a phone or emulator.
3. Submit a new patient registration on the mobile app.
4. **Validation Result**: The new patient record appears instantly on the web portal table **without page refresh**.
