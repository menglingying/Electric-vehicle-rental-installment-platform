@echo off
chcp 65001 > nul
echo ========================================
echo 在服务器上构建并部署后端
echo ========================================
echo.
echo 这个脚本会：
echo 1. 在服务器上安装 Java 17（如果没有）
echo 2. 上传后端源代码到服务器
echo 3. 在服务器上用 Maven 构建 JAR
echo 4. 部署新的 JAR 并重启 API
echo.
echo 预计耗时：3-5 分钟
echo.
pause

python "%~dp0server_build_deploy.py"

echo.
pause

