#!/usr/bin/env python3
"""
服务器环境排查脚本
检查爱签API配置和服务状态
"""

import subprocess
import sys

SSH_KEY = "deploy/aliyun/evlease_deploy_key"
SERVER = "root@47.120.27.110"

def run_ssh(cmd, desc=""):
    """执行SSH命令"""
    print(f"\n{'='*60}")
    print(f">>> {desc}")
    print(f">>> 执行: {cmd}")
    print('='*60)
    
    full_cmd = f'ssh -i "{SSH_KEY}" -o StrictHostKeyChecking=no -o ConnectTimeout=10 {SERVER} "{cmd}"'
    
    try:
        result = subprocess.run(
            full_cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.stdout:
            print(result.stdout)
        if result.stderr:
            print(f"[STDERR] {result.stderr}")
        
        return result.returncode == 0, result.stdout
    except subprocess.TimeoutExpired:
        print("[ERROR] 命令执行超时")
        return False, ""
    except Exception as e:
        print(f"[ERROR] {e}")
        return False, ""

def main():
    print("=" * 60)
    print("电动车租赁分期平台 - 服务器环境排查")
    print("=" * 60)
    
    # 1. 检查 .env 配置文件
    run_ssh("cat /opt/evlease/.env", "检查 .env 配置文件")
    
    # 2. 检查 Docker 容器状态
    run_ssh("docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'", "检查 Docker 容器状态")
    
    # 3. 检查 API 容器日志（最近30行）
    run_ssh("docker logs --tail 30 evlease-api 2>&1", "检查 API 容器最近日志")
    
    # 4. 检查爱签相关的环境变量是否传入容器
    run_ssh("docker exec evlease-api env | grep -i asign", "检查容器内爱签环境变量")
    
    # 5. 检查 API 健康状态
    run_ssh("curl -s http://localhost:8080/api/health | head -c 500", "检查 API 健康状态")
    
    # 6. 检查 docker-compose.yml 中的环境变量配置
    run_ssh("cat /opt/evlease/docker-compose.yml | grep -A 20 'environment:'", "检查 docker-compose 环境变量配置")
    
    print("\n" + "=" * 60)
    print("排查完成！")
    print("=" * 60)

if __name__ == "__main__":
    main()

