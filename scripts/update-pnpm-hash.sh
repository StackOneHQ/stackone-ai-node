#!/usr/bin/env bash
set -euo pipefail

# Update pnpm deps hash in flake.nix
# This script runs nix build to get the correct hash and updates flake.nix

FLAKE_FILE="flake.nix"

# Check if flake.nix exists
if [[ ! -f "$FLAKE_FILE" ]]; then
  echo "Error: $FLAKE_FILE not found"
  exit 1
fi

# Run nix build and capture the output
echo "Calculating pnpm deps hash..."
OUTPUT=$(nix build --no-link 2>&1 || true)

# Check if there's a hash mismatch
if echo "$OUTPUT" | grep -q "hash mismatch"; then
  # Extract the new hash
  NEW_HASH=$(echo "$OUTPUT" | grep "got:" | sed 's/.*got:[[:space:]]*//' | tr -d '[:space:]')

  if [[ -z "$NEW_HASH" ]]; then
    echo "Error: Could not extract new hash"
    exit 1
  fi

  echo "New hash: $NEW_HASH"

  # Update the hash in flake.nix (simple pattern for the hash line)
  sed -i.bak "s|hash = \"sha256-[^\"]*\"|hash = \"${NEW_HASH}\"|" "$FLAKE_FILE"
  rm -f "${FLAKE_FILE}.bak"

  echo "Updated $FLAKE_FILE with new hash"
else
  echo "Hash is up to date"
fi
