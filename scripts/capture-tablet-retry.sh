#!/usr/bin/env bash
set -euo pipefail
mkdir -p /home/ubuntu/screenshots/globe-validation
/usr/bin/chromium \
  --headless=new \
  --no-sandbox \
  --disable-gpu \
  --disable-dev-shm-usage \
  --hide-scrollbars \
  --window-size=900,1100 \
  --virtual-time-budget=20000 \
  --user-data-dir=/tmp/futnerds-globe-chromium-tablet-retry \
  --screenshot=/home/ubuntu/screenshots/globe-validation/tablet-retry.png \
  https://3000-it31nmb7n7o9q265wxelo-65d8de4f.us2.manus.computer/times >/tmp/futnerds-globe-tablet-retry.log 2>&1
