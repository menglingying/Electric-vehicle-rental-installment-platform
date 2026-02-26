# -*- coding: utf-8 -*-
"""添加公司地址到.env并重新部署"""
import paramiko
import time

SSH_HOST = "47.120.27.110"
SSH_USER = "root"
SSH_KEY_FILE = "evlease_deploy_key"

# 请修改为实际公司地址
COMPANY_ADDRESS = "四川省成都市成华区"  # TODO: 请修改为实际公司地址

def main():
    print("=" * 60)
    print("添加公司地址并重新部署")
    print("=" * 60)
    
    key = paramiko.RSAKey.from_private_key_file(SSH_KEY_FILE)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print(f"\n[1] 连接服务器 {SSH_HOST}...")
        client.connect(SSH_HOST, username=SSH_USER, pkey=key, timeout=30)
        print("连接成功!")
        
        # 检查是否已存在 ASIGN_COMPANY_ADDRESS
        print("\n[2] 检查现有配置...")
        stdin, stdout, stderr = client.exec_command("grep 'ASIGN_COMPANY_ADDRESS' /opt/evlease/.env || echo 'NOT_FOUND'")
        result = stdout.read().decode().strip()
        
        if "NOT_FOUND" in result:
            print("ASIGN_COMPANY_ADDRESS 不存在，添加...")
            cmd = f'echo "ASIGN_COMPANY_ADDRESS={COMPANY_ADDRESS}" >> /opt/evlease/.env'
            stdin, stdout, stderr = client.exec_command(cmd)
            stdout.read()
            print(f"已添加: ASIGN_COMPANY_ADDRESS={COMPANY_ADDRESS}")
        else:
            print(f"已存在: {result}")
            # 更新
            cmd = f"sed -i 's|^ASIGN_COMPANY_ADDRESS=.*|ASIGN_COMPANY_ADDRESS={COMPANY_ADDRESS}|' /opt/evlease/.env"
            stdin, stdout, stderr = client.exec_command(cmd)
            stdout.read()
            print(f"已更新为: {COMPANY_ADDRESS}")
        
        # 验证
        print("\n[3] 验证配置...")
        stdin, stdout, stderr = client.exec_command("grep 'ASIGN_COMPANY_ADDRESS' /opt/evlease/.env")
        print(f"当前配置: {stdout.read().decode().strip()}")
        
        # 上传最新的 docker-compose.yml
        print("\n[4] 上传最新docker-compose.yml...")
        sftp = client.open_sftp()
        sftp.put("docker-compose.yml", "/opt/evlease/docker-compose.yml")
        sftp.close()
        print("上传成功!")
        
        # 重新构建和部署
        print("\n[5] 重新构建JAR...")
        stdin, stdout, stderr = client.exec_command(
            "cd /opt/evlease/api-source && mvn clean package -DskipTests -q 2>&1 | tail -5"
        )
        out = stdout.read().decode()
        err = stderr.read().decode()
        print(out)
        if err:
            print(f"STDERR: {err}")
        
        # 复制JAR到Docker卷
        print("\n[6] 复制JAR到Docker卷...")
        stdin, stdout, stderr = client.exec_command(
            "cp /opt/evlease/api-source/target/installment-api-*.jar /opt/evlease/api.jar && ls -la /opt/evlease/api.jar"
        )
        print(stdout.read().decode())
        
        # 重启Docker
        print("\n[7] 重启Docker服务...")
        stdin, stdout, stderr = client.exec_command(
            "cd /opt/evlease && docker-compose down && docker-compose up -d"
        )
        stdout.read()
        time.sleep(8)
        
        # 验证
        print("\n[8] 验证服务状态...")
        stdin, stdout, stderr = client.exec_command("docker ps --format 'table {{.Names}}\t{{.Status}}'")
        print(stdout.read().decode())
        
        # 检查环境变量是否传入容器
        print("\n[9] 检查容器环境变量...")
        stdin, stdout, stderr = client.exec_command(
            "docker exec evlease-api env | grep -E 'ASIGN_COMPANY_(ADDRESS|NAME|SERIAL)' | head -5"
        )
        print(stdout.read().decode())
        
        print("\n" + "=" * 60)
        print("部署完成!")
        print("=" * 60)
        
    except Exception as e:
        print(f"错误: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    main()

