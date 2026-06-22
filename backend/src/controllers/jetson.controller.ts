import { Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import Map from '../models/Map';
import auditService from '../services/audit.service';
import ApiResponse from '../utils/apiResponse';
import ApiError from '../utils/apiError';
import { RequestWithUser } from '../types';

export const exportMapToJetson = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const { mapId, exportPath } = req.body;
    if (!mapId) {
      throw new ApiError(400, 'Map ID is required');
    }

    const map = await Map.findById(mapId);
    if (!map) {
      throw new ApiError(404, 'Map not found');
    }

    // Determine target directory: request body override -> env variable -> default local fallback
    let targetDir = exportPath || process.env.JETSON_MAPS_PATH;
    if (!targetDir) {
      // Create exports directory inside backend if not configured
      targetDir = path.join(process.cwd(), 'exports', 'maps');
    }

    // Create directory recursively if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Clean name for filename
    const slug = map.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_+|_+$)/g, '');
    const yamlFilename = `${slug}.yaml`;
    const pgmFilename = `${slug}.pgm`;

    const yamlFilePath = path.join(targetDir, yamlFilename);
    const pgmFilePath = path.join(targetDir, pgmFilename);

    // 1. Build ROS-compatible YAML content
    const yamlContent = [
      `image: ${pgmFilename}`,
      `resolution: ${map.resolution}`,
      `origin: [${map.originX}, ${map.originY}, 0.0]`,
      `negate: 0`,
      `occupied_thresh: 0.65`,
      `free_thresh: 0.196`,
    ].join('\n');

    // 2. Build ROS-compatible ASCII PGM P2 content
    let gridArray: number[] = [];
    try {
      gridArray = JSON.parse(map.gridData);
    } catch (e) {
      throw new ApiError(500, 'Failed to parse map grid data');
    }

    const w = map.width || 20;
    const h = map.height || 20;
    const size = w * h;

    // Fill array or truncate to fit width * height
    const pixels = Array(size).fill(205); // Default to unknown (205)
    for (let i = 0; i < Math.min(gridArray.length, size); i++) {
      const v = gridArray[i];
      if (v === -1) {
        pixels[i] = 205; // unknown -> grey
      } else if (v === 0) {
        pixels[i] = 254; // free -> white
      } else {
        pixels[i] = 0; // occupied -> black
      }
    }

    // Construct PGM P2 text
    const header = `P2\n# ScoutRover Map: ${map.name}\n${w} ${h}\n255\n`;
    const rows: string[] = [];
    for (let y = 0; y < h; y++) {
      rows.push(pixels.slice(y * w, (y + 1) * w).join(' '));
    }
    const pgmContent = header + rows.join('\n') + '\n';

    // 3. Write files to the target directory
    fs.writeFileSync(yamlFilePath, yamlContent, 'utf8');
    fs.writeFileSync(pgmFilePath, pgmContent, 'utf8');

    // Log this action to telemetry audit logs
    await auditService.log({
      userId,
      action: 'JETSON_EXPORT',
      description: `Exported map "${map.name}" to Jetson filesystem at ${targetDir} (${yamlFilename}, ${pgmFilename})`,
    });

    res.status(200).json(
      new ApiResponse(
        200,
        {
          targetDirectory: targetDir,
          yamlFile: yamlFilename,
          pgmFile: pgmFilename,
          yamlPath: yamlFilePath,
          pgmPath: pgmFilePath,
        },
        `Successfully exported map files to Jetson at ${targetDir}`
      )
    );
  } catch (error) {
    next(error);
  }
};
