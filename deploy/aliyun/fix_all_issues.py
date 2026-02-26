#!/usr/bin/env python3
"""
一次性修复所有问题：
1. 上传最新的 docker-compose.yml（包含 ASIGN_COMPANY_SERIAL_NO 映射）
2. 更新 Docker 容器使用的 JAR 为最新版本
3. 重启 Docker 容器
"""

import paramiko
import os
import time

HOST = "47.120.27.110"
USER = "root"
KEY_PATH = os.path.join(os.path.dirname(__file__), "evlease_deploy_key")
LOCAL_COMPOSE = os.path.join(os.path.dirname(__file__), "docker-compose.yml")

def main():
    print("=" * 70)
    print("一次性修复所有问题")
    print("=" * 70)
    
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

    # STEP 1: 停止 Docker 容器
    print("\n" + "=" * 70)
    print("STEP 1: 停止 Docker 容器")
    print("=" * 70)
    run("cd /opt/evlease && docker compose down")

    # STEP 2: 上传最新的 docker-compose.yml
    print("\n" + "=" * 70)
    print("STEP 2: 上传最新的 docker-compose.yml")
    print("=" * 70)
    sftp = client.open_sftp()
    sftp.put(LOCAL_COMPOSE, "/opt/evlease/docker-compose.yml")
    sftp.close()
    print(f"Uploaded: {LOCAL_COMPOSE} -> /opt/evlease/docker-compose.yml")

    # STEP 3: 验证 docker-compose.yml 包含 ASIGN_COMPANY_SERIAL_NO
    print("\n" + "=" * 70)
    print("STEP 3: 验证 docker-compose.yml 包含 ASIGN_COMPANY_SERIAL_NO")
    print("=" * 70)
    result = run("grep -n 'ASIGN_COMPANY_SERIAL_NO' /opt/evlease/docker-compose.yml")
    if "ASIGN_COMPANY_SERIAL_NO" not in result:
        print("ERROR: ASIGN_COMPANY_SERIAL_NO still not found!")
        return
    print("OK: ASIGN_COMPANY_SERIAL_NO mapping found!")

    # STEP 4: 更新 artifacts 目录的 JAR 为最新版本
    print("\n" + "=" * 70)
    print("STEP 4: 更新 artifacts/installment-api.jar 为最新构建版本")
    print("=" * 70)
    run("ls -la /opt/evlease/build/api/target/*.jar")
    run("cp /opt/evlease/build/api/target/installment-api-0.0.1-SNAPSHOT.jar /opt/evlease/artifacts/installment-api.jar")
    run("ls -la /opt/evlease/artifacts/installment-api.jar")

    # STEP 5: 启动 Docker 容器
    print("\n" + "=" * 70)
    print("STEP 5: 启动 Docker 容器")
    print("=" * 70)
    run("cd /opt/evlease && docker compose up -d")

    # STEP 6: 等待服务启动
    print("\n" + "=" * 70)
    print("STEP 6: 等待服务启动 (60秒)")
    print("=" * 70)
    time.sleep(60)

    # STEP 7: 验证容器环境变量
    print("\n" + "=" * 70)
    print("STEP 7: 验证容器环境变量包含 ASIGN_COMPANY_SERIAL_NO")
    print("=" * 70)
    result = run("docker exec evlease-api-1 env | grep -i 'ASIGN_COMPANY_SERIAL_NO\\|ASIGN_USE_STRANGER'")
    if "ASIGN_COMPANY_SERIAL_NO" in result:
        print("\n✅ ASIGN_COMPANY_SERIAL_NO 已成功传递到容器！")
    else:
        print("\n❌ ASIGN_COMPANY_SERIAL_NO 仍未传递到容器！")

    # STEP 8: 验证 JAR 版本
    print("\n" + "=" * 70)
    print("STEP 8: 验证容器使用的 JAR 版本")
    print("=" * 70)
    run("docker exec evlease-api-1 ls -la /app/app.jar")

    # STEP 9: 检查 API 日志
    print("\n" + "=" * 70)
    print("STEP 9: 检查 API 启动日志")
    print("=" * 70)
    run("docker logs evlease-api-1 2>&1 | tail -20")

    # STEP 10: 健康检查
    print("\n" + "=" * 70)
    print("STEP 10: 健康检查")
    print("=" * 70)
    run("curl -s http://127.0.0.1:8088/api/health || echo 'Health check failed'")

    client.close()
    
    print("\n" + "=" * 70)
    print("修复完成！请测试合同生成功能。")
    print("=" * 70)

if __name__ == "__main__":
    main()

