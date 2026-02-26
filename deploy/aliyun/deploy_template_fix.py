#!/usr/bin/env python3
"""部署模板参数修复 - 添加所有必填模板参数"""
import paramiko
import os
import tarfile
import tempfile

SERVER = "47.120.27.110"
USER = "root"
KEY_FILE = os.path.join(os.path.dirname(__file__), "evlease_deploy_key")

def run(ssh, cmd, check=True):
    print(f">>> {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=300)
    out = stdout.read().decode()
    err = stderr.read().decode()
    code = stdout.channel.recv_exit_status()
    if out: print(out)
    if err: print(f"STDERR: {err}")
    if check and code != 0:
        raise Exception(f"Command failed with code {code}")
    return out, err, code

def main():
    print("="*60)
    print("部署模板参数修复")
    print("="*60)
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print("\n[1/5] 连接服务器...")
    ssh.connect(SERVER, username=USER, key_filename=KEY_FILE)
    print("✓ 已连接")
    
    print("\n[2/5] 上传最新源代码...")
    # 创建源代码压缩包
    api_src = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "services", "api"))
    with tempfile.NamedTemporaryFile(suffix=".tar.gz", delete=False) as f:
        tar_path = f.name
    
    with tarfile.open(tar_path, "w:gz") as tar:
        tar.add(api_src, arcname="api")
    
    # 上传
    sftp = ssh.open_sftp()
    sftp.put(tar_path, "/tmp/api-source.tar.gz")
    os.unlink(tar_path)
    print("✓ 源代码已上传")
    
    print("\n[3/5] 解压并替换源代码...")
    run(ssh, "rm -rf /opt/evlease/api-new && mkdir -p /opt/evlease/api-new")
    run(ssh, "cd /opt/evlease/api-new && tar xzf /tmp/api-source.tar.gz")
    run(ssh, "rm -rf /opt/evlease/api && mv /opt/evlease/api-new/api /opt/evlease/api")
    print("✓ 源代码已替换")
    
    # 验证关键代码
    print("\n验证关键代码:")
    out, _, _ = run(ssh, "grep -c 'usePurpose' /opt/evlease/api/src/main/java/com/evlease/installment/asign/AsignService.java || echo 0")
    use_purpose = int(out.strip())
    out, _, _ = run(ssh, "grep -c 'leaseStartDate' /opt/evlease/api/src/main/java/com/evlease/installment/asign/AsignService.java || echo 0")
    lease_start = int(out.strip())
    print(f"  usePurpose 出现次数: {use_purpose}")
    print(f"  leaseStartDate 出现次数: {lease_start}")
    
    if use_purpose == 0 or lease_start == 0:
        raise Exception("源代码验证失败 - 缺少关键参数!")
    print("✓ 源代码验证通过")
    
    print("\n[4/5] 重新编译JAR...")
    run(ssh, "cd /opt/evlease/api && mvn clean package -DskipTests -q", check=True)
    run(ssh, "cp /opt/evlease/api/target/installment-api-*.jar /opt/evlease/artifacts/installment-api.jar")
    print("✓ JAR编译完成")
    
    # 验证JAR内容
    print("\n验证JAR内容:")
    out, _, _ = run(ssh, "unzip -p /opt/evlease/artifacts/installment-api.jar BOOT-INF/classes/com/evlease/installment/asign/AsignService.class | strings | grep -c usePurpose || echo 0")
    jar_check = int(out.strip())
    print(f"  JAR中usePurpose出现次数: {jar_check}")
    if jar_check == 0:
        raise Exception("JAR验证失败!")
    print("✓ JAR验证通过")
    
    print("\n[5/5] 重启Docker容器...")
    run(ssh, "cd /opt/evlease && docker compose down", check=False)
    run(ssh, "cd /opt/evlease && docker compose up -d")
    
    import time
    print("\n等待服务启动...")
    time.sleep(10)
    
    # 健康检查
    out, _, code = run(ssh, "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/actuator/health", check=False)
    if "200" in out:
        print("✓ API健康检查通过!")
    else:
        print(f"⚠ API健康检查返回: {out}")
        # 查看日志
        run(ssh, "cd /opt/evlease && docker compose logs --tail=20 api", check=False)
    
    # 验证容器中的JAR
    print("\n验证容器中的JAR:")
    out, _, _ = run(ssh, "docker exec evlease-api-1 sh -c 'unzip -p /app/app.jar BOOT-INF/classes/com/evlease/installment/asign/AsignService.class | strings | grep -c usePurpose' 2>/dev/null || echo 0", check=False)
    print(f"  容器JAR中usePurpose: {out.strip()}")
    
    ssh.close()
    print("\n" + "="*60)
    print("✅ 部署完成!")
    print("="*60)

if __name__ == "__main__":
    main()

