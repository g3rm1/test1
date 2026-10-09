// Motion design: the logo arrows (open on scroll, and the dot as a door between germ1 and the alias),
// and content reveals on scroll. Animations are skipped for visitors who ask for reduced motion.
(function () {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isAlias = document.documentElement.dataset.page === "alias";

  // ---- Logo symbol ----
  // germ1 page: arrows closed on the dot at the top, opening as you scroll.
  // Alias page: arrows open. Clicking the dot switches page with a transition.
  const top = document.querySelector(".brand-mark .arrow-top");
  const bottom = document.querySelector(".brand-mark .arrow-bottom");
  const hero = document.querySelector(".hero");
  const OPEN = 70; // how far the arrows sit from the dot when "open" (symbol units, dot at 60,90)
  const state = { gap: 0, flat: 0 };
  // gap: distance of each arrow from the dot; flat: 0 = sharp chevrons, 1 = flattened
  const shape = (gap, flat) => {
    state.gap = gap;
    state.flat = flat;
    const drop = 32 * (1 - 0.8 * flat);
    const ty = 79 - gap;
    const by = 101 + gap;
    top.setAttribute("d", `M60 ${-gap} V${ty} M28 ${ty - drop} L60 ${ty} L92 ${ty - drop}`);
    bottom.setAttribute("d", `M60 ${180 + gap} V${by} M28 ${by + drop} L60 ${by} L92 ${by + drop}`);
  };
  const easeOut = (k) => 1 - Math.pow(1 - k, 3);
  const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  const tween = (gap, flat, ms, ease = easeOut) => {
    const from = { ...state };
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min((now - t0) / ms, 1);
      const e = ease(k);
      shape(from.gap + (gap - from.gap) * e, from.flat + (flat - from.flat) * e);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  let switching = false;

  if (top && bottom && hero) {
    if (isAlias) {
      if (reduced) shape(OPEN, 1);
      else {
        shape(200, 1); // arriving: the arrows come back in from the top and bottom edges
        tween(OPEN, 1, 800);
      }
    } else {
      const fromScroll = () => {
        if (switching) return;
        const p = Math.min(Math.max(window.scrollY / (hero.offsetHeight * 0.45), 0), 1);
        const e = 1 - (1 - p) * (1 - p); // ease out
        shape(OPEN * e, e);
      };
      if (!reduced) {
        let ticking = false;
        window.addEventListener("scroll", () => {
          if (!ticking) {
            ticking = true;
            requestAnimationFrame(() => { ticking = false; fromScroll(); });
          }
        }, { passive: true });
      }
      fromScroll();
    }
  }

  // ---- The dot: a door between germ1 and its alias ----
  // germ1 -> alias: the arrows fly open up and down, darkness spreads from the dot.
  // alias -> germ1: the arrows close on the dot, light spreads from it.
  const portal = document.querySelector(".portal");
  if (portal && top && bottom && !reduced) {
    // Load the other page in the background as soon as the dot is hovered, so the switch is instant.
    const prefetch = () => {
      if (document.querySelector("link[data-portal]")) return;
      const l = document.createElement("link");
      l.rel = "prefetch";
      l.href = portal.getAttribute("href");
      l.dataset.portal = "";
      document.head.appendChild(l);
    };
    portal.addEventListener("pointerenter", prefetch);
    portal.addEventListener("focus", prefetch);

    portal.addEventListener("click", (e) => {
      if (switching || e.metaKey || e.ctrlKey || e.shiftKey) return; // let "open in new tab" work
      e.preventDefault();
      switching = true;
      // the symbol stays above the spreading colour so the arrows can be seen moving
      document.querySelector(".brand-mark").classList.add("is-switching");
      // the arrows open (or close) at a pace you can follow, then the colour spreads
      if (isAlias) tween(0, 0, 700, easeInOut);
      else tween(320, 1, 1100, easeInOut);
      const dot = portal.querySelector(".dot").getBoundingClientRect();
      const cx = dot.left + dot.width / 2;
      const cy = dot.top + dot.height / 2;
      const radius = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy));
      const wipe = document.createElement("div");
      wipe.className = "portal-wipe";
      wipe.style.background = isAlias ? "#e4e4e4" : "#161616"; // the background of the page we're going to
      wipe.style.clipPath = `circle(0px at ${cx}px ${cy}px)`;
      document.body.appendChild(wipe);
      wipe.getBoundingClientRect(); // start the transition from the closed circle
      // let the arrows get going first, then the colour spreads from the dot
      setTimeout(() => (wipe.style.clipPath = `circle(${radius}px at ${cx}px ${cy}px)`), isAlias ? 300 : 400);
      // change page as soon as the screen is covered (the next page starts in the same colour)
      let gone = false;
      const go = () => {
        if (gone) return;
        gone = true;
        try { sessionStorage.setItem("germ1-portal", "1"); } catch (err) {}
        location.href = portal.getAttribute("href");
      };
      wipe.addEventListener("transitionend", go);
      setTimeout(go, 1600); // safety net
    });
    // Coming back with the browser's Back button: undo the transition.
    window.addEventListener("pageshow", (e) => {
      if (!e.persisted) return;
      switching = false;
      document.querySelectorAll(".portal-wipe").forEach((w) => w.remove());
      document.querySelector(".brand-mark").classList.remove("is-switching");
      if (isAlias) shape(OPEN, 1);
      else window.dispatchEvent(new Event("scroll"));
    });
  }

  if (reduced) return;

  // ---- Scroll reveals ----
  if (!("IntersectionObserver" in window)) return;

  document.documentElement.classList.add("motion");
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
})();
