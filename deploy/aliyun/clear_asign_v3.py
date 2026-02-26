#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""清空订单的 asignSerialNo - v3 (带详细输出)"""

import sys
from pathlib import Path

def main():
    try:
        import paramiko
    except ImportError:
        print("Installing paramiko...")
        import subprocess
        subprocess.run([sys.executable, "-m", "pip", "install", "paramiko"], check=True)
        import paramiko

    host = "47.120.27.110"
    user = "root"
    key_file = Path(__file__).parent / "evlease_deploy_key"
    order_id = "o_2c0ddd02f0a84046b37fab0085e06646"
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print(f"[1] Connecting to {host}...")
    pkey = paramiko.Ed25519Key.from_private_key_file(str(key_file))
    ssh.connect(hostname=host, username=user, pkey=pkey, timeout=15)
    print("    Connected!")
    
    try:
        # Find MySQL container
        print("\n[2] Finding MySQL container...")
        stdin, stdout, stderr = ssh.exec_command("docker ps --filter name=mysql --format '{{.Names}}'")
        container = stdout.read().decode().strip()
        print(f"    MySQL container: {container}")
        
        if not container:
            print("    ERROR: MySQL container not found!")
            return
        
        # Check current value BEFORE clearing
        print(f"\n[3] Checking current value for order {order_id}...")
        check_sql = f"SELECT id, asign_serial_no, asign_auth_result FROM orders WHERE id = '{order_id}'"
        check_cmd = f"docker exec {container} mysql -uroot -proot123 evlease -e \"{check_sql}\" 2>/dev/null"
        stdin, stdout, stderr = ssh.exec_command(check_cmd)
        result = stdout.read().decode()
        print("    Current value:")
        print("    " + result.replace("\n", "\n    "))
        
        # Clear asignSerialNo
        print(f"\n[4] Clearing asign_serial_no and asign_auth_result...")
        update_sql = f"UPDATE orders SET asign_serial_no = NULL, asign_auth_result = NULL WHERE id = '{order_id}'"
        update_cmd = f"docker exec {container} mysql -uroot -proot123 evlease -e \"{update_sql}\" 2>/dev/null"
        stdin, stdout, stderr = ssh.exec_command(update_cmd)
        out = stdout.read().decode()
        err = stderr.read().decode()
        if out.strip():
            print("    " + out)
        if err.strip():
            print("    Error: " + err)
        print("    UPDATE executed!")
        
        # Verify AFTER clearing
        print(f"\n[5] Verifying after clear...")
        stdin, stdout, stderr = ssh.exec_command(check_cmd)
        result = stdout.read().decode()
        print("    " + result.replace("\n", "\n    "))
        
        if "NULL" in result:
            print("\n========================================")
            print("SUCCESS! asign_serial_no has been cleared to NULL")
            print("========================================")
            print("\nNow the customer should:")
            print("1. Go to H5 order detail page")
            print("2. Click '去实名认证' button")
            print("3. Complete the Asign face authentication")
        else:
            print("\n========================================")
            print("WARNING: The value may not have been cleared!")
            print("========================================")
        
    finally:
        ssh.close()
        print("\nConnection closed.")

if __name__ == "__main__":
    main()

