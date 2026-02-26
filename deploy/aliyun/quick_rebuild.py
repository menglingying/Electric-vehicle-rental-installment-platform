# -*- coding: utf-8 -*-
"""快速重建JAR并部署"""
import paramiko
import tarfile
import os
import io
import time

SSH_HOST = "47.120.27.110"
SSH_USER = "root"
SSH_KEY_FILE = "evlease_deploy_key"

def load_ssh_key(key_file):
    for kc in [paramiko.Ed25519Key, paramiko.ECDSAKey, paramiko.RSAKey, paramiko.DSSKey]:
        try:
            return kc.from_private_key_file(key_file)
        except:
            continue
    raise Exception("无法加载密钥")

def run(client, cmd, timeout=600):
    print(f"   > {cmd[:60]}...")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    return stdout.read().decode().strip()

def create_source_archive():
    buffer = io.BytesIO()
    source_dir = os.path.abspath("../../services/api")
    with tarfile.open(fileobj=buffer, mode='w:gz') as tar:
        for root, dirs, files in os.walk(source_dir):
            dirs[:] = [d for d in dirs if d not in ['target', '.git', 'node_modules', '.idea']]
            for file in files:
                file_path = os.path.join(root, file)
                arc_name = os.path.relpath(file_path, source_dir)
                tar.add(file_path, arcname=arc_name)
    buffer.seek(0)
    return buffer

def main():
    print("快速重建JAR并部署...")
    
    archive = create_source_archive()
    key = load_ssh_key(SSH_KEY_FILE)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SSH_HOST, username=SSH_USER, pkey=key, timeout=30)
        print("✅ 连接成功")
        
        sftp = client.open_sftp()
        sftp.putfo(archive, "/opt/evlease/api-source-new.tar.gz")
        sftp.close()
        print("✅ 源代码上传完成")
        
        run(client, "rm -rf /opt/evlease/api-source && mkdir -p /opt/evlease/api-source")
        run(client, "cd /opt/evlease && tar -xzf api-source-new.tar.gz -C api-source")
        print("✅ 解压完成")
        
        print("⏳ 构建 JAR (2-3分钟)...")
        run(client, "cd /opt/evlease/api-source && mvn clean package -DskipTests -q", timeout=600)
        print("✅ 构建完成")
        
        run(client, "cp /opt/evlease/api-source/target/installment-api-*.jar /opt/evlease/artifacts/installment-api.jar")
        print("✅ JAR 复制到 artifacts")
        
        run(client, "cd /opt/evlease && docker compose restart api")
        print("✅ API 容器重启")
        
        print("⏳ 等待 API 启动 (30秒)...")
        time.sleep(30)
        
        out = run(client, "curl -s http://localhost:8080/actuator/health 2>/dev/null")
        if "UP" in out:
            print("✅ API 健康!")
        else:
            print("⚠️ API 可能还在启动中...")
        
        print("\n✅ 部署完成! 请测试生成合同功能")
        
    finally:
        client.close()

if __name__ == "__main__":
    main()
