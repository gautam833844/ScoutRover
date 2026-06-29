import { WebSocketServer, WebSocket } from 'ws';

const PORT = 9090;
const wss = new WebSocketServer({ port: PORT });

console.log(`\n🤖 [Mock ROS Bridge] Running at ws://localhost:${PORT}`);
console.log(`🚀 Ready to accept connections from Atlas dashboard!`);

// Generate a mock occupancy grid map
const width = 64;
const height = 64;
const resolution = 0.05;
const gridData = new Int8Array(width * height);

// Build map borders and some room walls
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const isBorder = x === 0 || y === 0 || x === width - 1 || y === height - 1;
    const isWall1 = y === 20 && x > 10 && x < 50;
    const isWall2 = x === 30 && y > 30 && y < 55;
    const isObstacle = (x === 15 && y === 15) || (x === 45 && y === 40) || (x === 20 && y === 45);

    if (isBorder || isWall1 || isWall2 || isObstacle) {
      gridData[y * width + x] = 100; // Obstacle / Wall
    } else if (Math.random() < 0.01) {
      gridData[y * width + x] = -1; // Random unknown cell noise
    } else {
      gridData[y * width + x] = 0; // Free navigable path
    }
  }
}

// Simulated Rover Telemetry state
let posX = 0.0;
let posY = 0.0;
let theta = 0.0; // Heading in radians
let linearVel = 0.0;
let angularVel = 0.0;
let lastCmdTime = 0;

// Central Physics Simulation Update (100ms interval)
setInterval(() => {
  const now = Date.now();
  const dt = 0.1; // seconds

  // Decelerate naturally to stop if no active cmd_vel messages are received within 300ms
  if (now - lastCmdTime > 350) {
    linearVel = linearVel * 0.5;
    angularVel = angularVel * 0.5;
    if (Math.abs(linearVel) < 0.01) linearVel = 0;
    if (Math.abs(angularVel) < 0.01) angularVel = 0;
  }

  // Update Pose (simple 2D differential drive kinematics)
  posX += linearVel * Math.cos(theta) * dt;
  posY += linearVel * Math.sin(theta) * dt;
  theta += angularVel * dt;

  // Normalize theta to [-PI, PI]
  if (theta > Math.PI) theta -= 2 * Math.PI;
  if (theta < -Math.PI) theta += 2 * Math.PI;
}, 100);

// Client management
wss.on('connection', (ws: WebSocket) => {
  console.log(`🔌 [Mock ROS Bridge] Client connected!`);
  
  // Track subscriptions
  const subscriptions = new Set<string>();
  
  ws.on('message', (message: string) => {
    try {
      const msg = JSON.parse(message);
      
      // Handle ROS Bridge protocol commands
      if (msg.op === 'subscribe') {
        console.log(`📥 Subscribed to topic: ${msg.topic}`);
        subscriptions.add(msg.topic);
      } else if (msg.op === 'unsubscribe') {
        console.log(`📤 Unsubscribed from topic: ${msg.topic}`);
        subscriptions.delete(msg.topic);
      } else if (msg.op === 'publish') {
        if (msg.topic === '/cmd_vel') {
          linearVel = msg.msg.linear?.x || 0;
          angularVel = msg.msg.angular?.z || 0;
          lastCmdTime = Date.now();
          
          let arrow = '⏹️  STOP';
          if (linearVel > 0) arrow = '🔼 DRIVE FORWARD';
          else if (linearVel < 0) arrow = '🔽 DRIVE BACKWARD';
          else if (angularVel > 0) arrow = '◀️ TURN LEFT';
          else if (angularVel < 0) arrow = '▶️ TURN RIGHT';
          
          console.log(`🎮 [Rover Drive] Command Received: ${arrow} (Linear: ${linearVel.toFixed(2)} m/s, Angular: ${angularVel.toFixed(2)} rad/s)`);
        }
      }
    } catch (err) {
      console.error('Error parsing WebSocket message:', err);
    }
  });

  // Periodically send occupancy grid map to subscribers (every 2 seconds)
  const mapInterval = setInterval(() => {
    if (!subscriptions.has('/map')) return;
    
    // Add small random noise to simulated map updates to make the canvas look active
    const mapDataCopy = new Int8Array(gridData);
    for (let i = 0; i < 5; i++) {
      const rx = Math.floor(Math.random() * width);
      const ry = Math.floor(Math.random() * height);
      if (mapDataCopy[ry * width + rx] === 0) {
        mapDataCopy[ry * width + rx] = 100; // temporary obstacle
      }
    }

    const mapMessage = {
      op: 'publish',
      topic: '/map',
      msg: {
        info: {
          map_load_time: { secs: 0, nsecs: 0 },
          resolution,
          width,
          height,
          origin: {
            position: { x: -width * resolution / 2, y: -height * resolution / 2, z: 0 },
            orientation: { x: 0, y: 0, z: 0, w: 1 }
          }
        },
        data: Array.from(mapDataCopy)
      }
    };

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(mapMessage));
    }
  }, 2000);

  // Periodically publish simulated Odometry telemetry back to subscribers (every 100ms)
  const odomInterval = setInterval(() => {
    if (!subscriptions.has('/odom')) return;

    // Convert yaw angle theta to standard quaternion z, w
    const qz = Math.sin(theta / 2);
    const qw = Math.cos(theta / 2);

    const odomMessage = {
      op: 'publish',
      topic: '/odom',
      msg: {
        header: {
          seq: 0,
          stamp: { secs: Math.floor(Date.now() / 1000), nsecs: (Date.now() % 1000) * 1000000 },
          frame_id: 'odom'
        },
        child_frame_id: 'base_link',
        pose: {
          pose: {
            position: { x: posX, y: posY, z: 0 },
            orientation: { x: 0, y: 0, z: qz, w: qw }
          }
        },
        twist: {
          twist: {
            linear: { x: linearVel, y: 0, z: 0 },
            angular: { x: 0, y: 0, z: angularVel }
          }
        }
      }
    };

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(odomMessage));
    }
  }, 100);

  ws.on('close', () => {
    console.log(`🔌 [Mock ROS Bridge] Client disconnected.`);
    clearInterval(mapInterval);
    clearInterval(odomInterval);
  });
});
