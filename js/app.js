var ros = null;
var cmdVel = null;
var mapListener = null;
var connectionRetryInterval = null;
var connectionTimeoutId = null;
var currentState = "not-connected"; // not-connected, connecting, connected

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
      updateState("not-connected");
      scheduleRetry();
    }
  }, 8000);

  ros = new ROSLIB.Ros({ url: "ws://rover.local:9090" });

  ros.on("connection", function () {
    clearTimeout(connectionTimeoutId);
    updateState("connected");
    setupTopics();
  });

  ros.on("error", function (error) {
    clearTimeout(connectionTimeoutId);
    if (currentState === "connecting") {
      updateState("not-connected");
      scheduleRetry();
    }
  });

  ros.on("close", function () {
    clearTimeout(connectionTimeoutId);
    if (currentState === "connecting") {
      updateState("not-connected");
      scheduleRetry();
    }
  });
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
  cmdVel = new ROSLIB.Topic({
    ros: ros,
    name: "/cmd_vel",
    messageType: "geometry_msgs/Twist",
  });

  mapListener = new ROSLIB.Topic({
    ros: ros,
    name: "/map",
    messageType: "nav_msgs/OccupancyGrid",
  });

  mapListener.subscribe(function (message) {
    drawMap(message);
  });
}

function sendCmd(direction) {
  if (!cmdVel) return;
  var twist = new ROSLIB.Message({
    linear: { x: 0, y: 0, z: 0 },
    angular: { x: 0, y: 0, z: 0 },
  });
  if (direction === "forward") twist.linear.x = 0.5;
  if (direction === "backward") twist.linear.x = -0.5;
  if (direction === "left") twist.angular.z = 0.5;
  if (direction === "right") twist.angular.z = -0.5;
  cmdVel.publish(twist);
}

function drawMap(map) {
  var canvas = document.getElementById("map-canvas");
  var ctx = canvas.getContext("2d");
  var width = map.info.width;
  var height = map.info.height;
  canvas.width = width;
  canvas.height = height;
  var imageData = ctx.createImageData(width, height);
  for (var i = 0; i < map.data.length; i++) {
    var cell = map.data[i];
    var color = cell === -1 ? 128 : cell === 0 ? 255 : 0;
    imageData.data[i * 4] = color;
    imageData.data[i * 4 + 1] = color;
    imageData.data[i * 4 + 2] = color;
    imageData.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  document.getElementById("map-placeholder").style.display = "none";
  canvas.style.display = "block";
}
