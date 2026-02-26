@echo off
chcp 65001 >nul
echo ============================================================
echo 修复爱签API环境配置 - 切换到正式环境
echo ============================================================
echo.
echo 问题: 模板在爱签"正式环境"，但API可能在调用"测试环境"
echo 解决: 设置 ASIGN_BASE_URL=https://oapi.asign.cn
echo.
cd /d "%~dp0"
python fix_api_env.py
pause

