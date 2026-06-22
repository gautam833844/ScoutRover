---
name: fullstack-architect
description: "Use this skill when auditing system design, visualizing workspace module dependencies, verifying full-stack data flows, or reviewing layers separation."
---

# Fullstack Architect - System Design & Integrations

Guidelines, constraints, and audit workflows for building decoupled, secure, and maintainable full-stack systems.

## Overview

Use these guidelines when:
- Designing systems/features that span database, API, and frontend components.
- Resolving state mismatch between frontend client states and backend db records.
- Auditing workspace dependency layers or system modularity.
- Planning full-stack updates.

## Protocols

### Step 1: Layer Separation Rules
- **Loose Coupling**: Frontend client code should never communicate with databases directly; all operations must flow through REST API layers.
- **Contract Integrity**: Any API contract modification must update Swagger documentation (`backend/src/config/swagger.ts` or matching definitions) and frontend API interfaces concurrently.
- **Secret Separation**: Sensitive tokens/keys remain on the backend and are never exposed via Next.js client variables (variables missing `NEXT_PUBLIC_` prefix).

### Step 2: System Analysis & Visualizations
Execute the dependency analysis helper to check component references and verify layer separations:
```bash
python3 .agent/skills/fullstack-architect/scripts/analyze_structure.py
```

## Available Scripts

- **`analyze_structure.py`**: Visualizes structure directories (frontend/backend/models/controllers) to print dependencies and identify potential architecture violations.
  - Usage: `python3 .agent/skills/fullstack-architect/scripts/analyze_structure.py`
