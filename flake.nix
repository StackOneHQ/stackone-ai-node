{
  description = "StackOne AI Node SDK development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            pnpm_10
          ];

          shellHook = ''
            echo "StackOne AI Node SDK development environment"
            echo "Node version: $(node --version)"
            echo "pnpm version: $(pnpm --version)"

            # Set up pnpm store directory
            export PNPM_HOME="$HOME/.local/share/pnpm"
            export PATH="$PNPM_HOME:$PATH"

            # Install dependencies using lockfile
            pnpm install --lockfile
          '';
        };
      }
    );
}
