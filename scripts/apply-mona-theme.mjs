#!/usr/bin/env node
/**
 * Apply Mona.exe Creative Portfolio Stitch design to live Vibe Coding Lab pages.
 */
import { readFile, writeFile, copyFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { siteHeader, siteFooter, SITE_CHROME_SCRIPT } from "./site-chrome.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MONA = join(__dirname, "..", "stitch", "Mona.exe Creative Portfolio");
const OUT = join(__dirname, "..", "stitch", "Vibe Coding Lab");

const FAVICON_LINKS = `<link rel="icon" href="/assets/favicon.ico" sizes="any"/>
<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png"/>
<link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16.png"/>
<link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png"/>`;

function injectFavicon(head) {
  if (head.includes("favicon.ico")) return head;
  return head.replace(
    /<meta content="width=device-width, initial-scale=1.0" name="viewport"\/>/,
    `<meta content="width=device-width, initial-scale=1.0" name="viewport"/>\n${FAVICON_LINKS}`
  );
}

const PROJECTS_HOME = [
  { slug: "evergreen", exe: "evergreen.exe", title: "Evergreen", desc: "Drag orbit · A–K chimes · weather synced to local time.", bg: "#4ECDC4" },
  {
    slug: "butterfly",
    exe: "butterfly.exe",
    title: "Digital Butterfly",
    desc: "Finger tracking VFX — light trails, chimes, lucky butterflies.",
    bg: "#8c8eff",
    previewVideo: "videos/butterfly.mp4",
    poster: "covers/butterfly.png",
  },
  {
    slug: "ignis",
    exe: "ignis.exe",
    title: "火系魔法师",
    desc: "Raymarched palm flame · velocity stretching · gesture summon.",
    bg: "#E71D36",
    previewVideo: "videos/ignis.mp4",
    poster: "covers/ignis.png",
  },
  { slug: "duckhunt", exe: "duckhunt.exe", title: "Duck Hunt Hand", desc: "Retro duck hunt — finger aim, thumb trigger, sky reload.", bg: "#6B8E23" },
  {
    slug: "xiaowu",
    exe: "xiaowu.exe",
    title: "联盟小黑屋",
    desc: "WoW memorial × 2008 — QQ frozen chat, song clues, desktop layers.",
    bg: "#1E4D8C",
  },
  { slug: "luckykitty", exe: "luckykitty.exe", title: "Lucky Kitty", desc: "Token · SPIN · barrel-lens cat wish ritual.", bg: "#FFE66D" },
  { slug: "mortytarot", exe: "mortytarot.exe", title: "Morty Tarot", desc: "What Would Morty Do? — one card, one daily quote.", bg: "#FF6B6B" },
  { slug: "balatrocats", exe: "battlecats.exe", title: "Battle Cats TD", desc: "Balatro × Battle Cats — 5-stage lane TD + shop synergies.", bg: "#2EC4B6" },
  { slug: "rainjournal", exe: "rainjournal.exe", title: "Rain Journal", desc: "Zen editor × WebGL storm — write, doodle, shader buffs.", bg: "#0059bb", cover: "rainjournal.png" },
  { slug: "dumplingchef", exe: "dumpling.exe", title: "Dumpling Chef", desc: "Kitchen rush — orders, wrapping, co-op, dirty plates.", bg: "#FF9F1C" },
  { slug: "pixelfarm", exe: "pixelfarm.exe", title: "Pixel Farm", desc: "WASD farm sandbox — hoe, seed, water, NPC chat.", bg: "#6BBF59" },
  { slug: "tiktoktrends", exe: "TIKTOK_DAILY", title: "TikTok Trends Daily", desc: "Daily TikTok intel — Actions, Feishu, Gist, zero server.", bg: "#FE2C55", cover: "tiktoktrends.png" },
  { slug: "redditmonitor", exe: "REDDIT_MON", title: "Reddit Monitor", desc: "RSS + Gemini outreach — Feishu leads & reply drafts.", bg: "#FF4500", cover: "redditmonitor.png" },
];

/** @deprecated use siteHeader */
const nav = siteHeader;
/** @deprecated use siteFooter */
const footerIndustrial = siteFooter;

function homeCardMedia(p) {
  const poster = p.poster || `covers/${p.cover || p.slug + ".png"}`;
  if (p.previewVideo) {
    return `<video class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03] grayscale group-hover:grayscale-0" src="../${p.previewVideo}" poster="../${poster}" muted loop playsinline autoplay preload="metadata" aria-label="${p.title} preview"></video>`;
  }
  return `<img alt="${p.title}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" src="../${poster}"/>`;
}

function homeCards() {
  return PROJECTS_HOME.map(
    (p) => `<a href="/project-detail/?project=${p.slug}" class="group relative flex flex-col border-[3px] border-console-black overflow-hidden tactile-lift aspect-[16/9] cursor-pointer no-underline text-inherit bg-white">
<div class="h-2.5 shrink-0" style="background-color:${p.bg}"></div>
<div class="relative flex-1 min-h-0 overflow-hidden border-[3px] border-t-0 border-console-black" style="border-color:${p.bg}">
${homeCardMedia(p)}
<div class="absolute top-2 right-2 z-10 px-2 py-0.5 bg-console-black/75 font-code-sm text-code-sm uppercase tracking-wider text-white">${p.exe}</div>
</div>
</a>`
  ).join("\n");
}

async function buildHome() {
  const template = await readFile(join(MONA, "home/index.html"), "utf8");
  const headEnd = template.indexOf("</head>") + 7;
  const head = injectFavicon(template.slice(0, headEnd));
  const body = `${head}
<body class="bg-[#f0f0f0] text-on-background font-body-base selection:bg-primary-container selection:text-on-primary-container min-h-screen flex flex-col">
${siteHeader("home")}
<main class="flex-grow max-w-[1440px] mx-auto w-full px-margin-mobile md:px-margin-desktop pt-32 pb-16">
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-card-gap">
${homeCards()}
</div>
</main>
${siteFooter()}
${SITE_CHROME_SCRIPT}
</body></html>`;
  await writeFile(join(OUT, "home/index.html"), body);
}

const PROFILE_README_HTML = `<div class="mb-6 space-y-6" id="readme-mona">
<p class="font-code-label text-primary text-lg font-black">&gt; Initializing developer_profile.bin...</p>
<p class="font-body-base text-body-base leading-relaxed text-console-black">
Hey, I'm Mona. This is my digital sandbox, mostly just a collection of random code experiments I whipped up for the pure fun of it.
</p>
<p class="font-body-base text-body-base leading-relaxed text-console-black">
I'm a big fan of "Vibe Coding." Instead of over-engineering everything, I like treating the browser as a blank canvas to build weird little digital entities—whether that's a pixel tree doing its own procedural growth in the background, or letting an AI run wild trying to turn natural language into playable games.
</p>
<div class="bg-surface-container-low p-6 border-l-8 border-console-black italic">
<p class="font-code-label text-on-surface-variant">
"Reason is, and ought only to be the slave of the passions."
</p>
</div>
<p class="font-body-base text-body-base leading-relaxed text-console-black">
When I'm not breaking things or chasing down bugs, I'm usually just staring blankly at my screen, or flipping through ancient Greek philosophy and 18th-century empiricism, trying to figure out the future of modern AI through Plato and Hume.
</p>
<p class="font-body-base text-body-base leading-relaxed text-console-black">
Feel free to poke around. Everything here is a work in progress anyway. Enjoy the glitches!
</p>
<p class="cursor-blink font-black text-primary text-xl font-code-label">&gt; █</p>
</div>`;

function patchProfileSidebar(html) {
  return html
    .replace(
      /<h2 class="font-headline-md text-headline-md tracking-tighter">MONA_[^<]+<\/h2>/,
      '<h2 class="font-headline-md text-headline-md tracking-tighter">MONA_CHEN</h2>'
    )
    .replace(
      /<span class="font-code-label text-code-label uppercase font-black">Senior Interface Architect<\/span>/,
      '<span class="font-code-label text-code-label uppercase font-black">Hybrid Creator</span>'
    )
    .replace(
      /<span class="font-code-label text-code-label uppercase">London, UK \(51\.5074° N\)<\/span>/,
      '<span class="font-code-label text-code-label uppercase">Beijing, CN</span>'
    )
    .replace(
      /<span class="font-code-label text-code-label uppercase">8\.2 Years Total_Runtime<\/span>/,
      '<span class="font-code-label text-code-label uppercase">Running_For_Fun</span>'
    );
}

const TECH_STACK_DYNAMIC = `<div class="p-8 bg-white m-2 border-2 border-window-border">
<p id="tech-stack-meta" class="font-code-label text-[10px] text-on-surface-variant uppercase mb-6 opacity-70">// loading stack from experiments…</p>
<!-- TECH_STACK_DYNAMIC -->
<div id="tech-stack-grid" class="grid grid-cols-1 md:grid-cols-2 gap-8 min-h-[120px]"></div>
</div>`;

function patchProfileReadme(html) {
  if (html.includes('id="readme-mona"')) {
    return html.replace(
      /<div class="mb-6 space-y-6" id="readme-mona">[\s\S]*?<\/div>(?=\s*<\/div>\s*<\/div>\s*<!-- Tech Stack Window)/,
      PROFILE_README_HTML
    );
  }
  return html.replace(
    /<div class="mb-6 space-y-6">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<!-- Tech Stack Window/,
    `${PROFILE_README_HTML}\n</div>\n</div>\n<!-- Tech Stack Window`
  );
}

function patchProfileTechStack(html) {
  html = patchProfileSidebar(html);
  html = patchProfileReadme(html);
  if (html.includes('id="tech-stack-grid"')) {
    if (!html.includes("render-tech-stack.js")) {
      html = html.replace(
        /<\/footer>\s*<script>/,
        '</footer>\n<script src="/js/render-tech-stack.js"></script>\n<script>'
      );
    }
    return html;
  }
  html = html.replace(
    /<div class="p-8 bg-white m-2 border-2 border-window-border">\s*<div class="grid grid-cols-1 md:grid-cols-2 gap-8">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<!-- Call to Action/,
    `${TECH_STACK_DYNAMIC}\n</div>\n<!-- Call to Action`
  );
  if (!html.includes("render-tech-stack.js")) {
    html = html.replace(
      /<\/footer>\s*<script>/,
      '</footer>\n<script src="/js/render-tech-stack.js"></script>\n<script>'
    );
  }
  return html;
}

async function buildProfile() {
  const livePath = join(OUT, "profile/index.html");
  let html;
  try {
    html = await readFile(livePath, "utf8");
    if (html.includes("site-status-pip") || html.includes('href="/home/"')) {
      html = patchProfileTechStack(html);
      await writeFile(livePath, html);
      return;
    }
  } catch {
    /* fall through to Mona template */
  }

  html = await readFile(join(MONA, "profile/index.html"), "utf8");
  html = html.replace(/<a[^>]*>Projects<\/a>\s*/g, "");
  html = html.replace(
    /<a([^>]*href=")#"([^>]*)>Experiments<\/a>/,
    '<a$1/home/"$2>Experiments</a>'
  );
  html = html.replace(
    /<a([^>]*href=")#"([^>]*)>About<\/a>/,
    '<a$1/profile/"$2>About</a>'
  );
  html = html.replace(/<a[^>]*href="\/gallery\/"[^>]*>Projects<\/a>\s*/g, "");
  html = html.replace(/href="\/home\/"<\//g, 'href="/home/">Experiments</');
  html = html.replace(/href="\/profile\/"<\//g, 'href="/profile/">About</');
  html = html.replace(
    /src="https:\/\/lh3\.googleusercontent\.com[^"]+"/,
    'src="photo.jpg"'
  );
  html = html.replace(/© 2024 MONA\.EXE/g, "© 2026 MONA.EXE");
  html = html.replace(
    /<span class="font-display-lg text-headline-md font-black text-console-black uppercase tracking-tighter">Mona\.exe<\/span>/,
    '<a href="/home/" class="font-display-lg text-headline-md font-black text-console-black uppercase tracking-tighter no-underline">MONA.EXE</a>'
  );
  html = patchProfileTechStack(html);
  await writeFile(join(OUT, "profile/index.html"), html);
}

async function buildProjectDetail() {
  const template = await readFile(join(MONA, "project-detail/index.html"), "utf8");
  const headEnd = template.indexOf("</head>") + 7;
  const head = injectFavicon(template.slice(0, headEnd));
  const script = await readFile(join(OUT, "project-detail/index.html"), "utf8");
  const scriptMatch = script.match(/<script>\s*const PROJECTS[\s\S]*<\/script>/);
  if (!scriptMatch) throw new Error("PROJECTS script not found");

  const body = `${head}
<body class="bg-[#f0f0f0] text-on-background font-body-base min-h-screen flex flex-col">
${siteHeader(null)}
<main class="flex-grow max-w-[1440px] mx-auto w-full px-margin-mobile md:px-margin-desktop pt-32 pb-16">
<div class="mb-12">
<a class="inline-flex items-center gap-2 font-code-label text-code-label text-console-black hover:text-cobalt-blue transition-colors group no-underline" href="/home/">
<span class="material-symbols-outlined text-[18px]">arrow_back</span>
<span class="font-bold">BACK_TO_EXPERIMENTS</span>
</a>
</div>
<div class="grid grid-cols-12 gap-gutter mb-12">
<div class="col-span-12 lg:col-span-8">
<span class="font-code-label text-code-label text-on-surface-variant uppercase block mb-2" id="project-id">Project ID: 005-EVERGREEN</span>
<h1 class="font-display-lg text-[40px] md:text-[56px] font-extrabold tracking-tighter text-console-black uppercase leading-none mb-6" id="project-title">Evergreen</h1>
<div class="flex flex-wrap gap-2" id="project-tags"></div>
</div>
<div class="col-span-12 lg:col-span-4 flex items-end justify-end">
<a id="btn-launch" class="px-8 py-4 bg-safety-red text-white font-extrabold font-headline-md border-[3px] border-console-black tactile-lift flex items-center gap-3 w-full lg:w-auto justify-center no-underline" href="#" target="_blank" rel="noopener noreferrer">
<span class="material-symbols-outlined font-bold">rocket_launch</span>
LAUNCH_EXPERIMENT
</a>
</div>
</div>
<div class="w-full border-[3px] border-console-black mb-16 overflow-hidden shadow-[8px_8px_0px_0px_rgba(18,18,18,1)]" id="preview-panel">
<div class="bg-white text-console-black px-4 py-2 flex justify-between items-center border-b-[3px] border-console-black">
<div class="flex gap-2">
<div class="w-3 h-3 rounded-full bg-safety-red border border-console-black"></div>
<div class="w-3 h-3 rounded-full bg-industrial-yellow border border-console-black"></div>
<div class="w-3 h-3 rounded-full bg-cobalt-blue border border-console-black"></div>
</div>
<div class="font-code-sm text-code-sm uppercase tracking-widest font-bold">PREVIEW_WINDOW.EXE</div>
<div class="flex items-center gap-2">
<a id="external-link" class="font-code-sm text-code-sm uppercase font-bold hover:text-cobalt-blue flex items-center gap-1 px-2 py-1 border-[3px] border-console-black" href="#" target="_blank" rel="noopener noreferrer" title="新标签页打开"><span class="material-symbols-outlined text-[16px]">open_in_new</span></a>
<button type="button" id="btn-fullscreen" class="p-1 border-[3px] border-console-black hover:bg-surface-container" title="全屏预览"><span class="material-symbols-outlined text-[18px]">fullscreen</span></button>
</div>
</div>
<div class="relative bg-[#0a0a0a] min-h-[360px] md:min-h-[480px] flex flex-col">
<iframe id="project-iframe" class="flex-1 w-full min-h-[360px] border-0" loading="lazy" title="Live preview"></iframe>
<p id="preview-hint" class="font-code-sm text-code-sm text-center text-on-surface-variant/80 px-4 py-2 border-t-[3px] border-console-black bg-white"></p>
</div>
</div>
<div class="grid grid-cols-12 gap-8 mb-12">
<div class="col-span-12 lg:col-span-5">
<section class="border-[3px] border-console-black bg-white overflow-hidden shadow-[8px_8px_0px_0px_rgba(18,18,18,1)] h-full flex flex-col">
<div class="bg-cobalt-blue border-b-[3px] border-console-black px-4 py-2 text-white flex justify-between items-center">
<h2 class="font-code-label text-code-label font-extrabold uppercase">CODE_DUMP</h2>
<span id="code-filename" class="font-code-sm text-code-sm opacity-80">—</span>
</div>
<div id="code-body" class="p-4 font-code-sm text-code-sm text-console-black overflow-y-auto flex-grow bg-[#f8f8f8] max-h-[420px] min-h-[200px]"></div>
<div class="bg-console-black text-terminal-green px-4 py-2 border-t-[3px] border-console-black font-code-sm text-code-sm" id="deploy-host">Deployed · —</div>
</section>
</div>
<div class="col-span-12 lg:col-span-7">
<section class="border-[3px] border-console-black bg-white overflow-hidden shadow-[8px_8px_0px_0px_rgba(18,18,18,1)]">
<div class="bg-industrial-yellow border-b-[3px] border-console-black px-6 py-3 flex items-center gap-3">
<span class="material-symbols-outlined text-console-black font-bold">description</span>
<h2 class="font-display-lg text-2xl text-console-black font-extrabold uppercase tracking-tight">EXPERIMENT_LOG</h2>
</div>
<div class="p-8 space-y-6 text-on-surface-variant font-body-base leading-relaxed">
<p id="process-1"></p>
<p id="process-2"></p>
<p id="process-3"></p>
</div>
</section>
</div>
</div>
<section class="mb-12 grid grid-cols-1 md:grid-cols-2 gap-8">
<a id="nav-prev" class="group border-[3px] border-console-black bg-white p-6 tactile-lift flex items-center justify-between no-underline text-inherit shadow-[8px_8px_0px_0px_rgba(18,18,18,1)]">
<div class="flex items-center gap-4">
<span class="material-symbols-outlined text-cobalt-blue">arrow_back</span>
<div>
<span class="font-code-label text-code-label text-on-surface-variant uppercase block">Previous</span>
<span class="font-headline-md text-headline-md font-extrabold text-console-black block" id="nav-prev-title">—</span>
</div>
</div>
</a>
<a id="nav-next" class="group border-[3px] border-console-black bg-white p-6 tactile-lift flex items-center justify-between text-right no-underline text-inherit shadow-[8px_8px_0px_0px_rgba(18,18,18,1)]">
<div class="flex items-center gap-4 ml-auto">
<div>
<span class="font-code-label text-code-label text-on-surface-variant uppercase block">Next</span>
<span class="font-headline-md text-headline-md font-extrabold text-console-black block" id="nav-next-title">—</span>
</div>
<span class="material-symbols-outlined text-cobalt-blue">arrow_forward</span>
</div>
</a>
</section>
</main>
${siteFooter()}
${SITE_CHROME_SCRIPT}
<style>
.code-syntax-comment { color: #006e27; }
.code-syntax-keyword { color: #0059bb; font-weight: 600; }
.code-syntax-func { color: #765a21; }
.text-terminal-green { color: #00FF66; }
.pulse-glow { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .7; } }
</style>
${scriptMatch[0].replace(
    /`<span class="px-3 py-1 bg-surface-container-high rounded-full font-code-md text-code-md border border-outline-variant\/30 text-on-surface-variant">\$\{t\}<\/span>`/,
    "`<span class=\"bg-cobalt-blue text-white font-code-label text-code-label px-3 py-1 border-[3px] border-console-black uppercase\">${t.replace('#', '')}</span>`"
  ).replace(
    "hintEl.classList.toggle('text-primary-fixed-dim', !!p.needsCamera);\n            document.getElementById('preview-panel')?.classList.toggle('ring-1', !!p.needsCamera);\n            document.getElementById('preview-panel')?.classList.toggle('ring-primary/30', !!p.needsCamera);",
    "hintEl.classList.toggle('text-cobalt-blue', !!p.needsCamera);\n            document.getElementById('btn-launch').href = p.url;"
  ).replace(
    /const glow[\s\S]*?}\);\s*\n\s*\/\/ Fullscreen/,
    "// Fullscreen"
  ).replace(
    /\/\/ Small parallax[\s\S]*?\}\);\s*\n    <\/script>/,
    `document.getElementById('btn-launch').addEventListener('click', (e) => {
      const p = PROJECTS[new URLSearchParams(location.search).get('project') || 'evergreen'] || PROJECTS.evergreen;
      document.getElementById('external-link').href = p.url;
    });
    </script>`
  )}
</body></html>`;
  await writeFile(join(OUT, "project-detail/index.html"), body);
}

async function buildGalleryRedirect() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta http-equiv="refresh" content="0;url=/home/"/>
<link rel="canonical" href="/home/"/>
<script>location.replace("/home/");</script>
<title>Redirecting… | MONA.EXE</title>
</head>
<body><p><a href="/home/">Experiments — MONA.EXE</a></p></body>
</html>`;
  await writeFile(join(OUT, "gallery/index.html"), html);
}

async function main() {
  await buildHome();
  await buildProfile();
  await buildProjectDetail();
  await buildGalleryRedirect();
  await copyFile(join(MONA, "home/screenshot.png"), join(OUT, "home/screenshot.png"));
  await copyFile(join(MONA, "profile/screenshot.png"), join(OUT, "profile/screenshot.png"));
  await copyFile(join(MONA, "project-detail/screenshot.png"), join(OUT, "project-detail/screenshot.png"));
  const manifest = {
    projectId: "8699605267875296786",
    projectTitle: "Mona.exe Creative Portfolio",
    appliedAt: new Date().toISOString(),
    screens: ["home", "profile", "project-detail"],
  };
  await writeFile(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log("Applied Mona.exe theme to", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
