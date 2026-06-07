#!/usr/bin/env bash

set -euo pipefail

if ! command -v apt-get >/dev/null 2>&1; then
  echo "This setup script currently supports Ubuntu/Debian environments only." >&2
  exit 1
fi

sudo apt-get update
sudo apt-get install -y docker-compose-plugin

# Remove the legacy v1 package when present to avoid accidental usage.
if dpkg -s docker-compose >/dev/null 2>&1; then
  sudo apt-get remove -y docker-compose
fi

echo
docker compose version
