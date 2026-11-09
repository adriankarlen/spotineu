---
name: spicetify-test
description: Test and verify changes to the spotineu Spicetify theme — static checks of color.ini/user.css/theme.js, live reload with spicetify watch, screenshots of the real Spotify client over its DevTools port with agent-browser, computed-style and contrast checks, and visual diffs. Use this after every theme edit, before saying a theme change is done, when the user asks to "test", "check", "verify", "see how it looks", "take a screenshot", or when something in Spotify looks wrong and needs debugging.
---

# Testing the spotineu theme

Never report a theme change as done without at least steps 1 and 3 below.
"It should work" is not verification. Look at the client.

The loop has four levels. Go as deep as the change needs:

| Level | What | When |
|---|---|---|
| 1. Static | `node scripts/check-theme.mjs` | Every edit |
| 2. Live reload | `spicetify watch -s` running | Every edit (keep it running) |
| 3. Look | `scripts/snap.sh` + read the PNG + design checklist | Every visual change |
| 4. Assert | computed styles, contrast, visual diff | Colour/scheme work, regressions, bugs |

## 1. Static checks

```bash
node scripts/check-theme.mjs                     # checks ./theme
node scripts/check-theme.mjs --scheme <name>     # also confirms the scheme exists
node scripts/check-theme.mjs --no-selectors      # skip the (slower) Spotify bundle scan
```

It catches:

- `color.ini`: keys outside a section, invalid values, a `#` before hex
  (Spicetify reads it as a comment and the value is lost), missing base keys,
  custom keys missing from some schemes, duplicates, unknown `--scheme`.
- `user.css`: unbalanced braces/strings/comments, `var(--spice-x)` with no
  matching key, `rgba(var(--spice-x), a)` (must be `--spice-rgb-x`),
  build-hashed class names, and classes that do not exist in the installed
  Spotify build.
- `theme.js`: syntax errors (`node --check`).
- `assets/` without `overwrite_assets = 1`.

Exit code 1 means errors: fix them before going further. Warnings need a
judgement. "Classes not found" is real breakage unless the class is an `sn-*`
class from theme.js.

## 2. Live reload

Preconditions (check, do not assume):

```bash
spicetify config current_theme        # must print spotineu
readlink ~/.config/spicetify/Themes/spotineu    # must point at <repo>/theme
pgrep -fl "spicetify watch"           # is watch mode already running?
curl -s localhost:9222/json/list | grep -c spotify   # is the DevTools port up?
```

If the theme is not active, run `scripts/link-theme.sh --activate <scheme>`
once (see the spicetify-theme skill). It restarts Spotify.

Start watch mode in the background if it is not running:

```bash
nohup spicetify watch -s > /tmp/spotineu-watch.log 2>&1 &
```

`-s` watches `color.ini`, `user.css`, `theme.js` and `assets/` of the active
theme and reloads Spotify after each change. If Spotify is not on DevTools
port 9222, watch **restarts Spotify** with `--remote-debugging-port=9222`. That
stops playback, so tell the user the first time you start it in a session.

After each edit, confirm the reload happened:

```bash
sleep 2; tail -n 5 /tmp/spotineu-watch.log    # expect "Reloaded Spotify"
```

Gotchas:

- If you relaunch Spotify yourself, start it with the port:
  `open -a Spotify --args --remote-debugging-port=9222 '--remote-allow-origins=*'`.
  Watch's own restart can fail to bring Spotify back up; then use that
  command.

- Watch only picks up `theme.js` and `assets/` if they existed when it
  started. After creating either, restart it:
  `pkill -f "spicetify watch"; nohup spicetify watch -s > /tmp/spotineu-watch.log 2>&1 &`
- Watch mode keeps the colour scheme it started with and rewrites
  `colors.css` with it on every change. To switch scheme, restart watch
  (Spotify keeps running; the port is already open):
  `spicetify config color_scheme <name>; pkill -f "spicetify watch"; nohup spicetify watch -s > /tmp/spotineu-watch.log 2>&1 &`
- Every live reload resets UI state: overlays (lyrics, menus) close and the
  right panel may change. Reopen what you are testing after each edit,
  then screenshot.
- After creating `theme/theme.js` for the first time, run
  `spicetify apply -n` (adds its `<script>` tag to Spotify), restart watch,
  and reload Spotify (`agent-browser --session spotineu reload`).
- Spotify may install an update when it restarts. Then Apps/xpui is gone or
  the page has no `Spicetify` object (`scripts/snap.sh` exits with code 3).
  Fix: `spicetify backup apply -n`, quit Spotify
  (`osascript -e 'quit app "Spotify"'`), start watch again.
- If watch logs "Could not reload Spotify", Spotify lost its debug port.
  Kill watch and start it again.
- Without watch: `spicetify refresh` and then reload Spotify yourself
  (Cmd+Shift+R in the client, or `agent-browser --session spotineu reload`).

## 3. Look at the client

```bash
scripts/snap.sh home /                        # -> .screenshots/home.png
scripts/snap.sh liked /collection/tracks
scripts/snap.sh search /search
scripts/snap.sh settings /preferences
scripts/snap.sh now                           # current view, no navigation
```

