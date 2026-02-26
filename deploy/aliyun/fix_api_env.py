#!/usr/bin/env python3
"""修复爱签API环境配置 - 切换到正式环境"""
import paramiko
import os

SERVER = "47.120.27.110"
USER = "root"
KEY_FILE = os.path.join(os.path.dirname(__file__), "evlease_deploy_key")

def run(ssh, cmd):
    print(f">>> {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=120)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out: print(out)
    if err: print(f"STDERR: {err}")
    return out

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(SERVER, username=USER, key_filename=KEY_FILE)

print("="*60)
print("修复爱签API环境配置")
print("="*60)

# 1. 检查当前配置
print("\n[1/4] 当前 .env 中的 ASIGN_BASE_URL:")
run(ssh, "cd /opt/evlease && grep ASIGN_BASE_URL .env || echo '未配置'")

# 2. 检查容器中的环境变量
print("\n[2/4] 容器中的 ASIGN_BASE_URL:")
run(ssh, "docker exec evlease-api-1 printenv ASIGN_BASE_URL 2>/dev/null || echo '未配置'")

# 3. 设置正式环境 API 地址
print("\n[3/4] 设置正式环境 API 地址...")
# 删除旧配置
run(ssh, "cd /opt/evlease && sed -i '/ASIGN_BASE_URL/d' .env")
# 添加正式环境地址
run(ssh, "cd /opt/evlease && echo 'ASIGN_BASE_URL=https://oapi.asign.cn' >> .env")

# 验证
print("\n验证 .env 配置:")
run(ssh, "cd /opt/evlease && grep -E 'ASIGN_BASE_URL|ASIGN_TEMPLATE_NO' .env")

# 4. 重启 Docker
print("\n[4/4] 重启 Docker 容器...")
run(ssh, "cd /opt/evlease && docker compose down")
run(ssh, "cd /opt/evlease && docker compose up -d")

import time
print("\n等待服务启动...")
time.sleep(10)

# 验证容器环境变量
print("\n验证容器中的配置:")
run(ssh, "docker exec evlease-api-1 printenv | grep -E 'ASIGN_BASE_URL|ASIGN_TEMPLATE_NO'")

# 健康检查
out = run(ssh, "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/actuator/health")
if "200" in out:
    print("\n✅ API健康检查通过!")
else:
    print(f"\n⚠ API健康检查返回: {out}")

ssh.close()
print("\n" + "="*60)
print("✅ 已切换到爱签正式环境!")
print("   API地址: https://oapi.asign.cn")
print("="*60)

