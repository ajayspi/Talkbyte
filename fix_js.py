import re

html = open('frontend/public/landing.html', encoding='utf-8').read()

if 'three.min.js' not in html:
    html += '\n<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>\n'

light_html = open('.claude/talkbyte-light.html', encoding='utf-8').read()
js_match = re.search(r'/\* ✨✨ THREE\.JS GLOBE ✨✨ \*/.*?(?=\n</script>)', light_html, re.DOTALL)

if js_match and 'THREE.JS GLOBE' not in html:
    html += '<script>\n' + js_match.group(0) + '\ndocument.addEventListener("DOMContentLoaded", initGlobe);\n</script>\n</body>\n</html>'

open('frontend/public/landing.html', 'w', encoding='utf-8').write(html)
print("Appended JS.")
