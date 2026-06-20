import { BaseRepository } from './base.repository';
import { IMarker } from '../types';
import Marker from '../models/Marker';

export class MarkerRepository extends BaseRepository<IMarker> {
  constructor() {
    super(Marker);
  }
}

export default MarkerRepository;
