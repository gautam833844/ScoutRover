'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  User as UserIcon, Mail, MapPin, Phone, Calendar, Edit3, Camera, Save,
  Map, QrCode, Compass, Activity, Shield, Scan, Download, Copy, Check,
  Upload, X, Image as ImageIcon, Palette
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { Button, Input, Textarea, Avatar, Breadcrumb, Badge, Tabs, Select } from '@/components/ui';
import { StatCard, ProfileCard, SettingsCard } from '@/components/cards';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { formatDate, timeAgo } from '@/utils/helpers';
import apiClient from '@/services/apiClient';
import { QR_CONFIG } from '@/constants';
import mapService from '@/services/mapService';

// ─── helpers ───────────────────────────────────────────────────────────────
const getAvatarUrl = (avatarPath?: string) => {
  if (!avatarPath) return '';
  if (avatarPath.startsWith('http')) return avatarPath;
  const base = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
  return `${base}${avatarPath}`;
};

// ─── Activity icon helper ─────────────────────────────────────────────────
const getActivityIcon = (action: string) => {
  if (action.startsWith('USER'))    return <UserIcon className="w-4 h-4" />;
  if (action.startsWith('MAP'))     return <Map className="w-4 h-4" />;
  if (action.startsWith('MARKER'))  return <MapPin className="w-4 h-4" />;
  if (action.startsWith('ROUTE'))   return <Compass className="w-4 h-4" />;
  return <Activity className="w-4 h-4" />;
};

