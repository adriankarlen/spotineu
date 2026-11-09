---
name: spotineu-design
description: The spotineu design language — a neumorphic ("soft UI") look for Spotify built from one material, light/dark shadow pairs, raised and inset states, and a single sparing accent. Use this before any visual decision in the theme — styling a Spotify area, picking a shadow, radius, colour, state or font, designing a colour scheme, or reviewing a screenshot for consistency — even for small requests like "make the play button nicer" or "style the search bar". It says how each kind of element must look so every part of the UI stays coherent. Use it together with spicetify-theme (how to write the CSS) and spicetify-test (how to check it).
---

# spotineu design language

spotineu turns Spotify into one soft, matte material. Everything is made of
the same surface. Depth comes only from light: a highlight on the upper left
and a shadow on the lower right. Things you can press stand out of the
surface. Things that hold a value or are switched on are pressed into it. One
accent colour marks what matters right now.

The main reference is the "WEBDESIGN – NEUMORPHISM" shot by Mattmart
(<https://dribbble.com/shots/27580256-WEBDESIGN-NEUMORPHISM>): pronounced,
crisp shadows, a thin bright rim on raised edges, outlined groups, circular
icon buttons, generous radii, dark-grey text and one orange accent used
sparingly. Secondary references: the Luna Hsu UI kit (states, sliders,
toggles) and the Nevesunday dashboard (raised panels with nested raised
cards).

Palettes are interchangeable. These rules are about structure, not specific
colours. Nothing in `user.css` may hard-code a colour.

## 1. Principles

1. **One material.** Panels, cards, buttons, menus and the window background
   share one surface colour (`--spice-main`). Never give an element a
   different background to separate it. Separate it with depth.
2. **Depth carries meaning.** Raised means "you can press this". Inset means
   "this holds a value, or is on, selected or pressed". Flat means "content".
   Use depth for these meanings and not for decoration.
3. **The accent is rare.** At most one accent-filled element in a region (the
   play button). Everything else uses the accent only as a small marker: an
   icon tint, a dot, the progress fill, the text of the playing track.
4. **Hierarchy through levels.** Slabs (panels) are the deepest raised level.
   Cards are one level lower and controls lower still. Radius and shadow
   shrink together as you go inward.
5. **Calm content.** Track lists, text and metadata stay flat and quiet, so
   the raised controls around them read clearly. Do not raise every row.
6. **Meaning never relies on shadow alone.** Soft shadows are easy to miss,
   especially in dark schemes. Every state change also changes colour,
   weight or an accent marker.

## 2. The depth grammar

Every visible element gets exactly one of these five treatments. Classify an
element first, then style it.

| Treatment | Token | Use for | Looks like |
|---|---|---|---|
| **Slab** | `--sn-raised-3` | Main layout panels: library, main view, right panel, player bar; menus and dialogs | Large raised panel with a wide shadow |
| **Raised** | `--sn-raised-2` (cards, primary play buttons) / `--sn-raised-1` (controls, text buttons) | Anything pressable at rest: cards, icon buttons, chips, the play button, slider thumbs | Stands out, with a bright rim on the upper left |
| **Inset** | `--sn-inset-1` / `--sn-inset-2` | Inputs, slider and progress tracks, toggled-on buttons, the selected chip or row, the current nav item, the pressed state of any raised element | Pressed into the surface |
| **Outlined** | `--sn-outline` (border) | A group of related controls that shares a context (filter chips, a segmented set, a settings group) | Flat area with a hairline edge, like the size picker in the reference |
| **Flat** | none | Text, list rows, headings, metadata, dividers, icons inside other elements | No shadow, no border |

Rules:

- A raised element sits on the surface or inside a slab. Do not nest raised
  in raised more than two levels deep (slab → card is fine; slab → card →
  raised button inside the card is the limit and should be rare).
- An inset element never contains raised elements, except a slider thumb in
  its track.
- Images (album art, artist photos, video) are not made of the material. They
  never get neumorphic shadows themselves. They sit inside a raised card or
  frame and take that card's inner radius.
- Do not use a coloured background to show depth or hierarchy. Hover tints
  are the one exception (section 4).

## 3. Elevation, shape and spacing

Pronounced depth, tuned to the main reference. All values come from tokens in
[references/tokens.md](references/tokens.md).

| Level | Shadow offset / blur | Radius | Min. gap to neighbours | Elements |
|---|---|---|---|---|
| 3 slab | 10 / 24 px | `--sn-r-slab` 28px | 20px | panels, player bar, menus, dialogs |
| 2 card | 6 / 14 px | `--sn-r-card` 20px | 16px | cards, tiles, primary play button |
| 1 control | 3 / 7 px | `--sn-r-control` 14px, pill, or circle | 10px | icon buttons, chips, inputs, thumbs |

- `--sn-depth` (default `1`) scales every offset and blur. Change it in one
  place only, on `:root`. Overriding it lower in the tree does not change
  shadows that were already computed.
- **Nested radius:** inner radius = outer radius − padding. A card with
  radius 20 and padding 12 gives its artwork radius 8.
- **Shape by role.** Icon-only buttons are circles. Text buttons and chips
  are pills. Cards and tiles are rounded rectangles. Do not use one radius
  for everything.
- **Leave room for shadows.** A raised element needs clear space of at least
  its offset + blur/2 on every side, or the shadow is clipped or runs into
  its neighbour. Spotify's scroll containers use `overflow: hidden/auto`:
  give them inner padding so the shadows of raised children are not cut off.
- Spacing scale: 4, 8, 12, 16, 20, 24, 32px (`--sn-space-*`). Slab padding
  is 16–24px.

## 4. States

| State | Raised element (button, card, chip) | Flat element (row, nav item, link) |
|---|---|---|
| Rest | its raised level; icon in `subtext` | flat; text in `text`, metadata in `subtext` |
| Hover | stays raised; icon/text goes to `text` | tint: `rgba(var(--spice-rgb-text), .04)` (light) to `.06` (dark), radius `--sn-r-control` |
| Pressed (`:active`) | flips to the matching inset level | inset-1 |
| On / selected / current | inset level + accent icon or text | inset-1 + accent marker (text, dot or 3px bar) |
| Disabled | flat, 45 % opacity, no hover | 45 % opacity |
| Focus (keyboard) | `outline: 2px solid var(--spice-button-active); outline-offset: 3px` | same |

- Toggles such as shuffle, repeat and like are off = raised-1 with a
  `subtext` icon, on = inset-1 with an accent icon. On must change both the
  depth and the colour.
- The playing track in a list is flat, with title text in the accent colour
  and weight 600. Selected (clicked) rows are inset.
- Never remove focus outlines. Never use `:hover` as the only way to show a
  control exists.
- Transitions: `box-shadow`, `background-color` and `color` over 140ms
  `ease-out`. Pressing flips instantly (no transition on `:active`). No
  entrance animations. Respect `prefers-reduced-motion` by dropping
  transitions.

## 5. Colour roles

`color.ini` defines the palette. The design language only uses roles. Full
contract and example schemes: [references/tokens.md](references/tokens.md).

| Role | Key | Rule |
|---|---|---|
| Surface | `main` (also `sidebar`, `player`, `card`, `main-elevated` — all the same value) | Never pure white or pure black: the highlight and the shadow both need room |
| Highlight shadow | custom `neu-light` | Light schemes: near-white. Dark schemes: surface lightened by about 6–8 % (not white) |
| Shade shadow | custom `neu-dark` | Surface darkened and slightly cooled. It sets how strong the depth is |
| Text | `text` | Dark grey, not black, in light schemes; off-white in dark. ≥ 7:1 on surface |
| Muted text and icons | `subtext` | ≥ 4.5:1 on surface |
| Accent | `button-active` (= `button`) | One hue. Fill only for the primary play buttons and slider fills |
| On accent | custom `on-accent` | Icons and text on accent fills. ≥ 3:1 for icons, ≥ 4.5:1 for text |
| Error | `notification-error` | Toasts and destructive confirmations only |

No gradients as decoration. Spotify's colour-extracted header gradients and
backdrop washes are removed: the material is matte. The only gradient
allowed is the accent fill of a slider, if a scheme wants one.

## 6. Typography

- Typeface: **Figtree** (SIL OFL, variable weight 300–900), bundled in
  `theme/assets/fonts/spotineu/`. It is geometric and soft, and still clear
  at the 12–14px sizes Spotify's lists use. Put it in front of Spotify's
  original stacks so non-Latin scripts still fall back to Spotify's fonts.
  Spotify declares its stacks with `!important`, so the override needs it too
  (see tokens.md).
- Weights: 400 body, 500 metadata labels, 600 emphasis and playing track,
  700 titles, 800 page headings.
- Large headings: letter-spacing −0.02em, line-height 1.1. Body: line-height
  1.45.
- Sentence case everywhere. Do not uppercase labels or headings, even where
  Spotify does.
- Colour comes from roles only: `text`, `subtext`, accent for the playing or
  current item.

## 7. Icons

- Keep Spotify's own icons. Colour: `subtext` at rest, `text` on hover,
  accent when on.
- An icon on its own is either flat (inside a row or card) or sits in a
  circular raised-1 button. There is no third option.
- Icon buttons are at least 32px (40px in the player bar).

## 8. How to apply this to an element

Follow these steps for every element you style:

1. **Classify it** with the depth grammar: slab, raised, inset, outlined or
   flat. When unsure, ask: can the user press it (raised)? Does it hold a
   value or show an on-state (inset)? Is it content (flat)?
2. **Pick the level** (3, 2 or 1) from where it sits in the hierarchy.
3. **Use tokens only:** shadow, radius, spacing and colour roles from
   tokens.md. If you need a value that does not exist, add a token, and say
   so in your summary.
4. **Define every state** from section 4, not only the rest state.
5. **Check the space** around it for shadow clipping.
6. **Verify** with the spicetify-test skill, then run the review checklist in
   [references/review-checklist.md](references/review-checklist.md) on the
   screenshots, in a light and a dark scheme.

Area-by-area decisions for Spotify (layout, top bar, library, cards, track
list, player bar, menus, settings and more) are in
[references/components.md](references/components.md). Read the section for
the area you are working on before you start. If an area is not listed,
decide by the steps above and add a section for it.

## 9. Do and do not

Do:

- Make the same kind of element look the same everywhere: every icon button,
  chip and card follows one recipe.
- Remove Spotify's own backgrounds, borders and box-shadows from an element
  before applying a treatment, so they do not stack.
- Keep text contrast high. The shadows are soft, the text must not be.

Do not:

- Do not add drop shadows that are not a light/dark pair (no plain
  `rgba(0,0,0,.3)` shadows).
- Do not put neumorphic shadows on images, text or icons.
- Do not use more than one accent fill per region, or accent backgrounds on
  rows and panels.
- Do not use glassmorphism (blur, translucency), gradients or coloured
  panels. They break the single material.
- Do not raise every row in a list or every item in a menu.
- Do not hard-code colours, shadows or radii in component rules.
  `node scripts/check-theme.mjs` warns about it.
