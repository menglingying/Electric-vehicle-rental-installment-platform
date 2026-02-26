#!/usr/bin/env python3
"""验证模板编号配置"""
import paramiko
import os

SERVER = "47.120.27.110"
USER = "root"
KEY_FILE = os.path.join(os.path.dirname(__file__), "evlease_deploy_key")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(SERVER, username=USER, key_filename=KEY_FILE)

print("="*60)
print("验证爱签模板配置")
print("="*60)

# 1. .env 文件
print("\n[1] .env 文件中的 ASIGN_TEMPLATE_NO:")
stdin, stdout, stderr = ssh.exec_command("cd /opt/evlease && grep ASIGN_TEMPLATE_NO .env")
env_result = stdout.read().decode().strip()
print(f"    {env_result}" if env_result else "    未配置!")

# 2. 容器环境变量
print("\n[2] 容器中的 ASIGN_TEMPLATE_NO:")
stdin, stdout, stderr = ssh.exec_command("docker exec evlease-api-1 printenv ASIGN_TEMPLATE_NO 2>/dev/null")
container_result = stdout.read().decode().strip()
print(f"    {container_result}" if container_result else "    未配置!")

# 3. 检查配置是否一致
if env_result and container_result:
    env_value = env_result.split("=")[1] if "=" in env_result else ""
    if env_value == container_result:
        print("\n✅ 配置一致!")
    else:
        print(f"\n⚠ 配置不一致!")
        print(f"    .env: {env_value}")
        print(f"    容器: {container_result}")
elif not container_result:
    print("\n⚠ 容器未获取到 ASIGN_TEMPLATE_NO，需要重启 Docker!")
    print("\n正在重启 Docker 容器...")
    ssh.exec_command("cd /opt/evlease && docker compose down && docker compose up -d")
    import time
    time.sleep(10)
    stdin, stdout, stderr = ssh.exec_command("docker exec evlease-api-1 printenv ASIGN_TEMPLATE_NO 2>/dev/null")
    new_result = stdout.read().decode().strip()
    print(f"重启后容器中的 ASIGN_TEMPLATE_NO: {new_result}")

ssh.close()
print("\n" + "="*60)

