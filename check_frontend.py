import paramiko

host = "172.236.176.251"
username = "root"
password = "9700675637Ajkk!@"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=username, password=password, timeout=10)

stdin, stdout, stderr = ssh.exec_command("docker ps -a | grep frontend")
print("=== PS ===")
print(stdout.read().decode())

stdin, stdout, stderr = ssh.exec_command("docker logs moneyprinterturbo-frontend-1")
import sys
sys.stdout.reconfigure(encoding='utf-8')

print("=== LOGS ===")
print(stdout.read().decode('utf-8', errors='ignore'))
print(stderr.read().decode('utf-8', errors='ignore'))

ssh.close()
