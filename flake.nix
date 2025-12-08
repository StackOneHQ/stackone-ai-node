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

            # Install dependencies using lockfile
            pnpm install --lockfile
          '';
        };
      }
    );
}
