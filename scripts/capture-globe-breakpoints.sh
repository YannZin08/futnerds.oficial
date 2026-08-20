#!/usr/bin/env bash
set -euo pipefail

URL="https://3000-it31nmb7n7o9q265wxelo-65d8de4f.us2.manus.computer/times"
OUT="/home/ubuntu/screenshots/globe-validation"
PROFILE="/tmp/futnerds-globe-chromium"
mkdir -p "$OUT" "$PROFILE"

for spec in "desktop:1440,900" "tablet:900,1100" "mobile:390,844"; do
  name="${spec%%:*}"
  size="${spec##*:}"
  /usr/bin/chromium \
    --headless=new \
    --no-sandbox \
    --disable-gpu \
    --disable-dev-shm-usage \
    --hide-scrollbars \
    --window-size="$size" \
    --virtual-time-budget=8000 \
    --user-data-dir="$PROFILE-$name" \
    --screenshot="$OUT/$name.png" \
    "$URL" >/tmp/futnerds-globe-$name.log 2>&1
  echo "$name=$OUT/$name.png"
done
