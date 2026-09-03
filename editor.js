/* ===== dev-only layout editor — press D to toggle · settings are PER SLIDE ===== */
(function () {
  const KEY = "deckEditorV2";
  const PAGE = location.pathname.split("/").pop() || "index.html";

  const FIELDS = [
    { g: "Background", k: "--hero-op",    label: "Opacity",     min: 0,   max: 1,   step: 0.01, def: 0.34, unit: "" },
    { g: "Background", k: "--hero-blur",  label: "Blur",        min: 0,   max: 10,  step: 0.5,  def: 1,    unit: "px" },
    { g: "Background", k: "--hero-scale", label: "Zoom",        min: 1,   max: 1.6, step: 0.01, def: 1.04, unit: "" },
    { g: "Background", k: "--hero-posy",  label: "Crop Y",      min: 0,   max: 100, step: 1,    def: 34,   unit: "%" },
    { g: "Background", k: "--scrim",      label: "Scrim",       min: 0,   max: 1,   step: 0.02, def: 0.9,  unit: "" },

    { g: "Layout",     k: "--media-h",    label: "Media height",min: 180, max: 720, step: 5,    def: 440,  unit: "px" },
    { g: "Layout",     k: "--phone-h",    label: "Phone height",min: 200, max: 640, step: 5,    def: 400,  unit: "px" },
    { g: "Layout",     k: "--tile-h",     label: "Tile height", min: 140, max: 520, step: 5,    def: 300,  unit: "px" },
    { g: "Layout",     k: "--img-gap",    label: "Image gap",   min: 0,   max: 64,  step: 1,    def: 18,   unit: "px" },
    { g: "Layout",     k: "--split-gap",  label: "Column gap",  min: 8,   max: 140, step: 2,    def: 48,   unit: "px" },
    { g: "Layout",     k: "--split-left", label: "Left width",  min: 0.4, max: 2,   step: 0.05, def: 0.9,  unit: "fr" },
    { g: "Layout",     k: "--cards-gap",  label: "Cards gap",   min: 4,   max: 60,  step: 1,    def: 16,   unit: "px" },

    { g: "Type",       k: "--t-title",    label: "Title size",  min: 30,  max: 110, step: 1,    def: 0,    unit: "px" },
    { g: "Type",       k: "--t-h2",       label: "Heading size",min: 22,  max: 70,  step: 1,    def: 0,    unit: "px" },
    { g: "Type",       k: "--t-body",     label: "Body size",   min: 12,  max: 24,  step: 0.5,  def: 0,    unit: "px" },
    { g: "Type",       k: "--t-quote",    label: "Quote size",  min: 20,  max: 60,  step: 1,    def: 0,    unit: "px" },
  ];

  const slides = [...document.querySelectorAll(".slide")];
  slides.forEach((s, i) => s.setAttribute("data-ed", i));

  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} };
  let store = load();
  const page = () => (store[PAGE] = store[PAGE] || {});
  const bucket = (i) => { const p = page(); return (p[i] = p[i] || {}); };

  function current() {
    if (!slides.length) return "page";
    const on = slides.findIndex((s) => s.classList.contains("on"));
    return on < 0 ? 0 : on;
  }

  let styleTag = document.getElementById("deckEdStyle");
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = "deckEdStyle";
    document.head.appendChild(styleTag);
  }

  function apply() {
    const p = page();
    const rules = Object.keys(p).map((idx) => {
      const vals = p[idx];
      const decl = Object.keys(vals).map((k) => `${k}:${vals[k]}`).join(";");
      if (!decl) return "";
      return idx === "page" ? `:root{${decl}}` : `.slide[data-ed="${idx}"]{${decl}}`;
    });
    styleTag.textContent = rules.join("\n");
  }
  apply();

  let panel = null, open = false, rowsWrap = null, title = null;

  function refresh() {
    if (!panel) return;
    const i = current();
    const vals = bucket(i);
    title.textContent = slides.length ? `Slide ${String(i + 1).padStart(2, "0")} / ${slides.length}` : "This page";
    rowsWrap.querySelectorAll("input[data-k]").forEach((input) => {
      const f = FIELDS.find((x) => x.k === input.dataset.k);
      const raw = vals[f.k];
      const num = raw !== undefined ? parseFloat(raw) : f.def;
      input.value = num;
      input.parentElement.querySelector(".val").textContent =
        raw !== undefined ? num : (f.def ? f.def + " ·" : "auto");
      input.parentElement.classList.toggle("set", raw !== undefined);
    });
  }

  function build() {
    panel = document.createElement("div");
    panel.id = "deckEditor";
    panel.innerHTML = `
      <style>
        #deckEditor{position:fixed;top:16px;right:16px;z-index:99999;width:258px;
          background:rgba(14,14,18,.94);backdrop-filter:blur(14px);
          border:1px solid rgba(255,255,255,.16);border-radius:14px;padding:13px 15px 12px;
          font-family:'Jost',sans-serif;color:#fff;font-size:12px;
          box-shadow:0 18px 50px rgba(0,0,0,.6);max-height:92vh;overflow:auto}
        #deckEditor .head{display:flex;align-items:center;justify-content:space-between;
          padding-bottom:9px;margin-bottom:4px;border-bottom:1px solid rgba(255,255,255,.12)}
        #deckEditor .head b{font-size:12px;font-weight:500;letter-spacing:.06em;color:#cfc4ff}
        #deckEditor .head span{font-size:10px;color:rgba(255,255,255,.32);letter-spacing:.12em}
        #deckEditor h5{font-size:10px;letter-spacing:.22em;text-transform:uppercase;
          color:rgba(255,255,255,.36);margin:13px 0 7px;font-weight:500}
        #deckEditor .row{display:flex;align-items:center;gap:8px;margin-bottom:6px}
        #deckEditor label{flex:0 0 78px;color:rgba(255,255,255,.6);font-size:10.5px}
        #deckEditor .row.set label{color:#fff}
        #deckEditor input[type=range]{flex:1;accent-color:#8b7cff;height:15px}
        #deckEditor .val{flex:0 0 42px;text-align:right;font-variant-numeric:tabular-nums;
          color:rgba(255,255,255,.42);font-size:10.5px}
        #deckEditor .row.set .val{color:#cfc4ff}
        #deckEditor .btns{display:flex;gap:6px;margin-top:12px;flex-wrap:wrap}
        #deckEditor button{flex:1;min-width:66px;background:rgba(255,255,255,.07);color:#fff;
          border:1px solid rgba(255,255,255,.18);border-radius:8px;padding:7px 6px;
          font-family:inherit;font-size:10.5px;cursor:pointer;transition:.2s}
        #deckEditor button:hover{background:rgba(255,255,255,.14)}
        #deckEditor button.on{background:rgba(139,124,255,.25);border-color:rgba(139,124,255,.6)}
        #deckEditor .hint{margin-top:9px;font-size:9.5px;color:rgba(255,255,255,.3);line-height:1.55}
      </style>
      <div class="head"><b id="deTitle">—</b><span>D to hide</span></div>
      <div id="deRows"></div>
      <div class="btns">
        <button id="deTextEdit">Edit text</button>
        <button id="deCopy">Copy values</button>
      </div>
      <div class="btns">
        <button id="deResetSlide">Reset slide</button>
        <button id="deResetAll">Reset all</button>
      </div>
      <div class="hint">Every setting applies to the slide you're on. Esc leaves text editing.</div>`;
    document.body.appendChild(panel);
    rowsWrap = panel.querySelector("#deRows");
    title = panel.querySelector("#deTitle");

    let lastG = "";
    FIELDS.forEach((f) => {
      if (f.g !== lastG) { lastG = f.g; rowsWrap.insertAdjacentHTML("beforeend", `<h5>${f.g}</h5>`); }
      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = `<label>${f.label}</label>
        <input type="range" min="${f.min}" max="${f.max}" step="${f.step}" data-k="${f.k}">
        <span class="val"></span>`;
      const input = row.querySelector("input");
      input.addEventListener("input", () => {
        bucket(current())[f.k] = input.value + f.unit;
        row.querySelector(".val").textContent = input.value;
        row.classList.add("set");
        apply(); save();
      });
      rowsWrap.appendChild(row);
    });

    panel.querySelector("#deTextEdit").addEventListener("click", (e) => {
      const on = document.designMode === "on";
      document.designMode = on ? "off" : "on";
      e.target.classList.toggle("on", !on);
      e.target.textContent = on ? "Edit text" : "Editing…";
    });
    panel.querySelector("#deCopy").addEventListener("click", (e) => {
      const out = JSON.stringify(store[PAGE] || {}, null, 2);
      navigator.clipboard?.writeText(PAGE + "\n" + out);
      e.target.textContent = "Copied ✓";
      setTimeout(() => (e.target.textContent = "Copy values"), 1400);
    });
    panel.querySelector("#deResetSlide").addEventListener("click", () => {
      delete page()[current()]; apply(); save(); refresh();
    });
    panel.querySelector("#deResetAll").addEventListener("click", () => {
      delete store[PAGE]; apply(); save(); refresh();
    });

    refresh();
  }

  // keep the panel in sync as slides change
  let lastIdx = -1;
  setInterval(() => {
    if (!open) return;
    const i = current();
    if (i !== lastIdx) { lastIdx = i; refresh(); }
  }, 250);

  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.designMode === "on") {
      document.designMode = "off";
      const b = panel && panel.querySelector("#deTextEdit");
      if (b) { b.classList.remove("on"); b.textContent = "Edit text"; }
      return;
    }
    if (e.key !== "d" && e.key !== "D") return;
    if (document.designMode === "on") return;
    const t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    e.preventDefault();
    open = !open;
    if (open) { if (!panel) build(); panel.style.display = "block"; refresh(); }
    else if (panel) panel.style.display = "none";
  });
})();
