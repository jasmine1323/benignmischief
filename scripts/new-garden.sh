#!/usr/bin/env bash
#
# Create a new project garden.
#
# Usage:
#   scripts/new-garden.sh <slug> "<Title>"
#
# Example:
#   scripts/new-garden.sh moon-notes "Moon Notes"
#
# This:
#   1. creates gardens/<slug>/ with a starter index.md (open it as an Obsidian vault)
#   2. adds a link to it in gardens/index.md (the landing page)
#
# After running, add notes and `git push` — the deploy workflow builds every
# folder under gardens/ automatically and publishes it at
#   https://www.benignmischief.com/gardens/<slug>/
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GARDENS_DIR="$REPO_ROOT/gardens"
INDEX="$GARDENS_DIR/index.md"

slug="${1:-}"
title="${2:-}"

if [[ -z "$slug" || -z "$title" ]]; then
  echo "usage: scripts/new-garden.sh <slug> \"<Title>\"" >&2
  echo "example: scripts/new-garden.sh moon-notes \"Moon Notes\"" >&2
  exit 1
fi

# slugs must be url/folder safe
if ! [[ "$slug" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  echo "error: slug must be lowercase letters/numbers/hyphens, e.g. 'moon-notes'" >&2
  exit 1
fi

dir="$GARDENS_DIR/$slug"
if [[ -e "$dir" ]]; then
  echo "error: gardens/$slug already exists" >&2
  exit 1
fi

mkdir -p "$dir"
cat > "$dir/index.md" <<EOF
---
title: $title
---

A new garden — seeds go here.

Back to [[index|the gardens]].
EOF

# add a link into the landing page between the markers, if not already present
if grep -q "\[\[$slug/index" "$INDEX"; then
  echo "note: gardens/index.md already links to $slug, leaving it as is"
else
  # insert the bullet just before the closing marker
  tmp="$(mktemp)"
  awk -v line="- [[$slug/index|$title]] — a new garden" '
    /<!-- gardens:end -->/ { print line }
    { print }
  ' "$INDEX" > "$tmp"
  mv "$tmp" "$INDEX"
fi

echo "created gardens/$slug/  (open this folder as a vault in Obsidian)"
echo "linked it on the gardens landing page"
echo
echo "next: add notes, then commit & push. it will publish at"
echo "  https://www.benignmischief.com/gardens/$slug/"
