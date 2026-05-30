var ros = null;
var cmdVel = null;
var mapListener = null;
var connectionRetryInterval = null;
var connectionTimeoutId = null;
var currentState = "not-connected"; // not-connected, connecting, connected

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
    ros = new ROSLIB.Ros({ url: "ws://10.97.199.151:9090" });

    ros.on("connection", function () {
      console.log("ROS connection established!");
      clearTimeout(connectionTimeoutId);
      updateState("connected");
      // List available topics for debugging
      listAvailableTopics();
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

function listAvailableTopics() {
  // Get list of all available topics and their types
  ROSLIB.Topic.getTopics(function (topics) {
    console.log("Available topics:", topics);
    
    // Find /map topic specifically
    var mapTopic = topics.find(function (t) {
      return t[0] === "/map";
    });
    
    if (mapTopic) {
      console.log("Found /map topic with message type:", mapTopic[1]);
    } else {
      console.warn("/map topic not found in available topics");
    }
  }, function (error) {
    console.error("Error getting topic list:", error);
  });
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

    cmdVel.publish(twist);
    console.log("Command sent:", direction);
  } catch (error) {
    console.error("Error sending command:", error);
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
    console.log("Map dimensions:", width, "x", height);

    // Calculate scaling to fit container (400px max height)
    var containerHeight = 400;
    var containerWidth = container.offsetWidth;
    var scale = Math.min(containerWidth / width, containerHeight / height, 1);

    var displayWidth = Math.floor(width * scale);
    var displayHeight = Math.floor(height * scale);

    canvas.width = displayWidth;
    canvas.height = displayHeight;
    canvas.style.width = displayWidth + "px";
    canvas.style.height = displayHeight + "px";

    var ctx = canvas.getContext("2d");
    var imageData = ctx.createImageData(displayWidth, displayHeight);
    var data = imageData.data;

    // Create scaled map: downsample if necessary
    var scaleInt = Math.ceil(1 / scale);

    for (var y = 0; y < displayHeight; y++) {
      for (var x = 0; x < displayWidth; x++) {
        // Map from display coordinates back to original map coordinates
        var mapX = Math.floor(x / scale);
        var mapY = Math.floor(y / scale);
        var mapIdx = mapY * width + mapX;

        var cell = map.data[mapIdx];
        var gray;

        // Color mapping for occupancy grid
        // -1 = unknown (gray), 0 = free (white), 1-100 = occupied (black)
        if (cell === -1) {
          gray = 128; // Unknown = gray
        } else if (cell === 0) {
          gray = 255; // Free = white
        } else if (cell > 0) {
          // Occupied: scale 1-100 to 0-255 (darker = more occupied)
          gray = Math.max(0, 255 - (cell * 2.55));
        } else {
          gray = 128;
        }

        var idx = (y * displayWidth + x) * 4;
        data[idx] = gray;     // R
        data[idx + 1] = gray; // G
        data[idx + 2] = gray; // B
        data[idx + 3] = 255;  // A
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Hide placeholder and show canvas
    var placeholder = document.getElementById("map-placeholder");
    if (placeholder) {
      placeholder.style.display = "none";
    }
    canvas.style.display = "block";

    console.log("Map rendered successfully at", displayWidth, "x", displayHeight);
  } catch (error) {
    console.error("Error drawing map:", error);
  }
}
