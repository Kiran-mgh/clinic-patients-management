// API client for Mobile App with live simulation logic
const API_BASE = 'https://amar.vistarafabtech.com/api';

let isBackendConnected = true;

// In-memory mock patient storage
let mockPatientProfile: any = null;
let mockActiveToken: any = null;
let mockServingMedicineSeq = 4;
let mockServingTreatmentSeq = 1;

export const api = {
  // Config getter
  isMockMode() {
    return !isBackendConnected;
  },

  async post(endpoint: string, body: any, token: string | null = null) {
    if (isBackendConnected) {
      try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || 'Request failed');
        }
        return await response.json();
      } catch (e: any) {
        if (e.message === 'Failed to fetch' || e.name === 'TypeError') {
          console.warn('[Mobile API] Backend offline. Falling back to local mock simulator.');
          isBackendConnected = false;
        } else {
          throw e;
        }
      }
    }
    return mockMobileApi.post(endpoint, body);
  },

  async get(endpoint: string, token: string | null = null) {
    if (isBackendConnected) {
      try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || 'Request failed');
        }
        return await response.json();
      } catch (e: any) {
        if (e.message === 'Failed to fetch' || e.name === 'TypeError') {
          console.warn('[Mobile API] Backend offline. Falling back to local mock simulator.');
          isBackendConnected = false;
        } else {
          throw e;
        }
      }
    }
    return mockMobileApi.get(endpoint);
  },
};

