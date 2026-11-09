# Design review checklist

Run this on screenshots after a visual change (see the spicetify-test skill
for taking them). Check a light and a dark scheme. Report each failure with
the area, what you saw and the rule it breaks.

## Material and depth

- [ ] Every panel, card, button and menu uses the surface colour. No area has
      a different background, apart from hover tints and accent fills.
- [ ] Every element has exactly one treatment: slab, raised, inset, outlined
      or flat.
- [ ] Raised means pressable; inset means value/on/selected/pressed. Nothing
      is raised just for decoration.
- [ ] Shadows are light/dark pairs: light upper left, dark lower right. No
      plain dark drop shadows: `scripts/inspect.sh shadows` reports none on
      every page you touched (scroll lists too; some appear only on scroll
      or hover).
- [ ] No shadow is clipped by a scroll container, cut by a wrapper, painted
      over by a neighbour, or runs into a neighbour. Check all four edges,
      including where a slab meets the player bar.
      (`scripts/inspect.sh clip '<selector>'` lists the culprits.)
- [ ] Neighbouring raised controls keep at least 10px between them; no two
      shadows touch.
- [ ] Controls in one row share one centre line and one icon size
      (`scripts/inspect.sh row '<selector>'` should report 1 centre line).
- [ ] Levels shrink inward: slab > card > control, in both shadow and radius.
- [ ] Images have no neumorphic shadow and take their frame's inner radius.

## Accent

- [ ] At most one accent fill per region (the play button).
- [ ] The accent appears only as: primary play fills, slider fills, on-state
      icons, the playing track, the current item marker, focus rings.
- [ ] No stock Spotify green anywhere (`1db954`, `1ed760`, `3be477`,
      `1abc54`).

## States

- [ ] Hover, pressed, on/selected, disabled and keyboard focus are all styled
      for the element you changed.
- [ ] Every on/selected state changes colour or weight, not only depth.
- [ ] A keyboard focus ring is visible (Tab through the area).

## Type and icons

- [ ] Figtree is in use (no Spotify Mix/Circular in Latin text).
- [ ] Sentence case; no uppercased labels.
- [ ] Text is `text` or `subtext` (accent only for playing/current); it is
      readable on every surface it sits on, including hover tints.
- [ ] Icons are flat or in a circular raised-1 button. Nothing in between.

## Consistency

- [ ] The same kind of element looks the same as elsewhere in the theme
      (compare icon buttons, chips and cards across views).
- [ ] No gradients, translucency or blur.
- [ ] `node scripts/check-theme.mjs` shows no design-token warnings for the
      changed rules.
