'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Map as MapIcon, Layers, Search, Navigation, MapPin,
  Plus, Minus, Crosshair, Route, Trash2, Ruler, X, Save, FolderPlus,
  QrCode, FileDown, FileCode, FileText, Package, Wifi, WifiOff, UploadCloud, Activity, Compass, Image as ImageIcon, AlertTriangle
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { Button, Breadcrumb, SearchBar, Badge, Modal, Input } from '@/components/ui';
import { useToast } from '@/contexts/ToastContext';
import { useROS } from '@/contexts/ROSContext';
import { ROS_CONFIG } from '@/constants';
import { MapMarker, MapRoute } from '@/types';
import { formatDistance } from '@/utils/helpers';
import mapService, { SavedMap } from '@/services/mapService';
import apiClient from '@/services/apiClient';
import LidarCanvasMap from '@/components/maps/LidarCanvasMap';
import { planPath } from '@/utils/pathfinding';

// ─── Cartesian Distance Calculator for 2D Grid Maps ───────────────────────
function cartesianDistance(p1: { lat: number; lng: number }, p2: { lat: number; lng: number }) {
  const dx = p2.lng - p1.lng; // lng = x
  const dy = p2.lat - p1.lat; // lat = y
  return Math.sqrt(dx * dx + dy * dy);
}

// ─── YAML/ROS Export helpers ─────────────────────────────────────────────
function buildYAML(map: SavedMap): string {
  const lines = [
    `# Atlas Map Export — ${map.name}`,
    `# Generated: ${new Date().toISOString()}`,
    ``,
    `map:`,
    `  name: "${map.name}"`,
    `  id: "${map.id}"`,
    `  width: ${map.width}`,
    `  height: ${map.height}`,
    `  resolution: ${map.resolution}  # meters/pixel`,
    `  origin:`,
    `    x: ${map.originX}`,
    `    y: ${map.originY}`,
    `    theta: 0.0`,
    `  negate: 0`,
    `  occupied_thresh: 0.65`,
    `  free_thresh: 0.196`,
    `  data_length: ${(map.gridData || []).length}`,
  ];
  return lines.join('\n');
}

function buildRosYAML(map: SavedMap, pgmFilename: string): string {
  // Standard ROS map_saver YAML format
  return [
    `image: ${pgmFilename}`,
    `resolution: ${map.resolution}`,
    `origin: [${map.originX}, ${map.originY}, 0.0]`,
    `negate: 0`,
    `occupied_thresh: 0.65`,
    `free_thresh: 0.196`,
  ].join('\n');
}

function buildPGM(map: SavedMap): Blob {
  const w = map.width || 20;
  const h = map.height || 20;
  const data = map.gridData || Array(w * h).fill(0);
  const pixels = data.map((v: number) => {
    if (v === -1) return 205;   // unknown → grey
    if (v === 0)  return 254;   // free → white
    return 0;                   // occupied → black
  });
  const header = `P2\n# Atlas Map: ${map.name}\n${w} ${h}\n255\n`;
  const body = [];
  for (let y = 0; y < h; y++) {
    body.push(pixels.slice(y * w, (y + 1) * w).join(' '));
  }
  return new Blob([header + body.join('\n')], { type: 'text/plain' });
}

