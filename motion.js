// Motion design: the logo arrows open while scrolling, and content reveals on scroll.
// Everything is skipped for visitors who ask their system for reduced motion.
(function () {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  // ---- Logo symbol: closed on the dot at the top of the page, opening as you scroll ----
  const top = document.querySelector(".brand-mark .arrow-top");
  const bottom = document.querySelector(".brand-mark .arrow-bottom");
  const hero = document.querySelector(".hero");
  if (top && bottom && hero) {
    // Coordinates match the symbol's viewBox (0 0 120 180): dot at (60, 90).
    const drawArrows = (p) => {
      const e = 1 - (1 - p) * (1 - p); // ease out
      const gap = 70 * e; // how far each arrow moves away from the dot
      const drop = 32 * (1 - 0.8 * e); // chevron arms flatten as they open
      const ty = 79 - gap;
      const by = 101 + gap;
      top.setAttribute("d", `M60 ${-gap} V${ty} M28 ${ty - drop} L60 ${ty} L92 ${ty - drop}`);
      bottom.setAttribute("d", `M60 ${180 + gap} V${by} M28 ${by + drop} L60 ${by} L92 ${by + drop}`);
    };
    let ticking = false;
    const update = () => {
      ticking = false;
      const p = Math.min(Math.max(window.scrollY / (hero.offsetHeight * 0.45), 0), 1);
      drawArrows(p);
    };
    window.addEventListener("scroll", () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  }

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
