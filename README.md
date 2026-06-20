# ScoutRover - Autonomous Mapping System (Full-Stack MongoDB Upgrade)

Welcome to the production-ready full-stack version of **ScoutRover** — a modern web dashboard designed for autonomous LiDAR mapping, SLAM navigation, and remote rover control.

This upgrade transforms ScoutRover from a static mockup into a secure, database-backed full-stack application using Node.js, Express, Next.js, and MongoDB.

---

## 🏛️ System Architecture

ScoutRover is organized as a clean **Full-Stack TypeScript Monorepo** split into two main layers:

```
ScoutRover/
├── frontend/             # Next.js 16 (React 19) App Router Client Dashboard
├── backend/              # Node.js / Express.js / TypeScript REST API Server
├── docker-compose.yml    # DevOps Orchestration (MongoDB, Backend, Frontend)
├── package.json          # Monorepo Workspace settings & Concurrent Runners
├── .gitignore            # Version control exclusions
├── .prettierrc           # Global formatter configurations
├── .eslintrc             # Global linter rules
└── README.md             # This documentation
```

### Key Technical Enhancements
- **MongoDB & Mongoose**: Replaced all frontend `localStorage` simulation with a robust database persistence layer.
- **JWT Authentication & Refresh Tokens**: Secured routes using JSON Web Tokens (JWT) with automatic refresh cycles on the frontend client (`apiClient`).
- **Role-Based Access Control (RBAC)**: Defined roles (`ADMIN`, `OPERATOR`, `VIEWER`) restricting rover driving inputs, route planning, map generation, and audit logs.
- **Zod Validations**: Applied Zod schemas to validate incoming express request parameters, queries, and bodies.
- **Winston Logger**: Set up production logging tracking HTTP requests, operational errors, and auth events.
- **Transactional Emails**: Pre-configured Nodemailer welcome notifications and reset tokens.
- **Multer Uploads**: Formulated file filtering securing user avatar photo uploads (under 5MB).
- **Swagger Documentation**: Live Interactive Swagger UI exposed at `http://localhost:5000/api/docs`.
- **Unit Testing**: Jest & Supertest integration suite with isolated mock databases.
- **Containerization**: Full Docker & Docker Compose setup with database persistence volumes.

---

## 📂 Updated Project Structure

### Backend Layout
```text
backend/
├── src/
│   ├── config/          # Environment parsers & Swagger definitions
│   ├── controllers/     # Request handlers (Auth, User, Map, Marker, Route, Audit)
│   ├── services/        # Business logic & services (Email, Audit, Auth)
│   ├── repositories/    # Base & Model-specific Mongoose repositories
│   ├── routes/          # Express API route declarations
│   ├── middleware/      # Auth, RBAC, Zod, Error, Winston request loggers
│   ├── validators/      # Zod validation schemas
│   ├── models/          # Mongoose document schemas (User, Map, Marker, Route, AuditLog)
│   ├── database/        # Mongoose connection wrappers & Database Seed script
│   ├── types/           # Core TypeScript types & Express request extensions
│   ├── utils/           # Winston logger, custom ApiError, and ApiResponse
│   ├── tests/           # Jest integration and unit test suites
│   └── app.ts           # Server bootstrapper
├── uploads/             # Destination for uploaded avatar image files
├── logs/                # Destination for winston error.log and combined.log files
├── package.json
└── tsconfig.json
```

---

## ⚙️ Environment Variables Required

### 1. Backend (`backend/.env`)
Create a `.env` file in the `backend/` directory:
```env
NODE_ENV=development
PORT=5000

MONGODB_URI=mongodb://localhost:27017/scoutrover

# Security Secrets (replace with long cryptographic strings in production)
JWT_SECRET=scout_rover_super_secret_jwt_key_2026
JWT_EXPIRES_IN=1d

REFRESH_TOKEN_SECRET=scout_rover_super_secret_refresh_token_key_2026
REFRESH_TOKEN_EXPIRES_IN=7d

# SMTP Configuration (defaults to console logger output if empty)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
```

### 2. Frontend (`frontend/.env`)
Create a `.env` file in the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

---

## 🚀 Installation & Quick Start

You can run the entire application either locally or containerized in Docker.

### Option A: Running with Docker Compose (Recommended)
This starts MongoDB, compiles the backend API, builds the Next.js frontend, and sets up network links.

1. Ensure Docker Desktop is running.
2. From the root directory, run:
   ```bash
   docker-compose up --build
   ```
