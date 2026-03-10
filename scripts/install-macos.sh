#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST_DIR="${HOME}/.openclaw/extensions/superpowers"
TS="$(date +%Y%m%d-%H%M%S)"

echo "[install] source: ${ROOT_DIR}"
echo "[install] dest:   ${DEST_DIR}"

mkdir -p "${HOME}/.openclaw/extensions"

if [[ -d "${DEST_DIR}" ]]; then
  BACKUP_DIR="${DEST_DIR}.bak.${TS}"
  echo "[install] backing up existing dest to: ${BACKUP_DIR}"
  mv "${DEST_DIR}" "${BACKUP_DIR}"
fi

mkdir -p "${DEST_DIR}"
rsync -a --delete --exclude ".git" --exclude ".DS_Store" "${ROOT_DIR}/" "${DEST_DIR}/"

echo "[install] enabling plugin"
openclaw plugins enable superpowers

echo "[install] validating config"
openclaw config validate

echo "[install] done"

