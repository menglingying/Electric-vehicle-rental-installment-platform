#!/usr/bin/env python3
"""
在服务器上检查环境并重新构建部署
"""

import paramiko
import os
import time

HOST = "47.120.27.110"
USER = "root"
KEY_PATH = os.path.join(os.path.dirname(__file__), "evlease_deploy_key")
REMOTE_DIR = "/opt/evlease"

def main():
    print("Connecting to server...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, key_filename=KEY_PATH, timeout=30)

    def run(cmd, timeout=600):
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
    print("STEP 1: Check server environment")
    print("=" * 60)
    
    # Check Maven
    maven_check = run("which mvn || echo 'Maven not found'")
    has_maven = "mvn" in maven_check and "not found" not in maven_check
    
    # Check Git
    git_check = run("which git || echo 'Git not found'")
    has_git = "git" in git_check and "not found" not in git_check
    
    # Check build directory
    build_dir_check = run(f"ls -la {REMOTE_DIR}/build 2>/dev/null || echo 'Build dir not found'")
    has_build_dir = "not found" not in build_dir_check
    
    print(f"\nMaven: {'YES' if has_maven else 'NO'}")
    print(f"Git: {'YES' if has_git else 'NO'}")
    print(f"Build dir: {'YES' if has_build_dir else 'NO'}")

    print("\n" + "=" * 60)
    print("STEP 2: Check existing JAR files")
    print("=" * 60)
    run(f"ls -la {REMOTE_DIR}/artifacts/*.jar 2>/dev/null || echo 'No JAR in artifacts'")
    run(f"ls -la {REMOTE_DIR}/api.jar 2>/dev/null || echo 'No api.jar'")
    run(f"ls -la {REMOTE_DIR}/build/services/api/target/*.jar 2>/dev/null || echo 'No JAR in build target'")

    if has_maven and has_git and has_build_dir:
        print("\n" + "=" * 60)
        print("STEP 3: Pull latest code and build")
        print("=" * 60)
        run(f"cd {REMOTE_DIR}/build && git fetch origin && git reset --hard origin/main")
        
        print("\nBuilding JAR (this may take a few minutes)...")
        build_result = run(f"cd {REMOTE_DIR}/build/services/api && mvn clean package -DskipTests 2>&1 | tail -20", timeout=600)
        
        # Check build success
        jar_check = run(f"ls {REMOTE_DIR}/build/services/api/target/installment-api-*.jar 2>/dev/null")
        if "installment-api" in jar_check:
            print("\nBuild SUCCESS!")
            
            print("\n" + "=" * 60)
            print("STEP 4: Deploy new JAR")
            print("=" * 60)
            run(f"cd {REMOTE_DIR} && docker compose down || true")
            run(f"cp {REMOTE_DIR}/build/services/api/target/installment-api-*.jar {REMOTE_DIR}/api.jar")
            run(f"cp {REMOTE_DIR}/build/services/api/target/installment-api-*.jar {REMOTE_DIR}/artifacts/installment-api.jar")
            run(f"ls -la {REMOTE_DIR}/api.jar")
            
            print("\nStarting Docker containers...")
            run(f"cd {REMOTE_DIR} && docker compose up -d")
            
            print("\nWaiting 60 seconds for services to start...")
            time.sleep(60)
            
            run("docker ps")
            run("docker logs evlease-api-1 2>&1 | tail -20")
            run("curl -s http://127.0.0.1:8088/api/health || echo 'Health check failed'")
        else:
            print("\nBuild FAILED!")
    else:
        print("\n" + "=" * 60)
        print("Server missing required tools. Need to install Maven/Git or build locally.")
        print("=" * 60)
        
        if not has_maven:
            print("\nTo install Maven on server:")
            print("  apt-get update && apt-get install -y maven")
        
        if not has_build_dir:
            print(f"\nTo clone repo on server:")
            print(f"  cd {REMOTE_DIR} && git clone <your-repo-url> build")

    client.close()
    print("\n" + "=" * 60)
    print("Done!")
    print("=" * 60)

if __name__ == "__main__":
    main()