function buildPNG(map: SavedMap): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const w = map.width || 20;
    const h = map.height || 20;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    const imgData = ctx.createImageData(w, h);
    const rawData = map.gridData || Array(w * h).fill(0);

    for (let i = 0; i < rawData.length; i++) {
      const v = rawData[i];
      let r = 205, g = 205, b = 205; // unknown gray
      if (v === 0) {
        r = 255; g = 255; b = 255; // free white
      } else if (v > 0) {
        r = 0; g = 0; b = 0; // occupied black
      }

      const col = i % w;
      const row = Math.floor(i / w);
      const flippedRow = h - 1 - row;
      const idx = (flippedRow * w + col) * 4;

      imgData.data[idx] = r;
      imgData.data[idx + 1] = g;
      imgData.data[idx + 2] = b;
      imgData.data[idx + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
    canvas.toBlob((blob) => {
      resolve(blob || new Blob());
    }, 'image/png');
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function MapComponent() {
  const { success, error: showError, info } = useToast();
  
  // Selection and DB States
  const [maps, setMaps] = useState<SavedMap[]>([]);
  const [selectedMap, setSelectedMap] = useState<SavedMap | null>(null);
  const [newMapName, setNewMapName] = useState('');
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [savedRoutes, setSavedRoutes] = useState<MapRoute[]>([]);

  // Canvas interaction states
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isRouteMode, setIsRouteMode] = useState(false);
  const [isMeasureMode, setIsMeasureMode] = useState(false);
  const [centerOn, setCenterOn] = useState<{ x: number; y: number; timestamp: number } | null>(null);

  // Dynamic Route planning path
  const [routePoints, setRoutePoints] = useState<Array<{ lat: number; lng: number }>>([]);
  const [routeDistance, setRouteDistance] = useState(0);

  // Jetson Push Export States
  const [exportModalMap, setExportModalMap] = useState<SavedMap | null>(null);
  const [customExportPath, setCustomExportPath] = useState('/home/jetson/maps');
  const [pushingToJetson, setPushingToJetson] = useState(false);
  const [dbMapName, setDbMapName] = useState('');
  const [savingToDb, setSavingToDb] = useState(false);
  const [tempRosUrl, setTempRosUrl] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('scoutrover_ros_url') || 'ws://localhost:9090';
    setTempRosUrl(stored);
  }, []);

  const handleTempConnect = () => {
    if (!tempRosUrl.trim()) return;
    localStorage.setItem('scoutrover_ros_url', tempRosUrl.trim());
    connectToROS();
  };
  
  // QR Code Modal States
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrModalTitle, setQrModalTitle] = useState('');
  const [qrModalContent, setQrModalContent] = useState('');
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // New modal states to replace browser prompt() dialogs
  const [showWaypointModal, setShowWaypointModal] = useState(false);
  const [waypointCoords, setWaypointCoords] = useState<{ x: number; y: number } | null>(null);
  const [waypointTitle, setWaypointTitle] = useState('');
  const [waypointDescription, setWaypointDescription] = useState('');

  const [showRouteModal, setShowRouteModal] = useState(false);
  const [routeName, setRouteName] = useState('');

  // Sidebar search & sort states
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [sidebarSort, setSidebarSort] = useState<'name' | 'newest'>('newest');

  // Live ROS teleoperation states from global ROSContext
  const {
    rosStatus,
    connectToROS,
    disconnectFromROS,
    liveGrid,
    lastMapUpdate,
    isLiveMode,
    setIsLiveMode,
  } = useROS();

  const activeAbortControllerRef = useRef<AbortController | null>(null);

  // Mapping configurations loaded from settings
  const [mappingConfig, setMappingConfig] = useState({ algoName: 'SLAM Toolbox', mapTopic: '/map' });

  useEffect(() => {
    try {
      const cfg = JSON.parse(localStorage.getItem('scoutrover_mapping_config') || '{}');
      setMappingConfig({
        algoName: cfg.algoName || 'SLAM Toolbox',
        mapTopic: cfg.mapTopic || '/map',
      });
    } catch { /* defaults */ }
  }, []);

  // Determine grid data source: live stream or saved static map
  const gridSource = isLiveMode && liveGrid ? liveGrid : {
    gridData: selectedMap?.gridData || [],
    width: selectedMap?.width || 0,
    height: selectedMap?.height || 0,
    resolution: selectedMap?.resolution || 0.05,
    originX: selectedMap?.originX || 0,
    originY: selectedMap?.originY || 0,
  };

  // Generate QR inside modal whenever the content changes or modal opens
  useEffect(() => {
    if (!qrModalOpen || !qrModalContent || !qrCanvasRef.current) return;
    const generateModalQR = async () => {
      try {
        const QRCode = (await import('qrcode')).default;
        await QRCode.toCanvas(qrCanvasRef.current, qrModalContent, {
          width: 220,
          margin: 1,
          color: {
            dark: '#7c3aed',
            light: '#ffffff',
          },
        });
      } catch (err) {
        console.error('Failed to generate modal QR:', err);
      }
    };
    generateModalQR();
  }, [qrModalOpen, qrModalContent]);

  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch maps on mount
  const loadMaps = useCallback(async (selectId?: string) => {
    try {
      if (activeAbortControllerRef.current) {
        activeAbortControllerRef.current.abort();
      }
      const controller = new AbortController();
      activeAbortControllerRef.current = controller;

      const list = await mapService.listMaps({ signal: controller.signal });
      setMaps(list);
      if (list.length > 0) {
        const idToLoad = selectId || list[0].id;
        try {
          const fullMap = await mapService.getMapById(idToLoad, { signal: controller.signal });
          setSelectedMap(fullMap);
        } catch (err: any) {
          if (err.name === 'AbortError') return;
          const matched = list.find(m => m.id === idToLoad);
          setSelectedMap(matched || list[0]);
        }
      } else {
        // provision default laboratory map if none exist (200x200 room sizing)
        try {
          const defaultGrid = Array(200 * 200).fill(-1); // fill unknown
          // create small rectangular room outline in coordinates
          for (let r = 20; r < 180; r++) {
            for (let c = 20; c < 180; c++) {
              if (r === 20 || r === 179 || c === 20 || c === 179) {
                defaultGrid[r * 200 + c] = 100; // Obstacle wall
              } else {
                defaultGrid[r * 200 + c] = 0; // Empty path
              }
            }
          }
          const map = await mapService.saveMap({
            name: 'Research Lab - Occupancy Grid',
            width: 200,
            height: 200,
            resolution: 0.05,
            originX: -5.0,
            originY: -5.0,
            gridData: defaultGrid,
          });
          setMaps([map]);
          setSelectedMap(map);
        } catch (provisionErr: any) {
          console.warn('[Maps] Failed to auto-provision default map:', provisionErr);
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      showError('Error', 'Failed to retrieve maps list from server');
    }
  }, [showError]);

  useEffect(() => {
    loadMaps();
  }, [loadMaps]);

  // Create new blank map
  const handleCreateMap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMapName.trim()) return;
    try {
      // Create empty 200x200 cell grid (10mx10m room)
      const blankGrid = Array(200 * 200).fill(-1);
      // boundary walls
      for (let r = 0; r < 200; r++) {
        for (let c = 0; c < 200; c++) {
          if (r === 0 || r === 199 || c === 0 || c === 199) {
            blankGrid[r * 200 + c] = 100;
          } else if (r > 10 && r < 190 && c > 10 && c < 190) {
            blankGrid[r * 200 + c] = 0;
          }
        }
      }

      const map = await mapService.saveMap({
        name: newMapName.trim(),
        width: 200,
        height: 200,
        resolution: 0.05,
        originX: -5.0,
        originY: -5.0,
        gridData: blankGrid,
      });
      success('Map created', `Created metric LiDAR grid map: ${map.name}`);
      setNewMapName('');
      loadMaps(map.id);
    } catch (err: any) {
      showError('Failed', err.message || 'Could not save map to server');
    }
  };

  const handleDeleteMap = async (mapId: string) => {
    if (!confirm('Are you sure you want to delete this map? All markers and routes will be deleted.')) return;
    try {
      await mapService.deleteMap(mapId);
      success('Deleted', 'Map deleted successfully');
      loadMaps();
    } catch (err: any) {
      showError('Delete failed', err.message);
    }
  };

  // 2. Fetch markers & routes when selectedMap changes
  const loadMarkersAndRoutes = useCallback(async () => {
    if (!selectedMap) return;
    try {
      const markList = await mapService.getMarkers(selectedMap.id);
      setMarkers(markList);
      const routeList = await mapService.getRoutes(selectedMap.id);
      setSavedRoutes(routeList);
    } catch (err: any) {
      showError('Error', 'Failed to load routes and waypoints');
    }
  }, [selectedMap, showError]);

  useEffect(() => {
    loadMarkersAndRoutes();
  }, [loadMarkersAndRoutes]);

  // ROS connection lifecycle is fully managed by global ROSContext wrapper

  // Click on Lidar Canvas coordinates handler
  const handleMapClickAddMarker = async (x: number, y: number) => {
    if (!selectedMap) {
      info('Select Map', 'Please choose or create a map first');
      return;
    }
    setWaypointCoords({ x, y });
    setWaypointTitle(`Waypoint ${markers.length + 1}`);
    setWaypointDescription('');
    setShowWaypointModal(true);
  };

  const confirmAddWaypoint = async () => {
    if (!waypointCoords || !selectedMap || !waypointTitle.trim()) return;
    setShowWaypointModal(false);

    try {
      const saved = await mapService.saveMarker({
        mapId: selectedMap.id,
        title: waypointTitle.trim(),
        description: waypointDescription.trim(),
        lat: waypointCoords.y, // lat represents Cartesian Y
        lng: waypointCoords.x, // lng represents Cartesian X
        color: '#06b6d4',
      });
      
      setMarkers(prev => [...prev, saved]);
      success('Waypoint saved', `Waypoint '${saved.title}' saved to database.`);
    } catch (err: any) {
      showError('Failed', err.message || 'Could not save waypoint');
    }
  };

  // Add route planner coordinate point clicked
  const addRoutePoint = useCallback((point: { lat: number; lng: number }) => {
    setRoutePoints(prev => {
      if (prev.length === 0) {
        return [point];
      }

      const lastPoint = prev[prev.length - 1];

      // Retrieve current map/grid parameters
      const grid = gridSource.gridData;
      const w = gridSource.width;
      const h = gridSource.height;
      const res = gridSource.resolution;
      const ox = gridSource.originX;
      const oy = gridSource.originY;

      if (!grid || grid.length === 0) {
        // Fallback to straight Euclidean path if map data is unavailable
        const newPoints = [...prev, point];
        let dist = 0;
        for (let i = 1; i < newPoints.length; i++) {
          dist += cartesianDistance(newPoints[i - 1], newPoints[i]);
        }
        setRouteDistance(dist);
        return newPoints;
      }

      // Compute A* planned path between the last point and new clicked point
      const pathResult = planPath(
        grid,
        w,
        h,
        res,
        ox,
        oy,
        lastPoint,
        point,
        0.15 // 15cm safety inflation clearance
      );

      // Append intermediate A* coordinates (skipping duplicates)
      const newPoints = [...prev, ...pathResult.points.slice(1)];

      // Recalculate total routing length
      let totalDist = 0;
      for (let i = 1; i < newPoints.length; i++) {
        totalDist += cartesianDistance(newPoints[i - 1], newPoints[i]);
      }
      setRouteDistance(totalDist);

      return newPoints;
    });
  }, [gridSource]);

  const handleSaveRoute = async () => {
    if (routePoints.length < 2 || !selectedMap) return;
    setRouteName(`Inspection Path ${savedRoutes.length + 1}`);
    setShowRouteModal(true);
  };

  const confirmSaveRoute = async () => {
    if (!routeName.trim() || !selectedMap || routePoints.length < 2) return;
    setShowRouteModal(false);

    try {
      const saved = await mapService.saveRoute({
        mapId: selectedMap.id,
        name: routeName.trim(),
        points: routePoints,
        distance: routeDistance,
        color: '#22c55e',
      });

      setSavedRoutes(prev => [...prev, saved]);
      success('Route saved', `Inspection route '${saved.name}' successfully stored.`);
      clearRoute();
      setIsRouteMode(false);
    } catch (err: any) {
      showError('Failed', err.message || 'Could not save route.');
    }
  };

  const clearRoute = () => {
    setRoutePoints([]);
    setRouteDistance(0);
  };

  const handleDeleteMarker = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await mapService.deleteMarker(id);
      setMarkers(prev => prev.filter(m => m.id !== id));
      if (selectedMarkerId === id) setSelectedMarkerId(null);
      success('Deleted', 'Waypoint deleted successfully');
    } catch (err: any) {
      showError('Failed', err.message);
    }
  };

  const handleDeleteRoute = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await mapService.deleteRoute(id);
      setSavedRoutes(prev => prev.filter(r => r.id !== id));
      if (selectedRouteId === id) setSelectedRouteId(null);
      success('Deleted', 'Inspection route deleted');
    } catch (err: any) {
      showError('Failed', err.message);
    }
  };

  // Push statically saved map coordinates to Jetson filesystem directly
  const handlePushToJetson = async () => {
    if (!exportModalMap) return;
    setPushingToJetson(true);
    try {
      await apiClient.post('/jetson/export', {
        mapId: exportModalMap.id,
        exportPath: customExportPath.trim() || undefined,
      });
      success('Pushed to Jetson', `Successfully saved map configs to Jetson storage: ${customExportPath}`);
      setExportModalMap(null);
    } catch (err: any) {
      showError('Jetson push failed', err.message || 'Could not write files to Jetson.');
    } finally {
      setPushingToJetson(false);
    }
  };

  const handleSaveToDatabase = async () => {
    if (!dbMapName.trim()) {
      showError('Required', 'Please enter a valid map name.');
      return;
    }
    if (!exportModalMap) return;
    setSavingToDb(true);
    try {
      const saved = await mapService.saveMap({
        name: dbMapName.trim(),
        width: exportModalMap.width,
        height: exportModalMap.height,
        resolution: exportModalMap.resolution,
        originX: exportModalMap.originX,
        originY: exportModalMap.originY,
        gridData: exportModalMap.gridData,
      });
      success('Saved to Database', `Successfully saved map '${saved.name}' to database.`);
      setExportModalMap(null);
      loadMaps(saved.id);
    } catch (err: any) {
      showError('Failed to Save', err.message || 'Could not save map to database.');
    } finally {
      setSavingToDb(false);
    }
  };

  // Search waypoint list or metric coordinates
  const searchLocation = () => {
    if (!searchQuery.trim()) return;

    // Check if input matches X, Y float coordinates pattern (e.g. 1.25, -4.3)
    const coordMatch = searchQuery.match(/^(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      const x = parseFloat(coordMatch[1]);
      const y = parseFloat(coordMatch[3]);
      setCenterOn({ x, y, timestamp: Date.now() });
      success('Coordinates Targeted', `Centered viewport on coordinate space X: ${x}m, Y: ${y}m`);
      return;
    }

    // Otherwise, search waypoints
    const query = searchQuery.toLowerCase();
    const waypoint = markers.find(m => m.title.toLowerCase().includes(query) || (m.description && m.description.toLowerCase().includes(query)));
    if (waypoint) {
      // center on waypoint
      setCenterOn({ x: waypoint.lng, y: waypoint.lat, timestamp: Date.now() });
      setSelectedMarkerId(waypoint.id);
      success('Waypoint Found', `Targeted waypoint: "${waypoint.title}"`);
    } else {
      info('Not found', 'No waypoint names or "X, Y" coordinate inputs matched.');
    }
  };

  // Render grid helper selection

  const filteredAndSortedMaps = maps
    .filter(m => m.name.toLowerCase().includes(sidebarSearch.toLowerCase()))
    .sort((a, b) => {
      if (sidebarSort === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        return b.id.localeCompare(a.id);
      }
    });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar selection */}
      <div className="lg:col-span-1 space-y-6">
        {/* Maps directory */}
        <div className="card p-4 space-y-4 shadow-sm border border-surface-200 dark:border-white/10 bg-white dark:bg-dark-card">
          <h3 className="font-semibold text-surface-900 dark:text-white text-sm border-b pb-2 dark:border-white/10 flex items-center gap-2">
            <MapIcon className="w-4 h-4 text-brand-500" />
            Maps Directory
          </h3>
          
          <form onSubmit={handleCreateMap} className="flex gap-2">
            <input
              type="text"
              value={newMapName}
              onChange={(e) => setNewMapName(e.target.value)}
              placeholder="New map name..."
              className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-surface-200 dark:border-white/10 bg-transparent dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <button type="submit" className="p-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-500 transition-colors">
              <FolderPlus className="w-4 h-4" />
            </button>
          </form>

          {/* Search & Sort controls */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" />
              <input
                type="text"
                value={sidebarSearch}
                onChange={e => setSidebarSearch(e.target.value)}
                placeholder="Search maps..."
                className="w-full text-[10px] pl-8 pr-2.5 py-1 rounded-lg border border-surface-200 dark:border-white/10 bg-transparent dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <select
              value={sidebarSort}
              onChange={e => setSidebarSort(e.target.value as 'name' | 'newest')}
              className="text-[10px] px-1.5 py-1 rounded-lg border border-surface-200 dark:border-white/10 bg-white dark:bg-dark-card text-surface-600 dark:text-surface-300 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
            >
              <option value="newest">Newest</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>

          <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
            {filteredAndSortedMaps.map(m => (
              <div
                key={m.id}
                onClick={async () => {
                  setIsLiveMode(false);
                  disconnectFromROS();
                  try {
                    if (activeAbortControllerRef.current) {
                      activeAbortControllerRef.current.abort();
                    }
                    const controller = new AbortController();
                    activeAbortControllerRef.current = controller;

                    const fullMap = await mapService.getMapById(m.id, { signal: controller.signal });
                    setSelectedMap(fullMap);
                  } catch (err: any) {
                    if (err.name === 'AbortError') return;
                    showError('Error', 'Failed to retrieve map grid details');
                  }
                }}
                className={`flex items-center justify-between text-xs p-2 rounded-lg cursor-pointer transition-all ${
                  selectedMap?.id === m.id && !isLiveMode
                    ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium'
                    : 'text-surface-600 hover:bg-surface-50 dark:hover:bg-white/5 dark:text-surface-300'
                }`}
              >
                <span className="truncate flex-1 font-medium">{m.name}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setQrModalTitle(`Map: ${m.name}`);
                      setQrModalContent(JSON.stringify({
                        type: 'map',
                        id: m.id,
                        name: m.name,
                        resolution: m.resolution,
                        width: m.width,
                        height: m.height
                      }));
                      setQrModalOpen(true);
                    }}
                    className="text-surface-400 hover:text-brand-500 transition-colors mr-1"
                    title="View QR Code"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setExportModalMap(m); }}
                    className="text-surface-400 hover:text-emerald-500 transition-colors mr-1"
                    title="Export map configuration"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                  </button>
                  {maps.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteMap(m.id); }}
                      className="text-surface-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Map database waypoints list */}
        {selectedMap && !isLiveMode && (
          <>
            <div className="card p-4 space-y-3 shadow-sm border border-surface-200 dark:border-white/10 bg-white dark:bg-dark-card">
              <h3 className="font-semibold text-surface-900 dark:text-white text-xs border-b pb-1.5 dark:border-white/10 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-cyan-500" />
                  Waypoints ({markers.length})
                </span>
              </h3>
              <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
                {markers.length === 0 ? (
                  <p className="text-[10px] text-surface-400">Double click on canvas map coordinates to register a waypoint.</p>
                ) : (
                  markers.map(m => (
                    <div
                      key={m.id}
                      onClick={() => {
                        setSelectedMarkerId(m.id);
                        setCenterOn({ x: m.lng, y: m.lat, timestamp: Date.now() });
                      }}
                      className={`flex items-center justify-between text-xs p-1.5 rounded cursor-pointer transition-colors ${
                        selectedMarkerId === m.id
                          ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold'
                          : 'bg-surface-50 dark:bg-white/[0.02] text-surface-600 dark:text-surface-300'
                      }`}
                    >
                      <div className="truncate flex-1 min-w-0">
                        <p className="truncate font-medium">{m.title}</p>
                        <p className="text-[9px] text-surface-400 font-mono">[{m.lng.toFixed(2)}, {m.lat.toFixed(2)}]</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setQrModalTitle(`Waypoint: ${m.title}`);
                            setQrModalContent(JSON.stringify({
                              type: 'waypoint',
                              id: m.id,
                              title: m.title,
                              x: m.lng,
                              y: m.lat
                            }));
                            setQrModalOpen(true);
                          }}
                          className="text-surface-400 hover:text-brand-500 transition-colors"
                          title="View QR Code"
                        >
                          <QrCode className="w-3 h-3" />
                        </button>
                        <button onClick={(e) => handleDeleteMarker(m.id, e)} className="text-surface-400 hover:text-red-500">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Saved telemetry routes list */}
            <div className="card p-4 space-y-3 shadow-sm border border-surface-200 dark:border-white/10 bg-white dark:bg-dark-card">
              <h3 className="font-semibold text-surface-900 dark:text-white text-xs border-b pb-1.5 dark:border-white/10 flex items-center gap-2">
                <Route className="w-3.5 h-3.5 text-emerald-500" />
                Inspection Routes ({savedRoutes.length})
              </h3>
              <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
                {savedRoutes.length === 0 ? (
                  <p className="text-[10px] text-surface-400 font-medium">Activate Route Mode to plan and save inspection paths.</p>
                ) : (
                  savedRoutes.map(r => (
                    <div
                      key={r.id}
                      onClick={() => {
                        setSelectedRouteId(r.id);
                        if (r.points && r.points.length > 0) {
                          setCenterOn({ x: r.points[0].lng, y: r.points[0].lat, timestamp: Date.now() });
                        }
                      }}
                      className={`flex items-center justify-between text-xs p-1.5 rounded cursor-pointer transition-colors ${
                        selectedRouteId === r.id
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                          : 'bg-surface-50 dark:bg-white/[0.02] text-surface-600 dark:text-surface-300'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">{r.name}</p>
                        <p className="text-[9px] text-surface-400">{formatDistance(r.distance)} • {r.points.length} pts</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setQrModalTitle(`Route: ${r.name}`);
                            setQrModalContent(JSON.stringify({
                              type: 'route',
                              id: r.id,
                              name: r.name,
                              distance: r.distance,
                              pointsCount: r.points.length
                            }));
                            setQrModalOpen(true);
                          }}
                          className="text-surface-400 hover:text-brand-500 transition-colors"
                          title="View QR Code"
                        >
                          <QrCode className="w-3 h-3" />
                        </button>
                        <button onClick={(e) => handleDeleteRoute(r.id, e)} className="text-surface-400 hover:text-red-500">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Map Visual Canvas panel */}
      <div className="lg:col-span-3 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Toggle between DB and live ROS */}
          <div className="flex items-center gap-2 bg-surface-100 dark:bg-dark-elevated rounded-xl p-1 border border-surface-200 dark:border-white/5">
            <button
              onClick={() => {
                setIsLiveMode(false);
                disconnectFromROS();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                !isLiveMode
                  ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-sm border border-surface-200/50 dark:border-white/5'
                  : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              Saved Map Database
            </button>
            <button
              onClick={() => {
                setIsLiveMode(true);
                connectToROS();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isLiveMode
                  ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-sm border border-surface-200/50 dark:border-white/5'
                  : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
              }`}
            >
              <Activity className="w-4 h-4" />
              Live LiDAR Scan
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Live ROS connection trigger indicators */}
            {isLiveMode && (
              <div className="flex items-center gap-2 mr-2">
                <Badge variant={rosStatus === 'connected' ? 'success' : 'danger'} dot>
                  {rosStatus === 'connected' ? 'ROS Live' : rosStatus === 'connecting' ? 'Connecting...' : 'ROS Offline'}
                </Badge>
                {rosStatus !== 'connected' && (
                  <div className="flex items-center gap-1.5 animate-fade-in">
                    <input
                      type="text"
                      placeholder="ws://192.168.1.100:9090"
                      value={tempRosUrl}
                      onChange={(e) => setTempRosUrl(e.target.value)}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-surface-200 dark:border-white/10 bg-white dark:bg-dark-elevated dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500 w-44"
                    />
                    <Button
                      size="sm"
                      variant="primary"
                      loading={rosStatus === 'connecting'}
                      onClick={handleTempConnect}
                      icon={<Wifi className="w-3.5 h-3.5" />}
                    >
                      Connect
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Ruler mode toggle */}
            <Button
              variant={isMeasureMode ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => {
                if (isMeasureMode) {
                  // close
                  setIsMeasureMode(false);
                } else {
                  setIsMeasureMode(true);
                  setIsRouteMode(false);
                  clearRoute();
                }
              }}
              icon={<Ruler className="w-4 h-4" />}
            >
              {isMeasureMode ? 'Close Ruler' : 'Measure'}
            </Button>

            {/* Route mode toggle buttons */}
            {isRouteMode && routePoints.length >= 2 && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveRoute}
                icon={<Save className="w-4 h-4" />}
              >
                Save Route
              </Button>
            )}
            <Button
              variant={isRouteMode ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => {
                if (isRouteMode) {
                  clearRoute();
                  setIsRouteMode(false);
                } else {
                  setIsRouteMode(true);
                  setIsMeasureMode(false);
                }
              }}
              icon={<Route className="w-4 h-4" />}
            >
              {isRouteMode ? 'Cancel Route' : 'Route Planner'}
            </Button>
          </div>
        </div>

        {/* Waypoint coordinate search console */}
        <div className="flex gap-2">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search waypoint name, or enter metric coordinates: e.g. 2.5, -1.8"
            />
          </div>
          <Button variant="primary" size="sm" onClick={searchLocation} icon={<Search className="w-4 h-4" />}>
            Search / Go To
          </Button>
        </div>

        {/* Interactive canvas grid */}
        <div className="card overflow-hidden relative shadow-sm border border-surface-200 dark:border-white/10 bg-white dark:bg-dark-card">
          {gridSource.width > 0 ? (
            <LidarCanvasMap
              gridData={gridSource.gridData}
              width={gridSource.width}
              height={gridSource.height}
              resolution={gridSource.resolution}
              originX={gridSource.originX}
              originY={gridSource.originY}
              markers={markers}
              routes={savedRoutes}
              isRouteMode={isRouteMode}
              routePoints={routePoints}
              onAddRoutePoint={addRoutePoint}
              onMapClick={handleMapClickAddMarker}
              selectedMarkerId={selectedMarkerId}
              onSelectMarker={setSelectedMarkerId}
              selectedRouteId={selectedRouteId}
              onSelectRoute={setSelectedRouteId}
              isMeasureMode={isMeasureMode}
              centerOn={centerOn}
            />
          ) : (
            <div className="w-full h-[450px] sm:h-[500px] lg:h-[600px] flex flex-col items-center justify-center text-surface-400 bg-slate-950 rounded-xl border border-white/5 p-8">
              <WifiOff className="w-12 h-12 mb-3 text-red-500 opacity-80" />
              <h4 className="text-white font-bold text-sm">No LiDAR grid map data available</h4>
              <p className="text-xs text-surface-400 text-center max-w-sm mt-1">
                {isLiveMode 
                  ? 'Awaiting live OccupancyGrid messages. Please verify ROS bridge connection.' 
                  : 'Select a saved map from the directory sidebar or create a new room.'}
              </p>
            </div>
          )}

          {/* Interactive Status Footer info bar */}
          <div className="px-5 py-3 border-t border-surface-200 dark:border-white/[0.08] flex items-center justify-between text-xs flex-wrap gap-2 bg-surface-50 dark:bg-dark-elevated">
            <div className="flex items-center gap-4 text-surface-500 font-medium">
              <span className="text-surface-800 dark:text-surface-200">
                {isLiveMode ? `Live Topic: ${mappingConfig.mapTopic}` : `Active Map: ${selectedMap?.name}`}
              </span>
              <span className="font-mono text-surface-400">
                Size: {gridSource.width}x{gridSource.height} ({gridSource.resolution}m/cell)
              </span>
              {isLiveMode && lastMapUpdate && (
                <span className="text-[10px] text-brand-500 animate-pulse">
                  Last update: {new Date(lastMapUpdate).toLocaleTimeString()}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {isRouteMode && routePoints.length > 0 && (
                <span className="text-red-500 font-semibold flex items-center gap-1.5 animate-pulse">
                  <Compass className="w-3.5 h-3.5" />
                  Planning Route: {routePoints.length} points ({routeDistance.toFixed(2)}m)
                </span>
              )}
              
              {(selectedMap || (isLiveMode && liveGrid)) && (
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<FileDown className="w-3.5 h-3.5" />}
                  onClick={() => {
                    if (isLiveMode) {
                      if (liveGrid) {
                        const defaultName = `LiDAR_Scan_${new Date().toLocaleTimeString().replace(/:/g, '-')}`;
                        setDbMapName(defaultName);
                        setExportModalMap({
                          id: 'live-scan',
                          name: defaultName,
                          width: liveGrid.width,
                          height: liveGrid.height,
                          resolution: liveGrid.resolution,
                          originX: liveGrid.originX,
                          originY: liveGrid.originY,
                          gridData: Array.from(liveGrid.gridData),
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                        } as any);
                      } else {
                        showError('No map data', 'Awaiting live LiDAR occupancy grid scan data.');
                      }
                    } else if (selectedMap) {
                      setDbMapName(selectedMap.name);
                      setExportModalMap(selectedMap);
                    }
                  }}
                >
                  Export Map
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Export modal overlay */}
      {exportModalMap && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md p-6 relative bg-white dark:bg-dark-card border border-surface-200 dark:border-white/10 rounded-2xl shadow-glow">
            <button onClick={() => setExportModalMap(null)} className="absolute top-4 right-4 text-surface-400 hover:text-surface-600 dark:hover:text-white transition-colors" aria-label="Close export dialog">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-500/20">
                <FileDown className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-surface-900 dark:text-white">Export & Save Options</h3>
                <p className="text-xs text-surface-500">{exportModalMap.name}</p>
              </div>
            </div>
            <p className="text-xs text-surface-500 dark:text-surface-400 mb-5">
              Choose to download the files locally or save them directly to the Jetson filesystem storage.
            </p>

            <div className="space-y-3">
              {/* Save to Local database */}
              <div className="p-4 rounded-xl border border-emerald-500/20 dark:border-emerald-500/30 bg-emerald-50/10 dark:bg-emerald-500/5 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <FolderPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="text-sm font-semibold text-surface-900 dark:text-white">Save to Map Database</p>
                      <p className="text-xs text-surface-500">Saves this scan profile to Saved Maps Database list</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={dbMapName}
                    onChange={(e) => setDbMapName(e.target.value)}
                    placeholder="Enter map name..."
                    className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-surface-200 dark:border-white/10 bg-white dark:bg-dark-elevated dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    loading={savingToDb}
                    onClick={handleSaveToDatabase}
                    icon={<Save className="w-3.5 h-3.5" />}
                  >
                    Save to DB
                  </Button>
                </div>
              </div>

              {/* Push directly to Jetson storage */}
              {exportModalMap.id !== 'live-scan' ? (
                <div className="p-4 rounded-xl border border-brand-500/20 dark:border-brand-500/30 bg-brand-50/20 dark:bg-brand-500/5 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <UploadCloud className="w-5 h-5 text-brand-500" />
                      <div>
                        <p className="text-sm font-semibold text-surface-900 dark:text-white">Save on Jetson Developer Kit</p>
                        <p className="text-xs text-surface-500">Pushes YAML + PGM configs directly to host</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customExportPath}
                      onChange={(e) => setCustomExportPath(e.target.value)}
                      placeholder="Jetson path..."
                      className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-surface-200 dark:border-white/10 bg-white dark:bg-dark-elevated dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    <Button
                      size="sm"
                      variant="primary"
                      loading={pushingToJetson}
                      onClick={handlePushToJetson}
                      icon={<Save className="w-3.5 h-3.5" />}
                    >
                      Push Map
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-surface-200 dark:border-white/10 bg-surface-50 dark:bg-white/[0.02] flex items-start gap-2.5 text-xs text-surface-500">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p>Save this live scan to the database above to enable direct push to Jetson.</p>
                </div>
              )}

              {/* YAML local download */}
              <div className="p-3 rounded-xl border border-surface-200 dark:border-white/10 flex items-center justify-between gap-4 hover:bg-surface-50 dark:hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <FileCode className="w-5 h-5 text-brand-500" />
                  <div>
                    <p className="text-sm font-semibold text-surface-900 dark:text-white font-sans">YAML Config</p>
                    <p className="text-xs text-surface-500">Atlas map metadata + resolution</p>
                  </div>
                </div>
                <Button size="sm" variant="secondary" icon={<FileDown className="w-4 h-4" />}
                  onClick={() => {
                    downloadBlob(new Blob([buildYAML(exportModalMap)], { type: 'text/yaml' }), `${exportModalMap.name.replace(/\s+/g, '_')}.yaml`);
                    success('Exported', 'YAML file downloaded');
                  }}>
                  Download
                </Button>
              </div>

              {/* ROS PGM + YAML download */}
              <div className="p-3 rounded-xl border border-surface-200 dark:border-white/10 flex items-center justify-between gap-4 hover:bg-surface-50 dark:hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-semibold text-surface-900 dark:text-white font-sans">ROS PGM + YAML</p>
                    <p className="text-xs text-surface-500">Direct import into standard Nav2 map_server (PGM)</p>
                  </div>
                </div>
                <Button size="sm" variant="secondary" icon={<FileDown className="w-4 h-4" />}
                  onClick={() => {
                    const slug = exportModalMap.name.replace(/\s+/g, '_');
                    downloadBlob(buildPGM(exportModalMap), `${slug}.pgm`);
                    setTimeout(() => {
                      downloadBlob(new Blob([buildRosYAML(exportModalMap, `${slug}.pgm`)], { type: 'text/yaml' }), `${slug}.yaml`);
                    }, 200);
                    success('Exported', 'PGM + YAML files downloaded');
                  }}>
                  Download
                </Button>
              </div>

              {/* ROS PNG + YAML download */}
              <div className="p-3 rounded-xl border border-surface-200 dark:border-white/10 flex items-center justify-between gap-4 hover:bg-surface-50 dark:hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <ImageIcon className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="text-sm font-semibold text-surface-900 dark:text-white font-sans">ROS PNG + YAML</p>
                    <p className="text-xs text-surface-500">Modern compressed image format with YAML metadata</p>
                  </div>
                </div>
                <Button size="sm" variant="secondary" icon={<FileDown className="w-4 h-4" />}
                  onClick={async () => {
                    const slug = exportModalMap.name.replace(/\s+/g, '_');
                    const pngBlob = await buildPNG(exportModalMap);
                    downloadBlob(pngBlob, `${slug}.png`);
                    setTimeout(() => {
                      downloadBlob(new Blob([buildRosYAML(exportModalMap, `${slug}.png`)], { type: 'text/yaml' }), `${slug}.yaml`);
                    }, 200);
                    success('Exported', 'PNG + YAML files downloaded');
                  }}>
                  Download
                </Button>
              </div>

              {/* JSON export */}
              <div className="p-3 rounded-xl border border-surface-200 dark:border-white/10 flex items-center justify-between gap-4 hover:bg-surface-50 dark:hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-cyan-500" />
                  <div>
                    <p className="text-sm font-semibold text-surface-900 dark:text-white font-sans">Raw JSON Map Data</p>
                    <p className="text-xs text-surface-500">Full cell array for custom automation scripts</p>
                  </div>
                </div>
                <Button size="sm" variant="secondary" icon={<FileDown className="w-4 h-4" />}
                  onClick={() => {
                    downloadBlob(new Blob([JSON.stringify(exportModalMap, null, 2)], { type: 'application/json' }), `${exportModalMap.name.replace(/\s+/g, '_')}.json`);
                    success('Exported', 'JSON file downloaded');
                  }}>
                  Download
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code sharing Modal */}
      {qrModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content max-w-sm p-6 text-center relative bg-white dark:bg-dark-card border border-surface-200 dark:border-white/10 rounded-2xl shadow-glow">
            <button
              onClick={() => setQrModalOpen(false)}
              className="absolute top-4 right-4 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"
              aria-label="Close QR dialog"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-lg text-surface-900 dark:text-white mb-4">
              {qrModalTitle}
            </h3>
            <div className="bg-white rounded-2xl p-4 border border-surface-200 dark:border-surface-700 shadow-inner inline-block mx-auto mb-4">
              <canvas ref={qrCanvasRef} className="w-48 h-48" />
            </div>
            <p className="text-[10px] font-mono text-surface-500 dark:text-surface-400 px-4 mb-2 truncate">
              Raw Payload: {qrModalContent}
            </p>
            <div className="flex gap-2 mt-4">
              <Button
                variant="secondary"
                className="w-full"
                onClick={async () => {
                  await navigator.clipboard.writeText(qrModalContent);
                  success('Copied', 'QR data copied to clipboard');
                }}
              >
                Copy Data
              </Button>
              <Button
                variant="primary"
                className="w-full"
                onClick={() => {
                  const canvas = qrCanvasRef.current;
                  if (!canvas) return;
                  const link = document.createElement('a');
                  link.download = 'atlas-qr-code.png';
                  link.href = canvas.toDataURL('image/png');
                  link.click();
                  success('Downloaded', 'QR Code saved successfully');
                }}
              >
                Download
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Waypoint Modal replacing window.prompt */}
      {showWaypointModal && (
        <Modal
          open={showWaypointModal}
          onClose={() => setShowWaypointModal(false)}
          title="Add Waypoint"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowWaypointModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={confirmAddWaypoint}>Save Waypoint</Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="Waypoint Title"
              value={waypointTitle}
              onChange={e => setWaypointTitle(e.target.value)}
              placeholder="e.g. Loading Dock B"
              autoFocus
            />
            <Input
              label="Description (optional)"
              value={waypointDescription}
              onChange={e => setWaypointDescription(e.target.value)}
              placeholder="e.g. Secondary charging hub"
            />
            {waypointCoords && (
              <p className="text-xs font-mono text-surface-400">
                Coordinates: [{waypointCoords.x.toFixed(2)}, {waypointCoords.y.toFixed(2)}]
              </p>
            )}
          </div>
        </Modal>
      )}

      {/* Route Modal replacing window.prompt */}
      {showRouteModal && (
        <Modal
          open={showRouteModal}
          onClose={() => setShowRouteModal(false)}
          title="Save Inspection Route"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowRouteModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={confirmSaveRoute}>Save Route</Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="Route Name"
              value={routeName}
              onChange={e => setRouteName(e.target.value)}
              placeholder="e.g. Night Patrol Path"
              autoFocus
            />
            <p className="text-xs text-surface-400">
              Total distance: {routeDistance.toFixed(2)} meters ({routePoints.length} points)
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function MapsPage() {
  return (
    <DashboardLayout>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Maps' }]} />
      <div className="mb-6">
        <h1 className="page-title">Maps Console</h1>
        <p className="page-subtitle">Configure 2D LiDAR spatial occupancy grids, define waypoints, and outline inspection routes</p>
      </div>
      <MapComponent />
    </DashboardLayout>
  );
}
