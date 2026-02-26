#!/usr/bin/env python3
"""检查 100721 错误的详细日志"""

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

    print("\n" + "=" * 70)
    print("1. 检查最近的 100721 错误日志")
    print("=" * 70)
    run("docker logs evlease-api-1 2>&1 | grep -B10 -A5 '100721' | tail -50")

    print("\n" + "=" * 70)
    print("2. 检查 Asign API 调用日志")
    print("=" * 70)
    run("docker logs evlease-api-1 2>&1 | grep -i 'asign\\|addEnterpriseUser\\|addPersonalUser\\|addStranger' | tail -30")

    print("\n" + "=" * 70)
    print("3. 检查最近的异常")
    print("=" * 70)
    run("docker logs evlease-api-1 2>&1 | grep -i 'exception\\|error' | tail -20")

    print("\n" + "=" * 70)
    print("4. 检查 forceStranger 配置是否生效")
    print("=" * 70)
    run("docker logs evlease-api-1 2>&1 | grep -i 'stranger' | tail -10")

    client.close()

if __name__ == "__main__":
    main()

