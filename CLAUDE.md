# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rules and Skills Structure

- **Rules** (`.claude/rules/`): Automatically loaded based on file paths. Source of truth for project conventions.
- **Skills** (`.claude/skills/`): Managed by Nix via [agent-skills-nix](https://github.com/Kyure-A/agent-skills-nix). Skills are sourced from [StackOneHQ/skills](https://github.com/StackOneHQ/skills) and installed automatically when entering `nix develop`.
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

| Skill                 | Usage                       | Description                                        |
| --------------------- | --------------------------- | -------------------------------------------------- |
| **orama-integration** | N/A                         | Integrating with Orama search/indexing             |
| **release-please**    | `/release-please <version>` | Trigger a release-please PR for a specific version |
