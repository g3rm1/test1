// Motion design: scroll reveals. The logo animation in the hero is pure CSS (styles.css).
// Everything is skipped for visitors who ask their system for reduced motion.
(function () {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !("IntersectionObserver" in window)) return;

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
