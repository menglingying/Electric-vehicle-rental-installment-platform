#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""清空订单的 asignSerialNo - v2"""

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
    
    print(f"Connecting to {host}...")
    pkey = paramiko.Ed25519Key.from_private_key_file(str(key_file))
    ssh.connect(hostname=host, username=user, pkey=pkey, timeout=15)
    
    try:
        # First find the MySQL container name
        print("\n=== Finding MySQL container ===")
        stdin, stdout, stderr = ssh.exec_command("docker ps --filter name=mysql --format '{{.Names}}'")
        container = stdout.read().decode().strip()
        print(f"MySQL container: {container}")
        
        if not container:
            print("ERROR: MySQL container not found!")
            return
        
        # Clear asignSerialNo
        print(f"\n=== Clearing asignSerialNo for order {order_id} ===")
        sql = f"UPDATE orders SET asign_serial_no = NULL, asign_auth_result = NULL WHERE id = '{order_id}'"
        cmd = f"docker exec {container} mysql -uroot -proot123 evlease -e \"{sql}\""
        print(f"Executing: {sql}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        out = stdout.read().decode()
        err = stderr.read().decode()
        if out.strip():
            print(out)
        if err.strip() and "Warning" not in err:
            print(f"Error: {err}")
            return
        
        # Verify
        print("\n=== Verifying ===")
        verify_sql = f"SELECT id, asign_serial_no, asign_auth_result FROM orders WHERE id = '{order_id}'"
        verify_cmd = f"docker exec {container} mysql -uroot -proot123 evlease -e \"{verify_sql}\""
        stdin, stdout, stderr = ssh.exec_command(verify_cmd)
        result = stdout.read().decode()
        print(result)
        
        if "NULL" in result:
            print("\n=== SUCCESS: asignSerialNo has been cleared! ===")
        else:
            print("\n=== WARNING: asignSerialNo may not have been cleared ===")
        
    finally:
        ssh.close()

if __name__ == "__main__":
    main()

