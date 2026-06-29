'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen, HelpCircle, LayoutDashboard, Map, Compass, Wifi,
  Settings, FileDown, ArrowRight, ArrowLeft, Terminal, AlertTriangle,
  CheckCircle2, Play, Keyboard, Cpu, Save, RefreshCw, Power, Monitor
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { Breadcrumb, Button } from '@/components/ui';

// ==================== 6-STEP ANIMATED PICTO ILLUSTRATIONS (BIGGER) ====================

function PowerOnIllustration() {
  const [pulsing, setPulsing] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => setPulsing(p => !p), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-72 bg-slate-950 rounded-2xl border border-white/5 flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1e293b_1.5px,transparent_1.5px)] bg-[size:24px_24px] opacity-20" />
      <div className="relative flex items-center justify-center">
        <div className={`absolute w-32 h-32 rounded-full bg-brand-500/10 border-2 border-brand-500/20 transition-all duration-1000 ${pulsing ? 'scale-125 opacity-100' : 'scale-95 opacity-30'}`} />
        <div className={`absolute w-24 h-24 rounded-full bg-brand-500/5 border border-brand-500/10 transition-all duration-1000 ${pulsing ? 'scale-110 opacity-80' : 'scale-90 opacity-20'}`} />
        <div className="w-20 h-20 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-brand-500 shadow-glow relative z-10">
          <Power className="w-10 h-10 animate-pulse" />
        </div>
      </div>
      <span className="text-xs text-surface-450 font-mono tracking-widest mt-6">SYSTEM BOOTING...</span>
    </div>
  );
}

function WifiIllustration() {
  return (
    <div className="relative w-full h-72 bg-slate-950 rounded-2xl border border-white/5 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:20px_20px] opacity-10" />
      <div className="flex items-center gap-14 relative z-10">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-surface-400">
            <Monitor className="w-8 h-8" />
          </div>
          <span className="text-[10px] text-surface-400 font-mono mt-3">Console Laptop</span>
        </div>
        <div className="flex flex-col items-center relative">
          <div className="w-16 h-16 rounded-full bg-brand-500/10 flex items-center justify-center shadow-glow">
            <Wifi className="w-8 h-8 text-brand-500 animate-pulse" />
          </div>
          <span className="text-[10px] text-brand-500 font-mono mt-3 font-bold">Same Network</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-surface-400">
            <Cpu className="w-8 h-8 animate-bounce" />
          </div>
          <span className="text-[10px] text-surface-400 font-mono mt-3">Scout Rover</span>
        </div>
      </div>
    </div>
  );
}

function WaitIllustration() {
  const [countdown, setCountdown] = useState(180);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => (c <= 120 ? 180 : c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="relative w-full h-72 bg-slate-950 rounded-2xl border border-white/5 flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1e293b_1px,transparent_1px)] bg-[size:16px_16px] opacity-10" />
      <div className="flex flex-col items-center gap-4 mb-3">
        <div className="w-20 h-20 rounded-full bg-brand-500/5 border border-brand-500/20 flex items-center justify-center animate-pulse">
          <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
        <span className="text-4xl font-extrabold text-white font-mono tracking-wider">{formatTime(countdown)}</span>
      </div>
      <p className="text-[10px] text-surface-450 font-mono tracking-widest uppercase">WAITING FOR CORE SYSTEM SYNC...</p>
    </div>
  );
}

