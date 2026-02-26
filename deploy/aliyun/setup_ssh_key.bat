@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo ========================================
echo SSH 密钥免密登录配置
echo ========================================
echo.
python setup_ssh_key.py %*
echo.
pause

