# Finding and choosing selectors in Spotify

## Why this is hard

Spotify ships CSS modules with build-hashed class names
(`.Y_WW1akjiQKXSzCBalCD`). During `spicetify apply`, Spicetify rewrites the
hashes it knows (from `~/.spicetify/css-map.json`) to readable names such as
`main-card-card` or `main-trackList-trackListRow`. The map lags behind
Spotify. In the installed build (Spotify 1.3.6) only about 30 `main-*`
classes are mapped; most of the ~5,000 classes are still hashed. Old
selectors from other themes (`.Root__nav-bar`, `.main-nowPlayingBar-center`)
often no longer exist.

So: discover selectors on the live client, and prefer hooks that do not
depend on class names.

## What exists in Spotify 1.3.8 (verified on the live client)

The `main-*` names from older themes are gone in 1.3.8. These hooks work:

| Area | Hook |
|---|---|
| Layout grid | `.Root > div` (hashed class). Gap and padding come from `--panel-gap`, set **inline on `.Root`** by JS; override with `!important` |
| Panels | `#global-nav-bar`, `#Desktop_LeftSidebar_Id`, `#main-view`, `#Desktop_PanelContainer_Id` (right panel), `[data-testid="now-playing-bar"]` |
| Inner panel layers | `.YourLibraryX`, `#Desktop_LeftSidebar_Id > nav > div`, `.main-view-container` (they paint their own backgrounds) |
| Buttons | `[data-encore-id="buttonPrimary"]`, `"buttonSecondary"`, `"buttonTertiary"`; icon-only ones have `[data-is-icon-only="true"]` or a class containing `--icon-only` (match with `[class*="--icon-only"]`) |
| Primary button fill | the first `> span` inside the button carries the fill, and Spotify hides hover play buttons by fading that span (put shadows on the span, not the button) |
| On-state of toggles | `[aria-checked="true"]` (repeat, like) or `.encore-internal-color-text-bright-accent` (shuffle) |
| Chips | `[data-encore-id="chip"][aria-checked]`; the label sits in `> span` |
| Cards | `[data-encore-id="card"]`; titles `[data-encore-id="cardTitle"]` |
| Home | `section[data-testid="home-page"]`, `section[data-testid="component-shelf"]`, shortcut tiles `div:has(> [data-testid="shortcut-background"])` |
| Entity pages | `[data-testid="entity-header"]`, `[data-testid="action-bar"]`, `[data-testid$="-page"]` (playlist-page, album-page …), sticky `[data-testid="topbar"]` |
| Hero images | `#main-view [data-testid="background-image"]` (inline background-image); its scrim is the next sibling `[data-testid="background-image"] + div:empty`. Empty `--background-base` layers above heroes must stay transparent |
| Sticky bars (pattern) | A sticky bar = container with an empty background layer + the content. The layer may carry inline `--background-base` (not always) and a 60% black scrim in its own `::after` or in a nested empty div. Give the layer the surface colour (it must stay opaque), clear its `::after`. Home chip row: `#main-view div:has(> div:empty + div [data-encore-id="chip"]) > div:empty`. Scrims skip hit-testing, so check `::before`/`::after` of each layer, not just `elementsFromPoint` |
| Sticky header in the main view | `#main-view [data-testid="topbar"] > div[style*="--background-base"]` (fades in on scroll) contains an empty `div` that is a 60% black scrim; remove both colours. Test it by scrolling a playlist down |
| Colour washes | empty layer divs, often with inline `--background-base`: `[data-testid="entity-header"] > div:empty`, `[data-testid$="-page"] > div > div:empty[style*="--background-base"]`, `div:has(> section[data-testid="home-page"]) > div:empty` |
| Track list | `[role="grid"] [role="row"] > [role="presentation"]` is the visible row; `[aria-selected]` on the row; header row `[aria-rowindex="1"]` |
| Library rows | `#Desktop_LeftSidebar_Id [role="row"][aria-selected]` |
| Sliders | `[data-testid="progress-bar"]` exposes `--bg-color`, `--fg-color`, `--mg-color`, `--is-active-fg-color`, `--progress-bar-height`, `--progress-bar-radius`; `[data-testid="progress-bar-background"]`, `[data-testid="progress-bar-handle"]` |
| Search | `#global-nav-bar form[role="search"]`; home button = `#global-nav-bar div:has(> div > form[role="search"]) > button` |
| Route state | `html.sn-route-<segment>` (set by `theme/theme.js`: `sn-route-home`, `sn-route-search`, `sn-route-playlist` …) |
| Browse tiles | `#main-view [role="listitem"] > a > div[style*="background-color"]` (img + title span) |
| Settings | `[data-testid="settings-page"] > div:has(h2)` (sections), `label > input[type="checkbox"] + span` (switch track) `> span` (knob), native `select` |
| Right panel | `#Desktop_PanelContainer_Id`; Canvas `div:has(> div > div > video)` (absolute, bleeds via negative margins); `[data-testid="lyrics-npv-section"]`; info cards are `section` |
| Lyrics colours | inline `--lyrics-color-active/-inactive/-passed/-background/-messaging` on `[style*="--lyrics-color-background"]` (override with `!important`) |
| Cinema mode (lyrics over panels) | `.Root > div > div:has([style*="--cinema-mode-bg-color-from"])`; black frame = `outline: var(--panel-gap) solid black`; header vars on `[style*="--header-text-color"]` with a scrim in `::before` |
| Menus | `#context-menu [role="menu"]`, `[role="menuitem"]` |
| Spicetify nav links | `.custom-navlinks-scrollable_container .spicetify-sc-scroller` (clips with overflow and `mask-image`) |

