// spotineu theme.js: exposes state that CSS cannot see, and builds the v2 features.
// Visuals stay in user.css. Classes, ids and variables are prefixed sn-.
//
// Fallback rule: every v2 feature is a module. Its class (html.sn-<name>) is set only when the
// feature is switched on in the spotineu menu AND its ready() check finds the Spotify nodes it
// needs. If Spotify renames something, the class drops and that area renders as v1.
//
//   html.sn-route-<first path segment>  route (home, search, playlist, collection, ...)
//   html.sn-playing                     playback is running
//   html.sn-<feature>                   feature on and ready (stage, nav, declutter, rows,
//                                       headers, waveform); html.sn-listening while
//                                       listening mode is open
//   --sn-progress                       0..1 playback position, set on .sn-progress-target nodes
(async function spotineu() {
  const wait = async (test) => {
    while (!test()) await new Promise((r) => setTimeout(r, 100));
  };
  // Only History and PlayerAPI are required. Spicetify.Player is not used: after some reloads
  // Spicetify never attaches it (Player.origin stays undefined), and the theme must still run.
  await wait(() => window.Spicetify?.Platform?.History && Spicetify.Platform.PlayerAPI);

  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const log = (...a) => console.warn("[spotineu]", ...a);

  // ==== features: one store, saved in localStorage ====
  const FEATURES = {
    stage: "Stage layout",
    nav: "Left navigation",
    declutter: "Declutter",
    rows: "Two-line track rows",
    headers: "Compact headers and cards",
    waveform: "Waveform seek bar",
    listening: "Listening mode (⌘/Ctrl+Shift+F)",
  };
  const STORE_KEY = "spotineu:features";
  const features = (() => {
    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    } catch {}
    const state = Object.fromEntries(Object.keys(FEATURES).map((k) => [k, saved[k] !== false]));
    return {
      on: (k) => state[k],
      set(k, v) {
        state[k] = v;
        localStorage.setItem(STORE_KEY, JSON.stringify(state));
        schedule();
      },
    };
  })();

  // ==== modules ====
  // { name, ready(): bool, mount(), unmount(), sync() } — all optional except name.
  // mount/unmount run when the class flips; sync runs on every (throttled) DOM change while on.
  const modules = [];
  const active = new Set();
  const define = (m) => modules.push(m);

  const run = (name, fn) => {
    try {
      return fn();
    } catch (e) {
      log(`${name} failed`, e);
      return false;
    }
  };

  function syncAll() {
    for (const m of modules) {
      const want = (m.feature === false || features.on(m.name)) && run(m.name, () => (m.ready ? m.ready() : true));
      const cls = m.className ?? `sn-${m.name}`;
      if (want && !active.has(m.name)) {
        active.add(m.name);
        root.classList.add(cls);
        run(m.name, () => m.mount?.());
      } else if (!want && active.has(m.name)) {
        active.delete(m.name);
        root.classList.remove(cls);
        run(m.name, () => m.unmount?.());
      }
      if (active.has(m.name)) run(m.name, () => m.sync?.());
    }
  }

  // Throttled: Spotify mutates the DOM constantly. At most one sync per 150 ms.
  let timer = 0;
  function schedule() {
    if (timer) return;
    timer = setTimeout(() => {
      timer = 0;
      requestAnimationFrame(syncAll);
    }, 150);
  }

  // ==== route ====
  const History = Spicetify.Platform.History;
  const applyRoute = (location) => {
    const segment = (location?.pathname ?? "/").split("/")[1] || "home";
    for (const c of [...root.classList]) {
      if (c.startsWith("sn-route-")) root.classList.remove(c);
    }
    root.classList.add(`sn-route-${segment.replace(/[^a-z0-9-]/gi, "")}`);
    schedule();
  };
  applyRoute(History.location);
  History.listen(applyRoute);

  // ==== player-state: sn-playing and --sn-progress ====
  // Reads Spotify's PlayerAPI state (public getState()) and polls it: every 250 ms while playing
  // and visible, every second otherwise. Track and play/pause changes come out of the same poll.
  const player = {
    state() {
      const api = Spicetify.Platform.PlayerAPI;
      try {
        return api.getState?.() ?? api._state;
      } catch {
        return api._state;
      }
    },
    item: () => player.state()?.item,
    playing: () => {
      const s = player.state();
      return !!s?.item && !s.isPaused;
    },
    duration: () => player.state()?.duration || 0,
    position() {
      const s = player.state();
      if (!s) return 0;
      const p = (s.positionAsOfTimestamp || 0) + (s.isPaused ? 0 : (Date.now() - (s.timestamp || Date.now())) * (s.speed || 1));
      return Math.max(0, Math.min(p, s.duration || p));
    },
    seek: (ms) => Spicetify.Platform.PlayerAPI.seekTo(ms),
    listeners: { song: [], playpause: [] },
    on(type, fn) {
      this.listeners[type].push(fn);
    },
  };
  const progress = {
    value: 0,
    paint() {
      const d = player.duration();
      this.value = d ? Math.min(1, Math.max(0, player.position() / d)) : 0;
      const v = this.value.toFixed(4);
      for (const el of document.querySelectorAll(".sn-progress-target, .main-trackList-active")) {
        el.style.setProperty("--sn-progress", v);
      }
    },
  };
  {
    let lastUri = null;
    let lastPlaying = null;
    const poll = () => {
      const uri = player.item()?.uri ?? null;
      const playing = player.playing();
      if (uri !== lastUri) {
        lastUri = uri;
        player.listeners.song.forEach((fn) => run("songchange", fn));
        schedule();
      }
      if (playing !== lastPlaying) {
        lastPlaying = playing;
        root.classList.toggle("sn-playing", playing);
        player.listeners.playpause.forEach((fn) => run("playpause", fn));
      }
      progress.paint();
      setTimeout(poll, playing && !document.hidden ? 250 : 1000);
    };
    poll();
  }

  // ==== feature modules ====
  const bar = () => $('[data-testid="now-playing-bar"]');
  const barGrid = () => $('[data-testid="now-playing-bar"] > div');
  const imageUrl = (uri) => (uri?.startsWith("spotify:image:") ? `https://i.scdn.co/image/${uri.slice(14)}` : uri || "");
  const coverUrl = () => {
    const imgs = player.item()?.images || [];
    const pick = imgs.find((i) => i.label === "xlarge") || imgs.find((i) => i.label === "large") || imgs[0];
    return imageUrl(pick?.url);
  };
  const el = (tag, props = {}, ...kids) => {
    const n = Object.assign(document.createElement(tag), props);
    n.append(...kids);
    return n;
  };
  const icon = (name, size = 16) =>
    `<svg role="img" viewBox="0 0 16 16" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">${Spicetify.SVGIcons?.[name] ?? ""}</svg>`;

  // ---- stage: the player becomes the head of the right column ----
  // Below this window width the stage drops and the v1 bottom bar returns.
  const STAGE_MIN_WIDTH = 1100;
  const stage = {
    lastPanelClick: 0,
    art() {
      const grid = barGrid();
      if (!grid) return;
      let frame = grid.querySelector(":scope > .sn-stage-art");
      if (!frame) {
        frame = el("div", { className: "sn-stage-art" }, el("img", { alt: "", decoding: "async", draggable: false }));
        grid.append(frame);
      }
      const img = frame.querySelector("img");
      const url = coverUrl();
      if (img.dataset.src !== url) {
        img.dataset.src = url;
        img.src = url;
        frame.classList.toggle("sn-empty", !url);
      }
      return frame;
    },
    // The right column always shows a panel: the queue unless the user picked devices or another
    // panel. Spotify falls back to the now playing view, which the stage replaces, so switch
    // that (and "no panel") to the queue. The aside and the cover button carry the same
    // localised label, so comparing them works in every UI language.
    panel() {
      const queue = $('[data-testid="control-button-queue"]');
      if (!queue || Date.now() - this.lastPanelClick < 1500) return;
      const devices = $('[data-testid="lyrics-button"] ~ span > button');
      if (queue.getAttribute("aria-pressed") === "true" || devices?.getAttribute("aria-pressed") === "true") return;
      const aside = $("#Desktop_PanelContainer_Id");
      const npvLabel = $('[data-testid="cover-art-button"]')?.getAttribute("aria-label");
      if (!aside || aside.getAttribute("aria-label") === npvLabel) {
        this.lastPanelClick = Date.now();
        queue.click();
      }
    },
  };
  define({
    name: "stage",
    ready: () =>
      innerWidth >= STAGE_MIN_WIDTH &&
      !!(
        $("div:has(> #main-view) > #global-nav-bar") &&
        $('div:has(> #main-view) > div > [data-testid="now-playing-bar"]') &&
        $('[data-testid="now-playing-widget-v2"]') &&
        $('[data-testid="general-controls"]') &&
        $('[data-testid="playback-progressbar"]') &&
        $('[data-testid="control-button-queue"]')
      ),
    mount() {
      stage.art();
      stage.panel();
    },
    unmount() {
      document.querySelectorAll(".sn-stage-art").forEach((n) => n.remove());
    },
    sync() {
      stage.art();
      stage.panel();
    },
  });

  // ---- nav: back / forward and Home, Search, Liked Songs at the top of the library slab ----
  const T = (key, fallback) => Spicetify.Platform.Translations?.[key] || fallback;
  const nav = {
    host: () => $("#Desktop_LeftSidebar_Id > nav"),
    // Spotify's own icons are cloned so the nav matches the rest of the client.
    svgFrom(sel, fallbackIcon) {
      const svg = $(sel)?.querySelector("svg");
      if (svg) {
        const c = svg.cloneNode(true);
        c.removeAttribute("class");
        c.setAttribute("width", "20");
        c.setAttribute("height", "20");
        c.setAttribute("aria-hidden", "true");
        return c.outerHTML;
      }
      return icon(fallbackIcon, 20);
    },
    items() {
      return [
        { id: "home", path: "/", label: T("view.web-player-home", "Home"), icon: this.svgFrom('#global-nav-bar div:has(> div > form[role="search"]) > button', "enhance") },
        { id: "search", path: "/search", label: T("navbar.search", "Search"), icon: icon("search", 20) },
        { id: "liked", path: "/collection/tracks", label: T("sidebar.liked_songs", "Liked Songs"), icon: icon("heart", 20) },
      ];
    },
    build() {
      const back = el("button", { className: "sn-nav-history-btn", type: "button", innerHTML: icon("chevron-left", 16) });
      back.setAttribute("aria-label", T("navbar.go-back", "Go back"));
      back.dataset.snGo = "-1";
      const fwd = el("button", { className: "sn-nav-history-btn", type: "button", innerHTML: icon("chevron-right", 16) });
      fwd.setAttribute("aria-label", T("navbar.go-forward", "Go forward"));
      fwd.dataset.snGo = "1";
      back.addEventListener("click", () => History.goBack());
      fwd.addEventListener("click", () => History.goForward());
      const list = el("ul", { className: "sn-nav-list" });
      for (const it of this.items()) {
        const b = el("button", { className: "sn-nav-item", type: "button" }, el("span", { className: "sn-nav-icon", innerHTML: it.icon }), el("span", { className: "sn-nav-label", textContent: it.label }));
        b.dataset.snPath = it.path;
        b.title = it.label;
        b.addEventListener("click", () => History.push(it.path));
        list.append(el("li", {}, b));
      }
      const box = el("div", { className: "sn-nav" }, el("div", { className: "sn-nav-history" }, back, fwd), list);
      box.setAttribute("role", "navigation");
      return box;
    },
    sync() {
      const host = this.host();
      if (!host) return;
      let box = host.querySelector(":scope > .sn-nav");
      if (!box) host.prepend((box = this.build()));
      const path = History.location?.pathname || "/";
      for (const b of box.querySelectorAll(".sn-nav-item")) {
        const p = b.dataset.snPath;
        const current = p === "/" ? path === "/" : path === p || path.startsWith(p + "/");
        if (current) b.setAttribute("aria-current", "page");
        else b.removeAttribute("aria-current");
      }
      for (const b of box.querySelectorAll("[data-sn-go]")) b.disabled = !History.canGo?.(Number(b.dataset.snGo));
      // The library can be collapsed to a narrow rail: show icons only.
      box.classList.toggle("sn-nav-rail", host.getBoundingClientRect().width < 180);
    },
  };
  define({
    name: "nav",
    ready: () => !!nav.host(),
    unmount: () => document.querySelectorAll(".sn-nav").forEach((n) => n.remove()),
    sync: () => nav.sync(),
  });

  // ---- CSS-only features: the class is all they need ----
  define({ name: "declutter" });
  // rows: the playing row is (re)rendered by Spotify at any time; give it the current position.
  define({ name: "rows", ready: () => !!$("#main-view"), sync: () => progress.paint() });
  define({ name: "headers", ready: () => !!$("#main-view") });

  // ---- waveform: loudness bars behind Spotify's progress slider (stage only) ----
  // Data: Spicetify.getAudioData() (Spotify's internal audio analysis). Spotify closed the
  // public endpoint in 2024; if this one fails too, the class never appears and the plain
  // slider stays. Spotify's slider stays on top (transparent) for seeking and keyboard use.
  const wave = {
    BARS: 72,
    cache: new Map(), // uri -> number[] (0..1) or null when it failed
    loading: new Set(),
    host: () => $('[data-testid="now-playing-bar"] [data-testid="player-controls"] div:has(> [data-testid="playback-progressbar"])'),
    uri: () => {
      const it = player.item();
      return it?.uri?.startsWith("spotify:track:") ? it.uri : null;
    },
    bucket(data) {
      const dur = data?.track?.duration || 0;
      const segs = data?.segments || [];
      if (!dur || segs.length < 8) return null;
      const n = this.BARS;
      const raw = new Array(n).fill(-60);
      for (const s of segs) {
        const a = Math.max(0, Math.floor((s.start / dur) * n));
        const b = Math.min(n - 1, Math.floor(((s.start + s.duration) / dur) * n));
        for (let i = a; i <= b; i++) raw[i] = Math.max(raw[i], s.loudness_max ?? -60);
      }
      const sorted = [...raw].sort((x, y) => x - y);
      const lo = sorted[Math.floor(n * 0.08)];
      const hi = sorted[n - 1];
      const span = Math.max(1, hi - lo);
      return raw.map((v) => 0.12 + 0.88 * Math.pow(Math.min(1, Math.max(0, (v - lo) / span)), 1.6));
    },
    async load(uri) {
      if (!uri || this.cache.has(uri) || this.loading.has(uri) || !Spicetify.getAudioData) return;
      this.loading.add(uri);
      try {
        this.cache.set(uri, this.bucket(await Spicetify.getAudioData(uri)));
      } catch (e) {
        this.cache.set(uri, null);
        log("no audio analysis for", uri, e);
      } finally {
        this.loading.delete(uri);
        if (this.cache.size > 50) this.cache.delete(this.cache.keys().next().value);
        schedule();
      }
    },
    svg(bars) {
      const w = 3;
      const rects = bars
        .map((h, i) => {
          const hh = (h * 100).toFixed(1);
          return `<rect x="${i * w}" y="${((100 - h * 100) / 2).toFixed(1)}" width="${w - 1}" height="${hh}" rx="1"/>`;
        })
        .join("");
      return `<svg viewBox="0 0 ${bars.length * w - 1} 100" preserveAspectRatio="none" aria-hidden="true">${rects}</svg>`;
    },
    render() {
      const host = this.host();
      const uri = this.uri();
      const bars = uri && this.cache.get(uri);
      if (!host || !bars) return;
      let box = host.querySelector(":scope > .sn-wave");
      if (!box) {
        box = el("div", { className: "sn-wave sn-progress-target" });
        host.prepend(box);
      }
      if (box.dataset.uri !== uri) {
        box.dataset.uri = uri;
        const s = this.svg(bars);
        box.innerHTML = `<div class="sn-wave-base">${s}</div><div class="sn-wave-played">${s}</div>`;
        progress.paint();
      }
    },
  };
  player.on("song", () => wave.load(wave.uri()));
  define({
    name: "waveform",
    ready() {
      if (!root.classList.contains("sn-stage") || !wave.host()) return false;
      const uri = wave.uri();
      if (uri && !wave.cache.has(uri)) wave.load(uri);
      return !!(uri && wave.cache.get(uri));
    },
    mount: () => wave.render(),
    sync: () => wave.render(),
    unmount: () => document.querySelectorAll(".sn-wave").forEach((n) => n.remove()),
  });

  // ---- listening mode: only the player (large) and the queue or lyrics ----
  // Opened from the button on the stage art, or ⌘/Ctrl+Shift+F; Esc or the button closes it.
  // html.sn-listening-available = feature on and stage active; html.sn-listening = open.
  const isMac = /Mac/i.test(navigator.platform || navigator.userAgent);
  const listening = {
    open: false,
    set(open) {
      this.open = open && root.classList.contains("sn-listening-available");
      root.classList.toggle("sn-listening", this.open);
      const btn = $(".sn-listen-btn");
      if (btn) this.label(btn);
      schedule();
    },
    label(btn) {
      btn.setAttribute("aria-pressed", String(this.open));
      btn.setAttribute("aria-label", this.open ? "Leave listening mode" : "Listening mode");
      btn.title = `${this.open ? "Leave listening mode" : "Listening mode"} (${isMac ? "⌘" : "Ctrl+"}⇧F)`;
      btn.innerHTML = icon(this.open ? "minimize" : "fullscreen", 16);
    },
    button() {
      const frame = $(".sn-stage-art");
      if (!frame || frame.querySelector(".sn-listen-btn")) return;
      const btn = el("button", { className: "sn-listen-btn", type: "button" });
      btn.addEventListener("click", () => this.set(!this.open));
      this.label(btn);
      frame.append(btn);
    },
  };
  // Spotify keeps hidden dialogs in the DOM; only a visible one should take Esc.
  const overlayOpen = () =>
    [...document.querySelectorAll('[role="dialog"], [role="menu"], #context-menu')].some((n) =>
      n.checkVisibility ? n.checkVisibility({ visibilityProperty: true, opacityProperty: true }) : n.getClientRects().length > 0
    );
  document.addEventListener(
    "keydown",
    (e) => {
      if (!root.classList.contains("sn-listening-available")) return;
      const mod = isMac ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey;
      if (mod && e.shiftKey && !e.altKey && e.code === "KeyF") {
        e.preventDefault();
        listening.set(!listening.open);
      } else if (e.key === "Escape" && listening.open && !overlayOpen()) {
        listening.set(false);
      }
    },
    true
  );
  define({
    name: "listening",
    className: "sn-listening-available",
    ready: () => root.classList.contains("sn-stage"),
    mount: () => listening.button(),
    sync: () => listening.button(),
    unmount() {
      document.querySelectorAll(".sn-listen-btn").forEach((n) => n.remove());
      listening.set(false);
    },
  });

  // __MODULES__

  // ==== menu: spotineu toggles in the profile menu ====
  await wait(() => Spicetify.Menu?.SubMenu);
  run("menu", () => {
    const items = Object.entries(FEATURES).map(
      ([k, label]) => new Spicetify.Menu.Item(label, features.on(k), (self) => {
        features.set(k, !features.on(k));
        self.setState(features.on(k));
      })
    );
    new Spicetify.Menu.SubMenu("spotineu", items).register();
  });

  // ==== observer ====
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  window.addEventListener("resize", schedule);
  syncAll();
})().catch((e) => console.warn("[spotineu] theme.js failed", e));
