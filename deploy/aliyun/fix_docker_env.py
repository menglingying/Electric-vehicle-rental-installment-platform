# -*- coding: utf-8 -*-
"""修复Docker环境变量问题"""
import paramiko
import time

SSH_HOST = "47.120.27.110"
SSH_USER = "root"
SSH_KEY_FILE = "evlease_deploy_key"

COMPANY_ADDRESS = "四川省成都市成华区"

def load_ssh_key(key_file):
    for kc in [paramiko.Ed25519Key, paramiko.ECDSAKey, paramiko.RSAKey, paramiko.DSSKey]:
        try:
            return kc.from_private_key_file(key_file)
        except:
            continue
    raise Exception("无法加载密钥")

def run(client, cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    return out, err

def main():
    print("=" * 60)
    print("修复Docker环境变量问题")
    print("=" * 60)
    
    key = load_ssh_key(SSH_KEY_FILE)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SSH_HOST, username=SSH_USER, pkey=key, timeout=30)
        print("[1] 连接成功!")
        
        # 检查 .env 文件内容
        print("\n[2] 检查 .env 文件...")
        out, _ = run(client, "cat /opt/evlease/.env | grep -E 'ASIGN_COMPANY' | head -5")
        print(f"   {out}")
        
        # 确保 .env 中有正确的值
        print("\n[3] 确保 ASIGN_COMPANY_ADDRESS 配置正确...")
        out, _ = run(client, "grep '^ASIGN_COMPANY_ADDRESS=' /opt/evlease/.env")
        if not out:
            run(client, f'echo "ASIGN_COMPANY_ADDRESS={COMPANY_ADDRESS}" >> /opt/evlease/.env')
            print(f"   添加: ASIGN_COMPANY_ADDRESS={COMPANY_ADDRESS}")
        else:
            print(f"   已存在: {out}")
        
        # 完全停止并删除容器
        print("\n[4] 完全停止并删除旧容器...")
        run(client, "cd /opt/evlease && docker-compose down --remove-orphans")
        time.sleep(3)
        
        # 使用 --env-file 启动
        print("\n[5] 使用 --env-file 重新启动容器...")
        out, err = run(client, "cd /opt/evlease && docker-compose --env-file .env up -d", timeout=120)
        if out:
            print(f"   {out}")
        time.sleep(15)
        
        # 验证容器状态
        print("\n[6] 验证容器状态...")
        out, _ = run(client, "docker ps --format 'table {{.Names}}\t{{.Status}}'")
        print(out)
        
        # 验证环境变量 (Docker Compose v2 使用 -1 后缀)
        print("\n[7] 验证容器环境变量...")
        out, _ = run(client, "docker exec evlease-api-1 env 2>/dev/null | grep 'ASIGN_COMPANY' || echo '未找到'")
        print(f"   {out}")
        
        # 如果还是没有，直接在docker run时传入
        if "未找到" in out or not out.strip():
            print("\n[8] 环境变量仍未传入，尝试检查docker-compose配置...")
            out, _ = run(client, "cat /opt/evlease/docker-compose.yml | grep -A2 'ASIGN_COMPANY_ADDRESS'")
            print(f"   compose配置: {out}")
            
            # 检查是否使用了正确的容器名
            out, _ = run(client, "docker ps --format '{{.Names}}' | grep api")
            print(f"   API容器名: {out}")
            
            if out:
                container_name = out.strip().split('\n')[0]
                out, _ = run(client, f"docker exec {container_name} env 2>/dev/null | grep 'ASIGN' | head -10")
                print(f"   容器ASIGN变量:\n{out}")
        
        # 健康检查
        print("\n[9] API健康检查...")
        time.sleep(5)
        for i in range(3):
            out, _ = run(client, "curl -s http://localhost:8080/actuator/health 2>/dev/null")
            if "UP" in out:
                print(f"   ✓ {out}")
                break
            else:
                print(f"   尝试 {i+1}/3: {out if out else 'FAILED'}")
                time.sleep(5)
        
        # 检查API日志
        print("\n[10] 检查API启动日志...")
        out, _ = run(client, "docker logs evlease-api-1 2>&1 | tail -20")
        print(out)
        
        print("\n" + "=" * 60)
        print("修复完成!")
        print("=" * 60)
        
    except Exception as e:
        print(f"错误: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    main()

