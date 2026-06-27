# ScoutRover - Developer Onboarding & Step-by-Step Setup Guide

Welcome to the **ScoutRover** full-stack repository! This step-by-step guide is designed to help new team members and contributors set up, run, test, and develop the ScoutRover application from scratch.

---

## 🛠️ Step 1: Install System Prerequisites
Before cloning and setting up the code, make sure you have the following tools installed on your local development machine:

1. **Node.js** (v18.0.0 or higher recommended)
   - Download from [nodejs.org](https://nodejs.org) or install via `nvm` (Node Version Manager).
2. **MongoDB** (v6.0 or higher)
   - You need a local MongoDB instance running at `mongodb://localhost:27017` OR a MongoDB Atlas cloud database URI.
   - For macOS: Install via Homebrew:
     ```bash
     brew tap mongodb/brew
     brew install mongodb-community@6.0
     brew services start mongodb-community@6.0
     ```
3. **Git** (v2.x or higher)
   - Download from [git-scm.com](https://git-scm.com).
4. **Docker Desktop** (Optional, recommended for containerized setup)
   - Download from [docker.com](https://www.docker.com/products/docker-desktop).

---

## 📂 Step 2: Clone the Repository
Clone the codebase to your local workspace and navigate to the project directory:

```bash
git clone https://github.com/your-org/ScoutRover.git
cd ScoutRover
```

---

## ⚙️ Step 3: Configure Environment Variables
The monorepo uses `.env` files to store configuration details for the frontend and backend. 

### A. Backend Environment Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Copy the sample environment file to create `.env`:
   ```bash
   cp .env.example .env
   ```
3. Open `backend/.env` and configure:
   - `MONGODB_URI`: Set to `mongodb://localhost:27017/scoutrover` for local MongoDB.
   - `JWT_SECRET`: Input a secure secret key for token signing (e.g. `your_custom_jwt_secret_phrase`).
   - `REFRESH_TOKEN_SECRET`: Input a secure secret key for refresh tokens.

### B. Frontend Environment Setup
1. Navigate to the `frontend` folder:
   ```bash
   cd ../frontend
   ```
2. Create a `.env` file:
   ```bash
   echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1" > .env
   ```

---

## 📦 Step 4: Install Dependencies
ScoutRover uses **npm workspaces** to manage packages for both the frontend and backend from the root.

1. Navigate back to the monorepo root directory:
   ```bash
   cd ..
   ```
2. Install all dependencies across both workspaces in one command:
   ```bash
   npm install
   ```

---

## 🌱 Step 5: Seed the Database
We provide a seeding script to populate your database with default users, sample spatial maps, waypoints, routes, and logs.

1. Run the seeder script from the monorepo root:
   ```bash
   npm run seed -w backend
   ```
2. Verify that you see the console output indicating successful seeding of:
   - **Admin**: `admin@scoutrover.local` / `AdminPassword123!`
   - **Operator**: `operator@scoutrover.local` / `OperatorPassword123!`
   - **Viewer**: `viewer@scoutrover.local` / `ViewerPassword123!`

---

## 🚀 Step 6: Start the Application Locally
You can start both the Next.js frontend and the Express backend concurrently with a single command from the root:

```bash
npm run dev
```

### Accessing the services:
- **Frontend Dashboard**: Open [http://localhost:3000](http://localhost:3000) (or [http://localhost:3001](http://localhost:3001) if port 3000 is occupied).
- **Backend API Server**: Open [http://localhost:5000](http://localhost:5000).
- **Interactive Swagger Documentation**: View all REST endpoints and test them live at [http://localhost:5000/api/docs](http://localhost:5000/api/docs).

---

## 🧪 Step 7: Run the Test Suite
To verify that all backend controllers, services, models, and validations are fully operational:

```bash
npm run test -w backend
```

Ensure all tests pass successfully.

---

## 🐳 Step 8: Alternative Setup (Running via Docker Compose)
If you prefer running the stack using Docker containers (avoiding local installations of Node.js or MongoDB):

1. From the root directory, build and launch the container network:
   ```bash
   docker-compose up --build
   ```
2. The containers will automatically boot MongoDB, the API backend, and the Next.js client. Seeding is executed automatically on startup.
3. Access the dashboard at [http://localhost:3000](http://localhost:3000) and Swagger API docs at [http://localhost:5000/api/docs](http://localhost:5000/api/docs).

---

## 🛠️ Step 9: Development Guidelines & Git Workflow
Before committing changes to GitHub, make sure you follow these workflow policies:

1. **Branch Management**:
   - Do **NOT** commit changes directly to `main` or `master`.
   - Create a feature or improvement branch:
     ```bash
     git checkout -b dev/your-feature-name
     ```
2. **Code Formatting & Linting**:
   - Format your code rules using Prettier:
     ```bash
     npm run format
     ```
   - Run the linting checks to ensure code health:
     ```bash
     npm run lint
     ```
3. **Verify Build**:
   - Ensure the monorepo builds cleanly before pushing to GitHub:
     ```bash
     npm run build
     ```
4. **Push Changes**:
   - Push your local branch to the remote origin:
     ```bash
     git push origin dev/your-feature-name
     ```
   - Open a Pull Request (PR) on GitHub.


Here is exactly what the Jetson needs installed and running for everything to auto-connect with your ScoutRover dashboard:

🤖 What the Jetson Needs
1. ROS 2 (or ROS 1) Installed
Your dashboard uses roslib with WebSocket, so the Jetson must have ROS installed:

bash
# ROS 2 Humble (recommended for Jetson / Ubuntu 22.04)
sudo apt install ros-humble-desktop
2. rosbridge_server — The Critical Piece
This is what listens on port 9090 (the WebSocket your dashboard connects to at ws://10.200.95.151:9090).

bash
# Install rosbridge suite
sudo apt install ros-humble-rosbridge-suite
# Run it (manual test)
ros2 launch rosbridge_server rosbridge_websocket_launch.xml
3. Your Rover's ROS Stack
The dashboard subscribes to these topics — so whatever produces them must also be running:

Topic	Type	Purpose
/map	nav_msgs/OccupancyGrid	LiDAR SLAM map shown on dashboard
/cmd_vel	geometry_msgs/Twist	Drive commands from dashboard controls
/syscommand	std_msgs/String	System-level commands (start/stop SLAM)
bash
# Example: Start your SLAM node (slam_toolbox or cartographer)
ros2 launch slam_toolbox online_async_launch.py
# Example: Start your LiDAR driver
ros2 launch rplidar_ros rplidar.launch.py
4. Auto-Start on Boot via systemd
So everything runs automatically when the Jetson powers on — no manual SSH needed:

Step 1 — Create a startup script on the Jetson:

bash
sudo nano /usr/local/bin/scoutrover_startup.sh
Paste this:

bash
#!/bin/bash
source /opt/ros/humble/setup.bash
source /home/jetson/your_ws/install/setup.bash  # your ROS workspace
# Wait for system to settle
sleep 5
# Start rosbridge WebSocket server
ros2 launch rosbridge_server rosbridge_websocket_launch.xml &
# Start your LiDAR driver
ros2 launch rplidar_ros rplidar.launch.py &
# Start SLAM
ros2 launch slam_toolbox online_async_launch.py &
wait
Step 2 — Make it executable:

bash
sudo chmod +x /usr/local/bin/scoutrover_startup.sh
Step 3 — Create a systemd service:

bash
sudo nano /etc/systemd/system/scoutrover.service
Paste this:

ini
[Unit]
Description=ScoutRover ROS Stack
After=network.target
[Service]
Type=forking
User=jetson
ExecStart=/usr/local/bin/scoutrover_startup.sh
Restart=on-failure
RestartSec=10
KillMode=process
[Install]
WantedBy=multi-user.target
Step 4 — Enable the service:

bash
sudo systemctl daemon-reload
sudo systemctl enable scoutrover.service
sudo systemctl start scoutrover.service
# Check status
sudo systemctl status scoutrover.service
5. Fix the Network Issue (so your Mac can reach the Jetson)
Since your Mac is on 172.26.183.x and the Jetson expects 10.200.95.151, you have two clean options:

Option A — Both on same Wi-Fi (ras), update the Jetson's IP in your .env:

bash
# Find Jetson's actual IP on the ras network
hostname -I
Then in your Mac's frontend/.env:

env
NEXT_PUBLIC_ROS_URL=ws://172.26.183.XXX:9090
Option B — Jetson as a Wi-Fi Hotspot (self-contained rover):

bash
# On Jetson: create hotspot named "ScoutRover"
sudo nmcli device wifi hotspot ifname wlan0 ssid "ScoutRover" password "rover1234"
Then connect your Mac to the ScoutRover Wi-Fi — the Jetson will be at 10.42.0.1:9090 automatically.

Summary Checklist for Jetson
Component	Status needed
ROS 2 Humble	✅ Installed
rosbridge_server	✅ Running on port 9090
LiDAR driver node	✅ Running, publishing /scan
SLAM node	✅ Running, publishing /map
Same network as Mac	✅ Both devices reachable
systemd auto-start	✅ Enabled for boot-time launch