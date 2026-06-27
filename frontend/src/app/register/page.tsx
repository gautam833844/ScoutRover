'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User } from 'lucide-react';
import { AuthLayout } from '@/components/layout';
import { Input, Button, PasswordStrength } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { validateEmail, validatePassword, validateName, validateConfirmPassword } from '@/utils/validators';
import { ROUTES } from '@/constants';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { success, error: showError } = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    const nameResult = validateName(form.name);
    if (!nameResult.valid) e.name = nameResult.error!;
    const emailResult = validateEmail(form.email);
    if (!emailResult.valid) e.email = emailResult.error!;
    const pwResult = validatePassword(form.password);
    if (!pwResult.valid) e.password = pwResult.error!;
    const confirmResult = validateConfirmPassword(form.password, form.confirmPassword);
    if (!confirmResult.valid) e.confirmPassword = confirmResult.error!;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleBlur = (field: 'name' | 'email' | 'password' | 'confirmPassword') => {
    if (field === 'name') {
      const result = validateName(form.name);
      setErrors(prev => ({ ...prev, name: result.valid ? '' : result.error! }));
    } else if (field === 'email') {
      const result = validateEmail(form.email);
      setErrors(prev => ({ ...prev, email: result.valid ? '' : result.error! }));
    } else if (field === 'password') {
      const result = validatePassword(form.password);
      setErrors(prev => ({ ...prev, password: result.valid ? '' : result.error! }));
    } else if (field === 'confirmPassword') {
      const result = validateConfirmPassword(form.password, form.confirmPassword);
      setErrors(prev => ({ ...prev, confirmPassword: result.valid ? '' : result.error! }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await register(form);
      success('Account created!', 'Welcome to Atlas.');
      router.push(ROUTES.DASHBOARD);
    } catch (err: any) {
      showError('Registration failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create an account" subtitle="Join Atlas and start mapping">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Full name"
          type="text"
          placeholder="John Doe"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          onBlur={() => handleBlur('name')}
          error={errors.name}
          leftIcon={<User className="w-4 h-4" />}
          autoComplete="name"
          autoFocus
        />

        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          onBlur={() => handleBlur('email')}
          error={errors.email}
          leftIcon={<Mail className="w-4 h-4" />}
          autoComplete="email"
        />

        <div>
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            onBlur={() => handleBlur('password')}
            error={errors.password}
            leftIcon={<Lock className="w-4 h-4" />}
            autoComplete="new-password"
          />
          <PasswordStrength password={form.password} />
        </div>

        <Input
          label="Confirm password"
          type="password"
          placeholder="••••••••"
          value={form.confirmPassword}
          onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
          onBlur={() => handleBlur('confirmPassword')}
          error={errors.confirmPassword}
          leftIcon={<Lock className="w-4 h-4" />}
          autoComplete="new-password"
        />

        <div className="flex items-start gap-2">
          <input type="checkbox" className="w-4 h-4 mt-0.5 rounded border-surface-300 text-brand-600 focus:ring-brand-500" required />
          <span className="text-sm text-surface-500 dark:text-surface-400">
            I agree to the{' '}
            <Link href="/terms" className="text-brand-600 dark:text-brand-400 hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-brand-600 dark:text-brand-400 hover:underline">
              Privacy Policy
            </Link>
          </span>
        </div>

        <Button type="submit" variant="primary" loading={loading} className="w-full">
          Create account
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-surface-200 dark:border-white/[0.08]" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-dark-card px-2 text-surface-500">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" type="button" className="w-full" onClick={() => success('OAuth Registration', 'Redirecting to Google OAuth... (Demo)')}>
          Google
        </Button>
        <Button variant="outline" type="button" className="w-full" onClick={() => success('OAuth Registration', 'Redirecting to GitHub OAuth... (Demo)')}>
          GitHub
        </Button>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-surface-500 dark:text-surface-400">
          Already have an account?{' '}
          <Link href={ROUTES.LOGIN} className="text-brand-600 dark:text-brand-400 hover:underline font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
