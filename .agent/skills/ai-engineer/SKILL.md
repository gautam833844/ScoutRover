---
name: ai-engineer
description: "Use this skill when designing prompts, integrating LLM APIs, configuring vector embeddings, parsing JSON schemas from AI responses, or testing agentic workflows."
---

# AI Engineer - Intelligent Agents & Workflows

Guidelines, techniques, and evaluation protocols for prompt engineering, structured AI generation, and vector index integrations.

## Overview

Use these guidelines when:
- Writing or refactoring prompt templates.
- Integrating LLM APIs (e.g. Gemini, OpenAI) into backend services.
- Designing schema parsers to parse JSON responses from language models.
- Optimizing search context or retrieval-augmented generation (RAG) structures.

## Protocols

### Step 1: Prompt Guidelines
- **Role and Persona**: Always assign a specific role/expertise to the system instructions.
- **Output Formats**: Enforce schema structure using structured schemas (e.g., JSON schemas) rather than raw text requests whenever possible.
- **Sanitization**: Strip markdown enclosing tags (like ` ```json ` and ` ``` `) from model outputs before running JSON parsers.

### Step 2: Evaluation Playground
Test and measure token costs or formatting issues before writing logic:
```bash
python3 .agent/skills/ai-engineer/scripts/test_prompt.py --system "You are an assistant" --user "Hello"
```

## Available Scripts

- **`test_prompt.py`**: Sandbox utility simulating LLM response shapes, estimating word counts and computing basic metrics.
  - Usage: `python3 .agent/skills/ai-engineer/scripts/test_prompt.py --system <sysText> --user <userText>`
