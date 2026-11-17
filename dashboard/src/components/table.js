// Sortable table inside a scrolling panel with a sticky header. Columns: {k, l, txt?, v(row), f(row)}.
export function Table(el, {columns, rows, sortKey, onHover, empty, footnote}) {
  el.innerHTML = `
    <div class="tb-scroll"><table class="tb"><thead><tr>${columns.map((c) => `<th scope="col" class="${c.txt ? "" : "n"}" data-k="${c.k}"><button type="button">${c.l}<span class="sort" aria-hidden="true"></span></button></th>`).join("")}</tr></thead><tbody></tbody></table></div>
    ${footnote ? `<p class="footnote tb-count"></p>` : ""}`;
  let key = sortKey, dir = -1;
  const tbody = el.querySelector("tbody");
  el.querySelectorAll("th").forEach((th) => th.querySelector("button").addEventListener("click", () => {
    const c = columns.find((c) => c.k === th.dataset.k);
    if (key === c.k) dir = -dir;
    else { key = c.k; dir = c.txt ? 1 : -1; }
    draw();
  }));
  if (onHover) {
    tbody.addEventListener("pointerover", (e) => { const tr = e.target.closest("tr[data-id]"); if (tr) onHover(tr.dataset.id); });
    tbody.addEventListener("pointerleave", () => onHover(null));
  }
  function draw() {
    const col = columns.find((c) => c.k === key);
    const data = rows().sort((a, b) => {
      const x = col.v(a), y = col.v(b);
      if (x == null) return y == null ? 0 : 1;
      if (y == null) return -1;
      return (typeof x === "string" ? x.localeCompare(y) : x - y) * dir;
    });
    tbody.innerHTML = data.length
      ? data.map((r) => `<tr data-id="${r.id}">${columns.map((c) => `<td class="${c.txt ? "" : "n"}">${c.f(r)}</td>`).join("")}</tr>`).join("")
      : `<tr><td class="tb-empty" colspan="${columns.length}">${empty()}</td></tr>`;
    el.querySelectorAll("th").forEach((th) => (th.dataset.k === key ? th.setAttribute("aria-sort", dir < 0 ? "descending" : "ascending") : th.removeAttribute("aria-sort")));
    if (footnote) el.querySelector(".tb-count").textContent = footnote(data.length);
  }
  draw();
  return {update: draw, play() {}, reset() {}};
}
