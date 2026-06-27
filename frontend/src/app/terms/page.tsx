'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui';
import { ROUTES } from '@/constants';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between py-12 px-6">
      <div className="max-w-3xl mx-auto w-full">
        <Link href={ROUTES.REGISTER} className="inline-flex items-center gap-2 text-sm text-surface-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Sign Up
        </Link>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Terms of Service</h1>
            <p className="text-xs text-surface-400 mt-1">Last updated: June 27, 2026</p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-surface-300 leading-relaxed border-t border-white/5 pt-6">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">1. Acceptance of Terms</h2>
            <p>
              By accessing and using the Atlas Autonomous Mapping System web console, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">2. Purpose & Use of Service</h2>
            <p>
              Atlas provides visual occupancy grid rendering, LiDAR configuration management, SLAM mapping algorithm settings, and remote teleoperation controls for connected hardware rovers. You represent that you have lawful permission to map and navigate all spaces where you operate rovers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">3. User Accounts</h2>
            <p>
              You are responsible for safeguarding the credentials you use to access the dashboard and for any activities or actions under your account. You agree not to disclose your credentials to any third party.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">4. Hardware & Connection Disclaimer</h2>
            <p>
              Remote control commands (`cmd_vel`) are transmitted via network protocols (WebSockets). Network latency, hardware malfunctions, or signal dropouts may lead to hardware damage or physical collisions. Atlas is not liable for any physical damage or bodily harm caused by autonomous navigation or manual remote control overrides.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">5. Limitation of Liability</h2>
            <p>
              In no event shall Atlas, its authors, or developers be liable for any direct, indirect, incidental, special, or consequential damages resulting from hardware damage, data loss, or system downtime.
            </p>
          </section>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full border-t border-white/5 pt-6 text-center text-xs text-surface-500 mt-12">
        Atlas autonomous mapping system dashboard. Control responsibly.
      </div>
    </div>
  );
}
