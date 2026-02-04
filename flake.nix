{
  description = "StackOne AI Node SDK development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";

    # Agent skills management
    agent-skills.url = "github:Kyure-A/agent-skills-nix";
    agent-skills.inputs.nixpkgs.follows = "nixpkgs";

    # StackOne skills repository (non-flake)
    stackone-skills.url = "github:StackOneHQ/skills";
    stackone-skills.flake = false;
  };

  outputs =
    {
      nixpkgs,
      agent-skills,
      stackone-skills,
      ...
    }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "aarch64-darwin"
      ];
      forAllSystems = nixpkgs.lib.genAttrs systems;

      # Agent skills configuration
      agentLib = agent-skills.lib.agent-skills;
      sources = {
        stackone = {
          path = stackone-skills;
          subdir = ".";
        };
      };
      catalog = agentLib.discoverCatalog sources;
      allowlist = agentLib.allowlistFor {
        inherit catalog sources;
        enable = [
          "orama-integration"
          "release-please"
        ];
      };
      selection = agentLib.selectSkills {
        inherit catalog allowlist sources;
        skills = { };
      };
    in
    {
      devShells = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
          bundle = agentLib.mkBundle { inherit pkgs selection; };
          # Use symlink-tree instead of copy-tree for skills
          localTargets = {
            claude = {
              dest = ".claude/skills";
              structure = "symlink-tree";
              enable = true;
              systems = [ ];
            };
          };
        in
        {
          default = pkgs.mkShellNoCC {
            buildInputs = with pkgs; [
              # runtime
              nodejs_24
              pnpm_10
              typescript-go

              # formatting and linting tools
              similarity
              nixfmt
              oxlint
              oxfmt

              # security
              gitleaks

              # git hooks
              lefthook
            ];

            shellHook = ''
              echo "StackOne AI Node SDK development environment"

              # Install dependencies only if node_modules/.pnpm/lock.yaml is older than pnpm-lock.yaml
              if [ ! -f node_modules/.pnpm/lock.yaml ] || [ pnpm-lock.yaml -nt node_modules/.pnpm/lock.yaml ]; then
                echo "Installing dependencies..."
                pnpm install --frozen-lockfile
              fi

              # Install lefthook git hooks
              lefthook install > /dev/null 2>&1
            ''
            + agentLib.mkShellHook {
              inherit pkgs bundle;
              targets = localTargets;
            };
          };
        }
      );
    };
}
