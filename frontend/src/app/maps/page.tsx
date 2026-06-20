'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Map as MapIcon, Satellite, Layers, Search, Navigation, MapPin,
  Plus, Minus, Crosshair, Route, Trash2, Ruler, X
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { Button, Tabs, Breadcrumb, SearchBar, Badge } from '@/components/ui';
import { useToast } from '@/contexts/ToastContext';
import { MAP_CONFIG } from '@/constants';
import { MapMode, MapMarker } from '@/types';
import { generateId, haversineDistance, formatDistance } from '@/utils/helpers';

// Dynamically import Leaflet to avoid SSR issues
function MapComponent() {
  const { success, info } = useToast();
  const [mode, setMode] = useState<MapMode>('standard');
  const [searchQuery, setSearchQuery] = useState('');
  const [markers, setMarkers] = useState<MapMarker[]>([]);
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

  // Initialize map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    import('leaflet').then((L) => {
      leafletRef.current = L;
      // Fix Leaflet default icon issue
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
        // Use a flag from a ref or window to check route mode
        if ((window as any).__routeMode) {
          addRoutePoint(lat, lng);
        } else {
          addMarker(lat, lng);
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

  // Sync route mode to window
  useEffect(() => {
    (window as any).__routeMode = isRouteMode;
  }, [isRouteMode]);

  // Change tile layer on mode change
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

  const addMarker = useCallback((lat: number, lng: number) => {
    if (!markersLayerRef.current || !leafletRef.current) return;
    const L = leafletRef.current;
    const id = generateId();
    const marker: MapMarker = { id, lat, lng, title: `Marker ${markers.length + 1}` };

    const leafletMarker = L.marker([lat, lng])
      .bindPopup(`<b>${marker.title}</b><br>Lat: ${lat.toFixed(5)}<br>Lng: ${lng.toFixed(5)}`)
      .addTo(markersLayerRef.current);

    setMarkers(prev => [...prev, marker]);
  }, [markers.length]);

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

      // Redraw polyline
      routeLayerRef.current.clearLayers();
      if (newPoints.length >= 2) {
        L.polyline(newPoints.map(p => [p.lat, p.lng]), {
          color: '#7c3aed', weight: 4, opacity: 0.8, dashArray: '10, 6',
        }).addTo(routeLayerRef.current);
      }

      // Add circle marker
      L.circleMarker([lat, lng], {
        radius: 6, fillColor: '#7c3aed', fillOpacity: 1, color: '#fff', weight: 2,
      }).addTo(routeLayerRef.current);

      return newPoints;
    });
  }, []);

  const clearRoute = () => {
    routeLayerRef.current?.clearLayers();
    setRoutePoints([]);
    setRouteDistance(0);
  };

  const clearMarkers = () => {
    markersLayerRef.current?.clearLayers();
    setMarkers([]);
  };

  const findMyLocation = () => {
    if (!navigator.geolocation) {
      info('Geolocation not available', 'Your browser does not support geolocation');
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
      () => info('Location denied', 'Please allow location access'),
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
        info('Not found', 'No results for your search');
      }
    } catch {
      info('Search failed', 'Could not search for location');
    }
  };

  return (
    <>
      {/* Map Mode Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
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
          <Button
            variant={isRouteMode ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setIsRouteMode(!isRouteMode)}
            icon={<Route className="w-4 h-4" />}
          >
            {isRouteMode ? 'Exit Route' : 'Route Mode'}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-4">
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

          {/* Map Controls Overlay */}
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

          {/* Route Distance Badge */}
          {routePoints.length >= 2 && (
            <div className="absolute bottom-4 left-4 z-[1000]">
              <div className="glass-strong rounded-xl px-4 py-3 flex items-center gap-3">
                <Ruler className="w-4 h-4 text-brand-500" />
                <div>
                  <p className="text-xs text-surface-500">Total Distance</p>
                  <p className="text-sm font-bold text-surface-900 dark:text-white">{formatDistance(routeDistance)}</p>
                </div>
                <button onClick={clearRoute} className="ml-2 text-surface-400 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Map Info Bar */}
        <div className="px-5 py-3 border-t border-surface-200 dark:border-white/[0.08] flex items-center justify-between text-sm flex-wrap gap-2">
          <div className="flex items-center gap-4 text-surface-500">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {markers.length} markers
            </span>
            {routePoints.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Route className="w-3.5 h-3.5" />
                {routePoints.length} route points
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {markers.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearMarkers} icon={<Trash2 className="w-3.5 h-3.5" />}>
                Clear markers
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function MapsPage() {
  return (
    <DashboardLayout>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Maps' }]} />
      <div className="mb-6">
        <h1 className="page-title">Maps</h1>
        <p className="page-subtitle">Explore standard, satellite, and LiDAR map views</p>
      </div>
      <MapComponent />
    </DashboardLayout>
  );
}
