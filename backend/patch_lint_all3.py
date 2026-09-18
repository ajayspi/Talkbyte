with open('backend/app/services/livekit_agent.py', 'r') as f:
    text = f.read()
text = "import os\n" + text
with open('backend/app/services/livekit_agent.py', 'w') as f:
    f.write(text)

with open('backend/app/workers/celery_app.py', 'r') as f:
    text = f.read()
text = text.replace("    from config import config\n", "")
with open('backend/app/workers/celery_app.py', 'w') as f:
    f.write(text)
