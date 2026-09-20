#!/usr/bin/env bash
# Copy a recorded demo's video + captions out of test-results/ into demos/.
#
# Usage: scripts/collect-demo.sh <name>
#   e.g. scripts/collect-demo.sh guest-checkout-br
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: scripts/collect-demo.sh <name>" >&2
  exit 1
fi

name="$1"
src=$(ls -dt test-results/*"$name"*demo 2>/dev/null | head -1)

if [ -z "$src" ]; then
  echo "No test-results/ output found for '$name'. Run its demo:* script first." >&2
  exit 1
fi

mkdir -p demos
cp "$src/video.webm" "demos/$name.webm"
cp "$src/captions.vtt" "demos/$name.vtt"
echo "Collected demos/$name.webm + demos/$name.vtt"
