#!/usr/bin/env python3
"""检查并修复服务器上的 docker-compose.yml"""

import paramiko
import os
import time

HOST = "47.120.27.110"
USER = "root"
KEY_PATH = os.path.join(os.path.dirname(__file__), "evlease_deploy_key")

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

    print("\n" + "=" * 60)
    print("STEP 1: Check current docker-compose.yml for ASIGN_COMPANY_SERIAL_NO")
    print("=" * 60)
    result = run("grep 'ASIGN_COMPANY_SERIAL_NO' /opt/evlease/docker-compose.yml || echo 'NOT FOUND'")
    
    if "NOT FOUND" in result:
        print("\nASIGN_COMPANY_SERIAL_NO not in docker-compose.yml! Adding it...")
        
        print("\n" + "=" * 60)
        print("STEP 2: Add ASIGN_COMPANY_SERIAL_NO to docker-compose.yml")
        print("=" * 60)
        # 在 ASIGN_COMPANY_CERT_NO 后面添加 ASIGN_COMPANY_SERIAL_NO
        run("""
sed -i '/ASIGN_COMPANY_CERT_NO/a\\      ASIGN_COMPANY_SERIAL_NO: \\${ASIGN_COMPANY_SERIAL_NO:-}' /opt/evlease/docker-compose.yml
""")
        
        # 验证
        run("grep 'ASIGN_COMPANY_SERIAL_NO' /opt/evlease/docker-compose.yml || echo 'Still NOT FOUND'")
    else:
        print("\nASIGN_COMPANY_SERIAL_NO already exists in docker-compose.yml")

    print("\n" + "=" * 60)
    print("STEP 3: Stop and restart Docker with updated config")
    print("=" * 60)
    run("cd /opt/evlease && docker compose down")
    run("cd /opt/evlease && docker compose up -d")

    print("\n" + "=" * 60)
    print("STEP 4: Wait for services to start (60 seconds)")
    print("=" * 60)
    time.sleep(60)

    print("\n" + "=" * 60)
    print("STEP 5: Verify env variables in container")
    print("=" * 60)
    run("docker exec evlease-api-1 env | grep -i 'ASIGN_COMPANY_SERIAL\\|ASIGN_USE_STRANGER'")

    print("\n" + "=" * 60)
    print("STEP 6: Health check")
    print("=" * 60)
    run("curl -s http://127.0.0.1:8088/api/health || echo 'Health check failed'")

    client.close()
    print("\n" + "=" * 60)
    print("DONE!")
    print("=" * 60)

if __name__ == "__main__":
    main()

