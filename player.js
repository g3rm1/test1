// Custom germ1 player for SoundCloud links.
// The real SoundCloud player runs hidden in the page; this script draws our own controls,
// a fixed player bar at the bottom once playback starts, and the dancing germ1 bot.
(function () {
  const players = [...document.querySelectorAll(".scp")];
  if (!players.length) return;

  const BPM = 124; // the bot dances at this tempo (SoundCloud doesn't share the audio itself)
  document.documentElement.style.setProperty("--beat", `${60 / BPM}s`);

  const fmt = (ms) => {
    if (!isFinite(ms) || ms < 0) return "–:––";
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = String(s % 60).padStart(2, "0");
    return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
  };

  const loadApi = () =>
    new Promise((resolve, reject) => {
      if (window.SC && window.SC.Widget) return resolve();
      const s = document.createElement("script");
      s.src = "https://w.soundcloud.com/player/api.js";
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });

  // Short "on.soundcloud.com" share links: ask SoundCloud for the full address.
  const resolveUrl = async (url) => {
    try {
      if (new URL(url).hostname !== "on.soundcloud.com") return url;
      const r = await fetch("https://soundcloud.com/oembed?format=json&url=" + encodeURIComponent(url));
      const info = await r.json();
      const m = (info.html || "").match(/src="([^"]+)"/);
      return (m && new URL(m[1].replace(/&amp;/g, "&")).searchParams.get("url")) || url;
    } catch {
      return url; // the SoundCloud player may still understand the short link
    }
  };

  // Fallback waveform when SoundCloud's isn't available: smooth pseudo-random bars.
  const fakePeaks = (seed, n = 400) => {
    let x = [...String(seed)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    const rnd = () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296);
    const out = [];
    let v = 0.5;
    for (let i = 0; i < n; i++) {
      v += (rnd() - 0.5) * 0.35;
      v = Math.min(1, Math.max(0.15, v));
      out.push(v * (0.7 + rnd() * 0.3));
    }
    return out;
  };

  const loadPeaks = async (sound) => {
    const url = sound && sound.waveform_url;
    if (url && /\.json(\?|$)/.test(url)) {
      try {
        const data = await (await fetch(url)).json();
        const max = data.height || Math.max(...data.samples);
        return data.samples.map((v) => v / max);
      } catch {}
    }
    return fakePeaks(sound ? sound.id || sound.title : "germ1");
  };

  const drawWave = (canvas, peaks, rel) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    if (canvas.width !== Math.round(w * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const styles = getComputedStyle(canvas);
    const played = styles.getPropertyValue("--wave-played").trim() || "#d85133";
    const rest = styles.getPropertyValue("--wave-rest").trim() || "#5e5e5e";
    const step = 3; // 2px bar + 1px gap
    const bars = Math.floor(w / step);
    for (let i = 0; i < bars; i++) {
      const p = peaks[Math.floor((i / bars) * peaks.length)] || 0.1;
      const bh = Math.max(2, p * h);
      ctx.fillStyle = i / bars < rel ? played : rest;
      ctx.fillRect(i * step, (h - bh) / 2, 2, bh);
    }
  };

  // ---- Fixed player bar + the germ1 bot ----
  document.body.insertAdjacentHTML(
    "beforeend",
    `<div class="pbar" id="pbar" hidden>
      <div class="bot" aria-hidden="true">
        <svg viewBox="0 0 16 16" shape-rendering="crispEdges">
          <g class="bot-legs">
            <rect class="leg-l" x="5" y="11" width="1" height="3"/>
            <rect class="leg-r" x="10" y="11" width="1" height="3"/>
          </g>
          <g class="bot-body">
            <rect class="arm-l" x="2" y="8" width="2" height="1"/>
            <rect class="arm-r" x="12" y="8" width="2" height="1"/>
            <rect class="skin" x="4" y="3" width="8" height="8"/>
            <rect class="eye" x="6" y="5" width="1" height="2"/>
            <rect class="eye" x="9" y="5" width="1" height="2"/>
            <rect class="phones" x="4" y="1" width="8" height="1"/>
            <rect class="phones" x="3" y="2" width="1" height="2"/>
            <rect class="phones" x="12" y="2" width="1" height="2"/>
            <rect class="phones" x="2" y="4" width="2" height="3"/>
            <rect class="phones" x="12" y="4" width="2" height="3"/>
          </g>
        </svg>
      </div>
      <button class="pbar-play" type="button" aria-label="Play">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path class="i-play" d="M8 5 L19 12 L8 19 Z"/><path class="i-pause" d="M7 5 H10 V19 H7 Z M14 5 H17 V19 H14 Z"/></svg>
      </button>
      <div class="pbar-info"><span class="pbar-title"></span><span class="pbar-artist"></span></div>
      <span class="pbar-time pbar-pos">0:00</span>
      <div class="pbar-track" role="slider" tabindex="0" aria-label="Position in the set" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
        <div class="pbar-fill"></div><div class="pbar-dot"></div>
      </div>
      <span class="pbar-time pbar-dur">–:––</span>
      <button class="pbar-close" type="button" aria-label="Stop and close player">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6 L18 18 M18 6 L6 18"/></svg>
      </button>
    </div>`
  );
  const bar = document.getElementById("pbar");
  const q = (sel) => bar.querySelector(sel);
  let active = null;

  const seekFromEvent = (player, el, e) => {
    if (!player || !player.duration) return;
    const r = el.getBoundingClientRect();
    const rel = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
    player.widget.seekTo(rel * player.duration);
    player.position = rel * player.duration;
    player.render();
  };
  const seekByKey = (player, e) => {
    if (!player || !player.duration) return;
    const d = { ArrowRight: 10000, ArrowLeft: -10000 }[e.key];
    if (!d) return;
    e.preventDefault();
    player.position = Math.min(Math.max(player.position + d, 0), player.duration);
    player.widget.seekTo(player.position);
    player.render();
  };

  q(".pbar-play").addEventListener("click", () => active && active.widget.toggle());
  q(".pbar-close").addEventListener("click", () => {
    if (active) active.widget.pause();
    bar.classList.remove("is-open");
    document.body.classList.remove("has-pbar");
    setTimeout(() => { if (!bar.classList.contains("is-open")) bar.hidden = true; }, 400);
  });
  q(".pbar-track").addEventListener("click", (e) => seekFromEvent(active, e.currentTarget, e));
  q(".pbar-track").addEventListener("keydown", (e) => seekByKey(active, e));

  const openBar = () => {
    bar.hidden = false;
    requestAnimationFrame(() => bar.classList.add("is-open"));
    document.body.classList.add("has-pbar");
  };

  // ---- One custom player per SoundCloud link ----
  function setup(el) {
    const p = {
      el,
      widget: null,
      duration: 0,
      position: 0,
      playing: false,
      title: "",
      artist: "",
      peaks: fakePeaks(el.dataset.scUrl),
      render() {
        const rel = this.duration ? this.position / this.duration : 0;
        const label = this.playing ? "Pause" : "Play";
        el.classList.toggle("is-playing", this.playing);
        el.querySelector(".scp-play").setAttribute("aria-label", label);
        el.querySelector(".scp-time").textContent = `${fmt(this.position)} / ${fmt(this.duration)}`;
        const wave = el.querySelector(".scp-wave");
        wave.setAttribute("aria-valuenow", Math.round(rel * 100));
        drawWave(wave.querySelector("canvas"), this.peaks, rel);
        if (active === this) {
          bar.classList.toggle("is-playing", this.playing);
          q(".pbar-play").setAttribute("aria-label", label);
          q(".pbar-title").textContent = this.title;
          q(".pbar-artist").textContent = this.artist;
          q(".pbar-pos").textContent = fmt(this.position);
          q(".pbar-dur").textContent = fmt(this.duration);
          q(".pbar-fill").style.width = `${rel * 100}%`;
          q(".pbar-dot").style.left = `${rel * 100}%`;
          q(".pbar-track").setAttribute("aria-valuenow", Math.round(rel * 100));
        }
      },
    };

    const btn = el.querySelector(".scp-play");
    const wave = el.querySelector(".scp-wave");
    btn.addEventListener("click", () => p.widget && p.widget.toggle());
    wave.addEventListener("click", (e) => seekFromEvent(p, wave, e));
    wave.addEventListener("keydown", (e) => seekByKey(p, e));
    window.addEventListener("resize", () => p.render());
    p.render();

    const fail = () => {
      el.classList.add("is-error");
      el.querySelector(".scp-artist").innerHTML =
        `Player unavailable — <a href="${el.dataset.scUrl.replace(/"/g, "&quot;")}" target="_blank" rel="noopener">listen on SoundCloud</a>`;
    };

    Promise.all([loadApi(), resolveUrl(el.dataset.scUrl)])
      .then(([, url]) => {
        const frame = document.createElement("iframe");
        frame.className = "scp-frame";
        frame.title = "SoundCloud";
        frame.allow = "autoplay";
        frame.tabIndex = -1;
        frame.setAttribute("aria-hidden", "true");
        frame.src = "https://w.soundcloud.com/player/?url=" + encodeURIComponent(url) +
          "&auto_play=false&visual=false&show_artwork=false&hide_related=true";
        el.appendChild(frame);
        const w = (p.widget = SC.Widget(frame));
        const E = SC.Widget.Events;
        const timeout = setTimeout(fail, 15000);

        w.bind(E.READY, () => {
          clearTimeout(timeout);
          btn.disabled = false;
          w.getDuration((d) => { p.duration = d; p.render(); });
          w.getCurrentSound(async (sound) => {
            if (!sound) return;
            p.title = sound.title || "";
            p.artist = (sound.user && sound.user.username) || "";
            el.querySelector(".scp-artist").textContent = p.artist || "SoundCloud";
            const h3 = el.closest(".card") && el.closest(".card").querySelector("h3[data-auto-title]");
            if (h3 && p.title) h3.textContent = p.title;
            p.peaks = await loadPeaks(sound);
            p.render();
          });
        });
        w.bind(E.PLAY, () => {
          // only one set plays at a time
          players.forEach((o) => o.ctrl && o.ctrl !== p && o.ctrl.widget && o.ctrl.widget.pause());
          active = p;
          p.playing = true;
          if (!p.title) p.title = (el.closest(".card") && el.closest(".card").querySelector("h3").textContent) || "";
          openBar();
          p.render();
        });
        w.bind(E.PAUSE, () => { p.playing = false; p.render(); });
        w.bind(E.FINISH, () => { p.playing = false; p.position = 0; p.render(); });
        w.bind(E.PLAY_PROGRESS, (e) => {
          p.position = e.currentPosition;
          if (!p.duration && e.relativePosition) p.duration = e.currentPosition / e.relativePosition;
          p.render();
        });
      })
      .catch(fail);

    el.ctrl = p;
  }

  players.forEach(setup);
})();
