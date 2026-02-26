# -*- coding: utf-8 -*-
"""快速检查服务器配置"""
import paramiko

SSH_HOST = "47.120.27.110"
SSH_USER = "root"
SSH_KEY_FILE = "evlease_deploy_key"

def load_ssh_key(key_file):
    key_classes = [paramiko.Ed25519Key, paramiko.ECDSAKey, paramiko.RSAKey, paramiko.DSSKey]
    for key_class in key_classes:
        try:
            return key_class.from_private_key_file(key_file)
        except:
            continue
    raise Exception(f"无法加载密钥文件: {key_file}")

def main():
    print("=" * 60)
    print("检查服务器配置")
    print("=" * 60)
    
    key = load_ssh_key(SSH_KEY_FILE)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SSH_HOST, username=SSH_USER, pkey=key, timeout=30)
        print("连接成功!\n")
        
        # 检查 .env 中的 ASIGN_COMPANY_ADDRESS
        print("[1] 检查 .env 配置...")
        stdin, stdout, stderr = client.exec_command("grep 'ASIGN_COMPANY_ADDRESS' /opt/evlease/.env")
        result = stdout.read().decode().strip()
        print(f"   .env: {result if result else '未配置!'}")
        
        # 检查容器环境变量
        print("\n[2] 检查Docker容器环境变量...")
        stdin, stdout, stderr = client.exec_command(
            "docker exec evlease-api env 2>/dev/null | grep -E 'ASIGN_COMPANY_(ADDRESS|NAME)' || echo '获取失败'"
        )
        print(f"   容器: {stdout.read().decode().strip()}")
        
        # 检查源码中是否有 partyAAddress
        print("\n[3] 检查源码是否包含 partyAAddress...")
        stdin, stdout, stderr = client.exec_command(
            "grep -n 'partyAAddress' /opt/evlease/api-source/src/main/java/com/evlease/installment/asign/AsignService.java 2>/dev/null | head -3"
        )
        result = stdout.read().decode().strip()
        print(f"   源码: {result if result else '未找到 - 源码未更新!'}")
        
        # 检查JAR时间戳
        print("\n[4] 检查JAR文件时间戳...")
        stdin, stdout, stderr = client.exec_command("ls -la /opt/evlease/api.jar 2>/dev/null | awk '{print $6,$7,$8,$9}'")
        print(f"   JAR: {stdout.read().decode().strip()}")
        
        # 检查 docker-compose.yml 是否包含 ASIGN_COMPANY_ADDRESS
        print("\n[5] 检查 docker-compose.yml...")
        stdin, stdout, stderr = client.exec_command(
            "grep 'ASIGN_COMPANY_ADDRESS' /opt/evlease/docker-compose.yml || echo '未配置'"
        )
        print(f"   compose: {stdout.read().decode().strip()}")
        
        print("\n" + "=" * 60)
        
    except Exception as e:
        print(f"错误: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    main()

