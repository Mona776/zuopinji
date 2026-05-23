#!/usr/bin/env bash
# Download Stitch screens via MCP get_screen + curl -L
# Usage: STITCH_API_KEY=your_key ./scripts/download-stitch-screens.sh

set -euo pipefail

PROJECT_ID="131747744848736302"
OUT_BASE="$(cd "$(dirname "$0")/.." && pwd)/stitch/Vibe Coding Lab"
MCP_URL="https://stitch.googleapis.com/mcp"

if [[ -z "${STITCH_API_KEY:-}" ]]; then
  echo "Error: set STITCH_API_KEY (from https://stitch.withgoogle.com/settings)" >&2
  exit 1
fi

mkdir -p "$OUT_BASE"

get_screen_json() {
  local screen_id="$1"
  curl -s -X POST "$MCP_URL" \
    -H "Content-Type: application/json" \
    -H "X-Goog-Api-Key: $STITCH_API_KEY" \
    -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"get_screen\",\"arguments\":{\"projectId\":\"$PROJECT_ID\",\"screenId\":\"$screen_id\",\"name\":\"projects/$PROJECT_ID/screens/$screen_id\"}}}"
}

download_screen() {
  local slug="$1"
  local screen_id="$2"
  local title="$3"

  echo "→ $title"
  local resp
  resp="$(get_screen_json "$screen_id")"

  local parsed
  parsed="$(python3 - "$resp" <<'PY'
import json, sys
raw = json.loads(sys.argv[1])
if raw.get("result", {}).get("isError"):
    text = raw["result"]["content"][0].get("text", raw)
    print(json.dumps({"error": text}))
    sys.exit(0)
data = raw.get("result", {}).get("structuredContent")
if not data:
    for c in raw.get("result", {}).get("content", []):
        if c.get("type") == "text":
            try:
                data = json.loads(c["text"])
                break
            except json.JSONDecodeError:
                pass
if not data:
    print(json.dumps({"error": "no structuredContent"}))
    sys.exit(0)
html = (data.get("htmlCode") or {}).get("downloadUrl", "")
img = (data.get("screenshot") or {}).get("downloadUrl", "")
width = data.get("width", "")
print(json.dumps({"html": html, "img": img, "width": width}))
PY
)"

  if echo "$parsed" | python3 -c "import json,sys; d=json.load(sys.stdin); sys.exit(0 if d.get('html') and d.get('img') else 1)" 2>/dev/null; then
    :
  else
    echo "Failed: $parsed" >&2
    echo "$resp" >&2
    exit 1
  fi

  local html_url img_url width
  html_url="$(echo "$parsed" | python3 -c "import json,sys; print(json.load(sys.stdin)['html'])")"
  img_url="$(echo "$parsed" | python3 -c "import json,sys; print(json.load(sys.stdin)['img'])")"
  width="$(echo "$parsed" | python3 -c "import json,sys; print(json.load(sys.stdin).get('width',''))")"

  if [[ -n "$width" && "$width" != "null" ]]; then
    if [[ "$img_url" == *"?"* ]]; then
      img_url="${img_url}&=w${width}"
    else
      img_url="${img_url}?=w${width}"
    fi
  fi

  local screen_dir="$OUT_BASE/$slug"
  mkdir -p "$screen_dir"
  curl -fsSL "$html_url" -o "$screen_dir/index.html"
  curl -fsSL "$img_url" -o "$screen_dir/screenshot.png"
  echo "  ✓ $screen_dir/index.html"
  echo "  ✓ $screen_dir/screenshot.png"
}

download_screen "gallery" "bbe8c370f8f6462e84536850a5810f41" "作品列表 - Gallery"
download_screen "home" "1bf8cc9159db4c1bbaa62966df85cd98" "首页 - Vibecoding Portfolio"
download_screen "project-detail" "43cb3a400e404dcea45d98339cf58602" "项目详情 - Interactive Tool"
download_screen "profile" "d1f46885b70d4e87ad0bae029b11dd62" "关于我 - Profile"

echo ""
echo "Done. Files saved under: $OUT_BASE"
