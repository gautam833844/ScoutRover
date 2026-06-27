---
name: frontend-engineer
description: "Use this skill when developing frontend components, writing UI templates, establishing client-side state management, or optimizing performance and Next.js / React structures."
---

# Frontend Engineer - Client-Side Architecture

Specialized workflows and protocols for creating beautiful, accessible, and high-performance user interfaces using React, Next.js, and TypeScript.

## Overview

Use these guidelines when:
- Adding or refactoring React components.
- Designing client-side state management systems.
- Integrating backend APIs via HTTP client handlers.
- Optimizing Next.js page loads, assets, and bundle sizes.

## Protocols

### Step 1: Component Planning
Determine if the component should be a Server Component (default in Next.js App Router) or a Client Component (requires `"use client"` directive).
- **Server Components**: Use for static rendering, data fetching directly from repositories, or when security credentials should remain server-only.
- **Client Components**: Use when incorporating interactivity (e.g., `useState`, `useEffect`), browser APIs, or event listeners.

### Step 2: Component Scaffolding
Always use the scaffolding helper script to construct new React component files:
```bash
python3 .agent/skills/frontend-engineer/scripts/scaffold.py "ComponentName" --type client --css
```

### Step 3: State Management
- Prefer React Context for lightweight global state (e.g., theme settings, auth context).
- For local state, use standard `useState` or `useReducer`.

### Step 4: Styling Integration
- Maintain style guidelines from `uiux-designer`.
- Use Tailwind CSS or CSS Modules (`component.module.css`).

## Available Scripts

- **`scaffold.py`**: Scaffolds a complete React component with associated files.
  - Usage: `python3 .agent/skills/frontend-engineer/scripts/scaffold.py <ComponentName> [--type client|server] [--css]`
