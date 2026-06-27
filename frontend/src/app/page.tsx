'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Map, QrCode, Compass, Shield, Smartphone, Zap, ArrowRight, Star, Users, Globe, ChevronRight, Activity, Wifi, BarChart3 } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Button, Section } from '@/components/ui';
import { FeatureCard } from '@/components/cards';
import { ROUTES, APP_CONFIG } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, loginAsGuest } = useAuth();

  const handlePlayground = () => {
    loginAsGuest();
    router.push(ROUTES.DASHBOARD);
  };

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

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="text-left lg:col-span-7 flex flex-col items-start">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8 animate-fade-in-down">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-white/60">v{APP_CONFIG.version} — Now with dual map modes & QR scanning</span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight mb-6 animate-fade-in-up">
              Autonomous Mapping
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-400 via-purple-400 to-cyan-400 animate-gradient bg-[length:200%]">
                Reimagined
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-white/70 max-w-xl leading-relaxed mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Real-time LiDAR mapping, SLAM navigation, and remote rover control all from your browser.
              Professional-grade tools for exploration and mapping.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 animate-fade-in-up w-full sm:w-auto animate-pulse-glow rounded-xl p-1 bg-white/5" style={{ animationDelay: '0.4s' }}>
              {isAuthenticated ? (
                <Link href={ROUTES.DASHBOARD} className="w-full sm:w-auto">
                  <Button variant="primary" size="lg" className="w-full" iconRight={<ArrowRight className="w-5 h-5" />}>
                    View Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href={ROUTES.REGISTER} className="w-full sm:w-auto">
                    <Button variant="primary" size="lg" className="w-full" iconRight={<ArrowRight className="w-5 h-5" />}>
                      Get Started
                    </Button>
                  </Link>
                  <Button variant="outline" size="lg" className="w-full sm:w-auto !text-white hover:!bg-white/10 border border-white/20" onClick={handlePlayground}>
                    Try Sandbox
                  </Button>
                  <Link href={ROUTES.LOGIN} className="w-full sm:w-auto">
                    <Button variant="ghost" size="lg" className="w-full !text-white/70 hover:!text-white hover:!bg-white/10 border border-white/10">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Interactive CSS Mockup on the right */}
          <div className="lg:col-span-5 w-full flex items-center justify-center lg:justify-end animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            <div className="relative w-full max-w-[450px] aspect-[4/3] rounded-2xl bg-dark-card border border-white/10 shadow-2xl overflow-hidden backdrop-blur-md animate-float">
              {/* Browser Header Bar */}
              <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="text-[10px] font-mono text-white/30 truncate max-w-[180px]">ws://192.168.137.85:9090</div>
                <div className="w-12 h-2 bg-white/5 rounded-full" />
              </div>
              
              {/* Browser Body / Canvas Mockup */}
              <div className="relative w-full h-[calc(100%-2.5rem)] bg-slate-950 flex items-center justify-center overflow-hidden">
                {/* Dots Grid */}
                <div className="absolute inset-0 bg-dots opacity-30" />
                
                {/* Telemetry sweep line */}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-500/0 via-brand-500/10 to-brand-500/0 animate-shimmer pointer-events-none" style={{ animationDuration: '4s' }} />

                {/* LiDAR Sweep radar */}
                <div className="absolute w-64 h-64 border border-brand-500/20 rounded-full flex items-center justify-center">
                  <div className="absolute w-44 h-44 border border-brand-500/15 rounded-full" />
                  <div className="absolute w-24 h-24 border border-brand-500/10 rounded-full" />
                  {/* Sweep ray */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-500/20 to-transparent rotate-45 transform origin-center animate-spin-slow" />
                </div>

                {/* Mock Waypoints & Route */}
                <div className="absolute top-1/3 left-1/4 flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50 animate-pulse" />
                  <span className="text-[8px] font-mono text-cyan-400 mt-1 bg-slate-950/80 px-1 rounded border border-cyan-400/20">Way A</span>
                </div>

                <div className="absolute bottom-1/3 right-1/4 flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse" style={{ animationDelay: '1s' }} />
                  <span className="text-[8px] font-mono text-emerald-400 mt-1 bg-slate-950/80 px-1 rounded border border-emerald-400/20">Charge Hub</span>
                </div>

                {/* SVG Route Line connecting them */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <line x1="25%" y1="33%" x2="75%" y2="67%" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 3" className="animate-pulse" />
                </svg>

                {/* Rover indicator dot */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-brand-500 border border-white flex items-center justify-center shadow-lg shadow-brand-500/50 animate-bounce-subtle">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  <span className="text-[8px] font-mono text-white mt-1 bg-brand-600 px-1 rounded font-bold">ROVER-01</span>
                </div>

                {/* Floating Telemetry Box */}
                <div className="absolute bottom-4 left-4 p-2 bg-slate-900/90 border border-white/10 rounded-lg backdrop-blur-md space-y-1 w-28 shadow-xl">
                  <div className="flex justify-between text-[8px] text-white/50">
                    <span>STATUS</span>
                    <span className="text-emerald-400 font-bold">ACTIVE</span>
                  </div>
                  <div className="flex justify-between text-[8px] text-white/50">
                    <span>SPEED</span>
                    <span className="text-white font-mono">0.5 m/s</span>
                  </div>
                  <div className="flex justify-between text-[8px] text-white/50">
                    <span>BATTERY</span>
                    <span className="text-brand-400 font-mono">84%</span>
                  </div>
                </div>

                {/* Floating Signal Box */}
                <div className="absolute top-4 right-4 p-1.5 bg-slate-900/90 border border-white/10 rounded-lg flex items-center gap-1.5 text-[8px] font-semibold text-emerald-400 backdrop-blur-md shadow-xl">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>SLAM LOCALIZED</span>
                </div>
              </div>
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
            From real-time rover control to advanced mapping and QR utilities — Atlas gives you professional tools in one unified platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <ScrollReveal delay="0.1s">
            <FeatureCard
              icon={<Map className="w-6 h-6" />}
              title="LiDAR Mapping"
              description="Visualize 2D spatial metrics with advanced occupancy grids. Export configurations directly."
            />
          </ScrollReveal>
          <ScrollReveal delay="0.2s">
            <FeatureCard
              icon={<Compass className="w-6 h-6" />}
              title="SLAM Navigation"
              description="Simultaneous Localization and Mapping powered by ROS for precise autonomous navigation."
            />
          </ScrollReveal>
          <ScrollReveal delay="0.3s">
            <FeatureCard
              icon={<QrCode className="w-6 h-6" />}
              title="QR Code Tools"
              description="Generate custom QR codes and scan them using your device camera or by uploading images."
            />
          </ScrollReveal>
          <ScrollReveal delay="0.4s">
            <FeatureCard
              icon={<Wifi className="w-6 h-6" />}
              title="Real-time Control"
              description="Control your rover with keyboard, touch, or mouse — with live telemetry and status updates."
            />
          </ScrollReveal>
          <ScrollReveal delay="0.5s">
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Secure Auth"
              description="Protected routes, session management, and secure authentication for your rover dashboard."
            />
          </ScrollReveal>
          <ScrollReveal delay="0.6s">
            <FeatureCard
              icon={<Smartphone className="w-6 h-6" />}
              title="Fully Responsive"
              description="Works flawlessly on phones, tablets, laptops, and desktops — control your rover from anywhere."
            />
          </ScrollReveal>
        </div>
      </Section>

      {/* ===== STATS SECTION ===== */}
      <Section className="bg-surface-50 dark:bg-dark-card/50">
        <ScrollReveal>
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
        </ScrollReveal>
      </Section>

      {/* ===== CTA SECTION ===== */}
      <Section className="bg-white dark:bg-dark-bg">
        <ScrollReveal delay="0.1s">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 via-brand-500 to-cyan-500 p-12 sm:p-16 text-center">
            <div className="absolute inset-0 bg-grid opacity-10" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to Explore?
              </h2>
              <p className="text-white/70 max-w-xl mx-auto mb-8">
                Start mapping your environment with Atlas&apos;s powerful autonomous system. Set up in minutes.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href={ROUTES.REGISTER}>
                  <Button size="lg" variant="inverted" iconRight={<ArrowRight className="w-5 h-5" />}>
                    Create Free Account
                  </Button>
                </Link>
                <Link href={ROUTES.DASHBOARD}>
                  <Button size="lg" variant="on-dark">
                    Explore Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </Section>

      <Footer />
    </div>
  );
}
