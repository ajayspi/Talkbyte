import re

with open('frontend/public/landing.html', 'r', encoding='utf-8') as f:
    html = f.read()

match = re.search(r'(<section[^>]*id="demo"[^>]*>.+?</section>)', html, re.DOTALL)
if match:
    with open('demo_section.txt', 'w', encoding='utf-8') as out:
        out.write(match.group(1))
else:
    print("Not found")
