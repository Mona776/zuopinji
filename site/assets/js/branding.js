/** 从 projects.json 同步站点名称到页面 */
(async function () {
  try {
    const root = document.body.dataset.page === "home" ? "./" : "../";
    const res = await fetch(root + "data/projects.json");
    const { site } = await res.json();
    if (!site?.name) return;

    const name = site.name;
    document.querySelectorAll(".site-brand-text").forEach((el) => {
      el.textContent = name;
    });
    document.querySelectorAll("[data-site-name]").forEach((el) => {
      el.textContent = el.dataset.siteName === "tagline" ? site.tagline : name;
    });
    if (document.title.includes("MONA.EXE") || document.title.includes("VIBE")) {
      const part = document.title.split("|").slice(1).join("|").trim();
      document.title = part ? `${name} | ${part}` : name;
    }
  } catch (_) {}
})();
