#!/usr/bin/env python3
"""检查模板配置"""
import paramiko
import os

SERVER = "47.120.27.110"
USER = "root"
KEY_FILE = os.path.join(os.path.dirname(__file__), "evlease_deploy_key")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(SERVER, username=USER, key_filename=KEY_FILE)

print("="*60)
print("检查爱签模板配置")
print("="*60)

# 检查 .env 中的模板配置
print("\n[1] .env 中的模板配置:")
stdin, stdout, stderr = ssh.exec_command("cd /opt/evlease && grep -i template .env || echo '未配置'")
print(stdout.read().decode())

# 检查容器中的环境变量
print("\n[2] 容器中的模板环境变量:")
stdin, stdout, stderr = ssh.exec_command("docker exec evlease-api-1 env 2>/dev/null | grep -i template || echo '未配置'")
print(stdout.read().decode())

# 检查最近的日志
print("\n[3] 最近的API日志 (过滤合同相关):")
stdin, stdout, stderr = ssh.exec_command("cd /opt/evlease && docker compose logs --tail=30 api 2>&1 | grep -E '(contract|asign|template|error)' -i | tail -20")
print(stdout.read().decode())

ssh.close()
print("="*60)

