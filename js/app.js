
var ros = null;
var cmdVel = null;
var mapListener = null;
var sysCommand = null;
var connectionRetryInterval = null;
var connectionTimeoutId = null;
var currentState = "not-connected"; // not-connected, connecting, connected
var lastMapUpdateTime = null; // Track last map update timestamp
var mapUpdateIntervalId = null; // Update timestamp display every second
var cmdIntervalId = null; // Track command interval for hold-to-move
var currentDirection = null; // Track which direction is currently being held
var saveMapTimeoutId = null; // Track save map status timeout

// Handle unhandled promise rejections
window.addEventListener("unhandledrejection", function (event) {
  console.error("Unhandled promise rejection:", event.reason);
  event.preventDefault();
});

// Auto-connect on page load
window.addEventListener("load", function () {
  attemptConnect();
});

function attemptConnect() {
  if (currentState === "connected") return;

  updateState("connecting");

  // Set a timeout to fail if connection takes too long
  connectionTimeoutId = setTimeout(function () {
    if (currentState === "connecting") {
      console.log("Connection timeout - no response from rover");
      updateState("not-connected");
      scheduleRetry();
    }
  }, 8000);

  try {
    ros = new ROSLIB.Ros({ url: "ws://10.200.95.151:9090" });

    ros.on("connection", function () {
      console.log("ROS connection established!");
      clearTimeout(connectionTimeoutId);
      updateState("connected");
      setupTopics();
    });

    ros.on("error", function (error) {
      console.error("ROS connection error:", error);
      clearTimeout(connectionTimeoutId);
      if (currentState === "connecting") {
        updateState("not-connected");
        scheduleRetry();
      }
    });

    ros.on("close", function () {
      console.log("ROS connection closed");
      clearTimeout(connectionTimeoutId);
      if (currentState === "connecting") {
        updateState("not-connected");
        scheduleRetry();
      }
    });
  } catch (error) {
    console.error("Error creating ROS connection:", error);
    clearTimeout(connectionTimeoutId);
    updateState("not-connected");
    scheduleRetry();
  }
}

function updateState(state) {
  currentState = state;
  const screen = document.getElementById("connection-screen");
  const dashboard = document.getElementById("dashboard");
  const headerDot = document.getElementById("header-dot");
  const icon = document.getElementById("connection-icon");

  if (state === "not-connected") {
    screen.classList.remove("hidden");
    dashboard.classList.add("hidden");
    headerDot.className = "connection-dot";

    document.getElementById("connection-title").innerText =
      "Connect to RoverOS WiFi";
    document.getElementById("connection-subtitle").innerHTML =
      "Please connect your phone or laptop to the WiFi network named <strong>RoverOS</strong> then this page will connect automatically";
    icon.innerText = "📡";
    icon.style.display = "block";
  } else if (state === "connecting") {
    screen.classList.remove("hidden");
    dashboard.classList.add("hidden");
    headerDot.classList.add("connecting");
    headerDot.classList.remove("connected");

    document.getElementById("connection-title").innerText =
      "Connecting to Rover...";
    document.getElementById("connection-subtitle").innerText = "Please wait";
    icon.style.display = "none";
  } else if (state === "connected") {
    screen.classList.add("hidden");
    dashboard.classList.remove("hidden");
    headerDot.classList.add("connected");
    headerDot.classList.remove("connecting");

    clearTimeout(connectionTimeoutId);
    if (connectionRetryInterval) {
      clearInterval(connectionRetryInterval);
      connectionRetryInterval = null;
    }
  }
}

function scheduleRetry() {
  if (connectionRetryInterval) return;

  connectionRetryInterval = setInterval(function () {
    if (currentState === "not-connected") {
      attemptConnect();
    }
  }, 3000);
}

function skipToTestDashboard() {
  if (connectionRetryInterval) clearInterval(connectionRetryInterval);
  updateState("connected");
}