const mockMobileApi = {
  async post(endpoint: string, body: any) {
    // 1. OTP Request
    if (endpoint === '/auth/otp/request') {
      return { message: 'OTP sent successfully' };
    }

    // 2. OTP Verify
    if (endpoint === '/auth/otp/verify') {
      return {
        accessToken: 'mock_mobile_jwt_token',
        isNewUser: mockPatientProfile === null,
        user: { id: 'patient_user_1', mobileNumber: body.mobileNumber, role: 'patient' },
      };
    }

    // 2b. Firebase Token Login
    if (endpoint === '/auth/firebase/login') {
      return {
        accessToken: 'mock_mobile_jwt_token',
        isNewUser: mockPatientProfile === null,
        user: { id: 'patient_user_1', mobileNumber: '+919876543210', role: 'patient' },
      };
    }

    // 3. Register Patient Profile
    if (endpoint === '/patients/register') {
      let status = 'pending_approval';
      if (body.isExisting && !body.existingPatientId) {
        status = 'pending_verification';
      }
      mockPatientProfile = {
        id: 'patient_user_1',
        fullName: body.fullName,
        gender: body.gender,
        dateOfBirth: body.dateOfBirth,
        email: body.email,
        bloodGroup: body.bloodGroup,
        profession: body.profession,
        town: body.town,
        status,
        patientId: body.isExisting ? body.existingPatientId : null,
      };
      return mockPatientProfile;
    }

    // 4. Generate Token
    if (endpoint === '/tokens/generate') {
      if (!mockPatientProfile) {
        throw new Error('Please register first.');
      }
      if (mockPatientProfile.status !== 'active') {
        throw new Error(
          'Your registration is under verification. You will be able to generate tokens once your Patient ID has been assigned by the clinic.'
        );
      }

      // Check Timing: 6:00 AM to 4:30 PM (16:30)
      const now = new Date();
      const hour = now.getHours();
      const min = now.getMinutes();
      if (hour < 6 || hour > 16 || (hour === 16 && min > 30)) {
        throw new Error(
          'Token generation is closed for today. Please generate your token tomorrow after 6:00 AM.'
        );
      }

      // Check Weekday for Treatment: Tuesday (2) and Wednesday (3)
      if (body.serviceType === 'treatment') {
        const day = now.getDay();
        if (day !== 2 && day !== 3) {
          throw new Error('Treatment services are available only on Tuesday and Wednesday.');
        }
      }

      if (mockActiveToken) {
        throw new Error("You have already generated today's token.");
      }

      const seq = body.serviceType === 'medicine' ? 12 : 3;
      const prefix = body.serviceType === 'medicine' ? 'M' : 'T';
      mockActiveToken = {
        id: 't_mock_1',
        tokenNumber: `${prefix}0${seq}`,
        status: 'waiting',
        serviceType: body.serviceType,
        sequenceNumber: seq,
        patientsAhead: seq - (body.serviceType === 'medicine' ? mockServingMedicineSeq : mockServingTreatmentSeq),
        estimatedWaitingTimeMinutes: (seq - (body.serviceType === 'medicine' ? mockServingMedicineSeq : mockServingTreatmentSeq)) * 5,
        currentServing: `${prefix}0${body.serviceType === 'medicine' ? mockServingMedicineSeq : mockServingTreatmentSeq}`,
        generatedAt: now.toISOString(),
      };
      return mockActiveToken;
    }

    throw new Error(`Mock endpoint not configured: ${endpoint}`);
  },

  async get(endpoint: string) {
    // 1. Get profile
    if (endpoint === '/patients/profile') {
      if (!mockPatientProfile) {
        throw new Error('Profile not found');
      }
      return mockPatientProfile;
    }

    // 2. Get today's token
    if (endpoint === '/tokens/today') {
      // Simulate live queue updates: every time we read, we increment serving sequence slightly
      if (mockActiveToken && mockActiveToken.status === 'waiting') {
        if (mockActiveToken.serviceType === 'medicine') {
          // Increment serving medicine sequence randomly up to the patient's token
          if (mockServingMedicineSeq < mockActiveToken.sequenceNumber && Math.random() > 0.6) {
            mockServingMedicineSeq++;
          }
          const diff = mockActiveToken.sequenceNumber - mockServingMedicineSeq;
          if (diff <= 0) {
            mockActiveToken.status = 'in_progress';
            mockActiveToken.patientsAhead = 0;
            mockActiveToken.estimatedWaitingTimeMinutes = 0;
          } else {
            mockActiveToken.patientsAhead = diff;
            mockActiveToken.estimatedWaitingTimeMinutes = diff * 5;
          }
          mockActiveToken.currentServing = `M${mockServingMedicineSeq.toString().padStart(3, '0')}`;
        } else {
          if (mockServingTreatmentSeq < mockActiveToken.sequenceNumber && Math.random() > 0.7) {
            mockServingTreatmentSeq++;
          }
          const diff = mockActiveToken.sequenceNumber - mockServingTreatmentSeq;
          if (diff <= 0) {
            mockActiveToken.status = 'in_progress';
            mockActiveToken.patientsAhead = 0;
            mockActiveToken.estimatedWaitingTimeMinutes = 0;
          } else {
            mockActiveToken.patientsAhead = diff;
            mockActiveToken.estimatedWaitingTimeMinutes = diff * 5;
          }
          mockActiveToken.currentServing = `T${mockServingTreatmentSeq.toString().padStart(3, '0')}`;
        }
      }
      return { token: mockActiveToken };
    }

    // 3. Queue status
    if (endpoint === '/tokens/queue-status') {
      return {
        medicine: {
          currentServing: `M${mockServingMedicineSeq.toString().padStart(3, '0')}`,
          totalWaiting: 8,
        },
        treatment: {
          currentServing: `T${mockServingTreatmentSeq.toString().padStart(3, '0')}`,
          totalWaiting: 2,
        },
      };
    }

    throw new Error(`Mock endpoint not configured: ${endpoint}`);
  },

  // Developer mock commands
  helperSimulateApproval(patientId: string) {
    if (mockPatientProfile) {
      mockPatientProfile.status = 'active';
      mockPatientProfile.patientId = patientId;
    }
  },
  helperSimulateServe() {
    if (mockActiveToken) {
      mockActiveToken.status = 'served';
    }
  },
  helperSimulateCancel() {
    if (mockActiveToken) {
      mockActiveToken.status = 'cancelled';
    }
  },
};

// Expose simulation controller on window object for testing
if (typeof window !== 'undefined') {
  (window as any).mockMobileSimulator = mockMobileApi;
}
export const mockMobileSimulator = mockMobileApi;
