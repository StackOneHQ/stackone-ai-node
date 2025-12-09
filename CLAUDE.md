# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Skills and Rules Structure

Claude skills (`.claude/skills/`) are the source of truth. Cursor rules (`.cursor/rules/`) are symlinks to skill files for consistency.

## Available Skills

| Skill                    | When to Use                                                            |
| ------------------------ | ---------------------------------------------------------------------- |
| **development-workflow** | Build commands, testing, linting, git workflow, commit conventions     |
| **typescript-patterns**  | Writing/reviewing TypeScript - type safety, exhaustiveness, clean code |
| **typescript-testing**   | Writing tests - Vitest, MSW mocking, fs-fixture                        |
| **file-operations**      | Making HTTP requests - native fetch patterns                           |
| **orama-integration**    | Integrating with Orama search/indexing                                 |
