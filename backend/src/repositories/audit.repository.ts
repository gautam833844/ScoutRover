import { BaseRepository } from './base.repository';
import { IAuditLog } from '../types';
import AuditLog from '../models/AuditLog';

export class AuditRepository extends BaseRepository<IAuditLog> {
  constructor() {
    super(AuditLog);
  }
}

export default AuditRepository;
