# Tokens

The token block below is the top of `theme/user.css` (the file is the source of truth if they differ), inside the
`/* ==== Tokens ==== */` section. Component rules use only these tokens and
`--spice-*` colour roles. The checker treats the Tokens section as the one
place where literal values are allowed.

The values were tuned on a test page against the main reference shot, in
both a light and a dark scheme.

## color.ini contract

Every scheme must define all 18 base keys plus three custom keys:

| Key | Role |
|---|---|
| `neu-light` | Highlight shadow (upper left) and the rim on raised edges |
| `neu-dark` | Shade shadow (lower right) and the outline of groups |
| `on-accent` | Icons and text on accent fills |

Base keys under this design:

- `main`, `sidebar`, `player`, `card`, `main-elevated` → all the **surface**
  value. One material.
- `highlight`, `highlight-elevated`, `tab-active` → surface moved 3–4 %
  towards `neu-dark` (used by Spotify for some hover backgrounds).
- `shadow` → same as `neu-dark`.
- `button`, `button-active` → the accent.
- `button-disabled` → between surface and `neu-dark` (Spotify uses it for
  bar tracks; we cover most of them with inset tracks).
- `selected-row` → `text`.
- `misc` → `subtext`.
- `notification` → accent. `notification-error` → a red with ≥ 4.5:1 for
  `on-accent`-style text.

The shadows are opaque colours (`color.ini` has no alpha). Tune how strong
the depth is with the colours themselves: move `neu-dark` towards the
surface for softer shadows, away for stronger ones.

## Example schemes

Starting points only. Palettes are free; keep the relationships.

```ini
[light]
text               = 3b3d47
subtext            = 72768a
main               = e8eaf0
main-elevated      = e8eaf0
sidebar            = e8eaf0
player             = e8eaf0
card               = e8eaf0
highlight          = dfe2ea
highlight-elevated = dfe2ea
tab-active         = dfe2ea
shadow             = b8bdcc
selected-row       = 3b3d47
button             = ff6b1a
button-active      = ff6b1a
button-disabled    = cfd3de
notification       = ff6b1a
notification-error = d93a4a
misc               = 72768a
neu-light          = ffffff
neu-dark           = b8bdcc
on-accent          = ffffff

[dark]
text               = e4e6ee
subtext            = 9a9eae
main               = 2b2e36
main-elevated      = 2b2e36
sidebar            = 2b2e36
player             = 2b2e36
card               = 2b2e36
highlight          = 32353e
highlight-elevated = 32353e
tab-active         = 32353e
shadow             = 17181d
selected-row       = e4e6ee
button             = ff7a33
button-active      = ff7a33
button-disabled    = 22242a
notification       = ff7a33
notification-error = ff5c6c
misc               = 9a9eae
neu-light          = 393d48
neu-dark           = 17181d
on-accent          = 1b1208
```

## Token block

