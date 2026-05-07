#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
PORT=5173
DEBUG_PORT=9222
URL="http://127.0.0.1:${PORT}/"
DEBUG_PROFILE="$APP_DIR/.vscode/debug-browser-profile"
LOG_FILE="$APP_DIR/.vite-dev.log"
PID_FILE="$APP_DIR/.vite-dev.pid"
LOCAL_NODE_DIR="$APP_DIR/node-v24.15.0-darwin-arm64"

cd "$APP_DIR"

if command -v npm >/dev/null 2>&1; then
  NPM_CMD=(npm)
elif [ -x "$LOCAL_NODE_DIR/bin/npm" ]; then
  export PATH="$LOCAL_NODE_DIR/bin:$PATH"
  NPM_CMD=("$LOCAL_NODE_DIR/bin/npm")
else
  echo "[ERROR] npm was not found in PATH."
  echo "Install Node.js or place a local Node runtime at:"
  echo "  $LOCAL_NODE_DIR"
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "[INFO] Installing dependencies..."
  "${NPM_CMD[@]}" install
fi

if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "[INFO] React Legacy Learning Lab is already running at $URL"
else
  echo "[INFO] Starting React Legacy Learning Lab at $URL"
  nohup "${NPM_CMD[@]}" run dev -- --host 127.0.0.1 --port "$PORT" --strictPort >"$LOG_FILE" 2>&1 &
  echo $! >"$PID_FILE"
fi

for _ in 1 2 3 4 5; do
  if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "[ERROR] Dev server is not listening on port $PORT."
  echo "[HINT] Check $LOG_FILE for the real Vite error."
  exit 1
fi

mkdir -p "$DEBUG_PROFILE"

if curl -fsS "http://127.0.0.1:${DEBUG_PORT}/json/version" >/dev/null 2>&1; then
  echo "[INFO] Debug browser already has port $DEBUG_PORT. Opening/reusing app tab."
elif [ -d "/Applications/Google Chrome.app" ]; then
  echo "[INFO] Opening Google Chrome with VSCode attach debug port $DEBUG_PORT."
  open -a "Google Chrome" --args --remote-debugging-port="$DEBUG_PORT" --user-data-dir="$DEBUG_PROFILE" "$URL"
  sleep 2
elif [ -d "/Applications/Microsoft Edge.app" ]; then
  echo "[INFO] Opening Microsoft Edge with VSCode attach debug port $DEBUG_PORT."
  open -a "Microsoft Edge" --args --remote-debugging-port="$DEBUG_PORT" --user-data-dir="$DEBUG_PROFILE" "$URL"
  sleep 2
else
  echo "[WARN] Chrome/Edge was not found. Opening with the default browser instead."
  open "$URL"
fi

if curl -fsS "http://127.0.0.1:${DEBUG_PORT}/json/version" >/dev/null 2>&1; then
  echo "[INFO] Debug port OK on $DEBUG_PORT."
else
  echo "[WARN] Debug port is not responding yet. VSCode attach will fail until port $DEBUG_PORT is available."
fi

if command -v code >/dev/null 2>&1; then
  echo "[INFO] Opening workspace in VSCode."
  code --reuse-window "$APP_DIR"
fi

echo
echo "[NEXT] In VSCode Run and Debug, select:"
echo "       Attach Chrome local debug"
echo "       or Attach Edge local debug"
echo "       then press F5."
echo
echo "[TIP] Toggle a Timeline step, run the flow again, and VSCode will pause at the real source line."
