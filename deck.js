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
    document.dispatchEvent(new CustomEvent("deck:change", { detail: { index: i, total: slides.length } }));
  }
  window.deckGo = go;

  function frags(slide) {
    const list = [...slide.querySelectorAll(".frag")];
    list.sort((a, b) => (+a.dataset.frag || 0) - (+b.dataset.frag || 0));
    return list;
  }
  function setFrags(slide, shown) {
    frags(slide).forEach((f) => f.classList.toggle("shown", shown));
  }

  function step(dir) {
    if (locked) return;
    const cur = slides[i];
    const fr = frags(cur);
    const group = (f) => fr.filter((g) => (g.dataset.frag || "") === (f.dataset.frag || "") && (f.dataset.frag !== undefined ? true : g === f));
    if (dir > 0) {
      const next = fr.find((f) => !f.classList.contains("shown"));
      if (next) { group(next).forEach((g) => g.classList.add("shown")); return; }
    } else {
      const shownList = fr.filter((f) => f.classList.contains("shown"));
      if (shownList.length) { group(shownList[shownList.length - 1]).forEach((g) => g.classList.remove("shown")); return; }
    }
    const n = clamp(i + dir);
    if (n === i) return;
    locked = true;
    // arriving forward: start with fragments hidden; arriving backward: land on the finished state
    setFrags(slides[n], dir < 0);
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
    } else if (e.key === "Home") { setFrags(slides[0], false); go(0); }
    else if (e.key === "End") { setFrags(slides[slides.length - 1], true); go(slides.length - 1); }
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


/* ===== left rail: section position (portfolio-style) ===== */
(function () {
  const rail = document.querySelector(".rail");
  if (!rail) return;
  const items = [...rail.querySelectorAll("a[data-from]")];
  function update(i) {
    items.forEach((a) => {
      const from = +a.dataset.from, to = +(a.dataset.to || a.dataset.from);
      a.classList.toggle("on", i >= from && i <= to);
    });
  }
  items.forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); window.deckGo(+a.dataset.from); }));
  document.addEventListener("deck:change", (e) => update(e.detail.index));
  const h = parseInt((location.hash || "").slice(1), 10);
  update(isNaN(h) ? 0 : h - 1);
})();


/* ===== script mode: press S to show the presenter script for the current slide ===== */
(function () {
  const slides = [...document.querySelectorAll(".slide")]; if (!slides.length) return;
  const panel = document.createElement("div"); panel.className = "script";
  panel.innerHTML = '<div class="script-in"><i class="script-k"></i><div class="script-t"></div></div>';
  document.body.appendChild(panel);
  const k = panel.querySelector(".script-k"), t = panel.querySelector(".script-t");
  function render(i) {
    const n = slides[i] && slides[i].querySelector(".notes");
    const title = slides[i] && (slides[i].querySelector("h1, h2, .quote") || {}).textContent || "";
    k.textContent = "Script · " + String(i + 1).padStart(2, "0") + "  " + title.trim().replace(/\s+/g, " ").slice(0, 60);
    t.innerHTML = n ? n.innerHTML : "<em>No script for this slide.</em>";
    panel.scrollTop = 0;
  }
  document.addEventListener("deck:change", (e) => render(e.detail.index));
  addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tg = e.target; if (tg && (tg.isContentEditable || tg.tagName === "INPUT" || tg.tagName === "TEXTAREA")) return;
    if (document.designMode === "on") return;
    if (e.key.toLowerCase() === "s") document.body.classList.toggle("script-on");
  });
  const h = parseInt((location.hash || "").slice(1), 10);
  render(isNaN(h) ? 0 : h - 1);
})();
