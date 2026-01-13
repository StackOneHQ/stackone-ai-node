{
  description = "StackOne AI Node SDK development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs =
    { nixpkgs, ... }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "aarch64-darwin"
      ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
    in
    {
      devShells = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          default = pkgs.mkShellNoCC {
            buildInputs = with pkgs; [
              # runtime
              nodejs_24
              pnpm_10

              # formatting and linting tools
              similarity
              nixfmt
              tsgolint
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
                echo "📦 Installing dependencies..."
                pnpm install --frozen-lockfile
              fi

              # Install lefthook git hooks
              lefthook install > /dev/null 2>&1
            '';
          };
        }
      );
    };
}
