import re

dark_html = open('.claude/talkbyte-homepage.html', encoding='utf-8').read()
light_html = open('.claude/talkbyte-light.html', encoding='utf-8').read()

# 1. Extract only the :root block from light_html
root_match = re.search(r':root\s*\{[^}]+\}', light_html)
if root_match:
    light_root = root_match.group(0)
    # Replace ONLY the :root block in dark_html
    dark_html = re.sub(r':root\s*\{[^}]+\}', light_root, dark_html, count=1)

# 2. Extract the globe-canvas CSS and append it to the style block
globe_css_match = re.search(r'#globe-canvas\s*\{[^}]+\}', light_html)
if globe_css_match:
    globe_css = globe_css_match.group(0)
    dark_html = dark_html.replace('</style>', f'\n{globe_css}\n</style>')

# 3. Map old dark variables to new light variables in the inline HTML styles
dark_html = dark_html.replace('var(--base-dark)', 'var(--base-d)')
dark_html = dark_html.replace('var(--base-light)', 'var(--base-l)')
dark_html = dark_html.replace('var(--shadow-up)', 'var(--fu)')
dark_html = dark_html.replace('var(--shadow-dn)', 'var(--fd)')
dark_html = dark_html.replace('var(--violet)', 'var(--v)')
dark_html = dark_html.replace('var(--violet-dark)', 'var(--v3)')
dark_html = dark_html.replace('var(--dim)', 'rgba(0,0,0,0.5)')
dark_html = dark_html.replace('color: #fff', 'color: var(--t)')
dark_html = dark_html.replace('color:#fff', 'color:var(--t)')

# Fix hardcoded text colors in dark HTML that assume a dark background
dark_html = dark_html.replace('color:#fff', 'color:var(--t)')
dark_html = dark_html.replace('color:rgba(255,255,255,0.7)', 'color:var(--dim)')
dark_html = dark_html.replace('background:rgba(255,255,255,0.03)', 'background:var(--base-d)')

# 4. Extract globe and inject it
globe_html = '<canvas id="globe-canvas" class="rv"></canvas>'
# Inject it into hero-right
dark_html = dark_html.replace('<div class="hero-right">', f'<div class="hero-right">\n{globe_html}')

# Add three.js script
if '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>' not in dark_html:
    dark_html += '\n<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>\n'

# Add globe JS
js_match = re.search(r'/\* ✨✨ THREE\.JS GLOBE ✨✨ \*/.*?(?=\n</script>)', light_html, re.DOTALL)
if js_match:
    globe_js = js_match.group(0)
    dark_html += f'<script>\n{globe_js}\ndocument.addEventListener("DOMContentLoaded", initGlobe);\n</script>\n'

# 5. Fix charset and close tags if missing
if '<meta charset="utf-8">' not in dark_html:
    dark_html = dark_html.replace('<title>', '<meta charset="utf-8">\n<title>')

open('frontend/public/landing.html', 'w', encoding='utf-8').write(dark_html)
print("Correctly generated hybrid light HTML.")
