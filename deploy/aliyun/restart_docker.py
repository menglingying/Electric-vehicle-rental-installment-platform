#!/usr/bin/env python3
"""重启 Docker 容器以加载最新配置"""

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
    print("STEP 1: Stop Docker containers")
    print("=" * 60)
    run("cd /opt/evlease && docker compose down")

    print("\n" + "=" * 60)
    print("STEP 2: Start Docker containers (with new env)")
    print("=" * 60)
    run("cd /opt/evlease && docker compose up -d")

    print("\n" + "=" * 60)
    print("STEP 3: Wait for services to start (60 seconds)")
    print("=" * 60)
    time.sleep(60)

    print("\n" + "=" * 60)
    print("STEP 4: Check containers")
    print("=" * 60)
    run("docker ps")

    print("\n" + "=" * 60)
    print("STEP 5: Check API logs")
    print("=" * 60)
    run("docker logs evlease-api-1 2>&1 | tail -30")

    print("\n" + "=" * 60)
    print("STEP 6: Verify env variables in container")
    print("=" * 60)
    run("docker exec evlease-api-1 env | grep -i 'ASIGN_COMPANY_SERIAL\\|ASIGN_USE_STRANGER' || echo 'Env not found'")

    print("\n" + "=" * 60)
    print("STEP 7: Health check")
    print("=" * 60)
    run("curl -s http://127.0.0.1:8088/api/health || echo 'Health check failed'")

    client.close()
    print("\n" + "=" * 60)
    print("DONE! Docker restarted with new config.")
    print("=" * 60)

if __name__ == "__main__":
    main()

