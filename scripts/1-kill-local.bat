@echo off
setlocal

set "PORT=5173"

echo [INFO] Searching for processes using port %PORT%...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT%" ^| findstr "LISTENING"') do (
  echo [INFO] Killing PID %%a
  taskkill /PID %%a /F
)

echo [INFO] Done.
pause

endlocal
