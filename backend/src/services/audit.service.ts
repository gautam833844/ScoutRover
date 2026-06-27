import AuditRepository from '../repositories/audit.repository';
import AuditLog from '../models/AuditLog';
import logger from '../utils/logger';

class AuditService {
  private auditRepository: AuditRepository;

  constructor() {
    this.auditRepository = new AuditRepository();
  }

  async log(options: {
    userId?: string | null;
    action: string;
    description: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await AuditLog.create({
        userId: options.userId || null,
        action: options.action,
        description: options.description,
        ipAddress: options.ipAddress || '',
        userAgent: options.userAgent || '',
      });
      logger.info(
        `📝 Audit Trail - Action: ${options.action} - Desc: ${options.description} (Actor: ${
          options.userId || 'Guest/System'
        })`
      );
    } catch (error) {
      logger.error('❌ Failed to write audit log to database:', error);
    }
  }

  async listLogs(options: any) {
    const searchFields = ['action', 'description'];
    return this.auditRepository.findWithPagination({
      ...options,
      searchFields,
      populate: ['userId'],
    });
  }
}

export const auditService = new AuditService();
export default auditService;
