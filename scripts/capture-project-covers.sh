#!/bin/bash
# Wait for network + WebGL/media before screenshot (see capture-project-covers.mjs)
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ ! -d node_modules/puppeteer ]]; then
  echo "Installing puppeteer (one-time)..."
  npm install puppeteer --no-save
fi
node scripts/capture-project-covers.mjs "$@"
