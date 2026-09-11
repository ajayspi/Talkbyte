import re

with open("backend/app/services/livekit_agent.py", "r") as f:
    code = f.read()

# Replace openai plugin with LiteLLM wrapper concept
code = code.replace("llm=openai.LLM(", "llm=openai.LLM(base_url=\"http://litellm:4000/v1\", ")

with open("backend/app/services/livekit_agent.py", "w") as f:
    f.write(code)