function MapIllustration() {
  const [angle, setAngle] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setAngle(prev => (prev + 3.5) % 360), 16);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-72 bg-slate-950 rounded-2xl border border-white/5 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:20px_20px] opacity-10" />
      <div className="relative w-52 h-52 border-2 border-brand-500/10 rounded-full flex items-center justify-center">
        <div className="absolute inset-0 border border-brand-500/10 rounded-full scale-75" />
        <div className="absolute inset-0 border border-brand-500/5 rounded-full scale-50" />

        <div
          className="absolute w-1/2 h-1/2 origin-bottom-right bottom-1/2 right-1/2 bg-[linear-gradient(45deg,rgba(57,255,20,0.2),transparent)] rounded-tl-full"
          style={{ transform: `rotate(${angle}deg)` }}
        />

        <div className="absolute w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-[0_0_12px_#10b981] top-12 left-20 animate-pulse" />
        <div className="absolute w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-[0_0_12px_#10b981] bottom-16 right-12 animate-pulse" />
        <div className="absolute w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_12px_#10b981] top-24 right-20 animate-pulse" />

        <div className="w-12 h-12 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center z-10">
          <Cpu className="w-6 h-6 text-brand-500 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function DriveIllustration() {
  const [activeKey, setActiveKey] = useState<'W' | 'A' | 'S' | 'D' | null>(null);
  useEffect(() => {
    const keys: Array<'W' | 'A' | 'S' | 'D'> = ['W', 'D', 'S', 'A'];
    let idx = 0;
    const interval = setInterval(() => {
      setActiveKey(keys[idx]);
      idx = (idx + 1) % keys.length;
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-72 bg-slate-950 rounded-2xl border border-white/5 flex flex-col items-center justify-center overflow-hidden">
      <div className="relative w-16 h-16 bg-brand-500/10 border-2 border-brand-500 rounded-2xl flex items-center justify-center shadow-glow mb-6 transition-all duration-300"
        style={{
          transform: activeKey === 'W' ? 'translateY(-12px)' : activeKey === 'S' ? 'translateY(12px)' : activeKey === 'A' ? 'translateX(-12px)' : activeKey === 'D' ? 'translateX(12px)' : 'none'
        }}
      >
        <Cpu className="w-8 h-8 text-brand-500" />
      </div>
      <div className="grid grid-cols-3 gap-2 w-44">
        <div />
        <div className={`h-11 rounded-xl border text-sm font-bold flex items-center justify-center transition-all ${activeKey === 'W' ? 'bg-brand-500 border-brand-500 text-white shadow-glow' : 'border-white/10 text-surface-400'}`}>W</div>
        <div />
        <div className={`h-11 rounded-xl border text-sm font-bold flex items-center justify-center transition-all ${activeKey === 'A' ? 'bg-brand-500 border-brand-500 text-white shadow-glow' : 'border-white/10 text-surface-400'}`}>A</div>
        <div className={`h-11 rounded-xl border text-sm font-bold flex items-center justify-center transition-all ${activeKey === 'S' ? 'bg-brand-500 border-brand-500 text-white shadow-glow' : 'border-white/10 text-surface-400'}`}>S</div>
        <div className={`h-11 rounded-xl border text-sm font-bold flex items-center justify-center transition-all ${activeKey === 'D' ? 'bg-brand-500 border-brand-500 text-white shadow-glow' : 'border-white/10 text-surface-400'}`}>D</div>
      </div>
    </div>
  );
}

function SaveIllustration() {
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => setSaving(s => !s), 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-72 bg-slate-950 rounded-2xl border border-white/5 flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1e293b_1px,transparent_1px)] bg-[size:16px_16px] opacity-10" />
      <div className={`flex items-center gap-5 p-6 rounded-3xl border transition-all duration-500 scale-110 ${saving ? 'bg-emerald-500/20 border-emerald-500/50 scale-115 shadow-glow' : 'bg-slate-900 border-white/10'}`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-500 ${saving ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-950 border-white/5'}`}>
          <Save className={`w-6 h-6 transition-colors duration-500 ${saving ? 'text-emerald-400' : 'text-surface-400'}`} />
        </div>
        <div className="text-left">
          <p className={`text-sm font-bold transition-colors duration-500 ${saving ? 'text-emerald-400' : 'text-white'}`}>
            {saving ? 'SCAN MAP SAVED!' : 'SAVING SCAN TO DB...'}
          </p>
          <p className="text-[9px] text-surface-500 font-mono mt-0.5">DATABASE WRITE COMPLETED</p>
        </div>
      </div>
    </div>
  );
}

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  illustration: React.ReactNode;
  summary: string;
  tip: string;
}

