import { apiClient } from './apiClient';

type LoginPayload = {
  email: string;
  password: string;
};

const saveSession = (user: unknown, refreshToken: string) => {
  localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('authToken', refreshToken);
  localStorage.setItem('authUser', JSON.stringify(user));
};

export const authService = {
  async getRegisterStatus() {
    return apiClient.request<{ canRegister: boolean; usersCount: number }>('/auth/register-status', {
      auth: false
    });
  },

  async register(payload: { email: string; password: string; companyName?: string }) {
    const data = await apiClient.request<{ user: unknown; refreshToken?: string }>('/auth/register', {
      method: 'POST',
      data: payload,
      auth: false
    });

    if (data?.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('authToken', data.refreshToken);
    }

    if (data?.user) {
      localStorage.setItem('authUser', JSON.stringify(data.user));
    }

    return data;
  },

  async login(payload: LoginPayload) {
    const data = await apiClient.request<{ user: unknown; refreshToken: string }>('/auth/login', {
      method: 'POST',
      data: payload,
      auth: false
    });

    if (data?.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('authToken', data.refreshToken);
    }

    if (data?.user) {
      localStorage.setItem('authUser', JSON.stringify(data.user));
    }

    return data;
  },

  async logout() {
    const refreshToken = localStorage.getItem('refreshToken') || localStorage.getItem('authToken');

    if (refreshToken) {
      try {
        await apiClient.request('/auth/logout', {
          method: 'POST',
          data: { refreshToken }
        });
      } catch {
        // Ignorer erreur réseau côté logout
      }
    }

    localStorage.removeItem('refreshToken');
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  },

  async getProfile() {
    return apiClient.request('/auth/profile');
  },

  async updateProfile(payload: { companyName?: string; profilePicture?: string }) {
    return apiClient.request('/auth/profile', {
      method: 'PUT',
      data: payload
    });
  }
};