function setupTopics() {
  try {
    // Setup command velocity publisher
    cmdVel = new ROSLIB.Topic({
      ros: ros,
      name: "/cmd_vel",
      messageType: "geometry_msgs/Twist",
    });
    console.log("CMD_VEL topic initialized");

    // Setup map subscriber with throttling to reduce bandwidth
    // throttle_rate: 5000ms = receive 1 message every 5 seconds
    // queue_length: 1 = only keep the latest message
    mapListener = new ROSLIB.Topic({
      ros: ros,
      name: "/map",
      messageType: "nav_msgs/OccupancyGrid",
      throttle_rate: 5000,
      queue_length: 1
    });
    console.log("MAP topic initialized with throttle_rate: 5000ms, subscribing...");

    // Add error handler to the topic directly
    mapListener.on("error", function (error) {
      console.error("MAP topic error event:", {
        code: error.code,
        name: error.name,
        message: error.message,
        httpStatus: error.httpStatus,
        httpStatusText: error.httpStatusText,
        httpError: error.httpError,
        fullError: error
      });
    });

    // Subscribe with message callback
    mapListener.subscribe(function (message) {
      // Success callback - message received
      try {
        if (!message || !message.info || !message.data) {
          console.warn("Received invalid map message:", message);
          return;
        }

        console.log("Map data received:", {
          width: message.info.width,
          height: message.info.height,
          dataLength: message.data.length,
          timestamp: new Date().toISOString()
        });
        drawMap(message);
      } catch (error) {
        console.error("Error processing map message:", error);
      }
    });

    // Setup system command publisher for map saving
    sysCommand = new ROSLIB.Topic({
      ros: ros,
      name: "/syscommand",
      messageType: "std_msgs/String",
    });
    console.log("SYSCOMMAND topic initialized");

    console.log("Topics setup complete");
  } catch (error) {
    console.error("Error in setupTopics:", error);
  }
}

function sendCmd(direction) {
  if (!cmdVel || !ros || !ros.isConnected) {
    console.warn("Cannot send command - not connected");
    return;
  }

  try {
    var twist = new ROSLIB.Message({
      linear: { x: 0, y: 0, z: 0 },
      angular: { x: 0, y: 0, z: 0 },
    });

    if (direction === "forward") twist.linear.x = 0.5;
    if (direction === "backward") twist.linear.x = -0.5;
    if (direction === "left") twist.angular.z = 0.5;
    if (direction === "right") twist.angular.z = -0.5;
    if (direction === "stop") {
      twist.linear.x = 0;
      twist.angular.z = 0;
    }

    cmdVel.publish(twist);
    console.log("Command sent:", direction);
  } catch (error) {
    console.error("Error sending command:", error);
  }
}

function startCmd(direction) {
  if (!cmdVel || !ros || !ros.isConnected) {
    console.warn("Cannot send command - not connected");
    return;
  }

  // Clear any existing interval
  if (cmdIntervalId) {
    clearInterval(cmdIntervalId);
  }

  currentDirection = direction;

  // Send command immediately
  sendCmd(direction);

  // Send command every 100ms while held
  cmdIntervalId = setInterval(function () {
    sendCmd(direction);
  }, 100);

  console.log("Started holding:", direction);
}

function stopRover() {
  // Clear the command interval
  if (cmdIntervalId) {
    clearInterval(cmdIntervalId);
    cmdIntervalId = null;
  }

  // Send stop command
  sendCmd("stop");
  currentDirection = null;
  console.log("Rover stopped");
}

function saveMap() {
  if (!sysCommand || !ros || !ros.isConnected) {
    showSaveStatus("Error: Not connected to rover", "error");
    console.warn("Cannot save map - not connected");
    return;
  }

  try {
    // Create and publish the save map command
    var message = new ROSLIB.Message({
      data: "savemap"
    });

    sysCommand.publish(message);
    console.log("Save map command sent");
    showSaveStatus("Saving map... Please wait", "info");

    // Clear any existing timeout
    if (saveMapTimeoutId) {
      clearTimeout(saveMapTimeoutId);
    }

    // Show success message after a short delay
    saveMapTimeoutId = setTimeout(function () {
      showSaveStatus("✓ Map saved to ~/my_room_map", "success");
      // Clear the status message after 5 seconds
      setTimeout(function () {
        document.getElementById("save-status").style.display = "none";
      }, 5000);
    }, 2000);
  } catch (error) {
    console.error("Error saving map:", error);
    showSaveStatus("Error: Failed to save map", "error");
  }
}

function showSaveStatus(message, type) {
  var statusElement = document.getElementById("save-status");
  statusElement.textContent = message;
  statusElement.style.display = "block";
  statusElement.style.border = "1px solid";

  if (type === "success") {
    statusElement.style.background = "#ecfdf5";
    statusElement.style.color = "#047857";
    statusElement.style.borderColor = "#a7f3d0";
  } else if (type === "error") {
    statusElement.style.background = "#fef2f2";
    statusElement.style.color = "#b91c1c";
    statusElement.style.borderColor = "#fecaca";
  } else if (type === "info") {
    statusElement.style.background = "#eff6ff";
    statusElement.style.color = "#0c4a6e";
    statusElement.style.borderColor = "#bae6fd";
  }
}

