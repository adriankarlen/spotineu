# Spotify areas

How the design language applies to each part of Spotify. These are design
decisions, not selectors. Find selectors on the live client with
`scripts/inspect.sh` (see the spicetify-theme skill, references/selectors.md).
Where a stable `data-testid` is known, it is listed.

If you style an area that is not here, decide it with the steps in SKILL.md
section 8 and add a section to this file, so the next agent makes the same
choice.

## Layout: the stage (v2)

```
┌──────────┬───────────────────────────────┬──────────────┐  surface
│ ‹ ›      │ ( search…………… )         ◉    │ ╭──────────╮ │
│ ⌂ Home   │╭─────────────────────────────╮│ │   ART    │ │  stage column:
│ ⌕ Search ││ main view (slab)            ││ ╰──────────╯ │  ONE slab for
│ ♥ Liked  ││                             ││ Title      ♡ │  player + panel
│──────────││                             ││ ⤮ ╭⏮ ⏯ ⏭╮ ↻ │
│ 📌 pinned ││                             ││ ▁▃▅▇▅▃▁▂▃▅▃  │  waveform
│──────────││                             ││ 🔊 ────────  │
│ playlist ││                             ││ ▢ (≡ ♪ ⌁) ⛶ │  panel tabs
│ …        ││                             ││ queue …      │
└──────────┴╰─────────────────────────────╯┴──────────────┘
  library slab      main view slab            stage slab
```

- Three columns, three slabs (raised-3, `--sn-r-slab`): the library (with the
  left nav at its top), the main view, and the **stage** (player + right
  panel in one slab). There is no bottom bar and no full-width top bar.
- The old top bar is the head of the main column: it sits on the surface
  above the main view slab, not in a slab.
- The stage column has a fixed width (`--sn-stage-w`); the panel's resize
  handle is hidden.
- Below 1100px window width the stage is dropped and the v1 layout returns
  (three slabs + bottom player bar). Every v2 area falls back to v1 when its
  feature is off or its Spotify nodes are missing (see theme-js.md).
- The window background, the gaps and the panels are all `--spice-main`.
  Gaps: `--sn-gap-slab` (20px). Scroll areas inside a slab need inner
  padding (≥ 16px) so the shadows of raised cards are not clipped.
- Remove Spotify's panel background colours, borders and gradients.

v1 layout (the fallback): library, main view and right panel as three slabs
over a full-width bottom player slab, with the top bar on the surface above.

## Top bar (main column head)

`#global-nav-bar`; `data-testid="topbar"`, `topbar-content` are the sticky
bar inside the main view.

- No slab. In the stage layout the bar is the head of the main column: a wide
  search pill on the left (max 560px, never collapsed to an icon), account
  buttons on the right. Back, forward and Home move to the left nav (when
  `nav` is on).
- Icon buttons: raised-1 circles, 36px.
- Search field: inset-1 pill, placeholder in `subtext`, the search icon flat
  in `subtext`. Focus: accent focus ring, the field stays inset.
- Profile avatar: image inside a raised-1 circular frame.
- What's new and friend activity are hidden by `declutter`.
- v1 fallback: Home is a raised-1 circle, inset with an accent icon on the
  home route (`html.sn-route-home`).

## Left nav (v2)

Injected by theme.js at the top of the library slab.

- Back / forward: raised-1 circles, 32px; disabled = flat at 45 %.
- Home, Search, Liked Songs: flat rows (icon + label, weight 600). The
  current page is inset-1 with accent icon and label (`aria-current`).
- A hairline (`--sn-divider`) separates the nav from the library.
- Collapsed library (narrow rail): icons only, centred.
- Pinned library items form one outlined group (hairline outline drawn with
  inset shadows, radius `--sn-r-control`) with a 12px gap before the rest;
  the pin icon is accent.

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
- Compact headers (v2, `headers`): the header takes its natural height; the
  cover is 176px in its raised-2 frame; the title is clamp(2rem, 3.4vw,
  3.75rem). Hero photos (artists, editorial playlists) become a contained
  image card (raised-2, `--sn-r-card`, height `--sn-hero-h`) with the
  slab's 20px margins, and the title sits under it on the plain surface: no
  scrim needed. The sticky bar's content stays hidden until its background
  fades in.
- Hero images (v1 fallback): the photo stays at the top of the slab; a matte
  fade into the surface replaces Spotify's scrim. Never make the layers above
  the photo opaque.
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
- Play button on a card (v2): always visible, a 40px raised-1 circle of the
  material with a `text` icon in the artwork's lower right corner (8px
  gap). Hovering the card (or keyboard focus) turns it into the accent fill.
  v1: Spotify's hover-only accent button.
- Grid gap: at least 20px both ways (shadow room).
- Cards in one shelf have equal height (fill their cell), so the raised
  tiles line up whatever the title length.
- Home "shortcut" tiles (the compact grid at the top of home): raised-1
  tiles, radius `--sn-r-control`, 16px gap. v2: the art is inset 8px in the
  tile (radius = control radius − 8px), names weight 600, and a 36px play
  button is always visible (accent on hover), with room reserved for it.
- Chips row on home (All / Music / Podcasts): raised-1 pills; selected inset
  with accent text.

## Track list

`[role="grid"]`, `[role="row"]`; mapped classes `.main-trackList-*`.

- Lives directly on the main view slab. No card around the whole list.
- Header row: flat, `subtext`, weight 500, sentence case, a 1px divider
  below. The sticky header gets the surface as background, no shadow.
