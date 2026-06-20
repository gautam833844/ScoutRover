'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Wifi, WifiOff, Map, QrCode, Activity, Clock, ChevronUp, ChevronDown,
  ChevronLeft, ChevronRight, Square, Download, Save, Compass, Gauge,
  MapPin, Zap, BarChart3
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { Button, Badge, Breadcrumb } from '@/components/ui';
import { StatCard, ActivityCard, LinkCard } from '@/components/cards';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ROUTES, ROS_CONFIG } from '@/constants';
import { timeAgo } from '@/utils/helpers';

export default function DashboardPage() {
  const { user } = useAuth();
  const { success, error: showError, info } = useToast();
  const [rosStatus, setRosStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [lastMapUpdate, setLastMapUpdate] = useState<string | null>(null);
  const [currentDirection, setCurrentDirection] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rosRef = useRef<any>(null);
  const cmdVelRef = useRef<any>(null);
  const cmdIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ROS Connection
  const connectToROS = useCallback(() => {
    if (typeof window === 'undefined' || !(window as any).ROSLIB) return;

    setRosStatus('connecting');
    try {
      const ros = new (window as any).ROSLIB.Ros({ url: ROS_CONFIG.url });
      rosRef.current = ros;

      ros.on('connection', () => {
        setRosStatus('connected');
        info('Connected', 'ROS bridge connected successfully');

        // Setup topics
        cmdVelRef.current = new (window as any).ROSLIB.Topic({
          ros, name: ROS_CONFIG.cmdVelTopic, messageType: 'geometry_msgs/Twist',
        });

        const mapListener = new (window as any).ROSLIB.Topic({
          ros, name: ROS_CONFIG.mapTopic, messageType: 'nav_msgs/OccupancyGrid',
          throttle_rate: ROS_CONFIG.mapThrottleRate, queue_length: 1,
        });
        mapListener.subscribe((message: any) => {
          drawMap(message);
          setLastMapUpdate(new Date().toISOString());
        });
      });

      ros.on('error', () => {
        setRosStatus('disconnected');
      });

      ros.on('close', () => {
        setRosStatus('disconnected');
      });
    } catch {
      setRosStatus('disconnected');
    }
  }, [info]);

  // Draw LiDAR Map
  const drawMap = useCallback((map: any) => {
    const canvas = canvasRef.current;
    if (!canvas || !map?.info || !map?.data) return;

    const { width, height } = map.info;
    const container = canvas.parentElement;
    if (!container) return;

    const containerWidth = container.offsetWidth;
    const containerHeight = 300;
    const scale = Math.min(containerWidth / width, containerHeight / height, 1);
    const dw = Math.floor(width * scale);
    const dh = Math.floor(height * scale);

    canvas.width = dw;
    canvas.height = dh;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, dw, dh);
    const imageData = ctx.createImageData(dw, dh);

    for (let y = 0; y < dh; y++) {
      for (let x = 0; x < dw; x++) {
        const mapX = Math.floor(x / scale);
        const mapY = Math.floor(y / scale);
        if (mapX >= width || mapY >= height) continue;
        const cell = map.data[mapY * width + mapX];
        let r = 26, g = 26, b = 46;
        if (cell === 0) { r = 30; g = 41; b = 59; }
        else if (cell > 0) { r = 124; g = 58; b = 237; }
        else { r = 15; g = 23; b = 42; }
        const idx = (y * dw + x) * 4;
        imageData.data[idx] = r;
        imageData.data[idx + 1] = g;
        imageData.data[idx + 2] = b;
        imageData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }, []);

  // Rover Movement
  const sendCmd = useCallback((direction: string) => {
    if (!cmdVelRef.current || !rosRef.current?.isConnected) return;
    const twist = new (window as any).ROSLIB.Message({
      linear: { x: 0, y: 0, z: 0 }, angular: { x: 0, y: 0, z: 0 },
    });
    const s = ROS_CONFIG.linearSpeed;
    const a = ROS_CONFIG.angularSpeed;
    if (direction === 'forward') twist.linear.x = s;
    else if (direction === 'backward') twist.linear.x = -s;
    else if (direction === 'left') twist.angular.z = a;
    else if (direction === 'right') twist.angular.z = -a;
    cmdVelRef.current.publish(twist);
  }, []);

  const startCmd = useCallback((dir: string) => {
    sendCmd(dir);
    setCurrentDirection(dir);
    if (cmdIntervalRef.current) clearInterval(cmdIntervalRef.current);
    cmdIntervalRef.current = setInterval(() => sendCmd(dir), ROS_CONFIG.cmdSendInterval);
  }, [sendCmd]);

  const stopRover = useCallback(() => {
    if (cmdIntervalRef.current) { clearInterval(cmdIntervalRef.current); cmdIntervalRef.current = null; }
    sendCmd('stop');
    setCurrentDirection(null);
  }, [sendCmd]);

  // Keyboard controls
  useEffect(() => {
    const keyMap: Record<string, string> = {
      ArrowUp: 'forward', ArrowDown: 'backward', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'forward', s: 'backward', a: 'left', d: 'right', W: 'forward', S: 'backward', A: 'left', D: 'right',
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const dir = keyMap[e.key];
      if (dir) { e.preventDefault(); startCmd(dir); }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (keyMap[e.key]) { e.preventDefault(); stopRover(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [startCmd, stopRover]);

  const downloadMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'rover_map.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    success('Downloaded', 'Map saved as rover_map.png');
  };

  const controlBtn = (dir: string, icon: React.ReactNode, label: string) => (
    <button
      onMouseDown={() => startCmd(dir)}
      onMouseUp={stopRover}
      onMouseLeave={stopRover}
      onTouchStart={(e) => { e.preventDefault(); startCmd(dir); }}
      onTouchEnd={(e) => { e.preventDefault(); stopRover(); }}
      className={`w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl flex items-center justify-center transition-all duration-150 border-2 select-none touch-none ${
        currentDirection === dir
          ? 'bg-brand-600 text-white border-brand-600 scale-95 shadow-glow'
          : 'bg-white dark:bg-dark-elevated text-surface-700 dark:text-surface-300 border-surface-200 dark:border-white/10 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400 active:scale-95'
      }`}
      aria-label={label}
    >
      {icon}
    </button>
  );

  return (
    <DashboardLayout>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Dashboard' }]} />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name?.split(' ')[0] || 'Explorer'}</p>
        </div>
        <Button
          variant={rosStatus === 'connected' ? 'secondary' : 'primary'}
          onClick={connectToROS}
          loading={rosStatus === 'connecting'}
          icon={rosStatus === 'connected' ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          size="sm"
        >
          {rosStatus === 'connected' ? 'Connected' : rosStatus === 'connecting' ? 'Connecting...' : 'Connect Rover'}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Wifi className="w-5 h-5" />}
          label="Connection"
          value={rosStatus === 'connected' ? 'Online' : 'Offline'}
          change={rosStatus === 'connected' ? 'Active' : 'Inactive'}
          changeType={rosStatus === 'connected' ? 'positive' : 'negative'}
        />
        <StatCard
          icon={<Map className="w-5 h-5" />}
          label="Last Map Update"
          value={lastMapUpdate ? timeAgo(lastMapUpdate) : 'Never'}
          change="LiDAR"
          changeType="neutral"
        />
        <StatCard
          icon={<Gauge className="w-5 h-5" />}
          label="Speed"
          value={`${ROS_CONFIG.linearSpeed} m/s`}
          change="Nominal"
          changeType="positive"
        />
        <StatCard
          icon={<Compass className="w-5 h-5" />}
          label="Direction"
          value={currentDirection ? currentDirection.charAt(0).toUpperCase() + currentDirection.slice(1) : 'Idle'}
          changeType="neutral"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Map Panel */}
        <div className="lg:col-span-2 card">
          <div className="px-5 py-4 border-b border-surface-200 dark:border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-surface-900 dark:text-white">Live LiDAR Map</h3>
              <Badge variant={rosStatus === 'connected' ? 'success' : 'danger'} dot>
                {rosStatus === 'connected' ? 'Live' : 'Offline'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={downloadMap} icon={<Download className="w-4 h-4" />}>
                Download
              </Button>
            </div>
          </div>
          <div className="p-5">
            <div className="relative bg-surface-50 dark:bg-dark-bg rounded-xl border border-surface-200 dark:border-white/[0.06] overflow-hidden flex items-center justify-center min-h-[300px]">
              <canvas ref={canvasRef} className="max-w-full max-h-full" style={{ imageRendering: 'pixelated' }} />
              {!lastMapUpdate && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-surface-400 dark:text-surface-500">
                  <Map className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-sm">Awaiting map data...</p>
                  <p className="text-xs mt-1 text-surface-300 dark:text-surface-600">Connect to rover to see live map</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Movement Controls */}
        <div className="card">
          <div className="px-5 py-4 border-b border-surface-200 dark:border-white/[0.08]">
            <h3 className="font-semibold text-surface-900 dark:text-white">Movement Controls</h3>
            <p className="text-xs text-surface-400 mt-0.5">Use WASD or arrow keys</p>
          </div>
          <div className="p-5 flex flex-col items-center gap-3">
            <div>{controlBtn('forward', <ChevronUp className="w-6 h-6" />, 'Forward')}</div>
            <div className="flex gap-3">
              {controlBtn('left', <ChevronLeft className="w-6 h-6" />, 'Left')}
              <button
                onMouseDown={stopRover}
                onTouchStart={stopRover}
                className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-2 border-red-200 dark:border-red-500/30 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-500/20 active:scale-95 transition-all select-none touch-none"
                aria-label="Stop"
              >
                <Square className="w-5 h-5 fill-current" />
              </button>
              {controlBtn('right', <ChevronRight className="w-6 h-6" />, 'Right')}
            </div>
            <div>{controlBtn('backward', <ChevronDown className="w-6 h-6" />, 'Backward')}</div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <LinkCard
          icon={<Map className="w-5 h-5" />}
          title="Maps"
          description="Explore standard, satellite, and LiDAR maps"
          href={ROUTES.MAPS}
        />
        <LinkCard
          icon={<QrCode className="w-5 h-5" />}
          title="QR Code"
          description="Generate and scan QR codes"
          href={ROUTES.QR_CODE}
        />
        <LinkCard
          icon={<Activity className="w-5 h-5" />}
          title="Settings"
          description="Configure rover and app settings"
          href={ROUTES.SETTINGS}
        />
      </div>
    </DashboardLayout>
  );
}
