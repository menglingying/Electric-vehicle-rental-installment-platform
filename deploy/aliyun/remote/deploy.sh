#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${1:-/opt/evlease}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Please run as root"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker not found. Run: deploy/aliyun/remote/bootstrap-ubuntu22-docker.sh"
  exit 1
fi

cd "$ROOT_DIR"

if [[ ! -f .env ]]; then
  echo "Missing $ROOT_DIR/.env (copy from .env.example and set MYSQL_ROOT_PASSWORD)"
  exit 1
fi

export COMPOSE_PROGRESS=plain
docker compose up -d --remove-orphans --force-recreate
docker compose ps

echo
echo "H5:    http://<server-ip>:8088"
echo "Admin: http://<server-ip>:8089 (default admin/admin123 unless overridden in .env)"
