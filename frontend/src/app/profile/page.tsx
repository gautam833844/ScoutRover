'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  User as UserIcon, Mail, MapPin, Phone, Calendar, Edit3, Camera, Save,
  Map, QrCode, Compass, Activity, Shield
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { Button, Input, Textarea, Avatar, Breadcrumb, Badge, Tabs } from '@/components/ui';
import { StatCard, ProfileCard, SettingsCard } from '@/components/cards';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { formatDate, timeAgo } from '@/utils/helpers';
import apiClient from '@/services/apiClient';

export default function ProfilePage() {
  const { user, updateProfile, uploadAvatar } = useAuth();
  const { success, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [editing, setEditing] = useState(false);
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

  // Generate Profile QR Code
  useEffect(() => {
    if (!user || !profileQrRef.current) return;
    
    const generateProfileQR = async () => {
      try {
        const QRCode = (await import('qrcode')).default;
        const profileData = JSON.stringify({
          name: user.name,
          email: user.email,
          role: user.role,
          location: user.location || 'Not set',
          joinedAt: user.joinedAt,
        });
        await QRCode.toCanvas(profileQrRef.current, profileData, {
          width: 144,
          margin: 1,
          color: {
            dark: '#7c3aed', // Purple brand color
            light: '#ffffff',
          },
        });
      } catch (err) {
        console.error('Failed to generate profile QR:', err);
      }
    };

    generateProfileQR();
  }, [user]);

  // Keep form in sync when user loads
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        bio: user.bio || '',
        location: user.location || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  // Fetch real activities from audit logs when clicking activity tab
  useEffect(() => {
    if (activeTab === 'activity' && user) {
      setActivitiesLoading(true);
      apiClient.get<any>(`/audit-logs?limit=20`)
        .then((res) => {
          setActivities(res.docs || []);
        })
        .catch((err) => {
          showError('Failed', 'Could not load your activity history logs');
        })
        .finally(() => {
          setActivitiesLoading(false);
        });
    }
  }, [activeTab, user, showError]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile(form);
      success('Profile updated', 'Your changes have been saved successfully');
      setEditing(false);
    } catch (err: any) {
      showError('Update failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showError('Upload failed', 'Photo size must be less than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    setAvatarLoading(true);
    try {
      await uploadAvatar(formData);
      success('Avatar updated', 'Your profile picture has been updated');
    } catch (err: any) {
      showError('Upload failed', err.message);
    } finally {
      setAvatarLoading(false);
    }
  };

  const getAvatarUrl = (avatarPath?: string) => {
    if (!avatarPath) return '';
    if (avatarPath.startsWith('http')) return avatarPath;
    const backendBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
    return `${backendBase}${avatarPath}`;
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'USER_LOGIN':
      case 'USER_LOGOUT':
      case 'USER_REGISTER':
      case 'USER_UPDATE_PROFILE':
        return <UserIcon className="w-4 h-4" />;
      case 'MAP_CREATE':
      case 'MAP_DELETE':
      case 'MAP_UPDATE':
        return <Map className="w-4 h-4" />;
      case 'MARKER_CREATE':
      case 'MARKER_DELETE':
      case 'MARKER_UPDATE':
        return <MapPin className="w-4 h-4" />;
      case 'ROUTE_CREATE':
      case 'ROUTE_DELETE':
      case 'ROUTE_UPDATE':
        return <Compass className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Profile' }]} />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarChange}
        style={{ display: 'none' }}
        accept="image/*"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Card */}
        <div className="space-y-6">
          <ProfileCard
            name={user.name}
            email={user.email}
            avatar={getAvatarUrl(user.avatar)}
            bio={user.bio}
            location={user.location}
            joinedAt={user.joinedAt}
            stats={[
              { label: 'Maps', value: 12 },
              { label: 'Routes', value: 8 },
              { label: 'QR Codes', value: 24 },
            ]}
          />

          <div className="card p-6 flex flex-col items-center justify-center">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-brand-500" />
              Profile QR Code
            </h3>
            <div className="bg-white rounded-2xl p-4 border border-surface-200 dark:border-surface-700 shadow-inner">
              <canvas ref={profileQrRef} className="w-36 h-36" />
            </div>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-3 text-center">
              Scan to share profile contact details
            </p>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs
            items={[
              { key: 'overview', label: 'Overview', icon: <UserIcon className="w-4 h-4" /> },
              { key: 'edit', label: 'Edit Profile', icon: <Edit3 className="w-4 h-4" /> },
              { key: 'activity', label: 'Activity', icon: <Activity className="w-4 h-4" /> },
            ]}
            activeKey={activeTab}
            onChange={setActiveTab}
          />

          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard icon={<Map className="w-5 h-5" />} label="Maps Saved" value={12} />
                <StatCard icon={<Compass className="w-5 h-5" />} label="Routes" value={8} />
                <StatCard icon={<QrCode className="w-5 h-5" />} label="QR Codes" value={24} />
                <StatCard icon={<Activity className="w-5 h-5" />} label="Sessions" value={42} />
              </div>

              {/* Info */}
              <SettingsCard title="Personal Information">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-surface-500 uppercase tracking-wider font-medium">Full Name</p>
                    <p className="text-sm font-semibold text-surface-900 dark:text-white mt-1">{user.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-500 uppercase tracking-wider font-medium">Email</p>
                    <p className="text-sm font-semibold text-surface-900 dark:text-white mt-1">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-500 uppercase tracking-wider font-medium">Location</p>
                    <p className="text-sm text-surface-900 dark:text-white mt-1">{user.location || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-500 uppercase tracking-wider font-medium">Joined</p>
                    <p className="text-sm text-surface-900 dark:text-white mt-1">{formatDate(user.joinedAt)}</p>
                  </div>
                </div>
              </SettingsCard>
            </div>
          )}

          {activeTab === 'edit' && (
            <SettingsCard title="Edit Profile" description="Update your personal information" className="animate-fade-in">
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                    <Avatar name={user.name} src={getAvatarUrl(user.avatar)} size="xl" />
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-900 dark:text-white">Profile Photo</p>
                    <p className="text-xs text-surface-500 mt-0.5">Click photo to upload. JPG, PNG. Max 5MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full name"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    leftIcon={<UserIcon className="w-4 h-4" />}
                  />
                  <Input
                    label="Phone"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    leftIcon={<Phone className="w-4 h-4" />}
                    placeholder="+1 234 567 8900"
                  />
                </div>

                <Input
                  label="Location"
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  leftIcon={<MapPin className="w-4 h-4" />}
                  placeholder="City, Country"
                />

                <Textarea
                  label="Bio"
                  value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />

                <div className="flex justify-end gap-3">
                  <Button variant="secondary" onClick={() => setActiveTab('overview')}>Cancel</Button>
                  <Button variant="primary" onClick={handleSave} loading={loading} icon={<Save className="w-4 h-4" />}>
                    Save Changes
                  </Button>
                </div>
              </div>
            </SettingsCard>
          )}

          {activeTab === 'activity' && (
            <SettingsCard title="Recent Activity" className="animate-fade-in">
              <div className="space-y-4">
                {activitiesLoading ? (
                  <div className="py-6 text-center text-sm text-surface-400">Loading activities...</div>
                ) : activities.length === 0 ? (
                  <div className="py-6 text-center text-sm text-surface-400">No activity logs recorded yet.</div>
                ) : (
                  activities.map((item, i) => (
                    <div key={item._id || i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-white/[0.02] transition-colors">
                      <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
                        {getActivityIcon(item.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-surface-800 dark:text-surface-200 font-medium">
                          {item.action.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-surface-500 mt-0.5">{item.description}</p>
                        <p className="text-[10px] text-surface-400 mt-1">{timeAgo(item.timestamp)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SettingsCard>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
