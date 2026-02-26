#!/usr/bin/env python3
"""更新 .env 配置并重新部署"""

import sys
import os

# 添加当前目录到路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from deploy import connect_ssh, SSH_HOST, SSH_USER, SSH_KEY_FILE, REMOTE_DIR

def main():
    print("=" * 60)
    print("更新爱签企业认证配置并重新部署")
    print("=" * 60)
    
    # 企业认证流水号（从爱签后台获取）
    company_serial_no = "CA3502026012811472681153"
    company_account = "ASIGN91510104MAG00BQP6G"
    
    print(f"\n企业认证流水号: {company_serial_no}")
    print(f"企业账号: {company_account}")
    
    key_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), SSH_KEY_FILE)
    client = connect_ssh(SSH_HOST, SSH_USER, key_path)
    
    try:
        # 1. 检查当前 .env 配置
        print("\n[1/4] 检查当前配置...")
        stdin, stdout, stderr = client.exec_command(f"cd {REMOTE_DIR} && grep -E 'ASIGN_COMPANY_(SERIAL_NO|ACCOUNT)' .env || echo '未找到配置'")
        current_config = stdout.read().decode('utf-8').strip()
        print(f"当前配置:\n{current_config}")
        
        # 2. 更新 .env 文件
        print("\n[2/4] 更新 .env 配置...")
        
        # 检查是否存在 ASIGN_COMPANY_SERIAL_NO
        stdin, stdout, stderr = client.exec_command(f"cd {REMOTE_DIR} && grep -c 'ASIGN_COMPANY_SERIAL_NO' .env || echo '0'")
        count = stdout.read().decode('utf-8').strip()
        
        if count == '0':
            # 添加新配置
            cmd = f"cd {REMOTE_DIR} && echo 'ASIGN_COMPANY_SERIAL_NO={company_serial_no}' >> .env"
            client.exec_command(cmd)
            print(f"  已添加 ASIGN_COMPANY_SERIAL_NO={company_serial_no}")
        else:
            # 更新现有配置
            cmd = f"cd {REMOTE_DIR} && sed -i 's/^ASIGN_COMPANY_SERIAL_NO=.*/ASIGN_COMPANY_SERIAL_NO={company_serial_no}/' .env"
            client.exec_command(cmd)
            print(f"  已更新 ASIGN_COMPANY_SERIAL_NO={company_serial_no}")
        
        # 检查是否存在 ASIGN_COMPANY_ACCOUNT
        stdin, stdout, stderr = client.exec_command(f"cd {REMOTE_DIR} && grep -c 'ASIGN_COMPANY_ACCOUNT' .env || echo '0'")
        count = stdout.read().decode('utf-8').strip()
        
        if count == '0':
            cmd = f"cd {REMOTE_DIR} && echo 'ASIGN_COMPANY_ACCOUNT={company_account}' >> .env"
            client.exec_command(cmd)
            print(f"  已添加 ASIGN_COMPANY_ACCOUNT={company_account}")
        else:
            cmd = f"cd {REMOTE_DIR} && sed -i 's/^ASIGN_COMPANY_ACCOUNT=.*/ASIGN_COMPANY_ACCOUNT={company_account}/' .env"
            client.exec_command(cmd)
            print(f"  已更新 ASIGN_COMPANY_ACCOUNT={company_account}")
        
        # 3. 验证配置
        print("\n[3/4] 验证配置...")
        stdin, stdout, stderr = client.exec_command(f"cd {REMOTE_DIR} && grep -E 'ASIGN_COMPANY_(SERIAL_NO|ACCOUNT)' .env")
        new_config = stdout.read().decode('utf-8').strip()
        print(f"更新后配置:\n{new_config}")
        
        # 4. 重启 API 服务
        print("\n[4/4] 重启 API 服务...")
        stdin, stdout, stderr = client.exec_command(f"cd {REMOTE_DIR} && docker compose restart api")
        print(stdout.read().decode('utf-8'))
        
        # 等待服务启动
        import time
        print("等待服务启动...")
        time.sleep(10)
        
        # 检查服务状态
        stdin, stdout, stderr = client.exec_command(f"cd {REMOTE_DIR} && docker compose ps api")
        print(stdout.read().decode('utf-8'))
        
        print("\n" + "=" * 60)
        print("✅ 配置更新完成！")
        print("=" * 60)
        print("\n请让客户重新测试：")
        print("1. 在 H5 订单详情页点击'去实名认证'")
        print("2. 完成人脸认证后")
        print("3. 管理员在后台点击'生成合同'")
        
    finally:
        client.close()

if __name__ == "__main__":
    main()

