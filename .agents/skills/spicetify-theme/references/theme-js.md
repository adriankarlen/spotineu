# theme.js

Optional. Spicetify copies `theme/theme.js` to `xpui/extensions/theme.js` and
loads it with `<script defer>` when `inject_theme_js = 1` (on in this setup).
It runs in Spotify's page with full DOM access and the global `Spicetify`
object. Type definitions: `~/.spicetify/globals.d.ts` (or
<https://github.com/spicetify/cli/blob/main/globals.d.ts>). API docs:
<https://spicetify.app/docs/development/api-wrapper>.

## When to use it

Only when CSS cannot do the job:

- Reacting to player state (playing/paused, current track, artwork colours).
- Adding state classes or CSS variables that CSS then styles.
- Things a selector cannot reach (moving elements, adding wrappers).

Keep the JS small. Let it set classes and variables; keep visuals in user.css.

## What theme.js does today (v2)

`theme/theme.js` is a set of small feature modules around one feature store.

**Fallback rule.** Each v2 feature is a module with a `ready()` check. Its
class `html.sn-<name>` is set only when the feature is on in the spotineu
menu **and** `ready()` finds the Spotify nodes it needs. Every v2 rule in
user.css is scoped under that class, so if Spotify renames something the
class drops and the area renders as v1. Injected nodes are owned by the
module: re-added in `sync()` if React removes them, removed in `unmount()`.
They are only appended or prepended to stable containers, never placed
between React's own children.

| Class / variable | Set by | Meaning |
|---|---|---|
| `html.sn-route-<segment>` | route | first path segment (`home`, `search`, `playlist`, `collection`, …) |
| `html.sn-playing` | player-state | playback is running |
| `--sn-progress` (0..1) | player-state | on `.sn-progress-target` nodes and `.main-trackList-active`, every 250 ms while playing |
| `html.sn-stage` | stage | stage layout; window ≥ 1100px and the player bar parts exist |
| `html.sn-nav` | nav | left nav injected at the top of `#Desktop_LeftSidebar_Id > nav` |
| `html.sn-declutter`, `html.sn-rows`, `html.sn-headers` | CSS-only modules | the feature is on |
| `html.sn-waveform` | waveform | stage is on and audio analysis for the current track loaded |
| `html.sn-listening-available` | listening | feature on and stage active |
| `html.sn-listening` | listening | listening mode is open |

Injected nodes: `.sn-stage-art` (large cover, in the player grid),
`.sn-listen-btn` (inside `.sn-stage-art`), `.sn-nav` (left nav),
`.sn-wave` (waveform, inside the progress container).

Modules, in order:

- **features**: `localStorage["spotineu:features"]`, all on by default, shown
  as toggles under "spotineu" in the profile menu (`Spicetify.Menu.SubMenu`).
- **route**: `History.listen`.
- **player-state**: reads `Spicetify.Platform.PlayerAPI.getState()` and polls
  it (250 ms while playing and visible, 1 s otherwise); track and play/pause
  changes come out of the same poll (`player.on("song" | "playpause")`).
  `Spicetify.Player` is deliberately not used: after some reloads Spicetify
  never attaches it (`Player.origin` stays undefined).
- **stage**: injects the cover; keeps a panel open (clicks the queue button
  when the panel is Spotify's now playing view or closed; the aside and the
  cover button carry the same localised label, so they are compared).
- **nav**: back/forward (`History.goBack/goForward`, disabled from
  `History.canGo`), Home/Search/Liked (`History.push`), labels from
  `Spicetify.Platform.Translations`, `aria-current` on the current page.
- **declutter / rows / headers**: class only (rows also repaints progress).
- **waveform**: `Spicetify.getAudioData(uri)` → 72 bars of `loudness_max`,
  cached per track (50 tracks), drawn as two SVG copies.
- **listening**: button + ⌘/Ctrl+Shift+F (own keydown listener; Spotify does
  not use that combination), Esc closes when no visible dialog or menu.

There is no separate skeleton: `theme/theme.js` is the reference.

Add a feature by adding a module with `define({ name, ready, mount, sync,
unmount })` and a label in `FEATURES`. Extend this file rather than adding
a second script.

## Rules

- Wrap everything in an async IIFE; never leak globals.
- Prefix theme classes and variables with `sn-` / `--sn-`.
- Log with a `[spotineu]` prefix so it is easy to find in the console.
- Fail soft: a thrown error must not break Spotify. Use `try`/`catch` around
  API calls that may not exist in every Spotify version.
- For DOM that appears later (route changes, lazy panels) use the one
  throttled `MutationObserver` in theme.js (`schedule()` → module `sync()`).
  Do not add more observers, and do not poll for DOM.
- Do not wait on `Spicetify.Player.data`/`Player.origin` at startup; they can
  stay undefined after a reload. Use `Spicetify.Platform.PlayerAPI`.
- `Spicetify.Platform.History.listen(cb)` fires on route changes.

## Verifying

- `node scripts/check-theme.mjs` runs `node --check` on theme.js.
- Watch mode (`spicetify watch -s`) refreshes theme.js and reloads Spotify.
- Read errors from the live client:
  `agent-browser --session spotineu console` and `agent-browser --session spotineu errors`.
