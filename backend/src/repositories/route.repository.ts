import { BaseRepository } from './base.repository';
import { IRoute } from '../types';
import Route from '../models/Route';

export class RouteRepository extends BaseRepository<IRoute> {
  constructor() {
    super(Route);
  }
}

export default RouteRepository;
