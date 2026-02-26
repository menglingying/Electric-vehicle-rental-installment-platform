#!/usr/bin/env python3
"""Fix Asign configuration: ensure correct API URL and Template No"""
import paramiko
import os
import time

# Production API URL
ASIGN_BASE_URL = "https://oapi.asign.cn"
# Template number provided by user
ASIGN_TEMPLATE_NO = "TN5222236232334270A6E67A3F2104694C"

def main():
    print("=" * 60)
    print("Fixing Asign Configuration")
    print("=" * 60)
    print(f"Target API URL: {ASIGN_BASE_URL}")
    print(f"Target Template No: {ASIGN_TEMPLATE_NO}")
    print("=" * 60)
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    key_path = os.path.join(os.path.dirname(__file__), 'evlease_deploy_key')
    ssh.connect('47.120.27.110', username='root', key_filename=key_path)
    
    # Step 1: Check current .env
    print("\n[1] Current .env configuration:")
    stdin, stdout, stderr = ssh.exec_command('cd /opt/evlease && grep -E "ASIGN_BASE_URL|ASIGN_TEMPLATE_NO" .env')
    current = stdout.read().decode()
    print(current if current else "(not set)")
    
    # Step 2: Update .env file
    print("\n[2] Updating .env file...")
    update_commands = [
        f'cd /opt/evlease && grep -q "^ASIGN_BASE_URL=" .env && sed -i "s|^ASIGN_BASE_URL=.*|ASIGN_BASE_URL={ASIGN_BASE_URL}|" .env || echo "ASIGN_BASE_URL={ASIGN_BASE_URL}" >> .env',
        f'cd /opt/evlease && grep -q "^ASIGN_TEMPLATE_NO=" .env && sed -i "s|^ASIGN_TEMPLATE_NO=.*|ASIGN_TEMPLATE_NO={ASIGN_TEMPLATE_NO}|" .env || echo "ASIGN_TEMPLATE_NO={ASIGN_TEMPLATE_NO}" >> .env',
    ]
    for cmd in update_commands:
        stdin, stdout, stderr = ssh.exec_command(cmd)
        stdout.channel.recv_exit_status()
    print("    Done")
    
    # Step 3: Verify .env update
    print("\n[3] Verifying .env update:")
    stdin, stdout, stderr = ssh.exec_command('cd /opt/evlease && grep -E "ASIGN_BASE_URL|ASIGN_TEMPLATE_NO" .env')
    updated = stdout.read().decode()
    print(updated if updated else "(not set)")
    
    # Step 4: Restart Docker with new config
    print("\n[4] Restarting Docker containers...")
    stdin, stdout, stderr = ssh.exec_command('cd /opt/evlease && docker compose down && docker compose up -d')
    exit_code = stdout.channel.recv_exit_status()
    if exit_code != 0:
        print(f"    Warning: {stderr.read().decode()}")
    else:
        print("    Done")
    
    # Wait for restart
    print("\n[5] Waiting for API to start...")
    time.sleep(15)
    
    # Step 5: Verify container environment
    print("\n[6] Verifying container environment:")
    stdin, stdout, stderr = ssh.exec_command('docker exec evlease-api-1 printenv ASIGN_BASE_URL 2>/dev/null')
    base_url = stdout.read().decode().strip()
    stdin, stdout, stderr = ssh.exec_command('docker exec evlease-api-1 printenv ASIGN_TEMPLATE_NO 2>/dev/null')
    template_no = stdout.read().decode().strip()
    print(f"    ASIGN_BASE_URL: {base_url}")
    print(f"    ASIGN_TEMPLATE_NO: {template_no}")
    
    # Step 6: Health check
    print("\n[7] API Health check:")
    stdin, stdout, stderr = ssh.exec_command('curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/actuator/health 2>/dev/null')
    status = stdout.read().decode().strip()
    if status == "200":
        print("    API is healthy!")
    else:
        print(f"    API status: {status}")
        # Check logs
        print("\n    Recent logs:")
        stdin, stdout, stderr = ssh.exec_command('docker logs evlease-api-1 --tail 10 2>&1')
        print(stdout.read().decode())
    
    ssh.close()
    print("\n" + "=" * 60)
    print("Configuration fix complete!")
    print("Please try generating contract again.")

if __name__ == "__main__":
    main()

