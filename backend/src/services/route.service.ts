import RouteRepository from '../repositories/route.repository';
import ApiError from '../utils/apiError';
import auditService from './audit.service';

export class RouteService {
  private routeRepository: RouteRepository;

  constructor() {
    this.routeRepository = new RouteRepository();
  }

  async createRoute(data: any, userId: string) {
    const route = await this.routeRepository.create(data);

    await auditService.log({
      userId,
      action: 'ROUTE_CREATE',
      description: `Created route path: ${route.name} (Distance: ${route.distance.toFixed(1)}m, Waypoints: ${route.points.length}) on Map ID: ${route.mapId}`,
    });

    return route;
  }

  async listRoutes(options: any) {
    const searchFields = ['name'];
    return this.routeRepository.findWithPagination({
      ...options,
      searchFields,
    });
  }

  async getRoutesByMap(mapId: string) {
    return this.routeRepository.findMany({ mapId });
  }

  async getRouteById(id: string) {
    const route = await this.routeRepository.findById(id);
    if (!route) {
      throw new ApiError(404, 'Route path not found');
    }
    return route;
  }

  async updateRoute(id: string, updates: any, userId: string) {
    const route = await this.routeRepository.update(id, updates);
    if (!route) {
      throw new ApiError(404, 'Route path not found');
    }

    await auditService.log({
      userId,
      action: 'ROUTE_UPDATE',
      description: `Updated route: ${route.name} (ID: ${id})`,
    });

    return route;
  }

  async deleteRoute(id: string, userId: string) {
    const route = await this.routeRepository.delete(id);
    if (!route) {
      throw new ApiError(404, 'Route path not found');
    }

    await auditService.log({
      userId,
      action: 'ROUTE_DELETE',
      description: `Deleted route path: ${route.name} (ID: ${id})`,
    });

    return route;
  }
}

export const routeService = new RouteService();
export default routeService;
