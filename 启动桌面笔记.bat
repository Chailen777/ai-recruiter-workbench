@echo off
chcp 65001 >nul
title 卡片笔记库

set "CHROME=C:\Program Files\Google\Chrome\Application\chrome.exe"
set "URL=http://127.0.0.1:3000/desk-note.html"

if not exist "%CHROME%" (
    echo Chrome 未找到: %CHROME%
    pause
    exit /b 1
)

echo 正在启动卡片笔记库...
start "" "%CHROME%" ^
  --app="%URL%" ^
  --window-size=420,720 ^
  --window-position=right,80 ^
  --disable-extensions ^
  --no-first-run ^
  --no-default-browser-check

echo 已启动! 窗口应出现在屏幕右侧。
timeout /t 3 >nul
