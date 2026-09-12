import re

with open('frontend/public/landing.html', 'r', encoding='utf-8') as f:
    html = f.read()

html = re.sub(r'<button class="btn-neu">Log in</button>', '<a href="/admin" class="btn-neu" style="display:inline-flex;align-items:center;justify-content:center;text-decoration:none">Log in</a>', html)
html = re.sub(r'<button class="btn-glow">Get Started</button>', '<a href="/dashboard" class="btn-glow" style="display:inline-flex;align-items:center;justify-content:center;text-decoration:none">Get Started</a>', html)
html = re.sub(r'<button class="btn-glow" style="padding:14px 32px;font-size:14px">(.+?)</button>', r'<a href="/dashboard" class="btn-glow" style="padding:14px 32px;font-size:14px;display:inline-flex;align-items:center;justify-content:center;text-decoration:none">\1</a>', html)
html = re.sub(r'<button class="btn-neu" style="padding:14px 24px;font-size:14px;color:var\(--muted\)">(.+?)</button>', r'<a href="#demo" class="btn-neu" style="padding:14px 24px;font-size:14px;color:var(--muted);display:inline-flex;align-items:center;justify-content:center;text-decoration:none">\1</a>', html)
html = re.sub(r'<button class="btn-pc btn-pc-dark">Get Started</button>', '<a href="/dashboard" class="btn-pc btn-pc-dark" style="display:inline-flex;align-items:center;justify-content:center;text-decoration:none">Get Started</a>', html)
html = re.sub(r'<button class="btn-pc btn-pc-glow">Start Free Trial</button>', '<a href="/dashboard" class="btn-pc btn-pc-glow" style="display:inline-flex;align-items:center;justify-content:center;text-decoration:none">Start Free Trial</a>', html)
html = re.sub(r'<button class="btn-pc btn-pc-dark">Contact Sales</button>', '<a href="/contact" class="btn-pc btn-pc-dark" style="display:inline-flex;align-items:center;justify-content:center;text-decoration:none">Contact Sales</a>', html)
html = re.sub(r'<button class="btn-cta"><span>(.+?)</span></button>', r'<a href="/dashboard" class="btn-cta" style="display:inline-flex;align-items:center;justify-content:center;text-decoration:none"><span>\1</span></a>', html)

with open('frontend/public/landing.html', 'w', encoding='utf-8') as f:
    f.write(html)
