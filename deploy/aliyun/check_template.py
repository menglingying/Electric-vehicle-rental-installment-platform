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

# 1. 检查 .env
print("\n[1] .env 中的模板配置:")
stdin, stdout, stderr = ssh.exec_command("cd /opt/evlease && grep -E 'TEMPLATE|template' .env")
print(stdout.read().decode() or "未找到")

# 2. 检查 docker-compose.yml
print("\n[2] docker-compose.yml 中的模板配置:")
stdin, stdout, stderr = ssh.exec_command("cd /opt/evlease && grep -E 'TEMPLATE|template' docker-compose.yml")
print(stdout.read().decode() or "未找到")

# 3. 检查容器环境变量
print("\n[3] 容器中的模板环境变量:")
stdin, stdout, stderr = ssh.exec_command("docker exec evlease-api-1 env 2>/dev/null | grep -E 'TEMPLATE|template'")
print(stdout.read().decode() or "未找到")

# 4. 检查Java代码中如何读取模板
print("\n[4] AsignConfig.java 中的模板配置读取:")
stdin, stdout, stderr = ssh.exec_command("grep -i 'template' /opt/evlease/api/src/main/java/com/evlease/installment/asign/AsignConfig.java | head -10")
print(stdout.read().decode() or "未找到")

ssh.close()

