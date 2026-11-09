# Spotify areas

How the design language applies to each part of Spotify. These are design
decisions, not selectors. Find selectors on the live client with
`scripts/inspect.sh` (see the spicetify-theme skill, references/selectors.md).
Where a stable `data-testid` is known, it is listed.

If you style an area that is not here, decide it with the steps in SKILL.md
section 8 and add a section to this file, so the next agent makes the same
choice.

## Layout: floating slabs

```
┌──────────────────────────────────────────────┐  surface (window background)
│   ‹ ›  ⌂  ( search…………… )            ◉    │  top bar: no slab, raised controls
│  ╭──────╮  ╭────────────────────╮  ╭──────╮  │
│  │ lib  │  │ main view          │  │ right│  │  three slabs, raised-3
│  │      │  │                    │  │ panel│  │
│  ╰──────╯  ╰────────────────────╯  ╰──────╯  │
│  ╭──────────────────────────────────────────╮ │
│  │ player bar                               │ │  slab, raised-3
│  ╰──────────────────────────────────────────╯ │
└──────────────────────────────────────────────┘
```

- The window background, the gaps and the panels are all `--spice-main`.
- Each panel (library, main view, right panel, player bar) is a slab:
  raised-3, radius `--sn-r-slab`.
- Gaps between slabs and the window edge: `--sn-gap-slab` (20px). Spotify's
  default gap (8px) is too small for pronounced shadows.
- Remove Spotify's panel background colours, borders and gradients.
- Scroll areas inside a slab need inner padding (≥ 16px) so the shadows of
  raised cards inside them are not clipped. Keep the scroll container
  clipped to the slab radius.
- Resize handles between panels: invisible at rest, a 3px accent bar on
  hover.

## Top bar

`data-testid="topbar"`, `topbar-content`.

- No slab. The top bar sits on the main view slab's top area, or on the
  surface above the slabs, depending on Spotify's layout. Its controls carry
  the depth.
- Back/forward and other icon buttons: raised-1 circles, 36px.
- Home button: raised-1 circle; inset with an accent icon when on the home
  route. Spotify only marks this with a hashed class, so `theme.js` sets
  `html.sn-route-home` and the CSS keys off that.
- Search field: inset-1 pill, 44px tall, placeholder in `subtext`, the search
  icon flat in `subtext`. Focus: accent focus ring, the field stays inset.
- Profile avatar: image inside a raised-1 circular frame with 3px padding.
- Window controls (macOS traffic lights) are left alone.

## Library (left panel)

- The panel is a slab.
- Header ("Your Library", create button, expand): title flat in `text`
  weight 700; create/expand icon buttons are raised-1 circles.
- Filter chips (Playlists, Artists, Albums…): inside an outlined group if
  they wrap; each chip a raised-1 pill; the selected chip inset-1 with accent
  text weight 600. The "clear filter" x is a raised-1 circle.
- Search/sort row: icon buttons raised-1; the expanded search field inset-1
  pill.
- List items: flat rows. Hover = tint. The currently open item is inset-1
  with its title in the accent colour. The playing item shows Spotify's
  speaker icon tinted accent.
- Artwork in list items: radius `--sn-r-control` minus the row padding
  (about 8px; artists stay circles). No shadow on the image.
- Collapsed library (icons only): items become raised-1 squircles
  (radius `--sn-r-control`); the open one inset.

## Main view

- The panel is a slab. Remove Spotify's colour-extracted header gradients and
  the action bar background.
- Page headings: weight 800, letter-spacing −0.02em, colour `text`. No
  gradient behind them.
- Entity header (playlist, album, artist): the cover art sits in a raised-2
  frame (padding 10px, radius `--sn-r-card`, image radius 10px). Title and
  metadata flat to its right.
- Hero images (editorial playlists, artists): the photo stays, at the top of
  the slab (clipped by its radius). Spotify's dark scrim is replaced by a
  matte fade into the surface at the bottom, so the title in the scheme's
  `text` colour reads on any photo in light and dark schemes. Never make
  the layers above the photo opaque.
- Action bar (`data-testid="action-bar"`): the big play button is raised-2,
  56px, accent fill, `on-accent` icon. Shuffle, like/save, download and more
  are raised-1 circles, 40px, following the toggle rules.
- Sections ("Made for you", "Recently played"): heading flat; "Show all" is
  a flat link in `subtext`, `text` on hover.

## Cards and shelves

- Cards (`main-card-card` where mapped): raised-2, radius `--sn-r-card`,
  padding 12px. Artwork radius 8px (circle for artists). Title weight 700
  `text`, subtitle `subtext`.
- Hover: the card stays raised; title goes to `text` if it was not, and
  Spotify's hover play button appears.
- Hover play button on a card: raised-1 circle, accent fill, `on-accent`
  icon, positioned inside the artwork's lower right corner with a gap of 8px.
- Grid gap: at least 20px both ways (shadow room).
- Cards in one shelf have equal height (fill their cell), so the raised
  tiles line up whatever the title length.
- Home "shortcut" tiles (the compact grid at the top of home): raised-1
  tiles, radius `--sn-r-control`, art flush left with the tile's inner
  radius.
- Chips row on home (All / Music / Podcasts): raised-1 pills; selected inset
  with accent text.

## Track list

`[role="grid"]`, `[role="row"]`.

- Lives directly on the main view slab. No card around the whole list.
- Header row: flat, `subtext`, weight 500, sentence case, a 1px divider in
  `rgba(var(--spice-rgb-neu-dark), .45)` below it. The sticky header gets
  the surface as background, no shadow.
