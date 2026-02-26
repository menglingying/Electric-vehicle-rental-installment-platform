@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo 最终修复：添加 env_file 配置并强制重建容器
echo ============================================================
echo.
python final_fix.py
echo.
pause

