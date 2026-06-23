// Global state management
var ros = null;
var cmdVelTopic = null;
var mapTopic = null;
var slamModeTopic = null;
var sysCommandTopic = null;

var connectionRetryInterval = null;
var connectionTimeoutId = null;
var connectionState = "disconnected"; // disconnected, connecting, connected

var cmdIntervalId = null;
var currentDirection = null;
var saveMapTimeoutId = null;
var lastMapUpdateTime = null;

var isSimMode = false;
var simIntervalId = null;

// Simulator state variables
var simX = 25;
var simY = 25;
var simTheta = 0; // heading angle in radians
var simMapData = [];
var simMapWidth = 100;
var simMapHeight = 100;

// Configured Jetson IP address
const jetsonIp = "192.168.137.85";
const rosbridgeUrl = `ws://${jetsonIp}:9090`;

// Setup event listeners on window load
window.addEventListener("load", function () {
  initApp();
});

// Initialize dashboard logic
function initApp() {
  setupKeyboardListeners();
  
  // Clean session check to bypass login if already authenticated
  if (sessionStorage.getItem("rover_auth") === "true") {
    hideLoginOverlay();
    attemptRosConnect();
  }
}

/* ==========================================================================
   AUTHENTICATION & LOGIN
   ========================================================================== */

function handleLogin(event) {
  event.preventDefault();
  
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value;
  const errorElement = document.getElementById("login-error");

  // Validate credentials: admin/password or admin/admin
  if ((user === "admin" && pass === "password") || (user === "admin" && pass === "admin")) {
    sessionStorage.setItem("rover_auth", "true");
    hideLoginOverlay();
    errorElement.style.display = "none";
    attemptRosConnect();
  } else {
    errorElement.style.display = "block";
    errorElement.textContent = "Invalid Operator ID or Access Key.";
  }
}

function bypassLogin() {
  sessionStorage.setItem("rover_auth", "true");
  hideLoginOverlay();
  startSimulatorMode();
}

function hideLoginOverlay() {
  document.getElementById("login-overlay").classList.add("hidden");
  document.getElementById("dashboard").classList.remove("hidden");
}

/* ==========================================================================
   ROS CONNECTION LOGIC
   ========================================================================== */

function attemptRosConnect() {
  if (connectionState === "connected" || isSimMode) return;

  updateConnectionState("connecting");

  // Set timeout for connection failure
  connectionTimeoutId = setTimeout(function () {
    if (connectionState === "connecting") {
      console.log("ROS connection timed out.");
      updateConnectionState("disconnected");
      scheduleRetry();
    }
  }, 6000);

  try {
    ros = new ROSLIB.Ros({ url: rosbridgeUrl });

    ros.on("connection", function () {
      console.log("Connected to ROS core.");
      clearTimeout(connectionTimeoutId);
      if (connectionRetryInterval) {
        clearInterval(connectionRetryInterval);
        connectionRetryInterval = null;
      }
      updateConnectionState("connected");
      setupTopics();
    });

    ros.on("error", function (error) {
      console.error("ROS Connection Error:", error);
      clearTimeout(connectionTimeoutId);
      updateConnectionState("disconnected");
      scheduleRetry();
    });

    ros.on("close", function () {
      console.log("ROS connection closed.");
      clearTimeout(connectionTimeoutId);
      updateConnectionState("disconnected");
      scheduleRetry();
    });
  } catch (error) {
    console.error("Error creating ROSLIB instance:", error);
    clearTimeout(connectionTimeoutId);
    updateConnectionState("disconnected");
    scheduleRetry();
  }
}

function updateConnectionState(state) {
  connectionState = state;
  
  const headerDot = document.getElementById("header-connection-dot");
  const telemetryDot = document.getElementById("status-indicator");
  const telemetryText = document.getElementById("status-display-text");
  const connScreen = document.getElementById("connection-screen");
  
  headerDot.className = "connection-dot";
  telemetryDot.className = "status-indicator";

  if (state === "connected") {
    headerDot.classList.add("connected");
    telemetryDot.classList.add("connected");
    telemetryText.textContent = "Core Link: Connected";
    connScreen.classList.add("hidden");
  } else if (state === "connecting") {
    headerDot.classList.add("connecting");
    telemetryDot.classList.add("connecting");
    telemetryText.textContent = "Core Link: Connecting...";
    connScreen.classList.remove("hidden");
  } else {
    // Disconnected
    telemetryText.textContent = "Core Link: Disconnected";
    connScreen.classList.remove("hidden");
  }
}

