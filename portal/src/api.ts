// Production API Client for Amar Hospital Console
let API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

if (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.endsWith('/api')) {
  API_BASE = `${import.meta.env.VITE_API_URL}/api`;
}

const getHeaders = (token: string | null) => {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
    throw new Error('Unable to reach the server. Please check your internet connection or try again later.');
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

  async get(endpoint: string, token: string | null = null) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'GET',
        headers: getHeaders(token),
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

  async patch(endpoint: string, body: any, token: string | null = null) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'PATCH',
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
