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
    slides.forEach((s, k) => s.classList.toggle("on", k === i));
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

  addEventListener("keydown", (e) => {
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
