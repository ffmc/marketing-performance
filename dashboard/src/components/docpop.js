const REPO = "https://github.com/ffmc/marketing-performance/blob/main/docs";

export function DocPopover(root, docs) {
  const buttons = [...root.querySelectorAll("[data-doc]")];
  const pop = root.querySelector(".doc-pop");
  let open = null;

  function toggle(key) {
    open = open === key ? null : key;
    buttons.forEach((b) => b.setAttribute("aria-expanded", b.dataset.doc === open));
    if (!open) { pop.hidden = true; return; }
    const d = docs[open];
    pop.innerHTML = `<div class="doc-head"><h3>${d.title}</h3><button type="button" class="doc-close" aria-label="Close">×</button></div>
      <div class="doc-body prose">${d.html}</div>
      <a class="doc-link" href="${REPO}/${open}.md">Read it on GitHub</a>`;
    pop.hidden = false;
    pop.querySelector(".doc-close").addEventListener("click", () => toggle(open));
  }
  buttons.forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); toggle(b.dataset.doc); }));
  document.addEventListener("click", (e) => { if (open && !pop.contains(e.target)) toggle(open); });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !open) return;
    const k = open;
    toggle(k);
    root.querySelector(`[data-doc="${k}"]`).focus();
  });
}
