'use client';

import React, { useState, useEffect } from 'react';
import {
  Sun, Moon, Monitor, Bell, Lock, Shield, Globe, Palette,
  Wifi, Save, CheckCircle, XCircle, Radio, Cpu, Map,
  AlertTriangle, Info, RefreshCw
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { Button, Input, Toggle, Select, Breadcrumb } from '@/components/ui';
import { SettingsCard } from '@/components/cards';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { Theme } from '@/types';

// ========== MAPPING ALGORITHMS ==========
const MAPPING_ALGORITHMS = [
  {
    id: 'slam_toolbox',
    name: 'SLAM Toolbox',
    pkg: 'slam_toolbox',
    mapTopic: '/map',
    scanTopic: '/scan',
    description: 'Recommended for ROS 2. Online & lifelong mapping. High accuracy.',
    launch: 'ros2 launch slam_toolbox online_async_launch.py',
    badge: 'ROS 2',
    color: 'emerald',
  },
  {
    id: 'hector',
    name: 'Hector Mapping',
    pkg: 'hector_slam',
    mapTopic: '/map',
    scanTopic: '/scan',
    description: 'No odometry required. Fast and reliable for flat environments.',
    launch: 'ros2 launch hector_slam hector_mapping.launch.py',
    badge: 'ROS 1/2',
    color: 'blue',
  },
  {
    id: 'gmapping',
    name: 'GMapping',
    pkg: 'slam_gmapping',
    mapTopic: '/map',
    scanTopic: '/scan',
    description: 'Particle filter SLAM. Mature & widely used. Requires odometry.',
    launch: 'rosrun gmapping slam_gmapping',
    badge: 'ROS 1',
    color: 'purple',
  },
  {
    id: 'cartographer',
    name: 'Cartographer',
    pkg: 'cartographer_ros',
    mapTopic: '/map',
    scanTopic: '/scan_filtered',
    description: 'Google\'s SLAM. 2D & 3D support. Best for large environments.',
    launch: 'ros2 launch cartographer_ros cartographer.launch.py',
    badge: 'ROS 2',
    color: 'orange',
  },
  {
    id: 'rtabmap',
    name: 'RTAB-Map',
    pkg: 'rtabmap_ros',
    mapTopic: '/rtabmap/grid_map',
    scanTopic: '/scan',
    description: 'RGB-D + LiDAR SLAM. 3D mapping with loop closure detection.',
    launch: 'ros2 launch rtabmap_launch rtabmap.launch.py',
    badge: 'ROS 2',
    color: 'pink',
  },
];

const BADGE_COLORS: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  blue:    'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  purple:  'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
  orange:  'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
  pink:    'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400',
};