export default function UserGuidePage() {
  const [activeSlide, setActiveSlide] = useState(1);
  const [viewMode, setViewMode] = useState<'presentation' | 'document'>('presentation');

  const slides: Slide[] = [
    {
      id: 1,
      title: "Step 1: Power On Rover",
      subtitle: "Booting the physical ScoutRover hardware chassis",
      illustration: <PowerOnIllustration />,
      summary: "Flip the battery switch on the rover to boot the onboard Jetson Developer Kit.",
      tip: "Allow 45 seconds for Jetson to boot all core background applications."
    },
    {
      id: 2,
      title: "Step 2: Connect WiFi",
      subtitle: "Routing device networks to the same SSID range",
      illustration: <WifiIllustration />,
      summary: "Connect your laptop/tablet console directly to the rover's local WiFi subnet.",
      tip: "A shared network is required for roslib WebSocket packets to communicate."
    },
    {
      id: 3,
      title: "Step 3: Wait for ROS Bridge",
      subtitle: "Syncing connection link automatically (2-4 min)",
      illustration: <WaitIllustration />,
      summary: "Wait 2-4 minutes for the backend client to link to the WebSocket on port 9090.",
      tip: "For local offline testing, launch our mock utility using `npm run mock-ros`."
    },
    {
      id: 4,
      title: "Step 4: Map Starts Appearing",
      subtitle: "Visualizing the active LiDAR spatial occupancy grid",
      illustration: <MapIllustration />,
      summary: "Launch the Maps view to watch the laser scan draw safe white zones and green boundaries.",
      tip: "Obstacles (walls, pillars) are highlighted in high-contrast neon green."
    },
    {
      id: 5,
      title: "Step 5: Move the Rover",
      subtitle: "Driving manual keyboard teleoperation keys",
      illustration: <DriveIllustration />,
      summary: "Go to Dashboard and drive using W/A/S/D or Arrow keys (stops immediately on release).",
      tip: "Speed is capped at 0.5m/s to allow safe navigation through narrow corridors."
    },
    {
      id: 6,
      title: "Step 6: Save Rover Scan Map",
      subtitle: "Storing the completed occupancy grid to MongoDB",
      illustration: <SaveIllustration />,
      summary: "Click 'Export Map' in the footer to save the scan in database and download ROS configs.",
      tip: "Log in as an ADMIN (admin@scoutrover.local) to authorize map saves."
    }
  ];

  // Handle keyboard navigation for slides
  useEffect(() => {
    if (viewMode !== 'presentation') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setActiveSlide(prev => Math.min(prev + 1, slides.length));
      } else if (e.key === 'ArrowLeft') {
        setActiveSlide(prev => Math.max(prev - 1, 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode]);

  const activeSlideData = slides.find(s => s.id === activeSlide) || slides[0];

  return (
    <DashboardLayout>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'User Guide' }]} />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">User Onboarding Playbook</h1>
          <p className="page-subtitle">Visual workflow guide for the ScoutRover control interface</p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex bg-surface-100 dark:bg-dark-elevated p-1 rounded-xl border border-surface-200 dark:border-white/5">
          <button
            onClick={() => setViewMode('presentation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'presentation'
                ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'
              }`}
          >
            Playbook
          </button>
          <button
            onClick={() => setViewMode('document')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'document'
                ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'
              }`}
          >
            All Docs
          </button>
        </div>
      </div>

      {/* ==================== PRESENTATION MODE (BIG ANIMS) ==================== */}
      {viewMode === 'presentation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Active Onboarding Slide Card */}
          <div className="lg:col-span-8 bg-white dark:bg-dark-card border border-surface-200 dark:border-white/5 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-glow min-h-[580px]">
            <div className="space-y-6">
              {/* Dynamic Animated Illustration Box (Bigger) */}
              <div className="mb-4">
                {activeSlideData.illustration}
              </div>

              {/* Title & Single Line Description */}
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-brand-500 font-mono">Step 0{activeSlideData.id}</span>
                <h2 className="text-xl font-bold text-surface-900 dark:text-white mt-1">{activeSlideData.title}</h2>
                <p className="text-xs text-surface-400 mt-1">{activeSlideData.subtitle}</p>
              </div>

              {/* Single High-Impact Bullet summary */}
              <div className="flex items-start gap-3 p-4 bg-surface-50 dark:bg-dark-elevated/40 border border-surface-100 dark:border-white/5 rounded-2xl text-xs text-surface-900 dark:text-surface-200 font-medium">
                <CheckCircle2 className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{activeSlideData.summary}</span>
              </div>
            </div>

            {/* Slide Navigation controls */}
            <div className="mt-8 pt-5 border-t border-surface-100 dark:border-white/5 flex items-center justify-between flex-wrap gap-4">
              {/* Dots */}
              <div className="flex items-center gap-2">
                {slides.map(slide => (
                  <button
                    key={slide.id}
                    onClick={() => setActiveSlide(slide.id)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${activeSlide === slide.id ? 'w-6 bg-brand-500' : 'w-1.5 bg-surface-200 dark:bg-surface-800'
                      }`}
                    aria-label={`Go to slide ${slide.id}`}
                  />
                ))}
              </div>

              {/* Prev / Next buttons */}
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveSlide(prev => Math.max(prev - 1, 1))}
                  disabled={activeSlide === 1}
                  icon={<ArrowLeft className="w-4 h-4" />}
                >
                  Back
                </Button>
                {activeSlide < slides.length ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveSlide(prev => Math.min(prev + 1, slides.length))}
                    iconRight={<ArrowRight className="w-4 h-4" />}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setViewMode('document')}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Finish Guide
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Sidebar List */}
          <div className="lg:col-span-4 bg-surface-50 dark:bg-dark-card/50 border border-surface-200 dark:border-white/5 rounded-3xl p-6 flex flex-col gap-3 justify-between">
            <div>
              <h3 className="text-xs uppercase font-extrabold tracking-widest text-surface-400 dark:text-surface-500 mb-4 font-mono">Guide Navigation</h3>
              <div className="space-y-2">
                {slides.map(slide => (
                  <button
                    key={slide.id}
                    onClick={() => setActiveSlide(slide.id)}
                    className={`w-full flex items-center gap-3.5 p-3 rounded-2xl border text-left transition-all group ${activeSlide === slide.id
                        ? 'bg-white dark:bg-dark-card border-brand-500 text-surface-900 dark:text-white shadow-sm'
                        : 'bg-transparent border-transparent text-surface-500 dark:text-surface-400 hover:bg-white/50 dark:hover:bg-white/5 hover:text-surface-800 dark:hover:text-surface-200'
                      }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${activeSlide === slide.id
                        ? 'bg-brand-500/10 text-brand-500'
                        : 'bg-surface-200 dark:bg-dark-elevated text-surface-400 group-hover:text-brand-500'
                      }`}>
                      {slide.id}
                    </div>
                    <div>
                      <p className="text-[9px] font-bold font-mono tracking-wide uppercase text-brand-500 opacity-80 mb-0.5">Step {slide.id}</p>
                      <p className="text-xs font-bold truncate">{slide.title}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Operator tip banner */}
            {activeSlideData.tip && (
              <div className="p-4 bg-brand-50 dark:bg-brand-500/5 border border-brand-100 dark:border-brand-500/10 rounded-2xl flex gap-3 text-xs">
                <HelpCircle className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <h4 className="font-bold text-brand-700 dark:text-brand-400 mb-0.5">Operator Tip</h4>
                  <p className="text-surface-500 dark:text-surface-400 leading-normal">{activeSlideData.tip}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== COMPLETE DOCUMENT VIEW ==================== */}
      {viewMode === 'document' && (
        <div className="max-w-4xl mx-auto space-y-8 mb-12">
          {slides.map(slide => (
            <div key={slide.id} className="bg-white dark:bg-dark-card border border-surface-200 dark:border-white/5 rounded-3xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-5">
                {slide.illustration}
              </div>
              <div className="md:col-span-7 space-y-3">
                <div className="flex items-center gap-3 border-b border-surface-100 dark:border-white/5 pb-2.5">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-500 text-xs font-bold">
                    {slide.id}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-surface-900 dark:text-white">{slide.title}</h3>
                    <p className="text-[10px] text-surface-400">{slide.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-surface-500 dark:text-surface-400 leading-relaxed pl-1">
                  <CheckCircle2 className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
                  <span>{slide.summary}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==================== FAQS BANNER ==================== */}
      <div className="bg-surface-100 dark:bg-dark-elevated border border-surface-200 dark:border-white/5 rounded-3xl p-6 sm:p-8 shadow-sm">
        <h3 className="text-sm font-bold text-surface-900 dark:text-white mb-6 flex items-center gap-2.5">
          <HelpCircle className="w-4 h-4 text-brand-500" />
          Common FAQs & Troubleshooting
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-surface-850 dark:text-surface-200 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              Why is connection state showing Offline?
            </h4>
            <p className="text-[11px] text-surface-500 dark:text-surface-400 leading-normal pl-5.5">
              Confirm your rosbridge WebSocket launch configuration is running on port 9090. For local offline UI debugging, launch our mock utility server (`npm run mock-ros`).
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-surface-850 dark:text-surface-200 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              Why do I get 'Access Forbidden' when saving scans?
            </h4>
            <p className="text-[11px] text-surface-500 dark:text-surface-400 leading-normal pl-5.5">
              Only promoted ADMIN accounts can save waypoints or routes. Log in as `admin@scoutrover.local` and remember to **Log Out** and **Log Back In** to refresh your session token claims.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-surface-850 dark:text-surface-200 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              Why did the A* Pathfinder fail to plan?
            </h4>
            <p className="text-[11px] text-surface-500 dark:text-surface-400 leading-normal pl-5.5">
              The A* algorithm will fail if a waypoint is located inside walls or the 15cm obstacle safety buffer. Try moving waypoints slightly to clear white paths.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-surface-850 dark:text-surface-200 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              How do I export maps to local folders?
            </h4>
            <p className="text-[11px] text-surface-500 dark:text-surface-400 leading-normal pl-5.5">
              Click the 'Export Map' button, choose your configuration output type (ROS PNG or PGM format + YAML metadata template), and download the generated zip package.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
