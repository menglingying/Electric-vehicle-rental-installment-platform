#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""在服务器上构建并部署后端 (不使用 Docker)"""

import os
import sys
import tarfile
import tempfile
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
    repo_root = Path(__file__).resolve().parents[2]
    key_file = Path(__file__).parent / "evlease_deploy_key"
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print(f"Connecting to {host}...")
    pkey = paramiko.Ed25519Key.from_private_key_file(str(key_file))
    ssh.connect(hostname=host, username=user, pkey=pkey, timeout=15)
    
    def ssh_exec(cmd, check=True):
        print(f"$ {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd, get_pty=True)
        out = stdout.read().decode("utf-8", errors="ignore")
        err = stderr.read().decode("utf-8", errors="ignore")
        code = stdout.channel.recv_exit_status()
        if out.strip():
            print(out)
        if err.strip():
            print(err)
        if check and code != 0:
            raise RuntimeError(f"Command failed with code {code}")
        return code, out, err
    
    try:
        # 1. Install Java 17 if not present
        print("\n=== [1/6] Checking Java installation ===")
        code, out, _ = ssh_exec("java -version 2>&1 || true", check=False)
        if "openjdk version" not in out.lower() and "java version" not in out.lower():
            print("Installing Java 17...")
            ssh_exec("apt-get update && apt-get install -y openjdk-17-jdk-headless")
        else:
            print("Java already installed!")
        
        # 2. Upload API source code
        print("\n=== [2/6] Uploading API source code ===")
        api_dir = repo_root / "services" / "api"
        
        # Create tarball of API source
        with tempfile.NamedTemporaryFile(suffix=".tar.gz", delete=False) as tmp:
            tmp_path = tmp.name
        
        print(f"Creating source tarball from {api_dir}...")
        with tarfile.open(tmp_path, "w:gz") as tf:
            for item in api_dir.rglob("*"):
                if "target" in item.parts:
                    continue
                if item.is_file():
                    arcname = item.relative_to(api_dir)
                    tf.add(item, arcname=str(arcname))
        
        # Upload
        ssh_exec("mkdir -p /opt/evlease/build")
        sftp = ssh.open_sftp()
        print("Uploading api-source.tar.gz...")
        sftp.put(tmp_path, "/opt/evlease/build/api-source.tar.gz")
        sftp.close()
        os.unlink(tmp_path)
        
        # 3. Extract and build on server
        print("\n=== [3/6] Extracting source code ===")
        ssh_exec("cd /opt/evlease/build && rm -rf api && mkdir -p api && tar -xzf api-source.tar.gz -C api")
        
        print("\n=== [4/6] Building JAR on server (this may take a few minutes) ===")
        ssh_exec("cd /opt/evlease/build/api && chmod +x mvnw && ./mvnw -DskipTests clean package", check=True)
        
        # 4. Stop old API process
        print("\n=== [5/6] Stopping old API process ===")
        ssh_exec("pkill -f 'java.*installment-api' || true", check=False)
        
        import time
        time.sleep(2)
        
        # 5. Deploy and start new JAR
        print("\n=== [6/6] Deploying and starting new JAR ===")
        ssh_exec("mkdir -p /opt/evlease/artifacts")
        ssh_exec("cp /opt/evlease/build/api/target/installment-api-0.0.1-SNAPSHOT.jar /opt/evlease/artifacts/installment-api.jar")
        
        # Load environment variables from .env file and start JAR
        start_cmd = """
cd /opt/evlease && \\
export $(grep -v '^#' .env | xargs) && \\
nohup java -jar /opt/evlease/artifacts/installment-api.jar --server.port=8080 > /opt/evlease/api.log 2>&1 &
"""
        ssh_exec(start_cmd, check=False)
        
        # Wait and check health
        print("\nWaiting for API to start...")
        time.sleep(15)
        
        print("\n=== Checking API process ===")
        ssh_exec("ps aux | grep 'java.*installment-api' | grep -v grep || echo 'API process not found'", check=False)
        
        print("\n=== Checking API health ===")
        code, out, _ = ssh_exec("curl -s http://127.0.0.1:8080/actuator/health || echo 'Health check failed'", check=False)
        
        print("\n" + "=" * 50)
        print("后端部署完成！")
        print("=" * 50)
        
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
