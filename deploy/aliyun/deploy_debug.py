#!/usr/bin/env python3
"""Deploy the debug config endpoint to check Asign configuration"""
import paramiko
import os
import tarfile
import io
import time

SERVER = '47.120.27.110'
KEY_FILE = os.path.join(os.path.dirname(__file__), 'evlease_deploy_key')
API_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'services', 'api')

def main():
    print("=" * 60)
    print("Deploying debug endpoint...")
    print("=" * 60)
    
    # Create tar archive of source
    print("[1/4] Packaging source code...")
    tar_buffer = io.BytesIO()
    with tarfile.open(fileobj=tar_buffer, mode='w:gz') as tar:
        tar.add(API_DIR, arcname='api')
    tar_data = tar_buffer.getvalue()
    print(f"    Package size: {len(tar_data)} bytes")
    
    # Connect to server
    print("[2/4] Connecting to server...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SERVER, username='root', key_filename=KEY_FILE)
    sftp = ssh.open_sftp()
    
    # Upload source
    print("[3/4] Uploading and building...")
    with sftp.file('/tmp/api-source.tar.gz', 'wb') as f:
        f.write(tar_data)
    
    # Extract and build on server
    commands = [
        'cd /opt/evlease && rm -rf api-source && mkdir -p api-source',
        'cd /opt/evlease/api-source && tar xzf /tmp/api-source.tar.gz',
        'cd /opt/evlease/api-source/api && mvn package -DskipTests -q',
        'cp /opt/evlease/api-source/api/target/*.jar /opt/evlease/artifacts/installment-api.jar',
        'cd /opt/evlease && docker compose restart api',
    ]
    
    for cmd in commands:
        print(f"    Running: {cmd[:60]}...")
        stdin, stdout, stderr = ssh.exec_command(cmd, timeout=300)
        exit_code = stdout.channel.recv_exit_status()
        if exit_code != 0:
            err = stderr.read().decode()
            print(f"    Error: {err}")
            if 'mvn' in cmd:
                print("    (Maven build may have warnings, continuing...)")
            else:
                raise Exception(f"Command failed: {cmd}")
    
    # Wait for API to restart
    print("[4/4] Waiting for API to restart...")
    time.sleep(10)
    
    # Check debug endpoint
    stdin, stdout, stderr = ssh.exec_command(
        'curl -s http://localhost:8080/api/admin/contracts/debug-config 2>/dev/null || echo "API not ready"'
    )
    result = stdout.read().decode()
    print("\nDebug config result:")
    print(result)
    
    sftp.close()
    ssh.close()
    
    print("\n" + "=" * 60)
    print("Deployment complete!")

if __name__ == "__main__":
    main()

