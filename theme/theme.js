// spotineu theme.js: exposes state that CSS cannot see, as classes on <html>.
// Visuals stay in user.css. Classes and variables are prefixed sn-.
//
//   html.sn-route-home     on the home page
//   html.sn-route-search   on the search page
//   html.sn-route-<first path segment> otherwise (playlist, album, artist, collection, preferences …)
(async function spotineu() {
  try {
    while (!window.Spicetify?.Platform?.History) {
      await new Promise((r) => setTimeout(r, 100));
    }

    const root = document.documentElement;
    const History = Spicetify.Platform.History;

    const applyRoute = (location) => {
      const segment = (location?.pathname ?? "/").split("/")[1] || "home";
      for (const c of [...root.classList]) {
        if (c.startsWith("sn-route-")) root.classList.remove(c);
      }
      root.classList.add(`sn-route-${segment.replace(/[^a-z0-9-]/gi, "")}`);
    };

    applyRoute(History.location);
    History.listen(applyRoute);
  } catch (e) {
    console.warn("[spotineu] theme.js failed", e);
  }
})();
