#!/usr/bin/env node
/**
 * Capture project cover PNGs after pages fully load (WebGL, video, fonts).
 * Usage: node scripts/capture-project-covers.mjs [slug ...]
 */
import puppeteer from "puppeteer";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "stitch/Vibe Coding Lab/covers");

const CHROME =
  process.platform === "darwin"
    ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    : undefined;

/** @type {Array<{slug:string,url:string,extraMs?:number,goneText?:string,selector?:string,timeout?:number}>} */
const PROJECTS = [
  {
    slug: "evergreen",
    url: "https://mona-exe-evergreen.vercel.app/",
    goneText: "Loading",
    selector: "canvas",
    extraMs: 6000,
    timeout: 90000,
  },
  {
    slug: "rainjournal",
    url: "https://rijiben-scpr.vercel.app/",
    selector: "canvas",
    extraMs: 10000,
    timeout: 120000,
  },
  {
    slug: "butterfly",
    url: "https://butterfly-jsyg.vercel.app/",
    selector: "canvas",
    goneText: "Loading",
    extraMs: 8000,
    timeout: 90000,
  },
  { slug: "ignis", url: "https://iginis.vercel.app/", selector: "canvas", extraMs: 4000 },
  {
    slug: "duckhunt",
    url: "https://duck-rho-henna.vercel.app/",
    selector: "canvas",
    goneText: "INITIALIZING",
    extraMs: 6000,
    timeout: 90000,
  },
  {
    slug: "xiaowu",
    url: "https://lianmengxiaoheiwu.vercel.app/",
    clickText: "CLICK TO START",
    extraMs: 5000,
    timeout: 90000,
  },
  { slug: "luckykitty", url: "https://luckykitty.vercel.app/", extraMs: 5000 },
  { slug: "mortytarot", url: "https://mortytarot.vercel.app/", extraMs: 5000 },
  { slug: "balatrocats", url: "https://balatro-cats-r717.vercel.app/", extraMs: 6000 },
  { slug: "dumplingchef", url: "https://dumplingchef-ypih.vercel.app/", extraMs: 5000 },
  {
    slug: "pixelfarm",
    url: "https://oc-steel.vercel.app/",
    selector: "#gameCanvas",
    keys: ["Space"],
    extraMs: 5000,
  },
];

async function waitForMedia(page) {
  await page.evaluate(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const images = [...document.images];
    await Promise.all(
      images.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete && img.naturalWidth > 0) resolve();
            else {
              img.addEventListener("load", resolve, { once: true });
              img.addEventListener("error", resolve, { once: true });
              setTimeout(resolve, 15000);
            }
          })
      )
    );
    const videos = [...document.querySelectorAll("video")];
    await Promise.all(
      videos.map(
        (v) =>
          new Promise((resolve) => {
            if (v.readyState >= 2) resolve();
            else {
              v.addEventListener("loadeddata", resolve, { once: true });
              v.addEventListener("error", resolve, { once: true });
              setTimeout(resolve, 20000);
            }
          })
      )
    );
    if (document.fonts?.ready) {
      try {
        await Promise.race([document.fonts.ready, wait(8000)]);
      } catch {
        /* ignore */
      }
    }
    await wait(500);
  });
}

async function captureOne(browser, project) {
  const out = join(OUT_DIR, `${project.slug}.png`);
  const page = await browser.newPage();
  const timeout = project.timeout ?? 60000;

  try {
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
    console.log(`Capturing ${project.slug} from ${project.url} ...`);

    await page.goto(project.url, {
      waitUntil: "networkidle2",
      timeout,
    });

    if (project.goneText) {
      try {
        await page.waitForFunction(
          (t) => !document.body?.innerText?.includes(t),
          { timeout },
          project.goneText
        );
        console.log(`  ${project.slug}: "${project.goneText}" gone`);
      } catch {
        console.warn(`  ${project.slug}: still showing "${project.goneText}", continuing`);
      }
    }

    if (project.selector) {
      try {
        await page.waitForSelector(project.selector, { timeout, visible: true });
        console.log(`  ${project.slug}: found ${project.selector}`);
      } catch {
        console.warn(`  ${project.slug}: selector ${project.selector} timeout`);
      }
    }

    await waitForMedia(page);

    if (project.clickText) {
      try {
        await page.evaluate((text) => {
          const nodes = document.querySelectorAll("button, a, [role='button'], div, span");
          for (const el of nodes) {
            if (el.textContent?.trim().includes(text)) {
              el.click();
              return true;
            }
          }
          return false;
        }, project.clickText);
        await new Promise((r) => setTimeout(r, 1200));
        console.log(`  ${project.slug}: clicked "${project.clickText}"`);
      } catch {
        console.warn(`  ${project.slug}: could not click "${project.clickText}"`);
      }
    }

    if (project.keys?.length) {
      for (const key of project.keys) {
        await page.keyboard.press(key);
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    const extra = project.extraMs ?? 3000;
    await new Promise((r) => setTimeout(r, extra));

    // Let WebGL settle (Evergreen / Rain Journal)
    if (project.selector === "canvas") {
      await page.evaluate(async () => {
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        await new Promise((r) => setTimeout(r, 1500));
      });
    }

    await page.screenshot({ path: out, type: "png", fullPage: false });
    console.log(`  -> ${out}`);
  } finally {
    await page.close();
  }
}

async function main() {
  const only = process.argv.slice(2);
  const list =
    only.length > 0
      ? PROJECTS.filter((p) => only.includes(p.slug))
      : PROJECTS;

  if (list.length === 0) {
    console.error("Unknown slug(s). Available:", PROJECTS.map((p) => p.slug).join(", "));
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"],
  });

  try {
    for (const project of list) {
      await captureOne(browser, project);
    }
  } finally {
    await browser.close();
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
