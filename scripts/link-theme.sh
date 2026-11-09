#!/usr/bin/env bash
# Symlink ./theme into Spicetify's Themes folder as "spotineu". Safe to re-run.
#   scripts/link-theme.sh            # link only
#   scripts/link-theme.sh --activate [scheme]   # also set current_theme (+ color_scheme) and apply
set -euo pipefail

NAME="spotineu"
REPO="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$REPO/theme"
USERDATA="$(spicetify path userdata 2>/dev/null || true)"
[ -n "$USERDATA" ] || USERDATA="$HOME/.config/spicetify"
DEST="$USERDATA/Themes/$NAME"

[ -d "$SRC" ] || { echo "✖ $SRC does not exist. Create theme/color.ini and theme/user.css first." >&2; exit 1; }
mkdir -p "$USERDATA/Themes"

if [ -L "$DEST" ]; then
  current="$(readlink "$DEST")"
  if [ "$current" != "$SRC" ]; then
    echo "✖ $DEST already links to $current (expected $SRC). Remove it manually if that is stale." >&2
    exit 1
  fi
  echo "✔ $DEST already links to $SRC"
elif [ -e "$DEST" ]; then
  echo "✖ $DEST exists and is not a symlink. Move it away first; refusing to overwrite." >&2
  exit 1
else
  ln -s "$SRC" "$DEST"
  echo "✔ Linked $DEST -> $SRC"
fi

if [ "${1:-}" = "--activate" ]; then
  prev_theme="$(spicetify config current_theme 2>/dev/null || true)"
  prev_scheme="$(spicetify config color_scheme 2>/dev/null || true)"
  if [ "$prev_theme" != "$NAME" ]; then
    echo "$prev_theme|$prev_scheme" > "$REPO/.previous-theme"
    echo "ℹ Saved previous theme ($prev_theme / $prev_scheme) to .previous-theme"
  fi
  if [ -n "${2:-}" ]; then
    spicetify config current_theme "$NAME" color_scheme "$2"
  else
    spicetify config current_theme "$NAME"
  fi
  spicetify apply
fi
