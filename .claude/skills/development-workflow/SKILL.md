---
name: development-workflow
description: Build commands, testing, linting, git workflow, commit conventions, and file naming standards. (project)
globs: ""
alwaysApply: true
---

# Development Workflow

This skill provides all commands and best practices for building, developing, and maintaining code quality in the StackOne SDK.

## Building and Development

- `pnpm build` - Build the project using tsdown
- `pnpm rebuild` - Fetch latest OpenAPI specs and rebuild everything
- `pnpm dev` - Watch mode for development (builds on file changes)
- `pnpm fetch:specs` - Update OpenAPI specifications from remote

## Testing

- `pnpm test` - Run all tests (unit, examples, scripts)
- `pnpm vitest src/path/to/file.test.ts` - Run a specific test file
- `pnpm vitest -t "test name"` - Run tests matching a pattern

## Code Quality

- `pnpm lint` - Run Biome linter
- `pnpm format` - Format code with Biome
- `pnpm typecheck` - Type check with tsgo
- `pnpm lint:fix` - Auto-fix linting issues

## Documentation

- `pnpm docs:build` - Build MkDocs documentation
- `pnpm docs:serve` - Serve docs locally
- `pnpm docs:deploy` - Deploy docs to GitHub Pages

## Development Guidelines

### Commit Strategy
Keep commits tiny but meaningful:
- Use git hunks (`-p` flag) to selectively commit changes
- Write detailed commit messages
- Ensure each commit is logically complete
- Use English for all commit messages

### Git Workflow
- **Never push directly to main** without permission
- Create a new branch for changes
- Create a pull request to merge into main
- Use `git checkout -b feature-name` to start

### When to Rebuild

Always run `pnpm rebuild` when:
- Updating OpenAPI specifications
- After pulling spec changes
- Before committing generated files

### Development Flow

1. Create feature branch: `git checkout -b feature-name`
2. Make changes to source files
3. Run type checking: `pnpm typecheck`
4. Run linter: `pnpm lint:fix`
5. Run tests: `pnpm test`
6. Format code: `pnpm format`
7. Rebuild if specs changed: `pnpm rebuild`
8. Commit with detailed messages
9. Push and create PR: `gh pr create`

## Troubleshooting

### Command Failures
If `pnpm exec <command>` fails, try `pnpm dlx <command>` instead.

If bash commands fail, try running with fish shell:
```bash
fish -c "<command>"
```

## Commit Message Best Practices

### Guidelines
- Keep each commit as tiny as possible
- Write detailed commit messages explaining the "why"
- Each commit should be meaningful (not just a single line change)
- Use git hunks (`-p` flag) to selectively commit related changes
- **Always use English** for commit messages
- Reference issues and PRs when relevant

### Commit Structure
Format: `type(scope): description`

Example:
```
feat(parser): add support for custom parameter transformers

- Add new transformer hooks to OpenAPI parser
- Enable pre-processing of tool parameters
- Implement docs for custom transformers
```

### When Committing
1. Run `git diff` to review all changes
2. Use `git add -p` to review and stage hunks selectively
3. Write comprehensive message explaining the purpose
4. Verify with `git status` before committing

### TypeScript Issues
Use the TypeScript exhaustiveness pattern (`satisfies never`) when branching on unions. See `typescript-patterns` skill for examples.

## Pull Request Guidelines

### PR Title Format
Use the same format as commit messages: `type(scope): description`

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`, `perf`

Examples:
- `feat(tools): add support for custom OpenAPI specs`
- `fix(parser): handle empty response bodies`
- `refactor(skills): unify cursor rules and claude skills`

### PR Body
Include:
- **Summary**: 1-3 bullet points describing changes
- **Test plan**: How to verify the changes work
- Reference related issues with `Closes #123` or `Fixes #123`

## File Naming Conventions

- Use `.yaml` extension instead of `.yml` for all YAML files (e.g., `lefthook.yaml`, GitHub Actions workflows)

## Working with Tools

- Use semantic tools for code exploration (avoid full file reads when possible)
- Leverage symbol indexing for fast navigation
- Use grep/ripgrep for pattern matching
- Read only necessary code sections

## Code Style

- Follow existing patterns for error handling and logging
- Generate types from OpenAPI specs, don't write manually
- Maintain TypeScript exhaustiveness for union types
- Include comprehensive JSDoc comments for public APIs

## Performance Considerations

- Use lazy loading for tools to minimize memory usage
- Avoid loading all OpenAPI specs at startup
- Cache generated tool instances appropriately
- Consider framework-agnostic core design

## Publishing & Deployment

When ready to release:
1. Ensure all tests pass: `pnpm test`
2. Verify type checking: `pnpm typecheck`
3. Build documentation: `pnpm docs:build`
4. Bump version in package.json
5. Create release commit
6. Push to main or create release PR
7. Deploy docs: `pnpm docs:deploy`
