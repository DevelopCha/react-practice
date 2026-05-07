@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
set "APP_DIR=%SCRIPT_DIR%..\.."
set "PORT=5173"
set "DEBUG_PORT=9222"

echo [INFO] Searching for processes using port %PORT%...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT%" ^| findstr "LISTENING"') do (
  echo [INFO] Killing PID %%a
  taskkill /PID %%a /F
)

echo [INFO] Searching for debug browser on port %DEBUG_PORT%...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%DEBUG_PORT%" ^| findstr "LISTENING"') do (
  echo [INFO] Killing debug browser PID %%a
  taskkill /PID %%a /F
)

echo [INFO] Searching for debug browser profile processes...

powershell -NoProfile -ExecutionPolicy Bypass -Command "$profilePath = (Resolve-Path '%APP_DIR%\.vscode\debug-browser-profile' -ErrorAction SilentlyContinue).Path; if ($profilePath) { Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -and $_.CommandLine.Contains($profilePath) } | ForEach-Object { Write-Host ('[INFO] Killing debug profile PID ' + $_.ProcessId); Stop-Process -Id $_.ProcessId -Force } }"

echo [INFO] Done.
pause

endlocal
