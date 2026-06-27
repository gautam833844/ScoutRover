'use client';

import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
      <div className="relative flex items-center justify-center mb-4">
        {/* Outer spinning ring */}
        <div className="w-16 h-16 rounded-full border-4 border-brand-500/20 border-t-brand-500 animate-spin" />
        {/* Inner pulsing dot */}
        <div className="absolute w-8 h-8 rounded-full bg-brand-500/10 animate-pulse flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-brand-500" />
        </div>
      </div>
      <p className="text-xs font-semibold tracking-wider uppercase text-surface-400 animate-pulse">
        Connecting to dashboard...
      </p>
    </div>
  );
}
