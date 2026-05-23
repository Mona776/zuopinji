#!/usr/bin/env node
/**
 * Download Stitch screen HTML + screenshots for Vibe Coding Lab project.
 * Requires STITCH_API_KEY (from https://stitch.withgoogle.com/settings)
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { stitch } from "@google/stitch-sdk";

const PROJECT_ID = "131747744848736302";
const PROJECT_TITLE = "Vibe Coding Lab";

const SCREENS = [
  { id: "bbe8c370f8f6462e84536850a5810f41", slug: "gallery", title: "作品列表 - Gallery" },
  { id: "1bf8cc9159db4c1bbaa62966df85cd98", slug: "home", title: "首页 - Vibecoding Portfolio" },
  { id: "43cb3a400e404dcea45d98339cf58602", slug: "project-detail", title: "项目详情 - Interactive Tool" },
  { id: "86d9440125844287b6d7a9c6ebb632b2", slug: "profile", title: "关于我 - 个人照片版 Profile with Photo" },
];

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "stitch", PROJECT_TITLE);

async function downloadUrl(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(dirname(destPath), { recursive: true });
  await writeFile(destPath, buf);
  return buf.length;
}

function screenshotUrl(baseUrl, width) {
  if (!width) return baseUrl;
  const sep = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${sep}=w${width}`;
}

async function main() {
  if (!process.env.STITCH_API_KEY && !(process.env.STITCH_ACCESS_TOKEN && process.env.GOOGLE_CLOUD_PROJECT)) {
    console.error("Missing auth: set STITCH_API_KEY or STITCH_ACCESS_TOKEN + GOOGLE_CLOUD_PROJECT");
    process.exit(1);
  }

  const project = stitch.project(PROJECT_ID);
  const manifest = {
    projectId: PROJECT_ID,
    projectTitle: PROJECT_TITLE,
    downloadedAt: new Date().toISOString(),
    screens: [],
  };

  for (const spec of SCREENS) {
    console.log(`\n→ ${spec.title} (${spec.id})`);
    const screen = await project.getScreen(spec.id);
    const raw = screen.data ?? {};
    const width = raw.width;

    const htmlUrl = await screen.getHtml();
    const imageUrl = await screen.getImage();

    if (!htmlUrl) throw new Error(`No htmlCode.downloadUrl for ${spec.slug}`);
    if (!imageUrl) throw new Error(`No screenshot.downloadUrl for ${spec.slug}`);

    const screenDir = join(OUT_DIR, spec.slug);
    const htmlPath = join(screenDir, "index.html");
    const pngPath = join(screenDir, "screenshot.png");

    const htmlSize = await downloadUrl(htmlUrl, htmlPath);
    const imgSize = await downloadUrl(screenshotUrl(imageUrl, width), pngPath);

    console.log(`  ✓ index.html (${htmlSize} bytes)`);
    console.log(`  ✓ screenshot.png (${imgSize} bytes)`);

    manifest.screens.push({
      ...spec,
      width: raw.width,
      height: raw.height,
      deviceType: raw.deviceType,
      htmlPath: htmlPath.replace(OUT_DIR + "/", ""),
      screenshotPath: pngPath.replace(OUT_DIR + "/", ""),
    });
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`\nDone. Output: ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
