import re

with open("frontend/__tests__/admin-panel.test.tsx", "r") as f:
    content = f.read()

# Fix 14,731 similar to 19,847
content = content.replace("expect(screen.getByText('14,731')).toBeInTheDocument();", "expect(screen.getAllByText('14,731')[0]).toBeInTheDocument();")

with open("frontend/__tests__/admin-panel.test.tsx", "w") as f:
    f.write(content)
