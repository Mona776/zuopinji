/** 首页：精选作品卡片链到详情页 */
(async function () {
  const root = "./";
  const res = await fetch(root + "data/projects.json");
  const { projects } = await res.json();
  const featured = projects.filter((p) => p.featured).concat(projects.filter((p) => !p.featured)).slice(0, 3);

  const cards = document.querySelectorAll("section .grid.grid-cols-1.md\\:grid-cols-3 .glass-card");
  cards.forEach((card, i) => {
    const p = featured[i];
    if (!p) return;
    const title = card.querySelector("h3");
    const desc = card.querySelector("p.text-on-surface-variant");
    const img = card.querySelector("img");
    if (title) title.textContent = p.title;
    if (desc) desc.textContent = p.tagline;
    if (img && p.image) img.src = p.image;
    card.style.cursor = "pointer";
    card.addEventListener("click", () => {
      location.href = root + "project-detail/?slug=" + encodeURIComponent(p.slug);
    });
  });

  const explore = document.querySelector('a[href="#"]');
  document.querySelectorAll('section a.group').forEach((a) => {
    if ((a.textContent || "").includes("Explore")) a.href = root + "gallery/";
  });
})();
