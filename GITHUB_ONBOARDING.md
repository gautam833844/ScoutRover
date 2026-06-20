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
