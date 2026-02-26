@echo off
chcp 65001 > nul
echo ========================================
echo Upload Latest Source and Build
echo ========================================
echo This will:
echo   1. Create source archive from local
echo   2. Upload to server
echo   3. Build new JAR
echo   4. Deploy to Docker
echo ========================================
echo.
cd /d %~dp0
python upload_source_and_build.py
echo.
pause

