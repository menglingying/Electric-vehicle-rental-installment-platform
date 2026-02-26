@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo 完整重建：上传最新源代码 + 构建JAR + 重启Docker
echo ============================================================
echo.
echo 此脚本将:
echo   1. 打包本地最新的 services/api 源代码
echo   2. 上传到服务器
echo   3. 使用 Maven 构建 JAR
echo   4. 重启 Docker 容器
echo.
echo 注意: 构建过程可能需要 3-5 分钟
echo.
pause
python full_rebuild_v2.py
echo.
pause

