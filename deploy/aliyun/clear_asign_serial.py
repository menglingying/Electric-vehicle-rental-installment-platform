#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""清空订单的 asignSerialNo 以便重新测试"""

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
        # Clear asignSerialNo via MySQL
        print(f"\n=== Clearing asignSerialNo for order {order_id} ===")
        sql = f"UPDATE orders SET asign_serial_no = NULL, asign_auth_result = NULL WHERE id = '{order_id}'"
        cmd = f'docker exec evlease-mysql-1 mysql -uroot -proot123 evlease -e "{sql}"'
        print(f"$ {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        out = stdout.read().decode()
        err = stderr.read().decode()
        if out.strip():
            print(out)
        if err.strip():
            print(err)
        
        # Verify
        print("\n=== Verifying ===")
        verify_sql = f"SELECT id, asign_serial_no, asign_auth_result FROM orders WHERE id = '{order_id}'"
        verify_cmd = f'docker exec evlease-mysql-1 mysql -uroot -proot123 evlease -e "{verify_sql}"'
        stdin, stdout, stderr = ssh.exec_command(verify_cmd)
        print(stdout.read().decode())
        
        print("\n清空成功！现在可以重新测试爱签实名认证流程。")
        
    finally:
        ssh.close()

if __name__ == "__main__":
    main()