function scheduleRetry() {
  if (connectionRetryInterval || isSimMode) return;
  
  connectionRetryInterval = setInterval(function () {
    if (connectionState === "disconnected") {
      attemptRosConnect();
    }
  }, 4000);
}

function skipToTestDashboard() {
  if (connectionRetryInterval) {
    clearInterval(connectionRetryInterval);
    connectionRetryInterval = null;
  }
  startSimulatorMode();
}

/* ==========================================================================
   ROS TOPIC SETUP
   ========================================================================== */

function setupTopics() {
  if (!ros) return;

  // Command Velocity Publisher
  cmdVelTopic = new ROSLIB.Topic({
    ros: ros,
    name: "/cmd_vel",
    messageType: "geometry_msgs/Twist"
  });

  // Map Subscriber
  mapTopic = new ROSLIB.Topic({
    ros: ros,
    name: "/map",
    messageType: "nav_msgs/OccupancyGrid",
    throttle_rate: 3000,
    queue_length: 1
  });

  mapTopic.subscribe(function (message) {
    if (isSimMode) return; // Ignore real topics if simulator is running
    
    // Process and draw map
    if (message && message.info && message.data) {
      drawMap(message);
    }
  });

  // SLAM Mode Publisher
  slamModeTopic = new ROSLIB.Topic({
    ros: ros,
    name: "/slam_mode",
    messageType: "std_msgs/String"
  });

  // System command topic for savemap command
  sysCommandTopic = new ROSLIB.Topic({
    ros: ros,
    name: "/syscommand",
    messageType: "std_msgs/String"
  });

  console.log("ROS Topics successfully subscribed/advertised.");
}

/* ==========================================================================
   MOVEMENT CONTROLS (CMD_VEL)
   ========================================================================== */

function sendCmd(direction) {
  if (isSimMode) {
    // Drive the simulated robot
    updateSimPosition(direction);
    return;
  }

  if (!cmdVelTopic || connectionState !== "connected") {
    console.warn("Cannot command vehicle: ROS is offline.");
    return;
  }

  try {
    let twist = new ROSLIB.Message({
      linear: { x: 0.0, y: 0.0, z: 0.0 },
      angular: { x: 0.0, y: 0.0, z: 0.0 }
    });

    if (direction === "forward") twist.linear.x = 0.45;
    else if (direction === "backward") twist.linear.x = -0.45;
    else if (direction === "left") twist.angular.z = 0.6;
    else if (direction === "right") twist.angular.z = -0.6;

    cmdVelTopic.publish(twist);
  } catch (error) {
    console.error("Error publishing cmd_vel:", error);
  }
}

function startCmd(direction) {
  if (cmdIntervalId) clearInterval(cmdIntervalId);

  currentDirection = direction;
  sendCmd(direction);
  
  // Highlight UI button
  highlightButton(direction, true);

  // Publish message periodically while held down
  cmdIntervalId = setInterval(function () {
    sendCmd(direction);
  }, 100);
}

function stopRover() {
  if (cmdIntervalId) {
    clearInterval(cmdIntervalId);
    cmdIntervalId = null;
  }

  if (currentDirection) {
    highlightButton(currentDirection, false);
    currentDirection = null;
  }

  if (isSimMode) return;

  if (cmdVelTopic && connectionState === "connected") {
    try {
      let stopTwist = new ROSLIB.Message({
        linear: { x: 0.0, y: 0.0, z: 0.0 },
        angular: { x: 0.0, y: 0.0, z: 0.0 }
      });
      cmdVelTopic.publish(stopTwist);
    } catch (e) {
      console.error(e);
    }
  }
}

