/* ===== minimal slide engine: arrows / wheel / touch / hash ===== */
(function () {
  const deck = document.querySelector(".deck");
  const slides = [...deck.querySelectorAll(".slide")];
  const bar = document.querySelector(".bar");
  const counter = document.querySelector(".chrome.br");
  let i = 0;
  let locked = false;

  function clamp(n) {
    return Math.max(0, Math.min(slides.length - 1, n));
  }

  function go(n, instant) {
    n = clamp(n);
    i = n;
    deck.style.transition = instant ? "none" : "";
    deck.style.transform = `translateY(-${i * 100}vh)`;
    slides.forEach((s, k) => {
      const was = s.classList.contains("on");
      s.classList.toggle("on", k === i);
      // restart chart draw-on each time a slide comes back into view
      if (!was && k === i) {
        s.querySelectorAll(".chart .ln, .chart .mark").forEach((el) => {
          el.style.animation = "none";
          void el.offsetWidth;
          el.style.animation = "";
        });
      }
    });
    if (bar) bar.style.width = ((i + 1) / slides.length) * 100 + "%";
    if (counter)
      counter.textContent =
        String(i + 1).padStart(2, "0") + " / " + String(slides.length).padStart(2, "0");
    history.replaceState(null, "", "#" + (i + 1));
    if (instant) requestAnimationFrame(() => (deck.style.transition = ""));
  }

  function step(dir) {
    if (locked) return;
    const n = clamp(i + dir);
    if (n === i) return;
    locked = true;
    go(n);
    setTimeout(() => (locked = false), 780);
  }

  function isEditing(e) {
    if (document.designMode === "on") return true;
    const t = e && e.target;
    return !!(t && (t.isContentEditable || t.tagName === "INPUT" || t.tagName === "TEXTAREA"));
  }

  addEventListener("keydown", (e) => {
    if (isEditing(e)) return;
    if (["ArrowDown", "ArrowRight", "PageDown", " "].includes(e.key)) {
      e.preventDefault();
      step(1);
    } else if (["ArrowUp", "ArrowLeft", "PageUp"].includes(e.key)) {
      e.preventDefault();
      step(-1);
    } else if (e.key === "Home") go(0);
    else if (e.key === "End") go(slides.length - 1);
  });

  let acc = 0;
  addEventListener(
    "wheel",
    (e) => {
      if (document.designMode === "on") return;
      e.preventDefault();
      if (locked) return;
      acc += e.deltaY;
      if (Math.abs(acc) > 60) {
        step(acc > 0 ? 1 : -1);
        acc = 0;
      }
    },
    { passive: false }
  );

  let ty = null;
  addEventListener("touchstart", (e) => (ty = e.touches[0].clientY), { passive: true });
  addEventListener(
    "touchend",
    (e) => {
      if (ty == null) return;
      const dy = ty - e.changedTouches[0].clientY;
      if (Math.abs(dy) > 50) step(dy > 0 ? 1 : -1);
      ty = null;
    },
    { passive: true }
  );

  const h = parseInt((location.hash || "").slice(1), 10);
  go(isNaN(h) ? 0 : h - 1, true);
})();

/* measure each chart line so the draw-on animation matches its real length */
(function () {
  function set() {
    let done = 0, total = 0;
    document.querySelectorAll(".chart .ln, .chart .mark").forEach((el) => {
      total++;
      let len = 0;
      try { len = Math.ceil(el.getTotalLength()); } catch (e) {}
      if (len > 0) { el.style.setProperty("--len", String(len + 2)); done++; }
    });
    return total > 0 && done === total;
  }
  let tries = 0;
  (function retry() {
    if (set() || tries++ > 20) return;
    requestAnimationFrame(retry);
  })();
  addEventListener("load", set);
})();