function downloadMap() {
  var canvas = document.getElementById("map-canvas");
  if (!canvas) {
    console.warn("Map canvas not found");
    return;
  }

  try {
    var link = document.createElement("a");
    link.download = "rover_map.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    console.log("Map downloaded as rover_map.png");
  } catch (error) {
    console.error("Error downloading map:", error);
  }
}

function drawMap(map) {
  try {
    if (!map || !map.data || !map.info) {
      console.error("Invalid map data:", map);
      return;
    }

    var canvas = document.getElementById("map-canvas");
    var container = document.getElementById("map-container");

    if (!canvas || !container) {
      console.error("Canvas or container not found");
      return;
    }

    var width = map.info.width;
    var height = map.info.height;
    console.log("Rendering map:", width, "x", height);

    // Calculate scaling to fit container (400px max height)
    var containerHeight = 400;
    var containerWidth = container.offsetWidth;
    var scale = Math.min(containerWidth / width, containerHeight / height, 1);

    var displayWidth = Math.floor(width * scale);
    var displayHeight = Math.floor(height * scale);

    // Set canvas resolution and display size
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    canvas.style.width = displayWidth + "px";
    canvas.style.height = displayHeight + "px";

    var ctx = canvas.getContext("2d");

    // IMPORTANT: Clear the canvas before redrawing
    ctx.clearRect(0, 0, displayWidth, displayHeight);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    var imageData = ctx.createImageData(displayWidth, displayHeight);
    var data = imageData.data;

    // Render scaled map
    for (var y = 0; y < displayHeight; y++) {
      for (var x = 0; x < displayWidth; x++) {
        // Map from display coordinates back to original map coordinates
        var mapX = Math.floor(x / scale);
        var mapY = Math.floor(y / scale);

        // Bounds check
        if (mapX >= width || mapY >= height) {
          continue;
        }

        var mapIdx = mapY * width + mapX;

        if (mapIdx < 0 || mapIdx >= map.data.length) {
          continue;
        }

        var cell = map.data[mapIdx];
        var gray;

        // Color mapping for occupancy grid
        // -1 = unknown (gray), 0 = free (white), 1-100 = occupied (black)
        if (cell === -1) {
          gray = 200; // Unknown = light gray
        } else if (cell === 0) {
          gray = 255; // Free = white
        } else if (cell > 0) {
          // Occupied: scale 1-100 to 50-0 (darker = more occupied)
          gray = Math.max(50, 255 - (cell * 2.05));
        } else {
          gray = 200;
        }

        var idx = (y * displayWidth + x) * 4;
        data[idx] = gray;     // R
        data[idx + 1] = gray; // G
        data[idx + 2] = gray; // B
        data[idx + 3] = 255;  // A (fully opaque)
      }
    }

    // Draw the image data to canvas
    ctx.putImageData(imageData, 0, 0);

    // Hide placeholder and ensure canvas is visible
    var placeholder = document.getElementById("map-placeholder");
    if (placeholder) {
      placeholder.style.display = "none";
    }
    canvas.style.display = "block";

    // Update the last map update time
    lastMapUpdateTime = Date.now();
    updateMapTimestamp();

    // Start/restart the timestamp update interval if not already running
    if (!mapUpdateIntervalId) {
      mapUpdateIntervalId = setInterval(updateMapTimestamp, 1000);
    }

    console.log("Map rendered successfully at", displayWidth, "x", displayHeight);
  } catch (error) {
    console.error("Error drawing map:", error);
  }
}

function updateMapTimestamp() {
  var timestampElement = document.getElementById("map-timestamp");
  if (!timestampElement) return;

  if (!lastMapUpdateTime) {
    timestampElement.textContent = "Last updated: Never";
    return;
  }

  var secondsAgo = Math.floor((Date.now() - lastMapUpdateTime) / 1000);

  if (secondsAgo === 0) {
    timestampElement.textContent = "Last updated: Just now";
  } else if (secondsAgo === 1) {
    timestampElement.textContent = "Last updated: 1 second ago";
  } else if (secondsAgo < 60) {
    timestampElement.textContent = "Last updated: " + secondsAgo + " seconds ago";
  } else {
    var minutesAgo = Math.floor(secondsAgo / 60);
    timestampElement.textContent = "Last updated: " + minutesAgo + " minute" + (minutesAgo > 1 ? "s" : "") + " ago";
  }
}
