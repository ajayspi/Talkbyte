import paramiko
import sys

host = "172.236.176.251"
username = "root"
password = "9700675637Ajkk!@"

def run_ssh_command(ssh, command):
    print(f"Running: {command}")
    stdin, stdout, stderr = ssh.exec_command(command)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', 'ignore').strip()
    err = stderr.read().decode('utf-8', 'ignore').strip()
    if out:
        print(f"STDOUT: {out}".encode('ascii', 'ignore').decode('ascii'))
    if err:
        print(f"STDERR: {err}".encode('ascii', 'ignore').decode('ascii'))
    return exit_status

try:
    print(f"Connecting to {host}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, username=username, password=password, timeout=10)
    print("Connected successfully!")
    
    print("Stopping and removing old containers...")
    run_ssh_command(ssh, "cd /root/MoneyPrinterTurbo && docker compose down")
    
    print("Setting up official Supabase Docker stack...")
    run_ssh_command(ssh, "rm -rf /root/supabase")
    run_ssh_command(ssh, "git clone --depth 1 https://github.com/supabase/supabase /root/supabase")
    
    setup_script = """
cd /root/supabase/docker
cp .env.example .env
sed -i 's|API_EXTERNAL_URL=http://localhost:8000|API_EXTERNAL_URL=http://talkbyte.172.236.176.251.nip.io:8000|g' .env
docker compose pull
docker compose up -d

echo "Waiting for PostgreSQL to be ready..."
sleep 20
cat /root/MoneyPrinterTurbo/backend/supabase_schema.sql | docker exec -i supabase-db psql -U postgres -d postgres || true
"""
    run_ssh_command(ssh, setup_script)
    
    print("Supabase stack deployment triggered!")
    ssh.close()
    
except Exception as e:
    print(f"Connection failed: {e}")
