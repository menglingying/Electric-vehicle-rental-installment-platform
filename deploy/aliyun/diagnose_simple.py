#!/usr/bin/env python3
"""Simple diagnostic script to check Asign configuration on server"""
import paramiko
import os

def main():
    print("=" * 60)
    print("Connecting to server...")
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    key_path = os.path.join(os.path.dirname(__file__), 'evlease_deploy_key')
    ssh.connect('47.120.27.110', username='root', key_filename=key_path)
    
    print("Connected!")
    print("=" * 60)
    
    # Check .env for ASIGN config
    print("\n[1] .env ASIGN configuration:")
    stdin, stdout, stderr = ssh.exec_command('cd /opt/evlease && grep -E "^ASIGN" .env')
    env_result = stdout.read().decode()
    print(env_result if env_result else "(no ASIGN vars found)")
    
    # Check Docker container environment
    print("\n[2] Docker container ASIGN environment:")
    stdin, stdout, stderr = ssh.exec_command('docker exec evlease-api-1 env 2>/dev/null | grep -E "^ASIGN" | sort')
    docker_result = stdout.read().decode()
    print(docker_result if docker_result else "(no ASIGN vars in container)")
    
    # Check SPRING_PROFILES_ACTIVE
    print("\n[3] SPRING_PROFILES_ACTIVE:")
    stdin, stdout, stderr = ssh.exec_command('docker exec evlease-api-1 printenv SPRING_PROFILES_ACTIVE 2>/dev/null')
    profile = stdout.read().decode().strip()
    print(profile if profile else "(not set)")
    
    # Check API logs for template/config issues
    print("\n[4] Recent Asign API calls in logs:")
    stdin, stdout, stderr = ssh.exec_command('docker logs evlease-api-1 --tail 50 2>&1 | grep -i "asign\\|template\\|100066" | tail -20')
    logs = stdout.read().decode()
    print(logs if logs else "(no relevant log entries)")
    
    ssh.close()
    print("\n" + "=" * 60)
    print("Diagnosis complete")

if __name__ == "__main__":
    main()

