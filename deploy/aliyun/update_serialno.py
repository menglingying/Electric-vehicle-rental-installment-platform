#!/usr/bin/env python3
"""更新企业 serialNo 并重启"""

import paramiko
import os
import time

HOST = "47.120.27.110"
USER = "root"
KEY_PATH = os.path.join(os.path.dirname(__file__), "evlease_deploy_key")

NEW_SERIAL_NO = "CA35020260128114726181153"

def main():
    print("Connecting to server...")
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

    print("\n" + "=" * 70)
    print(f"STEP 1: 更新 .env 文件中的 ASIGN_COMPANY_SERIAL_NO 为 {NEW_SERIAL_NO}")
    print("=" * 70)
    
    # 先备份
    run("cp /opt/evlease/.env /opt/evlease/.env.bak")
    
    # 更新 serialNo
    run(f"sed -i 's/ASIGN_COMPANY_SERIAL_NO=.*/ASIGN_COMPANY_SERIAL_NO={NEW_SERIAL_NO}/' /opt/evlease/.env")
    
    # 验证
    run("grep 'ASIGN_COMPANY_SERIAL_NO' /opt/evlease/.env")

    print("\n" + "=" * 70)
    print("STEP 2: 重启 Docker 容器")
    print("=" * 70)
    run("cd /opt/evlease && docker compose down")
    run("cd /opt/evlease && docker compose up -d")

    print("\n" + "=" * 70)
    print("STEP 3: 等待服务启动 (60秒)")
    print("=" * 70)
    time.sleep(60)

    print("\n" + "=" * 70)
    print("STEP 4: 验证容器环境变量")
    print("=" * 70)
    run("docker exec evlease-api-1 env | grep 'ASIGN_COMPANY_SERIAL_NO'")

    print("\n" + "=" * 70)
    print("STEP 5: 健康检查")
    print("=" * 70)
    run("curl -s http://127.0.0.1:8088/api/health")

    client.close()
    
    print("\n" + "=" * 70)
    print("完成！请测试合同生成功能。")
    print("=" * 70)

if __name__ == "__main__":
    main()

