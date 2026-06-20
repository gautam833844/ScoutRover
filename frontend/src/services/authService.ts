import { User, LoginCredentials, RegisterData } from '@/types';
import { AUTH_CONFIG } from '@/constants';
import { generateId, getFromStorage, setToStorage, removeFromStorage } from '@/utils/helpers';

interface StoredUser extends User {
  passwordHash: string;
}

// ========== AUTH SERVICE ==========
class AuthService {
  private getUsers(): StoredUser[] {
    return getFromStorage<StoredUser[]>(AUTH_CONFIG.storageKey, []);
  }

  private saveUsers(users: StoredUser[]): void {
    setToStorage(AUTH_CONFIG.storageKey, users);
  }

  private hashPassword(password: string): string {
    // Simple hash for demo — in production use bcrypt on a server
    return btoa(encodeURIComponent(password));
  }

  private verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }

  private createSession(user: User): void {
    const session = {
      user,
      expiresAt: Date.now() + AUTH_CONFIG.sessionDuration,
    };
    setToStorage(AUTH_CONFIG.sessionKey, session);
  }

  async register(data: RegisterData): Promise<User> {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 800));

    const users = this.getUsers();
    if (users.find(u => u.email.toLowerCase() === data.email.toLowerCase())) {
      throw new Error('An account with this email already exists');
    }

    const user: StoredUser = {
      id: generateId(),
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      passwordHash: this.hashPassword(data.password),
      joinedAt: new Date().toISOString(),
      avatar: '',
      bio: '',
      location: '',
      phone: '',
    };

    users.push(user);
    this.saveUsers(users);

    const { passwordHash: _, ...safeUser } = user;
    this.createSession(safeUser);
    return safeUser;
  }

  async login(credentials: LoginCredentials): Promise<User> {
    await new Promise(r => setTimeout(r, 600));

    const users = this.getUsers();
    const user = users.find(
      u => u.email.toLowerCase() === credentials.email.toLowerCase()
    );

    if (!user || !this.verifyPassword(credentials.password, user.passwordHash)) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    this.saveUsers(users);

    const { passwordHash: _, ...safeUser } = user;
    this.createSession(safeUser);
    return safeUser;
  }

  async resetPassword(email: string): Promise<void> {
    await new Promise(r => setTimeout(r, 1000));

    const users = this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      // Don't reveal if user exists — just succeed silently
      return;
    }
    // In production, send an email with a reset link
  }

  logout(): void {
    removeFromStorage(AUTH_CONFIG.sessionKey);
  }

  getCurrentUser(): User | null {
    const session = getFromStorage<{ user: User; expiresAt: number } | null>(
      AUTH_CONFIG.sessionKey,
      null
    );
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      this.logout();
      return null;
    }
    return session.user;
  }

  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    await new Promise(r => setTimeout(r, 500));

    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) throw new Error('User not found');

    const updated = { ...users[index], ...updates };
    users[index] = updated;
    this.saveUsers(users);

    const { passwordHash: _, ...safeUser } = updated;
    this.createSession(safeUser);
    return safeUser;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    await new Promise(r => setTimeout(r, 500));

    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    if (!this.verifyPassword(currentPassword, user.passwordHash)) {
      throw new Error('Current password is incorrect');
    }

    user.passwordHash = this.hashPassword(newPassword);
    this.saveUsers(users);
  }
}

export const authService = new AuthService();
