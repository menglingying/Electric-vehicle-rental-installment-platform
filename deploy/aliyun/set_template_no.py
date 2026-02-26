#!/usr/bin/env python3
"""配置爱签模板编号"""
import paramiko
import os

SERVER = "47.120.27.110"
USER = "root"
KEY_FILE = os.path.join(os.path.dirname(__file__), "evlease_deploy_key")

TEMPLATE_NO = "TN5222236232334270A6E67A3F2104694C"

def run(ssh, cmd, check=True):
    print(f">>> {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=120)
    out = stdout.read().decode()
    err = stderr.read().decode()
    code = stdout.channel.recv_exit_status()
    if out: print(out)
    if err: print(f"STDERR: {err}")
    return out, err, code

def main():
    print("="*60)
    print("配置爱签模板编号")
    print(f"模板编号: {TEMPLATE_NO}")
    print("="*60)
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(SERVER, username=USER, key_filename=KEY_FILE)
    
    print("\n[1/4] 检查当前配置...")
    run(ssh, "cd /opt/evlease && grep ASIGN_TEMPLATE .env || echo '未配置'")
    
    print("\n[2/4] 更新 .env 文件...")
    # 删除旧的配置
    run(ssh, "cd /opt/evlease && sed -i '/ASIGN_TEMPLATE_NO/d' .env")
    # 添加新配置
    run(ssh, f"cd /opt/evlease && echo 'ASIGN_TEMPLATE_NO={TEMPLATE_NO}' >> .env")
    
    print("\n[3/4] 验证配置...")
    run(ssh, "cd /opt/evlease && grep ASIGN_TEMPLATE .env")
    
    print("\n[4/4] 重启 Docker 容器...")
    run(ssh, "cd /opt/evlease && docker compose down")
    run(ssh, "cd /opt/evlease && docker compose up -d")
    
    import time
    print("\n等待服务启动...")
    time.sleep(8)
    
    # 验证容器环境变量
    print("\n验证容器中的模板配置:")
    run(ssh, "docker exec evlease-api-1 env | grep TEMPLATE || echo '未找到'")
    
    # 健康检查
    out, _, _ = run(ssh, "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/actuator/health")
    if "200" in out:
        print("\n✅ API健康检查通过!")
    else:
        print(f"\n⚠ API健康检查返回: {out}")
    
    ssh.close()
    print("\n" + "="*60)
    print("✅ 模板编号配置完成!")
    print("="*60)

if __name__ == "__main__":
    main()

