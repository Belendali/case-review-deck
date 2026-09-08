/* ===== presenter mirror: the presenter's embedded deck is the source; top-level deck windows mirror it ===== */
(function () {
  if (!("BroadcastChannel" in window)) return;
  const bc = new BroadcastChannel("deck-mirror");
  const root = document.querySelector(".deck") || document.querySelector(".stage") || document.body;
  const isSource = window !== window.top;
  const page = location.pathname.split("/").pop() || "index.html";
  function pathOf(el) { const p = []; let n = el; while (n && n !== root) { const par = n.parentElement; if (!par) return null; p.unshift(Array.prototype.indexOf.call(par.children, n)); n = par; } return n === root ? p : null; }
  function resolve(p) { let n = root; for (const i of p) { n = n.children[i]; if (!n) return null; } return n; }
  const DYN = /(^|\s)(on|shown|in|hov|lock|haslock|roommode|cur|flip|open|revealed|sel|active)(\s|$)/;
  if (isSource) {
    const send = (m) => bc.postMessage(Object.assign({ page }, m));
    new MutationObserver((muts) => {
      const seen = new Set();
      muts.forEach((m) => {
        let t = m.target; if (t.nodeType === 3) t = t.parentElement; if (!t || seen.has(t)) return;
        const p = pathOf(t); if (!p) return; seen.add(t);
        if (m.type === "attributes") send({ type: "attr", path: p, cls: t.getAttribute("class"), style: t.getAttribute("style") });
        else send({ type: "html", path: p, html: t.innerHTML });
      });
    }).observe(root, { attributes: true, attributeFilter: ["class", "style"], subtree: true, childList: true, characterData: true });
    let chain = [];
    function setHover(el) {
      const next = []; let n = el; while (n && n !== root && n.nodeType === 1) { next.push(n); n = n.parentElement; }
      chain.forEach((e) => { if (!next.includes(e)) e.classList.remove("hov"); });
      next.forEach((e) => e.classList.add("hov")); chain = next;
    }
    root.addEventListener("mouseover", (e) => setHover(e.target));
    document.documentElement.addEventListener("mouseleave", () => setHover(null));
    let mt = 0; addEventListener("mousemove", (e) => { const now = Date.now(); if (now - mt < 25) return; mt = now; send({ type: "mouse", x: e.clientX / innerWidth, y: e.clientY / innerHeight }); }, { passive: true });
    addEventListener("mousedown", (e) => send({ type: "click", x: e.clientX / innerWidth, y: e.clientY / innerHeight }));
    document.documentElement.addEventListener("mouseleave", () => send({ type: "mouse", hide: true }));
    let st = null; addEventListener("scroll", () => { clearTimeout(st); st = setTimeout(() => send({ type: "scroll", y: scrollY }), 40); }, { passive: true });
    function snapshot() {
      const items = [];
      root.querySelectorAll("*").forEach((el) => { const c = el.getAttribute("class") || ""; const s = el.getAttribute("style"); if (DYN.test(c) || s) { const p = pathOf(el); if (p) items.push([p, c, s]); } });
      send({ type: "snap", items, y: scrollY, hash: location.hash });
    }
    bc.onmessage = (e) => { if (e.data && e.data.type === "sync-req") snapshot(); };
    document.addEventListener("deck:change", () => send({ type: "page", hash: location.hash }));
    setInterval(() => send({ type: "page", hash: location.hash }), 1500);
    send({ type: "page", hash: location.hash });
  } else {
    // virtual cursor that follows the presenter's mouse
    const cur = document.createElement("div"); cur.className = "mcursor";
    cur.innerHTML = '<svg width="22" height="30" viewBox="0 0 22 30"><path d="M2 2 L2 24 L8 18 L12 28 L16 26 L12 17 L20 17 Z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    const style = document.createElement("style");
    style.textContent = ".mcursor{position:fixed;left:0;top:0;z-index:9999;pointer-events:none;opacity:0;transition:transform .06s linear,opacity .25s;filter:drop-shadow(0 2px 4px rgba(0,0,0,.6))}.mcursor.on{opacity:1}.mring{position:fixed;z-index:9998;pointer-events:none;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;border:2px solid rgba(139,124,255,.9);animation:mring .5s ease-out forwards}@keyframes mring{from{transform:scale(.3);opacity:1}to{transform:scale(1.4);opacity:0}}";
    document.head.appendChild(style); document.body.appendChild(cur);
    let navigating = false;
    bc.onmessage = (e) => {
      const m = e.data || {}; if (!m.page) return;
      if (m.page !== page) { if (!navigating) { navigating = true; location.href = m.page + "?t=" + Date.now() + (m.hash || ""); } return; }
      if (m.type === "attr") { const el = resolve(m.path); if (!el) return; if (m.cls == null) el.removeAttribute("class"); else el.setAttribute("class", m.cls); if (m.style == null) el.removeAttribute("style"); else el.setAttribute("style", m.style); }
      else if (m.type === "html") { const el = resolve(m.path); if (el) el.innerHTML = m.html; }
      else if (m.type === "mouse") { if (m.hide) { cur.classList.remove("on"); return; } cur.classList.add("on"); cur.style.transform = "translate(" + (m.x * innerWidth) + "px," + (m.y * innerHeight) + "px)"; }
      else if (m.type === "click") { const r = document.createElement("div"); r.className = "mring"; r.style.left = (m.x * innerWidth) + "px"; r.style.top = (m.y * innerHeight) + "px"; document.body.appendChild(r); setTimeout(() => r.remove(), 600); }
      else if (m.type === "scroll") { scrollTo(0, m.y); }
      else if (m.type === "snap") { m.items.forEach(([p, c, s]) => { const el = resolve(p); if (!el) return; el.setAttribute("class", c); if (s) el.setAttribute("style", s); }); scrollTo(0, m.y || 0); if (m.hash && window.deckGo) { const n = parseInt(m.hash.slice(1), 10); if (!isNaN(n)) deckGo(n - 1, true); } }
      else if (m.type === "page") { if (window.deckGo && m.hash && m.hash !== location.hash) { const n = parseInt(m.hash.slice(1), 10); if (!isNaN(n)) deckGo(n - 1); } }
    };
    bc.postMessage({ type: "sync-req" });
  }
})();
