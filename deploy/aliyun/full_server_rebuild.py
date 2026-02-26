#!/usr/bin/env python3
"""
完整服务器端构建和部署脚本
在服务器上重新构建 JAR 并部署到 Docker
"""

import paramiko
import os
import time

HOST = "47.120.27.110"
USER = "root"
KEY_PATH = os.path.join(os.path.dirname(__file__), "evlease_deploy_key")
REMOTE_DIR = "/opt/evlease"

def main():
    print("Connecting to server...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, key_filename=KEY_PATH, timeout=30)

    def run(cmd, timeout=300):
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
    print("STEP 1: Pull latest code from Git")
    print("=" * 60)
    run(f"cd {REMOTE_DIR}/build && git pull origin main")

    print("\n" + "=" * 60)
    print("STEP 2: Build API JAR on server")
    print("=" * 60)
    # 使用 Maven 构建，跳过测试以加快速度
    build_result = run(f"cd {REMOTE_DIR}/build/services/api && mvn clean package -DskipTests -q", timeout=600)
    
    # 检查是否构建成功
    jar_check = run(f"ls -la {REMOTE_DIR}/build/services/api/target/installment-api-*.jar 2>/dev/null | head -1")
    if "installment-api" not in jar_check:
        print("\n!!! BUILD FAILED - JAR not found !!!")
        client.close()
        return

    print("\n" + "=" * 60)
    print("STEP 3: Stop Docker containers")
    print("=" * 60)
    run(f"cd {REMOTE_DIR} && docker compose down || true")

    print("\n" + "=" * 60)
    print("STEP 4: Copy new JAR to deployment location")
    print("=" * 60)
    run(f"cp {REMOTE_DIR}/build/services/api/target/installment-api-*.jar {REMOTE_DIR}/api.jar")
    run(f"ls -la {REMOTE_DIR}/api.jar")
    
    # 显示 JAR 内容以验证它包含最新代码
    print("\nVerifying JAR content (checking AsignService)...")
    run(f"cd {REMOTE_DIR} && unzip -p api.jar BOOT-INF/classes/com/evlease/installment/asign/AsignService.class | strings | grep -i 'stranger' | head -5")

    print("\n" + "=" * 60)
    print("STEP 5: Start Docker containers")
    print("=" * 60)
    run(f"cd {REMOTE_DIR} && docker compose up -d")

    print("\n" + "=" * 60)
    print("STEP 6: Wait for services to start (60 seconds)")
    print("=" * 60)
    time.sleep(60)

    print("\n" + "=" * 60)
    print("STEP 7: Check container status")
    print("=" * 60)
    run("docker ps")

    print("\n" + "=" * 60)
    print("STEP 8: Check API logs")
    print("=" * 60)
    run("docker logs evlease-api-1 2>&1 | tail -30")

    print("\n" + "=" * 60)
    print("STEP 9: Health check")
    print("=" * 60)
    run("curl -s http://127.0.0.1:8088/api/health || echo 'Health check failed'")

    client.close()
    print("\n" + "=" * 60)
    print("DONE! Server rebuilt with latest code.")
    print("=" * 60)

if __name__ == "__main__":
    main()

