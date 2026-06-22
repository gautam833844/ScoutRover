'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Maximize, ZoomIn, ZoomOut, Compass, Eye, Ruler, Activity, Layers, Sun, Moon } from 'lucide-react';
import { MapMarker, MapRoute } from '@/types';

interface LidarCanvasMapProps {
  gridData: number[];
  width: number;
  height: number;
  resolution: number;
  originX: number;
  originY: number;
  markers: MapMarker[];
  routes: MapRoute[];
  isRouteMode: boolean;
  routePoints: Array<{ lat: number; lng: number }>; // lat = y, lng = x
  onAddRoutePoint?: (point: { lat: number; lng: number }) => void;
  onMapClick?: (x: number, y: number) => void;
  selectedMarkerId?: string | null;
  onSelectMarker?: (id: string | null) => void;
  selectedRouteId?: string | null;
  onSelectRoute?: (id: string | null) => void;
  isMeasureMode: boolean;
  liveRoverPos?: { x: number; y: number; theta: number } | null;
  centerOn?: { x: number; y: number; timestamp: number } | null;
}

type MapTheme = 'cyberpunk' | 'telemetry' | 'monochrome' | 'classic';

interface ThemeStyle {
  bg: string;
  unknown: string;
  free: string;
  obstacle: string;
  gridLines: string;
  markerFill: string;
  markerOutline: string;
  routeLine: string;
  routePulse: string;
  plannedRoute: string;
  roverFill: string;
  roverOutline: string;
}

const THEMES: Record<MapTheme, ThemeStyle> = {
  cyberpunk: {
    bg: '#0b0b14',
    unknown: '#050509',
    free: '#16162a',
    obstacle: '#a855f7', // Glowing violet
    gridLines: 'rgba(139, 92, 246, 0.1)',
    markerFill: '#06b6d4', // Neon Cyan
    markerOutline: '#ffffff',
    routeLine: 'rgba(34, 197, 94, 0.5)', // Emerald
    routePulse: '#22c55e',
    plannedRoute: '#ef4444', // Red
    roverFill: '#10b981', // Emerald rover
    roverOutline: '#ffffff',
  },
  telemetry: {
    bg: '#021812',
    unknown: '#010c09',
    free: '#052e24',
    obstacle: '#10b981', // Sonar Green
    gridLines: 'rgba(16, 185, 129, 0.15)',
    markerFill: '#eab308', // Amber
    markerOutline: '#ffffff',
    routeLine: 'rgba(59, 130, 246, 0.5)', // Blue
    routePulse: '#3b82f6',
    plannedRoute: '#f97316',
    roverFill: '#3b82f6',
    roverOutline: '#ffffff',
  },
  monochrome: {
    bg: '#0f172a',
    unknown: '#020617',
    free: '#1e293b',
    obstacle: '#f8fafc', // Clean White
    gridLines: 'rgba(255, 255, 255, 0.05)',
    markerFill: '#ec4899', // Hot Pink
    markerOutline: '#ffffff',
    routeLine: 'rgba(168, 85, 247, 0.5)', // Purple
    routePulse: '#a855f7',
    plannedRoute: '#f43f5e',
    roverFill: '#ec4899',
    roverOutline: '#ffffff',
  },
  classic: {
    bg: '#ffffff',
    unknown: '#f1f5f9',
    free: '#f8fafc',
    obstacle: '#0f172a', // Dark charcoal on white
    gridLines: 'rgba(15, 23, 42, 0.05)',
    markerFill: '#8b5cf6', // Violet
    markerOutline: '#000000',
    routeLine: 'rgba(14, 165, 233, 0.6)',
    routePulse: '#0ea5e9',
    plannedRoute: '#ef4444',
    roverFill: '#8b5cf6',
    roverOutline: '#000000',
  },
};

