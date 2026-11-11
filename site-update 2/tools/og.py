#!/usr/bin/env python3
"""Draws the link preview images (the picture LinkedIn, Telegram or Slack show next to a link):
og-image.jpg for the home page and images/og/<page>.jpg for every case.

Needs Python with Playwright, Pillow and the Inter font, plus the site running locally:

    python3 tools/og.py http://127.0.0.1:8765

Edit the texts in PAGES below, run it again and upload the new pictures.
This folder is not published.
"""
import io
import os
import sys

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = sys.argv[1].rstrip('/') if len(sys.argv) > 1 else 'http://127.0.0.1:8765'

# slug, accent colour, label, title, subtitle, picture, picture is a desktop screen (True) or a phone (False)
PAGES = [
    ('ukrsibbank', '40, 170, 110', 'UKRSIBBANK, BNP Paribas Group', 'Omnichannel CRM',
     'One secure panel for every client conversation', 'images/cases/ukrsib-crm.jpg', True),
    ('ifreq', '165, 175, 55', 'IFREQ, Brussels', 'IFREQ Football',
     'From a test day to a pro club trial', 'images/cases/ifreq-player-card.jpg', False),
    ('safe', '25, 150, 160', 'UKRSIBBANK, BNP Paribas Group', 'Banking Safe',
     'Saving with a name, a goal and a date', 'images/cases/safe-goal.jpg', False),
    ('p3-wealth', '130, 95, 220', 'BARVA.TECH, London', 'P3 Wealth × BlackRock',
     'A capital management platform, built from zero', 'images/cases/p3-wealth.jpg', True),
    ('p3-marine', '55, 150, 235', 'BARVA.TECH, London', 'P3 Marine',
     'From spreadsheets and chats to one platform', 'images/cases/p3-marine.jpg', True),
    ('xgo', '255, 140, 185', 'Milli Digital', 'XGo Wallet',
     'A cold wallet that feels like a bank app', 'images/cases/xgo-wallet.jpg', False),
    ('cryptoswift', '70, 90, 230', 'BARVA.TECH, London', 'CryptoSwift',
     'Crypto payments for merchants who don’t speak crypto', 'images/cases/cryptoswift-new-sale.jpg', True),
    ('morning-brief', '240, 150, 80', 'AI in my work', 'Morning brief in Slack',
     'A different message for every finance role', 'images/ai/morning-brief.webp', True),
]

CSS = """
* { box-sizing: border-box; margin: 0; }
html, body { width: 1200px; height: 630px; overflow: hidden; }
body { position: relative; background: #10100f; color: #faf9f5; font-family: Inter, sans-serif; -webkit-font-smoothing: antialiased; }
.glow { position: absolute; inset: 0; background: radial-gradient(620px 300px at 50% -40px, rgba(255, 255, 255, 0.22), transparent 70%); }
.tint { position: absolute; inset: 0; background: radial-gradient(760px 560px at 100% 60%, rgba(var(--c), 0.34), transparent 70%); }
.who { position: absolute; left: 80px; top: 76px; display: flex; align-items: center; gap: 16px; }
.who img { width: 60px; height: 60px; border-radius: 50%; }
.who b { display: block; font-size: 23px; font-weight: 600; letter-spacing: -0.01em; }
.who span { display: block; margin-top: 3px; font-size: 19px; color: rgba(250, 249, 245, 0.56); }
h1 { position: absolute; left: 80px; font-weight: 600; letter-spacing: -0.035em; }
h1 em { font-style: normal; display: block; }
.chips { position: absolute; left: 80px; bottom: 66px; display: flex; gap: 12px; }
.chips i { font-style: normal; height: 50px; padding: 0 20px; border-radius: 999px; display: grid; place-items: center; font-size: 20px;
  color: rgba(250, 249, 245, 0.86); background: rgba(255, 255, 255, 0.06); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12); }

.home h1 { top: 212px; font-size: 62px; line-height: 74px; }
.home h1 em { background: linear-gradient(100deg, #f0b48a 0%, #e98b6f 34%, #dc6c98 62%, #9d86e8 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
.home h1 span { background: linear-gradient(100deg, #f0b48a, #e98b6f); -webkit-background-clip: text; background-clip: text; color: transparent; }

.case h1 { top: 214px; width: 560px; font-size: 58px; line-height: 66px; text-wrap: balance; }
.case.tall h1 { width: 660px; }
.case h1 em { margin-top: 14px; font-size: 34px; line-height: 43px; font-weight: 500; letter-spacing: -0.02em; color: rgb(var(--c)); filter: brightness(1.35) saturate(0.85); }
.pic { position: absolute; overflow: hidden; background: #1e1e1d; box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1), 0 40px 90px rgba(0, 0, 0, 0.55); }
.pic img { display: block; width: 100%; }
.pic.wide { left: 690px; top: 112px; width: 640px; height: 420px; border-radius: 18px; }
.pic.wide img { height: 100%; object-fit: cover; object-position: left top; }
.pic.tall { left: 800px; top: 62px; width: 290px; height: 640px; border-radius: 34px; }
"""


def home():
    return """<body class="home" style="--c: 216, 87, 77"><div class="glow"></div>
<div class="who"><img src="%s/images/elvin/avatar.jpg"><div><b>Elvin Garaev</b><span>Senior Product Designer</span></div></div>
<h1>Hi, I’m <span>Elvin</span>, a Product Designer<em>I turn business problems<br>into simple products</em></h1>
<div class="chips"><i>5+ years</i><i>Banking app for 2M+ users</i><i>UKRSIBBANK, BNP Paribas Group</i></div>
</body>""" % BASE


def case(slug, c, label, title, sub, pic, wide):
    return """<body class="case%s" style="--c: %s"><div class="glow"></div><div class="tint"></div>
<div class="who"><img src="%s/images/elvin/avatar.jpg"><div><b>Elvin Garaev</b><span>Senior Product Designer</span></div></div>
<h1>%s<em>%s</em></h1>
<div class="chips"><i>%s</i><i>%s</i></div>
<div class="pic %s"><img src="%s/%s"></div>
</body>""" % ('' if wide else ' tall', c, BASE, title, sub, 'Concept' if slug == 'morning-brief' else 'Case study', label,
              'wide' if wide else 'tall', BASE, pic)


def render(page, body, out):
    page.set_content('<!doctype html><meta charset="utf-8"><style>%s</style>%s' % (CSS, body), wait_until='load')
    page.wait_for_timeout(250)
    png = page.screenshot(type='png')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    Image.open(io.BytesIO(png)).convert('RGB').save(out, quality=86, optimize=True, progressive=True)
    print('%-34s %3d KB' % (os.path.relpath(out, ROOT), os.path.getsize(out) // 1024))


with sync_playwright() as pw:
    args = {'executable_path': '/usr/bin/google-chrome'} if os.path.exists('/usr/bin/google-chrome') else {}
    b = pw.chromium.launch(args=['--no-sandbox'], **args)
    pg = b.new_context(viewport={'width': 1200, 'height': 630}, device_scale_factor=1).new_page()
    render(pg, home(), os.path.join(ROOT, 'og-image.jpg'))
    for p in PAGES:
        render(pg, case(*p), os.path.join(ROOT, 'images', 'og', p[0] + '.jpg'))
    b.close()
