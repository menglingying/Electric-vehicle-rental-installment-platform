#!/usr/bin/env python3
"""检查服务器短信配置"""

import subprocess

SSH_KEY = "deploy/aliyun/evlease_deploy_key"
SERVER = "root@47.120.27.110"

def run_ssh(cmd):
    full_cmd = f'ssh -i "{SSH_KEY}" -o StrictHostKeyChecking=no -o ConnectTimeout=10 {SERVER} "{cmd}"'
    result = subprocess.run(full_cmd, shell=True, capture_output=True, text=True, timeout=30)
    print(result.stdout)
    if result.stderr:
        print(f"[STDERR] {result.stderr}")
    return result.stdout

print("=" * 60)
print("检查短信配置")
print("=" * 60)

print("\n[1] .env 中的 SMS 相关配置:")
run_ssh("grep -i sms /opt/evlease/.env || echo '无SMS配置'")

print("\n[2] 检查 API 日志中的验证码相关:")
run_ssh("docker logs --tail 50 evlease-api-1 2>&1 | grep -i -E 'sms|code|验证码|mock' || echo '无相关日志'")

print("\n[3] 检查容器中的 SMS 环境变量:")
run_ssh("docker exec evlease-api-1 env | grep -i sms || echo '无SMS环境变量'")

print("\n[4] 修复：添加 SMS_MOCK=true 到 .env")
run_ssh("grep -q 'SMS_MOCK' /opt/evlease/.env && echo '已存在SMS_MOCK配置' || echo 'SMS_MOCK=true' >> /opt/evlease/.env")

print("\n[5] 验证配置:")
run_ssh("grep SMS /opt/evlease/.env")

print("\n[6] 重启 API 容器:")
run_ssh("cd /opt/evlease && docker compose restart api")

print("\n[7] 等待启动...")
import time
time.sleep(15)

print("\n[8] 检查 API 状态:")
run_ssh("curl -s http://localhost:8080/api/health || echo 'API不可访问'")

print("\n" + "=" * 60)
print("完成!")
print("=" * 60)

