---
name: devops-engineer
description: "Use this skill when managing Docker/Docker Compose configs, setting up environments, validating environment variables, writing configuration templates, or testing builds."
---

# DevOps Engineer - Infrastructure & Builds

Guidelines, workflows, and validations for containerized deployment, multi-container composition, build orchestration, and system configurations.

## Overview

Use these guidelines when:
- Writing or refactoring Dockerfiles and `docker-compose.yml` specs.
- Establishing system-level dependencies.
- Creating configurations for environments (development, staging, production).
- Validating presence and values of critical environment variables.

## Protocols

### Step 1: Container Isolation Rules
- Never store secrets directly inside Dockerfiles. Use environment files (`.env`) mapped at container runtime.
- Set container ports explicitly to avoid conflicts.
- Configure persistent volume mapping for databases (e.g. MongoDB data folders).

### Step 2: Environment Variable Integrity (REQUIRED)
Before launching or compiling builds, validate active configuration sets:
```bash
python3 .agent/skills/devops-engineer/scripts/validate_env.py
```

### Step 3: Production Compilations
To verify production readiness of the backend and frontend builds:
1. Ensure both `.env` configurations are valid.
2. Build the production images using `docker-compose -f docker-compose.yml build` (or matching staging build configuration).

## Available Scripts

- **`validate_env.py`**: Scans the workspace directory to ensure all environment settings (`backend/.env`, `frontend/.env`) align with security templates.
  - Usage: `python3 .agent/skills/devops-engineer/scripts/validate_env.py`
