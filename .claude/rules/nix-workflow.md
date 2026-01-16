# Nix Workflow

This rule provides guidance on Nix usage in the StackOne SDK.

## Development Environment

The project uses `flake.nix` to define the development environment with `nix develop`.

### Adding Development Tools

To add a new tool to the development environment, add it to `buildInputs` in `flake.nix`:

```nix
buildInputs = with pkgs; [
  # runtime
  nodejs_24
  pnpm_10

  # formatting and linting tools
  oxlint  # includes tsgolint
  oxfmt

  # your new tool here
  new-tool
];
```

## CI Workflow

CI uses `nix profile install` via the `.github/actions/setup-nix/action.yaml` composite action.

### Adding Tools to CI Jobs

Specify tools in the `tools` input of the setup-nix action:

```yaml
- name: Setup Nix
  uses: ./.github/actions/setup-nix
  with:
    tools: nodejs_24 pnpm_10 oxlint oxfmt
```

The action installs packages using:

```bash
nix profile install --inputs-from . nixpkgs#tool1 nixpkgs#tool2
```

### CI Tool Configuration

- **Default tools**: `nodejs_24 pnpm_10` (defined in action.yaml)
- **Skip pnpm install**: Set `skip-pnpm-install: 'true'` for jobs that don't need node dependencies

### Example: Adding a New Tool to Lint Job

```yaml
lint:
  runs-on: ubuntu-latest
  steps:
    - name: Checkout repository
      uses: actions/checkout@v4
    - name: Setup Nix
      uses: ./.github/actions/setup-nix
      with:
        tools: nodejs_24 pnpm_10 oxlint oxfmt new-tool
    - name: Run Lint
      run: pnpm run lint
```

## Build Flags

Always use these flags when running Nix build commands locally:

```bash
--print-build-logs --show-trace
```

Example:

```bash
nix build --print-build-logs --show-trace
nix flake check --print-build-logs --show-trace
```

## Notes

- Some packages bundle multiple tools (e.g., `oxlint` includes `tsgolint`)
- Check nixpkgs for package contents before adding redundant dependencies
