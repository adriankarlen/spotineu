# color.ini keys

The 18 base keys Spicetify knows (from `BaseColorList` in
`spicetify/cli/src/utils/color.go`). If a scheme omits one, the default is
used. Every key `k` becomes `--spice-k` (hex) and `--spice-rgb-k` (`r,g,b`)
in `xpui/colors.css`.

| Key | Default | What it paints (approximate, varies by Spotify version) |
|---|---|---|
| `text` | `ffffff` | Main text, headings, playlist names, primary icons |
| `subtext` | `b3b3b3` | Secondary text: artist names, metadata, inactive nav items |
| `main` | `121212` | Main view background |
| `main-elevated` | `242424` | Surfaces above main: menus, popovers, hover rows |
| `highlight` | `1a1a1a` | Hover background on main surfaces |
| `highlight-elevated` | `2a2a2a` | Hover background on elevated surfaces |
| `sidebar` | `000000` | Window frame / gaps between panels, left sidebar, pressed states |
| `player` | `181818` | Now-playing bar background |
| `card` | `282828` | Cards, inputs, dropdowns |
| `shadow` | `000000` | Drop shadows; text on buttons in some places |
| `selected-row` | `ffffff` | Selected track row, scrollbar, some icons |
| `button` | `1db954` | Secondary accent buttons, like button, now-playing track title |
| `button-active` | `1ed760` | Primary accent: big play button, active toggles, progress fill |
| `button-disabled` | `535353` | Seek and volume bar track, borders, disabled controls |
| `tab-active` | `333333` | Active tab/chip background |
| `notification` | `4687d6` | Info toast background |
| `notification-error` | `e22134` | Error toast background |
| `misc` | `7f7f7f` | Leftovers; free to use as a muted accent in user.css |

The table is a guide, not a contract. Spotify's markup changes often. Confirm
on the live client with `scripts/inspect.sh style '<selector>'` before relying
on a mapping.

## How Spotify's colours become --spice-* variables

With `replace_colors = 1`, Spicetify rewrites known hex values in Spotify's CSS
to `var(--spice-*)`. In this build (Spotify 1.3.6) the dark Encore base set
ends up as:

| Encore token | Value after Spicetify |
|---|---|
| `--background-base` | `var(--spice-main)` |
| `--background-highlight` | `var(--spice-main-elevated)` |
| `--background-press` | `var(--spice-sidebar)` |
| `--background-elevated-base` | `var(--spice-main-elevated)` |
| `--background-elevated-highlight` | `var(--spice-highlight-elevated)` |
| `--background-elevated-press` | `#191919` (not mapped) |
| `--background-tinted-*` | `rgba(var(--spice-rgb-text), 0.10 / 0.14 / 0.21)` |
| `--text-base`, `--essential-base`, `--decorative-base` | `var(--spice-text)` |
| `--text-subdued` | `var(--spice-subtext)` |
| `--text-bright-accent`, `--text-positive`, `--essential-bright-accent`, `--essential-positive` | `var(--spice-button-active)` |
| `--essential-subdued` | `#7c7c7c` (not mapped) |
| `--decorative-subdued` | `#292929` (not mapped) |
| `--text-negative` / `--essential-negative` | `#f3727f` / `#ed2c3f` (not mapped) |
| `--text-warning` / `--essential-warning` | `#ffa42b` (not mapped) |
| `--text-announcement` / `--essential-announcement` | `#539df5` / `#1278f2` (not mapped) |

Other Encore colour sets (`.encore-bright-accent-set`, `.encore-inverted-set`,
`.encore-over-media-set`, `.encore-negative-set`, and so on) have their own
values, many still hard-coded Spotify greens like `#3be477` and `#1abc54`. If
green shows up somewhere, look for one of these sets on an ancestor and remap
its tokens in user.css.

To regenerate this table for the installed build:

```bash
X="$(spicetify config spotify_path)/Apps/xpui"
tr '}' '\n' < "$X/xpui-snapshot.css" | grep '^@layer encore{.encore-dark-theme' | tr ';' '\n'
grep -oh '\.encore-[a-z-]*-set' "$X"/*.css | sort -u   # all colour sets
```

## Designing a scheme

- Build surfaces as a ladder: `sidebar` ≤ `main` < `main-elevated` / `card` <
  `highlight` < `highlight-elevated` (for dark schemes; reverse for light).
  Small steps (3–6 % lightness) read as depth; big jumps look patchy.
- Check contrast: `text` on `main` ≥ 7:1, `subtext` on `main` ≥ 4.5:1,
  text on `button-active` (often `shadow` or `sidebar`) ≥ 4.5:1.
- `button` and `button-active` are the accent. Keep them close in hue.
- For a light scheme, every surface key flips. Also set `shadow` to something
  soft, since it is used for text on accent buttons in places.
