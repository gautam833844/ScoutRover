'use client';

import React, { useState } from 'react';
import {
  Sun, Moon, Monitor, Bell, Lock, Shield, Globe, Palette,
  Wifi, Sliders, Save, Eye, EyeOff
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { Button, Input, Toggle, Select, Breadcrumb } from '@/components/ui';
import { SettingsCard } from '@/components/cards';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { ROS_CONFIG } from '@/constants';
import { Theme } from '@/types';

export default function SettingsPage() {
  const { user, changePassword } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { success, error: showError } = useToast();
  const [rosUrl, setRosUrl] = useState(ROS_CONFIG.url);
  const [notifications, setNotifications] = useState(true);
  const [mapDefault, setMapDefault] = useState('standard');
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);

  const handleChangePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      showError('Error', 'New passwords do not match');
      return;
    }
    if (passwordForm.new.length < 8) {
      showError('Error', 'Password must be at least 8 characters');
      return;
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
    { key: 'dark', label: 'Dark', icon: <Moon className="w-5 h-5" /> },
    { key: 'system', label: 'System', icon: <Monitor className="w-5 h-5" /> },
  ];

  return (
    <DashboardLayout>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Settings' }]} />

      <div className="mb-6">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your preferences and account settings</p>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Appearance */}
        <SettingsCard title="Appearance" description="Customize the look and feel">
          <div className="space-y-5">
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
          </div>
        </SettingsCard>

        {/* Rover Connection */}
        <SettingsCard title="Rover Connection" description="Configure the ROS bridge connection">
          <div className="space-y-4">
            <Input
              label="ROS Bridge URL"
              value={rosUrl}
              onChange={e => setRosUrl(e.target.value)}
              placeholder="ws://10.200.95.151:9090"
              leftIcon={<Wifi className="w-4 h-4" />}
              hint="WebSocket URL for the ROS bridge server running on your rover"
            />
            <Select
              label="Default Map Mode"
              value={mapDefault}
              onChange={e => setMapDefault(e.target.value)}
              options={[
                { value: 'standard', label: 'Standard (OpenStreetMap)' },
                { value: 'satellite', label: 'Satellite (Esri)' },
                { value: 'lidar', label: 'LiDAR (Rover)' },
              ]}
            />
          </div>
        </SettingsCard>

        {/* Notifications */}
        <SettingsCard title="Notifications" description="Control notification preferences">
          <div className="space-y-4">
            <Toggle
              checked={notifications}
              onChange={setNotifications}
              label="Enable notifications"
              description="Receive alerts for connection status changes"
            />
            <Toggle
              checked={true}
              onChange={() => {}}
              label="Map update alerts"
              description="Notify when new LiDAR data is available"
            />
            <Toggle
              checked={false}
              onChange={() => {}}
              label="Sound effects"
              description="Play sounds for button presses and notifications"
            />
          </div>
        </SettingsCard>

        {/* Security */}
        <SettingsCard title="Security" description="Update your password and security settings">
          <div className="space-y-4">
            <Input
              label="Current password"
              type="password"
              value={passwordForm.current}
              onChange={e => setPasswordForm(f => ({ ...f, current: e.target.value }))}
              leftIcon={<Lock className="w-4 h-4" />}
            />
            <Input
              label="New password"
              type="password"
              value={passwordForm.new}
              onChange={e => setPasswordForm(f => ({ ...f, new: e.target.value }))}
              leftIcon={<Lock className="w-4 h-4" />}
            />
            <Input
              label="Confirm new password"
              type="password"
              value={passwordForm.confirm}
              onChange={e => setPasswordForm(f => ({ ...f, confirm: e.target.value }))}
              leftIcon={<Lock className="w-4 h-4" />}
            />
            <Button
              variant="primary"
              onClick={handleChangePassword}
              loading={pwLoading}
              icon={<Save className="w-4 h-4" />}
              disabled={!passwordForm.current || !passwordForm.new}
            >
              Update Password
            </Button>
          </div>
        </SettingsCard>

        {/* Danger Zone */}
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
