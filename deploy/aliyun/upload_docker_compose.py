#!/usr/bin/env python3
"""上传最新的 docker-compose.yml 并重启"""

import paramiko
import os
import time

HOST = "47.120.27.110"
USER = "root"
KEY_PATH = os.path.join(os.path.dirname(__file__), "evlease_deploy_key")
LOCAL_COMPOSE = os.path.join(os.path.dirname(__file__), "docker-compose.yml")

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
    print("STEP 2: Upload latest docker-compose.yml")
    print("=" * 60)
    sftp = client.open_sftp()
    sftp.put(LOCAL_COMPOSE, "/opt/evlease/docker-compose.yml")
    sftp.close()
    print(f"Uploaded {LOCAL_COMPOSE} -> /opt/evlease/docker-compose.yml")

    print("\n" + "=" * 60)
    print("STEP 3: Verify docker-compose.yml has ASIGN_COMPANY_SERIAL_NO")
    print("=" * 60)
    run("grep 'ASIGN_COMPANY_SERIAL_NO' /opt/evlease/docker-compose.yml")

    print("\n" + "=" * 60)
    print("STEP 4: Start Docker containers")
    print("=" * 60)
    run("cd /opt/evlease && docker compose up -d")

    print("\n" + "=" * 60)
    print("STEP 5: Wait for services to start (60 seconds)")
    print("=" * 60)
    time.sleep(60)

    print("\n" + "=" * 60)
    print("STEP 6: Verify env variables in container")
    print("=" * 60)
    run("docker exec evlease-api-1 env | grep -i 'ASIGN_COMPANY_SERIAL\\|ASIGN_USE_STRANGER'")

    print("\n" + "=" * 60)
    print("STEP 7: Health check")
    print("=" * 60)
    run("curl -s http://127.0.0.1:8088/api/health || echo 'Health check failed'")

    client.close()
    print("\n" + "=" * 60)
    print("DONE!")
    print("=" * 60)

if __name__ == "__main__":
    main()

