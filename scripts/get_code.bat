@echo off
chcp 65001 >nul
cd /d E:\电动车租赁分期平台

echo ============================================================
echo 获取最近的验证码日志
echo ============================================================

ssh -i "deploy/aliyun/evlease_deploy_key" -o StrictHostKeyChecking=no root@47.120.27.110 "docker logs --tail 100 evlease-api-1 2>&1 | grep -i -E 'MOCK SMS|验证码' | tail -10"

pause

