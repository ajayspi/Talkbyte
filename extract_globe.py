import re

html = open('.claude/talkbyte-light.html', encoding='utf-8').read()

with open('globe_info.txt', 'w', encoding='utf-8') as f:
    f.write("Script tags:\n")
    for match in re.finditer(r'<script.*?>.*?</script>', html, re.DOTALL):
        f.write(match.group(0)[:100] + '\n')
    
    f.write("\nGlobe related:\n")
    for match in re.finditer(r'<div[^>]*globe[^>]*>.*?</div>', html, re.DOTALL):
        f.write(match.group(0)[:200] + '\n')
