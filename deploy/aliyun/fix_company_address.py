# -*- coding: utf-8 -*-
"""修复公司地址配置"""
import paramiko
import time

SSH_HOST = "47.120.27.110"
SSH_USER = "root"
SSH_KEY_FILE = "evlease_deploy_key"

# ========== 请确认公司地址 ==========
# 根据合同模板，这是甲方（出租方）的地址
COMPANY_ADDRESS = "四川省成都市成华区"  # 请修改为实际地址
# ====================================

def load_ssh_key(key_file):
    for kc in [paramiko.Ed25519Key, paramiko.ECDSAKey, paramiko.RSAKey, paramiko.DSSKey]:
        try:
            return kc.from_private_key_file(key_file)
        except:
            continue
    raise Exception("无法加载密钥")

def run(client, cmd):
    stdin, stdout, stderr = client.exec_command(cmd)
    return stdout.read().decode().strip()

def main():
    print("=" * 60)
    print("修复公司地址配置 (partyAAddress)")
    print("=" * 60)
    print(f"公司地址: {COMPANY_ADDRESS}")
    print()
    
    key = load_ssh_key(SSH_KEY_FILE)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SSH_HOST, username=SSH_USER, pkey=key, timeout=30)
        print("[1] 连接成功!")
        
        # 更新 .env 文件
        print("\n[2] 更新 .env 配置...")
        # 检查是否存在
        result = run(client, "grep '^ASIGN_COMPANY_ADDRESS=' /opt/evlease/.env")
        if result:
            # 更新
            run(client, f"sed -i 's|^ASIGN_COMPANY_ADDRESS=.*|ASIGN_COMPANY_ADDRESS={COMPANY_ADDRESS}|' /opt/evlease/.env")
            print(f"   已更新: ASIGN_COMPANY_ADDRESS={COMPANY_ADDRESS}")
        else:
            # 添加
            run(client, f'echo "ASIGN_COMPANY_ADDRESS={COMPANY_ADDRESS}" >> /opt/evlease/.env')
            print(f"   已添加: ASIGN_COMPANY_ADDRESS={COMPANY_ADDRESS}")
        
        # 验证
        result = run(client, "grep 'ASIGN_COMPANY_ADDRESS' /opt/evlease/.env")
        print(f"   验证: {result}")
        
        # 检查 docker-compose.yml 是否有这个变量
        print("\n[3] 检查 docker-compose.yml...")
        result = run(client, "grep 'ASIGN_COMPANY_ADDRESS' /opt/evlease/docker-compose.yml")
        if not result:
            print("   docker-compose.yml 中缺少 ASIGN_COMPANY_ADDRESS 映射!")
            print("   正在上传最新的 docker-compose.yml...")
            sftp = client.open_sftp()
            sftp.put("docker-compose.yml", "/opt/evlease/docker-compose.yml")
            sftp.close()
            print("   上传完成!")
        else:
            print(f"   已配置: {result}")
        
        # 检查源码
        print("\n[4] 检查源码是否包含 partyAAddress...")
        result = run(client, "grep 'partyAAddress' /opt/evlease/api-source/src/main/java/com/evlease/installment/asign/AsignService.java 2>/dev/null | head -1")
        if not result:
            print("   源码中没有 partyAAddress，需要重新上传源码并构建!")
            print("   请运行 check_and_deploy.bat 来更新源码")
            return
        else:
            print(f"   已包含: {result[:60]}...")
        
        # 重启Docker
        print("\n[5] 重启Docker服务...")
        run(client, "cd /opt/evlease && docker-compose down")
        time.sleep(2)
        run(client, "cd /opt/evlease && docker-compose up -d")
        time.sleep(10)
        
        # 验证容器环境变量
        print("\n[6] 验证容器环境变量...")
        result = run(client, "docker exec evlease-api env 2>/dev/null | grep 'ASIGN_COMPANY_ADDRESS'")
        if result:
            print(f"   容器已接收: {result}")
        else:
            print("   警告: 容器未接收到 ASIGN_COMPANY_ADDRESS!")
        
        # 健康检查
        print("\n[7] API健康检查...")
        time.sleep(3)
        result = run(client, "curl -s http://localhost:8080/actuator/health 2>/dev/null || echo 'FAILED'")
        print(f"   {result}")
        
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

