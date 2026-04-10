# -*- coding: utf-8 -*-
import paramiko
import tarfile
import os
import io
import sys
import time
import subprocess

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

HOST = '47.120.27.110'
USER = 'root'
PASSWD = 'Alymima1!'
REPO = os.path.dirname(os.path.abspath(__file__))

def run_ssh(ssh, cmd, timeout=600, show=True):
    if show:
        print(f'  > {cmd[:80]}...')
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    code = stdout.channel.recv_exit_status()
    if show and out:
        for line in out.split('\n')[:5]:
            print(f'    {line}')
    return out, err, code

def create_api_archive():
    buf = io.BytesIO()
    src = os.path.join(REPO, 'services', 'api')
    skip = {'target', '.git', 'node_modules', '.idea'}
    with tarfile.open(fileobj=buf, mode='w:gz') as tar:
        for root, dirs, files in os.walk(src):
            dirs[:] = [d for d in dirs if d not in skip]
            for f in files:
                fp = os.path.join(root, f)
                tar.add(fp, arcname=os.path.relpath(fp, src))
    buf.seek(0)
    return buf

def archive_dist(dist_path):
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode='w:gz') as tar:
        for root, dirs, files in os.walk(dist_path):
            for f in files:
                fp = os.path.join(root, f)
                tar.add(fp, arcname=os.path.relpath(fp, dist_path))
    buf.seek(0)
    return buf

def main():
    print('='*50)
    print('EV Lease - Deploy deposit fix')
    print('='*50)

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        print('[1/5] Connecting & uploading API source...')
        ssh.connect(HOST, username=USER, password=PASSWD, timeout=15)
        print(f'  Connected to {HOST}')

        archive = create_api_archive()
        sftp = ssh.open_sftp()
        sftp.putfo(archive, '/opt/evlease/api-source-new.tar.gz')
        print('  API source uploaded')

        run_ssh(ssh, 'rm -rf /opt/evlease/api-source && mkdir -p /opt/evlease/api-source')
        run_ssh(ssh, 'cd /opt/evlease && tar -xzf api-source-new.tar.gz -C api-source')
        print('  Extracted')

        print('[2/5] Building JAR on server (2-3 min)...')
        out, err, code = run_ssh(ssh, 'cd /opt/evlease/api-source && mvn clean package -DskipTests -q 2>&1', timeout=600)
        if code != 0:
            print(f'  BUILD FAILED: {err[:300]}')
            print(f'  OUT: {out[:300]}')
            return
        print('  JAR built OK')

        run_ssh(ssh, 'cp /opt/evlease/api-source/target/installment-api-*.jar /opt/evlease/artifacts/installment-api.jar')
        print('  JAR copied to artifacts')

        print('[3/5] Restarting API container...')
        run_ssh(ssh, 'cd /opt/evlease && docker compose restart api')
        print('  Waiting 30s for startup...')
        time.sleep(30)

        out, _, _ = run_ssh(ssh, 'curl -s http://localhost:8080/actuator/health 2>/dev/null', show=False)
        if 'UP' in out:
            print('  API is healthy!')
        else:
            print(f'  API status: {out[:100]}')

        print('[4/6] Uploading H5 frontend...')
        try:
            h5_dist = os.path.join(REPO, 'apps', 'h5', 'dist')
            h5_archive = archive_dist(h5_dist)
            sftp.putfo(h5_archive, '/opt/evlease/h5-dist-new.tar.gz')
            run_ssh(ssh, 'rm -rf /opt/evlease/h5-dist-tmp && mkdir -p /opt/evlease/h5-dist-tmp')
            run_ssh(ssh, 'cd /opt/evlease && tar -xzf h5-dist-new.tar.gz -C h5-dist-tmp')
            run_ssh(ssh, 'rm -rf /opt/evlease/artifacts/h5 && mv /opt/evlease/h5-dist-tmp /opt/evlease/artifacts/h5')
            run_ssh(ssh, 'cd /opt/evlease && docker compose restart nginx-h5')
            print('  H5 deployed & nginx restarted')
        except Exception as e:
            print(f'  H5 upload failed: {e}')

        print('[5/6] Uploading Admin frontend...')
        try:
            admin_dist = os.path.join(REPO, 'apps', 'admin', 'dist')
            admin_archive = archive_dist(admin_dist)
            sftp.putfo(admin_archive, '/opt/evlease/admin-dist-new.tar.gz')
            run_ssh(ssh, 'rm -rf /opt/evlease/admin-dist-tmp && mkdir -p /opt/evlease/admin-dist-tmp')
            run_ssh(ssh, 'cd /opt/evlease && tar -xzf admin-dist-new.tar.gz -C admin-dist-tmp')
            run_ssh(ssh, 'rm -rf /opt/evlease/artifacts/admin && mv /opt/evlease/admin-dist-tmp /opt/evlease/artifacts/admin')
            run_ssh(ssh, 'cd /opt/evlease && docker compose restart nginx-admin')
            print('  Admin deployed & nginx restarted')
        except Exception as e:
            print(f'  Admin upload failed: {e}')

        print('[6/6] Recalculating repayment plans...')
        out, _, code = run_ssh(ssh, '''
TOKEN=$(curl -s -X POST http://localhost:8080/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then echo "LOGIN_FAILED"; exit 1; fi

# Find all orders with broken plans (period with amount=0)
ORDERS=$(curl -s http://localhost:8080/api/admin/orders -H "Authorization: Bearer $TOKEN" 2>/dev/null | \
  python3 -c "
import sys, json
data = json.load(sys.stdin)
items = data if isinstance(data, list) else data.get('content', data.get('data', []))
for o in items:
    plan = o.get('repaymentPlan', [])
    if any(p.get('amount', 1) <= 0 for p in plan):
        print(o['id'])
" 2>/dev/null)

if [ -z "$ORDERS" ]; then
  echo "NO_BROKEN_ORDERS"
else
  for OID in $ORDERS; do
    RESULT=$(curl -s -X POST "http://localhost:8080/api/admin/orders/$OID/generate-plan?force=true" \
      -H "Authorization: Bearer $TOKEN" 2>/dev/null)
    echo "Recalculated: $OID -> $RESULT"
  done
fi
''', timeout=60)
        print(f'  {out}')

        sftp.close()
        print('\nDeploy complete!')

    finally:
        ssh.close()
        print('SSH connection released.')

if __name__ == '__main__':
    main()
