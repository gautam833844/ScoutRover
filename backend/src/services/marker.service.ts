import MarkerRepository from '../repositories/marker.repository';
import ApiError from '../utils/apiError';
import auditService from './audit.service';

export class MarkerService {
  private markerRepository: MarkerRepository;

  constructor() {
    this.markerRepository = new MarkerRepository();
  }

  async createMarker(data: any, userId: string) {
    const marker = await this.markerRepository.create({
      ...data,
      createdBy: userId,
    });

    await auditService.log({
      userId,
      action: 'MARKER_CREATE',
      description: `Created waypoint marker: ${marker.title} on Map ID: ${marker.mapId}`,
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

  async updateMarker(id: string, updates: any, user: { userId: string; role: string }) {
    const marker = await this.markerRepository.findById(id);
    if (!marker) {
      throw new ApiError(404, 'Marker not found');
    }

    // Ownership check: must be owner or admin
    if (marker.createdBy.toString() !== user.userId && user.role !== 'ADMIN') {
      throw new ApiError(403, 'Forbidden: You do not own this waypoint marker.');
    }

    const updated = await this.markerRepository.update(id, updates);

    await auditService.log({
      userId: user.userId,
      action: 'MARKER_UPDATE',
      description: `Updated marker: ${updated?.title} (ID: ${id})`,
    });

    return updated;
  }

  async deleteMarker(id: string, user: { userId: string; role: string }) {
    const marker = await this.markerRepository.findById(id);
    if (!marker) {
      throw new ApiError(404, 'Marker not found');
    }

    // Ownership check: must be owner or admin
    if (marker.createdBy.toString() !== user.userId && user.role !== 'ADMIN') {
      throw new ApiError(403, 'Forbidden: You do not own this waypoint marker.');
    }

    await this.markerRepository.delete(id);

    await auditService.log({
      userId: user.userId,
      action: 'MARKER_DELETE',
      description: `Deleted marker: ${marker.title} (ID: ${id})`,
    });

    return marker;
  }
}

export const markerService = new MarkerService();
export default markerService;
