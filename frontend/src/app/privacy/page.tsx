'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui';
import { ROUTES } from '@/constants';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between py-12 px-6">
      <div className="max-w-3xl mx-auto w-full">
        <Link href={ROUTES.REGISTER} className="inline-flex items-center gap-2 text-sm text-surface-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Sign Up
        </Link>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
            <p className="text-xs text-surface-400 mt-1">Last updated: June 27, 2026</p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-surface-300 leading-relaxed border-t border-white/5 pt-6">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">1. Information We Collect</h2>
            <p>
              <strong>Profile Information:</strong> We store basic profile details (full name, email address, bio, and locations) securely inside MongoDB to maintain your identity credentials.
            </p>
            <p>
              <strong>Spatial Map Data:</strong> Occupancy grid files (LiDAR scans, Cartesian waypoints, and telemetry routes) created during your sessions are saved on our database for remote availability.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">2. Hardware Telemetry</h2>
            <p>
              LiDAR scan grids and ROS WebSocket connection endpoints are processed entirely client-side inside your browser viewport. No raw live spatial coordinates are broadcast to outside third-party services.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">3. Data Security</h2>
            <p>
              We implement industry-standard encryption, password hashing, and JWT token authorization mechanisms to protect all database contents and network operations.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">4. Your Control Over Data</h2>
            <p>
              You have complete ownership and control over your maps and profile. You can delete individual spatial assets at any time. Clicking "Delete Account" inside Settings permanently purges all records from MongoDB.
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
