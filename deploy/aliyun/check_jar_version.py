#!/usr/bin/env python3
"""检查服务器上 JAR 版本和构建信息"""

import paramiko
import os

HOST = "47.120.27.110"
USER = "root"
KEY_PATH = os.path.join(os.path.dirname(__file__), "evlease_deploy_key")
REMOTE_DIR = "/opt/evlease"

def main():
    print("Connecting to server...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, key_filename=KEY_PATH, timeout=30)

    def run(cmd):
        print(f">>> {cmd}")
        stdin, stdout, stderr = client.exec_command(cmd, timeout=60)
        out = stdout.read().decode()
        err = stderr.read().decode()
        if out:
            print(out)
        if err:
            print(f"STDERR: {err}")
        return out

    print("\n[1] Check JAR file timestamps...")
    run("ls -la /opt/evlease/*.jar 2>/dev/null || echo 'No JAR files in /opt/evlease'")
    run("ls -la /opt/evlease/artifacts/*.jar 2>/dev/null || echo 'No JAR files in artifacts'")

    print("\n[2] Check docker-compose API configuration...")
    run("cat /opt/evlease/docker-compose.yml | grep -A 30 'api:'")

    print("\n[3] Check what JAR is actually running in Docker...")
    run("docker exec evlease-api-1 ls -la /app/app.jar 2>/dev/null || echo 'Cannot access container'")
    run("docker exec evlease-api-1 md5sum /app/app.jar 2>/dev/null || echo 'Cannot access container'")

    print("\n[4] Check local JAR MD5 for comparison...")
    run("md5sum /opt/evlease/api.jar 2>/dev/null || echo 'File not found'")
    run("md5sum /opt/evlease/artifacts/installment-api.jar 2>/dev/null || echo 'File not found'")

    print("\n[5] Check if source code was ever built on server...")
    run("ls -la /opt/evlease/build/api/target/*.jar 2>/dev/null || echo 'No build target found'")

    print("\n[6] Check API logs for stranger mode...")
    run("docker logs evlease-api-1 2>&1 | grep -i 'stranger\\|addStranger\\|addPersonalUser' | tail -20")

    print("\n[7] Check .env file for ASIGN configuration...")
    run("grep -E 'ASIGN|asign' /opt/evlease/.env 2>/dev/null || echo 'No ASIGN config found'")

    client.close()
    print("\n" + "=" * 50)
    print("Done!")
    print("=" * 50)

if __name__ == "__main__":
    main()

