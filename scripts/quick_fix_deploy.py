#!/usr/bin/env python3
"""
快速部署修复：允许Mock模式下使用固定验证码123456
"""

import os
import sys
import tarfile
import tempfile

# 尝试导入paramiko
try:
    import paramiko
except ImportError:
    print("正在安装 paramiko...")
    os.system("pip install paramiko -q")
    import paramiko

# 配置
SERVER = "47.120.27.110"
USER = "root"
KEY_FILE = "deploy/aliyun/evlease_deploy_key"
REMOTE_DIR = "/opt/evlease"

def main():
    print("=" * 60)
    print("快速部署：Mock验证码修复")
    print("=" * 60)
    
    # 切换到项目目录
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    os.chdir(project_dir)
    
    key_path = os.path.join(project_dir, KEY_FILE)
    
    print(f"\n[1] 连接服务器 {SERVER}...")
    
    # SSH 连接
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(SERVER, username=USER, key_filename=key_path, timeout=15)
        print("   ✅ 连接成功")
    except Exception as e:
        print(f"   ❌ 连接失败: {e}")
        sys.exit(1)
    
    sftp = ssh.open_sftp()
    
    def run_cmd(cmd, show_output=True):
        stdin, stdout, stderr = ssh.exec_command(cmd, timeout=300)
        out = stdout.read().decode('utf-8')
        err = stderr.read().decode('utf-8')
        if show_output and out:
            print(f"   {out.strip()}")
        if err:
            print(f"   [STDERR] {err.strip()}")
        return out
    
    # 2. 打包本地源代码
    print("\n[2] 打包本地源代码...")
    api_dir = os.path.join(project_dir, "services", "api")
    
    with tempfile.NamedTemporaryFile(suffix='.tar.gz', delete=False) as tmp:
        tar_path = tmp.name
    
    with tarfile.open(tar_path, "w:gz") as tar:
        tar.add(api_dir, arcname="api")
    
    file_size = os.path.getsize(tar_path) / 1024 / 1024
    print(f"   压缩包大小: {file_size:.2f} MB")
    
    # 3. 上传源代码
    print("\n[3] 上传源代码...")
    remote_tar = f"{REMOTE_DIR}/api-source-fix.tar.gz"
    sftp.put(tar_path, remote_tar)
    os.unlink(tar_path)
    print("   ✅ 上传完成")
    
    # 4. 解压并验证
    print("\n[4] 解压并验证...")
    run_cmd(f"rm -rf {REMOTE_DIR}/api-fix && mkdir -p {REMOTE_DIR}/api-fix")
    run_cmd(f"cd {REMOTE_DIR}/api-fix && tar xzf {remote_tar}")
    
    # 验证修复代码
    print("\n[5] 验证修复代码...")
    result = run_cmd(f"grep -c 'useMockCode' {REMOTE_DIR}/api-fix/api/src/main/java/com/evlease/installment/sms/VerificationCodeStore.java || echo 0")
    if "0" not in result or int(result.strip()) > 0:
        print("   ✅ 修复代码已包含")
    else:
        print("   ❌ 修复代码未找到")
        sys.exit(1)
    
    # 5. 构建 JAR
    print("\n[6] 构建 JAR (约2-3分钟)...")
    run_cmd(f"cd {REMOTE_DIR}/api-fix/api && mvn clean package -DskipTests -q 2>&1 | tail -5")
    
    # 检查构建结果
    result = run_cmd(f"ls -la {REMOTE_DIR}/api-fix/api/target/installment-api-*.jar 2>/dev/null | head -1")
    if "installment-api" not in result:
        print("   ❌ 构建失败")
        # 查看错误
        run_cmd(f"cd {REMOTE_DIR}/api-fix/api && mvn clean package -DskipTests 2>&1 | tail -30")
        sys.exit(1)
    print("   ✅ 构建成功")
    
    # 6. 复制到 artifacts 目录
    print("\n[7] 部署 JAR...")
    run_cmd(f"cp {REMOTE_DIR}/api-fix/api/target/installment-api-*.jar {REMOTE_DIR}/artifacts/installment-api.jar")
    
    # 7. 重启 Docker
    print("\n[8] 重启 Docker 容器...")
    run_cmd(f"cd {REMOTE_DIR} && docker compose down", show_output=False)
    run_cmd(f"cd {REMOTE_DIR} && docker compose up -d --force-recreate", show_output=False)
    
    # 8. 等待启动
    print("\n[9] 等待 API 启动 (30秒)...")
    import time
    time.sleep(30)
    
    # 9. 验证
    print("\n[10] 验证部署...")
    run_cmd("docker ps --format 'table {{.Names}}\t{{.Status}}' | grep evlease")
    
    # 健康检查
    for i in range(5):
        result = run_cmd("curl -s http://localhost:8080/api/health 2>/dev/null", show_output=False)
        if result and "ok" in result.lower():
            print(f"   ✅ API 健康检查通过: {result.strip()}")
            break
        print(f"   等待... {i+1}/5")
        time.sleep(5)
    
    ssh.close()
    
    print("\n" + "=" * 60)
    print("✅ 部署完成！")
    print("现在可以使用手机号 + 固定验证码 123456 登录")
    print("=" * 60)

if __name__ == "__main__":
    main()

