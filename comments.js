/* ===== comments — press C · no backend, comments travel as a code ===== */
(function () {
  const KEY = "deckCommentsV1";
  const PAGE = location.pathname.split("/").pop() || "index.html";
  const TITLES = { "index.html": "Agenda", "answer.html": "Answer.AI", "wanaka.html": "Wanaka", "effect.html": "Effect House" };

  let store = load();
  let idx = fromHash();
  let open = false;

  function fromHash() {
    const n = parseInt((location.hash || "").replace("#", ""), 10);
    return isFinite(n) && n > 0 ? n - 1 : 0;
  }
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || { author: "", data: {} }; }
    catch (e) { return { author: "", data: {} }; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {}
  }
  function listFor(page, i) {
    return ((store.data[page] || {})[i] || []).slice();
  }
  function add(text) {
    const page = store.data[PAGE] || (store.data[PAGE] = {});
    const arr = page[idx] || (page[idx] = []);
    arr.push({ who: store.author || "Guest", text: text, at: Date.now() });
    save();
  }
  function total() {
    let n = 0;
    Object.values(store.data).forEach((p) => Object.values(p).forEach((a) => (n += a.length)));
    return n;
  }

  /* ---------- styles ---------- */
  const css = document.createElement("style");
  css.textContent = `
  .cmt-dot { position: fixed; right: 22px; bottom: 22px; z-index: 60; display: none; align-items: center; gap: 7px;
    font-family: var(--serif, system-ui); font-size: 11px; letter-spacing: .16em; text-transform: uppercase;
    color: #cfc4ff; background: rgba(12,12,18,.8); border: 1px solid rgba(139,124,255,.4); border-radius: 999px;
    padding: 7px 13px; backdrop-filter: blur(8px); cursor: pointer; }
  .cmt-dot.on { display: flex; }
  .cmt-dot i { width: 6px; height: 6px; border-radius: 50%; background: #8b7cff; font-style: normal; }
  .cmt-panel { position: fixed; right: 0; top: 0; bottom: 0; width: min(400px, 92vw); z-index: 70;
    background: rgba(10,10,14,.97); border-left: 1px solid rgba(255,255,255,.12); backdrop-filter: blur(14px);
    transform: translateX(102%); transition: transform .35s cubic-bezier(.22,1,.36,1);
    display: flex; flex-direction: column; font-family: system-ui, -apple-system, "PingFang SC", sans-serif; color: #f2f2f0; }
  .cmt-panel.open { transform: none; }
  .cmt-head { padding: 22px 22px 14px; border-bottom: 1px solid rgba(255,255,255,.1); }
  .cmt-head .k { font-family: var(--serif, system-ui); font-size: 10.5px; letter-spacing: .22em; text-transform: uppercase; color: #8b8b9c; }
  .cmt-head h4 { margin: 6px 0 0; font-size: 17px; font-weight: 600; }
  .cmt-head .sub { font-size: 12px; color: #8b8b9c; margin-top: 4px; }
  .cmt-list { flex: 1; overflow-y: auto; padding: 16px 22px; display: flex; flex-direction: column; gap: 12px; }
  .cmt-item { border-left: 2px solid rgba(139,124,255,.6); padding: 2px 0 2px 12px; }
  .cmt-item .who { font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: #8b8b9c; }
  .cmt-item .txt { font-size: 14px; line-height: 1.55; margin-top: 4px; white-space: pre-wrap; }
  .cmt-empty { font-size: 13px; color: #6f6f80; line-height: 1.6; }
  .cmt-form { padding: 14px 22px 18px; border-top: 1px solid rgba(255,255,255,.1); display: flex; flex-direction: column; gap: 9px; }
  .cmt-form input, .cmt-form textarea { width: 100%; font: inherit; font-size: 14px; color: #f2f2f0;
    background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.14); border-radius: 10px; padding: 10px 12px; outline: none; }
  .cmt-form input { font-size: 13px; }
  .cmt-form textarea { min-height: 84px; resize: vertical; line-height: 1.5; }
  .cmt-form :is(input, textarea):focus { border-color: rgba(139,124,255,.7); }
  .cmt-as { display: none; font-size: 12px; color: #8b8b9c; }
  .cmt-as b { color: #cfc4ff; font-weight: 600; }
  .cmt-as button { background: none; border: 0; color: #8b8b9c; font: inherit; text-decoration: underline; cursor: pointer; padding: 0; }
  .cmt-row { display: flex; gap: 8px; }
  .cmt-btn { flex: 1; font: inherit; font-size: 13.5px; font-weight: 600; border: 0; border-radius: 10px; padding: 11px 14px;
    background: #8b7cff; color: #0b0b10; cursor: pointer; }
  .cmt-btn.ghost { background: rgba(255,255,255,.06); color: #cfc4ff; border: 1px solid rgba(255,255,255,.14); font-weight: 500; }
  .cmt-tools { padding: 0 22px 18px; display: flex; flex-direction: column; gap: 8px; }
  .cmt-tools .hint { font-size: 11.5px; color: #6f6f80; line-height: 1.6; }
  .cmt-tools .hint button { background: none; border: 0; padding: 0 0 0 10px; font: inherit; color: #5f5f70; text-decoration: underline; cursor: pointer; }
  .cmt-tools .hint button:hover { color: #cfc4ff; }
  .cmt-code { width: 100%; font: 12px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; color: #cfc4ff;
    background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.14); border-radius: 10px; padding: 10px 12px; min-height: 70px; resize: vertical; display: none; }
  .cmt-code.on { display: block; }
  .cmt-close { position: absolute; right: 16px; top: 16px; background: none; border: 0; color: #8b8b9c; font-size: 20px; cursor: pointer; line-height: 1; }
  `;
  document.head.appendChild(css);

  /* ---------- markup ---------- */
  const dot = document.createElement("div");
  dot.className = "cmt-dot";
  dot.innerHTML = '<i></i><span></span>';
  document.body.appendChild(dot);

  const panel = document.createElement("aside");
  panel.className = "cmt-panel";
  panel.innerHTML = `
    <button class="cmt-close" type="button" aria-label="Close">×</button>
    <div class="cmt-head">
      <div class="k">Comments</div>
      <h4 class="cmt-where"></h4>
      <div class="sub">Press <b>C</b> to open or close this panel.</div>
    </div>
    <div class="cmt-list"></div>
    <div class="cmt-form">
      <input class="cmt-name" type="text" placeholder="Your name — asked once" />
      <div class="cmt-as">Commenting as <b></b> · <button type="button" class="cmt-rename">change</button></div>
      <textarea class="cmt-text" placeholder="Comment on this slide…"></textarea>
      <button class="cmt-btn cmt-submit" type="button">Submit</button>
    </div>
    <div class="cmt-tools">
      <div class="cmt-row">
        <button class="cmt-btn ghost cmt-export" type="button">Copy all as code</button>
        <button class="cmt-btn ghost cmt-import" type="button">Paste code</button>
      </div>
      <textarea class="cmt-code" placeholder="Paste the code here, then press Paste code again"></textarea>
      <div class="hint"><span class="cmt-hint">Comments live in this browser. Send the code to share them.</span> <button type="button" class="cmt-clear">clear all</button><button type="button" class="cmt-save">save file</button></div>
    </div>`;
  document.body.appendChild(panel);

  const $ = (s) => panel.querySelector(s);
  const listEl = $(".cmt-list"), whereEl = $(".cmt-where"), nameEl = $(".cmt-name"),
        asEl = $(".cmt-as"), textEl = $(".cmt-text"), codeEl = $(".cmt-code"), hintEl = $(".cmt-hint");

  const DRAFT = "deckCommentsDraftV1";
  function draftKey() { return DRAFT + ":" + PAGE + ":" + idx; }
  function loadDraft() {
    try { textEl.value = localStorage.getItem(draftKey()) || ""; } catch (e) {}
  }
  function saveDraft() {
    try {
      const v = textEl.value;
      if (v.trim()) localStorage.setItem(draftKey(), v); else localStorage.removeItem(draftKey());
    } catch (e) {}
  }

  function syncWho() {
    const has = !!(store.author || "").trim();
    nameEl.style.display = has ? "none" : "block";
    asEl.style.display = has ? "block" : "none";
    if (has) asEl.querySelector("b").textContent = store.author;
    else nameEl.value = "";
  }
  $(".cmt-rename").addEventListener("click", () => {
    nameEl.value = store.author || "";
    store.author = "";
    save(); syncWho(); nameEl.focus();
  });

  function render() {
    const items = listFor(PAGE, idx);
    whereEl.textContent = (TITLES[PAGE] || PAGE) + " · slide " + (idx + 1);
    listEl.innerHTML = "";
    if (!items.length) {
      const p = document.createElement("div");
      p.className = "cmt-empty";
      p.textContent = "No comments on this slide yet.";
      listEl.appendChild(p);
    } else {
      items.forEach((c) => {
        const el = document.createElement("div");
        el.className = "cmt-item";
        const who = document.createElement("div");
        who.className = "who";
        who.textContent = (c.who ? c.who + " · " : "") + new Date(c.at).toLocaleDateString();
        const tx = document.createElement("div");
        tx.className = "txt";
        tx.textContent = c.text;
        el.appendChild(who); el.appendChild(tx);
        listEl.appendChild(el);
      });
    }
    const n = items.length;
    dot.classList.toggle("on", n > 0 && !open);
    dot.querySelector("span").textContent = n + (n === 1 ? " comment" : " comments");
  }

  function toggle(force) {
    open = force === undefined ? !open : force;
    panel.classList.toggle("open", open);
    render();
    if (open) setTimeout(() => textEl.focus(), 260);
  }

  /* ---------- events ---------- */
  document.addEventListener("deck:change", (e) => { saveDraft(); idx = e.detail.index; loadDraft(); render(); });
  window.addEventListener("hashchange", () => { saveDraft(); idx = fromHash(); loadDraft(); render(); });
  textEl.addEventListener("input", saveDraft);
  window.addEventListener("beforeunload", saveDraft);

  // keys typed inside the panel belong to the panel, never to the deck
  window.addEventListener("keydown", (e) => {
    if (!panel.contains(e.target)) return;
    e.stopImmediatePropagation();
    if (e.key === "Escape") { e.target.blur(); toggle(false); }
    else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); $(".cmt-submit").click(); }
  }, true);

  document.addEventListener("keydown", (e) => {
    const t = e.target;
    const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
    if (typing) {
      if (e.key === "Escape") { t.blur(); toggle(false); }
      return;
    }
    if (e.key.toLowerCase() === "c" && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); toggle(); }
    else if (e.key === "Escape" && open) toggle(false);
  });

  dot.addEventListener("click", () => toggle(true));
  $(".cmt-close").addEventListener("click", () => toggle(false));

  $(".cmt-submit").addEventListener("click", () => {
    const text = textEl.value.trim();
    if (!text) { textEl.focus(); return; }
    const typed = (nameEl.value || "").trim();
    if (typed) store.author = typed;
    if (!(store.author || "").trim()) { nameEl.focus(); hintEl.textContent = "Add a name once, then it's remembered."; return; }
    add(text);
    syncWho();
    try { localStorage.removeItem(draftKey()); } catch (e) {}
    textEl.value = "";
    render();
    hintEl.textContent = "Saved. " + total() + " comments in this browser — copy the code to send them.";
  });

  $(".cmt-export").addEventListener("click", async () => {
    const payload = btoa(unescape(encodeURIComponent(JSON.stringify(store))));
    codeEl.classList.add("on");
    codeEl.value = payload;
    codeEl.select();
    try {
      await navigator.clipboard.writeText(payload);
      hintEl.textContent = "Copied. Paste it to Bella — " + total() + " comments.";
    } catch (err) {
      hintEl.textContent = "Select the code above and copy it manually.";
    }
  });

  $(".cmt-import").addEventListener("click", () => {
    if (!codeEl.classList.contains("on")) {
      codeEl.classList.add("on");
      codeEl.value = "";
      codeEl.focus();
      hintEl.textContent = "Paste the code, then press Paste code again.";
      return;
    }
    const raw = codeEl.value.trim();
    if (!raw) { codeEl.focus(); return; }
    let incoming;
    try { incoming = JSON.parse(decodeURIComponent(escape(atob(raw)))); }
    catch (err) { hintEl.textContent = "That code didn't parse. Check it was copied in full."; return; }
    let added = 0;
    Object.entries(incoming.data || {}).forEach(([page, slides]) => {
      const mine = store.data[page] || (store.data[page] = {});
      Object.entries(slides).forEach(([i, arr]) => {
        const target = mine[i] || (mine[i] = []);
        arr.forEach((c) => {
          if (!target.some((x) => x.at === c.at && x.text === c.text)) { target.push(c); added++; }
        });
        target.sort((a, b) => a.at - b.at);
      });
    });
    save();
    codeEl.classList.remove("on");
    codeEl.value = "";
    render();
    hintEl.textContent = added + " comments added. Slides with comments show a marker.";
  });

  $(".cmt-save").addEventListener("click", () => {
    if (!total()) { hintEl.textContent = "Nothing to save yet."; return; }
    const lines = [];
    Object.entries(store.data).forEach(([page, slides]) => {
      Object.entries(slides).sort((a, b) => a[0] - b[0]).forEach(([i, arr]) => {
        lines.push("## " + (TITLES[page] || page) + " · slide " + (Number(i) + 1));
        arr.forEach((c) => lines.push("- " + c.text));
        lines.push("");
      });
    });
    lines.push("--- code (paste this back into the deck) ---");
    lines.push(btoa(unescape(encodeURIComponent(JSON.stringify(store)))));
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "deck-comments.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    hintEl.textContent = "Saved as deck-comments.txt — the code is at the bottom of the file.";
  });

  $(".cmt-clear").addEventListener("click", () => {
    if (!total()) { hintEl.textContent = "Nothing to clear."; return; }
    if (hintEl.dataset.armed !== "1") {
      hintEl.dataset.armed = "1";
      hintEl.textContent = "Press Clear all again to delete every comment in this browser.";
      setTimeout(() => { hintEl.dataset.armed = "0"; }, 5000);
      return;
    }
    store = { author: "", data: {} };
    save();
    hintEl.dataset.armed = "0";
    render();
    hintEl.textContent = "All comments cleared.";
  });

  syncWho();
  loadDraft();
  render();
})();
