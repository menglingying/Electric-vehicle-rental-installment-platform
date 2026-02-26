@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo 修复 JAR 路径问题
echo ============================================================
echo.
echo 问题: docker-compose 挂载的是 ./artifacts/installment-api.jar
echo       但新JAR被放在了 /opt/evlease/api.jar
echo.
echo 解决: 复制JAR到正确的 artifacts 目录
echo.
python fix_jar_path.py
echo.
pause

