@echo off
chcp 65001 > nul
echo ========================================
echo Restart Docker with New Config
echo ========================================
echo.
cd /d %~dp0
python restart_docker.py
echo.
pause

