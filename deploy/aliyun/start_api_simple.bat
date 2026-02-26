@echo off
chcp 65001 >nul
cd /d "%~dp0"
python start_api_simple.py
echo.
echo Please wait 30-60 seconds, then test in browser.
pause

