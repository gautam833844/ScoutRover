'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Wifi, WifiOff, Map, QrCode, Activity, Clock, ChevronUp, ChevronDown,
  ChevronLeft, ChevronRight, Square, Download, Save, Compass, Gauge,
  MapPin, Zap, BarChart3, UploadCloud
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { Button, Badge, Breadcrumb } from '@/components/ui';
import { StatCard, LinkCard } from '@/components/cards';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ROUTES, ROS_CONFIG } from '@/constants';
import { timeAgo } from '@/utils/helpers';
import mapService from '@/services/mapService';
import apiClient from '@/services/apiClient';

export default function DashboardPage() {
  const { user } = useAuth();
  const { success, error: showError, info } = useToast();
  const [rosStatus, setRosStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [lastMapUpdate, setLastMapUpdate] = useState<string | null>(null);
  const [currentDirection, setCurrentDirection] = useState<string | null>(null);
  const [savingMap, setSavingMap] = useState(false);
  const [exportingToJetson, setExportingToJetson] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rosRef = useRef<any>(null);
  const cmdVelRef = useRef<any>(null);
  const cmdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Ref to hold the most recent occupancy grid data structure from ROS
  const lastMapMessageRef = useRef<any>(null);

  // Read mapping config from localStorage (set in Settings)
  const [mappingConfig, setMappingConfig] = useState({ algoName: 'SLAM Toolbox', mapTopic: '/map' });
  useEffect(() => {
    try {
      const cfg = JSON.parse(localStorage.getItem('scoutrover_mapping_config') || '{}');
      setMappingConfig({
        algoName: cfg.algoName || 'SLAM Toolbox',
        mapTopic: cfg.mapTopic || '/map',
      });
    } catch { /* use defaults */ }
  }, []);

  // Draw LiDAR Map from ROS occupancy grids
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
        
        if (cell === 0) {
          r = 30; g = 41; b = 59; // empty/free space (dark slate)
        } else if (cell > 0) {
          r = 124; g = 58; b = 237; // obstacles/walls (purple)
        } else {
          r = 15; g = 23; b = 42; // unknown (near-black)
        }
        
        const idx = (y * dw + x) * 4;
        imageData.data[idx] = r;
        imageData.data[idx + 1] = g;
        imageData.data[idx + 2] = b;
        imageData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }, []);

  // ROS Connection — dynamically import roslib (browser-only, uses WebSocket)
  // roslib v2 uses named exports: { Ros, Topic, Message } — no default export
  const connectToROS = useCallback(async () => {
    setRosStatus('connecting');
    try {
      const { Ros, Topic } = await import('roslib');
      const ros = new Ros({ url: ROS_CONFIG.url });
      rosRef.current = ros;

      ros.on('connection', () => {
        setRosStatus('connected');
        info('Connected', 'ROS bridge connected successfully');

        // Setup velocity topics
        cmdVelRef.current = new Topic({
          ros, name: ROS_CONFIG.cmdVelTopic, messageType: 'geometry_msgs/Twist',
        });

        // Setup LiDAR mapping listeners — use topic from saved mapping config
        const mapTopic = mappingConfig.mapTopic || ROS_CONFIG.mapTopic;
        const mapListener = new Topic({
          ros, name: mapTopic, messageType: 'nav_msgs/OccupancyGrid',
          throttle_rate: ROS_CONFIG.mapThrottleRate, queue_length: 1,
        });
        mapListener.subscribe((message: any) => {
          lastMapMessageRef.current = message;
          drawMap(message);
          setLastMapUpdate(new Date().toISOString());
        });
      });

      ros.on('error', (err: any) => {
        setRosStatus('disconnected');
        showError('Connection failed', `Could not reach rosbridge at ${ROS_CONFIG.url}`);
        console.warn('[ROS] connection error:', err);
      });

      ros.on('close', () => {
        setRosStatus('disconnected');
      });
    } catch (err) {
      setRosStatus('disconnected');
      console.warn('[ROS] import/connect error:', err);
      showError('Connection failed', `Could not reach rosbridge at ${ROS_CONFIG.url}`);
    }
  }, [info, showError, drawMap]);

  // Rover Movement commands
  // roslib v2: no Message class — publish plain JS objects directly to Topic
  const sendCmd = useCallback((direction: string) => {
    if (!cmdVelRef.current) return;
    const s = ROS_CONFIG.linearSpeed;
    const a = ROS_CONFIG.angularSpeed;
    const twist = {
      linear:  { x: 0, y: 0, z: 0 },
      angular: { x: 0, y: 0, z: 0 },
    };
    if (direction === 'forward')  twist.linear.x   =  s;
    else if (direction === 'backward') twist.linear.x  = -s;
    else if (direction === 'left')     twist.angular.z  =  a;
    else if (direction === 'right')    twist.angular.z  = -a;
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

  // Keyboard controls key bindings
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
    link.download = 'rover_lidar_map.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    success('Downloaded', 'Map image download triggered.');
  };

  const saveMapToDatabase = async () => {
    const gridMsg = lastMapMessageRef.current;
    if (!gridMsg || !gridMsg.info || !gridMsg.data) {
      showError('No map data', 'Awaiting live LiDAR occupancy grid messages from ROS bridge.');
      return;
    }

    const name = prompt('Name this map scan:', `LiDAR Scan - ${new Date().toLocaleTimeString()}`);
    if (!name) return;

    setSavingMap(true);
    try {
      await mapService.saveMap({
        name,
        width: gridMsg.info.width,
        height: gridMsg.info.height,
        resolution: gridMsg.info.resolution,
        originX: gridMsg.info.origin?.position?.x || 0,
        originY: gridMsg.info.origin?.position?.y || 0,
        gridData: Array.from(gridMsg.data),
      });
      success('Map saved', `LiDAR scan map '${name}' successfully stored in MongoDB.`);
    } catch (err: any) {
      showError('Failed to save', err.message || 'Could not save map scan to server');
    } finally {
      setSavingMap(false);
    }
  };

  const exportMapToJetsonDirect = async () => {
    const gridMsg = lastMapMessageRef.current;
    if (!gridMsg || !gridMsg.info || !gridMsg.data) {
      showError('No map data', 'Awaiting live LiDAR occupancy grid messages from ROS bridge.');
      return;
    }

    const name = prompt('Name this map for Jetson export:', `LiDAR Export - ${new Date().toLocaleTimeString()}`);
    if (!name) return;

    setExportingToJetson(true);
    try {
      // 1. Save map to DB first
      const savedMap = await mapService.saveMap({
        name,
        width: gridMsg.info.width,
        height: gridMsg.info.height,
        resolution: gridMsg.info.resolution,
        originX: gridMsg.info.origin?.position?.x || 0,
        originY: gridMsg.info.origin?.position?.y || 0,
        gridData: Array.from(gridMsg.data),
      });

      // 2. Call backend export to Jetson
      await apiClient.post('/jetson/export', {
        mapId: savedMap.id,
      });

      success('Export Successful', `Saved map "${name}" to DB and exported to Jetson filesystem.`);
    } catch (err: any) {
      showError('Export Failed', err.message || 'Could not export live scan to Jetson');
    } finally {
      setExportingToJetson(false);
    }
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
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-surface-900 dark:text-white">Live LiDAR Map</h3>
              <Badge variant={rosStatus === 'connected' ? 'success' : 'danger'} dot>
                {rosStatus === 'connected' ? 'Live' : 'Offline'}
              </Badge>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium">
                {mappingConfig.algoName}
              </span>
              <span className="text-[10px] text-surface-400 font-mono hidden sm:inline">
                {mappingConfig.mapTopic}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {lastMapUpdate && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={saveMapToDatabase}
                    loading={savingMap}
                    icon={<Save className="w-4 h-4" />}
                  >
                    Save to DB
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={exportMapToJetsonDirect}
                    loading={exportingToJetson}
                    icon={<UploadCloud className="w-4 h-4" />}
                  >
                    Export to Jetson
                  </Button>
                </>
              )}
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