function highlightButton(direction, active) {
  const btnMap = {
    forward: "btn-forward",
    backward: "btn-backward",
    left: "btn-left",
    right: "btn-right"
  };
  const btnId = btnMap[direction];
  if (btnId) {
    const btn = document.getElementById(btnId);
    if (btn) {
      if (active) btn.style.background = "var(--accent-orange-glow)";
      else btn.style.background = "";
    }
  }
}

/* ==========================================================================
   KEYBOARD INPUT LISTENERS
   ========================================================================== */

var activeKeys = {};

function setupKeyboardListeners() {
  window.addEventListener("keydown", function (e) {
    // Ignore keypresses if user is typing in the login fields
    if (document.activeElement.tagName === "INPUT") return;

    let dir = null;
    if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") dir = "forward";
    else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") dir = "backward";
    else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") dir = "left";
    else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") dir = "right";

    if (dir && !activeKeys[dir]) {
      e.preventDefault();
      activeKeys[dir] = true;
      startCmd(dir);
    }
  });

  window.addEventListener("keyup", function (e) {
    let dir = null;
    if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") dir = "forward";
    else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") dir = "backward";
    else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") dir = "left";
    else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") dir = "right";

    if (dir) {
      activeKeys[dir] = false;
      if (currentDirection === dir) {
        stopRover();
      }
    }
  });
}

/* ==========================================================================
   SLAM MODE SWITCH
   ========================================================================== */

function toggleSlamMode(checkbox) {
  const isKarto = checkbox.checked;
  const activeSlam = isKarto ? "KARTO" : "HECTOR";
  
  // Highlight label elements
  document.getElementById("hector-label").classList.toggle("active", !isKarto);
  document.getElementById("karto-label").classList.toggle("active", isKarto);
  
  // Update chassis telemetry labels
  document.getElementById("telemetry-slam").textContent = activeSlam;

  if (isSimMode) {
    // Virtual switch response
    console.log("Simulated SLAM mode swapped to:", activeSlam);
    return;
  }

  if (slamModeTopic && connectionState === "connected") {
    try {
      let strMsg = new ROSLIB.Message({
        data: activeSlam.toLowerCase()
      });
      slamModeTopic.publish(strMsg);
      console.log("Published SLAM change to topic:", activeSlam.toLowerCase());
    } catch (e) {
      console.error(e);
    }
  }
}

/* ==========================================================================
   MAP RENDERING SYSTEM
   ========================================================================== */

