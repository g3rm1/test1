// Motion design: pixel equalizer in the hero, pixel text reveal, scroll reveals.
// Everything is skipped for visitors who ask their system for reduced motion.
(function () {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;

  // ---- Hero title: split into letters for the pixel reveal ----
  const title = document.getElementById("artist-name");
  if (title && !reduced) {
    const text = title.textContent;
    title.setAttribute("aria-label", text);
    title.innerHTML = [...text]
      .map((ch, i) => `<span class="ch" aria-hidden="true" style="--i:${i}">${ch === " " ? "&nbsp;" : ch.replace(/[&<>]/g, "")}</span>`)
      .join("");
  }

  // ---- Scroll reveals ----
  if (!reduced && "IntersectionObserver" in window) {
    root.classList.add("motion");
    const groups = [
      ".section h2",
      "#upcoming-gigs > .gig",
      ".cards > .card",
      ".about-grid > :not([hidden])",
      ".socials > li",
    ];
    document.querySelectorAll(groups.join(",")).forEach((el) => {
      el.classList.add("reveal");
      // Stagger siblings so rows and cards build one after another.
      const idx = [...el.parentElement.children].indexOf(el);
      el.style.setProperty("--d", `${Math.min(idx, 6) * 90}ms`);
    });
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
  }

  // ---- Hero pixel equalizer ----
  const canvas = document.getElementById("hero-pixels");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");

  const CELL = 18; // pixel size in CSS px
  const GAP = 3;
  const FPS = 14; // low frame rate = stepped, pixel-art feel
  const BPM = 124;
  const COLORS = ["#ff6a13", "#ff6a13", "#ff8a00", "#ffa400", "#ffc53d"]; // bottom -> top
  const OFF = "rgba(255,255,255,0.035)";
  const PEAK = "#e6e6e6";

  let cols = 0, rows = 0, reveal = [], peaks = [], phases = [];
  let mouseX = -1;
  const start = performance.now();

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.floor(width / CELL);
    rows = Math.floor(height / CELL);
    // Each pixel pops in at its own random moment (pixel dissolve intro).
    reveal = Array.from({ length: cols * rows }, () => Math.random() * 1.4);
    peaks = new Array(cols).fill(0);
    phases = Array.from({ length: cols }, () => Math.random() * Math.PI * 2);
  }

  function level(c, t) {
    const x = c / Math.max(cols - 1, 1); // 0 = bass (left), 1 = treble (right)
    const beatT = (t * BPM) / 60;
    const kick = Math.exp(-(beatT % 1) * 5); // decays after each beat
    const bass = (1 - x) ** 2 * kick * 0.55;
    const wobble =
      0.22 * Math.sin(t * (1.3 + x * 3) + phases[c]) +
      0.12 * Math.sin(t * (4.1 + x * 7) + phases[c] * 2.3);
    const hat = x > 0.6 && beatT % 0.5 < 0.12 ? 0.15 * x : 0;
    let v = 0.28 + bass + wobble + hat;
    if (mouseX >= 0) v += 0.45 * Math.exp(-(((c - mouseX) / 3) ** 2)); // cursor boosts nearby bars
    return Math.max(0.04, Math.min(v, 1));
  }

  function draw(now) {
    const t = (now - start) / 1000;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let c = 0; c < cols; c++) {
      const h = Math.round(level(c, t) * rows);
      peaks[c] = Math.max(h, peaks[c] - 0.35);
      const peakRow = Math.round(peaks[c]);
      for (let r = 0; r < rows; r++) {
        if (reveal[c * rows + r] > t) continue;
        const fromBottom = r; // r = 0 is the bottom row
        let color = OFF;
        if (fromBottom < h) color = COLORS[Math.min(COLORS.length - 1, Math.floor((fromBottom / rows) * COLORS.length))];
        else if (fromBottom === peakRow && peakRow > 0) color = PEAK;
        ctx.fillStyle = color;
        ctx.fillRect(c * CELL, (rows - 1 - r) * CELL, CELL - GAP, CELL - GAP);
      }
    }
  }

  // Reduced motion: one still frame of the equalizer, no animation.
  const still = () => { reveal.fill(0); draw(start + 2000); };
  resize();
  window.addEventListener("resize", () => { resize(); if (reduced) still(); });

  if (reduced) {
    still();
    return;
  }

  canvas.parentElement.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / CELL;
    mouseX = x >= 0 && x < cols ? x : -1;
  });
  canvas.parentElement.addEventListener("mouseleave", () => (mouseX = -1));

  // Only animate while the hero is on screen and the tab is visible.
  let visible = true, last = 0;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);
  function loop(now) {
    if (visible && !document.hidden && now - last >= 1000 / FPS) {
      last = now;
      draw(now);
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
