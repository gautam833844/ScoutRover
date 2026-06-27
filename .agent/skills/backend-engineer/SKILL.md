---
name: backend-engineer
description: "Use this skill when developing REST API endpoints, writing controllers or routes, integrating middlewares, setting up request validations, or configuring logging/error handlers."
---

# Backend Engineer - API Architect

Guidelines, structures, and tools for designing and implementing secure, scalable REST APIs using Node.js, Express, TypeScript, and Mongoose.

## Overview

Use these guidelines when:
- Adding or refactoring Express routing endpoints.
- Developing controller handlers and services.
- Securing routes via Authentication (JWT/Cookies) or RBAC (Role-Based Access Control) middlewares.
- Writing Winston log handlers or resolving server failures.
- Designing validators using Zod schema models.

## Protocols

### Step 1: Endpoint Design Rules
Ensure every endpoint adheres to:
- **Routing**: Explicit routes declared in `backend/src/routes/` and registered under the prefix `/api/v1/`.
- **Validation**: Request bodies/queries validated with Zod validation middleware before reaching controller logic.
- **Controllers**: Lightweight controller handlers dealing with HTTP semantics (parsing requests, returning standardized `ApiResponse` shapes).
- **Error Handling**: Throw a custom `ApiError(statusCode, message)` instance. Unhandled failures should be caught by global middleware.

### Step 2: Scaffolding Endpoints
Use the scaffolding script to create files for a new CRUD resource structure:
```bash
python3 .agent/skills/backend-engineer/scripts/scaffold_api.py "Telemetry"
```

### Step 3: Logging & Audit Logs
- Log all inbound routes and critical errors using Winston (`utils/logger.ts`).
- Record security-sensitive activities (e.g. login failures, updates, profile changes) by triggering the Audit Log Service.

## Available Scripts

- **`scaffold_api.py`**: Auto-generates Controllers, Routes, Validators, and Service stubs.
  - Usage: `python3 .agent/skills/backend-engineer/scripts/scaffold_api.py <ResourceName> [--dir backend/src]`
