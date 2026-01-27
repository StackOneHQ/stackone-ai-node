---
description: pnpm package manager commands and troubleshooting. (project)
alwaysApply: true
---

# pnpm Usage

This rule provides guidance on using pnpm in the StackOne SDK.

## Building

- `pnpm build` - Build the project using tsdown

## Testing

- `pnpm test` - Run all tests (unit, examples, scripts)
- `pnpm vitest src/path/to/file.test.ts` - Run a specific test file
- `pnpm vitest -t "test name"` - Run tests matching a pattern

## Code Quality

- `pnpm lint` - Run oxfmt/oxlint/knip linter
- `pnpm format` - Format code with oxfmt/oxlint/knip

## Command Execution

- `pnpm <script>` - Run a script defined in package.json
- `pnpm exec <command>` - Run a command from node_modules/.bin
- `pnpm dlx <package>` - Run a package without installing (like npx)

## Troubleshooting

If `pnpm exec <command>` fails, try `pnpm dlx <command>` instead.

If bash commands fail, try running with fish shell:

```bash
fish -c "<command>"
```

## Common Issues

1. **Script not found**: Check package.json scripts section
2. **Binary not found**: Use `pnpm dlx` instead of `pnpm exec`
3. **Permission errors**: Check node_modules permissions

## Security Settings

The project uses pnpm security settings to protect against supply chain attacks.
These are configured in `pnpm-workspace.yaml`:

| Setting                     | Purpose                                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `strictDepBuilds: true`     | Blocks lifecycle scripts (postinstall, etc.) by default. Only packages in `onlyBuiltDependencies` can run build scripts. |
| `blockExoticSubdeps: true`  | Blocks dependencies from non-registry sources (Git repos, tarball URLs).                                                 |
| `trustPolicy: no-downgrade` | Prevents trust level downgrades between versions (e.g., from GitHub OIDC to basic auth).                                 |

If a new dependency requires build scripts, add it to `onlyBuiltDependencies` in `pnpm-workspace.yaml`.

Reference: https://pnpm.io/settings

## Publishing & Deployment

When ready to release:

1. Ensure all tests pass: `pnpm test`
2. Bump version in package.json
3. Create release commit
4. Push to main or create release PR
