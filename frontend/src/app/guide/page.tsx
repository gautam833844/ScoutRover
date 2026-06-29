'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, HelpCircle, LayoutDashboard, Map, Compass, Wifi, 
  Settings, FileDown, ArrowRight, ArrowLeft, Terminal, AlertTriangle, 
  CheckCircle2, Play, Keyboard, Cpu, Save, RefreshCw
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { Breadcrumb, Button } from '@/components/ui';

interface Slide {
  id: number;
  title: string;
  icon: React.ReactNode;
  subtitle: string;
  illustration: string;
  steps: { title: string; desc: string }[];
  tip?: string;
}

export default function UserGuidePage() {
  const [activeSlide, setActiveSlide] = useState(1);
  const [viewMode, setViewMode] = useState<'presentation' | 'document'>('presentation');

  const slides: Slide[] = [
    {
      id: 1,
      title: "Core System & Connection",
      icon: <Wifi className="w-6 h-6 text-brand-500" />,
      subtitle: "The bridge between your web interface and the physical rover",
      illustration: "SYS",
      steps: [
        {
          title: "ROS Bridge WebSocket link",
          desc: "Atlas communicates with the rover via a high-speed WebSocket bridge (typically running on port 9090). Telemetry, laser scans, and velocity commands stream over this bridge."
        },
        {
          title: "Connect to the Rover",
          desc: "Use the top header status widget. The interface attempts connection automatically using your configured address. A ping-pong heartbeat loop executes every 10 seconds to verify link health."
        },
        {
          title: "Local Offline Simulator",
          desc: "No physical robot? No problem. Run `npm run mock-ros` in your local workspace terminal. The client will automatically detect localhost and mock a live occupancy grid stream."
        }
      ],
      tip: "If the connection indicator shows Offline, verify that the rosbridge WebSocket suite is active on your Jetson Developer Kit using port 9090."
    },
    {
      id: 2,
      title: "Manual Drive Teleoperation",
      icon: <Keyboard className="w-6 h-6 text-brand-500" />,
      subtitle: "Taking manual control of the rover with responsive feedback",
      illustration: "TELEOP",
      steps: [
        {
          title: "Dashboard Control Panel",
          desc: "The Dashboard provides visual teleoperation buttons (Forward, Left, Stop, Right, Backward). Click and hold buttons to drive the rover; releasing stops it instantly."
        },
        {
          title: "Keyboard Control Bindings",
          desc: "Drive efficiently using keyboard keys. Press and hold Up/Down/Left/Right arrow keys or W/A/S/D to command velocity. Linear speed defaults to 0.5m/s."
        },
        {
          title: "Tactile Haptic Feedback",
          desc: "When driving on mobile/tablet touch screens, the interface triggers short 50ms vibration pulses for tactile haptics to alert operators of active movement commands."
        }
      ],
      tip: "Keep the dashboard tab active when driving using keyboard keys. Drives commands are throttled at 100ms intervals to prevent packet collisions."
    },
    {
      id: 3,
      title: "SLAM Mapping & Annotation",
      icon: <Map className="w-6 h-6 text-brand-500" />,
      subtitle: "Acquiring live LiDAR occupancy grids and building floorplans",
      illustration: "SLAM",
      steps: [
        {
          title: "Toggling Live LiDAR Scan",
          desc: "Open the Maps Console. Toggle the 'Live LiDAR Scan' tab. This starts the raw occupancy grid subscription on your configured ROS topic (default is `/map`)."
        },
        {
          title: "Coordinate Annotation (Waypoints)",
          desc: "Double-click anywhere on the map canvas. The metric coordinates (x/y in meters) are captured. Enter a name and description to store the Waypoint in MongoDB."
        },
        {
          title: "Inspection Routes",
          desc: "Activate 'Route Mode'. Click multiple waypoints sequentially to define a linear path. The system calculates total distance and saves the inspection route."
        }
      ],
      tip: "Occupancy grids display cell states: slate-400 represents unknown unexplored sectors, white represents safe free space, and neon green highlights obstacles (walls, pillars)."
    },
    {
      id: 4,
      title: "A* Obstacle-Aware Pathfinder",
      icon: <Compass className="w-6 h-6 text-brand-500" />,
      subtitle: "Auto-generating safe obstacle-free paths across the workspace",
      illustration: "PATH",
      steps: [
        {
          title: "Dynamic Path Calculations",
          desc: "When planning inspection routes, the console automatically calculates paths between waypoints. Instead of straight lines that clip walls, it finds a navigable path."
        },
        {
          title: "8-Connected A* Algorithm",
          desc: "An advanced A* search algorithm uses Octile distance heuristics to search all 8 grid directions, finding the shortest distance path in milliseconds."
        },
        {
          title: "15cm Safety Inflation",
          desc: "The pathfinder reads the map grid and 'inflates' all obstacles by 3 cells (15cm clearance). This ensures the generated path steers the physical rover safely clear of walls."
        }
      ],
      tip: "If a path fails to generate, ensure your waypoints are placed on clear white cells. Waypoints placed inside walls or inside the 15cm safety inflation zone will be rejected."
    },
    {
      id: 5,
      title: "Map Exporter & Jetson Push",
      icon: <Save className="w-6 h-6 text-brand-500" />,
      subtitle: "Saving, formatting, and deploying maps to your robot fleet",
      illustration: "EXPORT",
      steps: [
        {
          title: "Freeze & Export Live Scans",
          desc: "Click the 'Export Map' button on the live view. This captures the active live stream buffer in memory, formats the metadata, and opens the export dashboard."
        },
        {
          title: "Download ROS Map Formats",
          desc: "Download maps to your local machine. Choose between legacy ROS PGM + YAML or modern compressed ROS PNG + YAML configurations, generated on-the-fly."
        },
        {
          title: "Direct Push to Jetson",
          desc: "Input your target export directory (e.g. `/home/jetson/maps`) and click Push. The backend establishes a secure local file bridge and writes files to the target path."
        }
      ],
      tip: "Pushed maps are ready for immediate use in ROS 2 Nav2. Simply reference the exported YAML config in your navigation launch parameters."
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
          <h1 className="page-title">User Onboarding & Guide</h1>
          <p className="page-subtitle">Master the full Atlas Maps Console workflow and control system</p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex bg-surface-100 dark:bg-dark-elevated p-1 rounded-xl border border-surface-200 dark:border-white/5">
          <button
            onClick={() => setViewMode('presentation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'presentation'
                ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'
            }`}
          >
            Presentation Playbook
          </button>
          <button
            onClick={() => setViewMode('document')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'document'
                ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'
            }`}
          >
            Document View
          </button>
        </div>
      </div>

      {/* ==================== 1. PRESENTATION SLIDEOVER LAYOUT ==================== */}
      {viewMode === 'presentation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Active Slide Presentation */}
          <div className="lg:col-span-8 bg-white dark:bg-dark-card border border-surface-200 dark:border-white/5 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-glow min-h-[520px]">
            <div>
              {/* Slide Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20 flex items-center justify-center">
                  {activeSlideData.icon}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-brand-500 font-mono">Phase 0{activeSlideData.id}</span>
                  <h2 className="text-xl font-bold text-surface-900 dark:text-white leading-tight">{activeSlideData.title}</h2>
                </div>
              </div>

              <p className="text-sm text-surface-600 dark:text-surface-400 mb-8 max-w-xl font-medium">
                {activeSlideData.subtitle}
              </p>

              {/* Steps Checklist */}
              <div className="space-y-6">
                {activeSlideData.steps.map((step, idx) => (
                  <div key={idx} className="flex gap-4 group">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-500 flex items-center justify-center text-xs font-mono font-bold mt-0.5 group-hover:bg-brand-500 group-hover:text-white transition-all duration-300">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-surface-900 dark:text-white mb-1">{step.title}</h4>
                      <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed max-w-2xl">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Slide Footer / Navigation */}
            <div className="mt-12 pt-6 border-t border-surface-100 dark:border-white/5 flex items-center justify-between flex-wrap gap-4">
              {/* Dot Indicators */}
              <div className="flex items-center gap-2">
                {slides.map(slide => (
                  <button
                    key={slide.id}
                    onClick={() => setActiveSlide(slide.id)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      activeSlide === slide.id ? 'w-8 bg-brand-500' : 'w-2 bg-surface-200 dark:bg-surface-800 hover:bg-brand-300'
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
                    Next Step
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

          {/* Sidebar Navigation Playbook List */}
          <div className="lg:col-span-4 bg-surface-50 dark:bg-dark-card/50 border border-surface-200 dark:border-white/5 rounded-3xl p-6 flex flex-col gap-3">
            <h3 className="text-xs uppercase font-extrabold tracking-widest text-surface-400 dark:text-surface-500 mb-2 font-mono">Guide Navigation</h3>
            {slides.map(slide => (
              <button
                key={slide.id}
                onClick={() => setActiveSlide(slide.id)}
                className={`w-full flex items-center gap-4 p-3.5 rounded-2xl border text-left transition-all group ${
                  activeSlide === slide.id
                    ? 'bg-white dark:bg-dark-card border-brand-500 text-surface-900 dark:text-white shadow-sm'
                    : 'bg-transparent border-transparent text-surface-500 dark:text-surface-400 hover:bg-white/50 dark:hover:bg-white/5 hover:text-surface-800 dark:hover:text-surface-200'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                  activeSlide === slide.id 
                    ? 'bg-brand-500/10 text-brand-500' 
                    : 'bg-surface-200 dark:bg-dark-elevated text-surface-400 group-hover:text-brand-500'
                }`}>
                  {slide.id}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold font-mono tracking-wide uppercase text-brand-500 opacity-80 mb-0.5">Phase {slide.id}</p>
                  <p className="text-xs font-bold truncate">{slide.title}</p>
                </div>
              </button>
            ))}

            {/* Tip Banner */}
            {activeSlideData.tip && (
              <div className="mt-auto p-4 bg-brand-50 dark:bg-brand-500/5 border border-brand-100 dark:border-brand-500/10 rounded-2xl flex gap-3 text-xs">
                <HelpCircle className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-brand-700 dark:text-brand-400 mb-1">Developer Tip</h4>
                  <p className="text-surface-600 dark:text-surface-400 leading-relaxed">{activeSlideData.tip}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== 2. COMPLETE DOCUMENT VIEW LAYOUT ==================== */}
      {viewMode === 'document' && (
        <div className="max-w-4xl mx-auto space-y-12 mb-12">
          {/* Scrollable Presentation Sections */}
          {slides.map(slide => (
            <div key={slide.id} className="bg-white dark:bg-dark-card border border-surface-200 dark:border-white/5 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-6 border-b border-surface-100 dark:border-white/5 pb-4">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500">
                  {slide.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-surface-900 dark:text-white">0{slide.id}. {slide.title}</h3>
                  <p className="text-xs text-surface-500">{slide.subtitle}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {slide.steps.map((step, sIdx) => (
                  <div key={sIdx} className="bg-surface-50 dark:bg-dark-elevated/40 border border-surface-100 dark:border-white/5 p-4 rounded-2xl">
                    <span className="text-[10px] font-bold font-mono tracking-widest text-brand-500 block mb-1.5 uppercase">Step {sIdx + 1}</span>
                    <h4 className="text-sm font-bold text-surface-900 dark:text-white mb-1.5">{step.title}</h4>
                    <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>

              {slide.tip && (
                <div className="p-4 bg-brand-50 dark:bg-brand-500/5 border border-brand-100 dark:border-brand-500/10 rounded-xl flex gap-3 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
                  <p className="text-surface-600 dark:text-surface-400 leading-relaxed"><strong className="text-brand-600 dark:text-brand-400">Operator Tip:</strong> {slide.tip}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ==================== COMMON FAQs & TROUBLESHOOTING BANNER ==================== */}
      <div className="bg-surface-100 dark:bg-dark-elevated border border-surface-200 dark:border-white/5 rounded-3xl p-6 sm:p-8 shadow-sm">
        <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-6 flex items-center gap-2.5">
          <HelpCircle className="w-5 h-5 text-brand-500" />
          Troubleshooting & FAQs
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-surface-800 dark:text-surface-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              Why does my connection state say Offline?
            </h4>
            <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed pl-6">
              This indicates the web client cannot reach the `rosbridge_websocket` server. Confirm the WebSocket suite is launched on the Jetson developer kit (`ros2 launch rosbridge_server rosbridge_websocket_launch.xml`). For testing offline, boot our mock server (`npm run mock-ros`) to auto-connect.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-surface-800 dark:text-surface-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              Why do I get 'Access Forbidden' when saving markers or routes?
            </h4>
            <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed pl-6">
              Only authenticated roles with `ADMIN` privileges can modify waypoints, routes, or export maps. Log in using `admin@scoutrover.local` (promoted automatically on server startup). Ensure you **Log Out** and **Log Back In** to refresh your JWT session claims.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-surface-800 dark:text-surface-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              Why did the A* Pathfinder fail to plan a route?
            </h4>
            <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed pl-6">
              The A* algorithm will return an empty path if the starting position or ending waypoint lands on an obstacle grid cell. Keep in mind that obstacles have a 15cm (3 cell) safety inflation zone. Relocate your waypoints onto clear white cells to fix this.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-surface-800 dark:text-surface-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              How do I export raw grids to my local disk?
            </h4>
            <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed pl-6">
              Open the Maps Console status footer, click **Export Map**, select **ROS PGM + YAML** or **ROS PNG + YAML** options, and download the assets package. Files are zipped natively and download immediately to your local system's default folders.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
