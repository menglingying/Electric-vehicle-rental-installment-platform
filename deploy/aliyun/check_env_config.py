#!/usr/bin/env python3
"""检查服务器 .env 配置"""

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
    print("Checking ASIGN configuration in .env...")
    print("=" * 60)
    
    run("grep -i 'ASIGN' /opt/evlease/.env 2>/dev/null || echo 'No .env file or no ASIGN config'")
    
    print("\n" + "=" * 60)
    print("Full .env file (masked)...")
    print("=" * 60)
    run("cat /opt/evlease/.env 2>/dev/null | sed 's/=.*/=***/' || echo 'No .env file'")

    print("\n" + "=" * 60)
    print("Check if ASIGN_COMPANY_SERIAL_NO is configured...")
    print("=" * 60)
    run("grep 'ASIGN_COMPANY_SERIAL_NO' /opt/evlease/.env 2>/dev/null || echo 'NOT CONFIGURED!'")

    client.close()
    print("\n" + "=" * 60)
    print("Done!")
    print("=" * 60)

if __name__ == "__main__":
    main()

