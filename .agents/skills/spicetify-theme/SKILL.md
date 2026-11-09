---
name: spicetify-theme
description: Build and change the spotineu Spicetify theme for the Spotify desktop client — color.ini colour schemes, user.css styling, optional theme.js and assets. Use this whenever the task touches anything under theme/, adds or tweaks a colour scheme, restyles part of the Spotify UI (sidebar, player bar, cards, track list, top bar, fonts, spacing, radii), hunts for a CSS selector in Spotify, or fixes a theme that broke after a Spotify update — even if the user just says "make the sidebar darker" or "change the accent colour". Pair it with the spicetify-test skill to verify every change.
---

# Spicetify theme development (spotineu)

This repo holds one Spicetify theme called **spotineu**. Spicetify patches the
installed Spotify client: it turns `color.ini` into CSS variables, injects
`user.css` (and `theme.js`), and copies `assets/` into Spotify's `xpui` folder.

Docs: <https://spicetify.app/docs/development/themes>. The docs are thin and
partly wrong (see the `#` trap below); the behaviour here comes from the
Spicetify CLI source (`src/apply/apply.go`, `src/utils/color.go`).

## Repo layout

```
theme/                 # the theme itself — symlinked into Spicetify
  color.ini            # required: colour schemes
  user.css             # required: styles (may start empty)
  theme.js             # optional: runs inside Spotify
  assets/              # optional: fonts, images (needs overwrite_assets = 1)
scripts/
  link-theme.sh        # symlink theme/ -> ~/.config/spicetify/Themes/spotineu
  check-theme.mjs      # static checks (see spicetify-test)
  snap.sh, inspect.sh  # live screenshots and DOM inspection over CDP
.agents/skills/        # these skills
```

Only edit files in `theme/`. Never edit files inside `Spotify.app` directly;
`spicetify apply` overwrites them.

First-time setup, once `theme/color.ini` and `theme/user.css` exist:

```bash
scripts/link-theme.sh --activate <scheme>   # links, saves the previous theme to .previous-theme, applies
```

`--activate` changes the user's active theme and restarts Spotify. Do it once,
then use watch mode (see spicetify-test) for the edit loop.

## Workflow

1. **Follow the design language.** Every visual decision (shadow, radius,
   colour, state, font) comes from the `spotineu-design` skill. Load it before
   styling anything and read its components.md section for the area you are
   working on. Ask before broad visual changes or before adding new tokens.
2. **Colours first.** Get `color.ini` right before writing CSS. A good scheme
   alone changes most of the UI, because Spicetify rewrites Spotify's own
   colours to `--spice-*` variables (`replace_colors = 1`).
3. **Then CSS, one area at a time.** Sidebar, then player bar, and so on.
   Find selectors on the live client (see [references/selectors.md](references/selectors.md)).
4. **Verify after each change** with the spicetify-test skill: static check,
   then look at the live client. Do not stack many unverified edits.

## color.ini

Each `[section]` is one colour scheme. The user picks one with
`spicetify config color_scheme <name>`. An unknown name silently falls back to
the first section.

```ini
; comments start with ; (or #)
[light]
text               = 3b3d47
main               = e8eaf0
; ... all 18 base keys ...
neu-light          = ffffff
neu-dark           = b8bdcc
on-accent          = ffffff
```

The design language sets how the keys relate (one surface value for
`main`/`sidebar`/`player`/`card`/`main-elevated`, plus the custom keys
`neu-light`, `neu-dark` and `on-accent`). Full contract and complete example
schemes: `spotineu-design` → references/tokens.md.

Rules:

- **Never write `#` before a hex value.** Spicetify parses the file with go-ini,
  where `#` or `;` anywhere in a value starts a comment. `main = #14141c` becomes
  an empty value and renders as Spotify's default. Write `main = 14141c`.
- Valid values: 6- or 3-digit hex without `#`, decimal `r,g,b`, `${ENV_VAR}`,
  or (Linux) `${xrdb:name:fallback}`. No alpha. Use `rgba()` in CSS for alpha.
- Define **all 18 base keys** in every scheme. Missing keys fall back to stock
  Spotify colours (green buttons, grey surfaces), which leak into the theme.
- Each key `foo` becomes `--spice-foo: #rrggbb` and `--spice-rgb-foo: r,g,b`.
- Custom keys are allowed (`accent = ...` → `--spice-accent`). Add them to every
  scheme or the variable is undefined in some schemes.
