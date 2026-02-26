#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""检查订单的 asignSerialNo 当前值"""

import sys
from pathlib import Path

def main():
    try:
        import paramiko
    except ImportError:
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
        # Find MySQL container
        stdin, stdout, stderr = ssh.exec_command("docker ps --filter name=mysql --format '{{.Names}}'")
        container = stdout.read().decode().strip()
        print(f"MySQL container: {container}")
        
        # Check current value
        print(f"\n=== Order {order_id} ===")
        sql = f"SELECT id, real_name, asign_serial_no, asign_auth_result FROM orders WHERE id = '{order_id}'"
        cmd = f"docker exec {container} mysql -uroot -proot123 evlease -N -e \"{sql}\" 2>/dev/null"
        stdin, stdout, stderr = ssh.exec_command(cmd)
        result = stdout.read().decode().strip()
        
        if result:
            parts = result.split('\t')
            print(f"  ID: {parts[0] if len(parts) > 0 else 'N/A'}")
            print(f"  real_name: {parts[1] if len(parts) > 1 else 'N/A'}")
            print(f"  asign_serial_no: {parts[2] if len(parts) > 2 else 'N/A'}")
            print(f"  asign_auth_result: {parts[3] if len(parts) > 3 else 'N/A'}")
            
            serial = parts[2] if len(parts) > 2 else ""
            if serial == "NULL" or serial == "" or serial == "None":
                print("\n>>> asign_serial_no is NULL/empty - OK!")
            else:
                print(f"\n>>> asign_serial_no still has value: {serial}")
        else:
            print("  No result found!")
        
    finally:
        ssh.close()

if __name__ == "__main__":
    main()

