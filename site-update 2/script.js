(function () {
  if (location.protocol === 'file:') return;
  var skip = false;
  try {
    if (/[?&]notrack\b/.test(location.search)) localStorage.setItem('va-disable', '1');
    if (/[?&]track\b/.test(location.search)) localStorage.removeItem('va-disable');
    skip = !!localStorage.getItem('va-disable');
  } catch (e) {}
  try {
    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === 'Europe/Istanbul' || tz === 'Asia/Istanbul') skip = true;
  } catch (e) {}
  if (skip) return;
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  var s = document.createElement('script');
  s.defer = true;
  s.src = '/_vercel/insights/script.js';
  document.head.appendChild(s);
})();
(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  function cleanUrlEarly() { if (location.hash && history.replaceState) history.replaceState(history.state, '', location.pathname + location.search); }
  function toTop(smooth) {
    var behavior = smooth && !reduceMotion.matches ? 'smooth' : 'instant';
    try { root.scrollIntoView({ block: 'start', behavior: behavior }); } catch (e) { window.scrollTo(0, 0); }
  }
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) { cleanUrlEarly(); toTop(false); }
  });

  var themeBtns = document.querySelectorAll('.theme [data-set]');
  var metaTheme = document.querySelector('meta[name="theme-color"]');
  var sysLight = window.matchMedia('(prefers-color-scheme: light)');
  function systemTheme() { return sysLight.matches ? 'light' : 'dark'; }
  function savedTheme() {
    var v = null;
    try { v = localStorage.getItem('eg-theme'); } catch (e) {}
    return v === 'light' || v === 'dark' ? v : null;
  }
  function applyTheme() {
    var t = savedTheme() || systemTheme();
    root.setAttribute('data-scheme', t);
    themeBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-set') === t)); });
    if (metaTheme) metaTheme.setAttribute('content', t === 'light' ? '#f8f8f8' : '#10100f');
  }
  applyTheme();
  if (sysLight.addEventListener) sysLight.addEventListener('change', applyTheme);
  else if (sysLight.addListener) sysLight.addListener(applyTheme);
  window.addEventListener('storage', function (e) { if (e.key === 'eg-theme' || e.key === null) applyTheme(); });
  window.addEventListener('pageshow', function (e) { if (e.persisted) applyTheme(); });
  themeBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var t = b.getAttribute('data-set');
      if (t === root.getAttribute('data-scheme')) return;
      try {
        if (t === systemTheme()) localStorage.removeItem('eg-theme');
        else localStorage.setItem('eg-theme', t);
      } catch (e) {}
      if (!document.startViewTransition || reduceMotion.matches) { applyTheme(); return; }
      root.classList.add('vt-theme');
      var vt = document.startViewTransition(applyTheme);
      function done() { root.classList.remove('vt-theme'); }
      vt.finished.then(done, done);
      setTimeout(applyTheme, 600);
    });
  });

  var topbar = document.querySelector('.topbar');
  function onTopbarScroll() { topbar.classList.toggle('stuck', window.scrollY > 4); }
  window.addEventListener('scroll', onTopbarScroll, { passive: true });
  onTopbarScroll();

  var sidebar = document.getElementById('sidebar');
  var scrim = document.getElementById('scrim');
  var sideScroll = sidebar.querySelector('.side-scroll');
  try { var sy = sessionStorage.getItem('eg-side-y'); if (sideScroll && sy) sideScroll.scrollTop = +sy; } catch (e) {}
  window.addEventListener('pagehide', function () { try { if (sideScroll) sessionStorage.setItem('eg-side-y', String(sideScroll.scrollTop)); } catch (e) {} });
  var burger = document.getElementById('menu-open');
  var narrow = window.matchMedia('(max-width: 1023px)');

  function setDrawer(open) {
    sidebar.classList.toggle('open', open);
    scrim.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
    body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', function () { setDrawer(!sidebar.classList.contains('open')); });
  scrim.addEventListener('click', function () { setDrawer(false); });
  sidebar.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function () { if (narrow.matches) setDrawer(false); });
  });
  var onNarrowChange = function (e) { if (!e.matches) setDrawer(false); };
  if (narrow.addEventListener) narrow.addEventListener('change', onNarrowChange);
  else if (narrow.addListener) narrow.addListener(onNarrowChange);

  var me = document.getElementById('me');
  var pop = document.getElementById('pop');
  function setPop(open) {
    pop.hidden = !open;
    me.setAttribute('aria-expanded', String(open));
  }
  me.addEventListener('click', function (e) { e.stopPropagation(); setPop(pop.hidden); });
  document.addEventListener('click', function (e) {
    if (!pop.hidden && !pop.contains(e.target)) setPop(false);
  });

  var about = document.getElementById('about');
  var aboutScroll = about.querySelector('.about-scroll');
  var openAbout = document.getElementById('open-about');
  var closeAbout = document.getElementById('close-about');
  var lastFocus = null;

  function setAbout(open) {
    if (open === !about.hidden) return;
    if (open) {
      lastFocus = document.activeElement;
      setPop(false);
      if (narrow.matches) setDrawer(false);
    }
    about.hidden = !open;
    body.style.overflow = open ? 'hidden' : '';
    if (open) {
      aboutScroll.scrollTop = 0;
      closeAbout.focus({ preventScroll: true });
    } else if (lastFocus && lastFocus.focus) {
      lastFocus.focus({ preventScroll: true });
    }
  }
  openAbout.addEventListener('click', function () { setAbout(true); });
  closeAbout.addEventListener('click', function () { setAbout(false); });
  about.addEventListener('click', function (e) {
    var t = e.target;
    if (t === about || t === aboutScroll || t.classList.contains('letter-wrap')) setAbout(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (!about.hidden) setAbout(false);
      else if (!pop.hidden) { setPop(false); me.focus(); }
      else if (sidebar.classList.contains('open')) { setDrawer(false); burger.focus(); }
    } else if (e.key === 'Tab' && !about.hidden) {
      e.preventDefault();
      closeAbout.focus();
    }
  });

  function cleanUrl() {
    if (location.hash && history.replaceState) history.replaceState(history.state, '', location.pathname + location.search);
  }
  function scrollToId(id, smooth) {
    var behavior = smooth && !reduceMotion.matches ? 'smooth' : 'instant';
    if (id === 'top') { toTop(smooth); return; }
    var el = document.getElementById(id);
    if (!el) return;
    try { el.scrollIntoView({ behavior: behavior, block: 'start' }); } catch (e) { el.scrollIntoView(); }
  }
  function goTo(id, smooth) {
    if (id === 'about') setAbout(true);
    else scrollToId(id, smooth);
  }
  function fromHash(smooth) {
    var id = location.hash.slice(1);
    if (!id || id === 'main') return;
    goTo(id, smooth);
    cleanUrl();
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href*="#"]') : null;
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank') return;
    var url;
    try { url = new URL(a.getAttribute('href'), location.href); } catch (err) { return; }
    var id = url.hash.slice(1);
    if (!id || id === 'main' || url.origin !== location.origin) return;
    e.preventDefault();
    if (url.pathname === location.pathname) { goTo(id, true); cleanUrl(); return; }
    try { sessionStorage.setItem('eg-goto', id); } catch (err) {}
    location.href = url.pathname + url.search;
  });
  window.addEventListener('hashchange', function () { fromHash(true); });
  var pending = null;
  try { pending = sessionStorage.getItem('eg-goto'); sessionStorage.removeItem('eg-goto'); } catch (e) {}
  if (location.hash === '#about') fromHash(false);
  else if (location.hash) window.addEventListener('load', function () { setTimeout(function () { fromHash(false); }, 60); });
  else if (!pending) toTop(false);
  else {
    goTo(pending, false);
    window.addEventListener('load', function () { setTimeout(function () { goTo(pending, false); }, 60); });
  }

  try {
    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      root.classList.remove('js');
      window.__egReady = true;
      return;
    }
    window.__egReady = true;

    var tiles = Array.prototype.slice.call(document.querySelectorAll('.tile'));

    function stagger() {
      var rows = {};
      tiles.forEach(function (t) {
        var key = Math.round(t.offsetTop);
        (rows[key] = rows[key] || []).push(t);
      });
      Object.keys(rows).forEach(function (key) {
        rows[key]
          .sort(function (a, b) { return a.offsetLeft - b.offsetLeft; })
          .forEach(function (t, i) { t.style.setProperty('--d', (0.04 + 0.16 * i).toFixed(2) + 's'); });
      });
    }
    stagger();

    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      tiles.forEach(function (t) {
        t.addEventListener('pointermove', function (e) {
          var r = t.getBoundingClientRect();
          t.style.setProperty('--mx', Math.round(e.clientX - r.left) + 'px');
          t.style.setProperty('--my', Math.round(e.clientY - r.top) + 'px');
        });
      });
    }

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(stagger, 150);
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });
    var away = { observe: function () {}, unobserve: function () {} };

    var started = false;
    function start() {
      if (started) return;
      started = true;
      root.classList.add('ready');
      setTimeout(function () {
        document.querySelectorAll('.tile, .reveal').forEach(function (el) { io.observe(el); });

      }, 250);
    }
    requestAnimationFrame(start);
    setTimeout(start, 300);
  } catch (err) {
    root.classList.remove('js');
    window.__egReady = true;
  }
})();
