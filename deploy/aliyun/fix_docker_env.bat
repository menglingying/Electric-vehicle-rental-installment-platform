@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 修复Docker环境变量问题
echo.
python fix_docker_env.py
echo.
pause

