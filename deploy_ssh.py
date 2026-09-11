import paramiko
import sys
import os
import shutil

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
    print("Zipping local repository (excluding node_modules)...")
    os.system("tar.exe -caf talkbyte_deploy.zip --exclude=frontend/node_modules --exclude=frontend/.next --exclude=backend/__pycache__ --exclude=.git *")
    
    print(f"Connecting to {host}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, username=username, password=password, timeout=10)
    print("Connected successfully!")
    
    # Upload via SFTP
    print("Uploading zip file...")
    sftp = ssh.open_sftp()
    sftp.put('talkbyte_deploy.zip', '/root/talkbyte_deploy.zip')
    sftp.close()
    
    print("Unzipping and deploying...")
    run_ssh_command(ssh, "apt-get update && apt-get install -y unzip")
    run_ssh_command(ssh, "rm -rf /root/MoneyPrinterTurbo")
    run_ssh_command(ssh, "mkdir -p /root/MoneyPrinterTurbo")
    run_ssh_command(ssh, "unzip -o -q /root/talkbyte_deploy.zip -d /root/MoneyPrinterTurbo")
    
    print("Running docker compose up...")
    run_ssh_command(ssh, "cd /root/MoneyPrinterTurbo && docker compose pull && docker compose up -d --build")
    
    print("Deployment triggered successfully!")
    ssh.close()
    
except Exception as e:
    print(f"Connection failed: {e}")
