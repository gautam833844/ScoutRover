'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Map as MapIcon, Satellite, Layers, Search, Navigation, MapPin,
  Plus, Minus, Crosshair, Route, Trash2, Ruler, X, Save, FolderPlus,
  QrCode
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { Button, Breadcrumb, SearchBar, Badge } from '@/components/ui';
import { useToast } from '@/contexts/ToastContext';
import { MAP_CONFIG } from '@/constants';
import { MapMode, MapMarker, MapRoute } from '@/types';
import { haversineDistance, formatDistance } from '@/utils/helpers';
import mapService, { SavedMap } from '@/services/mapService';

function MapComponent() {
  const { success, error: showError, info } = useToast();
  
  // Selection States
  const [maps, setMaps] = useState<SavedMap[]>([]);
  const [selectedMap, setSelectedMap] = useState<SavedMap | null>(null);
  const [newMapName, setNewMapName] = useState('');
  
  // QR Code Modal States
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrModalTitle, setQrModalTitle] = useState('');
  const [qrModalContent, setQrModalContent] = useState('');
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

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
  
  const [mode, setMode] = useState<MapMode>('standard');
  const [searchQuery, setSearchQuery] = useState('');
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [savedRoutes, setSavedRoutes] = useState<MapRoute[]>([]);
  
  // Interactive drawing states
  const [routePoints, setRoutePoints] = useState<Array<{ lat: number; lng: number }>>([]);
  const [routeDistance, setRouteDistance] = useState(0);
  const [isRouteMode, setIsRouteMode] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const tileLayerRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);

  // 1. Fetch maps on mount
  const loadMaps = useCallback(async (selectId?: string) => {
    try {
      const list = await mapService.listMaps();
      setMaps(list);
      if (list.length > 0) {
        if (selectId) {
          const matched = list.find(m => m.id === selectId);
          setSelectedMap(matched || list[0]);
        } else {
          setSelectedMap(list[0]);
        }
      } else {
        // Automatically provision default laboratory map if none exist
        const defaultGrid = Array(400).fill(0);
        const map = await mapService.saveMap({
          name: 'Research Lab - Sector Alpha',
          width: 20,
          height: 20,
          resolution: 0.05,
          originX: -0.5,
          originY: -0.5,
          gridData: defaultGrid,
        });
        setMaps([map]);
        setSelectedMap(map);
      }
    } catch (err: any) {
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
      const blankGrid = Array(400).fill(0);
      const map = await mapService.saveMap({
        name: newMapName.trim(),
        width: 30,
        height: 30,
        resolution: 0.05,
        originX: -0.5,
        originY: -0.5,
        gridData: blankGrid,
      });
      success('Map created', `Created map: ${map.name}`);
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
      showError('Error', 'Failed to load routes and markers for this map');
    }
  }, [selectedMap, showError]);

  useEffect(() => {
    loadMarkersAndRoutes();
  }, [loadMarkersAndRoutes]);

  // Initialize leaflet map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    import('leaflet').then((L) => {
      leafletRef.current = L;
      
      // Fix Leaflet marker pathing issue
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (mapRef.current) return; // Prevent double init

      const map = L.map(mapContainerRef.current!, {
        center: [MAP_CONFIG.defaultCenter.lat, MAP_CONFIG.defaultCenter.lng],
        zoom: MAP_CONFIG.defaultZoom,
        zoomControl: false,
      });

      tileLayerRef.current = L.tileLayer(MAP_CONFIG.tileProviders.standard.url, {
        attribution: MAP_CONFIG.tileProviders.standard.attribution,
        maxZoom: MAP_CONFIG.maxZoom,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      routeLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;

      // Click to add marker or route point
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        if ((window as any).__routeMode) {
          addRoutePoint(lat, lng);
        } else {
          handleMapClickAddMarker(lat, lng);
        }
      });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync route mode state to global window context for leaflet listener
  useEffect(() => {
    (window as any).__routeMode = isRouteMode;
  }, [isRouteMode]);

  // Re-draw saved markers & routes on map whenever markers or routes list updates
  useEffect(() => {
    if (!mapRef.current || !leafletRef.current || !markersLayerRef.current) return;
    const L = leafletRef.current;
    
    // Clear layers
    markersLayerRef.current.clearLayers();
    
    // Plot markers
    markers.forEach((marker) => {
      L.marker([marker.lat, marker.lng])
        .bindPopup(`<b>${marker.title}</b><br>${marker.description || 'No description'}<br>Lat: ${marker.lat.toFixed(5)}<br>Lng: ${marker.lng.toFixed(5)}`)
        .addTo(markersLayerRef.current);
    });
  }, [markers]);

  useEffect(() => {
    if (!mapRef.current || !leafletRef.current || !routeLayerRef.current) return;
    const L = leafletRef.current;
    
    // Clear layers
    routeLayerRef.current.clearLayers();
    
    // Plot saved routes
    savedRoutes.forEach((route) => {
      if (route.points.length >= 2) {
        // Draw polyline
        L.polyline(route.points.map(p => [p.lat, p.lng]), {
          color: route.color || '#7c3aed',
          weight: 4,
          opacity: 0.7,
        }).bindPopup(`<b>${route.name}</b><br>Distance: ${formatDistance(route.distance)}`).addTo(routeLayerRef.current);
        
        // Draw circles for waypoints
        route.points.forEach((p) => {
          L.circleMarker([p.lat, p.lng], {
            radius: 5,
            fillColor: route.color || '#7c3aed',
            fillOpacity: 1,
            color: '#fff',
            weight: 1.5,
          }).addTo(routeLayerRef.current);
        });
      }
    });
  }, [savedRoutes]);

  // Adjust tile layers on mode change
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current || !leafletRef.current) return;
    const L = leafletRef.current;
    mapRef.current.removeLayer(tileLayerRef.current);

    const providers = MAP_CONFIG.tileProviders;
    const provider = mode === 'satellite' ? providers.satellite : providers.standard;
    tileLayerRef.current = L.tileLayer(provider.url, {
      attribution: provider.attribution,
      maxZoom: MAP_CONFIG.maxZoom,
    }).addTo(mapRef.current);
  }, [mode]);

  // Add marker via map click prompt
  const handleMapClickAddMarker = async (lat: number, lng: number) => {
    if (!selectedMap) {
      info('Select Map', 'Please choose or create a map first');
      return;
    }
    
    const title = prompt('Enter marker waypoint title:', `Marker ${markers.length + 1}`);
    if (!title) return;
    const description = prompt('Enter description (optional):') || '';

    try {
      const saved = await mapService.saveMarker({
        mapId: selectedMap.id,
        title,
        description,
        lat,
        lng,
        color: '#7c3aed',
      });
      
      setMarkers(prev => [...prev, saved]);
      success('Marker saved', `Waypoint '${saved.title}' saved to database.`);
    } catch (err: any) {
      showError('Failed', err.message || 'Could not save marker');
    }
  };

  const addRoutePoint = useCallback((lat: number, lng: number) => {
    if (!routeLayerRef.current || !leafletRef.current) return;
    const L = leafletRef.current;

    setRoutePoints(prev => {
      const newPoints = [...prev, { lat, lng }];

      // Recalculate distance
      let dist = 0;
      for (let i = 1; i < newPoints.length; i++) {
        dist += haversineDistance(newPoints[i - 1].lat, newPoints[i - 1].lng, newPoints[i].lat, newPoints[i].lng);
      }
      setRouteDistance(dist);

      // Redraw drawing line overlay
      routeLayerRef.current.clearLayers();
      
      // Keep displaying saved routes too
      loadMarkersAndRoutes();

      if (newPoints.length >= 2) {
        L.polyline(newPoints.map(p => [p.lat, p.lng]), {
          color: '#ef4444', // Red for current planning route
          weight: 4,
          opacity: 0.8,
          dashArray: '10, 6',
        }).addTo(routeLayerRef.current);
      }

      newPoints.forEach((p) => {
        L.circleMarker([p.lat, p.lng], {
          radius: 6,
          fillColor: '#ef4444',
          fillOpacity: 1,
          color: '#fff',
          weight: 2,
        }).addTo(routeLayerRef.current);
      });

      return newPoints;
    });
  }, [loadMarkersAndRoutes]);

  const handleSaveRoute = async () => {
    if (routePoints.length < 2 || !selectedMap) return;
    
    const name = prompt('Enter route name:', `Inspection Path ${savedRoutes.length + 1}`);
    if (!name) return;

    try {
      const saved = await mapService.saveRoute({
        mapId: selectedMap.id,
        name,
        points: routePoints,
        distance: routeDistance,
        color: '#7c3aed',
      });

      setSavedRoutes(prev => [...prev, saved]);
      success('Route saved', `Route '${saved.name}' saved to database.`);
      clearRoute();
      setIsRouteMode(false);
    } catch (err: any) {
      showError('Failed', err.message || 'Could not save route.');
    }
  };

  const clearRoute = () => {
    setRoutePoints([]);
    setRouteDistance(0);
    loadMarkersAndRoutes(); // Re-plot saved items
  };

  const handleDeleteMarker = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await mapService.deleteMarker(id);
      setMarkers(prev => prev.filter(m => m.id !== id));
      success('Deleted', 'Marker deleted successfully');
    } catch (err: any) {
      showError('Failed', err.message);
    }
  };

  const handleDeleteRoute = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await mapService.deleteRoute(id);
      setSavedRoutes(prev => prev.filter(r => r.id !== id));
      success('Deleted', 'Route deleted successfully');
    } catch (err: any) {
      showError('Failed', err.message);
    }
  };

  const findMyLocation = () => {
    if (!navigator.geolocation) {
      info('Geolocation unavailable', 'Your browser does not support geolocation');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLocation({ lat, lng });
        if (mapRef.current && leafletRef.current) {
          const L = leafletRef.current;
          mapRef.current.setView([lat, lng], 15);
          if (userMarkerRef.current) mapRef.current.removeLayer(userMarkerRef.current);
          userMarkerRef.current = L.circleMarker([lat, lng], {
            radius: 8, fillColor: '#3b82f6', fillOpacity: 1, color: '#fff', weight: 3,
          }).bindPopup('You are here').addTo(mapRef.current).openPopup();
        }
        success('Location found', `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      },
      () => info('Location denied', 'Please allow location permissions'),
      { enableHighAccuracy: true }
    );
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.length > 0) {
        const { lat, lon } = data[0];
        mapRef.current?.setView([parseFloat(lat), parseFloat(lon)], 14);
        success('Location found', data[0].display_name?.slice(0, 60));
      } else {
        info('Not found', 'No results for your search query');
      }
    } catch {
      info('Search failed', 'Could not execute location query');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Map selection Sidebar Panel */}
      <div className="lg:col-span-1 space-y-6">
        {/* Maps directory */}
        <div className="card p-4 space-y-4">
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
              className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-surface-200 dark:border-white/10 bg-transparent dark:text-white"
            />
            <button type="submit" className="p-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-500">
              <FolderPlus className="w-4 h-4" />
            </button>
          </form>

          <div className="space-y-1 max-h-[150px] overflow-y-auto pr-1">
            {maps.map(m => (
              <div
                key={m.id}
                onClick={() => setSelectedMap(m)}
                className={`flex items-center justify-between text-xs p-2 rounded-lg cursor-pointer transition-all ${
                  selectedMap?.id === m.id
                    ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium'
                    : 'text-surface-600 hover:bg-surface-50 dark:hover:bg-white/5 dark:text-surface-300'
                }`}
              >
                <span className="truncate flex-1">{m.name}</span>
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

        {/* Selected map detailed info */}
        {selectedMap && (
          <>
            {/* Markers list */}
            <div className="card p-4 space-y-3">
              <h3 className="font-semibold text-surface-900 dark:text-white text-xs border-b pb-1.5 dark:border-white/10 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                Waypoints ({markers.length})
              </h3>
              <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
                {markers.length === 0 ? (
                  <p className="text-[10px] text-surface-400">Click on map to place waypoints</p>
                ) : (
                  markers.map(m => (
                    <div key={m.id} className="flex items-center justify-between text-xs p-1.5 rounded bg-surface-50 dark:bg-white/[0.02] text-surface-600 dark:text-surface-300">
                      <span className="truncate flex-1 font-medium">{m.title}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setQrModalTitle(`Waypoint: ${m.title}`);
                            setQrModalContent(JSON.stringify({
                              type: 'waypoint',
                              id: m.id,
                              title: m.title,
                              lat: m.lat,
                              lng: m.lng
                            }));
                            setQrModalOpen(true);
                          }}
                          className="text-surface-400 hover:text-brand-500 transition-colors mr-1"
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

            {/* Routes list */}
            <div className="card p-4 space-y-3">
              <h3 className="font-semibold text-surface-900 dark:text-white text-xs border-b pb-1.5 dark:border-white/10 flex items-center gap-2">
                <Route className="w-3.5 h-3.5 text-purple-500" />
                Saved Routes ({savedRoutes.length})
              </h3>
              <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
                {savedRoutes.length === 0 ? (
                  <p className="text-[10px] text-surface-400">Enable Route Mode to draw paths</p>
                ) : (
                  savedRoutes.map(r => (
                    <div key={r.id} className="flex items-center justify-between text-xs p-1.5 rounded bg-surface-50 dark:bg-white/[0.02] text-surface-600 dark:text-surface-300">
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">{r.name}</p>
                        <p className="text-[9px] text-surface-400">{formatDistance(r.distance)}</p>
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
        {/* Map Mode Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 bg-surface-100 dark:bg-dark-elevated rounded-xl p-1">
            {[
              { key: 'standard', label: 'Standard', icon: <MapIcon className="w-4 h-4" /> },
              { key: 'satellite', label: 'Satellite', icon: <Satellite className="w-4 h-4" /> },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setMode(tab.key as MapMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === tab.key
                    ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
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
                if (isRouteMode) clearRoute();
                setIsRouteMode(!isRouteMode);
              }}
              icon={<Route className="w-4 h-4" />}
            >
              {isRouteMode ? 'Cancel Route' : 'Route Mode'}
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search for a location..."
            />
          </div>
          <Button variant="primary" size="sm" onClick={searchLocation} icon={<Search className="w-4 h-4" />}>
            Search
          </Button>
        </div>

        {/* Map Container */}
        <div className="card overflow-hidden">
          <div className="relative">
            <div ref={mapContainerRef} className="w-full h-[400px] sm:h-[500px] lg:h-[600px] z-0" />

            {/* Map Zoom Controls Overlay */}
            <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
              <button
                onClick={() => mapRef.current?.zoomIn()}
                className="w-10 h-10 rounded-xl bg-white dark:bg-dark-card shadow-lg border border-surface-200 dark:border-white/10 flex items-center justify-center text-surface-700 dark:text-surface-300 hover:text-brand-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => mapRef.current?.zoomOut()}
                className="w-10 h-10 rounded-xl bg-white dark:bg-dark-card shadow-lg border border-surface-200 dark:border-white/10 flex items-center justify-center text-surface-700 dark:text-surface-300 hover:text-brand-600 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={findMyLocation}
                className="w-10 h-10 rounded-xl bg-white dark:bg-dark-card shadow-lg border border-surface-200 dark:border-white/10 flex items-center justify-center text-surface-700 dark:text-surface-300 hover:text-brand-600 transition-colors"
              >
                <Crosshair className="w-4 h-4" />
              </button>
            </div>

            {/* Route Distance Planning Overlay */}
            {isRouteMode && routePoints.length > 0 && (
              <div className="absolute bottom-4 left-4 z-[1000]">
                <div className="glass-strong rounded-xl px-4 py-3 flex items-center gap-3">
                  <Ruler className="w-4 h-4 text-brand-500" />
                  <div>
                    <p className="text-xs text-surface-500">Route planning ({routePoints.length} pts)</p>
                    <p className="text-sm font-bold text-surface-900 dark:text-white">
                      {routeDistance > 0 ? formatDistance(routeDistance) : 'Click on map to draw route'}
                    </p>
                  </div>
                  {routePoints.length > 0 && (
                    <button onClick={clearRoute} className="ml-2 text-surface-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Map Info Bar */}
          <div className="px-5 py-3 border-t border-surface-200 dark:border-white/[0.08] flex items-center justify-between text-sm flex-wrap gap-2 bg-surface-50 dark:bg-dark-elevated">
            <div className="flex items-center gap-4 text-surface-500 text-xs">
              <span className="font-semibold text-surface-750 dark:text-surface-200">
                Active Map: {selectedMap?.name}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {markers.length} waypoints saved
              </span>
              <span className="flex items-center gap-1">
                <Route className="w-3.5 h-3.5" />
                {savedRoutes.length} route configurations
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code sharing Modal */}
      {qrModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content max-w-sm p-6 text-center relative">
            <button
              onClick={() => setQrModalOpen(false)}
              className="absolute top-4 right-4 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-lg text-surface-900 dark:text-white mb-4">
              {qrModalTitle}
            </h3>
            <div className="bg-white rounded-2xl p-4 border border-surface-200 dark:border-surface-700 shadow-inner inline-block mx-auto mb-4">
              <canvas ref={qrCanvasRef} className="w-48 h-48" />
            </div>
            <p className="text-xs text-surface-500 dark:text-surface-400 px-4 mb-2 truncate">
              Raw Data: {qrModalContent}
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
                  link.download = 'scoutrover-qr-code.png';
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
    </div>
  );
}

export default function MapsPage() {
  return (
    <DashboardLayout>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Maps' }]} />
      <div className="mb-6">
        <h1 className="page-title">Maps Console</h1>
        <p className="page-subtitle">Configure spatial maps, place persistent waypoints, and design navigation routes</p>
      </div>
      <MapComponent />
    </DashboardLayout>
  );
}
