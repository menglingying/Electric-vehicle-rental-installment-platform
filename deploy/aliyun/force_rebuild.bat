@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 强制重建Docker容器以加载新环境变量
echo.
python force_rebuild.py
echo.
pause

