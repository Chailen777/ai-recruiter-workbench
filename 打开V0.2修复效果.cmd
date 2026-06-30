@echo off
cd /d "%~dp0"
start "" powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 6; Start-Process 'http://127.0.0.1:3000/home'"
"C:\Program Files\nodejs\node.exe" "node_modules\next\dist\bin\next" dev -H 127.0.0.1 -p 3000
