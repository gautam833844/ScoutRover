'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock } from 'lucide-react';
import { AuthLayout } from '@/components/layout';
import { Input, Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { validateEmail, validatePassword } from '@/utils/validators';
import { ROUTES } from '@/constants';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { success, error: showError } = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    const emailResult = validateEmail(form.email);
    if (!emailResult.valid) e.email = emailResult.error!;
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleBlur = (field: 'email' | 'password') => {
    if (field === 'email') {
      const emailResult = validateEmail(form.email);
      setErrors(prev => ({ ...prev, email: emailResult.valid ? '' : emailResult.error! }));
    } else if (field === 'password') {
      setErrors(prev => ({ ...prev, password: form.password ? '' : 'Password is required' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await login({ email: form.email, password: form.password });
      success('Welcome back!', 'You have been signed in successfully.');
      router.push(ROUTES.DASHBOARD);
    } catch (err: any) {
      showError('Login failed', err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your Atlas account">
      <form onSubmit={handleSubmit} className="space-y-5">
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
          autoFocus
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          onBlur={() => handleBlur('password')}
          error={errors.password}
          leftIcon={<Lock className="w-4 h-4" />}
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500" />
            <span className="text-surface-600 dark:text-surface-400">Remember me</span>
          </label>
          <Link href={ROUTES.FORGOT_PASSWORD} className="text-brand-600 dark:text-brand-400 hover:underline font-medium">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" variant="primary" loading={loading} className="w-full">
          Sign in
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
        <Button variant="outline" type="button" className="w-full" onClick={() => success('OAuth Login', 'Redirecting to Google OAuth... (Demo)')}>
          Google
        </Button>
        <Button variant="outline" type="button" className="w-full" onClick={() => success('OAuth Login', 'Redirecting to GitHub OAuth... (Demo)')}>
          GitHub
        </Button>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-surface-500 dark:text-surface-400">
          Don&apos;t have an account?{' '}
          <Link href={ROUTES.REGISTER} className="text-brand-600 dark:text-brand-400 hover:underline font-semibold">
            Create account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
