'use client';

import React, { useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Map, User, Settings, LogOut,
  Menu, X, Sun, Moon, ChevronLeft, Compass,
  Wifi, WifiOff, Activity, Shield
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Avatar, Button, Tooltip } from '@/components/ui';
import { APP_CONFIG, ROUTES } from '@/constants';

// ========== SIDEBAR NAV ITEMS — QR removed, lives in Profile now ==========
const navItems = [
  { label: 'Dashboard', href: ROUTES.DASHBOARD, icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Maps',      href: ROUTES.MAPS,      icon: <Map className="w-5 h-5" /> },
  { label: 'Profile',   href: ROUTES.PROFILE,   icon: <User className="w-5 h-5" /> },
  { label: 'Settings',  href: ROUTES.SETTINGS,  icon: <Settings className="w-5 h-5" /> },
];

// ========== HEADER ==========
export function Header() {
  const { user, isAuthenticated } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const pathname = usePathname();

  const isAuthPage = ([ROUTES.LOGIN, ROUTES.REGISTER, ROUTES.FORGOT_PASSWORD] as readonly string[]).includes(pathname);
  const isHomePage = pathname === '/';

  return (
    <header className={clsx(
      'top-0 z-50 w-full border-b transition-all duration-300',
      isHomePage
        ? 'absolute bg-transparent border-transparent'
        : 'sticky bg-white/90 dark:bg-dark-bg/90 backdrop-blur-xl border-surface-200 dark:border-white/[0.06]'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <img 
            src="/atlas-logo.jpg" 
            alt="Atlas Logo" 
            className="w-9 h-9 rounded-xl object-cover shadow-glow group-hover:shadow-glow-lg transition-all"
          />
          <span className={clsx(
            'text-xl font-bold tracking-tight lowercase font-sans',
            isHomePage ? 'text-white' : 'text-surface-900 dark:text-white'
          )}>
            atlas
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <Tooltip content={resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}>
            <button
              onClick={toggleTheme}
              className={clsx(
                'p-2.5 rounded-xl transition-all hover:scale-105',
                isHomePage
                  ? 'text-white/70 hover:text-white hover:bg-white/10'
                  : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-white/5 dark:text-surface-400'
              )}
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </Tooltip>

          {isAuthenticated && user ? (
            <Link href={ROUTES.PROFILE}>
              <Avatar name={user.name} src={user.avatar} size="sm" />
            </Link>
          ) : !isAuthPage && (
            <div className="flex items-center gap-2">
              <Link href={ROUTES.LOGIN}>
                <Button variant="ghost" size="sm" className={isHomePage ? '!text-white/80 hover:!text-white hover:!bg-white/10' : ''}>
                  Sign in
                </Button>
              </Link>
              <Link href={ROUTES.REGISTER}>
                <Button variant="primary" size="sm">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ========== SIDEBAR ==========
interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={clsx(
        'hidden lg:flex flex-col fixed left-0 top-16 bottom-0 z-30 bg-white dark:bg-dark-card border-r border-surface-200 dark:border-white/[0.06] transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-60'
      )}>
        <div className="flex-1 py-4 flex flex-col">
          {/* Collapse toggle */}
          <button
            onClick={onToggle}
            className="mx-3 mb-2 p-2 rounded-lg text-surface-400 hover:bg-surface-100 dark:hover:bg-white/5 transition-colors self-end"
          >
            <ChevronLeft className={clsx('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
          </button>

          {/* Nav items */}
          <nav className="flex-1 px-3 space-y-1">
            {navItems.map(item => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                    isActive
                      ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400'
                      : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-white/5 hover:text-surface-900 dark:hover:text-white'
                  )}
                >
                  <span className={clsx(isActive && 'text-brand-600 dark:text-brand-400')}>
                    {item.icon}
                  </span>
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="px-3 space-y-1 mt-auto pt-4 border-t border-surface-200 dark:border-white/[0.08]">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-white/5 w-full transition-colors"
            >
              {resolvedTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              {!collapsed && <span>{resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 w-full transition-colors"
            >
              <LogOut className="w-5 h-5" />
              {!collapsed && <span>Logout</span>}
            </button>
          </div>

          {/* User */}
          {user && !collapsed && (
            <div className="px-3 py-3 mt-2 border-t border-surface-200 dark:border-white/[0.08]">
              <Link href={ROUTES.PROFILE} className="flex items-center gap-3 group">
                <Avatar name={user.name} src={user.avatar} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-900 dark:text-white truncate">{user.name}</p>
                  <p className="text-xs text-surface-500 truncate">{user.email}</p>
                </div>
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-dark-card/90 backdrop-blur-xl border-t border-surface-200 dark:border-white/[0.06] safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors',
                  isActive
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-surface-500 dark:text-surface-400'
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

// ========== FOOTER ==========
export function Footer() {
  return (
    <footer className="border-t border-surface-200 dark:border-white/[0.08] bg-white dark:bg-dark-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <img 
                src="/atlas-logo.jpg" 
                alt="Atlas Logo" 
                className="w-9 h-9 rounded-xl object-cover"
              />
              <span className="text-xl font-bold tracking-tight lowercase text-surface-900 dark:text-white font-sans">
                atlas
              </span>
            </div>
            <p className="text-sm text-surface-500 dark:text-surface-400 max-w-sm leading-relaxed mb-4">
              {APP_CONFIG.description}. Built with ROS, LiDAR, and real-time WebSocket control for autonomous exploration.
            </p>
            <div className="flex items-center gap-1 text-xs text-surface-400">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>System operational</span>
            </div>
          </div>

          {/* Platform links — direct to dashboard sections */}
          <div>
            <h4 className="font-semibold text-surface-900 dark:text-white mb-4 text-sm uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2.5 text-sm text-surface-500 dark:text-surface-400">
              <li><Link href={ROUTES.DASHBOARD} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-2"><LayoutDashboard className="w-3.5 h-3.5" /> Dashboard</Link></li>
              <li><Link href={ROUTES.MAPS} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-2"><Map className="w-3.5 h-3.5" /> Maps & Routes</Link></li>
              <li><Link href={ROUTES.PROFILE} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-2"><User className="w-3.5 h-3.5" /> Profile & QR</Link></li>
              <li><Link href={ROUTES.SETTINGS} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-2"><Settings className="w-3.5 h-3.5" /> Settings</Link></li>
            </ul>
          </div>

          {/* Rover & ROS links */}
          <div>
            <h4 className="font-semibold text-surface-900 dark:text-white mb-4 text-sm uppercase tracking-wider">Rover</h4>
            <ul className="space-y-2.5 text-sm text-surface-500 dark:text-surface-400">
              <li><Link href={ROUTES.SETTINGS + '#rover'} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-2"><Wifi className="w-3.5 h-3.5" /> Connection Config</Link></li>
              <li><Link href={ROUTES.SETTINGS + '#mapping'} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-2"><Activity className="w-3.5 h-3.5" /> Mapping Algorithm</Link></li>
              <li><Link href={ROUTES.DASHBOARD} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-2"><WifiOff className="w-3.5 h-3.5" /> Live Control</Link></li>
              <li><Link href={ROUTES.MAPS} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-2"><Shield className="w-3.5 h-3.5" /> Export Maps</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-surface-200 dark:border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-surface-400">
            © {new Date().getFullYear()} {APP_CONFIG.name}. All rights reserved.
          </p>
          <p className="text-xs text-surface-400">
            v{APP_CONFIG.version} — Autonomous Mapping System
          </p>
        </div>
      </div>
    </footer>
  );
}

// ========== DASHBOARD LAYOUT ==========
export function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-dark-bg">
      <Header />
      <div className="flex">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className={clsx(
          'flex-1 min-h-[calc(100vh-4rem)] transition-all duration-300 pb-20 lg:pb-0',
          sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-60'
        )}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// ========== AUTH LAYOUT ==========
export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute inset-0 bg-glow-gradient" />
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-center">
          <img 
            src="/atlas-logo.jpg" 
            alt="Atlas Logo" 
            className="w-20 h-20 rounded-2xl object-cover mb-8 shadow-glow-lg animate-float"
          />
          <h1 className="text-4xl font-bold tracking-tight lowercase text-white mb-4 font-sans">atlas</h1>
          <p className="text-lg text-white/60 max-w-md leading-relaxed">
            {APP_CONFIG.description}
          </p>
          <div className="mt-12 grid grid-cols-3 gap-8">
            {[
              { value: 'LiDAR', label: 'Mapping' },
              { value: 'SLAM', label: 'Navigation' },
              { value: 'Real-time', label: 'Control' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-white/40 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white dark:bg-dark-bg">
        <div className="w-full max-w-md animate-fade-in-up">
          <Link href="/" className="flex items-center gap-2.5 mb-8 lg:hidden">
            <img 
              src="/atlas-logo.jpg" 
              alt="Atlas Logo" 
              className="w-9 h-9 rounded-xl object-cover"
            />
            <span className="text-xl font-bold tracking-tight lowercase text-surface-900 dark:text-white font-sans">
              atlas
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-1">{title}</h2>
          <p className="text-surface-500 dark:text-surface-400 mb-8">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
