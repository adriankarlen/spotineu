// Demo mode for README screenshots: anonymises the live Spotify page. Not part of the theme.
// Run:  agent-browser --session spotineu eval "$(cat scripts/demo-mode.js)"
// Undo: reload Spotify (agent-browser --session spotineu reload).
//
// - Library titles -> generic playlist names; the same names replace those titles anywhere else
//   (shortcut tiles, now-playing context, cards).
// - User-made playlist covers (mosaic.scdn.co, ab67706c… ids) -> soft gradients from the scheme.
// - Account name -> "listener"; avatar initial -> "L".
// - Shelves that expose the household (audiobooks, kids, recents, own playlists, "made for") hidden.
// - The Marketplace all-lowercase snippet is neutralised (not part of the theme).
(() => {
  if (window.__snDemo) {
    window.__snDemo.apply();
    return "demo mode re-applied";
  }

  const NAMES = [
    "Late night drive", "Focus flow", "Sunday coffee", "Running mix", "Indie finds",
    "Deep house", "Rainy day", "Throwbacks", "Workout", "Chill evenings", "Road trip",
    "Acoustic mornings", "Jazz classics", "Electronic", "Lo-fi beats", "Party starters",
    "Summer", "Piano", "Ambient", "Synthwave", "Soul", "Golden hour", "Night shift",
    "Weekend", "Dinner", "Study", "Morning", "Old favourites", "New finds", "Slow songs",
    "Dance", "Rock classics", "Hip hop", "Folk", "Calm", "Energy", "Retro", "Discover",
    "Mixtape", "Lullabies",
  ];
  const ACCOUNT = /adriankarlen/gi;
  const HIDE_SHELF = /audiobook|kids|barn|children|recent|jump back|made for|podcast|your playlists|your shows/i;

  const map = new Map(); // original title -> generic title
  const css = getComputedStyle(document.documentElement);
  const c = (n) => css.getPropertyValue(n).trim() || "#888";
  const swatches = [
    [c("--spice-button-active"), c("--spice-highlight")],
    [c("--spice-subtext"), c("--spice-main")],
    [c("--spice-notification-error"), c("--spice-button-active")],
    [c("--spice-text"), c("--spice-subtext")],
  ];
  const cover = (i) => {
    const [a, b] = swatches[i % swatches.length];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="64" height="64" fill="url(#g)"/></svg>`;
    return "data:image/svg+xml," + encodeURIComponent(svg);
  };
  const isPersonalImage = (src) => /mosaic\.scdn\.co|ab67706c/.test(src || "");

  const nameFor = (orig) => {
    if (!map.has(orig)) map.set(orig, NAMES[map.size % NAMES.length]);
    return map.get(orig);
  };

  const apply = () => {
    // Library rows: the first text span is the title.
    document.querySelectorAll('#Desktop_LeftSidebar_Id [role="row"]').forEach((row) => {
      const span = [...row.querySelectorAll("span")].find((s) => s.children.length === 0 && s.textContent.trim() && !/^(playlist|album|artist|podcast|audiobook|•)$/i.test(s.textContent.trim()));
      if (span && !span.dataset.snDemo) {
        span.textContent = nameFor(span.textContent.trim());
        span.dataset.snDemo = "1";
      }
      // Generic names read oddly next to "Audiobook" / "Podcast": every row becomes a playlist.
      row.querySelectorAll("span").forEach((s) => {
        if (/^(album|artist|podcast|audiobook)$/i.test(s.textContent.trim())) s.textContent = "Playlist";
      });
    });

    // Text anywhere: known personal titles and the account name.
    const walker = document.createTreeWalker(document.querySelector("#main") || document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const n = walker.currentNode;
      const v = n.nodeValue.trim();
      if (!v) continue;
      if (map.has(v) && n.parentElement && !n.parentElement.dataset.snDemo) n.nodeValue = map.get(v);
      else if (ACCOUNT.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(ACCOUNT, "listener");
      ACCOUNT.lastIndex = 0;
    }
    document.querySelectorAll("[title], [aria-label]").forEach((el) => {
      for (const a of ["title", "aria-label"]) {
        const v = el.getAttribute(a);
        if (v && map.has(v)) el.setAttribute(a, map.get(v));
        else if (v && /adriankarlen/i.test(v)) el.setAttribute(a, v.replace(ACCOUNT, "listener"));
      }
    });

    // Shortcut tiles: generic names and gradient covers for every tile.
    document.querySelectorAll('div:has(> div > [data-testid="shortcut-background"])').forEach((tile, i) => {
      const p = tile.querySelector("p");
      if (p && !p.dataset.snDemo) {
        p.textContent = map.get(p.textContent.trim()) || NAMES[(i * 7 + 3) % NAMES.length];
        p.dataset.snDemo = "1";
      }
      tile.querySelectorAll("img").forEach((img) => {
        if (!img.dataset.snDemo) { img.srcset = ""; img.src = cover(i); img.dataset.snDemo = "1"; }
      });
    });

    // User-made playlist covers anywhere.
    let k = 0;
    document.querySelectorAll("img").forEach((img) => {
      if (!img.dataset.snDemo && isPersonalImage(img.currentSrc || img.src)) {
        img.srcset = ""; img.src = cover(k++); img.dataset.snDemo = "1";
      }
    });

    // Account avatar initial.
    const avatar = document.querySelector('[data-testid="user-widget-link"] > span');
    if (avatar && avatar.textContent.trim().length === 1) avatar.textContent = "L";

    // Shelves that expose the household.
    document.querySelectorAll('section[data-testid="component-shelf"]').forEach((s) => {
      const label = (s.getAttribute("aria-label") || "") + " " + (s.querySelector("h2")?.textContent || "");
      if (HIDE_SHELF.test(label)) s.style.display = "none";
    });
  };

  // The owner's Marketplace "all-lowercase" snippet is not part of the theme; show the theme's own case.
  document.body.style.textTransform = "none";

  apply();
  const obs = new MutationObserver(() => {
    obs.disconnect();
    try { apply(); } finally { obs.observe(document.body, { childList: true, subtree: true, characterData: true }); }
  });
  obs.observe(document.body, { childList: true, subtree: true, characterData: true });
  window.__snDemo = { apply, map, obs };
  return `demo mode on (${map.size} titles mapped)`;
})();
