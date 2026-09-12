import requests
import time

headers = {
    "Authorization": "Bearer 0ac99a951df68cb4b0d57d3d0bd410354372f300f1a5790944f14f7b8b57bd2b",
    "Content-Type": "application/json"
}

def check_status():
    res = requests.get("https://api.linode.com/v4/linode/instances/104542559", headers=headers)
    return res.json().get("status")

print("Powering off...")
requests.post("https://api.linode.com/v4/linode/instances/104542559/shutdown", headers=headers)

while True:
    status = check_status()
    print(f"Status: {status}")
    if status == "offline":
        break
    time.sleep(5)

print("Resetting password...")
data = {"root_pass": "9700675637Ajkk!@"}
res = requests.post("https://api.linode.com/v4/linode/instances/104542559/password", headers=headers, json=data)
print(res.text)

print("Powering on...")
requests.post("https://api.linode.com/v4/linode/instances/104542559/boot", headers=headers)

while True:
    status = check_status()
    print(f"Status: {status}")
    if status == "running":
        break
    time.sleep(5)

print("Ready!")
