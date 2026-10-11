/*
  Поведение сайта: меню на узких экранах, меню профиля, окно About, выбор кейса в сайдбаре
  и анимация «Подъём» при прокрутке. Библиотеки не нужны.
*/
(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- любая страница открывается с начала, в том числе по кнопкам «назад» и «вперёд» ---------- */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  function cleanUrlEarly() { if (location.hash && history.replaceState) history.replaceState(history.state, '', location.pathname + location.search); }
  /* к началу страницы мгновенно; scrollIntoView, а не scrollTo, чтобы в окне предпросмотра прокрутилась и внешняя страница */
  function toTop(smooth) {
    var behavior = smooth && !reduceMotion.matches ? 'smooth' : 'instant';
    try { root.scrollIntoView({ block: 'start', behavior: behavior }); } catch (e) { window.scrollTo(0, 0); }
  }
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) { cleanUrlEarly(); toTop(false); }
  });

  /* ---------- светлая и тёмная тема: выбор запоминается ---------- */
  var themeBtns = document.querySelectorAll('.theme [data-set]');
  var metaTheme = document.querySelector('meta[name="theme-color"]');
  function applyTheme(t) {
    root.setAttribute('data-scheme', t);
    themeBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-set') === t)); });
    if (metaTheme) metaTheme.setAttribute('content', t === 'light' ? '#f8f8f8' : '#141413');
  }
  applyTheme(root.getAttribute('data-scheme') === 'light' ? 'light' : 'dark');
  var sysLight = window.matchMedia('(prefers-color-scheme: light)');
  function onSystemTheme(e) {
    var saved = null;
    try { saved = localStorage.getItem('eg-theme'); } catch (err) {}
    if (saved !== 'light' && saved !== 'dark') applyTheme(e.matches ? 'light' : 'dark');
  }
  if (sysLight.addEventListener) sysLight.addEventListener('change', onSystemTheme);
  else if (sysLight.addListener) sysLight.addListener(onSystemTheme);
  themeBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var t = b.getAttribute('data-set');
      if (t === root.getAttribute('data-scheme')) return;
      try { localStorage.setItem('eg-theme', t); } catch (e) {}
      /* плавная смена темы там, где браузер это умеет */
      if (document.startViewTransition && !reduceMotion.matches) {
        root.classList.add('vt-theme');
        var vt = document.startViewTransition(function () { applyTheme(t); });
        vt.finished.then(done, done);
      } else applyTheme(t);
      function done() { root.classList.remove('vt-theme'); }
    });
  });

  /* ---------- верхняя панель на узких экранах: подложка появляется при прокрутке ---------- */
  var topbar = document.querySelector('.topbar');
  function onTopbarScroll() { topbar.classList.toggle('stuck', window.scrollY > 4); }
  window.addEventListener('scroll', onTopbarScroll, { passive: true });
  onTopbarScroll();

  /* ---------- сайдбар как выезжающее меню на экранах уже 1024px ---------- */
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

  /* ---------- меню профиля ---------- */
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

  /* ---------- окно About: закрывается крестиком в углу, кликом по фону и клавишей Esc ---------- */
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
      /* фокус остаётся внутри открытого окна */
      e.preventDefault();
      closeAbout.focus();
    }
  });

  /* ---------- кейс из сайдбара: прокрутка в центр экрана и подсветка ---------- */
  var links = {};
  var inBand = {};
  var picked = null;
  var pickedY = 0;
  var arrived = false;
  var settle = null;
  /* ссылка на кейс внутри главной ведёт к карточке (#case-…), ссылка с data-case — на отдельную страницу кейса */
  sidebar.querySelectorAll('.sub a').forEach(function (a) {
    var href = a.getAttribute('href') || '';
    var id = a.getAttribute('data-case') || (href.charAt(0) === '#' ? href.slice(1) : '');
    if (id) links[id] = a;
  });

  /* в сайдбаре выделен выбранный кейс, а если ничего не выбрано — тот, что сейчас в середине экрана */
  function syncLinks() {
    Object.keys(links).forEach(function (id) {
      var on = picked ? picked.id === id : !!inBand[id];
      links[id].classList.toggle('on', on);
      if (on) links[id].setAttribute('aria-current', 'location');
      else links[id].removeAttribute('aria-current');
    });
  }
  function waitForStop() {
    clearTimeout(settle);
    settle = setTimeout(function () { arrived = true; pickedY = window.scrollY; }, 180);
  }
  function pick(tile, smooth) {
    if (picked && picked !== tile) picked.classList.remove('picked');
    picked = tile;
    arrived = false;
    tile.classList.add('picked');
    syncLinks();
    smooth = smooth && !reduceMotion.matches;
    if (!smooth) root.style.scrollBehavior = 'auto';
    try { tile.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center' }); }
    catch (err) { tile.scrollIntoView(); }
    if (!smooth) root.style.scrollBehavior = '';
    waitForStop();
  }
  function unpick() {
    if (!picked) return;
    picked.classList.remove('picked');
    picked = null;
    syncLinks();
  }
  window.addEventListener('scroll', function () {
    if (!picked) return;
    if (!arrived) { waitForStop(); return; }
    /* подсветка гаснет, когда уходишь от карточки примерно на треть экрана */
    if (Math.abs(window.scrollY - pickedY) > window.innerHeight * 0.35) unpick();
  }, { passive: true });

  Object.keys(links).forEach(function (id) {
    links[id].addEventListener('click', function (e) {
      if ((links[id].getAttribute('href') || '').charAt(0) !== '#') return;
      var tile = document.getElementById(id);
      if (!tile) return;
      e.preventDefault();
      pick(tile, true);
    });
  });

  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { inBand[entry.target.id] = entry.isIntersecting; });
      syncLinks();
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    document.querySelectorAll('.tile[id]').forEach(function (t) { spy.observe(t); });
  }

  /* ---------- места на странице (#top, #experience, #cases…) открываются без #хвоста в адресе:
     перезагрузка, кнопки «назад» и «вперёд» и кнопка Home всегда начинают сверху ---------- */
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
  /* ссылка вида #about открывает письмо, вида #case-… — показывает и подсвечивает кейс, остальные ведут к своему блоку */
  function goTo(id, smooth) {
    if (id === 'about') setAbout(true);
    else if (links[id] && document.getElementById(id)) pick(document.getElementById(id), smooth);
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
    /* другая страница: место запоминается, а адрес остаётся без #хвоста */
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
    /* сразу, чтобы страница открылась на нужном месте, и ещё раз после загрузки картинок и шрифтов */
    goTo(pending, false);
    window.addEventListener('load', function () { setTimeout(function () { goTo(pending, false); }, 60); });
  }

  /* ---------- анимация «Подъём» ---------- */
  try {
    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      root.classList.remove('js');
      window.__egReady = true;
      return;
    }
    window.__egReady = true;

    var tiles = Array.prototype.slice.call(document.querySelectorAll('.tile'));

    /* карточки одного ряда появляются по очереди, слева направо */
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

    /* свет внутри карточки идёт за курсором */
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
        /* текстовые блоки появляются один раз, карточки — при каждом возвращении */
        if (!entry.target.classList.contains('tile')) io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });
    /* карточка, которая целиком ушла с экрана, сбрасывается, чтобы при возвращении появиться заново */
    var away = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { if (!entry.isIntersecting) entry.target.classList.remove('in'); });
    }, { threshold: 0 });

    var started = false;
    function start() {
      if (started) return;
      started = true;
      root.classList.add('ready');
      setTimeout(function () {
        document.querySelectorAll('.tile, .reveal').forEach(function (el) { io.observe(el); });
  
      }, 900);
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { requestAnimationFrame(start); });
    }
    setTimeout(start, 1200);
  } catch (err) {
    root.classList.remove('js');
    window.__egReady = true;
  }
})();
