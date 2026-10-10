#!/bin/sh
set -e
# Where the SQLite DB lives (must match the app). Litestream config reads this too.
export DB_PATH="${DB_PATH:-/data/paymint.db}"
mkdir -p "$(dirname "$DB_PATH")"

# If this container has no DB yet (fresh/restarted host), restore the latest backup.
if [ ! -f "$DB_PATH" ]; then
  echo "No local DB found — restoring latest backup from cloud (if any)…"
  litestream restore -if-replica-exists "$DB_PATH" || echo "No backup yet — starting fresh."
fi

# Run the app under Litestream so every change is continuously backed up.
exec litestream replicate -exec "node --experimental-sqlite index.js"
