@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo 部署修复并启用固定验证码 (123456)
echo ============================================================
echo.
echo 此脚本将:
echo   1. 在服务器 .env 中添加 APP_AUTH_FIXED_CODE_ENABLED=true
echo   2. 上传并构建最新代码
echo   3. 重启 Docker 容器
echo.
echo 部署完成后，可以使用任意手机号 + 验证码 123456 登录 H5
echo.
pause
python deploy_with_fixed_code.py
echo.
pause

