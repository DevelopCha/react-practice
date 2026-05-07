#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
PORT=5173
DEBUG_PORT=9222
PID_FILE="$APP_DIR/.vite-dev.pid"
DEBUG_PROFILE="$APP_DIR/.vscode/debug-browser-profile"

echo "[INFO] Searching for processes using port $PORT..."

if lsof -tiTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  lsof -tiTCP:"$PORT" -sTCP:LISTEN | while read -r pid; do
    echo "[INFO] Killing PID $pid"
    kill -9 "$pid"
  done
fi

echo "[INFO] Searching for debug browser on port $DEBUG_PORT..."

if lsof -tiTCP:"$DEBUG_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  lsof -tiTCP:"$DEBUG_PORT" -sTCP:LISTEN | while read -r pid; do
    echo "[INFO] Killing debug browser PID $pid"
    kill -9 "$pid"
  done
fi

if [ -f "$PID_FILE" ]; then
  pid="$(cat "$PID_FILE")"
  if kill -0 "$pid" >/dev/null 2>&1; then
    echo "[INFO] Killing saved dev server PID $pid"
    kill -9 "$pid"
  fi
  rm -f "$PID_FILE"
fi

echo "[INFO] Searching for debug browser profile processes..."

pkill -f "$DEBUG_PROFILE" >/dev/null 2>&1 || true

echo "[INFO] Done."
