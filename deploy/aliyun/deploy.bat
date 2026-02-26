@echo off
chcp 65001 > nul
cd /d "%~dp0\..\..\"
echo ========================================
echo 电动车租赁分期平台 - 一键部署
echo ========================================
echo.
echo 项目目录: %cd%
echo.
python deploy\aliyun\deploy.py --ssh-key-file "deploy\aliyun\evlease_deploy_key"
echo.
pause

