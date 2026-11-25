#!/usr/bin/env bash
# Build the selected commit without including untracked files on the server.
# Run from the deployment repository so Compose keeps its project, env and tags.
set -euo pipefail

build_source=$(mktemp -d)
trap 'rm -rf -- "$build_source"' EXIT
git archive HEAD | tar -x -C "$build_source"

# Only build contexts change. Compose still reads its normal .env and build args.
cat > "$build_source/contexts.json" <<EOF
{"services":{
  "web":{"build":{"context":"$build_source/apps/web"}},
  "admin":{"build":{"context":"$build_source/apps/admin"}},
  "api":{"build":{"context":"$build_source/apps/api"}},
  "worker":{"build":{"context":"$build_source/apps/api"}}
}}
EOF
docker compose -f docker-compose.yml -f "$build_source/contexts.json" build