export default function SettingsPage() {
  const { changePassword } = useAuth();
  const { theme, setTheme } = useTheme();
  const { success, error: showError, info } = useToast();

  // ── Rover Connection ──
  const [rosHost, setRosHost] = useState('192.168.137.85');
  const [rosPort, setRosPort] = useState('9090');
  const [connStatus, setConnStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');

  // ── Mapping Algorithm ──
  const [selectedAlgo, setSelectedAlgo] = useState(MAPPING_ALGORITHMS[0].id);
  const [customMapTopic, setCustomMapTopic] = useState('');
  const [customScanTopic, setCustomScanTopic] = useState('');
  const activeAlgo = MAPPING_ALGORITHMS.find(a => a.id === selectedAlgo)!;

  // ── Other settings ──
  const [notifications, setNotifications] = useState(true);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);

  // Load saved values from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('scoutrover_ros_url') || 'ws://192.168.137.85:9090';
    try {
      const url = new URL(stored);
      setRosHost(url.hostname);
      setRosPort(url.port || '9090');
    } catch { /* use defaults */ }

    try {
      const cfg = JSON.parse(localStorage.getItem('scoutrover_mapping_config') || '{}');
      if (cfg.algoId) setSelectedAlgo(cfg.algoId);
      if (cfg.customMapTopic) setCustomMapTopic(cfg.customMapTopic);
      if (cfg.customScanTopic) setCustomScanTopic(cfg.customScanTopic);
    } catch { /* use defaults */ }

    const savedNotif = localStorage.getItem('scoutrover_notifications');
    if (savedNotif !== null) setNotifications(savedNotif === 'true');
  }, []);

  const handleSaveConnection = () => {
    const url = `ws://${rosHost.trim()}:${rosPort.trim()}`;
    localStorage.setItem('scoutrover_ros_url', url);
    success('Connection saved', `ROS bridge set to ${url}. Reconnect rover to apply.`);
  };

  const handleTestConnection = async () => {
    setConnStatus('testing');
    const url = `ws://${rosHost.trim()}:${rosPort.trim()}`;
    try {
      const { Ros } = await import('roslib');
      const ros = new Ros({ url });
      const timer = setTimeout(() => {
        ros.close();
        setConnStatus('fail');
        showError('Connection timeout', `Could not reach ${url} within 5s`);
      }, 5000);
      ros.on('connection', () => {
        clearTimeout(timer);
        setConnStatus('ok');
        success('Connected!', `rosbridge is reachable at ${url}`);
        ros.close();
      });
      ros.on('error', () => {
        clearTimeout(timer);
        setConnStatus('fail');
        showError('Connection failed', `Could not reach rosbridge at ${url}`);
      });
    } catch {
      setConnStatus('fail');
      showError('Connection failed', 'Could not open WebSocket');
    }
  };

  const handleSaveMapping = () => {
    const algoObj = MAPPING_ALGORITHMS.find(a => a.id === selectedAlgo)!;
    const cfg = {
      algoId: selectedAlgo,
      algoName: algoObj.name,
      mapTopic: customMapTopic || algoObj.mapTopic,
      scanTopic: customScanTopic || algoObj.scanTopic,
      customMapTopic,
      customScanTopic,
    };
    localStorage.setItem('scoutrover_mapping_config', JSON.stringify(cfg));
    success('Mapping config saved', `Using ${algoObj.name} — map: ${cfg.mapTopic}, scan: ${cfg.scanTopic}`);
  };

  const handleChangePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      showError('Error', 'New passwords do not match'); return;
    }
    if (passwordForm.new.length < 8) {
      showError('Error', 'Password must be at least 8 characters'); return;
    }
    setPwLoading(true);
    try {
      await changePassword(passwordForm.current, passwordForm.new);
      success('Password changed', 'Your password has been updated');
      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch (err: any) {
      showError('Failed', err.message);
    } finally {
      setPwLoading(false);
    }
  };

  const themeOptions: Array<{ key: Theme; label: string; icon: React.ReactNode }> = [
    { key: 'light', label: 'Light', icon: <Sun className="w-5 h-5" /> },
    { key: 'dark',  label: 'Dark',  icon: <Moon className="w-5 h-5" /> },
    { key: 'system',label: 'System',icon: <Monitor className="w-5 h-5" /> },
  ];

  const connIcon = {
    idle:    <Wifi className="w-4 h-4 text-surface-400" />,
    testing: <RefreshCw className="w-4 h-4 text-brand-500 animate-spin" />,
    ok:      <CheckCircle className="w-4 h-4 text-emerald-500" />,
    fail:    <XCircle className="w-4 h-4 text-red-500" />,
  }[connStatus];

  return (
    <DashboardLayout>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Settings' }]} />

      <div className="mb-6">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure rover connection, mapping algorithms, and preferences</p>
      </div>

      <div className="max-w-3xl space-y-6">

        {/* ── Rover Connection ── */}
        <div id="rover">
        <SettingsCard
          title="Rover Connection"
          description="Set the Jetson IP address and rosbridge WebSocket port"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Input
                  label="Jetson IP Address"
                  value={rosHost}
                  onChange={e => setRosHost(e.target.value)}
                  placeholder="192.168.137.85"
                  leftIcon={<Globe className="w-4 h-4" />}
                  hint="IP of the Jetson on your local network"
                />
              </div>
              <div>
                <Input
                  label="Port"
                  value={rosPort}
                  onChange={e => setRosPort(e.target.value)}
                  placeholder="9090"
                  hint="rosbridge port"
                />
              </div>
            </div>

            {/* Active URL preview */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-100 dark:bg-dark-elevated border border-surface-200 dark:border-white/[0.06]">
              {connIcon}
              <code className="text-xs text-surface-600 dark:text-surface-300 flex-1">
                ws://{rosHost}:{rosPort}
              </code>
              {connStatus === 'ok' && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Connected</span>}
              {connStatus === 'fail' && <span className="text-xs text-red-600 dark:text-red-400 font-medium">Unreachable</span>}
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleTestConnection}
                loading={connStatus === 'testing'}
                icon={<Wifi className="w-4 h-4" />}
              >
                Test Connection
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveConnection}
                icon={<Save className="w-4 h-4" />}
              >
                Save & Apply
              </Button>
            </div>

            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex gap-2">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-400">
                After saving, click <strong>Connect Rover</strong> on the Dashboard to apply the new address. The URL persists across browser sessions.
              </p>
            </div>
          </div>
        </SettingsCard>
        </div>

        {/* ── Mapping Algorithm ── */}
        <div id="mapping">
        <SettingsCard
          title="Mapping Algorithm"
          description="Select the ROS SLAM algorithm running on your Jetson"
        >
          <div className="space-y-4">
            {/* Algorithm grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MAPPING_ALGORITHMS.map(algo => (
                <button
                  key={algo.id}
                  onClick={() => {
                    setSelectedAlgo(algo.id);
                    setCustomMapTopic('');
                    setCustomScanTopic('');
                  }}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    selectedAlgo === algo.id
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                      : 'border-surface-200 dark:border-white/[0.08] hover:border-brand-300 dark:hover:border-brand-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-semibold text-sm text-surface-900 dark:text-white">{algo.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${BADGE_COLORS[algo.color]}`}>
                      {algo.badge}
                    </span>
                  </div>
                  <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed">{algo.description}</p>
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-surface-400">
                    <span>📡 map: <code className="font-mono">{algo.mapTopic}</code></span>
                    <span>🔭 scan: <code className="font-mono">{algo.scanTopic}</code></span>
                  </div>
                </button>
              ))}
            </div>

            {/* Selected algo launch command */}
            <div className="p-3 rounded-lg bg-surface-900 dark:bg-black/40 border border-surface-700 dark:border-white/10">
              <p className="text-[10px] text-surface-500 mb-1 uppercase tracking-wider">Launch command for {activeAlgo.name}</p>
              <code className="text-xs text-emerald-400 font-mono break-all">{activeAlgo.launch}</code>
              <p className="text-[10px] text-surface-500 mt-1">Package: <span className="text-surface-300">{activeAlgo.pkg}</span></p>
            </div>

            {/* Topic overrides */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Map Topic Override"
                value={customMapTopic}
                onChange={e => setCustomMapTopic(e.target.value)}
                placeholder={activeAlgo.mapTopic}
                hint="Leave blank to use algorithm default"
                leftIcon={<Map className="w-4 h-4" />}
              />
              <Input
                label="Scan Topic Override"
                value={customScanTopic}
                onChange={e => setCustomScanTopic(e.target.value)}
                placeholder={activeAlgo.scanTopic}
                hint="Leave blank to use algorithm default"
                leftIcon={<Radio className="w-4 h-4" />}
              />
            </div>

            {selectedAlgo === 'gmapping' && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  GMapping is a ROS 1 package. Ensure you have a ROS 1 bridge or are running ROS 1 Noetic on your Jetson.
                </p>
              </div>
            )}

            <Button variant="primary" onClick={handleSaveMapping} icon={<Save className="w-4 h-4" />}>
              Save Mapping Config
            </Button>
          </div>
        </SettingsCard>
        </div>

        {/* ── Appearance ── */}
        <SettingsCard title="Appearance" description="Customize the look and feel">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">Theme</label>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setTheme(opt.key)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    theme === opt.key
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400'
                      : 'border-surface-200 dark:border-surface-700 text-surface-500 hover:border-surface-300 dark:hover:border-surface-600'
                  }`}
                >
                  {opt.icon}
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </SettingsCard>

        {/* ── Notifications ── */}
        <SettingsCard title="Notifications" description="Control notification preferences">
          <div className="space-y-4">
            <Toggle
              checked={notifications}
              onChange={v => { setNotifications(v); localStorage.setItem('scoutrover_notifications', String(v)); }}
              label="Enable notifications"
              description="Receive alerts for connection status changes"
            />
            <Toggle checked={true} onChange={() => {}} label="Map update alerts" description="Notify when new LiDAR data is available" />
            <Toggle checked={false} onChange={() => {}} label="Sound effects" description="Play sounds for button presses and notifications" />
          </div>
        </SettingsCard>

        {/* ── Security ── */}
        <SettingsCard title="Security" description="Update your password">
          <div className="space-y-4">
            <Input label="Current password" type="password" value={passwordForm.current}
              onChange={e => setPasswordForm(f => ({ ...f, current: e.target.value }))}
              leftIcon={<Lock className="w-4 h-4" />} />
            <Input label="New password" type="password" value={passwordForm.new}
              onChange={e => setPasswordForm(f => ({ ...f, new: e.target.value }))}
              leftIcon={<Lock className="w-4 h-4" />} />
            <Input label="Confirm new password" type="password" value={passwordForm.confirm}
              onChange={e => setPasswordForm(f => ({ ...f, confirm: e.target.value }))}
              leftIcon={<Lock className="w-4 h-4" />} />
            <Button variant="primary" onClick={handleChangePassword} loading={pwLoading}
              icon={<Save className="w-4 h-4" />}
              disabled={!passwordForm.current || !passwordForm.new}>
              Update Password
            </Button>
          </div>
        </SettingsCard>

        {/* ── Danger Zone ── */}
        <SettingsCard title="Danger Zone" description="Irreversible actions">
          <div className="p-4 rounded-xl border-2 border-red-200 dark:border-red-500/30 bg-red-50/50 dark:bg-red-500/5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="font-medium text-red-700 dark:text-red-400">Delete Account</p>
                <p className="text-sm text-red-600/70 dark:text-red-400/60 mt-0.5">Permanently remove your account and all data</p>
              </div>
              <Button variant="danger" size="sm">Delete Account</Button>
            </div>
          </div>
        </SettingsCard>

      </div>
    </DashboardLayout>
  );
}