```css
/* ==== Tokens ==== */
:root {
  /* Depth: one knob scales every shadow. Change only here, on :root. */
  --sn-depth: 1;

  --sn-hi: rgb(var(--spice-rgb-neu-light));
  --sn-lo: rgb(var(--spice-rgb-neu-dark));

  --sn-o1: calc(3px * var(--sn-depth));
  --sn-b1: calc(7px * var(--sn-depth));
  --sn-o2: calc(6px * var(--sn-depth));
  --sn-b2: calc(14px * var(--sn-depth));
  --sn-o3: calc(10px * var(--sn-depth));
  --sn-b3: calc(24px * var(--sn-depth));

  /* The thin bright rim on raised edges: the crisp look of the reference. */
  --sn-rim: inset 1px 1px 0 rgba(var(--spice-rgb-neu-light), 0.9);

  --sn-raised-1:
    calc(var(--sn-o1) * -1) calc(var(--sn-o1) * -1) var(--sn-b1) var(--sn-hi),
    var(--sn-o1) var(--sn-o1) var(--sn-b1) var(--sn-lo),
    var(--sn-rim);
  --sn-raised-2:
    calc(var(--sn-o2) * -1) calc(var(--sn-o2) * -1) var(--sn-b2) var(--sn-hi),
    var(--sn-o2) var(--sn-o2) var(--sn-b2) var(--sn-lo),
    var(--sn-rim);
  --sn-raised-3:
    calc(var(--sn-o3) * -1) calc(var(--sn-o3) * -1) var(--sn-b3) var(--sn-hi),
    var(--sn-o3) var(--sn-o3) var(--sn-b3) var(--sn-lo),
    var(--sn-rim);

  --sn-inset-1:
    inset var(--sn-o1) var(--sn-o1) var(--sn-b1) var(--sn-lo),
    inset calc(var(--sn-o1) * -1) calc(var(--sn-o1) * -1) var(--sn-b1) var(--sn-hi);
  --sn-inset-2:
    inset var(--sn-o2) var(--sn-o2) var(--sn-b2) var(--sn-lo),
    inset calc(var(--sn-o2) * -1) calc(var(--sn-o2) * -1) var(--sn-b2) var(--sn-hi);

  --sn-outline: 1px solid rgba(var(--spice-rgb-neu-dark), 0.45);

  /* Shape */
  --sn-r-slab: 28px;
  --sn-r-card: 20px;
  --sn-r-control: 14px;
  --sn-r-pill: 999px;
  /* Images inside frames: inner radius = outer radius - padding. */
  --sn-r-art: calc(var(--sn-r-card) - var(--sn-space-3)); /* artwork in a card (8px) */
  --sn-r-thumb: 6px;                                       /* row and list thumbnails */

  /* Space */
  --sn-space-1: 4px;
  --sn-space-2: 8px;
  --sn-space-3: 12px;
  --sn-space-4: 16px;
  --sn-space-5: 20px;
  --sn-space-6: 24px;
  --sn-space-8: 32px;
  --sn-gap-slab: var(--sn-space-5);

  /* States */
  --sn-hover-tint: rgba(var(--spice-rgb-text), 0.05);
  --sn-disabled-opacity: 0.45;
  --sn-focus: 2px solid var(--spice-button-active);
  --sn-ease: 140ms ease-out;

  /* Type */
  --sn-font: "Figtree";
}

/* Figtree, bundled as Latin and Latin Extended subsets (theme/assets/fonts/spotineu/).
   The full unicode-range lists are in theme/user.css. */
@font-face {
  font-family: "Figtree";
  src: url("fonts/spotineu/Figtree-latin.woff2") format("woff2");
  font-weight: 300 900;
  font-display: swap;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, /* … */ U+FFFD;
}
@font-face {
  font-family: "Figtree";
  src: url("fonts/spotineu/Figtree-latin-ext.woff2") format("woff2");
  font-weight: 300 900;
  font-display: swap;
  unicode-range: U+0100-02BA, /* … */ U+A720-A7FF;
}

/* Spotify declares its stacks with !important; keep its fonts as fallback
   for scripts Figtree does not cover. */
.encore-dark-theme,
.encore-light-theme,
.encore-layout-themes {
  --encore-body-font-stack: var(--sn-font), SpotifyMixUI, SpotifyMixUI-Arab, SpotifyMixUI-Cyrl, SpotifyMixUI-Grek, SpotifyMixUI-Hebr, SpotifyMixUI-Thai, DevanagariFallback, var(--fallback-fonts, sans-serif) !important;
  --encore-title-font-stack: var(--sn-font), SpotifyMixUITitle, SpotifyMixUITitle-Arab, SpotifyMixUITitle-Cyrl, SpotifyMixUITitle-Grek, SpotifyMixUITitle-Hebr, SpotifyMixUITitle-Thai, DevanagariFallback, var(--fallback-fonts, sans-serif) !important;
  --encore-variable-font-stack: var(--sn-font), SpotifyMixUITitleVariable, SpotifyMixUITitleVariable-Arab, SpotifyMixUITitleVariable-Cyrl, SpotifyMixUITitleVariable-Grek, SpotifyMixUITitleVariable-Hebr, SpotifyMixUITitleVariable-Thai, DevanagariFallback, var(--fallback-fonts, sans-serif) !important;
}

@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; }
}
```

Check the stacks against the installed build when you add the font, since
Spotify changes them:

```bash
X="$(spicetify config spotify_path)/Apps/xpui"
grep -oh -- '--encore-\(body\|title\|variable\)-font-stack:[^;}]*' "$X"/*.css | sort -u
```

## Reusable recipes

Use these in component rules:

```css
/* Raised icon button (circle) */
background: var(--spice-main);
border-radius: 50%;
box-shadow: var(--sn-raised-1);
color: var(--spice-subtext);
transition: box-shadow var(--sn-ease), color var(--sn-ease);
/* :hover  -> color: var(--spice-text) */
/* :active -> box-shadow: var(--sn-inset-1); transition: none */
/* on      -> box-shadow: var(--sn-inset-1); color: var(--spice-button-active) */

/* Inset field / track */
background: var(--spice-main);
border: 0;
border-radius: var(--sn-r-pill);
box-shadow: var(--sn-inset-1);

/* Slab */
background: var(--spice-main);
border-radius: var(--sn-r-slab);
box-shadow: var(--sn-raised-3);

/* Outlined group */
border: var(--sn-outline);
border-radius: var(--sn-r-card);
padding: var(--sn-space-3);
```
