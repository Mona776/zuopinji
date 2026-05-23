/** 项目详情：?slug=xxx 加载作品，支持 iframe 内嵌 demo */
(async function () {
  const slug = new URLSearchParams(location.search).get("slug");
  if (!slug) return;

  const root = "../";
  const res = await fetch(root + "data/projects.json");
  const { projects } = await res.json();
  const project = projects.find((p) => p.slug === slug);
  if (!project) return;

  const titleEl = document.querySelector("header h1");
  if (titleEl) titleEl.textContent = project.title;

  const idEl = document.querySelector("header .font-label-caps");
  if (idEl) idEl.textContent = `Project / ${project.type.toUpperCase()} / ${project.slug}`;

  const tagWrap = document.querySelector("header .flex.gap-xs");
  if (tagWrap) {
    tagWrap.innerHTML = (project.tags || [])
      .map(
        (t) =>
          `<span class="px-3 py-1 bg-surface-container-high rounded-full font-code-md text-code-md border border-outline-variant/30 text-on-surface-variant">#${escapeHtml(t)}</span>`
      )
      .join("");
  }

  const preview = document.querySelector("section.grid.lg\\:grid-cols-2 .glass-card.rounded-xl.overflow-hidden.group, section.grid .relative.group.rounded-xl");
  if (preview && project.demoUrl) {
    preview.innerHTML = `
      <iframe
        src="${project.demoUrl}"
        title="${escapeHtml(project.title)}"
        class="w-full h-full min-h-[400px] lg:min-h-[700px] border-0 bg-black"
        allow="accelerometer; autoplay; camera; clipboard-write; encrypted-media; fullscreen; gyroscope; microphone; picture-in-picture"
        loading="lazy"
      ></iframe>
      <div class="absolute top-4 right-4 flex gap-2 z-10">
        <a href="${project.demoUrl}" target="_blank" rel="noopener"
           class="px-4 py-2 rounded-full bg-primary-container text-on-primary-container font-label-caps text-label-caps text-sm no-underline hover:shadow-[0_0_25px_rgba(191,0,255,0.4)]">
          新标签全屏
        </a>
      </div>`;
    preview.classList.add("relative");
  }

  document.querySelectorAll("section.mb-xl p.text-on-surface-variant").forEach((p, i) => {
    if (i === 0 && project.description) p.textContent = project.description;
  });

  wirePrevNext(projects, project, root);
})();

function wirePrevNext(projects, current, root) {
  const idx = projects.findIndex((p) => p.slug === current.slug);
  const prev = projects[idx - 1];
  const next = projects[idx + 1];
  const links = document.querySelectorAll("section.mb-xl.grid a.group.glass-card");
  if (links[0] && prev) {
    links[0].href = root + "project-detail/?slug=" + encodeURIComponent(prev.slug);
    const t = links[0].querySelector(".font-headline-md, .font-bold");
    if (t) t.textContent = prev.title;
  }
  if (links[1] && next) {
    links[1].href = root + "project-detail/?slug=" + encodeURIComponent(next.slug);
    const t = links[1].querySelector(".font-headline-md, .font-bold");
    if (t) t.textContent = next.title;
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
