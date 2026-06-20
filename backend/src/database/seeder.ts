import { connectDB, disconnectDB } from './connection';
import User from '../models/User';
import Map from '../models/Map';
import Marker from '../models/Marker';
import Route from '../models/Route';
import AuditLog from '../models/AuditLog';
import logger from '../utils/logger';

export const seedDatabase = async () => {
  try {
    await connectDB();

    logger.info('🧹 Cleaning existing database collections...');
    await User.deleteMany({});
    await Map.deleteMany({});
    await Marker.deleteMany({});
    await Route.deleteMany({});
    await AuditLog.deleteMany({});

    logger.info('👤 Seeding default users...');
    
    // Seed Administrator
    const admin = await User.create({
      email: 'admin@scoutrover.local',
      password: 'AdminPassword123!',
      role: 'ADMIN',
      firstName: 'System',
      lastName: 'Admin',
      avatar: '',
    });
    logger.info('  - Seeded Admin: admin@scoutrover.local / AdminPassword123!');

    // Seed Operator
    const operator = await User.create({
      email: 'operator@scoutrover.local',
      password: 'OperatorPassword123!',
      role: 'OPERATOR',
      firstName: 'Rover',
      lastName: 'Operator',
      avatar: '',
    });
    logger.info('  - Seeded Operator: operator@scoutrover.local / OperatorPassword123!');

    // Seed Viewer
    const viewer = await User.create({
      email: 'viewer@scoutrover.local',
      password: 'ViewerPassword123!',
      role: 'VIEWER',
      firstName: 'Guest',
      lastName: 'Observer',
      avatar: '',
    });
    logger.info('  - Seeded Viewer: viewer@scoutrover.local / ViewerPassword123!');

    logger.info('🗺️ Seeding sample maps...');
    
    // Mock occupancy grid data (20x20 grid array: 0 for free space, 100 for obstacle, -1 for unknown)
    const gridArr = Array(400).fill(0);
    // Add border walls
    for (let i = 0; i < 20; i++) {
      gridArr[i] = 100; // Top wall
      gridArr[380 + i] = 100; // Bottom wall
      gridArr[i * 20] = 100; // Left wall
      gridArr[i * 20 + 19] = 100; // Right wall
    }
    // Add central obstacle
    gridArr[210] = 100;
    gridArr[211] = 100;
    gridArr[230] = 100;
    gridArr[231] = 100;

    const sampleMap = await Map.create({
      name: 'Default Research Lab Map',
      width: 20,
      height: 20,
      resolution: 0.05,
      originX: -0.5,
      originY: -0.5,
      gridData: JSON.stringify(gridArr),
      createdBy: operator.id,
    });

    logger.info('📍 Seeding sample markers...');
    
    const marker1 = await Marker.create({
      mapId: sampleMap.id,
      title: 'Base Docking Station',
      description: 'Primary inductive charging pad and home coordinates',
      lat: 20.5937,
      lng: 78.9629,
      color: '#10b981', // emerald
    });

    const marker2 = await Marker.create({
      mapId: sampleMap.id,
      title: 'Lidar Calibration Target Alpha',
      description: 'High reflectivity calibration target reference',
      lat: 20.5945,
      lng: 78.9638,
      color: '#3b82f6', // blue
    });

    logger.info('🛣️ Seeding sample route paths...');
    
    await Route.create({
      mapId: sampleMap.id,
      name: 'Standard Perimeter Patrol',
      points: [
        { lat: 20.5937, lng: 78.9629 },
        { lat: 20.5937, lng: 78.9638 },
        { lat: 20.5945, lng: 78.9638 },
        { lat: 20.5945, lng: 78.9629 },
        { lat: 20.5937, lng: 78.9629 },
      ],
      distance: 380.2, // meters
      color: '#7c3aed', // purple
    });

    logger.info('📝 Seeding audit trail logs...');
    
    await AuditLog.create({
      userId: admin.id,
      action: 'SYSTEM_INIT',
      description: 'Successfully initialized system and seeded baseline users and resources.',
      ipAddress: '127.0.0.1',
      userAgent: 'ScoutRover Seeder Script',
    });

    logger.info('🌱 Database seeding completed successfully.');
  } catch (error) {
    logger.error('❌ Failed to seed database:', error);
    throw error;
  } finally {
    await disconnectDB();
  }
};

// Check if file is run directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
