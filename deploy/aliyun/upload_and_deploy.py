#!/usr/bin/env python3
"""
上传本地构建的 JAR 并重新部署
需要先在本地运行: cd services/api && mvn clean package -DskipTests
"""

import paramiko
import os
import time

HOST = "47.120.27.110"
USER = "root"
KEY_PATH = os.path.join(os.path.dirname(__file__), "evlease_deploy_key")
REMOTE_DIR = "/opt/evlease"
LOCAL_JAR = os.path.join(os.path.dirname(__file__), "..", "..", "services", "api", "target", "installment-api-0.0.1-SNAPSHOT.jar")

def main():
    # 检查本地 JAR 是否存在
    local_jar_path = os.path.abspath(LOCAL_JAR)
    print(f"Looking for local JAR: {local_jar_path}")
    
    if not os.path.exists(local_jar_path):
        print(f"\n!!! ERROR: Local JAR not found at {local_jar_path}")
        print("Please build the JAR first:")
        print("  cd services/api && mvn clean package -DskipTests")
        return
    
    jar_size = os.path.getsize(local_jar_path)
    print(f"Found JAR: {jar_size / 1024 / 1024:.1f} MB")

    print("\nConnecting to server...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, key_filename=KEY_PATH, timeout=30)

    def run(cmd, timeout=120):
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
    print("STEP 1: Stop Docker containers")
    print("=" * 60)
    run(f"cd {REMOTE_DIR} && docker compose down || true")

    print("\n" + "=" * 60)
    print("STEP 2: Upload new JAR")
    print("=" * 60)
    sftp = client.open_sftp()
    remote_jar = f"{REMOTE_DIR}/api.jar"
    print(f"Uploading {local_jar_path} -> {remote_jar}")
    sftp.put(local_jar_path, remote_jar)
    sftp.close()
    print("Upload complete!")

    run(f"ls -la {remote_jar}")

    print("\n" + "=" * 60)
    print("STEP 3: Start Docker containers")
    print("=" * 60)
    run(f"cd {REMOTE_DIR} && docker compose up -d")

    print("\n" + "=" * 60)
    print("STEP 4: Wait for services to start (60 seconds)")
    print("=" * 60)
    time.sleep(60)

    print("\n" + "=" * 60)
    print("STEP 5: Check container status")
    print("=" * 60)
    run("docker ps")

    print("\n" + "=" * 60)
    print("STEP 6: Check API logs")
    print("=" * 60)
    run("docker logs evlease-api-1 2>&1 | tail -30")

    print("\n" + "=" * 60)
    print("STEP 7: Health check")
    print("=" * 60)
    run("curl -s http://127.0.0.1:8088/api/health || echo 'Health check failed'")

    client.close()
    print("\n" + "=" * 60)
    print("DONE! New JAR deployed.")
    print("=" * 60)

if __name__ == "__main__":
    main()

