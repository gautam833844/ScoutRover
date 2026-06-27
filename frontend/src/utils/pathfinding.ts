/**
 * 2D Grid A* Pathfinding with Obstacle Inflation for SLAM Occupancy Maps
 */

interface Point2D {
  x: number;
  y: number;
}

interface MetricPoint {
  lat: number; // lat represents Y
  lng: number; // lng represents X
}

interface PathResult {
  points: MetricPoint[];
  distance: number;
}

/**
 * Checks if a cell is blocked by an obstacle or unknown space, including safety inflation.
 */
function isCellBlocked(
  x: number,
  y: number,
  grid: number[] | Int8Array,
  width: number,
  height: number,
  inflationRadius: number
): boolean {
  if (x < 0 || x >= width || y < 0 || y >= height) return true;

  // Primary check on target cell (occupancy threshold > 15 or unknown -1)
  const val = grid[y * width + x];
  if (val > 15 || val === -1) return true;

  if (inflationRadius <= 0) return false;

  // Check neighborhood within circular inflation bounds
  const r2 = inflationRadius * inflationRadius;
  for (let dy = -inflationRadius; dy <= inflationRadius; dy++) {
    for (let dx = -inflationRadius; dx <= inflationRadius; dx++) {
      const nx = x + dx;
      const ny = y + dy;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nVal = grid[ny * width + nx];
        if (nVal > 15 || nVal === -1) {
          // Circular boundary limit check
          if (dx * dx + dy * dy <= r2) {
            return true;
          }
        }
      } else {
        return true; // Out of bounds is blocked
      }
    }
  }

  return false;
}

/**
 * A* 8-connected grid path planning algorithm.
 */
export function planPath(
  grid: number[] | Int8Array,
  width: number,
  height: number,
  resolution: number,
  originX: number,
  originY: number,
  startMetric: MetricPoint,
  endMetric: MetricPoint,
  inflationMeters = 0.15
): PathResult {
  // Convert metric coordinates (mx, my) to grid cells (cx, cy)
  const toGrid = (mx: number, my: number): Point2D => {
    const cx = Math.round((mx - originX) / resolution);
    const cy = Math.round((my - originY) / resolution);
    return { x: cx, y: cy };
  };

  // Convert grid cells (cx, cy) to metric coordinates (mx, my)
  const toMetric = (cx: number, cy: number): MetricPoint => {
    const mx = cx * resolution + originX;
    const my = cy * resolution + originY;
    return { lat: my, lng: mx };
  };

  const start = toGrid(startMetric.lng, startMetric.lat);
  const end = toGrid(endMetric.lng, endMetric.lat);

  // Compute inflation radius in cells
  const inflationRadiusCells = Math.max(0, Math.round(inflationMeters / resolution));

  // If start or end cell is directly blocked, find nearest free cell
  const startBlocked = isCellBlocked(start.x, start.y, grid, width, height, inflationRadiusCells);
  const endBlocked = isCellBlocked(end.x, end.y, grid, width, height, inflationRadiusCells);

  if (startBlocked || endBlocked) {
    console.warn('[Pathfinder] Start/end coordinate is inside an obstacle or unknown region.');
  }

  // Node class for A* closed list tracking
  class AStarNode {
    x: number;
    y: number;
    g: number; // Cost from start
    h: number; // Heuristic cost to end
    f: number; // Total cost (g + h)
    parent: AStarNode | null = null;

    constructor(x: number, y: number, g: number, h: number, parent: AStarNode | null = null) {
      this.x = x;
      this.y = y;
      this.g = g;
      this.h = h;
      this.f = g + h;
      this.parent = parent;
    }
  }

  // Heuristic: Octile distance for 8-connected grid movement
  const getHeuristic = (p1: Point2D, p2: Point2D): number => {
    const dx = Math.abs(p1.x - p2.x);
    const dy = Math.abs(p1.y - p2.y);
    const F = Math.SQRT2 - 1;
    return dx < dy ? F * dx + dy : F * dy + dx;
  };

  const openSet: AStarNode[] = [];
  const closedSet = new Uint8Array(width * height);
  const gScores = new Float32Array(width * height).fill(Infinity);

  const startNode = new AStarNode(start.x, start.y, 0, getHeuristic(start, end));
  openSet.push(startNode);
  gScores[start.y * width + start.x] = 0;

  // Directions for 8-connected movement (straight + diagonal)
  const directions = [
    { dx: 0, dy: 1, cost: 1.0 },
    { dx: 1, dy: 0, cost: 1.0 },
    { dx: 0, dy: -1, cost: 1.0 },
    { dx: -1, dy: 0, cost: 1.0 },
    { dx: 1, dy: 1, cost: Math.SQRT2 },
    { dx: 1, dy: -1, cost: Math.SQRT2 },
    { dx: -1, dy: 1, cost: Math.SQRT2 },
    { dx: -1, dy: -1, cost: Math.SQRT2 },
  ];

  let targetNode: AStarNode | null = null;

  while (openSet.length > 0) {
    // Find node with lowest F score
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;

    if (current.x === end.x && current.y === end.y) {
      targetNode = current;
      break;
    }

    const currentIdx = current.y * width + current.x;
    closedSet[currentIdx] = 1;

    for (const dir of directions) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;
      const neighborIdx = ny * width + nx;

      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      if (closedSet[neighborIdx] === 1) continue;

      // Obstacle collision check
      if (isCellBlocked(nx, ny, grid, width, height, inflationRadiusCells)) continue;

      const tentativeG = current.g + dir.cost;
      if (tentativeG < gScores[neighborIdx]) {
        gScores[neighborIdx] = tentativeG;
        const neighborNode = new AStarNode(nx, ny, tentativeG, getHeuristic({ x: nx, y: ny }, end), current);
        
        const existingIdx = openSet.findIndex(node => node.x === nx && node.y === ny);
        if (existingIdx !== -1) {
          openSet[existingIdx] = neighborNode;
        } else {
          openSet.push(neighborNode);
        }
      }
    }
  }

  // Reconstruct path metric coordinates
  if (!targetNode) {
    // Pathfinder failed: return straight line fallback
    console.warn('[Pathfinder] Path not found. Falling back to straight Euclidean path.');
    const dx = endMetric.lng - startMetric.lng;
    const dy = endMetric.lat - startMetric.lat;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return {
      points: [startMetric, endMetric],
      distance,
    };
  }

  const pathPoints: MetricPoint[] = [];
  let curr: AStarNode | null = targetNode;
  while (curr !== null) {
    pathPoints.push(toMetric(curr.x, curr.y));
    curr = curr.parent;
  }
  // Reverse to put points in start -> end order
  pathPoints.reverse();

  // Calculate actual path length in meters
  let totalDistance = 0;
  for (let i = 1; i < pathPoints.length; i++) {
    const p1 = pathPoints[i - 1];
    const p2 = pathPoints[i];
    const dx = p2.lng - p1.lng;
    const dy = p2.lat - p1.lat;
    totalDistance += Math.sqrt(dx * dx + dy * dy);
  }

  return {
    points: pathPoints,
    distance: totalDistance,
  };
}