3. Initialize the database schema and seed default users inside the container:
   ```bash
   docker-compose exec backend npm run seed
   # Note: The seeding is also automatically run when compiling database connections.
   ```
4. Access the applications:
   - **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:5000](http://localhost:5000)
   - **Interactive API Docs**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)

---

### Option B: Local Development Setup
Ensure you have MongoDB running locally on port 27017.

1. **Install workspace dependencies**:
   ```bash
   npm install
   ```
2. **Seed the database**:
   ```bash
   npm run seed -w backend
   ```
3. **Start the application in Development Mode**:
   This runs both the frontend and backend concurrently:
   ```bash
   npm run dev
   ```
4. **Run Backend Test Suite**:
   ```bash
   npm run test -w backend
   ```

---

## 🔑 Default Seed Credentials

Upon running the seeder script, the database will be pre-populated with these default accounts:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@scoutrover.local` | `AdminPassword123!` | Read/Write everything + full audit logs + user deletion |
| **OPERATOR** | `operator@scoutrover.local` | `OperatorPassword123!` | Control Rover + Save Maps/Markers/Routes + Own activity feed |
| **VIEWER** | `viewer@scoutrover.local` | `ViewerPassword123!` | Read-only maps & waypoints + Own activity feed |

---

## 📖 API Documentation & Swagger

Every route is fully documented via OpenAPI 3.0. Navigate to **[http://localhost:5000/api/docs](http://localhost:5000/api/docs)** to test requests interactively.

### Core Endpoints
- **Authentication**: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`
- **User Settings**: `PUT /users/profile`, `PUT /users/change-password`, `POST /users/avatar` (upload avatar file)
- **User Management**: `GET /users`, `GET /users/:id`, `PUT /users/:id`, `DELETE /users/:id`
- **Maps System**: `GET /maps` (paginated list), `POST /maps` (save scan), `GET /maps/:id`, `DELETE /maps/:id`
- **Markers Waypoints**: `POST /markers` (create), `GET /markers/map/:mapId`, `DELETE /markers/:id`
- **Planned Routes**: `POST /routes` (save waypoint polyline), `GET /routes/map/:mapId`, `DELETE /routes/:id`
- **Security Audit Logs**: `GET /audit-logs` (lists security trails; automatically scoped for non-admins)

---

## 📦 Deployment Instructions

### 1. Production Docker Build
For staging/production environments, compile and launch optimized containers using:
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

### 2. Manual Production Deployment
1. **Database**: Spin up a managed MongoDB instance (e.g. MongoDB Atlas) and retrieve your URI.
2. **Backend**:
   - Install dependencies: `npm ci --only=production`
   - Build TS compile: `npm run build`
   - Set environment variables (`MONGODB_URI`, `JWT_SECRET`, `NODE_ENV=production`, etc.).
   - Launch server: `node dist/app.ts`
3. **Frontend**:
   - Set environment variable: `NEXT_PUBLIC_API_URL` pointing to your backend production URL.
   - Build Next.js build bundle: `npm run build`
   - Start Next.js server: `npm start`

---

## 📝 Summary of Changes Made

1. **Cleaned up workspace root**: Removed legacy HTML, serve.py, CSS, and JS files.
2. **Monorepo Restructuring**: Renamed `scout-rover-app` to `frontend/` using git and created the `backend/` Node.js workspace.
3. **Mongoose Database Schema**: Drafted complete MongoDB schemas for Users, Maps, Markers, Routes, and indexed Security Audit logs.
4. **JWT Security & Refresh Token Rotation**: Implemented token-signing middlewares alongside cookie/local storage persistence.
5. **Role-Based Access Control (RBAC)**: Configured role validation guards (`requireRole`) to block unauthorized actions.
6. **Zod Validator Schemas**: Added request schemas mapping every HTTP endpoint input.
7. **Winston Logger**: Attached request logging interceptors writing metrics to `logs/combined.log` and operational errors to `logs/error.log`.
8. **Nodemailer Service**: Integrated real SMTP configurations with logger fallback.
9. **Multer Avatar Uploader**: Secured path directories allowing image changes up to 5MB.
10. **Swagger UI**: Exposed specifications on `/api/docs`.
11. **Supertest Testing**: Written Jest endpoints mock suites.
12. **Next.js API Integration**: Hooked up `apiClient` mapping token expiration routines, refactored profile page (photo updates, activity feed), maps page (drawing route saves, sidebar listing), and dashboard page (saving live LiDAR grid scans directly to MongoDB).
