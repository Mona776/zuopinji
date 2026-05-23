#!/usr/bin/env node
/**
 * Download Mona.exe Creative Portfolio screens from Stitch.
 * Requires STITCH_API_KEY
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { stitch } from "@google/stitch-sdk";

const PROJECT_ID = "8699605267875296786";
const PROJECT_TITLE = "Mona.exe Creative Portfolio";

const SCREENS = [
  { id: "cbcde0d1108846b0a9422515e6aec00e", slug: "home", title: "Mona.exe - Home" },
  { id: "522b3382e2d54406b3626c4df736afc9", slug: "project-detail", title: "Mona.exe - Project Detail (Industrial Retro)" },
  { id: "ccbde365469844189cb76ce459e321a9", slug: "profile", title: "Mona.exe - About (V2)" },
];

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "stitch", PROJECT_TITLE);

async function downloadUrl(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
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
    console.error("Missing STITCH_API_KEY");
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
    const htmlUrl = await screen.getHtml();
    const imageUrl = await screen.getImage();
    if (!htmlUrl) throw new Error(`No html for ${spec.slug}`);
    if (!imageUrl) throw new Error(`No screenshot for ${spec.slug}`);

    const screenDir = join(OUT_DIR, spec.slug);
    const htmlSize = await downloadUrl(htmlUrl, join(screenDir, "index.html"));
    const imgSize = await downloadUrl(screenshotUrl(imageUrl, raw.width), join(screenDir, "screenshot.png"));
    console.log(`  ✓ index.html (${htmlSize} bytes)`);
    console.log(`  ✓ screenshot.png (${imgSize} bytes)`);

    manifest.screens.push({
      ...spec,
      width: raw.width,
      height: raw.height,
      deviceType: raw.deviceType,
      htmlPath: `${spec.slug}/index.html`,
      screenshotPath: `${spec.slug}/screenshot.png`,
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
