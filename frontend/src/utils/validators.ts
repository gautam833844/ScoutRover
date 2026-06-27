import { PATTERNS, AUTH_CONFIG } from '@/constants';

// ========== FORM VALIDATORS ==========

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateEmail(email: string): ValidationResult {
  if (!email.trim()) return { valid: false, error: 'Email is required' };
  if (!PATTERNS.email.test(email)) return { valid: false, error: 'Enter a valid email address' };
  return { valid: true };
}

export function validatePassword(password: string): ValidationResult {
  if (!password) return { valid: false, error: 'Password is required' };
  if (password.length < AUTH_CONFIG.minPasswordLength) {
    return { valid: false, error: `Password must be at least ${AUTH_CONFIG.minPasswordLength} characters` };
  }
  if (!/[a-z]/.test(password)) return { valid: false, error: 'Password must include a lowercase letter' };
  if (!/[A-Z]/.test(password)) return { valid: false, error: 'Password must include an uppercase letter' };
  if (!/\d/.test(password)) return { valid: false, error: 'Password must include a number' };
  return { valid: true };
}

export function validateName(name: string): ValidationResult {
  if (!name.trim()) return { valid: false, error: 'Name is required' };
  if (name.trim().length < 2) return { valid: false, error: 'Name must be at least 2 characters' };
  if (name.trim().length > AUTH_CONFIG.maxNameLength) {
    return { valid: false, error: `Name must be under ${AUTH_CONFIG.maxNameLength} characters` };
  }
  return { valid: true };
}

export function validateConfirmPassword(password: string, confirmPassword: string): ValidationResult {
  if (!confirmPassword) return { valid: false, error: 'Please confirm your password' };
  if (password !== confirmPassword) return { valid: false, error: 'Passwords do not match' };
  return { valid: true };
}

export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 4) return { score, label: 'Medium', color: 'bg-amber-500' };
  return { score, label: 'Strong', color: 'bg-emerald-500' };
}
