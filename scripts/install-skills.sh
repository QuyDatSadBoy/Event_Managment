#!/usr/bin/env bash
# ===========================================================================
# Installs the design and review skills this project builds against into
# .claude/skills/. Run once per clone; the directory is git-ignored because the
# bundles carry ~13 MB of font indexes and icon catalogues.
#
#   ./scripts/install-skills.sh
#   ./scripts/install-skills.sh --update    re-clone even if already present
# ===========================================================================
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="$ROOT/.claude/skills"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

UPDATE=false
[[ "${1:-}" == "--update" ]] && UPDATE=true

if [[ -d "$DEST" && "$UPDATE" == false ]]; then
  echo "skills already installed at .claude/skills — pass --update to refresh"
  ls -1 "$DEST"
  exit 0
fi

mkdir -p "$DEST"

fetch() { # repo, then the sub-paths to copy out of it
  local repo="$1"; shift
  local name; name="$(basename "$repo")"
  echo "  fetching $repo"
  git clone -q --depth 1 "https://github.com/$repo.git" "$TMP/$name"
  for src in "$@"; do
    if [[ -d "$TMP/$name/$src" ]]; then
      cp -r "$TMP/$name/$src" "$DEST/"
    else
      echo "    (skipped missing $src)"
    fi
  done
}

echo "Installing skills into .claude/skills"

# Design direction and the craft floor the UI is held to.
fetch pbakaus/impeccable ".claude/skills/impeccable"

# UI/UX playbooks, design-system and styling references.
fetch nextlevelbuilder/ui-ux-pro-max-skill \
  ".claude/skills/ui-ux-pro-max" ".claude/skills/design" \
  ".claude/skills/design-system" ".claude/skills/ui-styling" ".claude/skills/brand"

# Vercel's guidance for React, performance and web interfaces.
fetch vercel-labs/agent-skills \
  "skills/web-design-guidelines" "skills/react-best-practices" \
  "skills/vercel-optimize" "skills/composition-patterns"

# Vercel's Web Interface Guidelines ship as a bare AGENTS.md; give it the
# frontmatter the skill loader expects.
git clone -q --depth 1 https://github.com/vercel-labs/web-interface-guidelines.git "$TMP/wig"
mkdir -p "$DEST/web-interface-guidelines"
{
  printf -- '---\nname: web-interface-guidelines\n'
  printf 'description: %s\n---\n\n' \
    "Vercel's Web Interface Guidelines — a checklist for interaction, animation, layout, content, forms, performance and accessibility to review any web UI against."
  cat "$TMP/wig/AGENTS.md"
} > "$DEST/web-interface-guidelines/SKILL.md"

# A catalogue of DESIGN.md files from real sites, useful as precedent.
git clone -q --depth 1 https://github.com/VoltAgent/awesome-design-md.git "$TMP/adm"
mkdir -p "$DEST/awesome-design-md/reference"
cp "$TMP/adm/README.md" "$DEST/awesome-design-md/reference/index.md"
cat > "$DEST/awesome-design-md/SKILL.md" <<'SKILL'
---
name: awesome-design-md
description: Reference index of DESIGN.md documents extracted from well-designed production websites. Use when you want a concrete precedent for a visual world - tokens, type scale, spacing rhythm, component treatments - rather than inventing one.
---

`reference/index.md` lists DESIGN.md files pulled from real sites, grouped by
category. Use them as precedent when choosing a visual direction; do not copy a
brand's identity wholesale.
SKILL

chmod +x "$DEST/impeccable/scripts/impeccable" 2>/dev/null || true

echo
echo "Installed:"
ls -1 "$DEST" | sed 's/^/  /'
echo
echo "This project's own visual rules live in DESIGN.md — read that first."
