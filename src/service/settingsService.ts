import { apiClient } from './apiClient';

type CompanySettings = {
  companyName: string;
  companyNumber: string;
  companyEmail: string;
  password: string;
  profilePhoto: string;
};

const normalizeCompanySettings = (raw: any): Partial<CompanySettings> => {
  if (!raw || typeof raw !== 'object') {
    return {};
  }

  const normalized: Partial<CompanySettings> = {};

  if (raw.companyName !== undefined) {
    normalized.companyName = raw.companyName;
  }
  if (raw.companyNumber !== undefined) {
    normalized.companyNumber = raw.companyNumber;
  }

  const normalizedEmail = raw.companyEmail ?? raw.email;
  if (normalizedEmail !== undefined) {
    normalized.companyEmail = normalizedEmail;
  }

  if (raw.password !== undefined) {
    normalized.password = raw.password;
  }

  const normalizedProfilePhoto = raw.profilePhoto ?? raw.profilePicture;
  if (normalizedProfilePhoto !== undefined) {
    normalized.profilePhoto = normalizedProfilePhoto;
  }

  return normalized;
};

const buildAuthProfilePayload = (payload: Partial<CompanySettings>) => ({
  ...(payload.companyName !== undefined ? { companyName: payload.companyName } : {}),
  ...(payload.profilePhoto !== undefined ? { profilePicture: payload.profilePhoto } : {})
});

export const settingsService = {
  async getCompanySettings() {
    // Endpoint documenté: GET /auth/profile (Protected)
    const authProfile = await apiClient.request<any>('/auth/profile');
    return normalizeCompanySettings(authProfile);
  },

  async updateCompanySettings(payload: Partial<CompanySettings>) {
    const authPayload = buildAuthProfilePayload(payload);

    if (Object.keys(authPayload).length === 0) {
      return normalizeCompanySettings(payload);
    }

    // Endpoint documenté: PUT /auth/profile (Protected)
    try {
      const updated = await apiClient.request<any>('/auth/profile', {
        method: 'PUT',
        data: authPayload
      });
      return normalizeCompanySettings(updated);
    } catch (error) {
      const status = (error as { status?: number })?.status;
      if (status === 413) {
        throw new Error('Image trop volumineuse pour le serveur. Choisissez une image plus légère.');
      }
      throw error;
    }
  }
};
