/* Reveal on scroll and slow photo drift. Content is visible without JS. */
(function () {
  var d = document, h = d.documentElement;
  h.className = h.className.replace("no-js", "js");
  var items = [].slice.call(d.querySelectorAll("[data-reveal]"));
  var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (still || !("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("is-in"); });
    return;
  }
  items.forEach(function (el) {
    var n = 0, s = el;
    while ((s = s.previousElementSibling)) if (s.hasAttribute("data-reveal")) n++;
    el.style.setProperty("--i", n);
  });
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (x) {
      if (x.isIntersecting) { x.target.classList.add("is-in"); io.unobserve(x.target); }
    });
  }, { threshold: 0.12 });
  items.forEach(function (el) { io.observe(el); });

  var drifts = [].slice.call(d.querySelectorAll("[data-drift]")), tick = false;
  function run() {
    tick = false;
    var vh = window.innerHeight;
    drifts.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
      el.style.setProperty("--drift", (1.06 - 0.06 * p).toFixed(4));
    });
  }
  function ask() { if (!tick) { tick = true; requestAnimationFrame(run); } }
  window.addEventListener("scroll", ask, { passive: true });
  window.addEventListener("resize", ask);
  ask();
})();

// Contact email assembled client-side (the address is not in clear in the HTML source).
document.querySelectorAll(".contact-mail").forEach((a) => {
  const addr = `${a.dataset.u}@${a.dataset.d}`;
  a.href = `mailto:${addr}`;
  a.textContent = addr;
});

// Project walkthrough: steps play in turn (illustration). Tabs jump to a step; the button pauses.
document.querySelectorAll("[data-demo]").forEach((stage) => {
  const tabs = [...stage.querySelectorAll(".demo-tab")];
  const panels = [...stage.querySelectorAll(".panel")];
  const typed = stage.querySelector(".panel-typed");
  const toggle = stage.querySelector(".demo-toggle");
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DWELL = [5000, 8500, 6000, 8000, 10000, 7000];
  let step = 0, timer = null, typing = null, playing = !still;

  function type() {
    clearInterval(typing);
    const text = typed.dataset.text;
    if (still) { typed.textContent = text; return; }
    let n = 0;
    typed.textContent = "";
    typing = setInterval(() => {
      n += 2;
      typed.textContent = text.slice(0, n);
      if (n >= text.length) clearInterval(typing);
    }, 30);
  }
  function show(i) {
    step = (i + panels.length) % panels.length;
    stage.dataset.step = step;
    tabs.forEach((t, k) => t.classList.toggle("is-on", k === step));
    panels.forEach((p, k) => p.classList.toggle("is-on", k === step));
    if (step === 1 && typed) type();
    clearTimeout(timer);
    if (playing) timer = setTimeout(() => show(step + 1), DWELL[step]);
  }
  tabs.forEach((t, k) => t.addEventListener("click", () => show(k)));
  toggle.addEventListener("click", () => {
    playing = !playing;
    toggle.textContent = playing ? toggle.dataset.pause : toggle.dataset.play;
    show(step);
  });
  if (!playing) toggle.textContent = toggle.dataset.play;
  // Start when the walkthrough comes into view.
  const io = new IntersectionObserver((es) => {
    if (es[0].isIntersecting) { show(0); io.disconnect(); }
  }, { threshold: 0.35 });
  io.observe(stage);
});

// Caption under the walkthrough: what the current step does.
document.querySelectorAll("[data-demo]").forEach((stage) => {
  const cap = stage.querySelector(".demo-what");
  const sync = () => {
    const on = stage.querySelector(".demo-tab.is-on");
    if (cap && on) cap.textContent = on.dataset.what || "";
  };
  new MutationObserver(sync).observe(stage, { attributes: true, attributeFilter: ["data-step"] });
});
