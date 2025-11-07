# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

See the **development-workflow** skill for detailed commands and guidelines:
- Building, development, and watch modes
- Testing strategies
- Code quality and linting
- Documentation generation

Refer to `.claude/skills/development-workflow/SKILL.md` for complete information.

## Architecture Overview

See the **openapi-architecture** skill for comprehensive architecture documentation:
- Core components (Tool Class, ToolSets, OpenAPI Processing, Request Builder)
- Design patterns and principles
- TypeScript exhaustiveness checks
- Development workflow

Refer to `.claude/skills/openapi-architecture/SKILL.md` for complete details.

### Testing Strategy

See the **typescript-testing** skill for comprehensive testing guidance:
- Bun test runner setup and commands
- MSW (Mock Service Worker) patterns
- File system testing with fs-fixture
- Test organization and best practices

Refer to `.claude/skills/typescript-testing/SKILL.md` for complete details.

## TypeScript Patterns and Standards

See the **typescript-patterns** skill for TypeScript best practices:
- `satisfies never` exhaustiveness checking
- Avoiding `any`, non-null assertions, and parameter reassignment
- Class vs namespace patterns
- Explicit return types and type-safe operations

Refer to `.claude/skills/typescript-patterns/SKILL.md` for complete details.

## File Operations and HTTP Standards

See the **file-operations** skill for file and HTTP guidance:
- Using `src/utils/file.ts` utilities instead of direct fs/path
- Native fetch API standards and error handling
- Type-safe file operations
- Common HTTP request patterns

Refer to `.claude/skills/file-operations/SKILL.md` for complete details.

## Orama Integration

See the **orama-integration** skill for Orama API guidance:
- Orama concepts (indexes, data sources, deployments)
- Creating and configuring indexes
- Full-text, vector, and hybrid search patterns
- Answer engine configuration and quality checks
- Common integration patterns and examples

Refer to `.claude/skills/orama-integration/SKILL.md` for complete details.
