import { User, LoginCredentials, RegisterData } from '@/types';
import { apiClient } from './apiClient';

interface BackendUser {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  location?: string;
  phone?: string;
  lastLogin?: string;
  createdAt: string;
}

function mapUserToFrontend(user: BackendUser): User {
  return {
    id: user.id,
    name: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    role: user.role,
    avatar: user.avatar || '',
    bio: user.bio || '',
    location: user.location || '',
    phone: user.phone || '',
    joinedAt: user.createdAt,
    lastLogin: user.lastLogin,
  };
}

class AuthService {
  async register(data: RegisterData): Promise<User> {
    const parts = data.name.trim().split(' ');
    const firstName = parts[0] || 'User';
    const lastName = parts.slice(1).join(' ') || 'Name';

    await apiClient.post<any>('/auth/register', {
      email: data.email,
      password: data.password,
      firstName,
      lastName,
    });

    // Auto log in after successful registration
    return this.login({ email: data.email, password: data.password });
  }

  async login(credentials: LoginCredentials): Promise<User> {
    const response = await apiClient.post<{
      user: BackendUser;
      accessToken: string;
      refreshToken: string;
    }>('/auth/login', credentials);

    const { user, accessToken, refreshToken } = response;
    const frontendUser = mapUserToFrontend(user);

    localStorage.setItem('scoutrover_token', accessToken);
    localStorage.setItem('scoutrover_refresh_token', refreshToken);
    localStorage.setItem('scoutrover_session', JSON.stringify(frontendUser));

    return frontendUser;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout', {});
    } catch {
      // Fail silently on server-side logout
    } finally {
      localStorage.removeItem('scoutrover_token');
      localStorage.removeItem('scoutrover_refresh_token');
      localStorage.removeItem('scoutrover_session');
    }
  }

  async resetPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  }

  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    const sessionStr = localStorage.getItem('scoutrover_session');
    if (!sessionStr) return null;
    try {
      return JSON.parse(sessionStr) as User;
    } catch {
      return null;
    }
  }

  async fetchCurrentUser(): Promise<User> {
    const user = await apiClient.get<BackendUser>('/auth/me');
    const frontendUser = mapUserToFrontend(user);
    localStorage.setItem('scoutrover_session', JSON.stringify(frontendUser));
    return frontendUser;
  }

  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    const backendUpdates: any = { ...updates };
    
    if (updates.name) {
      const parts = updates.name.trim().split(' ');
      backendUpdates.firstName = parts[0] || '';
      backendUpdates.lastName = parts.slice(1).join(' ') || '';
      delete backendUpdates.name;
    }

    const user = await apiClient.put<BackendUser>('/users/profile', backendUpdates);
    const frontendUser = mapUserToFrontend(user);
    localStorage.setItem('scoutrover_session', JSON.stringify(frontendUser));
    return frontendUser;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.put('/users/change-password', {
      currentPassword,
      newPassword,
    });
  }

  async uploadAvatar(formData: FormData): Promise<User> {
    const user = await apiClient.upload<BackendUser>('/users/avatar', formData);
    const frontendUser = mapUserToFrontend(user);
    localStorage.setItem('scoutrover_session', JSON.stringify(frontendUser));
    return frontendUser;
  }
}

export const authService = new AuthService();
export default authService;
