#!/usr/bin/env python3
"""Keeps the parts every page shares in step: the head snippet, the sidebar,
the "All cases / Next" links at the top of a case and the pager at the bottom.

Edit the lists below (order of cases, names, jobs), then run from the repo root:

    python3 tools/sync.py

The order of CASES is the order used everywhere: sidebar, home page pager, "Next" links.
This folder is not published (see .vercelignore).
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = 'https://elvin-garaev-portfolio.vercel.app'

CASES = [
    dict(slug='ukrsibbank', nav='Omnichannel CRM', icon='ukrsib', co='UKRSIBBANK', c='40, 170, 110',
         pager=('UKRSIBBANK', 'Omnichannel CRM'), crumb='UKRSIBBANK CRM',
         thumb=('images/cases/ukrsib-crm.jpg', 1200, 760, True)),
    dict(slug='ifreq', nav='IFREQ Football', icon='ifreq', co='IFREQ', c='165, 175, 55',
         pager=('IFREQ Football', 'Mobile App and Dashboard'), crumb='IFREQ Football',
         thumb=('images/cases/ifreq/app-card.jpg', 387, 841, False)),
    dict(slug='safe', nav='Banking Safe', icon='safe', co='UKRSIBBANK', c='25, 150, 160',
         pager=('Banking Safe', 'Goal Based Savings'), crumb='Banking Safe',
         thumb=('images/cases/safe-goal.jpg', 360, 779, False)),
    dict(slug='p3-wealth', nav='P3 Wealth', icon='p3-wealth', co='BARVA.TECH', c='130, 95, 220',
         pager=('P3 Wealth × BlackRock', 'Capital Management'), crumb='P3 Wealth',
         thumb=('images/cases/p3-wealth.jpg', 1100, 688, True)),
    dict(slug='p3-marine', nav='P3 Marine', icon='p3-marine', co='BARVA.TECH', c='55, 150, 235',
         pager=('P3 Marine', 'Yacht Management Platform'), crumb='P3 Marine',
         thumb=('images/cases/p3-marine.jpg', 1100, 688, True)),
    dict(slug='xgo', nav='XGo Wallet', icon='xgo', co='Milli Digital', c='255, 140, 185',
         pager=('XGo Wallet', 'Crypto and Fiat Mobile Wallet'), crumb='XGo Wallet',
         thumb=('images/cases/xgo-wallet.jpg', 360, 752, False)),
    dict(slug='cryptoswift', nav='CryptoSwift', icon='cryptoswift', co='BARVA.TECH', c='70, 90, 230',
         pager=('CryptoSwift', 'Merchant Payment Platform'), crumb='CryptoSwift',
         thumb=('images/cases/cryptoswift-new-sale.jpg', 860, 621, True)),
]

# the sidebar: companies, and under each one its projects as plain text
GROUPS = [
    ('UKRSIBBANK', 'ukrsib', [('ukrsibbank', 'Omnichannel CRM'), ('safe', 'Banking Safe')]),
    ('IFREQ', 'ifreq', [('ifreq', 'Football App and Dashboard')]),
    ('BARVA.TECH', 'barva', [('p3-wealth', 'P3 Wealth × BlackRock'), ('p3-marine', 'P3 Marine'), ('cryptoswift', 'CryptoSwift')]),
    ('Milli Digital', 'milli', [('xgo', 'XGo Wallet')]),
]

EMAIL = 'e.garaev.dg55@gmail.com'
LINKEDIN = 'https://www.linkedin.com/in/elvin-garaev-4798ba255/'
TELEGRAM = 'https://t.me/el13xx'

IC_AI = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M11 4c.6 4.3 2.7 6.4 7 7-4.3.6-6.4 2.7-7 7-.6-4.3-2.7-6.4-7-7 4.3-.6 6.4-2.7 7-7Z"/><path d="M18.5 15.2c.25 1.6.95 2.3 2.5 2.55-1.55.25-2.25.95-2.5 2.55-.25-1.6-.95-2.3-2.5-2.55 1.55-.25 2.25-.95 2.5-2.55Z"/></svg>'
IC_XP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M9 7h11M9 12h11M9 17h11"/><circle cx="4.8" cy="7" r=".9"/><circle cx="4.8" cy="12" r=".9"/><circle cx="4.8" cy="17" r=".9"/></svg>'
IC_LIGHT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/></svg>'
IC_DARK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg>'

def head_script(page):
    return '<script src="%stheme.js"></script>' % ('' if page == 'home' else '../')


def sidebar(page):
    """page: 'home', 'ai' (the AI project page) or a case slug."""
    home = page == 'home'
    p = '' if home else '../'
    top = '#top' if home else '../'
    anchor = (lambda a: '#' + a) if home else (lambda a: '../#' + a)
    case_href = (lambda s: 'work/' + s) if home else (lambda s: s)

    out = ['<aside class="sidebar" id="sidebar" aria-label="Site navigation">', '  <div class="side-scroll">']
    on = ' on" aria-current="page' if home else ''
    out.append('    <a class="item%s" href="%s"><span class="mark">EG</span>Home</a>' % (on, top))
    out.append('    <div class="side-label">Cases</div>')
    for name, icon, items in GROUPS:
        out.append('    <details class="group" open>')
        out.append('      <summary><img src="%simages/icons/%s.png" alt="" width="20" height="20">%s<i class="chev"></i></summary>' % (p, icon, name))
        out.append('      <div class="sub">')
        for slug, label in items:
            on = ' class="on" aria-current="page"' if slug == page else ''
            out.append('        <a href="%s"%s>%s</a>' % (case_href(slug), on, label))
        out.append('      </div>')
        out.append('    </details>')
    out.append('    <div class="side-gap"></div>')
    on = ' on" aria-current="page' if page == 'ai' else ''
    out.append('    <a class="item%s" href="%s">%sAI in my work</a>' % (on, anchor('ai'), IC_AI))
    out.append('    <a class="item" href="%s">%sExperience</a>' % (anchor('experience'), IC_XP))
    out.append('  </div>')
    out.append('')
    out.append('  <div class="theme" role="group" aria-label="Color theme">')
    out.append('    <button type="button" data-set="light" aria-pressed="false">%sLight</button>' % IC_LIGHT)
    out.append('    <button type="button" data-set="dark" aria-pressed="true">%sDark</button>' % IC_DARK)
    out.append('  </div>')
    out.append('')
    out.append('  <div class="profile">')
    out.append('    <div class="pop" id="pop" hidden>')
    out.append('      <button type="button" id="open-about"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 20c.9-3.6 3.7-5.6 7.2-5.6s6.3 2 7.2 5.6"/></svg>About</button>')
    out.append('      <div class="sep"></div>')
    out.append('      <a class="mail" href="mailto:%s"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="m4.5 7 7.5 6 7.5-6"/></svg><span>Email<small>%s</small></span></a>' % (EMAIL, EMAIL))
    out.append('      <a href="%s" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="3.5"/><path d="M8 10.5V16M8 7.6v.1M11.5 16v-5.5M11.5 13c0-1.6 1-2.6 2.4-2.6s2.1.9 2.1 2.6V16"/></svg>LinkedIn<span class="ext" aria-hidden="true">↗</span></a>' % LINKEDIN)
    out.append('      <a href="%s" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 4.5 3.8 11.1c-.8.3-.8 1.4 0 1.7l4.1 1.4 1.6 4.9c.2.7 1.1.9 1.6.4l2.3-2.2 4.2 3.1c.6.4 1.4.1 1.6-.6L21.6 5.6c.2-.8-.4-1.4-1.1-1.1Z"/><path d="m8 14.2 9-6.6"/></svg>Telegram<span class="ext" aria-hidden="true">↗</span></a>' % TELEGRAM)
    out.append('    </div>')
    out.append('    <button class="me" type="button" id="me" aria-expanded="false" aria-controls="pop">')
    out.append('      <img src="%simages/elvin/avatar.jpg" alt="" width="40" height="40"><span class="who"><b>Elvin Garaev</b><small>Senior Product Designer</small></span><svg class="updown" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 6 3-3 3 3M5 10l3 3 3-3"/></svg>' % p)
    out.append('    </button>')
    out.append('  </div>')
    out.append('</aside>')
    return '\n'.join(out)


def thumb(c):
    src, w, h, wide = c['thumb']
    return '<span class="pg-th%s" aria-hidden="true"><img src="../%s" alt="" width="%d" height="%d"></span>' % (' wide' if wide else '', src, w, h)


def pager(prev, nxt, next_label='Next case'):
    out = ['<nav class="pager rv" aria-label="More cases">']
    if prev is None:
        out += ['    <a class="pg pg-prev" href="../#cases">',
                '      <span><span class="pg-l"><svg><use href="#i-back"/></svg>All cases</span><b>Back to the overview</b></span>',
                '    </a>']
    else:
        out += ['    <a class="pg pg-prev" style="--c: %s" href="%s">' % (prev['c'], prev['slug']),
                '      ' + thumb(prev),
                '      <span><span class="pg-l"><svg><use href="#i-back"/></svg>Previous case</span><b>%s<br>%s</b></span>' % prev['pager'],
                '    </a>']
    out += ['    <a class="pg pg-next" style="--c: %s" href="%s">' % (nxt['c'], nxt['slug']),
            '      <span><span class="pg-l">%s<svg><use href="#i-next"/></svg></span><b>%s<br>%s</b></span>' % ((next_label,) + nxt['pager']),
            '      ' + thumb(nxt),
            '    </a>',
            '  </nav>']
    return '\n'.join(out)


def crumbs(back_href, back_label, nxt, next_label=None):
    return ('<nav class="crumbs" aria-label="Case navigation"><a href="%s"><svg><use href="#i-back"/></svg>%s</a>'
            '<a href="%s">Next: %s<svg><use href="#i-next"/></svg></a></nav>') % (back_href, back_label, nxt['slug'], next_label or nxt['crumb'])


def sub_once(pattern, repl, text, name, flags=0):
    new, n = re.subn(pattern, lambda m: repl, text, count=0, flags=flags)
    if n != 1:
        sys.exit('%s: expected exactly one match, found %d' % (name, n))
    return new


def process(path, page, canonical, og_image):
    f = os.path.join(ROOT, path)
    s = open(f, encoding='utf-8').read()
    name = lambda what: '%s (%s)' % (path, what)

    s = sub_once(r'<script>\s*document\.documentElement\.classList\.add\(\'js\'\);[\s\S]*?</script>|<script src="(?:\.\./)?theme\.js"></script>',
                 head_script(page), s, name('head script'))
    s = sub_once(r'<meta name="color-scheme" content="[^"]*">', '<meta name="color-scheme" content="dark light">', s, name('color-scheme'))
    s = sub_once(r'<meta property="og:image" content="[^"]*">', '<meta property="og:image" content="%s%s">' % (SITE, og_image), s, name('og:image'))
    s = re.sub(r'\n\s*<link rel="canonical" href="[^"]*">', '', s)
    m = re.search(r'<meta name="description" content="[^"]*">', s)
    if not m:
        sys.exit(name('description') + ': not found')
    s = s[:m.end()] + '\n  <link rel="canonical" href="%s%s">' % (SITE, canonical) + s[m.end():]

    s = sub_once(r'<aside class="sidebar"[\s\S]*?</aside>(?:\n<script>[^\n]*eg-xp[^\n]*</script>)?', sidebar(page), s, name('sidebar'))

    if page not in ('home',):
        if page == 'ai':
            ifreq = next(c for c in CASES if c['slug'] == 'ifreq')
            s = sub_once(r'<nav class="crumbs"[^\n]*</nav>', crumbs('../#ai', 'AI in my work', ifreq, 'IFREQ'), s, name('crumbs'))
            s = sub_once(r'<nav class="pager rv"[\s\S]*?</nav>', pager(ifreq, CASES[0]), s, name('pager'))
        else:
            i = [c['slug'] for c in CASES].index(page)
            last = i == len(CASES) - 1
            nxt = CASES[(i + 1) % len(CASES)]
            s = sub_once(r'<nav class="crumbs"[^\n]*</nav>', crumbs('../#cases', 'All cases', nxt), s, name('crumbs'))
            s = sub_once(r'<nav class="pager rv"[\s\S]*?</nav>',
                         pager(CASES[i - 1] if i else None, nxt, 'Back to the first case' if last else 'Next case'), s, name('pager'))
    open(f, 'w', encoding='utf-8').write(s)


def sitemap():
    urls = [SITE + '/'] + [SITE + '/work/' + c['slug'] for c in CASES] + [SITE + '/work/morning-brief']
    body = '\n'.join('  <url><loc>%s</loc></url>' % u for u in urls)
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n%s\n</urlset>\n' % body
    open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf-8').write(xml)


if __name__ == '__main__':
    process('index.html', 'home', '/', '/og-image.jpg')
    for c in CASES:
        process('work/%s.html' % c['slug'], c['slug'], '/work/' + c['slug'], '/images/og/%s.jpg' % c['slug'])
    process('work/morning-brief.html', 'ai', '/work/morning-brief', '/images/og/morning-brief.jpg')
    sitemap()
    print('synced %d pages' % (len(CASES) + 2))
