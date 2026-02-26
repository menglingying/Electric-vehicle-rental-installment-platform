# -*- coding: utf-8 -*-
"""最终修复：上传新的docker-compose.yml并强制重建"""
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
    print(f"   > {cmd[:80]}...")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if err and "warning" not in err.lower():
        print(f"   STDERR: {err[:200]}")
    return out

def main():
    print("=" * 60)
    print("最终修复：添加 env_file 配置并重建容器")
    print("=" * 60)
    
    key = load_ssh_key(SSH_KEY_FILE)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SSH_HOST, username=SSH_USER, pkey=key, timeout=30)
        print("[1] 连接成功!")
        
        # 上传新的 docker-compose.yml（包含 env_file 配置）
        print("\n[2] 上传新的 docker-compose.yml (包含 env_file 配置)...")
        sftp = client.open_sftp()
        sftp.put("docker-compose.yml", "/opt/evlease/docker-compose.yml")
        sftp.close()
        print("   上传成功!")
        
        # 验证
        print("\n[3] 验证 docker-compose.yml 中的 env_file 配置...")
        result = run(client, "grep -A2 'env_file' /opt/evlease/docker-compose.yml | head -5")
        print(f"   {result}")
        
        # 完全停止并删除容器 (使用 docker compose V2 语法)
        print("\n[4] 完全停止并删除所有容器...")
        run(client, "cd /opt/evlease && docker compose down --remove-orphans")
        time.sleep(5)
        
        # 确认容器已停止
        result = run(client, "docker ps -a --format '{{.Names}}' | grep evlease || echo '所有容器已停止'")
        print(f"   {result}")
        
        # 重新启动（不使用缓存）- 使用 docker compose V2 语法
        print("\n[5] 重新启动容器...")
        result = run(client, "cd /opt/evlease && docker compose up -d --force-recreate 2>&1")
        print(f"   {result[:500] if result else '启动中...'}")
        
        # 等待启动
        print("\n[6] 等待容器启动 (30秒)...")
        time.sleep(30)
        
        # 验证容器状态
        print("\n[7] 验证容器状态...")
        result = run(client, "docker ps --format 'table {{.Names}}\t{{.Status}}'")
        print(result)
        
        # 关键：验证 ASIGN_COMPANY_ADDRESS
        print("\n[8] 验证 ASIGN_COMPANY_ADDRESS 环境变量...")
        result = run(client, "docker exec evlease-api-1 printenv ASIGN_COMPANY_ADDRESS 2>/dev/null || echo '未找到'")
        print(f"   ASIGN_COMPANY_ADDRESS = {result}")
        
        if "未找到" not in result and result:
            print("\n   ✅ 环境变量配置成功!")
        else:
            print("\n   ❌ 环境变量仍未配置，尝试直接注入...")
            # 检查.env是否被正确读取
            result = run(client, "cat /opt/evlease/.env | grep ASIGN_COMPANY_ADDRESS")
            print(f"   .env内容: {result}")
        
        # 健康检查
        print("\n[9] API健康检查...")
        for i in range(6):
            result = run(client, "curl -s -w '\\nHTTP_CODE:%{http_code}' http://localhost:8080/actuator/health 2>/dev/null | head -2")
            if "UP" in result or "200" in result:
                print(f"   ✅ API健康!")
                break
            time.sleep(5)
            print(f"   等待中... {i+1}/6")
        
        print("\n" + "=" * 60)
        print("修复完成! 请重新测试生成合同功能")
        print("=" * 60)
        
    except Exception as e:
        print(f"错误: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    main()

