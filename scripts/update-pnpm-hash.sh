#!/usr/bin/env bash
set -euo pipefail

# Update pnpm deps hash in flake.nix for the current system
# This script runs nix build to get the correct hash and updates flake.nix

FLAKE_FILE="flake.nix"

# Check if flake.nix exists
if [[ ! -f "$FLAKE_FILE" ]]; then
  echo "Error: $FLAKE_FILE not found"
  exit 1
fi

# Detect current system
SYSTEM=$(nix eval --impure --raw --expr 'builtins.currentSystem')
echo "Current system: $SYSTEM"

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

  echo "New hash for $SYSTEM: $NEW_HASH"

  # Update the hash for current system in flake.nix
  sed -i.bak "s|${SYSTEM} = \"sha256-[^\"]*\"|${SYSTEM} = \"${NEW_HASH}\"|" "$FLAKE_FILE"
  rm -f "${FLAKE_FILE}.bak"

  echo "Updated $FLAKE_FILE with new hash for $SYSTEM"
else
  echo "Hash is up to date for $SYSTEM"
fi
