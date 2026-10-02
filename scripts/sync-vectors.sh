#!/usr/bin/env bash
# Copy the shared test vectors from a StackOneHQ/sdk-conformance checkout into tests/vectors/,
# byte for byte. Check the checkout out at the commit CI pins (the conformance job in
# .github/workflows/ci.yaml), which fails if the two differ.
#
# Usage: scripts/sync-vectors.sh <sdk-conformance checkout>
set -euo pipefail

if [ "$#" -ne 1 ]; then
	echo "usage: $0 <sdk-conformance checkout>" >&2
	exit 2
fi
source_dir="$1/vectors"
if [ ! -d "$source_dir" ]; then
	echo "$source_dir does not exist" >&2
	exit 1
fi
target_dir="$(cd "$(dirname "$0")/.." && pwd)/tests/vectors"

rm -rf "$target_dir"
cp -R "$source_dir" "$target_dir"
echo "Copied $source_dir to $target_dir"
