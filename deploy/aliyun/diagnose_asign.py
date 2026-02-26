#!/usr/bin/env python3
"""诊断爱签配置"""
import paramiko
import os

SERVER = "47.120.27.110"
USER = "root"
KEY_FILE = os.path.join(os.path.dirname(__file__), "evlease_deploy_key")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(SERVER, username=USER, key_filename=KEY_FILE)

print("="*60)
print("诊断爱签配置")
print("="*60)

# 1. .env 文件中的爱签配置
print("\n[1] .env 文件中的爱签配置:")
stdin, stdout, stderr = ssh.exec_command("cd /opt/evlease && grep ASIGN .env")
print(stdout.read().decode() or "无")

# 2. 容器中的爱签环境变量
print("\n[2] 容器中的爱签环境变量:")
stdin, stdout, stderr = ssh.exec_command("docker exec evlease-api-1 env 2>/dev/null | grep ASIGN | sort")
print(stdout.read().decode() or "无")

# 3. 检查 SPRING_PROFILES_ACTIVE
print("\n[3] 容器中的 SPRING_PROFILES_ACTIVE:")
stdin, stdout, stderr = ssh.exec_command("docker exec evlease-api-1 printenv SPRING_PROFILES_ACTIVE 2>/dev/null")
print(stdout.read().decode() or "未设置")

# 4. 检查日志中的爱签 API 调用
print("\n[4] 最近的爱签 API 调用日志:")
stdin, stdout, stderr = ssh.exec_command("cd /opt/evlease && docker compose logs --tail=50 api 2>&1 | grep -i 'asign\\|template\\|100066' | tail -10")
print(stdout.read().decode() or "无")

ssh.close()
print("\n" + "="*60)