- Rows: flat, radius `--sn-r-control`. Hover = tint. Selected = inset-1.
- Two lines (title over artist) in Spotify's list view, one line in compact
  view. Never change the row height: the list is virtualised and Spotify
  positions rows by its own fixed height (56px list, 32px compact); taller
  rows overlap the "recommended" section below. Title weight 500; metadata
  columns in `subtext`.
- Fewer columns: when the main column is narrower than 1300px the second
  metadata column (date added) is hidden.
- The play button in the index cell (shown on hover): raised-1 circle, 32px
  (28px in compact view), centred on Spotify's 16px marker.
- Playing row: inset-1, title in accent weight 600, the equaliser in accent
  (Spotify's green image, the static SVG or the animated GIF it shows while
  the window has focus, is recoloured with itself as a mask, so it keeps
  animating), and a 2px accent line (in compact view it sits on the bottom
  edge and the row content is lifted 2px with inner padding) at
  the bottom of the row that fills with the playback position.
- Row artwork: radius 6px, no shadow.
- Index numbers and durations: `subtext`, tabular figures.

## Stage player (v2)

`data-testid="now-playing-bar"`, `now-playing-widget-v2`, `player-controls`,
`general-controls`, `playback-progressbar`, `volume-bar`.

Calm by design: **one raised object** (the transport capsule); everything
else is flat icons and thin lines on the slab. The player bar becomes a grid
of six equal columns at the top of the stage slab:

```
art   art   art   art   art   art     large cover, raised-2 frame, listening button
meta  meta  meta  meta  meta  like    title 1.25rem/700, artist subtext; like flat
shuf  prev  play  play  next  rep     capsule: raised-2 pill around prev/play/next
bar   bar   bar   bar   bar   bar     waveform, or a thin progress line (40px row)
pos   pos   pos   dur   dur   dur     times 0.75rem subtext, close under the bar
lyr   que   dev   vol   vol   vol     panel tabs, then volume
```

- Art: the large cover (injected), in a raised-2 frame (padding 8px, image
  radius = card radius − 8px). It shrinks with the window height.
- Every icon button in the stage is flat: no circle, `subtext` icon, `text`
  on hover, accent when on. Spotify's small dot under shuffle, repeat and the
  open tab stays as the non-colour signal. Pressing shows inset-1 briefly.
- Capsule: prev and next as `text` icons, play as the one accent fill (56px).
  Shuffle and repeat sit flat at the two edges of the row.
- Progress without the waveform: 4px track, accent fill, thumb only on hover
  or keyboard focus, aligned to the bottom of its 40px row so it stays with
  the times (the row keeps its height, so nothing jumps when the waveform
  loads).
- Volume: flat mute icon and a thin slider with a `subtext` fill; the accent
  stays on play and playback progress.
- Hidden in the stage: the audio quality badge, the mini player and full
  screen buttons (listening mode is the big view).
- The queue does not repeat the current track (the stage shows it).

## Player bar (v1 fallback, narrow windows)

- The bar is a slab, separated from the panels above by `--sn-gap-slab`.
- Now playing (left): cover art in a raised-1 frame (padding 4px, radius
  `--sn-r-control`). Title weight 600 `text`, artist `subtext`.
- Transport: previous/next raised-1 circles 40px; play/pause raised-2 circle
  52px with accent fill. Shuffle/repeat follow the toggle rules.
- Progress bar: inset-1 pill track, 8px tall; accent fill; thumb a raised-1
  circle (16px, surface colour), always visible. Times in `subtext`.
- Volume: the same slider recipe, shorter. Mute: raised-1 circle.
- Extra controls: raised-1 circles 36px; on (panel open) = inset + accent.

## Waveform (v2)

- Loudness bars (from Spotify's audio analysis) straight on the slab, no
  well, 40px tall (64px in listening mode).
- Bars in `subtext` at 30 %; the played part is a second copy in the
  accent, clipped at the playback position. No thumb at rest; Spotify's
  slider lies on top, transparent, so click, drag and arrow keys still seek,
  and its raised thumb shows for keyboard focus.
- When there is no analysis for a track, the plain v1 slider shows.

## Listening mode (v2)

Opened from the raised-1 button on the stage art or ⌘/Ctrl+Shift+F; Esc or
the button closes it.

- Only two slabs: the player (left, centred, max 680px, art up to the window
  height minus the controls; title 1.75rem/800) and the panel (right,
  `--sn-listen-panel-w`): queue, devices or lyrics.
- Lyrics (Spotify's cinema overlay) take the panel column.
- Library, top bar and main view are hidden.

## Right panel (queue, devices, lyrics, now playing view)

- In the stage layout the panel is the lower part of the stage slab (no
  slab of its own). The queue is always open unless the user picks devices
  (or another panel); Spotify's now playing view is replaced by the stage.
- Header: title flat; close/more buttons raised-1 circles.
- Queue: same rules as the track list.
- Lyrics (cinema mode, over the library and main view): the overlay is a
  slab (raised-3, radius `--sn-r-slab`). Past lines `subtext`, current line
  `text`, upcoming lines `subtext` at 70 %. Header title in `text`, no scrim.
- Now playing view (v1 fallback): cover art or Canvas in a raised-2 frame;
  info cards raised-2. With `declutter` only the lyrics preview and credits
  remain (related videos, about the artist and on tour are hidden).
- Panel icon buttons outside rows: raised-1 circles, toggle rules.

## Declutter (v2)

Hidden when `declutter` is on: What's new and friend activity buttons,
"install app" upsell, home ads and DSA banners, concert and merch promos,
the Jam invite in the queue, and the now playing view's filler. Podcasts and
audiobooks stay.

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
