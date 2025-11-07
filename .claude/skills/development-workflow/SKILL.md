---
name: development-workflow
description: Build, development, and code quality commands for StackOne SDK
---

# Development Workflow

This skill provides all commands and best practices for building, developing, and maintaining code quality in the StackOne SDK.

## Building and Development

- `bun run build` - Build the project using tsdown
- `bun run rebuild` - Fetch latest OpenAPI specs and rebuild everything
- `bun run dev` - Watch mode for development (builds on file changes)
- `bun run fetch:specs` - Update OpenAPI specifications from remote

## Testing

- `bun run test` - Run all tests (unit, examples, scripts)
- `bun run test:unit` - Run only unit tests
- `bun test src/path/to/file.spec.ts` - Run a specific test file
- `bun test -t "test name"` - Run tests matching a pattern

## Code Quality

- `bun run lint` - Run Biome linter
- `bun run format` - Format code with Biome
- `bun run typecheck` - Type check with tsgo
- `bun run lint:fix` - Auto-fix linting issues

## Documentation

- `bun run docs:build` - Build MkDocs documentation
- `bun run docs:serve` - Serve docs locally
- `bun run docs:deploy` - Deploy docs to GitHub Pages

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

Always run `bun run rebuild` when:
- Updating OpenAPI specifications
- After pulling spec changes
- Before committing generated files

### Development Flow

1. Create feature branch: `git checkout -b feature-name`
2. Make changes to source files
3. Run type checking: `bun run typecheck`
4. Run linter: `bun run lint:fix`
5. Run tests: `bun run test`
6. Format code: `bun run format`
7. Rebuild if specs changed: `bun run rebuild`
8. Commit with detailed messages
9. Push and create PR: `gh pr create`

## Troubleshooting

### Command Failures
If `bunx <command>` fails, try `bun x <command>` instead.

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
Use the TypeScript exhaustiveness pattern (`satisfies never`) when branching on unions. See `openapi-architecture` skill for examples.

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
1. Ensure all tests pass: `bun run test`
2. Verify type checking: `bun run typecheck`
3. Build documentation: `bun run docs:build`
4. Bump version in package.json
5. Create release commit
6. Push to main or create release PR
7. Deploy docs: `bun run docs:deploy`
