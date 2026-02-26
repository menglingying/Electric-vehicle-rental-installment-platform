@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo 修复 JAR 挂载问题 - 确保容器使用最新的 JAR
echo ============================================================
echo.
echo 问题: 主机上的 JAR 包含 partyAAddress，但容器内的不包含
echo 解决: 重新挂载 volume 并强制重启容器
echo.
python fix_jar_mount.py
echo.
pause

