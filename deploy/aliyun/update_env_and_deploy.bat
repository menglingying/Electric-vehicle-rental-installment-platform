@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo ========================================
echo 更新爱签企业配置并重新部署
echo ========================================
echo.
python update_env_and_deploy.py --ssh-key-file "evlease_deploy_key"
echo.
pause

