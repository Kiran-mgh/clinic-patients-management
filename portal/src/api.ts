// API Client with automatic mock data fallback
let API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

if (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.endsWith('/api')) {
  API_BASE = `${import.meta.env.VITE_API_URL}/api`;
}

// Helper to get auth header
const getHeaders = (token: string | null) => {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Check if backend is alive
let isBackendConnected = true;

// Initialize mock DB in localStorage if empty
const initMockDb = () => {
  if (!localStorage.getItem('amar_mock_patients')) {
    localStorage.setItem('amar_mock_patients', JSON.stringify([
      { id: '1', patientId: 'AH000001', fullName: 'Arun Kumar', gender: 'Male', dateOfBirth: '1970-04-12', email: 'arun@example.com', bloodGroup: 'O+', profession: 'Farmer', town: 'Palakkad', status: 'active', isExisting: true, user: { mobileNumber: '+919447123456' }, createdAt: new Date().toISOString() },
      { id: '2', patientId: null, fullName: 'Devi Nair', gender: 'Female', dateOfBirth: '1985-08-22', email: 'devi@example.com', bloodGroup: 'A+', profession: 'Teacher', town: 'Kottayam', status: 'pending_approval', isExisting: false, user: { mobileNumber: '+919447111222' }, createdAt: new Date().toISOString() },
      { id: '3', patientId: null, fullName: 'George Kutty', gender: 'Male', dateOfBirth: '1952-11-02', email: '', bloodGroup: 'B+', profession: 'Retired', town: 'Thodupuzha', status: 'pending_verification', isExisting: true, user: { mobileNumber: '+919846555666' }, createdAt: new Date().toISOString() },
    ]));
  }
  if (!localStorage.getItem('amar_mock_tokens')) {
    localStorage.setItem('amar_mock_tokens', JSON.stringify([
      { id: 't1', tokenNumber: 'M001', serviceType: 'medicine', status: 'served', sequenceNumber: 1, patient: { fullName: 'Arun Kumar', patientId: 'AH000001' }, generatedAt: new Date().toISOString() },
      { id: 't2', tokenNumber: 'M002', serviceType: 'medicine', status: 'in_progress', sequenceNumber: 2, patient: { fullName: 'George Kutty', patientId: 'AH000002' }, generatedAt: new Date().toISOString() },
    ]));
  }
};
initMockDb();

// Request helpers
export const api = {
  async post(endpoint: string, body: any, token: string | null = null) {
    if (isBackendConnected) {
      try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
          method: 'POST',
          headers: getHeaders(token),
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || 'Request failed');
        }
        return await response.json();
      } catch (e: any) {
        if (e.message === 'Failed to fetch' || e.name === 'TypeError') {
          console.warn('[API Client] Backend offline. Falling back to local mock data.');
          isBackendConnected = false;
        } else {
          throw e;
        }
      }
    }
    return mockApi.post(endpoint, body);
  },

  async get(endpoint: string, token: string | null = null) {
    if (isBackendConnected) {
      try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
          method: 'GET',
          headers: getHeaders(token),
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || 'Request failed');
        }
        return await response.json();
      } catch (e: any) {
        if (e.message === 'Failed to fetch' || e.name === 'TypeError') {
          console.warn('[API Client] Backend offline. Falling back to local mock data.');
          isBackendConnected = false;
        } else {
          throw e;
        }
      }
    }
    return mockApi.get(endpoint);
  },

  async patch(endpoint: string, body: any, token: string | null = null) {
    if (isBackendConnected) {
      try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
          method: 'PATCH',
          headers: getHeaders(token),
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || 'Request failed');
        }
        return await response.json();
      } catch (e: any) {
        if (e.message === 'Failed to fetch' || e.name === 'TypeError') {
          console.warn('[API Client] Backend offline. Falling back to local mock data.');
          isBackendConnected = false;
        } else {
          throw e;
        }
      }
    }
    return mockApi.patch(endpoint, body);
  },
};

