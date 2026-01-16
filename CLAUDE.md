# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rules and Skills Structure

- **Rules** (`.claude/rules/`): Automatically loaded based on file paths. Source of truth for project conventions.
- **Skills** (`.claude/skills/`): Manually invoked for specific integrations.
- **Cursor rules** (`.cursor/rules/`): Symlinks to `.claude/rules/` for consistency.

## Available Rules

| Rule                     | Applies To     | Description                                        |
| ------------------------ | -------------- | -------------------------------------------------- |
| **pnpm-usage**           | All files      | pnpm commands and troubleshooting                  |
| **git-workflow**         | All files      | Commit conventions, branch strategy, PR guidelines |
| **development-workflow** | All files      | Code style, file naming, project conventions       |
| **nix-workflow**         | All files      | Nix development environment and CI setup           |
| **typescript-patterns**  | `**/*.ts`      | Type safety, exhaustiveness checks, clean code     |
| **typescript-testing**   | `**/*.test.ts` | Vitest, MSW mocking, fs-fixture                    |
| **file-operations**      | `**/*.ts`      | Native fetch API patterns and error handling       |

## Available Skills

| Skill                 | When to Use                            |
| --------------------- | -------------------------------------- |
| **orama-integration** | Integrating with Orama search/indexing |
