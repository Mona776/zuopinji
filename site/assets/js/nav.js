/** 全站导航链接（各页 Stitch 导出里 href="#" 的统一修复） */
(function () {
  const root = getRoot();
  const paths = {
    home: root + "home/",
    gallery: root + "gallery/",
    profile: root + "profile/",
  };

  const logo = document.querySelector("nav a[href], nav .font-headline-md, nav > div:first-child");
  const nav = document.querySelector("nav");
  if (!nav) return;

  const page = document.body.dataset.page || guessPage();

  nav.querySelectorAll("a").forEach((a) => {
    const t = (a.textContent || "").trim().toLowerCase();
    if (t.includes("tool")) a.href = paths.gallery + "?type=tool";
    else if (t.includes("project")) a.href = paths.gallery;
    else if (t.includes("stack")) a.href = paths.gallery + "?type=play";
    else if (t.includes("about")) a.href = paths.profile;
    else if (a.getAttribute("href") === "#" || a.getAttribute("href") === "") a.href = paths.gallery;

    a.classList.remove("text-primary", "font-bold", "border-b-2", "border-primary", "pb-1");
    if (page === "home" && t.includes("tool")) markActive(a);
    if (page === "gallery" && t.includes("project")) markActive(a);
    if (page === "profile" && t.includes("about")) markActive(a);
  });

  const brand = nav.querySelector(".font-headline-md, .text-primary.drop-shadow");
  if (brand && brand.closest("div")) {
    const wrap = brand.closest("div");
    if (!wrap.querySelector("a")) {
      const link = document.createElement("a");
      link.href = paths.home;
      link.className = "flex items-center gap-3 no-underline";
      link.innerHTML = wrap.innerHTML;
      wrap.innerHTML = "";
      wrap.appendChild(link);
    } else {
      wrap.querySelector("a").href = paths.home;
    }
  }

  function markActive(el) {
    el.classList.add("text-primary", "font-bold", "border-b-2", "border-primary", "pb-1");
  }

  function guessPage() {
    const p = location.pathname;
    if (p.includes("/gallery")) return "gallery";
    if (p.includes("/project-detail")) return "project-detail";
    if (p.includes("/profile")) return "profile";
    return "home";
  }

  function getRoot() {
    const parts = location.pathname.split("/").filter(Boolean);
    const idx = parts.findIndex((x) =>
      ["home", "gallery", "profile", "project-detail"].includes(x)
    );
    if (idx <= 0) return "/";
    return "/" + parts.slice(0, idx).join("/") + "/";
  }
})();
