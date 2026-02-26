#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import paramiko
import os
import time

ASIGN_BASE_URL = "https://oapi.asign.cn"
ASIGN_TEMPLATE_NO = "TN5222236232334270A6E67A3F2104694C"

def main():
    print("="*60)
    print("Auto-fixing Asign configuration...")
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    key_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'evlease_deploy_key')
    ssh.connect('47.120.27.110', username='root', key_filename=key_path)
    
    print("[1] Updating .env...")
    cmds = [
        'cd /opt/evlease && grep -q "^ASIGN_BASE_URL=" .env && sed -i "s|^ASIGN_BASE_URL=.*|ASIGN_BASE_URL=https://oapi.asign.cn|" .env || echo "ASIGN_BASE_URL=https://oapi.asign.cn" >> .env',
        'cd /opt/evlease && grep -q "^ASIGN_TEMPLATE_NO=" .env && sed -i "s|^ASIGN_TEMPLATE_NO=.*|ASIGN_TEMPLATE_NO=TN5222236232334270A6E67A3F2104694C|" .env || echo "ASIGN_TEMPLATE_NO=TN5222236232334270A6E67A3F2104694C" >> .env',
    ]
    for c in cmds:
        ssh.exec_command(c)[1].channel.recv_exit_status()
    
    print("[2] Checking .env...")
    out = ssh.exec_command('cd /opt/evlease && grep -E "ASIGN_BASE_URL|ASIGN_TEMPLATE_NO" .env')[1].read().decode()
    print(out)
    
    print("[3] Restarting docker...")
    ssh.exec_command('cd /opt/evlease && docker compose down')[1].channel.recv_exit_status()
    ssh.exec_command('cd /opt/evlease && docker compose up -d')[1].channel.recv_exit_status()
    
    print("[4] Waiting 15s...")
    time.sleep(15)
    
    print("[5] Verifying container env...")
    out1 = ssh.exec_command('docker exec evlease-api-1 printenv ASIGN_BASE_URL')[1].read().decode().strip()
    out2 = ssh.exec_command('docker exec evlease-api-1 printenv ASIGN_TEMPLATE_NO')[1].read().decode().strip()
    print(f"ASIGN_BASE_URL: {out1}")
    print(f"ASIGN_TEMPLATE_NO: {out2}")
    
    print("[6] Health check...")
    status = ssh.exec_command('curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/actuator/health')[1].read().decode().strip()
    print(f"API Status: {status}")
    
    ssh.close()
    print("="*60)
    print("Done!")
    return status == "200"

if __name__ == "__main__":
    main()