- Rows: flat, radius `--sn-r-control`. Hover = tint. Selected = inset-1.
  Playing = title in accent, weight 600; the equaliser icon in accent.
- Row artwork: radius 6px, no shadow.
- Row actions (like, more): flat icons, shown on hover as Spotify does; the
  liked heart is accent.
- Index numbers and durations: `subtext`, tabular figures
  (`font-variant-numeric: tabular-nums`).

## Player bar

`data-testid="now-playing-bar"`, `now-playing-widget`, `player-controls`,
`playback-progressbar`, `progress-bar`, `volume-bar`.

- The bar is a slab, separated from the panels above by `--sn-gap-slab`.
- Now playing (left): cover art in a raised-1 frame (padding 4px, radius
  `--sn-r-control`). Title weight 600 `text`, artist `subtext`. The like
  button follows the toggle rules.
- Transport controls: previous/next raised-1 circles 40px; play/pause
  raised-2 circle 52px with accent fill. Shuffle/repeat follow the toggle
  rules (on = inset + accent; repeat-one adds Spotify's small "1" marker in
  accent).
- Progress bar: inset-1 pill track, 8px tall; accent fill; thumb is a raised-1
  circle (16px, surface colour), always visible. Elapsed and remaining times
  in `subtext`, tabular figures.
- Volume: the same slider recipe, shorter. The mute button is a raised-1
  circle.
- Extra controls (lyrics, queue, devices, mini player, full screen): raised-1
  circles 36px; on (panel open) = inset + accent icon.
- Connect bar ("Listening on…"): a flat strip inside the player slab, text in
  accent. No green background.

## Right panel (now playing view, queue, lyrics, friend activity)

- The panel is a slab.
- Header: title flat; close/more buttons raised-1 circles.
- Now playing view: large cover art or Canvas video in a raised-2 frame
  (radius `--sn-r-card`) inside the art slot. Spotify bleeds the Canvas
  over the whole top of the panel with dark gradient overlays; the frame
  replaces that and the overlays are removed. Track info flat.
  Info cards ("About the artist", "Credits", "Next in queue"): raised-2
  cards on the slab. Images inside them follow the image rule.
- Queue: same rules as the track list. The "Now playing" row is inset-1.
- Lyrics preview card: raised-2 card, heading `subtext`, lines `text`.
- Lyrics (full view, which opens in "cinema mode" over the panels): the
  overlay is a slab (raised-3, radius `--sn-r-slab`), not a black-framed
  coloured sheet. Past lines `subtext`, current line `text`, upcoming
  lines `subtext` at 70 %. Header title in `text`, no scrim. Header icon
  buttons stay flat for now.
- Panel icon buttons (close, more, copy link, like) outside rows: raised-1
  circles, following the toggle rules.

## Menus, tooltips and dialogs

- Context menus and dropdowns: slabs (raised-3) with radius `--sn-r-card`
  and padding 6px. Items flat, radius `--sn-r-control`, hover = tint,
  checked item = accent check icon. Dividers 1px `neu-dark` at 45 %.
- Tooltips: raised-1 with radius `--sn-r-control`, surface background, text
  in `text`. No dark inverted tooltips.
- Dialogs (`data-testid="dialog-root"`): slab with radius `--sn-r-slab`,
  over a backdrop of `rgba(var(--spice-rgb-neu-dark), .5)`. Buttons follow
  the text-button rule below; destructive confirm uses
  `notification-error` text.
- Toasts: raised-2 pill on the surface, text in `text`, with an accent dot
  (or error dot) on the left instead of a coloured background.

## Text buttons

- Every text button, primary or secondary ("Add", "Mix", "Find songs",
  "Follow", "Reload page"): raised-1 pill, surface fill, `text` colour,
  weight 700; pressed = inset-1. Spotify marks many of these as primary;
  making them all accent would break the "accent is rare" rule (decided
  while building the playlist page, where three primary buttons sit in a
  row). The accent stays on play buttons and on-states.

## Settings (`/preferences`)

- The page sits on the main view slab. Each settings section is an outlined
  group.
- Toggles (switches): track inset-1 pill; knob raised-1 circle. On = knob on
  the right and the track filled with accent at full opacity, without the
  inset shadow (shading an accent fill looks muddy); off = knob left,
  track surface.
- Dropdowns (select): raised-1 pill with a chevron; open = menu rules.
- Text inputs: inset-1, radius `--sn-r-control`.

## Search page

- Search field: see Top bar.
- Genre/category tiles ("Browse all"): these are coloured by Spotify. Keep
  them as raised-2 cards with radius `--sn-r-card`, but replace the colour
  background with the surface; keep the artwork and put the title in `text`.
- Top result card: raised-2 card, larger padding (20px).

## Loading states

- Skeletons (`[data-testid*="skeleton"]`) are inset-1 wells in the surface,
  keeping Spotify's shapes (art squares, text pills, circles), with no grey
  fill and no shimmer. They read as places waiting to be filled.

## Scroll edges

- No drop shadow under headers when content scrolls beneath them (the
  library header, sticky headers). They stay flat on their slab; the
  scrolled content slides under a surface-coloured background.

## Scrollbars

- Width 10px, no track background. Thumb: `rgba(var(--spice-rgb-subtext), .35)`,
  radius pill, with a 2px transparent border so it floats. Hover:
  `.55`.

## Marketplace and custom apps

- Follow the same recipes: their cards are cards, their buttons raised-1
  pills, their inputs inset. Do not invent new treatments for them.
