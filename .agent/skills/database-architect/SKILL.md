---
name: database-architect
description: "Use this skill when defining Mongoose schemas, adding MongoDB database indexes, designing query selectors, writing database seeder scripts, or optimizing queries."
---

# Database Architect - Schema Design & Optimization

Rules, protocols, and workflows for designing high-performance MongoDB/Mongoose models, indexing strategies, and data seeders.

## Overview

Use these guidelines when:
- Designing new database schemas in `backend/src/models/`.
- Adding indexes to optimize slow-running API routes.
- Writing data seeding configurations or migrations.
- Diagnosing Mongoose validation constraints or transaction failures.

## Protocols

### Step 1: Mongoose Schema Standards
- Always enforce schema-level validators (like `required`, `trim`, `enum`, `min`, `max`).
- Include timestamps (`createdAt`, `updatedAt`) automatically.
- Enforce strict schemas unless dynamic structures are required.

### Step 2: Indexing Policy
- Define compound indexes for fields frequently queried together (e.g. `userId` and `mapId`).
- Use unique indexes for identities (e.g. `email`).
- Add index specifications in the schema definition rather than dynamically at runtime.

### Step 3: Performance Analysis
Run the profile script to scan model files for potential schema smells (such as missing indexes or reference types without pointers):
```bash
python3 .agent/skills/database-architect/scripts/profile_schema.py "backend/src/models"
```

## Available Scripts

- **`profile_schema.py`**: Scans models to check for standard design rules (e.g., timestamps, indexing properties, unique key constraints).
  - Usage: `python3 .agent/skills/database-architect/scripts/profile_schema.py <modelsDir>`
