@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
set "APP_DIR=%SCRIPT_DIR%.."
set "PORT=5173"
set "DEBUG_PORT=9222"
set "URL=http://localhost:%PORT%/"
set "DEBUG_PROFILE=%APP_DIR%\.vscode\debug-browser-profile"

cd /d "%APP_DIR%"

if exist "%ProgramFiles%\nodejs\npm.cmd" (
  set "PATH=%ProgramFiles%\nodejs;%PATH%"
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm was not found in PATH.
  echo Install Node.js first, then run this file again.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [INFO] Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
  )
)

set "APP_SERVER_RUNNING="
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT%" ^| findstr "LISTENING"') do (
  set "APP_SERVER_RUNNING=1"
)

if defined APP_SERVER_RUNNING (
  echo [INFO] React Legacy Learning Lab is already running at %URL%
) else (
  echo [INFO] Starting React Legacy Learning Lab at %URL%
  start "React Legacy Learning Lab Dev Server" /D "%APP_DIR%" cmd /k "call npm.cmd run dev -- --host 127.0.0.1 --port %PORT% --strictPort"
)

timeout /t 5 /nobreak >nul

set "APP_SERVER_RUNNING="
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT%" ^| findstr "LISTENING"') do (
  set "APP_SERVER_RUNNING=1"
)

if not defined APP_SERVER_RUNNING (
  echo [ERROR] Dev server is not listening on port %PORT%.
  echo [HINT] Check the "React Legacy Learning Lab Dev Server" window for the real Vite error.
  pause
  exit /b 1
)

if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
  set "BROWSER=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
  set "BROWSER=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
) else if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
  set "BROWSER=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
) else if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
  set "BROWSER=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
) else (
  set "BROWSER="
)

if defined BROWSER (
  if not exist "%DEBUG_PROFILE%" mkdir "%DEBUG_PROFILE%"
  powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $version = Invoke-RestMethod 'http://127.0.0.1:%DEBUG_PORT%/json/version' -TimeoutSec 2; Write-Host ('[INFO] Reusing debug browser: ' + $version.Browser); exit 0 } catch { exit 1 }"
  if errorlevel 1 (
    echo [INFO] Opening browser with VSCode attach debug port %DEBUG_PORT%.
    echo [INFO] Browser: %BROWSER%
    start "Observable Flow Debug Browser" "%BROWSER%" --remote-debugging-port=%DEBUG_PORT% --user-data-dir="%DEBUG_PROFILE%" "%URL%"
    timeout /t 2 /nobreak >nul
  ) else (
    echo [INFO] Debug browser already has port %DEBUG_PORT%. Opening/reusing app tab.
    start "" "%BROWSER%" --user-data-dir="%DEBUG_PROFILE%" "%URL%"
    timeout /t 1 /nobreak >nul
  )
  powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $version = Invoke-RestMethod 'http://127.0.0.1:%DEBUG_PORT%/json/version' -TimeoutSec 2; Write-Host ('[INFO] Debug port OK: ' + $version.Browser) } catch { Write-Host '[WARN] Debug port is not responding yet. VSCode attach will fail until port 9222 is available.' }"
) else (
  echo [WARN] Chrome/Edge was not found. Opening with the default browser instead.
  start "" "%URL%"
)

where code >nul 2>nul
if not errorlevel 1 (
  echo [INFO] Opening workspace in VSCode.
  code --reuse-window "%APP_DIR%"
)

echo.
echo [NEXT] In VSCode Run and Debug, select:
echo        Attach Chrome from 0-run-local.bat
echo        or Attach Edge from 0-run-local.bat
echo        then press F5.
echo.
echo [TIP] Toggle a Timeline step, run the flow again, and VSCode will pause at the real source line.

endlocal
