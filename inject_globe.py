import re

light_html = open('.claude/talkbyte-light.html', encoding='utf-8').read()
landing_html = open('frontend/public/landing.html', encoding='utf-8').read()

# Get globe CSS
globe_css_match = re.search(r'#globe-canvas\{[^}]+\}', light_html)
globe_css = globe_css_match.group(0) if globe_css_match else ''

# Inject globe CSS
if '#globe-canvas' not in landing_html:
    landing_html = landing_html.replace('</style>', f'{globe_css}\n</style>')

# Inject canvas into hero right side
# In talkbyte-homepage.html, hero right is: <div class="hero-right"><div class="logo-orb">
if '<canvas id="globe-canvas"' not in landing_html:
    # Instead of replacing logo-orb, let's add it in the hero-right container
    # The user said "revolving globe is good but only need one move to here in the image right side lot of gap"
    landing_html = landing_html.replace('<div class="hero-right">', '<div class="hero-right">\n<canvas id="globe-canvas" class="rv"></canvas>\n')
    
# Extract globe JS
js_match = re.search(r'/\* ✨✨ THREE\.JS GLOBE ✨✨ \*/.*?(?=\n</script>)', light_html, re.DOTALL)
if js_match and 'THREE.JS GLOBE' not in landing_html:
    globe_js = js_match.group(0)
    landing_html = landing_html.replace('</body>', f'<script>\n{globe_js}\n</script>\n</body>')

open('frontend/public/landing.html', 'w', encoding='utf-8').write(landing_html)
print("Injected globe.")
