/**
 * Renders TECH_STACK.DLL from /data/projects-registry.json (aggregated across experiments).
 */
(function () {
  const CHIP_STYLES = [
    "bg-console-black text-white font-code-label text-[11px] px-3 py-1 uppercase",
    "bg-primary-container text-on-primary-container border-2 border-window-border font-code-label text-[11px] px-3 py-0.5 uppercase",
    "bg-surface-container font-code-label text-[11px] px-3 py-1 uppercase",
    "bg-[#FFE66D] border-2 border-window-border font-code-label text-[11px] px-3 py-0.5 uppercase",
    "bg-[#4ECDC4] border-2 border-window-border font-code-label text-[11px] px-3 py-0.5 uppercase",
  ];

  function collectUsedTech(registry) {
    const set = new Set(registry.site || []);
    for (const stack of Object.values(registry.projects || {})) {
      for (const t of stack) set.add(t);
    }
    return set;
  }

  function chip(label, styleIndex) {
    const cls = CHIP_STYLES[styleIndex % CHIP_STYLES.length];
    return `<span class="${cls}">${label}</span>`;
  }

  function renderCategory(cat, used, styleOffset) {
    const tags = (cat.pick || []).filter((t) => used.has(t));
    if (tags.length === 0) return "";
    const chips = tags
      .map((t, i) => chip(t, styleOffset + i))
      .join("\n");
    return `<div class="space-y-4">
<p class="font-code-label text-[11px] text-on-surface-variant uppercase border-b-2 border-window-border pb-1">${cat.num}. ${cat.title}</p>
<div class="flex flex-wrap gap-2">${chips}</div>
</div>`;
  }

  async function renderTechStack() {
    const grid = document.getElementById("tech-stack-grid");
    const meta = document.getElementById("tech-stack-meta");
    if (!grid) return;

    try {
      const res = await fetch("/data/projects-registry.json");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const registry = await res.json();
      const used = collectUsedTech(registry);
      const projectCount = Object.keys(registry.projects || {}).length;

      let styleOffset = 0;
      const sections = (registry.categories || [])
        .map((cat) => {
          const html = renderCategory(cat, used, styleOffset);
          styleOffset += (cat.pick || []).length;
          return html;
        })
        .filter(Boolean)
        .join("\n");

      grid.innerHTML =
        sections ||
        '<p class="font-code-label text-on-surface-variant uppercase">No stack data</p>';

      if (meta) {
        const chipCount = (registry.categories || []).reduce(
          (n, cat) => n + (cat.pick || []).filter((t) => used.has(t)).length,
          0
        );
        meta.textContent = `// ${chipCount} tags · synced from ${projectCount} experiments`;
      }
    } catch (err) {
      grid.innerHTML = `<p class="font-code-label text-error uppercase">STACK_LOAD_ERROR: ${err.message}</p>`;
    }
  }

  document.addEventListener("DOMContentLoaded", renderTechStack);
})();
