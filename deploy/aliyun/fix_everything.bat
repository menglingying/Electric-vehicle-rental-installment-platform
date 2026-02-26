@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo      一次性修复所有问题 - 完整部署流程
echo ============================================================
echo.
echo 此脚本将执行以下操作:
echo   1. 打包并上传最新的本地源代码
echo   2. 上传最新的 docker-compose.yml
echo   3. 更新服务器 .env 文件
echo   4. 重新构建 JAR (需要 2-5 分钟)
echo   5. 重启 Docker 容器
echo   6. 验证部署结果
echo.
echo 公司地址默认设置为: 四川省成都市成华区
echo 如需修改，请编辑 fix_everything.py 中的 COMPANY_ADDRESS
echo.
pause
python fix_everything.py
echo.
pause

