/* ============================================================================
   SLEEVES OS — OWNER'S MANUAL PANEL
   A slide-in help layer with a searchable guide and a plain-text "ask a
   question" assistant that answers from that guide by keyword + synonym match.
   No backend, no network. Appended on every page by the engine's mount().
   Support & documentation by Accelerated Experiences LLC.
   ============================================================================ */
(function (global) {
  "use strict";
  if (!global.Sleeves) return;
  var S = global.Sleeves;

  var CSS = [
    '.man-fab{position:fixed;right:18px;bottom:78px;z-index:60;width:52px;height:52px;border-radius:50%;',
    'border:none;cursor:pointer;background:var(--tang);color:#fff;font-size:22px;box-shadow:var(--sh-lg)}',
    '.man-fab:hover{background:var(--tang-2)}',
    '@media(min-width:981px){.man-fab{bottom:24px}}',
    '.man-scrim{position:fixed;inset:0;background:rgba(34,48,46,.45);z-index:70;opacity:0;pointer-events:none;transition:opacity .18s}',
    '.man-scrim.on{opacity:1;pointer-events:auto}',
    '.man-panel{position:fixed;top:0;right:0;bottom:0;width:min(520px,100%);background:var(--card);z-index:71;',
    'transform:translateX(102%);transition:transform .22s ease;display:flex;flex-direction:column;box-shadow:var(--sh-lg)}',
    '.man-panel.on{transform:none}',
    '.man-head{padding:16px 18px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:10px}',
    '.man-head h2{margin:0;font-size:17px;color:var(--ink)}',
    '.man-head .x{margin-left:auto;border:none;background:none;font-size:22px;cursor:pointer;color:var(--mut)}',
    '.man-ask{padding:14px 18px;border-bottom:1px solid var(--line);background:var(--sunk)}',
    '.man-ask input{width:100%;padding:11px 13px;border:1px solid var(--line);border-radius:10px;font:inherit;background:var(--card);color:var(--ink)}',
    '.man-ask .hint{font-size:12px;color:var(--mut);margin-top:7px}',
    '.man-body{overflow:auto;padding:6px 18px 24px;flex:1}',
    '.man-a{border-bottom:1px solid var(--line-2);padding:14px 0}',
    '.man-a h3{margin:0 0 6px;font-size:14px;color:var(--ink)}',
    '.man-a p{margin:0;font-size:13.5px;line-height:1.62;color:var(--ink-2)}',
    '.man-none{padding:18px 0;font-size:13.5px;color:var(--mut)}',
    '.man-foot{padding:12px 18px;border-top:1px solid var(--line);font-size:11.5px;color:var(--mut)}'
  ].join("");

  function esc(s){ return S.esc(s); }

  function build() {
    var style = document.createElement("style"); style.textContent = CSS;
    document.head.appendChild(style);

    var fab = document.createElement("button");
    fab.className = "man-fab"; fab.title = "Owner's Manual"; fab.setAttribute("aria-label","Open the Owner's Manual");
    fab.textContent = "?";

    var scrim = document.createElement("div"); scrim.className = "man-scrim";
    var panel = document.createElement("div"); panel.className = "man-panel";
    panel.innerHTML =
      '<div class="man-head"><h2>Owner’s Manual</h2>' +
      '<button class="x" aria-label="Close">×</button></div>' +
      '<div class="man-ask"><input id="manQ" placeholder="Ask a question — e.g. why can I not book without a deposit?" autocomplete="off">' +
      '<div class="hint">Type a question, or browse all ' + S.manual().length + ' articles below.</div></div>' +
      '<div class="man-body" id="manBody"></div>' +
      '<div class="man-foot">Support &amp; documentation by <b>Accelerated Experiences LLC</b>. ' +
      'Nothing here is legal, tax or clinical advice.</div>';

    function render(list, searching) {
      var body = panel.querySelector("#manBody");
      if (searching && !list.length) {
        body.innerHTML = '<div class="man-none">Nothing in the manual matches that yet. ' +
          'Try a keyword like <b>overtime</b>, <b>EVV</b>, <b>signature</b>, <b>credential</b> or <b>margin</b>.</div>';
        return;
      }
      body.innerHTML = list.map(function (a) {
        return '<div class="man-a"><h3>' + esc(a.t) + '</h3><p>' + esc(a.c) + '</p></div>';
      }).join("");
    }
    render(S.manual(), false);

    var q = panel.querySelector("#manQ");
    q.addEventListener("input", function () {
      var v = q.value.trim();
      if (!v) return render(S.manual(), false);
      render(S.askManual(v), true);
    });

    function open() { scrim.classList.add("on"); panel.classList.add("on"); setTimeout(function(){ q.focus(); }, 180); }
    function close() { scrim.classList.remove("on"); panel.classList.remove("on"); }
    fab.addEventListener("click", open);
    scrim.addEventListener("click", close);
    panel.querySelector(".x").addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });

    document.body.appendChild(fab);
    document.body.appendChild(scrim);
    document.body.appendChild(panel);
  }

  /* mount() replaces document.body, so wait a tick and attach after it. */
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function(){ setTimeout(build, 30); });
  else setTimeout(build, 30);
})(window);
