@echo off
chcp 65001 >nul
cd /d E:\电动车租赁分期平台

echo ============================================================
echo 修复短信Mock配置
echo ============================================================

echo.
echo [1] 检查当前SMS配置
ssh -i "deploy/aliyun/evlease_deploy_key" -o StrictHostKeyChecking=no root@47.120.27.110 "grep -i sms /opt/evlease/.env || echo 'No SMS config'"

echo.
echo [2] 添加 SMS_MOCK=true (如果不存在)
ssh -i "deploy/aliyun/evlease_deploy_key" -o StrictHostKeyChecking=no root@47.120.27.110 "grep -q 'SMS_MOCK' /opt/evlease/.env || echo 'SMS_MOCK=true' >> /opt/evlease/.env"

echo.
echo [3] 验证配置
ssh -i "deploy/aliyun/evlease_deploy_key" -o StrictHostKeyChecking=no root@47.120.27.110 "grep SMS /opt/evlease/.env"

echo.
echo [4] 检查 docker-compose.yml 是否有 SMS_MOCK 映射
ssh -i "deploy/aliyun/evlease_deploy_key" -o StrictHostKeyChecking=no root@47.120.27.110 "grep -A50 'environment:' /opt/evlease/docker-compose.yml | grep -i sms || echo 'No SMS mapping in docker-compose.yml'"

echo.
echo [5] 添加 SMS_MOCK 映射到 docker-compose.yml
ssh -i "deploy/aliyun/evlease_deploy_key" -o StrictHostKeyChecking=no root@47.120.27.110 "cd /opt/evlease && grep -q 'SMS_MOCK' docker-compose.yml || sed -i '/ASIGN_USE_STRANGER/a\      SMS_MOCK: \${SMS_MOCK:-false}' docker-compose.yml"

echo.
echo [6] 重启 Docker 容器
ssh -i "deploy/aliyun/evlease_deploy_key" -o StrictHostKeyChecking=no root@47.120.27.110 "cd /opt/evlease && docker compose down && docker compose up -d"

echo.
echo [7] 等待启动 (20秒)...
timeout /t 20 /nobreak

echo.
echo [8] 检查容器中的 SMS_MOCK 变量
ssh -i "deploy/aliyun/evlease_deploy_key" -o StrictHostKeyChecking=no root@47.120.27.110 "docker exec evlease-api-1 env | grep SMS"

echo.
echo [9] 检查 API 健康状态
ssh -i "deploy/aliyun/evlease_deploy_key" -o StrictHostKeyChecking=no root@47.120.27.110 "curl -s http://localhost:8080/api/health"

echo.
echo ============================================================
echo 完成!
echo ============================================================
pause

