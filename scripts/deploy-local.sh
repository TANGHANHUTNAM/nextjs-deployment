#!/usr/bin/env bash

set -euo pipefail

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  compose_cmd=(docker compose)
  compose_mode='v2'
elif command -v docker-compose >/dev/null 2>&1; then
  compose_cmd=(docker-compose)
  compose_mode='v1'
else
  echo "Neither 'docker compose' nor 'docker-compose' is available." >&2
  exit 1
fi

git fetch origin main
git reset --hard origin/main

if [ "$compose_mode" = 'v1' ]; then
  echo "Warning: using legacy docker-compose v1. Upgrade with bash scripts/setup-docker-compose-v2.sh" >&2
  # docker-compose 1.29.x can crash while recreating an existing container
  # against newer Docker image metadata, so remove the app container first.
  "${compose_cmd[@]}" down --remove-orphans >/dev/null 2>&1 || true
  "${compose_cmd[@]}" rm -fsv app >/dev/null 2>&1 || true
  docker rm -f nextjs_prod >/dev/null 2>&1 || true
  "${compose_cmd[@]}" up -d --build --force-recreate --remove-orphans
else
  "${compose_cmd[@]}" up -d --build --remove-orphans
fi