function drawMap(map) {
  try {
    const canvas = document.getElementById("map-canvas");
    const container = document.getElementById("map-container");
    const placeholder = document.getElementById("map-placeholder");
    
    if (!canvas || !container) return;

    const width = map.info.width;
    const height = map.info.height;

    // Display telemetry map dimensions
    document.getElementById("telemetry-map-size").textContent = `${width} x ${height}`;

    // Compute display dimensions scaling to container height (480px)
    const displayHeight = 460;
    const scale = displayHeight / height;
    const displayWidth = Math.floor(width * scale);

    canvas.width = displayWidth;
    canvas.height = displayHeight;
    canvas.style.width = displayWidth + "px";
    canvas.style.height = displayHeight + "px";

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#070a10";
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    const imageData = ctx.createImageData(displayWidth, displayHeight);
    const pixels = imageData.data;

    // Fast mapping visualization
    for (let y = 0; y < displayHeight; y++) {
      for (let x = 0; x < displayWidth; x++) {
        // Map display coordinate back to source occupancy map
        const mapX = Math.floor(x / scale);
        const mapY = Math.floor(y / scale);

        if (mapX >= width || mapY >= height) continue;

        const mapIdx = mapY * width + mapX;
        const cellValue = map.data[mapIdx];
        
        let r, g, b, a;

        // Custom industrial color theme mapping
        if (cellValue === -1) {
          // Unknown areas: Blend into card background
          r = 11; g = 15; b = 25; a = 255;
        } else if (cellValue === 0) {
          // Free, explored area: Slate/gray floor
          r = 30; g = 41; b = 59; a = 255;
        } else {
          // Explored obstacles / walls (1-100): Orange glowing lines
          r = 249; g = 115; b = 22; a = 255;
        }

        const screenIdx = (y * displayWidth + x) * 4;
        pixels[screenIdx] = r;
        pixels[screenIdx + 1] = g;
        pixels[screenIdx + 2] = b;
        pixels[screenIdx + 3] = a;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // If simulator mode, let's draw the robot icon
    if (isSimMode) {
      drawVirtualRobot(ctx, displayWidth, displayHeight, scale);
    }

    // Hide loader overlay and reveal canvas
    if (placeholder) placeholder.style.display = "none";
    canvas.style.display = "block";

    // Update timestamp
    lastMapUpdateTime = Date.now();
    updateMapTimestamp();
  } catch (error) {
    console.error("Map render crash:", error);
  }
}

function updateMapTimestamp() {
  const ts = document.getElementById("map-timestamp");
  if (!ts) return;

  if (!lastMapUpdateTime) {
    ts.textContent = "Never";
    return;
  }

  const secondsAgo = Math.floor((Date.now() - lastMapUpdateTime) / 1000);
  if (secondsAgo === 0) ts.textContent = "Just now";
  else if (secondsAgo === 1) ts.textContent = "1s ago";
  else if (secondsAgo < 60) ts.textContent = `${secondsAgo}s ago`;
  else {
    const min = Math.floor(secondsAgo / 60);
    ts.textContent = `${min}m ago`;
  }
}

// Draw simulator robot position on canvas
function drawVirtualRobot(ctx, canvasW, canvasH, scale) {
  // Convert grid coordinates to canvas coordinates
  const canvasX = simX * scale;
  const canvasY = simY * scale;
  const robotSize = 12;

  ctx.save();
  ctx.translate(canvasX, canvasY);
  ctx.rotate(simTheta);

  // Draw triangular robot chassis
  ctx.beginPath();
  ctx.moveTo(robotSize, 0); // nose pointing forward
  ctx.lineTo(-robotSize / 2, -robotSize / 1.5);
  ctx.lineTo(-robotSize / 2, robotSize / 1.5);
  ctx.closePath();
  
  ctx.fillStyle = "rgba(16, 185, 129, 0.9)"; // Cyber green robot dot
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.5;
  ctx.fill();
  ctx.stroke();

  // Draw nose sensor line
  ctx.beginPath();
  ctx.moveTo(robotSize, 0);
  ctx.lineTo(robotSize + 8, 0);
  ctx.strokeStyle = "rgba(16, 185, 129, 1)";
  ctx.stroke();

  ctx.restore();
}

/* ==========================================================================
   SAVE MAP & ACTIONS
   ========================================================================== */

function saveMap() {
  const statusElement = document.getElementById("save-status");
  
  if (isSimMode) {
    showSaveStatus("✓ Simulated Map saved to workspace!", "success");
    return;
  }

  if (!sysCommandTopic || connectionState !== "connected") {
    showSaveStatus("Error: Core offline. Cannot save.", "error");
    return;
  }

  try {
    let msg = new ROSLIB.Message({ data: "savemap" });
    sysCommandTopic.publish(msg);
    showSaveStatus("Communicating save command to Core...", "info");

    if (saveMapTimeoutId) clearTimeout(saveMapTimeoutId);

    saveMapTimeoutId = setTimeout(function () {
      showSaveStatus("✓ Map saved successfully on Jetson (~/my_room_map)", "success");
    }, 1800);
  } catch (error) {
    console.error("Save map error:", error);
    showSaveStatus("Error: Command execution failed.", "error");
  }
}

function downloadMap() {
  const canvas = document.getElementById("map-canvas");
  if (!canvas || canvas.style.display === "none") {
    alert("No active map grid to export.");
    return;
  }

  try {
    let link = document.createElement("a");
    link.download = `rover_map_${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  } catch (e) {
    console.error(e);
  }
}

function showSaveStatus(message, type) {
  const elem = document.getElementById("save-status");
  elem.textContent = message;
  elem.style.display = "block";

  if (type === "success") {
    elem.style.background = "rgba(16, 185, 129, 0.1)";
    elem.style.color = "var(--accent-green)";
    elem.style.borderColor = "rgba(16, 185, 129, 0.3)";
  } else if (type === "error") {
    elem.style.background = "rgba(239, 68, 68, 0.1)";
    elem.style.color = "var(--accent-red)";
    elem.style.borderColor = "rgba(239, 68, 68, 0.3)";
  } else {
    // info
    elem.style.background = "rgba(249, 115, 22, 0.1)";
    elem.style.color = "var(--accent-orange)";
    elem.style.borderColor = "rgba(249, 115, 22, 0.3)";
  }

  setTimeout(function() {
    elem.style.display = "none";
  }, 4000);
}

/* ==========================================================================
   OFFLINE PRESENTATION SIMULATOR
   ========================================================================== */

function startSimulatorMode() {
  isSimMode = true;
  if (connectionRetryInterval) {
    clearInterval(connectionRetryInterval);
    connectionRetryInterval = null;
  }
  
  // Set fake connected state
  updateConnectionState("connected");
  document.getElementById("status-display-text").textContent = "Core Link: Simulator Mode (Hardware Offline)";
  document.getElementById("ip-display").textContent = "IP: SIMULATED";

  // Create base empty map
  for (let i = 0; i < simMapWidth * simMapHeight; i++) {
    simMapData[i] = -1; // fill with unknown
  }

  // Generate basic room geometries in simulation map data
  // 100x100 grid. Robot starts at 50, 50.
  
  // Kickstart scan updates
  runSimScan();
  publishSimGrid();

  // Run simulation mapping tick (simulating lidar rot at 1Hz)
  simIntervalId = setInterval(function () {
    runSimScan();
    publishSimGrid();
  }, 1000);
}

function updateSimPosition(direction) {
  const moveStep = 1.0;
  const rotStep = 0.12;

  if (direction === "forward") {
    const nextX = simX + Math.cos(simTheta) * moveStep;
    const nextY = simY + Math.sin(simTheta) * moveStep;
    if (!isSimWall(nextX, nextY)) {
      simX = nextX;
      simY = nextY;
    }
  } else if (direction === "backward") {
    const nextX = simX - Math.cos(simTheta) * moveStep;
    const nextY = simY - Math.sin(simTheta) * moveStep;
    if (!isSimWall(nextX, nextY)) {
      simX = nextX;
      simY = nextY;
    }
  } else if (direction === "left") {
    simTheta += rotStep;
  } else if (direction === "right") {
    simTheta -= rotStep;
  }

  // Re-run scan immediately upon motion commands
  runSimScan();
  publishSimGrid();
}

function isSimWall(x, y) {
  // Check bounds
  if (x <= 10 || x >= 90 || y <= 10 || y >= 90) return true;
  
  // Custom columns/obstacles
  // Center pillar
  if (x >= 45 && x <= 55 && y >= 45 && y <= 55) return true;
  
  // Outer partition walls
  if (x >= 28 && x <= 30 && y >= 25 && y <= 55) return true;
  if (x >= 70 && x <= 72 && y >= 45 && y <= 75) return true;

  return false;
}

function runSimScan() {
  const numRays = 180; // 360-degree scan representation
  const maxRange = 32;

  for (let i = 0; i < numRays; i++) {
    const angle = simTheta + (i * 2 * Math.PI / numRays);
    
    for (let dist = 1; dist < maxRange; dist++) {
      const rx = simX + dist * Math.cos(angle);
      const ry = simY + dist * Math.sin(angle);
      
      const gridX = Math.round(rx);
      const gridY = Math.round(ry);

      if (gridX < 0 || gridX >= simMapWidth || gridY < 0 || gridY >= simMapHeight) break;
      
      const idx = gridY * simMapWidth + gridX;

      if (isSimWall(rx, ry)) {
        simMapData[idx] = 100; // wall found
        break; // stop ray casting
      } else {
        simMapData[idx] = 0; // free space
      }
    }
  }
}

function publishSimGrid() {
  const fakeGrid = {
    info: {
      width: simMapWidth,
      height: simMapHeight,
      resolution: 0.05
    },
    data: simMapData
  };
  drawMap(fakeGrid);
}
