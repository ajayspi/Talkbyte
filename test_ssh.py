import paramiko
import sys

host = "172.236.176.251"
password = "9700675637Ajkk"

usernames = ["root", "ubuntu", "admin", "debian", "vigilare"]

for username in usernames:
    try:
        print(f"Trying {username}...")
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(host, username=username, password=password, timeout=5, look_for_keys=False, allow_agent=False)
        print(f"Connected successfully as {username}!")
        ssh.close()
        break
    except Exception as e:
        print(f"Failed {username}: {e}")
