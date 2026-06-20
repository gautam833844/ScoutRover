'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { AuthLayout } from '@/components/layout';
import { Input, Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { validateEmail } from '@/utils/validators';
import { ROUTES } from '@/constants';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const { success, error: showError } = useToast();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateEmail(email);
    if (!result.valid) { setEmailError(result.error!); return; }
    setEmailError('');

    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      success('Email sent!', 'Check your inbox for reset instructions.');
    } catch (err: any) {
      showError('Error', err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout title="Check your email" subtitle="We've sent password reset instructions">
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <p className="text-surface-600 dark:text-surface-400 mb-2">
            We&apos;ve sent a password reset link to
          </p>
          <p className="font-semibold text-surface-900 dark:text-white mb-6">{email}</p>
          <p className="text-sm text-surface-500 mb-8">
            Didn&apos;t receive the email? Check your spam folder or{' '}
            <button onClick={() => setSent(false)} className="text-brand-600 dark:text-brand-400 hover:underline font-medium">
              try again
            </button>
          </p>
          <Link href={ROUTES.LOGIN}>
            <Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />}>
              Back to sign in
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot password?" subtitle="Enter your email and we'll send you reset instructions">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          error={emailError}
          leftIcon={<Mail className="w-4 h-4" />}
          autoComplete="email"
        />

        <Button type="submit" variant="primary" loading={loading} className="w-full">
          Send reset link
        </Button>
      </form>

      <div className="mt-8 text-center">
        <Link href={ROUTES.LOGIN} className="inline-flex items-center gap-2 text-sm text-surface-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
