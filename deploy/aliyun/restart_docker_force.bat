@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 强制重启Docker容器
echo.
python restart_docker_force.py
echo.
pause

