import { BaseRepository } from './base.repository';
import { IMap } from '../types';
import Map from '../models/Map';

export class MapRepository extends BaseRepository<IMap> {
  constructor() {
    super(Map);
  }
}

export default MapRepository;
