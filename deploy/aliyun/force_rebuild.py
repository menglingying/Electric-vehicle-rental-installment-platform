# -*- coding: utf-8 -*-
"""强制重建Docker容器以加载新环境变量"""
import paramiko
import time

SSH_HOST = "47.120.27.110"
SSH_USER = "root"
SSH_KEY_FILE = "evlease_deploy_key"

def load_ssh_key(key_file):
    for kc in [paramiko.Ed25519Key, paramiko.ECDSAKey, paramiko.RSAKey, paramiko.DSSKey]:
        try:
            return kc.from_private_key_file(key_file)
        except:
            continue
    raise Exception("无法加载密钥")

def run(client, cmd, timeout=120):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    return stdout.read().decode().strip()

def main():
    print("=" * 60)
    print("强制重建Docker容器")
    print("=" * 60)
    
    key = load_ssh_key(SSH_KEY_FILE)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SSH_HOST, username=SSH_USER, pkey=key, timeout=30)
        print("[1] 连接成功!")
        
        # 检查 .env
        print("\n[2] 检查 .env 中的 ASIGN_COMPANY_ADDRESS...")
        result = run(client, "grep 'ASIGN_COMPANY_ADDRESS' /opt/evlease/.env")
        print(f"   {result}")
        
        # 完全停止所有容器
        print("\n[3] 停止所有容器...")
        run(client, "cd /opt/evlease && docker-compose down")
        time.sleep(3)
        
        # 删除API容器（确保环境变量更新）
        print("\n[4] 删除旧的API容器镜像缓存...")
        run(client, "docker system prune -f")
        
        # 强制重建并启动
        print("\n[5] 强制重建并启动容器 (--force-recreate)...")
        result = run(client, "cd /opt/evlease && docker-compose up -d --force-recreate")
        print(f"   {result}")
        
        # 等待启动
        print("\n[6] 等待容器启动...")
        time.sleep(20)
        
        # 验证容器状态
        print("\n[7] 验证容器状态...")
        result = run(client, "docker ps --format 'table {{.Names}}\t{{.Status}}'")
        print(result)
        
        # 验证环境变量 - 使用正确的容器名
        print("\n[8] 验证API容器环境变量...")
        result = run(client, "docker exec evlease-api-1 env 2>/dev/null | grep 'ASIGN_COMPANY_ADDRESS' || echo '未找到 ASIGN_COMPANY_ADDRESS'")
        print(f"   {result}")
        
        # 如果还是没有，检查完整的环境变量列表
        if "未找到" in result:
            print("\n[9] 完整ASIGN环境变量列表:")
            result = run(client, "docker exec evlease-api-1 env 2>/dev/null | grep ASIGN | sort")
            print(result)
            
            print("\n[10] 检查docker-compose.yml中ASIGN_COMPANY_ADDRESS的定义:")
            result = run(client, "grep -A1 'ASIGN_COMPANY_ADDRESS' /opt/evlease/docker-compose.yml")
            print(f"   {result}")
        
        # 健康检查
        print("\n[11] API健康检查...")
        for i in range(5):
            result = run(client, "curl -s http://localhost:8080/actuator/health 2>/dev/null")
            if "UP" in result:
                print(f"   ✓ API健康: {result}")
                break
            time.sleep(5)
            print(f"   等待中... {i+1}/5")
        
        print("\n" + "=" * 60)
        
    except Exception as e:
        print(f"错误: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    main()

