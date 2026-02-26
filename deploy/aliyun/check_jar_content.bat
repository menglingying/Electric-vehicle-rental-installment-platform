@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 检查JAR文件内容
echo.
python check_jar_content.py
echo.
pause

