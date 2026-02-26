#!/usr/bin/env python3
"""检查爱签API日志"""
import paramiko
import os

SERVER = "47.120.27.110"
USER = "root"
KEY_FILE = os.path.join(os.path.dirname(__file__), "evlease_deploy_key")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(SERVER, username=USER, key_filename=KEY_FILE)

print("="*60)
print("检查爱签API日志")
print("="*60)

# 检查最近的API日志
cmd = "cd /opt/evlease && docker compose logs --tail=50 api 2>&1"
stdin, stdout, stderr = ssh.exec_command(cmd)
logs = stdout.read().decode()

# 过滤包含 asign 或 error 的行
for line in logs.split('\n'):
    lower = line.lower()
    if 'asign' in lower or 'error' in lower or 'exception' in lower or 'contract' in lower:
        print(line)

ssh.close()

