@echo off
chcp 65001 >nul
cd /d E:\电动车租赁分期平台

echo ============================================================
echo 电动车租赁分期平台 - 服务器环境排查
echo ============================================================

echo.
echo [1] 检查 .env 配置文件
echo ============================================================
ssh -i "deploy/aliyun/evlease_deploy_key" -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@47.120.27.110 "cat /opt/evlease/.env"

echo.
echo [2] 检查 Docker 容器状态
echo ============================================================
ssh -i "deploy/aliyun/evlease_deploy_key" -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@47.120.27.110 "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"

echo.
echo [3] 检查容器内爱签环境变量
echo ============================================================
ssh -i "deploy/aliyun/evlease_deploy_key" -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@47.120.27.110 "docker exec evlease-api env | grep -i asign || echo 'No ASIGN env found'"

echo.
echo [4] 检查 API 健康状态
echo ============================================================
ssh -i "deploy/aliyun/evlease_deploy_key" -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@47.120.27.110 "curl -s http://localhost:8080/api/health"

echo.
echo [5] 检查 API 最近日志(爱签相关)
echo ============================================================
ssh -i "deploy/aliyun/evlease_deploy_key" -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@47.120.27.110 "docker logs --tail 50 evlease-api 2>&1 | grep -i -E 'asign|template|100066' || echo 'No asign related logs'"

echo.
echo ============================================================
echo 排查完成
echo ============================================================

