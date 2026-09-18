import re

with open("frontend/__tests__/admin-panel.test.tsx", "r") as f:
    content = f.read()

# Fix Taco Loco
content = content.replace("expect(screen.getByText(/Taco Loco/i)).toBeInTheDocument();", "expect(screen.getAllByText(/Taco Loco/i)[0]).toBeInTheDocument();")

with open("frontend/__tests__/admin-panel.test.tsx", "w") as f:
    f.write(content)
