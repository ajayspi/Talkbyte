import re

dark_html = open('.claude/talkbyte-homepage.html', encoding='utf-8').read()
light_tokens = """
  /* Surfaces - bright white neumorphism */
  --base:   #f0eeff;
  --base-l: #f8f6ff;
  --base-d: #e4e0f5;
  --fu:     rgba(255,255,255,0.85);
  --fd:     rgba(160,140,210,0.35);

  /* Brand */
  --v:      #7c3aed;
  --v2:     #6d28d9;
  --v3:     #4c1d95;
  --vl:     #a78bfa;
  --vg:     rgba(124,58,237,.2);

  /* Accents */
  --pk:     #ec4899;
  --bl:     #3b82f6;
  --gr:     #10b981;
  --or:     #f59e0b;
  --rd:     #ef4444;

  /* Typography - Dark mode text */
  --t:      #1e1b4b;
  --ts:     #4c1d95;
  --tm:     #6d28d9;
  
  --br:     8px;
  --bs:     -8px -8px 24px var(--fu), 8px 8px 24px var(--fd);
  --bsi:    inset -4px -4px 12px var(--fu), inset 4px 4px 12px var(--fd);
  --bsh:    -12px -12px 32px var(--fu), 12px 12px 32px var(--fd);
  --tr:     all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
"""

# Replace the :root tokens
new_html = re.sub(r':root\s*\{[^}]+\}', f":root {{\n{light_tokens}\n}}", dark_html, count=1)

# Add meta charset
if '<meta charset="utf-8">' not in new_html:
    new_html = new_html.replace('<title>', '<meta charset="utf-8">\n<title>')

open('frontend/public/landing.html', 'w', encoding='utf-8').write(new_html)
