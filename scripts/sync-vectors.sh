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
if ! git -C "$1" rev-parse --git-dir >/dev/null 2>&1; then
	echo "$1 is not a git checkout" >&2
	exit 1
fi
if [ -n "$(git -C "$1" status --porcelain --ignored -- vectors)" ]; then
	echo "$source_dir has uncommitted or ignored-untracked changes" >&2
	exit 1
fi
target_dir="$(cd "$(dirname "$0")/.." && pwd)/tests/vectors"
tmp_dir="$target_dir.tmp"

rm -rf "$tmp_dir"
cp -R "$source_dir" "$tmp_dir"
rm -rf "$target_dir"
mv "$tmp_dir" "$target_dir"
echo "Copied $source_dir to $target_dir"
