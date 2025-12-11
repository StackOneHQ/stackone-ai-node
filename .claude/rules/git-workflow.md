---
description: Git workflow, commit conventions, and pull request guidelines. (project)
alwaysApply: true
---

# Git Workflow

This rule provides guidance on git workflow, commit conventions, and pull request guidelines.

## Branch Strategy

- **Never push directly to main** without permission
- Create a new branch for changes
- Create a pull request to merge into main
- Use `git checkout -b feature-name` to start

## Development Flow

1. Create feature branch: `git checkout -b feature-name`
2. Make changes to source files
3. Run linter: `pnpm lint`
4. Run tests: `pnpm test`
5. Format code: `pnpm format`
6. Commit with detailed messages
7. Push and create PR: `gh pr create`

## Commit Strategy

Keep commits tiny but meaningful:

- Use git hunks (`-p` flag) to selectively commit changes
- Write detailed commit messages
- Ensure each commit is logically complete
- Use English for all commit messages

## Commit Message Format

Format: `type(scope): description`

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`, `perf`

Example:

```
feat(parser): add support for custom parameter transformers

- Add new transformer hooks to OpenAPI parser
- Enable pre-processing of tool parameters
- Implement docs for custom transformers
```

### Guidelines

- Keep each commit as tiny as possible
- Write detailed commit messages explaining the "why"
- Each commit should be meaningful (not just a single line change)
- Use git hunks (`-p` flag) to selectively commit related changes
- **Always use English** for commit messages
- Reference issues and PRs when relevant

### When Committing

1. Run `git diff` to review all changes
2. Use `git add -p` to review and stage hunks selectively
3. Write comprehensive message explaining the purpose
4. Verify with `git status` before committing

### File Moves for History Preservation

When moving files (e.g., migrating from skills to rules), combine the deletion and creation in a single commit so git treats it as a rename. This preserves file history.

```bash
# Instead of separate add/delete commits:
git add .claude/rules/new-file.md
git rm .claude/skills/old-file/SKILL.md
git commit -m "refactor(rules): migrate old-file to rules directory"
```

## Pull Request Guidelines

### PR Title Format

Use the same format as commit messages: `type(scope): description`

Examples:

- `feat(tools): add support for custom OpenAPI specs`
- `fix(parser): handle empty response bodies`
- `refactor(rules): unify cursor rules and claude rules`

### PR Body

Include:

- **Summary**: 1-3 bullet points describing changes
- **Test plan**: How to verify the changes work
- Reference related issues with `Closes #123` or `Fixes #123`
