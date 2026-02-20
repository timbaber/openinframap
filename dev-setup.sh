#!/usr/bin/env bash
set -euo pipefail

DEFAULT_PBF_URL="https://download.geofabrik.de/north-america/us/texas-latest.osm.pbf"
PBF_URL="${1:-$DEFAULT_PBF_URL}"
PBF_FILE="$(basename "$PBF_URL")"

echo "==> OpenInfraMap dev setup"
echo "    PBF source: $PBF_URL"
echo ""

# Step 1: Download the PBF extract if not already present
if [ -f "$PBF_FILE" ]; then
    echo "==> PBF file '$PBF_FILE' already exists, skipping download."
else
    echo "==> Downloading $PBF_FILE ..."
    curl -L -o "$PBF_FILE" "$PBF_URL"
fi

# Step 2: Tear down any existing containers and volumes for a clean start
echo "==> Tearing down existing containers and volumes ..."
docker compose down -v

# Step 3: Start the database and wait for it to be healthy
echo "==> Starting database ..."
docker compose up -d db
echo "==> Waiting for database to be healthy ..."
until docker compose exec db pg_isready -h localhost -U postgres > /dev/null 2>&1; do
    sleep 2
done
# Extra wait for init scripts to finish and the real server to start on TCP
sleep 5
echo "==> Database is ready."

# Step 4: Run imposm import
echo "==> Running imposm import (this may take a while) ..."
docker compose run --rm --build \
    -v "$PWD/$PBF_FILE:/data.osm.pbf" \
    imposm import \
    -connection "postgis://osm:osm@db/osm" \
    -mapping /mapping.json \
    -read /data.osm.pbf \
    -write \
    -optimize \
    -deployproduction

# Step 5: Create database views
echo "==> Creating database views ..."
docker compose exec -T db psql -U osm -d osm -f /schema/views.sql

# Step 6: Bring up the full stack
echo "==> Starting all services ..."
docker compose up -d

# Step 7: Create search indexes (for typeahead search; safe to re-run)
echo "==> Creating search indexes ..."
docker compose run --rm -e ADMIN_DATABASE_URL="postgresql://osm:osm@db:5432/osm" web-backend uv run python create_indexes.py

echo ""
echo "==> Done! The stack is running."
echo "    Tegola tile server: http://localhost:8080"
echo "    Web backend:        http://localhost:8081"
