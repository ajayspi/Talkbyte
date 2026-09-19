with open('frontend/public/landing.html', 'r', encoding='utf-8') as f:
    html = f.read()

if '<meta charset="utf-8">' not in html:
    html = '<meta charset="utf-8">\n' + html

with open('frontend/public/landing.html', 'w', encoding='utf-8') as f:
    f.write(html)