// ══════════════════════════════════════════════════════════════════════════
// QR GENERATOR sub-component
// ══════════════════════════════════════════════════════════════════════════
function QRGenerator({ defaultText, onQrAction }: { defaultText?: string; onQrAction?: () => void }) {
  const { success } = useToast();
  const [text, setText] = useState(defaultText || 'https://atlas-slam.io');
  const [size, setSize] = useState<number>(QR_CONFIG.defaultSize);
  const [fgColor, setFgColor] = useState<string>(QR_CONFIG.defaultFgColor);
  const [bgColor, setBgColor] = useState<string>(QR_CONFIG.defaultBgColor);
  const [errorLevel, setErrorLevel] = useState<string>(QR_CONFIG.defaultErrorLevel);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  const generateQR = useCallback(async () => {
    if (!text.trim() || !canvasRef.current) return;
    try {
      const QRCode = (await import('qrcode')).default;
      await QRCode.toCanvas(canvasRef.current, text, {
        width: size,
        margin: 2,
        color: { dark: fgColor, light: bgColor },
        errorCorrectionLevel: errorLevel as 'L' | 'M' | 'Q' | 'H',
      });
    } catch (err) { console.error('QR gen error:', err); }
  }, [text, size, fgColor, bgColor, errorLevel]);

  useEffect(() => { generateQR(); }, [generateQR]);

  const downloadQR = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'atlas-qr.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    success('Downloaded', 'QR code saved as PNG');

    // Save to backend database
    try {
      await apiClient.post('/qrcodes', {
        title: text.slice(0, 30) || 'Generated QR Code',
        content: text,
        actionType: 'generated'
      });
      if (onQrAction) onQrAction();
    } catch (err) {
      console.warn('Failed to persist generated QR to DB:', err);
    }
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      success('Copied', 'Text copied to clipboard');

      // Save to backend database
      try {
        await apiClient.post('/qrcodes', {
          title: text.slice(0, 30) || 'Copied QR Content',
          content: text,
          actionType: 'generated'
        });
        if (onQrAction) onQrAction();
      } catch (err) {
        console.warn('Failed to persist generated QR to DB:', err);
      }
    } catch { /* ignore */ }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Settings */}
      <div className="space-y-4">
        <Input
          label="QR Content"
          placeholder="Enter URL, text, or data…"
          value={text}
          onChange={e => setText(e.target.value)}
          rightIcon={
            <button onClick={copyText} className="text-surface-400 hover:text-brand-500">
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          }
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Foreground</label>
            <div className="flex items-center gap-2">
              <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)} className="w-10 h-10 rounded-lg border border-surface-300 dark:border-surface-600 cursor-pointer" />
              <input type="text" value={fgColor} onChange={e => setFgColor(e.target.value)} className="input text-xs font-mono" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Background</label>
            <div className="flex items-center gap-2">
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-10 h-10 rounded-lg border border-surface-300 dark:border-surface-600 cursor-pointer" />
              <input type="text" value={bgColor} onChange={e => setBgColor(e.target.value)} className="input text-xs font-mono" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select label="Size" value={String(size)} onChange={e => setSize(Number(e.target.value))}
            options={[
              { value: '128', label: '128 × 128' },
              { value: '256', label: '256 × 256' },
              { value: '512', label: '512 × 512' },
            ]} />
          <Select label="Error Correction" value={errorLevel} onChange={e => setErrorLevel(e.target.value)}
            options={[
              { value: 'L', label: 'Low (7%)' },
              { value: 'M', label: 'Medium (15%)' },
              { value: 'Q', label: 'Quartile (25%)' },
              { value: 'H', label: 'High (30%)' },
            ]} />
        </div>

        <Button variant="primary" onClick={downloadQR} icon={<Download className="w-4 h-4" />} className="w-full">
          Download QR Code
        </Button>
      </div>

      {/* Preview */}
      <div className="card p-6 flex flex-col items-center justify-center">
        <p className="text-sm font-medium text-surface-500 mb-4">Preview</p>
        <div className="bg-white rounded-2xl p-6 shadow-inner border border-surface-100 dark:border-surface-700">
          <canvas ref={canvasRef} className="max-w-full" />
        </div>
        {text && <p className="text-xs text-surface-400 mt-4 text-center max-w-xs truncate">{text}</p>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// QR SCANNER sub-component
// ══════════════════════════════════════════════════════════════════════════
function QRScanner({ onQrAction }: { onQrAction?: () => void }) {
  const { success, error: showError } = useToast();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState('');
  const [scanMethod, setScanMethod] = useState<'camera' | 'upload'>('camera');
  const scannerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startScanner = async () => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      if (scannerRef.current) { try { await scannerRef.current.stop(); } catch {} }
      const scanner = new Html5Qrcode('profile-qr-reader');
      scannerRef.current = scanner;
      setScanning(true);
      setResult('');
      await scanner.start(
        { facingMode: 'environment' },
        { fps: QR_CONFIG.scannerFps, qrbox: QR_CONFIG.scannerQrbox },
        (decoded: string) => {
          setResult(decoded);
          success('QR Code Found!', decoded.slice(0, 60));
          scanner.stop().catch(() => {});
          setScanning(false);

          // Save to backend database
          apiClient.post('/qrcodes', {
            title: `Scanned Code - ${new Date().toLocaleTimeString()}`,
            content: decoded,
            actionType: 'scanned'
          }).then(() => {
            if (onQrAction) onQrAction();
          }).catch((err) => {
            console.warn('Failed to save scanned QR code:', err);
          });
        },
        () => {}
      );
    } catch (err: any) {
      showError('Scanner Error', err?.message || 'Could not access camera');
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    try { await scannerRef.current?.stop(); } catch {}
    setScanning(false);
  };

  const scanFromFile = async (file: File) => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('profile-qr-reader-file');
      const decoded = await scanner.scanFile(file, true);
      setResult(decoded);
      success('QR Code Found!', decoded.slice(0, 60));

      // Save to backend database
      try {
        await apiClient.post('/qrcodes', {
          title: `Scanned File: ${file.name.slice(0, 20)}`,
          content: decoded,
          actionType: 'scanned'
        });
        if (onQrAction) onQrAction();
      } catch (err) {
        console.warn('Failed to save scanned QR file to DB:', err);
      }
    } catch {
      showError('Scan Failed', 'No QR code found in the image');
    }
  };

  useEffect(() => {
    return () => { scannerRef.current?.stop().catch(() => {}); };
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Scanner */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 bg-surface-100 dark:bg-dark-elevated rounded-xl p-1">
          {(['camera', 'upload'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setScanMethod(m); stopScanner(); }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                scanMethod === m ? 'bg-white dark:bg-dark-card text-brand-600 shadow-sm' : 'text-surface-500'
              }`}
            >
              {m === 'camera' ? <><Camera className="w-4 h-4" /> Camera</> : <><Upload className="w-4 h-4" /> Upload</>}
            </button>
          ))}
        </div>

        {scanMethod === 'camera' ? (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-surface-200 dark:border-white/10 rounded-2xl p-6 min-h-[220px]">
            <div id="profile-qr-reader" className="w-full max-w-[280px] overflow-hidden rounded-xl bg-black mb-4" />
            <div className="flex gap-2 w-full justify-center">
              {!scanning ? (
                <Button variant="primary" onClick={startScanner} icon={<Scan className="w-4 h-4" />}>Start Camera</Button>
              ) : (
                <Button variant="danger" onClick={stopScanner}>Stop Camera</Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-surface-200 dark:border-white/10 rounded-2xl p-6 min-h-[220px] cursor-pointer hover:bg-surface-50 dark:hover:bg-white/[0.01] transition-colors"
            onClick={() => fileInputRef.current?.click()}>
            <input type="file" ref={fileInputRef} onChange={e => e.target.files?.[0] && scanFromFile(e.target.files[0])} accept="image/*" className="hidden" />
            <div id="profile-qr-reader-file" className="hidden" />
            <Upload className="w-10 h-10 text-surface-400 mb-3" />
            <p className="text-sm font-medium text-surface-700 dark:text-surface-300">Click to Upload QR Image</p>
            <p className="text-xs text-surface-450 mt-1">Supports PNG, JPG, JPEG formats</p>
          </div>
        )}
      </div>

      {/* Result */}
      <div className="card p-6 flex flex-col justify-between min-h-[260px]">
        <div>
          <p className="text-sm font-medium text-surface-500 mb-4">Scan Result</p>
          {result ? (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex gap-3">
              <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 mb-1">QR Code Detected</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-400 break-all font-mono">{result}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-surface-400">
              <Scan className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm font-medium">No QR code scanned yet</p>
              <p className="text-xs mt-1 text-center">Use camera scanner or upload an image</p>
            </div>
          )}
        </div>
        {result && (
          <div className="flex gap-2 mt-4">
            <Button variant="secondary" onClick={() => { navigator.clipboard.writeText(result); success('Copied', ''); }} icon={<Copy className="w-4 h-4" />} className="flex-1">Copy</Button>
            {result.startsWith('http') && (
              <a href={result} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button variant="primary" className="w-full">Open Link</Button>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// PROFILE PAGE
// ══════════════════════════════════════════════════════════════════════════
export default function ProfilePage() {
  const { user, updateProfile, uploadAvatar } = useAuth();
  const { success, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileQrRef = useRef<HTMLCanvasElement>(null);

  const [activities, setActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: user?.location || '',
    phone: user?.phone || '',
  });

  // Dynamic live statistical metrics states
  const [counts, setCounts] = useState({
    maps: 0,
    routes: 0,
    qrs: 0,
    sessions: 42
  });

  // Fetch telemetry counts from server resources
  const loadCounts = useCallback(async () => {
    if (!user) return;
    try {
      // 1. Fetch Maps Count
      const mapsList = await mapService.listMaps();
      
      // 2. Fetch Routes Count
      let routesList = [];
      try {
        const res = await apiClient.get<any>('/routes?limit=100');
        routesList = res.docs || res || [];
      } catch (err) {
        console.warn('Failed to load routes count:', err);
      }
      
      // 3. Fetch Audit Logs for session operations count
      let totalSessions = 42;
      try {
        const res = await apiClient.get<any>('/audit-logs?limit=100');
        const logs = res.docs || res || [];
        const logins = logs.filter((l: any) => l.action === 'USER_LOGIN').length;
        totalSessions = logins > 0 ? logins : logs.length;
      } catch (err) {
        console.warn('Failed to load sessions count:', err);
      }

      // 4. Fetch recorded QR codes count from database
      let qrsCount = 0;
      try {
        const res = await apiClient.get<any>('/qrcodes');
        qrsCount = res.count !== undefined ? res.count : (res.data?.length || 0);
      } catch (err) {
        console.warn('Failed to load QR codes count:', err);
      }
      
      setCounts({
        maps: mapsList.length,
        routes: routesList.length,
        qrs: qrsCount,
        sessions: totalSessions
      });
    } catch (err) {
      console.warn('Failed to fetch profile counts:', err);
    }
  }, [user]);

  // Load counts on mount and tab shifts
  useEffect(() => {
    loadCounts();
  }, [loadCounts, activeTab]);

  const incrementQrCount = () => {
    setCounts(prev => ({ ...prev, qrs: prev.qrs + 1 }));
  };

  // Generate Profile QR on mount / user change
  useEffect(() => {
    if (!user || !profileQrRef.current) return;
    (async () => {
      try {
        const QRCode = (await import('qrcode')).default;
        const data = JSON.stringify({ name: user.name, email: user.email, role: user.role, location: user.location || '', joinedAt: user.joinedAt });
        await QRCode.toCanvas(profileQrRef.current, data, {
          width: 144, margin: 1, color: { dark: '#7c3aed', light: '#ffffff' },
        });
      } catch { /* ignore */ }
    })();
  }, [user]);

  // Sync form when user loads
  useEffect(() => {
    if (user) setForm({ name: user.name || '', bio: user.bio || '', location: user.location || '', phone: user.phone || '' });
  }, [user]);

  // Fetch audit logs for activity tab
  useEffect(() => {
    if (activeTab !== 'activity' || !user) return;
    setActivitiesLoading(true);
    apiClient.get<any>('/audit-logs?limit=20')
      .then(res => setActivities(res.docs || []))
      .catch(() => showError('Failed', 'Could not load activity history'))
      .finally(() => setActivitiesLoading(false));
  }, [activeTab, user, showError]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile(form);
      success('Profile updated', 'Your changes have been saved successfully');
      setActiveTab('overview');
    } catch (err: any) {
      showError('Update failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      await uploadAvatar(formData);
      success('Avatar updated', 'Your profile picture was successfully updated');
      loadCounts();
    } catch (err: any) {
      showError('Upload failed', err.message || 'Could not update avatar picture.');
    } finally {
      setAvatarLoading(false);
    }
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Profile' }]} />

      <div className="mb-6">
        <h1 className="page-title">Profile Settings</h1>
        <p className="page-subtitle">Manage your profile information and view system statistics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Profile Card */}
          <ProfileCard
            name={user.name}
            email={user.email}
            avatar={getAvatarUrl(user.avatar)}
            bio={user.bio}
            location={user.location}
            joinedAt={user.joinedAt}
            stats={[
              { label: 'Maps', value: counts.maps },
              { label: 'Routes', value: counts.routes },
              { label: 'QR Codes', value: counts.qrs },
            ]}
          />

          {/* Profile QR Card */}
          <div className="card p-6 flex flex-col items-center justify-center">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-brand-500" /> Profile QR Code
            </h3>
            <div className="bg-white rounded-2xl p-4 border border-surface-200 dark:border-surface-700 shadow-inner">
              <canvas ref={profileQrRef} className="w-36 h-36" />
            </div>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-3 text-center">
              Scan to share your profile contact card
            </p>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs
            items={[
              { key: 'overview',  label: 'Overview',    icon: <UserIcon className="w-4 h-4" /> },
              { key: 'edit',      label: 'Edit Profile', icon: <Edit3 className="w-4 h-4" /> },
              { key: 'qr',        label: 'QR Tools',    icon: <QrCode className="w-4 h-4" /> },
              { key: 'activity',  label: 'Activity',    icon: <Activity className="w-4 h-4" /> },
            ]}
            activeKey={activeTab}
            onChange={setActiveTab}
          />

          {/* ── Overview ── */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard icon={<Map className="w-5 h-5" />} label="Maps Saved" value={counts.maps} />
                <StatCard icon={<Compass className="w-5 h-5" />} label="Routes" value={counts.routes} />
                <StatCard icon={<QrCode className="w-5 h-5" />} label="QR Codes" value={counts.qrs} />
                <StatCard icon={<Activity className="w-5 h-5" />} label="Sessions" value={counts.sessions} />
              </div>
              <SettingsCard title="Personal Information">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[
                    { label: 'Full Name', value: user.name },
                    { label: 'Email', value: user.email },
                    { label: 'Location', value: user.location || 'Not set' },
                    { label: 'Joined', value: formatDate(user.joinedAt) },
                  ].map(row => (
                    <div key={row.label}>
                      <p className="text-xs text-surface-500 uppercase tracking-wider font-medium">{row.label}</p>
                      <p className="text-sm font-semibold text-surface-900 dark:text-white mt-1">{row.value}</p>
                    </div>
                  ))}
                </div>
              </SettingsCard>
            </div>
          )}

          {/* ── Edit Profile ── */}
          {activeTab === 'edit' && (
            <SettingsCard title="Edit Profile" description="Update your personal information" className="animate-fade-in">
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="relative group cursor-pointer" onClick={() => { if (!avatarLoading) fileInputRef.current?.click(); }}>
                    <Avatar name={user.name} src={getAvatarUrl(user.avatar)} size="xl" />
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-900 dark:text-white">Profile Photo</p>
                    <p className="text-xs text-surface-500 mt-0.5">Click to upload. JPG, PNG. Max 5MB.</p>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} leftIcon={<UserIcon className="w-4 h-4" />} />
                  <Input label="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} leftIcon={<Phone className="w-4 h-4" />} placeholder="+1 234 567 8900" />
                </div>
                <Input label="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} leftIcon={<MapPin className="w-4 h-4" />} placeholder="City, Country" />
                <Textarea label="Bio" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Tell us about yourself…" rows={3} />
                <div className="flex justify-end gap-3">
                  <Button variant="secondary" onClick={() => setActiveTab('overview')}>Cancel</Button>
                  <Button variant="primary" onClick={handleSave} loading={loading} icon={<Save className="w-4 h-4" />}>Save Changes</Button>
                </div>
              </div>
            </SettingsCard>
          )}

          {/* ── QR Tools ── */}
          {activeTab === 'qr' && (
            <div className="space-y-6 animate-fade-in">
              <QRSubTabs user={user} onQrAction={incrementQrCount} />
            </div>
          )}

          {/* ── Activity ── */}
          {activeTab === 'activity' && (
            <SettingsCard title="Recent Activity" className="animate-fade-in">
              <div className="space-y-4">
                {activitiesLoading ? (
                  <div className="py-6 text-center text-sm text-surface-400">Loading activities…</div>
                ) : activities.length === 0 ? (
                  <div className="py-6 text-center text-sm text-surface-400">No activity logs recorded yet.</div>
                ) : activities.map((item, i) => (
                  <div key={item._id || i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-white/[0.02] transition-colors">
                    <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
                      {getActivityIcon(item.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-surface-800 dark:text-surface-200 font-medium">{item.action.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-surface-500 mt-0.5">{item.description}</p>
                      <p className="text-[10px] text-surface-400 mt-1">{timeAgo(item.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SettingsCard>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// QR sub-tabs inside the QR Tools tab
// ══════════════════════════════════════════════════════════════════════════
function QRSubTabs({ user, onQrAction }: { user: any; onQrAction?: () => void }) {
  const [sub, setSub] = useState<'generate' | 'scan'>('generate');
  const profileText = user ? JSON.stringify({ name: user.name, email: user.email, role: user.role }) : '';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 bg-surface-100 dark:bg-dark-elevated rounded-xl p-1 w-fit">
        {(['generate', 'scan'] as const).map(k => (
          <button
            key={k}
            onClick={() => setSub(k)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              sub === k ? 'bg-white dark:bg-dark-card text-brand-600 shadow-sm' : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            {k === 'generate' ? <><QrCode className="w-4 h-4" /> Generator</> : <><Scan className="w-4 h-4" /> Scanner</>}
          </button>
        ))}
      </div>

      <div key={sub} className="animate-fade-in">
        {sub === 'generate' ? (
          <QRGenerator defaultText={profileText} onQrAction={onQrAction} />
        ) : (
          <QRScanner onQrAction={onQrAction} />
        )}
      </div>
    </div>
  );
}
