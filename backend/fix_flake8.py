import os
import re
import subprocess

def run_cmd(cmd):
    return subprocess.check_output(cmd, shell=True, text=True)

files_to_fix = [
    "app/api/admin.py",
    "app/api/auth.py",
    "app/api/payments.py",
    "app/api/restaurants.py",
    "app/api/voice.py",
    "app/db/supabase.py",
    "app/models/call.py",
    "app/models/order.py",
    "app/services/livekit_agent.py",
    "app/services/logging.py",
    "app/services/pos/base.py",
    "app/services/pos/square.py",
    "app/services/rag.py",
    "app/services/secrets.py",
    "app/services/sms.py",
    "app/workers/celery_app.py",
    "tests/conftest.py",
    "tests/unit/test_config.py",
    "tests/unit/test_order_api.py",
]

# We will run autopep8 and autoflake
os.system("pip install autopep8 autoflake")

for f in files_to_fix:
    os.system(f"autoflake --in-place --remove-all-unused-imports --remove-unused-variables {f}")
    os.system(f"autopep8 --in-place --aggressive --aggressive {f}")
