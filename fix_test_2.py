import re

with open("frontend/__tests__/admin-panel.test.tsx", "r") as f:
    content = f.read()

# Fix Deepgram Flux
content = content.replace("expect(screen.getByText(/Deepgram Flux/i)).toBeInTheDocument();", "expect(screen.getAllByText(/Deepgram Flux/i)[0]).toBeInTheDocument();")

with open("frontend/__tests__/admin-panel.test.tsx", "w") as f:
    f.write(content)
