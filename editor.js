/* ===== dev-only layout editor — press D to toggle ===== */
(function () {
  const KEY = "deckEditorV1";
  const R = document.documentElement;

  const FIELDS = [
    { g: "Background", k: "--hero-op",    label: "Opacity",      min: 0,    max: 1,   step: 0.01, def: 0.34, unit: "" },
    { g: "Background", k: "--hero-blur",  label: "Blur",         min: 0,    max: 10,  step: 0.5,  def: 1,    unit: "px" },
    { g: "Background", k: "--hero-scale", label: "Zoom",         min: 1,    max: 1.6, step: 0.01, def: 1.04, unit: "" },
    { g: "Background", k: "--hero-posy",  label: "Crop Y",       min: 0,    max: 100, step: 1,    def: 34,   unit: "%" },
    { g: "Background", k: "--scrim",      label: "Center scrim", min: 0,    max: 1,   step: 0.02, def: 0.9,  unit: "" },
    { g: "Type",       k: "--t-title",    label: "Title size",   min: 30,   max: 110, step: 1,    def: 0,    unit: "px" },
    { g: "Type",       k: "--t-h2",       label: "Heading size", min: 22,   max: 70,  step: 1,    def: 0,    unit: "px" },
    { g: "Type",       k: "--t-body",     label: "Body size",    min: 12,   max: 24,  step: 0.5,  def: 0,    unit: "px" },
    { g: "Type",       k: "--t-quote",    label: "Quote size",   min: 20,   max: 60,  step: 1,    def: 0,    unit: "px" },
  ];

  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const save = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} };
  let state = load();

  function apply() {
    FIELDS.forEach((f) => {
      const v = state[f.k];
      if (v === undefined || v === "" || Number(v) === 0 && f.def === 0) { R.style.removeProperty(f.k); return; }
      R.style.setProperty(f.k, v + f.unit);
    });
  }
  apply();

  let panel = null, open = false;

  function build() {
    panel = document.createElement("div");
    panel.id = "deckEditor";
    panel.innerHTML = `
      <style>
        #deckEditor{position:fixed;top:16px;right:16px;z-index:99999;width:250px;
          background:rgba(14,14,18,.93);backdrop-filter:blur(14px);
          border:1px solid rgba(255,255,255,.16);border-radius:14px;padding:14px 15px 12px;
          font-family:'Jost',sans-serif;color:#fff;font-size:12px;
          box-shadow:0 18px 50px rgba(0,0,0,.6);max-height:88vh;overflow:auto}
        #deckEditor h5{font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;
          color:rgba(255,255,255,.4);margin:14px 0 8px;font-weight:500}
        #deckEditor h5:first-of-type{margin-top:6px}
        #deckEditor .row{display:flex;align-items:center;gap:8px;margin-bottom:7px}
        #deckEditor label{flex:0 0 82px;color:rgba(255,255,255,.66);font-size:11px}
        #deckEditor input[type=range]{flex:1;accent-color:#8b7cff;height:16px}
        #deckEditor .val{flex:0 0 40px;text-align:right;font-variant-numeric:tabular-nums;
          color:#cfc4ff;font-size:11px}
        #deckEditor .btns{display:flex;gap:6px;margin-top:12px;flex-wrap:wrap}
        #deckEditor button{flex:1;min-width:70px;background:rgba(255,255,255,.07);color:#fff;
          border:1px solid rgba(255,255,255,.18);border-radius:8px;padding:7px 6px;
          font-family:inherit;font-size:11px;cursor:pointer;transition:.2s}
        #deckEditor button:hover{background:rgba(255,255,255,.14)}
        #deckEditor button.on{background:rgba(139,124,255,.25);border-color:rgba(139,124,255,.6)}
        #deckEditor .hint{margin-top:9px;font-size:10px;color:rgba(255,255,255,.3);line-height:1.5}
      </style>`;
    let lastG = "";
    FIELDS.forEach((f) => {
      if (f.g !== lastG) { lastG = f.g; panel.insertAdjacentHTML("beforeend", `<h5>${f.g}</h5>`); }
      const cur = state[f.k] !== undefined ? state[f.k] : f.def;
      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = `<label>${f.label}</label>
        <input type="range" min="${f.min}" max="${f.max}" step="${f.step}" value="${cur}" data-k="${f.k}">
        <span class="val">${cur || "auto"}</span>`;
      const input = row.querySelector("input");
      const val = row.querySelector(".val");
      input.addEventListener("input", () => {
        state[f.k] = input.value;
        val.textContent = input.value;
        apply(); save(state);
      });
      panel.appendChild(row);
    });
    panel.insertAdjacentHTML("beforeend", `
      <div class="btns">
        <button id="deTextEdit">Edit text</button>
        <button id="deCopy">Copy values</button>
        <button id="deReset">Reset</button>
      </div>
      <div class="hint">D toggles this panel · never shown unless you press it</div>`);
    document.body.appendChild(panel);

    panel.querySelector("#deTextEdit").addEventListener("click", (e) => {
      const on = document.designMode === "on";
      document.designMode = on ? "off" : "on";
      e.target.classList.toggle("on", !on);
      e.target.textContent = on ? "Edit text" : "Editing…";
    });
    panel.querySelector("#deCopy").addEventListener("click", (e) => {
      const out = FIELDS.filter((f) => state[f.k] !== undefined)
        .map((f) => `${f.k}: ${state[f.k]}${f.unit}`).join("\n");
      navigator.clipboard?.writeText(out);
      e.target.textContent = "Copied ✓";
      setTimeout(() => (e.target.textContent = "Copy values"), 1400);
    });
    panel.querySelector("#deReset").addEventListener("click", () => {
      state = {}; save(state); apply(); panel.remove(); panel = null; build(); 
    });
  }

  addEventListener("keydown", (e) => {
    if (e.key !== "d" && e.key !== "D") return;
    if (document.designMode === "on") return;      // don't hijack typing
    const t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    e.preventDefault();
    open = !open;
    if (open) { if (!panel) build(); panel.style.display = "block"; }
    else if (panel) panel.style.display = "none";
  });
})();