// In-browser Mock Implementation
const mockApi = {
  getPatients() {
    return JSON.parse(localStorage.getItem('amar_mock_patients') || '[]');
  },
  savePatients(p: any[]) {
    localStorage.setItem('amar_mock_patients', JSON.stringify(p));
  },
  getTokens() {
    return JSON.parse(localStorage.getItem('amar_mock_tokens') || '[]');
  },
  saveTokens(t: any[]) {
    localStorage.setItem('amar_mock_tokens', JSON.stringify(t));
  },

  async post(endpoint: string, body: any) {
    // 1. Password Login Mock
    if (endpoint === '/auth/login') {
      return {
        accessToken: 'mock_jwt_token_123',
        isNewUser: false,
        user: { id: 'admin_1', mobileNumber: body.identifier || '9999999999', email: 'doctor@amarhospital.com', role: 'admin', name: 'Dr. Amar' },
      };
    }
    // 2. Password Reset Request Mock
    if (endpoint === '/auth/password/reset-request') {
      return { message: `Password reset link generated and sent to ${body.email || 'your email'}.` };
    }
    // 3. Password Reset Mock
    if (endpoint === '/auth/password/reset') {
      return { message: 'Password reset successfully. You can now log in.' };
    }
    // 4. Legacy OTP request
    if (endpoint === '/auth/otp/request') {
      return { message: 'OTP sent successfully', otpCode: '000000' };
    }
    // 5. Legacy OTP verify
    if (endpoint === '/auth/otp/verify') {
      return {
        accessToken: 'mock_jwt_admin_token',
        isNewUser: false,
        user: { id: 'admin_1', mobileNumber: body.mobileNumber, role: 'admin' },
      };
    }
    // 6. Approve patient
    if (endpoint.startsWith('/patients/') && endpoint.endsWith('/approve')) {
      const parts = endpoint.split('/');
      const id = parts[2];
      const patients = this.getPatients();
      const patient = patients.find((p: any) => p.id === id);
      if (!patient) throw new Error('Patient not found');

      patient.status = 'active';
      patient.patientId = body.patientId || `AH${Math.floor(100000 + Math.random() * 900000)}`;
      this.savePatients(patients);
      return { message: 'Patient approved successfully', patientId: patient.patientId, status: 'active' };
    }
    // 7. Create patient by staff
    if (endpoint === '/patients/create') {
      const patients = this.getPatients();
      const duplicate = patients.find((p: any) => p.user?.mobileNumber === body.mobileNumber);
      if (duplicate) {
        throw new Error('Patient profile already exists for this mobile number');
      }
      let patientId = body.existingPatientId;
      if (!patientId) {
        const lastPatient = [...patients]
          .filter(p => p.patientId && p.patientId.startsWith('AH'))
          .sort((a, b) => b.patientId.localeCompare(a.patientId))[0];
        if (lastPatient) {
          const num = parseInt(lastPatient.patientId.replace('AH', ''), 10) + 1;
          patientId = `AH${num.toString().padStart(6, '0')}`;
        } else {
          patientId = 'AH000001';
        }
      }
      const newPatient = {
        id: `p_${Date.now()}`,
        patientId,
        fullName: body.fullName,
        gender: body.gender,
        dateOfBirth: body.dateOfBirth,
        email: body.email || '',
        bloodGroup: body.bloodGroup || '',
        profession: body.profession,
        town: body.town,
        status: 'active',
        isExisting: body.isExisting,
        user: { mobileNumber: body.mobileNumber },
        createdAt: new Date().toISOString()
      };
      patients.push(newPatient);
      this.savePatients(patients);
      return newPatient;
    }
    // 8. Call next token
    if (endpoint === '/queue/call-next') {
      const tokens = this.getTokens();
      tokens.forEach((t: any) => {
        if (t.serviceType === body.serviceType && t.status === 'in_progress') {
          t.status = 'served';
        }
      });
      const waiting = tokens.find((t: any) => t.serviceType === body.serviceType && t.status === 'waiting');
      if (!waiting) throw new Error(`No waiting patients in the ${body.serviceType} queue today.`);
      waiting.status = 'in_progress';
      this.saveTokens(tokens);
      return waiting;
    }
    throw new Error('Endpoint not implemented in mock database');
  },

  async get(endpoint: string) {
    if (endpoint.startsWith('/queue/reports')) {
      const params = new URLSearchParams(endpoint.split('?')[1]);
      const startDateStr = params.get('startDate') || '';
      const endDateStr = params.get('endDate') || '';
      
      const start = new Date(startDateStr);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDateStr);
      end.setHours(23, 59, 59, 999);
      
      const tokens = this.getTokens();
      const filtered = tokens.filter((t: any) => {
        const date = new Date(t.generatedAt);
        return t.status === 'served' && date >= start && date <= end;
      });
      
      const medicine = filtered.filter((t: any) => t.serviceType === 'medicine').length;
      const treatment = filtered.filter((t: any) => t.serviceType === 'treatment').length;
      
      const monthlyMap = new Map<string, { month: string; medicine: number; treatment: number; total: number }>();
      filtered.forEach((t: any) => {
        const date = new Date(t.generatedAt);
        const monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, { month: monthKey, medicine: 0, treatment: 0, total: 0 });
        }
        const data = monthlyMap.get(monthKey)!;
        data.total++;
        if (t.serviceType === 'medicine') data.medicine++;
        if (t.serviceType === 'treatment') data.treatment++;
      });
      
      return {
        summary: {
          medicineCount: medicine,
          treatmentCount: treatment,
          totalCount: filtered.length
        },
        monthlyBreakdown: Array.from(monthlyMap.values()),
        visits: filtered.map((t: any) => ({
          tokenId: t.id,
          tokenNumber: t.tokenNumber,
          serviceType: t.serviceType,
          status: t.status,
          date: t.generatedAt,
          patientId: t.patient?.id || '',
          patientName: t.patient?.fullName || '',
          patientCustomId: t.patient?.patientId || '',
        }))
      };
    }

    if (endpoint.startsWith('/patients/') && endpoint.endsWith('/detail')) {
      const parts = endpoint.split('/');
      const id = parts[2];
      const patients = this.getPatients();
      const patient = patients.find((p: any) => p.id === id);
      if (!patient) throw new Error('Patient not found');

      const allTokens = this.getTokens();
      const patientTokens = allTokens.filter((t: any) => t.patient?.fullName === patient.fullName || t.patientId === patient.id);
      patientTokens.sort((a: any, b: any) => new Date(b.generatedAt || 0).getTime() - new Date(a.generatedAt || 0).getTime());

      return {
        ...patient,
        tokens: patientTokens
      };
    }
    if (endpoint === '/patients/pending') {
      return this.getPatients().filter((p: any) => p.status === 'pending_approval' || p.status === 'pending_verification');
    }
    if (endpoint.startsWith('/patients/search')) {
      const params = new URLSearchParams(endpoint.split('?')[1]);
      const query = params.get('query')?.toLowerCase() || '';
      return this.getPatients().filter((p: any) => 
        p.fullName.toLowerCase().includes(query) || 
        (p.patientId && p.patientId.toLowerCase().includes(query)) ||
        p.user.mobileNumber.includes(query)
      );
    }
    if (endpoint === '/queue/today') {
      return this.getTokens();
    }
    if (endpoint === '/queue/dashboard') {
      const tokens = this.getTokens();
      const patients = this.getPatients();

      const active = tokens.filter((t: any) => t.status === 'waiting' || t.status === 'in_progress').length;
      const served = tokens.filter((t: any) => t.status === 'served').length;
      const cancelled = tokens.filter((t: any) => t.status === 'cancelled').length;
      const pending = patients.filter((p: any) => p.status === 'pending_approval' || p.status === 'pending_verification').length;

      const servingMed = tokens.find((t: any) => t.serviceType === 'medicine' && t.status === 'in_progress')?.tokenNumber || 'None';
      const servingTreat = tokens.find((t: any) => t.serviceType === 'treatment' && t.status === 'in_progress')?.tokenNumber || 'None';

      return {
        totalPatients: tokens.length,
        activeTokens: active,
        servedTokens: served,
        cancelledTokens: cancelled,
        pendingApprovalsCount: pending,
        currentServingMedicine: servingMed,
        currentServingTreatment: servingTreat,
      };
    }
    throw new Error('Endpoint not implemented in mock database');
  },

  async patch(endpoint: string, body: any) {
    if (endpoint.startsWith('/queue/tokens/') && endpoint.endsWith('/status')) {
      const parts = endpoint.split('/');
      const id = parts[3];
      const tokens = this.getTokens();
      const token = tokens.find((t: any) => t.id === id);
      if (!token) throw new Error('Token not found');

      token.status = body.status;
      this.saveTokens(tokens);
      return token;
    }
    throw new Error('Endpoint not implemented in mock database');
  },
};
