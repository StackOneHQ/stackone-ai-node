{
  description = "StackOne AI Node SDK development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-parts.url = "github:hercules-ci/flake-parts";
  };

  outputs =
    inputs@{ flake-parts, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "aarch64-darwin"
      ];

      perSystem =
        { pkgs, system, ... }:
        {
          packages.default =
            let
              packageJson = builtins.fromJSON (builtins.readFile ./package.json);
              pnpmDepsHash = {
                x86_64-linux = "sha256-PrCGXf5r03gfsoGJAzew592Al1G5dx6xa/qFxazuqUo=";
                aarch64-linux = "sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
                aarch64-darwin = "sha256-GDY7RZUl6A0d3l8Rz6X1sHQfwHgM2GKpcJ65yAKOmrg=";
              };
            in
            pkgs.stdenv.mkDerivation (finalAttrs: {
              pname = "stackone-ai";
              version = packageJson.version;

              src = ./.;

              nativeBuildInputs = with pkgs; [
                nodejs_24
                pnpm_10
                pnpm_10.configHook
              ];

              pnpmDeps = pkgs.pnpm_10.fetchDeps {
                inherit (finalAttrs) pname version src;
                hash = pnpmDepsHash.${system};
                fetcherVersion = 1;
              };

              buildPhase = ''
                runHook preBuild
                pnpm run build
                runHook postBuild
              '';

              installPhase = ''
                runHook preInstall
                mkdir -p $out
                pnpm pack --pack-destination $out
                runHook postInstall
              '';
            });

          devShells.default = pkgs.mkShell {
            buildInputs = with pkgs; [
              # runtime
              nodejs_24
              pnpm_10

              # formatting and linting tools
              similarity
              nixfmt-rfc-style
              typos
              typos-lsp
            ];

            shellHook = ''
              echo "StackOne AI Node SDK development environment"

              # Install dependencies only if node_modules/.pnpm/lock.yaml is older than pnpm-lock.yaml
              if [ ! -f node_modules/.pnpm/lock.yaml ] || [ pnpm-lock.yaml -nt node_modules/.pnpm/lock.yaml ]; then
                echo "📦 Installing dependencies..."
                pnpm install --frozen-lockfile
              fi
            '';
          };
        };
    };
}
