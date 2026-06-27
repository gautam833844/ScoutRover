'use client';

import React, { ReactNode } from 'react';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import { Badge, Avatar } from '@/components/ui';
import { timeAgo } from '@/utils/helpers';

// ========== STAT CARD ==========
interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: ReactNode;
  className?: string;
}

export function StatCard({ label, value, change, changeType = 'neutral', icon, className }: StatCardProps) {
  return (
    <div className={clsx('card p-5', className)}>
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
          {icon}
        </div>
        {change && (
          <div className={clsx('flex items-center gap-1 text-xs font-medium', {
            'text-emerald-600 dark:text-emerald-400': changeType === 'positive',
            'text-red-600 dark:text-red-400': changeType === 'negative',
            'text-surface-500': changeType === 'neutral',
          })}>
            {changeType === 'positive' && <TrendingUp className="w-3.5 h-3.5" />}
            {changeType === 'negative' && <TrendingDown className="w-3.5 h-3.5" />}
            {changeType === 'neutral' && <Minus className="w-3.5 h-3.5" />}
            {change}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-surface-900 dark:text-white">{value}</p>
      <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">{label}</p>
    </div>
  );
}

// ========== FEATURE CARD ==========
interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
  onClick?: () => void;
}

export function FeatureCard({ icon, title, description, className, onClick }: FeatureCardProps) {
  return (
    <div
      className={clsx(
        'card-hover p-6 group',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <div className="p-3 rounded-xl bg-gradient-to-br from-brand-500/10 to-cyan-500/10 text-brand-600 dark:text-brand-400 w-fit mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed">{description}</p>
    </div>
  );
}

// ========== ACTIVITY CARD ==========
interface ActivityCardProps {
  items: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    icon?: ReactNode;
  }>;
  className?: string;
}

export function ActivityCard({ items, className }: ActivityCardProps) {
  return (
    <div className={clsx('card', className)}>
      <div className="px-5 py-4 border-b border-surface-200 dark:border-white/[0.08]">
        <h3 className="font-semibold text-surface-900 dark:text-white">Recent Activity</h3>
      </div>
      <div className="divide-y divide-surface-100 dark:divide-white/[0.05]">
        {items.length === 0 ? (
          <p className="p-5 text-sm text-surface-500 text-center">No recent activity</p>
        ) : (
          items.slice(0, 5).map(item => (
            <div key={item.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-surface-50 dark:hover:bg-white/[0.02] transition-colors">
              <div className="p-1.5 rounded-lg bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 mt-0.5">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-surface-800 dark:text-surface-200">{item.description}</p>
                <p className="text-xs text-surface-400 mt-0.5">{timeAgo(item.timestamp)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ========== PROFILE CARD ==========
interface ProfileCardProps {
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  joinedAt?: string;
  stats?: Array<{ label: string; value: string | number }>;
  className?: string;
  onEdit?: () => void;
}

export function ProfileCard({ name, email, avatar, bio, location, joinedAt, stats, className, onEdit }: ProfileCardProps) {
  return (
    <div className={clsx('card overflow-hidden', className)}>
      {/* Banner */}
      <div className="h-24 bg-gradient-to-r from-brand-600 via-brand-500 to-cyan-500 relative">
        <div className="absolute inset-0 bg-grid opacity-20" />
      </div>
      {/* Avatar & Info */}
      <div className="px-6 pb-5 -mt-10">
        <Avatar name={name} src={avatar} size="xl" className="ring-4 ring-white dark:ring-dark-card" />
        <div className="mt-3">
          <h3 className="text-xl font-bold text-surface-900 dark:text-white">{name}</h3>
          <p className="text-sm text-surface-500">{email}</p>
          {bio && <p className="text-sm text-surface-600 dark:text-surface-400 mt-2">{bio}</p>}
          <div className="flex items-center gap-4 mt-3 text-xs text-surface-400">
            {location && <span>📍 {location}</span>}
            {joinedAt && <span>Joined {new Date(joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>}
          </div>
        </div>
        {stats && stats.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-surface-200 dark:border-white/[0.08]">
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-lg font-bold text-surface-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-surface-500">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ========== INFO CARD ==========
interface InfoCardProps {
  title: string;
  value: string | ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function InfoCard({ title, value, icon, className }: InfoCardProps) {
  return (
    <div className={clsx('card p-4 flex items-center gap-4', className)}>
      {icon && (
        <div className="p-2.5 rounded-xl bg-surface-100 dark:bg-white/5 text-surface-600 dark:text-surface-400">
          {icon}
        </div>
      )}
      <div>
        <p className="text-xs text-surface-500 uppercase tracking-wider font-medium">{title}</p>
        <p className="text-sm font-semibold text-surface-900 dark:text-white mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ========== SETTINGS CARD ==========
interface SettingsCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function SettingsCard({ title, description, children, className }: SettingsCardProps) {
  return (
    <div className={clsx('card', className)}>
      <div className="px-6 py-4 border-b border-surface-200 dark:border-white/[0.08]">
        <h3 className="font-semibold text-surface-900 dark:text-white">{title}</h3>
        {description && <p className="text-sm text-surface-500 mt-0.5">{description}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ========== LINK CARD ==========
interface LinkCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  href: string;
  badge?: string;
  className?: string;
}

export function LinkCard({ title, description, icon, href, badge, className }: LinkCardProps) {
  return (
    <a href={href} className={clsx('card-interactive p-5 flex items-start gap-4 group', className)}>
      <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-surface-900 dark:text-white">{title}</h3>
          {badge && <Badge variant="brand">{badge}</Badge>}
        </div>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">{description}</p>
      </div>
      <ArrowRight className="w-5 h-5 text-surface-400 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
    </a>
  );
}
