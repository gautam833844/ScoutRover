import { apiClient } from './apiClient';
import { MapMarker, MapRoute } from '@/types';

export interface SavedMap {
  id: string;
  name: string;
  width: number;
  height: number;
  resolution: number;
  originX: number;
  originY: number;
  gridData: number[]; // Grid array parsed from string or base64
  createdAt: string;
}

// ========== HELPER BINARY/BASE64 UTILITIES ==========
function byteArrayToBase64(arr: number[]): string {
  const bytes = new Int8Array(arr);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i] & 0xFF);
  }
  return window.btoa(binary);
}

function base64ToByteArray(base64: string): number[] {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Int8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return Array.from(bytes);
}

class MapService {
  // ========== MAP APIS ==========
  async saveMap(data: {
    name: string;
    width: number;
    height: number;
    resolution: number;
    originX: number;
    originY: number;
    gridData: number[];
  }): Promise<SavedMap> {
    const base64Grid = byteArrayToBase64(data.gridData);
    const rawMap = await apiClient.post<any>('/maps', {
      ...data,
      gridData: base64Grid,
    });
    
    return {
      id: rawMap._id || rawMap.id,
      name: rawMap.name,
      width: rawMap.width,
      height: rawMap.height,
      resolution: rawMap.resolution,
      originX: rawMap.originX,
      originY: rawMap.originY,
      gridData: rawMap.gridData ? base64ToByteArray(rawMap.gridData) : [],
      createdAt: rawMap.createdAt,
    };
  }

  async listMaps(options: RequestInit = {}): Promise<SavedMap[]> {
    const response = await apiClient.get<any>('/maps?limit=100', options);
    const docs = response.docs || [];
    
    return docs.map((rawMap: any) => ({
      id: rawMap._id || rawMap.id,
      name: rawMap.name,
      width: rawMap.width,
      height: rawMap.height,
      resolution: rawMap.resolution,
      originX: rawMap.originX,
      originY: rawMap.originY,
      // Large gridData is projected away in list API (C3)
      gridData: [],
      createdAt: rawMap.createdAt,
    }));
  }

  async getMapById(id: string, options: RequestInit = {}): Promise<SavedMap> {
    const rawMap = await apiClient.get<any>(`/maps/${id}`, options);
    return {
      id: rawMap._id || rawMap.id,
      name: rawMap.name,
      width: rawMap.width,
      height: rawMap.height,
      resolution: rawMap.resolution,
      originX: rawMap.originX,
      originY: rawMap.originY,
      gridData: rawMap.gridData ? base64ToByteArray(rawMap.gridData) : [],
      createdAt: rawMap.createdAt,
    };
  }

  async deleteMap(id: string): Promise<void> {
    await apiClient.delete(`/maps/${id}`);
  }

  // ========== MARKER APIS ==========
  async saveMarker(data: {
    mapId: string;
    title: string;
    description?: string;
    lat: number;
    lng: number;
    color?: string;
  }): Promise<MapMarker> {
    const raw = await apiClient.post<any>('/markers', data);
    return {
      id: raw._id || raw.id,
      title: raw.title,
      description: raw.description,
      lat: raw.lat,
      lng: raw.lng,
      color: raw.color,
    };
  }

  async getMarkers(mapId: string): Promise<MapMarker[]> {
    const response = await apiClient.get<any[]>(`/markers/map/${mapId}`);
    return response.map((raw: any) => ({
      id: raw._id || raw.id,
      title: raw.title,
      description: raw.description,
      lat: raw.lat,
      lng: raw.lng,
      color: raw.color,
    }));
  }

  async deleteMarker(id: string): Promise<void> {
    await apiClient.delete(`/markers/${id}`);
  }

  // ========== ROUTE APIS ==========
  async saveRoute(data: {
    mapId: string;
    name: string;
    points: Array<{ lat: number; lng: number }>;
    distance: number;
    color?: string;
  }): Promise<MapRoute> {
    const raw = await apiClient.post<any>('/routes', data);
    return {
      id: raw._id || raw.id,
      points: raw.points,
      distance: raw.distance,
      color: raw.color,
    };
  }

  async getRoutes(mapId: string): Promise<MapRoute[]> {
    const response = await apiClient.get<any[]>(`/routes/map/${mapId}`);
    return response.map((raw: any) => ({
      id: raw._id || raw.id,
      points: raw.points,
      distance: raw.distance,
      color: raw.color,
    }));
  }

  async deleteRoute(id: string): Promise<void> {
    await apiClient.delete(`/routes/${id}`);
  }
}

export const mapService = new MapService();
export default mapService;
