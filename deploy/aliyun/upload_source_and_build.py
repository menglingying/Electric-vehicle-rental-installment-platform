#!/usr/bin/env python3
"""
上传最新源代码到服务器并重新构建部署
"""

import paramiko
import os
import tarfile
import time
import io

HOST = "47.120.27.110"
USER = "root"
KEY_PATH = os.path.join(os.path.dirname(__file__), "evlease_deploy_key")
REMOTE_DIR = "/opt/evlease"
LOCAL_API_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "services", "api")

def main():
    # 检查本地源代码目录
    local_api_path = os.path.abspath(LOCAL_API_DIR)
    print(f"Local API source: {local_api_path}")
    
    if not os.path.exists(os.path.join(local_api_path, "pom.xml")):
        print("ERROR: pom.xml not found in local API directory!")
        return
    
    print("\n" + "=" * 60)
    print("STEP 1: Creating source archive...")
    print("=" * 60)
    
    # 创建 tar.gz 压缩包（排除 target 目录）
    archive_buffer = io.BytesIO()
    with tarfile.open(fileobj=archive_buffer, mode='w:gz') as tar:
        for item in os.listdir(local_api_path):
            if item in ['target', '.idea', '*.iml']:
                continue
            item_path = os.path.join(local_api_path, item)
            tar.add(item_path, arcname=item)
    
    archive_data = archive_buffer.getvalue()
    print(f"Archive size: {len(archive_data) / 1024:.1f} KB")

    print("\nConnecting to server...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, key_filename=KEY_PATH, timeout=30)

    def run(cmd, timeout=600):
        print(f"\n>>> {cmd}")
        stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
        out = stdout.read().decode()
        err = stderr.read().decode()
        if out:
            print(out)
        if err:
            print(f"STDERR: {err}")
        return out

    print("\n" + "=" * 60)
    print("STEP 2: Upload source archive")
    print("=" * 60)
    sftp = client.open_sftp()
    remote_archive = f"{REMOTE_DIR}/build/api-source-new.tar.gz"
    with sftp.file(remote_archive, 'wb') as f:
        f.write(archive_data)
    sftp.close()
    print(f"Uploaded to {remote_archive}")

    print("\n" + "=" * 60)
    print("STEP 3: Extract and replace source code")
    print("=" * 60)
    run(f"rm -rf {REMOTE_DIR}/build/api/src {REMOTE_DIR}/build/api/pom.xml {REMOTE_DIR}/build/api/.mvn")
    run(f"cd {REMOTE_DIR}/build/api && tar -xzf ../api-source-new.tar.gz")
    run(f"ls -la {REMOTE_DIR}/build/api/")
    
    # 验证关键代码
    print("\nVerifying forceStranger code...")
    run(f"grep -n 'forceStranger' {REMOTE_DIR}/build/api/src/main/java/com/evlease/installment/asign/AsignService.java | head -5")

    print("\n" + "=" * 60)
    print("STEP 4: Build JAR")
    print("=" * 60)
    build_output = run(f"cd {REMOTE_DIR}/build/api && mvn clean package -DskipTests 2>&1 | tail -30", timeout=600)
    
    if "BUILD SUCCESS" not in build_output:
        print("\n!!! BUILD FAILED !!!")
        run(f"cd {REMOTE_DIR}/build/api && mvn clean package -DskipTests 2>&1 | tail -100")
        client.close()
        return

    print("\n" + "=" * 60)
    print("STEP 5: Deploy new JAR")
    print("=" * 60)
    run(f"cd {REMOTE_DIR} && docker compose down || true")
    run(f"cp {REMOTE_DIR}/build/api/target/installment-api-*.jar {REMOTE_DIR}/api.jar")
    run(f"ls -la {REMOTE_DIR}/api.jar")
    
    print("\nStarting Docker containers...")
    run(f"cd {REMOTE_DIR} && docker compose up -d")
    
    print("\nWaiting 60 seconds for services to start...")
    time.sleep(60)
    
    run("docker ps")
    run("docker logs evlease-api-1 2>&1 | tail -20")
    run("curl -s http://127.0.0.1:8088/api/health || echo 'Health check failed'")

    client.close()
    print("\n" + "=" * 60)
    print("DONE! Latest source code deployed.")
    print("=" * 60)

if __name__ == "__main__":
    main()

