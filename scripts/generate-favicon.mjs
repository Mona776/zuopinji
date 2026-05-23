#!/usr/bin/env node
/**
 * Regenerate favicons from source PNG (cream background → transparent).
 * Usage: node scripts/generate-favicon.mjs [path-to-source.png]
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultSrc = join(
  __dirname,
  "..",
  "stitch/Vibe Coding Lab/assets/icon-source.png"
);
const src = process.argv[2] || defaultSrc;
const outDir = join(__dirname, "..", "stitch/Vibe Coding Lab/assets");

const py = `
from PIL import Image
import os
src = ${JSON.stringify(src)}
out_dir = ${JSON.stringify(outDir)}
os.makedirs(out_dir, exist_ok=True)
img = Image.open(src).convert("RGBA")
pixels = img.load()
w, h = img.size
corners = [(0,0),(w-1,0),(0,h-1),(w-1,h-1)]
bg = [sum(pixels[x,y][i] for x,y in corners)//4 for i in range(3)]
def dist(rgb):
    return sum((rgb[i]-bg[i])**2 for i in range(3))**0.5
for y in range(h):
    for x in range(w):
        r,g,b,a = pixels[x,y]
        if dist((r,g,b)) < 45:
            pixels[x,y] = (r,g,b,0)
bbox = img.getbbox()
if bbox:
    img = img.crop(bbox)
max_side = max(img.size)
canvas = Image.new("RGBA", (max_side, max_side), (0,0,0,0))
canvas.paste(img, ((max_side-img.width)//2, (max_side-img.height)//2), img)
for name, size in [("favicon-512.png",512),("favicon-192.png",192),("apple-touch-icon.png",180),("favicon-32.png",32),("favicon-16.png",16)]:
    canvas.resize((size,size), Image.Resampling.LANCZOS).save(os.path.join(out_dir, name))
canvas.resize((256,256), Image.Resampling.LANCZOS).save(os.path.join(out_dir, "icon.png"))
ico = canvas.resize((32,32), Image.Resampling.LANCZOS)
ico.save(os.path.join(out_dir, "favicon.ico"), format="ICO", sizes=[(16,16),(32,32),(48,48)])
print("ok", out_dir)
`;

const r = spawnSync("python3", ["-c", py], { encoding: "utf8" });
if (r.status !== 0) {
  console.error(r.stderr || r.stdout);
  process.exit(1);
}
console.log(r.stdout);
