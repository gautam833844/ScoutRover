'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, AuthState, LoginCredentials, RegisterData, Toast } from '@/types';
import { authService } from '@/services/authService';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Check for existing session on mount
  useEffect(() => {
    const user = authService.getCurrentUser();
    setState({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    });
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const user = await authService.login(credentials);
    setState({ user, isAuthenticated: true, isLoading: false });
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const user = await authService.register(data);
    setState({ user, isAuthenticated: true, isLoading: false });
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await authService.resetPassword(email);
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!state.user) throw new Error('Not authenticated');
    const user = await authService.updateProfile(state.user.id, updates);
    setState(prev => ({ ...prev, user }));
  }, [state.user]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!state.user) throw new Error('Not authenticated');
    await authService.changePassword(state.user.id, currentPassword, newPassword);
  }, [state.user]);

  return (
    <AuthContext.Provider value={{
      ...state, login, register, logout, resetPassword, updateProfile, changePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
