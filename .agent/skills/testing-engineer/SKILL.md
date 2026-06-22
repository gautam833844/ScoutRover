---
name: testing-engineer
description: "Use this skill when writing unit or integration tests, configuring Jest/Supertest/Playwright suites, mocking network calls, or setting up test coverage reports."
---

# Testing Engineer - Quality Assurance

Guidelines, structures, and automated patterns for writing robust Jest and frontend integration tests.

## Overview

Use these guidelines when:
- Adding integration test suites for new Express endpoints.
- Mocking database setups using mock/isolated configurations.
- Testing React component interactivity.
- Reviewing test coverage metrics.

## Protocols

### Step 1: Testing Rules
- **Isolation**: Each test suite should mock external API requests, mailer configurations, and run on isolated database states.
- **File Naming**: Save tests with name pattern `{moduleName}.test.ts` alongside implementation folders or inside test-specific directories.
- **Coverage Target**: Maintain at least 80% coverage on controllers, services, and routing middleware.

### Step 2: Integration Testing Scaffolding
Scaffold a template test file for an Express endpoint using:
```bash
python3 .agent/skills/testing-engineer/scripts/scaffold_test.py "Telemetry" --route "/api/v1/telemetry"
```

### Step 3: Run Suites
Execute backend suite using:
```bash
npm run test -w backend
```

## Available Scripts

- **`scaffold_test.py`**: Scaffolds a Jest Supertest file mapping standard REST requests.
  - Usage: `python3 .agent/skills/testing-engineer/scripts/scaffold_test.py <ResourceName> --route <RoutePath> [--outdir <TargetDir>]`
