// Renders the content from content.js into the page.
// You normally don't need to edit this file.
(function () {
  const site = window.SITE;
  const $ = (id) => document.getElementById(id);

  const escape = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // "2026-11-21" -> Date at local midnight (avoids timezone shifting the day)
  const parseDate = (s) => {
    const [y, m, d] = String(s).split("-").map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };
  const formatDate = (s) =>
    s ? parseDate(s).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }) : "";

  // ---- Artist ----
  const a = site.artist;
  document.title = a.name;
  // The name in the header and hero is the germ1 logo (see index.html).
  $("nav-name").setAttribute("aria-label", a.name);
  $("artist-tagline").textContent = a.tagline;
  $("artist-bio").textContent = a.bio;
  $("footer-text").textContent = `© ${new Date().getFullYear()} ${a.name}`;

  if (a.photo) {
    $("artist-photo").src = a.photo;
    $("artist-photo").alt = a.name;
    $("artist-photo").hidden = false;
  }

  if (a.bookingEmail) {
    $("booking-link").href = "mailto:" + a.bookingEmail;
  } else {
    $("booking-link").remove();
  }

  $("socials").innerHTML = Object.entries(a.socials || {})
    .filter(([, url]) => url)
    .map(([name, url]) => `<li><a class="btn btn-ghost" href="${escape(url)}" target="_blank" rel="noopener">${escape(name)}</a></li>`)
    .join("");

  // ---- Gigs ----
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const gigs = (site.gigs || []).slice();
  const upcoming = gigs.filter((g) => parseDate(g.date) >= today).sort((x, y) => parseDate(x.date) - parseDate(y.date));
  const past = gigs.filter((g) => parseDate(g.date) < today).sort((x, y) => parseDate(y.date) - parseDate(x.date));

  const gigHtml = (g) => {
    const d = parseDate(g.date);
    const where = [g.venue, g.city].filter(Boolean).join(" · ");
    const tickets = g.tickets
      ? `<a class="btn" href="${escape(g.tickets)}" target="_blank" rel="noopener">Tickets</a>`
      : "<span></span>";
    return `
      <li class="gig">
        <div class="gig-date">
          <span class="day">${d.getDate()}</span>
          <span class="month">${escape(d.toLocaleDateString(undefined, { month: "short" }))}</span>
          <span class="year">${d.getFullYear()}</span>
        </div>
        <div class="gig-info"><h3>${escape(g.event || g.venue)}</h3></div>
        <p class="gig-where">${escape(where)}${g.time ? " — " + escape(g.time) : ""}</p>
        ${tickets}
      </li>`;
  };

  $("upcoming-gigs").innerHTML = upcoming.length
    ? upcoming.map(gigHtml).join("")
    : `<li class="empty">No upcoming gigs announced yet — stay tuned.</li>`;

  if (past.length) {
    $("past-gigs").innerHTML = past.map(gigHtml).join("");
  } else {
    $("past-wrap").remove();
  }

  // ---- Players ----
  // Turns a SoundCloud / Mixcloud / YouTube / Spotify / audio-file link into a player.
  const player = (url) => {
    if (!url) return "";
    let u;
    try {
      u = new URL(url, location.href);
    } catch {
      return "";
    }
    const host = u.hostname.replace(/^www\./, "");

    if (/\.(mp3|wav|ogg|m4a|flac)$/i.test(u.pathname)) {
      return `<audio controls preload="none" src="${escape(url)}"></audio>`;
    }
    if (host.endsWith("soundcloud.com") && !host.startsWith("w.")) {
      // Custom germ1 player, brought to life by player.js
      return `
        <div class="scp" data-sc-url="${escape(url)}">
          <button class="scp-play" type="button" aria-label="Play" disabled>
            <svg class="px" viewBox="0 0 7 7" shape-rendering="crispEdges" aria-hidden="true"><path class="i-play" d="M2 0h1v7h-1z M3 1h1v5h-1z M4 2h1v3h-1z M5 3h1v1h-1z"/><path class="i-pause" d="M1 0h2v7h-2z M4 0h2v7h-2z"/></svg>
          </button>
          <div class="scp-main">
            <div class="scp-info"><span class="scp-artist">Loading…</span><span class="scp-time">0:00 / –:––</span></div>
            <div class="scp-wave" role="slider" tabindex="0" aria-label="Position in the set" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><canvas></canvas></div>
          </div>
        </div>`;
    }
    if (host === "mixcloud.com") {
      const src = "https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&light=0&feed=" + encodeURIComponent(u.pathname);
      return `<iframe height="120" allow="autoplay" loading="lazy" src="${escape(src)}"></iframe>`;
    }
    let yt = null;
    if (host === "youtu.be") yt = u.pathname.slice(1);
    else if (host.endsWith("youtube.com")) yt = u.searchParams.get("v") || (u.pathname.match(/\/(?:embed|live|shorts)\/([^/?]+)/) || [])[1];
    if (yt) {
      return `<iframe style="aspect-ratio:16/9;height:auto" loading="lazy" allowfullscreen
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
        src="https://www.youtube-nocookie.com/embed/${escape(yt)}"></iframe>`;
    }
    const sp = host === "open.spotify.com" && u.pathname.match(/\/(track|album|playlist|episode)\/([A-Za-z0-9]+)/);
    if (sp) {
      return `<iframe height="152" loading="lazy" allow="encrypted-media"
        src="https://open.spotify.com/embed/${sp[1]}/${sp[2]}"></iframe>`;
    }
    // Anything else (Bandcamp, Beatport, ...) -> a simple button.
    const name = host.split(".").slice(-2, -1)[0] || "link";
    return `<a class="btn" href="${escape(url)}" target="_blank" rel="noopener">Listen on ${escape(name.charAt(0).toUpperCase() + name.slice(1))}</a>`;
  };

  // Newest first; items without a date go to the top.
  const time = (item) => (item.date ? parseDate(item.date).getTime() : Infinity);
  const byNewest = (list) => (list || []).slice().sort((x, y) => time(y) - time(x));

  const cardHtml = (item, extraMeta) => {
    const meta = [formatDate(item.date), extraMeta].filter(Boolean).join(" · ");
    return `
      <article class="card">
        <h3${item.title ? "" : " data-auto-title"}>${escape(item.title || "SoundCloud")}</h3>
        ${meta ? `<p class="meta">${escape(meta)}</p>` : ""}
        ${item.description ? `<p class="desc">${escape(item.description)}</p>` : ""}
        ${player(item.url)}
      </article>`;
  };

  const sets = byNewest(site.sets);
  $("sets-list").innerHTML = sets.length
    ? sets.map((s) => cardHtml(s)).join("")
    : `<p class="empty">Sets coming soon.</p>`;

  const tracks = byNewest(site.tracks);
  $("tracks-list").innerHTML = tracks.length
    ? tracks.map((t) => cardHtml(t, t.label)).join("")
    : `<p class="empty">Releases coming soon.</p>`;
})();
