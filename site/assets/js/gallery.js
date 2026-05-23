/** 作品列表：从 data/projects.json 渲染，支持 ?type=tool|play */
(async function () {
  const grid = document.querySelector(".masonry-grid");
  if (!grid) return;

  const root = location.pathname.includes("/gallery") ? "../" : "./";
  const res = await fetch(root + "data/projects.json");
  const data = await res.json();
  let projects = data.projects || [];

  const typeFilter = new URLSearchParams(location.search).get("type");
  if (typeFilter === "tool" || typeFilter === "play") {
    projects = projects.filter((p) => p.type === typeFilter);
  }

  grid.innerHTML = projects.map((p) => cardHtml(p, root)).join("");

  document.querySelectorAll("[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const f = btn.dataset.filter;
      const url = new URL(location.href);
      if (f === "all") url.searchParams.delete("type");
      else url.searchParams.set("type", f);
      location.href = url.toString();
    });
  });

  highlightFilterButtons(typeFilter);
})();

function cardHtml(p, root) {
  const aspect =
    p.aspect === "tall"
      ? "aspect-[3/4]"
      : p.aspect === "square"
        ? "aspect-square"
        : p.aspect === "4/3"
          ? "aspect-[4/3]"
          : "aspect-video";
  const detail = root + "project-detail/?slug=" + encodeURIComponent(p.slug);
  const launch = p.demoUrl || detail;
  const target = p.demoUrl ? ' target="_blank" rel="noopener"' : "";

  return `
  <div class="masonry-item group relative glass-card rounded-xl overflow-hidden">
    <a href="${detail}" class="block no-underline text-inherit">
      <div class="${aspect} relative overflow-hidden">
        <img alt="${escapeHtml(p.title)}" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-110" src="${p.image}"/>
        <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span class="bg-primary-container text-on-primary-container px-lg py-sm rounded-full font-label-caps text-label-caps flex items-center gap-2">
            <span class="material-symbols-outlined">${p.type === "tool" ? "build" : "sports_esports"}</span>
            ${p.type === "tool" ? "打开工具" : "玩一下"}
          </span>
        </div>
      </div>
      <div class="p-md">
        <div class="flex justify-between items-start mb-xs">
          <h3 class="font-code-md text-code-md font-bold text-primary-fixed-dim uppercase tracking-wider">${escapeHtml(p.title)}</h3>
          <span class="font-label-caps text-[10px] text-outline border border-outline-variant/40 px-2 py-0.5 rounded">${p.type === "tool" ? "TOOL" : "PLAY"}</span>
        </div>
        <p class="text-on-surface-variant text-sm mb-md line-clamp-2">${escapeHtml(p.tagline)}</p>
        <div class="flex flex-wrap gap-xs">
          ${(p.tags || []).slice(0, 3).map((t) => `<span class="font-label-caps text-[10px] text-secondary-fixed-dim border border-secondary-fixed-dim/30 px-xs py-[2px] rounded">${escapeHtml(t)}</span>`).join("")}
        </div>
      </div>
    </a>
    ${p.demoUrl ? `<a href="${p.demoUrl}"${target} class="sr-only">demo</a>` : ""}
  </div>`;
}

function highlightFilterButtons(active) {
  document.querySelectorAll(".flex.flex-wrap.gap-xs.mb-lg button, .flex.flex-wrap.gap-xs.mb-lg a").forEach((el, i) => {
    const labels = ["all", "play", "tool"];
    const key = i === 0 ? "all" : i === 1 ? "play" : "tool";
    const on = (!active && key === "all") || active === key;
    if (on) {
      el.classList.add("border-primary", "text-primary", "bg-primary/10");
      el.classList.remove("border-outline-variant/30", "text-on-surface-variant");
    }
  });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
