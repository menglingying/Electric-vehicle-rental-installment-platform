@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo 完整修复：重新构建JAR并部署
echo ============================================================
echo.
echo 此脚本将:
echo   1. 打包并上传最新的本地源代码
echo   2. 在服务器上重新构建 JAR
echo   3. 验证 JAR 包含 partyAAddress
echo   4. 复制到正确的 artifacts 目录
echo   5. 重启 Docker
echo.
echo 预计耗时: 3-5 分钟
echo.
pause
python rebuild_and_fix.py
echo.
pause

