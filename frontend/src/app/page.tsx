'use client';

import React from 'react';
import Link from 'next/link';
import { Map, QrCode, Compass, Shield, Smartphone, Zap, ArrowRight, Star, Users, Globe, ChevronRight, Activity, Wifi, BarChart3 } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Button, Section } from '@/components/ui';
import { FeatureCard } from '@/components/cards';
import { ROUTES, APP_CONFIG } from '@/constants';

export default function HomePage() {
  return (
    <div className="bg-white dark:bg-dark-bg min-h-screen">
      <Header />

      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-hero-gradient">
        {/* Background effects */}
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="absolute inset-0 bg-glow-gradient" />
        <div className="absolute top-1/4 -right-32 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8 animate-fade-in-down">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-white/60">v{APP_CONFIG.version} — Now with dual map modes & QR scanning</span>
            </div>

            {/* Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight mb-6 animate-fade-in-up">
              Autonomous Mapping
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-400 via-purple-400 to-cyan-400 animate-gradient bg-[length:200%]">
                Reimagined
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed mb-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Real-time LiDAR mapping, SLAM navigation, and remote rover control all from your browser.
              Professional-grade tools for exploration and mapping.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <Link href={ROUTES.REGISTER}>
                <Button variant="primary" size="lg" iconRight={<ArrowRight className="w-5 h-5" />}>
                  Get Started Free
                </Button>
              </Link>
              <Link href={ROUTES.DASHBOARD}>
                <Button variant="ghost" size="lg" className="!text-white/70 hover:!text-white hover:!bg-white/10 border border-white/10">
                  View Dashboard
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-white/[0.06] max-w-xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
              {[
                { value: '100%', label: 'Maps Generated' },
                { value: '99.9%', label: 'Uptime' },
                { value: '50ms', label: 'Response Time' },
              ].map(stat => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-white/40 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-dark-bg to-transparent" />
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <Section id="features" className="bg-white dark:bg-dark-bg">
        <div className="text-center mb-16">
          <span className="badge-brand mb-4 inline-block">Features</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 dark:text-white mb-4">
            Everything You Need for
            <span className="gradient-text"> Autonomous Mapping</span>
          </h2>
          <p className="text-surface-500 dark:text-surface-400 max-w-2xl mx-auto">
            From real-time rover control to advanced mapping and QR utilities — ScoutRover gives you professional tools in one unified platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Map className="w-6 h-6" />}
            title="Dual Map Modes"
            description="Switch between standard street maps, satellite imagery, and live LiDAR data from your rover in real-time."
          />
          <FeatureCard
            icon={<Compass className="w-6 h-6" />}
            title="SLAM Navigation"
            description="Simultaneous Localization and Mapping powered by ROS for precise autonomous navigation."
          />
          <FeatureCard
            icon={<QrCode className="w-6 h-6" />}
            title="QR Code Tools"
            description="Generate custom QR codes and scan them using your device camera or by uploading images."
          />
          <FeatureCard
            icon={<Wifi className="w-6 h-6" />}
            title="Real-time Control"
            description="Control your rover with keyboard, touch, or mouse — with live telemetry and status updates."
          />
          <FeatureCard
            icon={<Shield className="w-6 h-6" />}
            title="Secure Auth"
            description="Protected routes, session management, and secure authentication for your rover dashboard."
          />
          <FeatureCard
            icon={<Smartphone className="w-6 h-6" />}
            title="Fully Responsive"
            description="Works flawlessly on phones, tablets, laptops, and desktops — control your rover from anywhere."
          />
        </div>
      </Section>

      {/* ===== STATS SECTION ===== */}
      <Section className="bg-surface-50 dark:bg-dark-card/50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-12">
          {[
            { icon: <Activity className="w-6 h-6" />, value: '99.9%', label: 'System Uptime', desc: 'Always available' },
            { icon: <Globe className="w-6 h-6" />, value: '3', label: 'Map Modes', desc: 'Standard, Satellite, LiDAR' },
            { icon: <Zap className="w-6 h-6" />, value: '<50ms', label: 'Latency', desc: 'Real-time control' },
            { icon: <BarChart3 className="w-6 h-6" />, value: '100%', label: 'Responsive', desc: 'All screen sizes' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div className="mx-auto w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3">
                {stat.icon}
              </div>
              <p className="text-3xl font-bold text-surface-900 dark:text-white">{stat.value}</p>
              <p className="text-sm font-medium text-surface-700 dark:text-surface-300 mt-1">{stat.label}</p>
              <p className="text-xs text-surface-400 mt-0.5">{stat.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ===== CTA SECTION ===== */}
      <Section className="bg-white dark:bg-dark-bg">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 via-brand-500 to-cyan-500 p-12 sm:p-16 text-center">
          <div className="absolute inset-0 bg-grid opacity-10" />
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Explore?
            </h2>
            <p className="text-white/70 max-w-xl mx-auto mb-8">
              Start mapping your environment with ScoutRover&apos;s powerful autonomous system. Set up in minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={ROUTES.REGISTER}>
                <Button size="lg" className="!bg-white !text-brand-700 hover:!bg-white/90 !shadow-lg" iconRight={<ArrowRight className="w-5 h-5" />}>
                  Create Free Account
                </Button>
              </Link>
              <Link href={ROUTES.DASHBOARD}>
                <Button size="lg" variant="ghost" className="!text-white !border !border-white/30 hover:!bg-white/10">
                  Explore Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Section>

      <Footer />
    </div>
  );
}
