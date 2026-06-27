import RouteRepository from '../repositories/route.repository';
import ApiError from '../utils/apiError';
import auditService from './audit.service';

export class RouteService {
  private routeRepository: RouteRepository;

  constructor() {
    this.routeRepository = new RouteRepository();
  }

  async createRoute(data: any, userId: string) {
    const route = await this.routeRepository.create({
      ...data,
      createdBy: userId,
    });

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

  async updateRoute(id: string, updates: any, user: { userId: string; role: string }) {
    const route = await this.routeRepository.findById(id);
    if (!route) {
      throw new ApiError(404, 'Route path not found');
    }

    // Ownership check: must be creator or admin
    if (route.createdBy.toString() !== user.userId && user.role !== 'ADMIN') {
      throw new ApiError(403, 'Forbidden: You do not own this route.');
    }

    const updated = await this.routeRepository.update(id, updates);

    await auditService.log({
      userId: user.userId,
      action: 'ROUTE_UPDATE',
      description: `Updated route: ${updated?.name} (ID: ${id})`,
    });

    return updated;
  }

  async deleteRoute(id: string, user: { userId: string; role: string }) {
    const route = await this.routeRepository.findById(id);
    if (!route) {
      throw new ApiError(404, 'Route path not found');
    }

    // Ownership check: must be creator or admin
    if (route.createdBy.toString() !== user.userId && user.role !== 'ADMIN') {
      throw new ApiError(403, 'Forbidden: You do not own this route.');
    }

    await this.routeRepository.delete(id);

    await auditService.log({
      userId: user.userId,
      action: 'ROUTE_DELETE',
      description: `Deleted route path: ${route.name} (ID: ${id})`,
    });

    return route;
  }
}

export const routeService = new RouteService();
export default routeService;
