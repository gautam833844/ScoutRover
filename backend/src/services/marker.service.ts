import MarkerRepository from '../repositories/marker.repository';
import ApiError from '../utils/apiError';
import auditService from './audit.service';

export class MarkerService {
  private markerRepository: MarkerRepository;

  constructor() {
    this.markerRepository = new MarkerRepository();
  }

  async createMarker(data: any, userId: string) {
    const marker = await this.markerRepository.create(data);

    await auditService.log({
      userId,
      action: 'MARKER_CREATE',
      description: `Created waypoint marker: ${marker.title} at (${marker.lat}, ${marker.lng}) on Map ID: ${marker.mapId}`,
    });

    return marker;
  }

  async listMarkers(options: any) {
    const searchFields = ['title', 'description'];
    return this.markerRepository.findWithPagination({
      ...options,
      searchFields,
    });
  }

  async getMarkersByMap(mapId: string) {
    return this.markerRepository.findMany({ mapId });
  }

  async getMarkerById(id: string) {
    const marker = await this.markerRepository.findById(id);
    if (!marker) {
      throw new ApiError(404, 'Marker not found');
    }
    return marker;
  }

  async updateMarker(id: string, updates: any, userId: string) {
    const marker = await this.markerRepository.update(id, updates);
    if (!marker) {
      throw new ApiError(404, 'Marker not found');
    }

    await auditService.log({
      userId,
      action: 'MARKER_UPDATE',
      description: `Updated marker: ${marker.title} (ID: ${id})`,
    });

    return marker;
  }

  async deleteMarker(id: string, userId: string) {
    const marker = await this.markerRepository.delete(id);
    if (!marker) {
      throw new ApiError(404, 'Marker not found');
    }

    await auditService.log({
      userId,
      action: 'MARKER_DELETE',
      description: `Deleted marker: ${marker.title} (ID: ${id})`,
    });

    return marker;
  }
}

export const markerService = new MarkerService();
export default markerService;
