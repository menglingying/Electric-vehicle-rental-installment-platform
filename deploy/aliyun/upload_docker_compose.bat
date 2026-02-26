@echo off
chcp 65001 > nul
echo ========================================
echo Upload Latest docker-compose.yml
echo ========================================
echo.
cd /d %~dp0
python upload_docker_compose.py
echo.
pause