Then open the PNG with the `read` tool and actually look at it. Screenshots
are 2× (about 4000 px wide). Crop to the area you changed so details are
visible, for example:
`magick .screenshots/home.png -crop 3100x1300+900+150 +repage -resize 60% .screenshots/crop.png`.
Read the file in a separate step from the command that wrote it; reading in
the same batch can fail with "file not found".

Check:

- The changed area looks as intended.
- No stock Spotify green (`#1db954`, `#1ed760`, `#3be477`, `#1abc54`) or
  stock greys leaking through.
- Text is readable on every surface it sits on (hover states too).
- Nothing else regressed: sidebar, top bar, player bar, main view, right panel.
- It follows the design language: run the checklist in the `spotineu-design`
  skill (references/review-checklist.md) on the screenshots, in at least one
  light and one dark scheme.

For a change to shared surfaces or colours, cover the standard set: home,
liked songs (track list), search, an album or playlist page, settings, and
the player bar in both playing and paused state. Do it for **every scheme**
in `color.ini` when colours change.

Hover and menus need interaction first:

```bash
agent-browser --session spotineu snapshot -i          # find element refs
agent-browser --session spotineu hover @e12
agent-browser --session spotineu click @e7            # e.g. open a context menu
scripts/snap.sh menu
agent-browser --session spotineu press Escape
```

Do not play, like, follow, add to playlists, or change Spotify settings
through automation unless the user asks. Those act on the user's real account.
Toggling play/pause to test the player bar is fine if the user is not
listening; ask if unsure.

Screenshots contain personal data (account, playlists). `.screenshots/` is
git-ignored. Never commit them or attach them anywhere public.

## 4. Assertions and deeper checks

**Alignment**: eyeballing a 2× screenshot misses 6px offsets. Measure:

```bash
scripts/inspect.sh row '[data-testid="general-controls"] button'   # sizes, centre-y, icon size
scripts/inspect.sh row '#global-nav-bar button'
```

**Stray black shadows**: `scripts/inspect.sh shadows` lists visible plain
black drop shadows on the current page. Run it on each page you touched,
after scrolling lists and hovering cards.

Do not use `agent-browser set offline on` to provoke loading states:
Spotify notices and switches the whole app to offline mode.

**Clipped shadows**: list the ancestors that cut off or paint over one:

```bash
scripts/inspect.sh clip '<selector of the raised element>'
```

Fix by moving the treatment onto the clipping wrapper (its own shadow is not
clipped by its own overflow), by padding inside it, or by making a painting
wrapper transparent.

**Computed styles**: confirm a rule actually wins:

```bash
scripts/inspect.sh style '[data-testid="now-playing-bar"]' background-color color
scripts/inspect.sh vars          # resolved --spice-* and Encore tokens
```

If the value is not what `user.css` says, a more specific or unlayered rule is
winning. Use `scripts/inspect.sh tree '<selector>'` to see the element's
ancestry, or ask the user to open DevTools (Cmd+Option+I after
`spicetify enable-devtools`) for the Styles pane.

**Contrast**: for a new or changed scheme, check `text` and `subtext` against
`main`, `main-elevated`, `card`, `player`, and text on `button-active`.
Compute WCAG ratios from the hex values in `color.ini` (aim for ≥ 4.5:1, or
≥ 7:1 for `text` on `main`). `agent-browser --session spotineu a11y` runs an
axe audit on the live page. Filter its output for `color-contrast`; ignore the
rest, which is Spotify's own markup.

**Console errors** (theme.js, broken asset URLs):

```bash
agent-browser --session spotineu errors
agent-browser --session spotineu console | grep -i -E "spotineu|error|404"
```

**Visual diff**: guard a finished area against regressions. Feeds and
now-playing content change between runs, so diff stable views (settings) or
scope to an element:

```bash
mkdir -p .screenshots/baseline
cp .screenshots/settings.png .screenshots/baseline/settings.png   # when the user approves a look
agent-browser --session spotineu diff screenshot --baseline .screenshots/baseline/settings.png \
  -o .screenshots/settings-diff.png
```

Keep the Spotify window the same size between baseline and comparison.

## Demo screenshots (README)

`scripts/demo-mode.js` anonymises the live page: generic library names,
gradient covers for user-made playlists, "listener" for the account, no
household shelves (audiobooks, kids, recents, own playlists), and the
owner's all-lowercase Marketplace snippet neutralised. Run it after each
navigation (it also watches for re-renders), use public editorial pages
(for example `/playlist/37i9dQZF1DXcBWIGoYBM5M`), and check every image
for personal data before committing. Output goes to `docs/screenshots/`
as 1× WebP:
`magick .screenshots/x.png -resize 2046x -quality 88 docs/screenshots/x.webp`.

## Reporting

Say what you verified and how: which check ran, which views and schemes you
looked at, and what you saw. List the screenshot paths so the user can open
them. If you could not run a level (Spotify not running, user declined a
restart), say so plainly and do not claim the change works.

## Cleaning up

The DevTools port gives any local process full control of Spotify (and its
logged-in session), so do not leave it open after the work is done. When the
session is done, or the user wants Spotify back to normal:

```bash
pkill -f "spicetify watch"
spicetify restart        # relaunch without the DevTools port
```

Do not run `agent-browser close` on the `spotineu` session: on a CDP
connection it may quit Spotify itself.

To go back to the user's previous theme, see "Restoring the user's previous
theme" in the spicetify-theme skill.
