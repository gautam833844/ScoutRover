import MapRepository from '../repositories/map.repository';
import ApiError from '../utils/apiError';
import auditService from './audit.service';

export class MapService {
  private mapRepository: MapRepository;

  constructor() {
    this.mapRepository = new MapRepository();
  }

  async createMap(data: any, userId: string) {
    const map = await this.mapRepository.create({
      ...data,
      createdBy: userId,
    });

    await auditService.log({
      userId,
      action: 'MAP_CREATE',
      description: `Successfully saved map scan: ${map.name} (${map.width}x${map.height})`,
    });

    return map;
  }

  async listMaps(options: any) {
    const searchFields = ['name'];
    return this.mapRepository.findWithPagination({
      ...options,
      searchFields,
      populate: ['createdBy'],
    });
  }

  async getMapById(id: string) {
    const map = await this.mapRepository.findById(id, ['createdBy']);
    if (!map) {
      throw new ApiError(404, 'Map not found');
    }
    return map;
  }

  async updateMap(id: string, updates: any, userId: string) {
    const map = await this.mapRepository.update(id, updates);
    if (!map) {
      throw new ApiError(404, 'Map not found');
    }

    await auditService.log({
      userId,
      action: 'MAP_UPDATE',
      description: `Updated details for map: ${map.name} (ID: ${id})`,
    });

    return map;
  }

  async deleteMap(id: string, userId: string) {
    const map = await this.mapRepository.delete(id);
    if (!map) {
      throw new ApiError(404, 'Map not found');
    }

    await auditService.log({
      userId,
      action: 'MAP_DELETE',
      description: `Deleted map: ${map.name} (ID: ${id})`,
    });

    return map;
  }
}

export const mapService = new MapService();
export default mapService;
