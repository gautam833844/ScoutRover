// ========== ROUTE PATHS ==========
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/dashboard',
  MAPS: '/maps',
  QR_CODE: '/qr-code',
  PROFILE: '/profile',
  SETTINGS: '/settings',
} as const;

// ========== APP CONFIG ==========
export const APP_CONFIG = {
  name: 'Atlas',
  description: 'Autonomous Mapping System — LiDAR Mapping, SLAM, and Web Control',
  version: '2.0.0',
  author: 'Atlas Team',
} as const;

// ========== ROS CONFIG ==========
// Priority: localStorage (user-set in Settings) → .env → hardcoded fallback
const getStoredRosUrl = (): string => {
  if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_ROS_URL || 'ws://localhost:9090';
  const saved = localStorage.getItem('scoutrover_ros_url');
  if (saved) return saved;
  if (process.env.NEXT_PUBLIC_ROS_URL) return process.env.NEXT_PUBLIC_ROS_URL;
  
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'ws://localhost:9090';
  }
  return 'ws://192.168.137.85:9090';
};

const getStoredMapTopic = (): string => {
  if (typeof window === 'undefined') return '/map';
  try {
    const cfg = JSON.parse(localStorage.getItem('scoutrover_mapping_config') || '{}');
    return cfg.mapTopic || '/map';
  } catch { return '/map'; }
};

export const ROS_CONFIG = {
  get url() { return getStoredRosUrl(); },
  get mapTopic() { return getStoredMapTopic(); },
  reconnectInterval: 3000,
  connectionTimeout: 8000,
  cmdVelTopic: '/cmd_vel',
  sysCommandTopic: '/syscommand',
  mapThrottleRate: 5000,
  cmdSendInterval: 100,
  linearSpeed: 0.5,
  angularSpeed: 0.5,
} as const;

// ========== MAP CONFIG ==========
export const MAP_CONFIG = {
  defaultCenter: { lat: 20.5937, lng: 78.9629 } as const,
  defaultZoom: 5,
  maxZoom: 19,
  tileProviders: {
    standard: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    },
    terrain: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    },
  },
} as const;

// ========== AUTH CONFIG ==========
export const AUTH_CONFIG = {
  storageKey: 'scoutrover_users',
  sessionKey: 'scoutrover_session',
  tokenKey: 'scoutrover_token',
  minPasswordLength: 8,
  maxNameLength: 50,
  sessionDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;

// ========== QR CONFIG ==========
export const QR_CONFIG = {
  defaultSize: 256,
  defaultFgColor: '#7c3aed',
  defaultBgColor: '#ffffff',
  defaultErrorLevel: 'M' as const,
  scannerFps: 10,
  scannerQrbox: { width: 250, height: 250 },
} as const;

// ========== NAV ITEMS ==========
export const DASHBOARD_NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', href: ROUTES.DASHBOARD },
  { key: 'maps', label: 'Maps', href: ROUTES.MAPS },
  { key: 'qr-code', label: 'QR Code', href: ROUTES.QR_CODE },
  { key: 'profile', label: 'Profile', href: ROUTES.PROFILE },
  { key: 'settings', label: 'Settings', href: ROUTES.SETTINGS },
] as const;

// ========== VALIDATION PATTERNS ==========
export const PATTERNS = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
  name: /^[a-zA-Z\s]{2,50}$/,
  phone: /^\+?[\d\s-]{10,15}$/,
} as const;
