// API client for Mobile App connecting directly to NestJS Production Backend
const API_BASE = 'https://pms-api.amarayurveda.in/api';

let currentPushToken: string | null = null;

export const setGlobalPushToken = (pTok: string | null) => {
  if (pTok) {
    currentPushToken = pTok;
  }
};

const getHeaders = (token: string | null, pushToken: string | null = null) => {
  const finalPushToken = pushToken || currentPushToken;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(finalPushToken ? { 'x-push-token': finalPushToken } : {}),
  };
};

const handleResponse = async (response: Response): Promise<any> => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }
  return data;
};

const handleNetworkError = (err: any): never => {
  if (err.name === 'TypeError' || err.message === 'Failed to fetch') {
    throw new Error('Unable to reach the server. Please check your internet connection.');
  }
  throw err;
};

export const api = {
  async post(endpoint: string, body: any, token: string | null = null) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(body),
      });
      return await handleResponse(response);
    } catch (err: any) {
      handleNetworkError(err);
    }
  },

  async get(endpoint: string, token: string | null = null, pushToken: string | null = null) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'GET',
        headers: getHeaders(token, pushToken),
      });
      return await handleResponse(response);
    } catch (err: any) {
      handleNetworkError(err);
    }
  },

  async put(endpoint: string, body: any, token: string | null = null) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'PUT',
        headers: getHeaders(token),
        body: JSON.stringify(body),
      });
      return await handleResponse(response);
    } catch (err: any) {
      handleNetworkError(err);
    }
  },

  async delete(endpoint: string, token: string | null = null) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'DELETE',
        headers: getHeaders(token),
      });
      return await handleResponse(response);
    } catch (err: any) {
      handleNetworkError(err);
    }
  },
};
