import MapRepository from '../repositories/map.repository';
import ApiError from '../utils/apiError';
import auditService from './audit.service';
import { Marker } from '../models/Marker';
import { Route } from '../models/Route';

export class MapService {
  private mapRepository: MapRepository;

  constructor() {
    this.mapRepository = new MapRepository();
  }

  private formatMap(map: any) {
    if (!map) return null;
    const mapObj = map.toObject ? map.toObject() : map;
    return {
      ...mapObj,
      id: mapObj._id || mapObj.id,
      gridData: mapObj.gridData && Buffer.isBuffer(mapObj.gridData)
        ? mapObj.gridData.toString('base64')
        : mapObj.gridData,
    };
  }

  async createMap(data: any, userId: string) {
    let gridBuffer: Buffer;
    const rawGrid = data.gridData;

    if (typeof rawGrid === 'string') {
      if (rawGrid.startsWith('[')) {
        try {
          const parsed = JSON.parse(rawGrid);
          gridBuffer = Buffer.from(parsed);
        } catch (e) {
          throw new ApiError(400, 'Invalid JSON array format for gridData.');
        }
      } else {
        gridBuffer = Buffer.from(rawGrid, 'base64');
      }
    } else if (Array.isArray(rawGrid)) {
      gridBuffer = Buffer.from(rawGrid);
    } else if (Buffer.isBuffer(rawGrid)) {
      gridBuffer = rawGrid;
    } else {
      throw new ApiError(400, 'Invalid gridData format. Expected base64 string, JSON array, or Buffer.');
    }

    const map = await this.mapRepository.create({
      ...data,
      gridData: gridBuffer,
      createdBy: userId,
    });

    await auditService.log({
      userId,
      action: 'MAP_CREATE',
      description: `Successfully saved map scan: ${map.name} (${map.width}x${map.height})`,
    });

    return this.formatMap(map);
  }

  async listMaps(options: any) {
    const searchFields = ['name'];
    const result = await this.mapRepository.findWithPagination({
      ...options,
      searchFields,
      populate: ['createdBy'],
      select: '-gridData', // Project away large gridData (C3 Split list/detail API)
    });

    return {
      ...result,
      docs: result.docs.map(m => this.formatMap(m)),
    };
  }

  async getMapById(id: string) {
    const map = await this.mapRepository.findById(id, ['createdBy']);
    if (!map) {
      throw new ApiError(404, 'Map not found');
    }
    return this.formatMap(map);
  }

  async updateMap(id: string, updates: any, userId: string) {
    // Fetch document first to trigger Mongoose optimistic concurrency save validations
    const map = await this.mapRepository.findById(id);
    if (!map) {
      throw new ApiError(404, 'Map not found');
    }

    // Apply updates
    if (updates.name !== undefined) {
      map.name = updates.name;
    }

    // Triggers Mongoose built-in optimisticConcurrency version check on save
    await map.save();

    await auditService.log({
      userId,
      action: 'MAP_UPDATE',
      description: `Updated details for map: ${map.name} (ID: ${id})`,
    });

    return this.formatMap(map);
  }

  async deleteMap(id: string, userId: string) {
    const map = await this.mapRepository.delete(id);
    if (!map) {
      throw new ApiError(404, 'Map not found');
    }

    // Cascade delete associated markers and routes
    await Marker.deleteMany({ mapId: id });
    await Route.deleteMany({ mapId: id });

    await auditService.log({
      userId,
      action: 'MAP_DELETE',
      description: `Deleted map: ${map.name} (ID: ${id})`,
    });

    return this.formatMap(map);
  }
}

export const mapService = new MapService();
export default mapService;
