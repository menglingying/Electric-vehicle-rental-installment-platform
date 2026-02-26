#!/usr/bin/env python3
"""检查 API 错误日志"""

import paramiko
import os

HOST = "47.120.27.110"
USER = "root"
KEY_PATH = os.path.join(os.path.dirname(__file__), "evlease_deploy_key")

def main():
    print("Connecting to server...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, key_filename=KEY_PATH, timeout=30)

    def run(cmd, timeout=60):
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
    print("Checking API container logs for 100720 error...")
    print("=" * 60)
    
    # 获取最近的错误日志
    run("docker logs evlease-api-1 2>&1 | grep -i '100720\\|error\\|exception\\|asign' | tail -50")
    
    print("\n" + "=" * 60)
    print("Last 100 lines of API logs...")
    print("=" * 60)
    run("docker logs evlease-api-1 2>&1 | tail -100")

    client.close()
    print("\n" + "=" * 60)
    print("Done!")
    print("=" * 60)

if __name__ == "__main__":
    main()

