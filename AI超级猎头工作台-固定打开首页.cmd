@echo off
cd /d "%~dp0"
echo Starting AI Headhunter Workbench V0.2...
start "AI Headhunter Workbench Server" /D "%~dp0" cmd /k "call node_modules\.bin\next.cmd dev -H 127.0.0.1 -p 3000"
ping 127.0.0.1 -n 9 > nul
start "" "http://127.0.0.1:3000/home"
