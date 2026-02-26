# -*- coding: utf-8 -*-
"""检查并部署最新代码，添加公司地址"""
import paramiko
import time

SSH_HOST = "47.120.27.110"
SSH_USER = "root"
SSH_KEY_FILE = "evlease_deploy_key"

# 公司地址 - 请确认或修改
COMPANY_ADDRESS = "四川省成都市成华区"

def load_ssh_key(key_file):
    """尝试多种密钥格式加载"""
    key_classes = [
        paramiko.Ed25519Key,
        paramiko.ECDSAKey,
        paramiko.RSAKey,
        paramiko.DSSKey,
    ]
    for key_class in key_classes:
        try:
            return key_class.from_private_key_file(key_file)
        except:
            continue
    raise Exception(f"无法加载密钥文件: {key_file}")

def main():
    print("=" * 60)
    print("检查并部署最新代码")
    print("=" * 60)
    
    key = load_ssh_key(SSH_KEY_FILE)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print(f"\n[1] 连接服务器 {SSH_HOST}...")
        client.connect(SSH_HOST, username=SSH_USER, pkey=key, timeout=30)
        print("连接成功!")
        
        # 检查JAR时间戳
        print("\n[2] 检查当前JAR时间戳...")
        stdin, stdout, stderr = client.exec_command("ls -la /opt/evlease/api.jar 2>/dev/null || echo 'NOT_FOUND'")
        print(stdout.read().decode())
        
        # 检查源码时间戳
        print("\n[3] 检查源码 AsignService.java 中是否有 partyAAddress...")
        stdin, stdout, stderr = client.exec_command(
            "grep -n 'partyAAddress' /opt/evlease/api-source/src/main/java/com/evlease/installment/asign/AsignService.java 2>/dev/null || echo 'NOT_FOUND'"
        )
        result = stdout.read().decode().strip()
        print(f"搜索结果: {result}")
        
        if "NOT_FOUND" in result or not result:
            print("\n源码中没有 partyAAddress，需要更新源码...")
            
            # 上传最新源码
            print("\n[4] 上传最新源码...")
            import subprocess
            import os
            
            # 本地打包
            local_api_dir = os.path.abspath("../../services/api")
            archive_path = os.path.abspath("api-source-latest.tar.gz")
            
            print(f"本地API目录: {local_api_dir}")
            
            # 使用tar打包（排除target目录）
            import tarfile
            print("创建源码包...")
            with tarfile.open(archive_path, "w:gz") as tar:
                for item in os.listdir(local_api_dir):
                    if item not in ['target', '.git', '.idea']:
                        full_path = os.path.join(local_api_dir, item)
                        tar.add(full_path, arcname=item)
            
            print(f"源码包大小: {os.path.getsize(archive_path)} bytes")
            
            # 上传
            sftp = client.open_sftp()
            sftp.put(archive_path, "/opt/evlease/api-source-latest.tar.gz")
            sftp.close()
            print("上传完成!")
            
            # 解压替换
            print("\n[5] 解压替换源码...")
            commands = [
                "cd /opt/evlease && rm -rf api-source-backup && mv api-source api-source-backup 2>/dev/null || true",
                "cd /opt/evlease && mkdir -p api-source && tar -xzf api-source-latest.tar.gz -C api-source",
                "ls -la /opt/evlease/api-source/"
            ]
            for cmd in commands:
                stdin, stdout, stderr = client.exec_command(cmd)
                out = stdout.read().decode()
                if out:
                    print(out)
            
            # 验证
            print("\n[6] 验证源码更新...")
            stdin, stdout, stderr = client.exec_command(
                "grep -n 'partyAAddress' /opt/evlease/api-source/src/main/java/com/evlease/installment/asign/AsignService.java || echo 'NOT_FOUND'"
            )
            print(stdout.read().decode())
        
        # 检查并添加 ASIGN_COMPANY_ADDRESS
        print("\n[7] 检查 ASIGN_COMPANY_ADDRESS 配置...")
        stdin, stdout, stderr = client.exec_command("grep 'ASIGN_COMPANY_ADDRESS' /opt/evlease/.env || echo 'NOT_FOUND'")
        result = stdout.read().decode().strip()
        
        if "NOT_FOUND" in result or not result:
            print(f"添加 ASIGN_COMPANY_ADDRESS={COMPANY_ADDRESS}")
            stdin, stdout, stderr = client.exec_command(
                f'echo "ASIGN_COMPANY_ADDRESS={COMPANY_ADDRESS}" >> /opt/evlease/.env'
            )
            stdout.read()
        else:
            print(f"已存在: {result}")
        
        # 上传最新的 docker-compose.yml
        print("\n[8] 上传最新 docker-compose.yml...")
        sftp = client.open_sftp()
        sftp.put("docker-compose.yml", "/opt/evlease/docker-compose.yml")
        sftp.close()
        print("上传完成!")
        
        # 重新构建
        print("\n[9] 重新构建 JAR (这可能需要几分钟)...")
        stdin, stdout, stderr = client.exec_command(
            "cd /opt/evlease/api-source && mvn clean package -DskipTests -q 2>&1 | tail -10",
            timeout=300
        )
        out = stdout.read().decode()
        err = stderr.read().decode()
        print(out)
        if err:
            print(f"STDERR: {err}")
        
        # 检查构建结果
        print("\n[10] 检查构建结果...")
        stdin, stdout, stderr = client.exec_command("ls -la /opt/evlease/api-source/target/*.jar 2>/dev/null | head -3")
        print(stdout.read().decode())
        
        # 复制JAR
        print("\n[11] 复制JAR到Docker卷...")
        stdin, stdout, stderr = client.exec_command(
            "cp /opt/evlease/api-source/target/installment-api-*.jar /opt/evlease/api.jar && ls -la /opt/evlease/api.jar"
        )
        print(stdout.read().decode())
        
        # 重启Docker
        print("\n[12] 重启 Docker 服务...")
        stdin, stdout, stderr = client.exec_command("cd /opt/evlease && docker-compose down && docker-compose up -d")
        stdout.read()
        time.sleep(10)
        
        # 验证
        print("\n[13] 验证服务状态...")
        stdin, stdout, stderr = client.exec_command("docker ps --format 'table {{.Names}}\t{{.Status}}'")
        print(stdout.read().decode())
        
        # 检查环境变量
        print("\n[14] 检查容器环境变量...")
        stdin, stdout, stderr = client.exec_command(
            "docker exec evlease-api env | grep -E 'ASIGN_COMPANY_(ADDRESS|NAME|SERIAL)' | head -5"
        )
        print(stdout.read().decode())
        
        # 健康检查
        print("\n[15] API健康检查...")
        time.sleep(5)
        stdin, stdout, stderr = client.exec_command("curl -s http://localhost:8080/actuator/health || echo 'FAILED'")
        print(stdout.read().decode())
        
        print("\n" + "=" * 60)
        print("部署完成! 请重新测试生成合同功能")
        print("=" * 60)
        
    except Exception as e:
        print(f"错误: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    main()

