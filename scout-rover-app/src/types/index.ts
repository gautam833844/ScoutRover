// ========== AUTH TYPES ==========
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  phone?: string;
  joinedAt: string;
  lastLogin?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// ========== ROS TYPES ==========
export interface RosConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  url: string;
  error?: string;
}

export interface OccupancyGrid {
  info: {
    width: number;
    height: number;
    resolution: number;
    origin: {
      position: { x: number; y: number; z: number };
      orientation: { x: number; y: number; z: number; w: number };
    };
  };
  data: number[];
}

export interface TwistMessage {
  linear: { x: number; y: number; z: number };
  angular: { x: number; y: number; z: number };
}

export type RoverDirection = 'forward' | 'backward' | 'left' | 'right' | 'stop';

// ========== MAP TYPES ==========
export type MapMode = 'standard' | 'satellite' | 'lidar';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
  color?: string;
}

export interface MapRoute {
  id: string;
  points: Array<{ lat: number; lng: number }>;
  distance: number;
  color?: string;
}

// ========== QR TYPES ==========
export interface QRConfig {
  text: string;
  size: number;
  fgColor: string;
  bgColor: string;
  errorLevel: 'L' | 'M' | 'Q' | 'H';
}

export interface QRScanResult {
  text: string;
  timestamp: string;
}

// ========== UI TYPES ==========
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

export interface StatCard {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
}

// ========== THEME TYPES ==========
export type Theme = 'light' | 'dark' | 'system';

// ========== ACTIVITY TYPES ==========
export interface Activity {
  id: string;
  type: 'map_saved' | 'route_created' | 'qr_generated' | 'qr_scanned' | 'rover_connected' | 'settings_changed';
  description: string;
  timestamp: string;
}
