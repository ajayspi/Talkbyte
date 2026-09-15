import re

with open('.claude/talkbyte-light.html', 'r', encoding='utf-8') as f:
    html = f.read()

print("Sections:")
for match in re.finditer(r'<section.*?id="([^"]+)"', html):
    print("-", match.group(1))

print("\nData placeholders:")
for match in re.finditer(r'<div class="stat-num"[^>]*>([^<]+)</div>', html):
    print("-", match.group(1))
