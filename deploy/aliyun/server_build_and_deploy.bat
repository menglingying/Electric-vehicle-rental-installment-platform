@echo off
chcp 65001 > nul
echo ========================================
echo Server Build and Deploy Script
echo ========================================
echo.
cd /d %~dp0
python server_build_and_deploy.py
echo.
pause