- Keys are case-insensitive. Keep them lowercase-kebab.

What each key paints, its default, and the Encore tokens it maps to:
[references/color-keys.md](references/color-keys.md). Read it before you
design or change a scheme.

## user.css

- Use variables, not literal colours: `var(--spice-main)`, and for alpha
  `rgba(var(--spice-rgb-main), 0.6)`. Never `rgba(var(--spice-main), …)`.
  Then every scheme works without extra CSS.
- **Remap Encore tokens before you write selectors.** Spotify's design system
  (Encore) reads tokens like `--background-base`, `--text-subdued` and
  `--essential-base`. Spicetify maps most of them to `--spice-*`, but several
  stay hard-coded (for example `--background-elevated-press`,
  `--essential-subdued`, `--decorative-subdued`, negative/warning colours).
  Override them once, then whole component families follow:

  ```css
  .encore-dark-theme,
  .encore-dark-theme .encore-base-set {
    --essential-subdued: var(--spice-misc);
    --decorative-subdued: var(--spice-highlight-elevated);
    --background-elevated-press: var(--spice-highlight);
  }
  ```

  Spotify puts Encore styles in `@layer encore`. Unlayered rules in
  `user.css` win over layered rules whatever the specificity, so you rarely
  need `!important` against Encore. You still may need it against Spotify's
  unlayered module CSS.
- Selector priority, most to least stable: `[data-testid="…"]`, ARIA roles and
  landmarks, `encore-*` classes, readable Spicetify-mapped classes
  (`main-*`, `x-*`), then build-hashed classes (`.Y_WW1akjiQKXSzCBalCD`) as a
  last resort. Do not use `aria-label` text; it is localised. Details and
  discovery commands: [references/selectors.md](references/selectors.md).
- Put any hashed-class rules in a section at the end of `user.css` headed
  `/* ==== FRAGILE: hashed classes, recheck after Spotify updates ==== */`,
  with a comment naming the element each one targets.
- Organise `user.css` by UI area with clear section comments
  (`/* ==== Tokens ==== */`, `/* ==== Sidebar ==== */`, `/* ==== Player bar ==== */`).
  The first section is `/* ==== Tokens ==== */`, copied from
  `spotineu-design` → references/tokens.md. Theme custom properties are
  prefixed `--sn-`. Component rules outside Tokens use only tokens and
  `--spice-*` roles; the checker warns about literal colours, shadows and
  radii.
- Keep `!important` to cases where you checked that specificity or layers
  cannot win.
- Prefer CSS over `theme.js`. Most changes do not need JavaScript.

## Fonts and assets

- Files in `theme/assets/` are copied into Spotify's `xpui/` root (merged, not
  into an `assets/` subfolder), only when `overwrite_assets = 1` (it is on in
  this setup). Reference them relative to `xpui/`: put a font at
  `theme/assets/fonts/spotineu/Inter.woff2` and use
  `url("fonts/spotineu/Inter.woff2")`. Use a theme-specific subfolder so you do
  not overwrite Spotify's own files.
- Spotify's text uses `--encore-title-font-stack`, `--encore-body-font-stack`
  and `--encore-variable-font-stack`. Override these variables first, then
  chase leftovers (some locale-specific `CircularSp-*` families are set
  directly).
- Remote `@import` of web fonts works but needs network at startup. Prefer
  bundled files.

## theme.js (optional)

Use it only for things CSS cannot do (reacting to the current track, adding
classes for state). It loads with `defer` before Spotify finishes booting, so
wait for the APIs. Read [references/theme-js.md](references/theme-js.md)
before you add one.

## After a Spotify update

Spotify updates replace patched files and often rename hashed classes.

1. `spicetify backup apply` (or `spicetify restore backup apply` if that fails).
2. Run `node scripts/check-theme.mjs`. The "classes not found" warning lists
   selectors that no longer exist in the installed build.
3. Re-find those elements on the live client and update the FRAGILE section.

## Restoring the user's previous theme

`scripts/link-theme.sh --activate` saved it in `.previous-theme` as
`theme|scheme`:

```bash
IFS='|' read -r t s < .previous-theme
spicetify config current_theme "$t" color_scheme "$s" && spicetify apply
```