export function LidarCanvasMap({
  gridData,
  width,
  height,
  resolution,
  originX,
  originY,
  markers,
  routes,
  isRouteMode,
  routePoints,
  onAddRoutePoint,
  onMapClick,
  selectedMarkerId,
  onSelectMarker,
  selectedRouteId,
  onSelectRoute,
  isMeasureMode,
  liveRoverPos,
  centerOn,
}: LidarCanvasMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Pan & Zoom States
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Hover telemetry
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number; cellX: number; cellY: number; val: number } | null>(null);

  // Ruler state
  const [measureStart, setMeasureStart] = useState<{ x: number; y: number } | null>(null);
  const [measureEnd, setMeasureEnd] = useState<{ x: number; y: number } | null>(null);
  const [measureHover, setMeasureHover] = useState<{ x: number; y: number } | null>(null);

  // Theme & Grid view options
  const [theme, setTheme] = useState<MapTheme>('cyberpunk');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);

  // Animation ticks
  const [pulseOffset, setPulseOffset] = useState<number>(0);

  // Coordinate transformations
  // Convert metric coordinates (mx, my) to map relative pixels (px, py)
  const metricToMap = useCallback((mx: number, my: number) => {
    const px = (mx - originX) / resolution;
    const py = height - (my - originY) / resolution;
    return { x: px, y: py };
  }, [originX, originY, resolution, height]);

  // Convert map relative pixels (px, py) to canvas screen pixels (sx, sy)
  const mapToScreen = useCallback((px: number, py: number) => {
    const sx = px * zoom + pan.x;
    const sy = py * zoom + pan.y;
    return { x: sx, y: sy };
  }, [zoom, pan]);

  // Combined metric to screen coordinates
  const metricToScreen = useCallback((mx: number, my: number) => {
    const map = metricToMap(mx, my);
    return mapToScreen(map.x, map.y);
  }, [metricToMap, mapToScreen]);

  // Convert canvas screen pixels (sx, sy) to map relative pixels (px, py)
  const screenToMap = useCallback((sx: number, sy: number) => {
    const px = (sx - pan.x) / zoom;
    const py = (sy - pan.y) / zoom;
    return { x: px, y: py };
  }, [zoom, pan]);

  // Convert map relative pixels (px, py) to metric coordinates (mx, my)
  const mapToMetric = useCallback((px: number, py: number) => {
    const mx = px * resolution + originX;
    const my = (height - py) * resolution + originY;
    return { x: mx, y: my };
  }, [originX, originY, resolution, height]);

  // Combined screen to metric coordinates
  const screenToMetric = useCallback((sx: number, sy: number) => {
    const map = screenToMap(sx, sy);
    return mapToMetric(map.x, map.y);
  }, [screenToMap, mapToMetric]);

  // Autocentering the map
  const centerMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || width <= 0 || height <= 0) return;

    const cw = canvas.width;
    const ch = canvas.height;
    
    // Fit map inside canvas with some padding
    const padding = 40;
    const scale = Math.min((cw - padding) / width, (ch - padding) / height);
    
    const nextZoom = Math.max(0.2, Math.min(scale, 10));
    setZoom(nextZoom);

    // Center map image
    const mapWidthInScreen = width * nextZoom;
    const mapHeightInScreen = height * nextZoom;
    setPan({
      x: (cw - mapWidthInScreen) / 2,
      y: (ch - mapHeightInScreen) / 2,
    });
  }, [width, height]);

  // Initialize and resize canvas
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = Math.max(rect.height, 450); // Minimum height

      centerMap();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [centerMap]);

  // Re-render offscreen canvas when gridData, dimensions, or theme changes
  useEffect(() => {
    if (width <= 0 || height <= 0 || !gridData.length) return;

    // Create offscreen canvas if not present
    if (!offscreenCanvasRef.current && typeof window !== 'undefined') {
      offscreenCanvasRef.current = document.createElement('canvas');
    }
    const offscreen = offscreenCanvasRef.current;
    if (!offscreen) return;
    offscreen.width = width;
    offscreen.height = height;

    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    const activeTheme = THEMES[theme];

    // Create ImageData for fast pixel manipulation
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    // Parse color strings to RGB values
    const parseHex = (hex: string) => {
      const match = hex.replace('#', '');
      return {
        r: parseInt(match.slice(0, 2), 16),
        g: parseInt(match.slice(2, 4), 16),
        b: parseInt(match.slice(4, 6), 16),
      };
    };

    const cBg = parseHex(activeTheme.bg);
    const cUnknown = parseHex(activeTheme.unknown);
    const cFree = parseHex(activeTheme.free);
    const cObstacle = parseHex(activeTheme.obstacle);

    const size = width * height;
    for (let i = 0; i < size; i++) {
      const cellVal = gridData[i];
      let r = cUnknown.r, g = cUnknown.g, b = cUnknown.b;

      if (cellVal === 0) {
        // Free Space
        r = cFree.r; g = cFree.g; b = cFree.b;
      } else if (cellVal > 0) {
        // Occupied/Obstacle
        r = cObstacle.r; g = cObstacle.g; b = cObstacle.b;
      }

      // Index in ImageData is row-by-row top-to-bottom.
      // But standard ROS grids store row-by-row bottom-to-top.
      // Let's draw it row-flipped:
      const col = i % width;
      const row = Math.floor(i / width);
      const flippedRow = height - 1 - row;
      const idx = (flippedRow * width + col) * 4;

      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }

    ctx.putImageData(imgData, 0, 0);
    offscreenCanvasRef.current = offscreen;
  }, [gridData, width, height, theme]);

  // Setup route animation frame loop
  useEffect(() => {
    let animFrame: number;
    const tick = () => {
      setPulseOffset((prev) => (prev + 0.008) % 1.0);
      animFrame = requestAnimationFrame(tick);
    };
    animFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const activeTheme = THEMES[theme];

    // Clear Canvas
    ctx.fillStyle = activeTheme.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid Image from Offscreen Canvas
    if (offscreenCanvasRef.current && width > 0 && height > 0) {
      // Use image smoothing off for nice crisp grid pixels
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        offscreenCanvasRef.current,
        0,
        0,
        width,
        height,
        pan.x,
        pan.y,
        width * zoom,
        height * zoom
      );
      ctx.imageSmoothingEnabled = true;
    }

    // Draw Grid lines (1 meter grid lines)
    if (showGrid && resolution > 0) {
      ctx.strokeStyle = activeTheme.gridLines;
      ctx.lineWidth = 0.5;

      // Find viewport boundary in metric space
      const topLeftMetric = screenToMetric(0, 0);
      const bottomRightMetric = screenToMetric(canvas.width, canvas.height);

      const minX = Math.floor(Math.min(topLeftMetric.x, bottomRightMetric.x));
      const maxX = Math.ceil(Math.max(topLeftMetric.x, bottomRightMetric.x));
      const minY = Math.floor(Math.min(topLeftMetric.y, bottomRightMetric.y));
      const maxY = Math.ceil(Math.max(topLeftMetric.y, bottomRightMetric.y));

      // Draw vertical lines (X coords)
      for (let mx = minX; mx <= maxX; mx += 1.0) {
        const screenPos = metricToScreen(mx, 0);
        ctx.beginPath();
        ctx.moveTo(screenPos.x, 0);
        ctx.lineTo(screenPos.x, canvas.height);
        ctx.stroke();
      }

      // Draw horizontal lines (Y coords)
      for (let my = minY; my <= maxY; my += 1.0) {
        const screenPos = metricToScreen(0, my);
        ctx.beginPath();
        ctx.moveTo(0, screenPos.y);
        ctx.lineTo(canvas.width, screenPos.y);
        ctx.stroke();
      }
    }

    // Draw Saved Routes with Neon flow animation
    routes.forEach((route) => {
      if (route.points.length < 2) return;

      const screenPts = route.points.map((p) => metricToScreen(p.lng, p.lat)); // lng = x, lat = y
      
      // Draw background route path
      ctx.strokeStyle = activeTheme.routeLine;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(screenPts[0].x, screenPts[0].y);
      for (let i = 1; i < screenPts.length; i++) {
        ctx.lineTo(screenPts[i].x, screenPts[i].y);
      }
      ctx.stroke();

      // Flowing glowing pulses
      ctx.strokeStyle = activeTheme.routePulse;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 25]);
      ctx.lineDashOffset = -pulseOffset * 33;
      ctx.beginPath();
      ctx.moveTo(screenPts[0].x, screenPts[0].y);
      for (let i = 1; i < screenPts.length; i++) {
        ctx.lineTo(screenPts[i].x, screenPts[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash
    });

    // Draw active drawing route
    if (isRouteMode && routePoints.length > 0) {
      const drawingPts = routePoints.map((p) => metricToScreen(p.lng, p.lat)); // lng = x, lat = y

      // Draw path line
      ctx.strokeStyle = activeTheme.plannedRoute;
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(drawingPts[0].x, drawingPts[0].y);
      for (let i = 1; i < drawingPts.length; i++) {
        ctx.lineTo(drawingPts[i].x, drawingPts[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw connecting line to hover position if active
      if (isRouteMode && measureHover) {
        const lastPt = drawingPts[drawingPts.length - 1];
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(lastPt.x, lastPt.y);
        ctx.lineTo(measureHover.x, measureHover.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw waypoint dots for planned route
      drawingPts.forEach((pt, index) => {
        ctx.fillStyle = activeTheme.plannedRoute;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (showLabels) {
          ctx.fillStyle = activeTheme.plannedRoute;
          ctx.font = '10px sans-serif';
          ctx.fillText(`P${index + 1}`, pt.x + 8, pt.y - 8);
        }
      });
    }

    // Draw measurement line
    if (isMeasureMode && measureStart) {
      const startScreen = metricToScreen(measureStart.x, measureStart.y);
      const endScreen = measureEnd 
        ? metricToScreen(measureEnd.x, measureEnd.y) 
        : (measureHover || startScreen);

      ctx.strokeStyle = '#f59e0b'; // Amber ruler
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(startScreen.x, startScreen.y);
      ctx.lineTo(endScreen.x, endScreen.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw end tick crosses
      const drawTick = (pt: { x: number; y: number }) => {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pt.x - 5, pt.y - 5);
        ctx.lineTo(pt.x + 5, pt.y + 5);
        ctx.moveTo(pt.x + 5, pt.y - 5);
        ctx.lineTo(pt.x - 5, pt.y + 5);
        ctx.stroke();
      };
      drawTick(startScreen);
      if (measureEnd || measureHover) drawTick(endScreen);

      // Measure distance text
      const endM = measureEnd || (measureHover ? screenToMetric(measureHover.x, measureHover.y) : measureStart);
      const dx = endM.x - measureStart.x;
      const dy = endM.y - measureStart.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const midX = (startScreen.x + endScreen.x) / 2;
      const midY = (startScreen.y + endScreen.y) / 2;

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      
      // Draw background text shield
      const txt = `${dist.toFixed(2)} m`;
      const txtWidth = ctx.measureText(txt).width;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(midX - txtWidth/2 - 4, midY - 17, txtWidth + 8, 18);
      ctx.fillStyle = '#f59e0b';
      ctx.fillText(txt, midX, midY - 2);
    }

    // Draw Saved Waypoints (markers)
    markers.forEach((marker) => {
      const pt = metricToScreen(marker.lng, marker.lat); // lng = x, lat = y
      const isSelected = marker.id === selectedMarkerId;

      // Glow effect for selected marker
      if (isSelected) {
        ctx.shadowColor = activeTheme.markerFill;
        ctx.shadowBlur = 12;
      }

      // Draw Marker icon
      ctx.fillStyle = activeTheme.markerFill;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isSelected ? 8 : 6, 0, 2 * Math.PI);
      ctx.fill();

      ctx.strokeStyle = activeTheme.markerOutline;
      ctx.lineWidth = isSelected ? 2 : 1.5;
      ctx.stroke();

      // Reset shadow
      ctx.shadowBlur = 0;

      // Draw secondary concentric target ring
      ctx.strokeStyle = activeTheme.markerFill;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isSelected ? 14 : 10, 0, 2 * Math.PI);
      ctx.stroke();

      // Labels
      if (showLabels) {
        ctx.fillStyle = theme === 'classic' ? '#0f172a' : '#ffffff';
        ctx.font = isSelected ? 'bold 11px sans-serif' : '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        // Shadow text effect
        ctx.strokeStyle = theme === 'classic' ? '#ffffff' : '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText(marker.title, pt.x + 12, pt.y);
        ctx.fillText(marker.title, pt.x + 12, pt.y);
      }
    });

    // Draw Live Rover Position if available
    if (liveRoverPos) {
      const pt = metricToScreen(liveRoverPos.x, liveRoverPos.y);
      
      ctx.save();
      ctx.translate(pt.x, pt.y);
      
      // Yaw angle in ROS is counterclockwise, HTML canvas rotates clockwise.
      // Need to adjust rotation by flipping the angle
      ctx.rotate(-liveRoverPos.theta);

      // Draw Arrow representing heading
      ctx.fillStyle = activeTheme.roverFill;
      ctx.strokeStyle = activeTheme.roverOutline;
      ctx.lineWidth = 2;

      ctx.beginPath();
      // Arrow pointing right (towards heading)
      ctx.moveTo(14, 0);
      ctx.lineTo(-8, -10);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-8, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Concentric telemetry pulsing circle
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 16 + pulseOffset * 10, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.restore();
    }

    // Draw Scale indicator bar
    if (resolution > 0) {
      // Find round meters to show
      const roundDistances = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];
      const targetWidth = 100; // screen pixels
      
      // At current zoom, resolution in meters/pixel:
      // meters per screen pixel = resolution / zoom
      // distance in meters = targetWidth * (resolution / zoom)
      const idealDistance = targetWidth * (resolution / zoom);
      
      // Find closest standard distance from the array
      let chosenDistance = roundDistances[0];
      for (const d of roundDistances) {
        if (d >= idealDistance) {
          chosenDistance = d;
          break;
        }
      }

      // Convert chosen distance to screen pixels
      const barWidth = chosenDistance * (zoom / resolution);

      // Draw Scale Bar in bottom left
      const bx = 20;
      const by = canvas.height - 20;

      ctx.strokeStyle = theme === 'classic' ? '#0f172a' : '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(bx, by - 6);
      ctx.lineTo(bx, by);
      ctx.lineTo(bx + barWidth, by);
      ctx.lineTo(bx + barWidth, by - 6);
      ctx.stroke();

      ctx.fillStyle = theme === 'classic' ? '#0f172a' : '#ffffff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${chosenDistance} m`, bx + 4, by - 8);
    }
  }, [
    gridData, width, height, resolution, originX, originY,
    markers, routes, isRouteMode, routePoints, selectedMarkerId,
    selectedRouteId, isMeasureMode, measureStart, measureEnd, measureHover,
    theme, showGrid, showLabels, zoom, pan, pulseOffset, liveRoverPos,
    screenToMetric, metricToScreen,
  ]);

  // Interactive mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return; // Left click only

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (isMeasureMode) {
      const metric = screenToMetric(sx, sy);
      if (!measureStart) {
        setMeasureStart(metric);
      } else {
        setMeasureEnd(metric);
      }
      return;
    }

    if (isRouteMode) {
      const metric = screenToMetric(sx, sy);
      if (onAddRoutePoint) {
        // lat = y, lng = x
        onAddRoutePoint({ lat: metric.y, lng: metric.x });
      }
      return;
    }

    // Check if clicked near a marker (radius 12 pixels click detection)
    let clickedMarker = false;
    for (const m of markers) {
      const screenM = metricToScreen(m.lng, m.lat);
      const dx = sx - screenM.x;
      const dy = sy - screenM.y;
      if (Math.sqrt(dx * dx + dy * dy) < 14) {
        if (onSelectMarker) onSelectMarker(m.id);
        clickedMarker = true;
        break;
      }
    }

    if (!clickedMarker && onSelectMarker) {
      onSelectMarker(null);
    }

    // If double click or click without anything else, prepare for panning
    if (!isRouteMode && !isMeasureMode && !clickedMarker) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    // Pan canvas
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }

    // Update hover coordinates HUD
    const metric = screenToMetric(sx, sy);
    const mapCol = Math.floor((metric.x - originX) / resolution);
    const mapRow = Math.floor((metric.y - originY) / resolution);
    
    let cellVal = -1;
    if (mapCol >= 0 && mapCol < width && mapRow >= 0 && mapRow < height) {
      cellVal = gridData[mapRow * width + mapCol];
    }

    setHoverCoords({
      x: metric.x,
      y: metric.y,
      cellX: mapCol,
      cellY: mapRow,
      val: cellVal,
    });

    // Update measure ruler hover
    if (isMeasureMode || isRouteMode) {
      setMeasureHover({ x: sx, y: sy });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Save mouse position in metric coordinates before zoom
    const mouseMetricBefore = screenToMetric(mouseX, mouseY);

    // Calculate zoom multiplier
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const nextZoom = Math.max(0.15, Math.min(zoom * zoomFactor, 12));
    
    setZoom(nextZoom);

    // Adjust pan so that mouse hover metric position stays locked in place
    // We want the new screen coordinate of mouseMetricBefore to equal mouseX/mouseY
    // sx = px * nextZoom + newPanX  -->  mouseX = ((mouseMetricBefore.x - originX)/res) * nextZoom + newPanX
    const px = (mouseMetricBefore.x - originX) / resolution;
    const py = height - (mouseMetricBefore.y - originY) / resolution;

    setPan({
      x: mouseX - px * nextZoom,
      y: mouseY - py * nextZoom,
    });
  };

  // Zoom control helpers
  const triggerZoom = (factor: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const centerMetric = screenToMetric(cx, cy);
    const nextZoom = Math.max(0.15, Math.min(zoom * factor, 12));
    setZoom(nextZoom);

    const px = (centerMetric.x - originX) / resolution;
    const py = height - (centerMetric.y - originY) / resolution;

    setPan({
      x: cx - px * nextZoom,
      y: cy - py * nextZoom,
    });
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isMeasureMode || isRouteMode) return;

    // On double click in navigation mode, add waypoint / trigger map click
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    const metric = screenToMetric(sx, sy);
    if (onMapClick) {
      onMapClick(metric.x, metric.y);
    }
  };

  const resetRuler = () => {
    setMeasureStart(null);
    setMeasureEnd(null);
    setMeasureHover(null);
  };

  return (
    <div ref={containerRef} className="relative w-full h-[450px] sm:h-[500px] lg:h-[600px] rounded-xl overflow-hidden border border-surface-200 dark:border-white/[0.08] shadow-inner bg-slate-950 select-none">
      
      {/* HTML Canvas drawing target */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        className="cursor-crosshair w-full h-full block"
      />

      {/* Floating Canvas UI Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={() => triggerZoom(1.2)}
          className="w-9 h-9 rounded-lg bg-surface-900/80 dark:bg-dark-card/90 backdrop-blur-md shadow-lg border border-white/10 flex items-center justify-center text-white hover:bg-brand-500 hover:text-white transition-all active:scale-95"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => triggerZoom(0.8)}
          className="w-9 h-9 rounded-lg bg-surface-900/80 dark:bg-dark-card/90 backdrop-blur-md shadow-lg border border-white/10 flex items-center justify-center text-white hover:bg-brand-500 hover:text-white transition-all active:scale-95"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={centerMap}
          className="w-9 h-9 rounded-lg bg-surface-900/80 dark:bg-dark-card/90 backdrop-blur-md shadow-lg border border-white/10 flex items-center justify-center text-white hover:bg-brand-500 hover:text-white transition-all active:scale-95"
          title="Recenter Map View"
        >
          <Maximize className="w-4 h-4" />
        </button>
        <div className="h-px bg-white/10 my-1" />
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`w-9 h-9 rounded-lg backdrop-blur-md shadow-lg border border-white/10 flex items-center justify-center transition-all active:scale-95 ${
            showGrid 
              ? 'bg-brand-600 text-white border-brand-500' 
              : 'bg-surface-900/80 dark:bg-dark-card/90 text-white hover:bg-white/5'
          }`}
          title="Toggle Gridlines"
        >
          <Layers className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowLabels(!showLabels)}
          className={`w-9 h-9 rounded-lg backdrop-blur-md shadow-lg border border-white/10 flex items-center justify-center transition-all active:scale-95 ${
            showLabels 
              ? 'bg-brand-600 text-white border-brand-500' 
              : 'bg-surface-900/80 dark:bg-dark-card/90 text-white hover:bg-white/5'
          }`}
          title="Toggle Waypoint Labels"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Theme / Mode Overlay HUD */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
        {/* Theme select dropdown */}
        <div className="glass-strong rounded-lg px-2.5 py-1.5 flex items-center gap-2 border border-white/10 text-xs text-white">
          <Layers className="w-3.5 h-3.5 text-brand-400" />
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as MapTheme)}
            className="bg-transparent text-white border-none outline-none font-medium pr-6 py-0.5 cursor-pointer text-xs focus:ring-0 focus:outline-none"
          >
            <option value="cyberpunk" className="bg-slate-900 text-white">Theme: Cyberpunk</option>
            <option value="telemetry" className="bg-slate-900 text-white">Theme: Sonar Telemetry</option>
            <option value="monochrome" className="bg-slate-900 text-white">Theme: Light Gray</option>
            <option value="classic" className="bg-slate-100 text-slate-900">Theme: High-Contrast</option>
          </select>
        </div>

        {/* Ruler reset button when active */}
        {isMeasureMode && measureStart && (
          <button
            onClick={resetRuler}
            className="glass-strong rounded-lg px-3 py-1.5 border border-amber-500/30 text-xs text-amber-400 hover:bg-amber-500/10 transition-colors flex items-center gap-1.5 font-semibold"
          >
            <Ruler className="w-3.5 h-3.5" />
            Reset Ruler
          </button>
        )}
      </div>

      {/* Dynamic Telemetry HUD overlay in the bottom right corner */}
      {hoverCoords && (
        <div className="absolute bottom-4 right-4 z-10 glass-strong border border-white/10 rounded-xl px-4 py-3 min-w-[210px] text-white flex flex-col gap-1.5 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-1">
            <span className="text-[10px] text-surface-400 font-bold uppercase tracking-wider">LIDAR TELEMETRY</span>
            <Activity className="w-3.5 h-3.5 text-brand-400 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <span className="text-surface-400">Position X:</span>
            <span className="font-mono font-semibold text-right">{hoverCoords.x.toFixed(3)} m</span>
            
            <span className="text-surface-400">Position Y:</span>
            <span className="font-mono font-semibold text-right">{hoverCoords.y.toFixed(3)} m</span>

            <span className="text-surface-400">Grid Cell:</span>
            <span className="font-mono text-right text-surface-300">[{hoverCoords.cellX}, {hoverCoords.cellY}]</span>

            <span className="text-surface-400">Occupancy:</span>
            <span className="text-right font-medium">
              {hoverCoords.val === -1 ? (
                <span className="text-surface-400 font-semibold">Unknown</span>
              ) : hoverCoords.val === 0 ? (
                <span className="text-emerald-400 font-semibold">Free (0%)</span>
              ) : (
                <span className="text-purple-400 font-semibold">Wall ({hoverCoords.val}%)</span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Mode Overlay Badge */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1.5">
        {isMeasureMode && (
          <span className="px-3 py-1 text-xs rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 font-semibold backdrop-blur-md w-fit">
            <Ruler className="w-3.5 h-3.5 animate-pulse" />
            Ruler Mode Active
          </span>
        )}
        {isRouteMode && (
          <span className="px-3 py-1 text-xs rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1.5 font-semibold backdrop-blur-md w-fit">
            <Compass className="w-3.5 h-3.5 animate-pulse" />
            Route Planning Mode
          </span>
        )}
      </div>
    </div>
  );
}
export default LidarCanvasMap;
