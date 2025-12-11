---
description: Code style, file naming, and project conventions. (project)
alwaysApply: true
---

# Development Workflow

This rule provides code style guidelines and project conventions for the StackOne SDK.

## File Naming Conventions

- Use `.yaml` extension instead of `.yml` for all YAML files (e.g., `lefthook.yaml`, GitHub Actions workflows)

## Working with Tools

- Use semantic tools for code exploration (avoid full file reads when possible)
- Leverage symbol indexing for fast navigation
- Use grep/ripgrep for pattern matching
- Read only necessary code sections

## Code Style

- Follow existing patterns for error handling and logging
- Maintain TypeScript exhaustiveness for union types
- Include comprehensive JSDoc comments for public APIs

## TypeScript Guidelines

Use the TypeScript exhaustiveness pattern (`satisfies never`) when branching on unions. See `typescript-patterns` rule for examples.