Inline custom properties are a recurring pattern in 1.3.8: Spotify passes
artwork colours to components as inline `--…-color-*` variables. Select the
element with `[style*="--name"]` and override the variables with
`!important` (a stylesheet `!important` beats a normal inline declaration).

Shadow clipping: Spotify's carousels and scrollers clip with
`overflow: hidden` and fade with `mask-image`. When a shadow is cut off,
walk up from the element and check `overflow` and `mask-image` on each
ancestor (one `eval` with `getComputedStyle`). Fix with padding inside the
clipping element, or a margin on the raised element.

Known clipping wrappers in 1.3.8 (the treatment lives on the wrapper):
the shortcut tile's outer `div:has(> div > [data-testid="shortcut-background"])`;
the right panel's `div:has(> div > #Desktop_PanelContainer_Id)`; and
shelf cards: each sits in a clipping `[role="row"]` inside a horizontal
scroller `[style*="scroll-padding"]` (overflow-x auto forces overflow-y to
clip), so rows get `overflow: visible` and the scroller vertical padding;
`div:has(> [data-testid="now-playing-bar"])`, which sits above the panels
with a background that hides their bottom shadows (made transparent).

Plain drop shadows: Spotify hard-codes black shadows (`0 8px 24px
#00000080` …) on artwork wrappers, hover play button wrappers and scrolled
headers, mostly as literal values (only overlays use the token
`--encore-overlay-box-shadow`, mapped to `--sn-raised-3`). The "Plain drop
shadows" section of user.css clears them with ID-scoped, low-specificity
rules so the theme's own raised rules still win. `scripts/inspect.sh
shadows` lists any that remain on the current page.

Skeletons: `[data-testid*="skeleton"]` (skeleton-section, skeleton-card,
skeleton-shelf, skeleton-shortcut, home-page-skeleton, …). They flash by
too fast to inspect; test the styling by inserting a temporary element with
`data-testid="skeleton-section"` and empty children, screenshot, remove it.

Before blaming the theme for odd text (all lowercase, for example), check
Marketplace snippets: `document.querySelector("style.marketplaceSnippets")`.

## Selector priority

1. **`[data-testid="…"]`** — the most stable hook. Examples in this build:
   `now-playing-bar`, `now-playing-widget`, `player-controls`,
   `playback-progressbar`, `progress-bar`, `volume-bar`, `topbar`,
   `topbar-content`, `left-sidebar-footer`, `action-bar`, `playlist-toolbar`,
   `dialog-root`, `top-result-card`.
2. **Semantic structure and ARIA**: `nav`, `main`, `aside`, `[role="row"]`,
   `[role="grid"]`, `[role="tablist"]`, `[aria-selected="true"]`,
   `[aria-checked="true"]`, `[aria-current="page"]`. Do not match on
   `aria-label` text; it changes with the UI language.
3. **`[data-encore-id="…"]`** — Encore component names (button kinds,
   chip, card, menu). Stable across builds, unlike Encore's `e-NNNNNN-*`
   classes, which carry a build number.
4. **Encore classes and tokens**: `.encore-dark-theme`, `.encore-*-set`,
   `.encore-text-*`. Often a token override (see SKILL.md) beats a selector.
5. **Readable mapped classes**: `main-*`, `x-*`, `view-*`, `npv-*`. Check they
   exist in the installed build first.
6. **Hashed classes**: last resort. Put them in the FRAGILE section with a
   comment naming the element.

Combine for precision: `[data-testid="now-playing-bar"] button[aria-checked="true"]`.

## Discovering selectors on the live client

Needs Spotify running with the DevTools port (see the spicetify-test skill:
`spicetify watch -s` starts it).

```bash
scripts/inspect.sh testids                    # all data-testid values on the current page
scripts/inspect.sh tree '[data-testid="now-playing-bar"]'   # ancestry with classes/testid/role
scripts/inspect.sh at 640 860                 # what is at this point of the window?
scripts/inspect.sh style '[data-testid="topbar"]' background-color color
scripts/inspect.sh vars                       # resolved --spice-* and Encore tokens
agent-browser --session spotineu snapshot -i  # accessibility tree, good for finding roles
```

To find what is at a spot in a screenshot, take the screenshot with
`scripts/snap.sh`, read off the coordinates, then use `inspect.sh at x y`.
Screenshot pixels may be device pixels (2× on Retina). Halve them if the
match looks wrong.

Navigate to a page before inspecting it:

```bash
agent-browser --session spotineu eval "Spicetify.Platform.History.push('/search')"
```

Useful routes: `/`, `/search`, `/collection/tracks` (Liked Songs),
`/playlist/<id>`, `/album/<id>`, `/artist/<id>`, `/queue`, `/lyrics`,
`/preferences`.

The user can also open DevTools themselves: `spicetify enable-devtools`, then
Cmd+Option+I in Spotify.

## Checking a selector exists in the installed build

```bash
X="$(spicetify config spotify_path)/Apps/xpui"
grep -l 'main-trackList-trackListRow' "$X"/*.css "$X"/*.js | grep -v user.css
grep -oh 'data-testid":"[a-z-]*' "$X"/*.js | sort -u       # every testid in the bundle
grep -oh '\.main-[A-Za-z]*-[A-Za-z]*' "$X"/*.css | sort -u  # every mapped main-* class
```

`node scripts/check-theme.mjs` runs the first check for every class in
`user.css` and warns about classes that are not in the build.

## Classes added by theme.js

If `theme.js` adds classes (for example `sn-playing`), prefix them `sn-` so
they are easy to tell apart. The checker will report them as "not found in the
build", which is expected for `sn-*` names.
