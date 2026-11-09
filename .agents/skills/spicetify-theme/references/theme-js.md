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

## What theme.js does today

`theme/theme.js` sets `html.sn-route-<first path segment>` (`sn-route-home`,
`sn-route-search`, `sn-route-playlist`, `sn-route-collection` …) on every
route change. Use these classes in user.css for route-dependent states.
Extend the same file rather than adding a second script.

## Skeleton

```js
// theme/theme.js — spotineu
(async function spotineu() {
  // Spicetify and Spotify boot after this script starts. Wait for what you use.
  while (!window.Spicetify?.Player?.data || !Spicetify.Platform) {
    await new Promise((r) => setTimeout(r, 100));
  }

  const root = document.documentElement;

  const onSong = async () => {
    const uri = Spicetify.Player.data?.item?.uri;
    if (!uri) return;
    try {
      const c = await Spicetify.colorExtractor(uri); // { VIBRANT, PROMINENT, DARK_VIBRANT, ... }
      root.style.setProperty("--sn-art-vibrant", c.VIBRANT);
    } catch (e) {
      console.warn("[spotineu] colorExtractor failed", e);
    }
  };

  const onPlayPause = () => {
    root.classList.toggle("sn-playing", Spicetify.Player.isPlaying());
  };

  Spicetify.Player.addEventListener("songchange", onSong);
  Spicetify.Player.addEventListener("onplaypause", onPlayPause);
  onSong();
  onPlayPause();
})();
```

## Rules

- Wrap everything in an async IIFE; never leak globals.
- Prefix theme classes and variables with `sn-` / `--sn-`.
- Log with a `[spotineu]` prefix so it is easy to find in the console.
- Fail soft: a thrown error must not break Spotify. Use `try`/`catch` around
  API calls that may not exist in every Spotify version.
- For DOM that appears later (route changes, lazy panels) use a single
  `MutationObserver` on a stable container, and disconnect it when done.
  Do not poll with `setInterval` for DOM.
- `Spicetify.Platform.History.listen(cb)` fires on route changes.

## Verifying

- `node scripts/check-theme.mjs` runs `node --check` on theme.js.
- Watch mode (`spicetify watch -s`) refreshes theme.js and reloads Spotify.
- Read errors from the live client:
  `agent-browser --session spotineu console` and `agent-browser --session spotineu errors`.
