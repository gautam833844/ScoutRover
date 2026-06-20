'use client';

import React, { useState } from 'react';
import {
  User, Mail, MapPin, Phone, Calendar, Edit3, Camera, Save,
  Map, QrCode, Compass, Activity
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { Button, Input, Textarea, Avatar, Breadcrumb, Badge, Tabs } from '@/components/ui';
import { StatCard, ProfileCard, SettingsCard } from '@/components/cards';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { formatDate } from '@/utils/helpers';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { success, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: user?.location || '',
    phone: user?.phone || '',
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile(form);
      success('Profile updated', 'Your changes have been saved');
      setEditing(false);
    } catch (err: any) {
      showError('Update failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Profile' }]} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Card */}
        <div className="space-y-6">
          <ProfileCard
            name={user.name}
            email={user.email}
            avatar={user.avatar}
            bio={user.bio}
            location={user.location}
            joinedAt={user.joinedAt}
            stats={[
              { label: 'Maps', value: 12 },
              { label: 'Routes', value: 8 },
              { label: 'QR Codes', value: 24 },
            ]}
          />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs
            items={[
              { key: 'overview', label: 'Overview', icon: <User className="w-4 h-4" /> },
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
                  <Avatar name={user.name} src={user.avatar} size="xl" />
                  <div>
                    <p className="text-sm font-medium text-surface-900 dark:text-white">Profile Photo</p>
                    <p className="text-xs text-surface-500 mt-0.5">JPG, PNG. Max 2MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full name"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    leftIcon={<User className="w-4 h-4" />}
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
                {[
                  { text: 'Generated QR code for rover connection URL', time: '2 hours ago', icon: <QrCode className="w-4 h-4" /> },
                  { text: 'Saved map from LiDAR scan', time: '5 hours ago', icon: <Map className="w-4 h-4" /> },
                  { text: 'Created route in satellite view', time: '1 day ago', icon: <Compass className="w-4 h-4" /> },
                  { text: 'Updated profile information', time: '3 days ago', icon: <User className="w-4 h-4" /> },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-white/[0.02] transition-colors">
                    <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-sm text-surface-800 dark:text-surface-200">{item.text}</p>
                      <p className="text-xs text-surface-400 mt-0.5">{item.time}</p>
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
