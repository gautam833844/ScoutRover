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
  gridData: number[]; // Grid array parsed from string
  createdAt: string;
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
    const rawMap = await apiClient.post<any>('/maps', {
      ...data,
      gridData: JSON.stringify(data.gridData),
    });
    
    return {
      id: rawMap._id || rawMap.id,
      name: rawMap.name,
      width: rawMap.width,
      height: rawMap.height,
      resolution: rawMap.resolution,
      originX: rawMap.originX,
      originY: rawMap.originY,
      gridData: JSON.parse(rawMap.gridData),
      createdAt: rawMap.createdAt,
    };
  }

  async listMaps(): Promise<SavedMap[]> {
    const response = await apiClient.get<any>('/maps?limit=100');
    // Express response includes docs array in pagination payload
    const docs = response.docs || [];
    
    return docs.map((rawMap: any) => ({
      id: rawMap._id || rawMap.id,
      name: rawMap.name,
      width: rawMap.width,
      height: rawMap.height,
      resolution: rawMap.resolution,
      originX: rawMap.originX,
      originY: rawMap.originY,
      gridData: JSON.parse(rawMap.gridData),
      createdAt: rawMap.createdAt,
    }));
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
