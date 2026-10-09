/*
  Живые блоки в кейсах: переключатель валют и график, демо «сохранить и продолжить»,
  переключатель ролей и сравнение цифр. Данные внутри демо вымышленные.
*/
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function each(sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), fn); }
  function press(group, btn) { Array.prototype.forEach.call(group, function (x) { x.setAttribute('aria-pressed', String(x === btn)); }); }

  /* ---------- дашборд P3: EUR / USD / GBP и график AUM / Yield ---------- */
  each('.p3d', function (d) {
    var RATES = { USD: 1, EUR: 0.92, GBP: 0.79 };
    var SYM = { USD: '$', EUR: '€', GBP: '£' };
    var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var AUM = [39.8, 40.6, 41.2, 41.0, 42.5, 43.1, 44.0, 44.6, 45.9, 46.4, 47.3, 48.2];
    var YLD = [4.61, 4.70, 4.78, 4.85, 4.92, 5.01, 5.08, 5.12, 5.18, 5.21, 5.24, 5.25];
    var W = 1000, H = 170, cur = 'USD', metric = 'aum';
    var chart = d.querySelector('.p3-chart');
    var svg = chart.querySelector('svg'), ln = svg.querySelector('.ln'), ar = svg.querySelector('.ar');
    var ys = chart.querySelectorAll('.p3-y span');
    var tip = chart.querySelector('.p3-tip'), cross = chart.querySelector('.p3-cross'), dot = chart.querySelector('.p3-dot');
    var curBtns = d.querySelectorAll('[data-set-cur]'), metBtns = d.querySelectorAll('[data-set-metric]');
    var money = d.querySelectorAll('[data-money]');

    function series() { return metric === 'aum' ? AUM.map(function (v) { return v * RATES[cur]; }) : YLD.slice(); }
    function range(s) { var lo = Math.min.apply(null, s), hi = Math.max.apply(null, s), pad = (hi - lo) * 0.18; return [lo - pad, hi + pad]; }
    function points(s) { var r = range(s); return s.map(function (v, i) { return [i / (s.length - 1) * W, H - (v - r[0]) / (r[1] - r[0]) * H]; }); }
    function fmtAxis(v) { return metric === 'aum' ? SYM[cur] + v.toFixed(1) + 'M' : v.toFixed(2) + '%'; }
    function fmtMoney(v) { return SYM[cur] + Math.round(v).toLocaleString('en-US'); }

    function draw() {
      var s = series(), p = points(s), r = range(s);
      var line = p.map(function (q, i) { return (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join(' ');
      ln.setAttribute('d', line);
      ar.setAttribute('d', line + ' L' + W + ' ' + H + ' L0 ' + H + ' Z');
      var vals = [r[1], (r[0] + r[1]) / 2, r[0]];
      Array.prototype.forEach.call(ys, function (el, i) { el.textContent = fmtAxis(vals[i]); });
    }
    function setMoney(animate) {
      Array.prototype.forEach.call(money, function (el) {
        var to = parseFloat(el.getAttribute('data-money')) * RATES[cur];
        var from = parseFloat(el.getAttribute('data-now') || to);
        el.setAttribute('data-now', to);
        if (!animate || reduce) { el.textContent = fmtMoney(to); return; }
        var t0 = performance.now();
        (function step(t) {
          var k = Math.min(1, (t - t0) / 650); k = 1 - Math.pow(1 - k, 3);
          el.textContent = fmtMoney(from + (to - from) * k);
          if (k < 1) requestAnimationFrame(step);
        })(t0);
      });
    }
    Array.prototype.forEach.call(curBtns, function (b) {
      b.addEventListener('click', function () { cur = b.getAttribute('data-set-cur'); press(curBtns, b); setMoney(true); draw(); hide(); });
    });
    Array.prototype.forEach.call(metBtns, function (b) {
      b.addEventListener('click', function () { metric = b.getAttribute('data-set-metric'); press(metBtns, b); draw(); hide(); });
    });

    /* подсказка на графике: месяц и значение под курсором */
    function hide() { chart.classList.remove('hover'); }
    chart.addEventListener('pointermove', function (e) {
      var r = svg.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width;
      if (x < -0.02 || x > 1.02) { hide(); return; }
      var s = series(), i = Math.max(0, Math.min(s.length - 1, Math.round(x * (s.length - 1)))), p = points(s)[i];
      var left = 56 + p[0] / W * (chart.clientWidth - 56), top = p[1] / H * 170;
      cross.style.left = left + 'px';
      dot.style.left = left + 'px'; dot.style.top = top + 'px';
      tip.style.left = left + 'px'; tip.style.top = (top - 12) + 'px';
      tip.innerHTML = (metric === 'aum' ? SYM[cur] + s[i].toFixed(1) + 'M' : s[i].toFixed(2) + '%') + '<small>' + MONTHS[i] + ' 2023</small>';
      chart.classList.add('hover');
    });
    chart.addEventListener('pointerleave', hide);
    draw(); setMoney(false);
  });

  /* ---------- демо «сохранить и продолжить»: ноутбук → письмо → телефон ---------- */
  each('.sc', function (sc) {
    var steps = sc.querySelectorAll('.sc-steps button');
    var timers = [], seen = false;
    function set(s) {
      sc.setAttribute('data-s', String(s));
      var k = s <= 1 ? 0 : s - 1;
      Array.prototype.forEach.call(steps, function (b, i) {
        b.classList.toggle('on', i === k); b.classList.toggle('done', i < k);
        if (i === k) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
    }
    function stop() { timers.forEach(clearTimeout); timers = []; }
    function play() {
      stop(); set(0);
      if (reduce) return;
      timers.push(setTimeout(function () { set(1); }, 1700));
      timers.push(setTimeout(function () { set(2); }, 3900));
      timers.push(setTimeout(function () { set(3); }, 6300));
    }
    Array.prototype.forEach.call(steps, function (b) {
      b.addEventListener('click', function () { stop(); set(parseInt(b.getAttribute('data-go'), 10)); });
    });
    sc.querySelector('.sc-save').addEventListener('click', function () { stop(); set(1); });
    sc.querySelector('.sc-send').addEventListener('click', function () { stop(); set(2); });
    sc.querySelector('.sc-note').addEventListener('click', function () { stop(); set(3); });
    sc.querySelector('.sc-replay').addEventListener('click', play);
    set(0);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && !seen) { seen = true; play(); }
          else if (!en.isIntersecting && seen) { seen = false; stop(); set(0); }
        });
      }, { threshold: 0.45 }).observe(sc);
    }
  });

  /* ---------- роли: меню и экран меняются вместе с ролью ---------- */
  each('.rsw', function (w) {
    var btns = w.querySelectorAll('[data-set-role]');
    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener('click', function () { w.setAttribute('data-role', b.getAttribute('data-set-role')); press(btns, b); });
    });
  });

  /* ---------- цифры: пропорциональные и моноширинные ---------- */
  each('.tnum', function (t) {
    var btns = t.querySelectorAll('[data-set-mode]');
    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener('click', function () { t.setAttribute('data-mode', b.getAttribute('data-set-mode')); press(btns, b); });
    });
  });
  /* ---------- P3 Marine: сумма расхода решает, кто его одобряет ---------- */
  each('.appr', function (w) {
    var range = w.querySelector('input[type="range"]'), out = w.querySelector('.appr-amt');
    var items = w.querySelectorAll('.appr-chain li'), res = w.querySelector('.appr-out');
    var NAMES = ['Crew member', 'Captain', 'Management company', 'Owner or family office'];
    function amount(v) { var a = 200 * Math.pow(250, v / 100); return a < 2000 ? Math.round(a / 10) * 10 : Math.round(a / 100) * 100; }
    function update() {
      var a = amount(parseFloat(range.value)), lvl = a <= 2000 ? 1 : a <= 15000 ? 2 : 3;
      out.textContent = '€' + a.toLocaleString('en-US');
      Array.prototype.forEach.call(items, function (li, i) { li.classList.toggle('on', i <= lvl); li.classList.toggle('fin', i === lvl); });
      res.innerHTML = 'Final approval: <b>' + NAMES[lvl] + '</b>' + (lvl > 1 ? ', after ' + NAMES.slice(1, lvl).join(' and ') : '');
      range.setAttribute('aria-valuetext', out.textContent + ', approved by ' + NAMES[lvl]);
    }
    range.addEventListener('input', update); update();
  });

  /* ---------- P3 Marine: карта экипажа, пополнение, блокировка и работа без связи ---------- */
  each('.crew', function (w) {
    var bal = 1240, online = true, blocked = false, k = 0;
    var balEl = w.querySelector('.cw-card b'), list = w.querySelector('.cw-list'), logBtn = w.querySelector('.cw-log');
    var blockBtn = w.querySelector('[data-act="block"]'), netBtns = w.querySelectorAll('.net-tg button');
    var EXP = [['Fuel dock tip', 40], ['Provisions, Antibes', 186], ['Deck cleaning supplies', 72], ['Crew taxi to marina', 35], ['Spare fender', 118]];
    function money(v) { return '€' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    function setBal(to) {
      var from = bal; bal = to;
      if (reduce) { balEl.textContent = money(to); return; }
      var t0 = performance.now();
      (function step(t) { var q = Math.min(1, (t - t0) / 600); q = 1 - Math.pow(1 - q, 3); balEl.textContent = money(from + (to - from) * q); if (q < 1) requestAnimationFrame(step); })(t0);
    }
    function add(title, amt, plus, queued) {
      var d = document.createElement('div');
      d.innerHTML = '<b></b><em class="' + (plus ? 'plus' : '') + '"></em><small class="' + (queued ? 'q' : 'ok2') + '"></small>';
      d.querySelector('b').textContent = title;
      d.querySelector('em').textContent = (plus ? '+' : '−') + money(amt);
      d.querySelector('small').textContent = queued ? 'Waiting to sync' : 'Synced';
      list.insertBefore(d, list.firstChild);
      while (list.children.length > 4) list.removeChild(list.lastChild);
    }
    w.querySelector('[data-act="topup"]').addEventListener('click', function () { setBal(bal + 500); add('Top up from manager', 500, true, false); });
    blockBtn.addEventListener('click', function () {
      blocked = !blocked; w.classList.toggle('blocked', blocked);
      blockBtn.lastChild.textContent = blocked ? 'Unblock card' : 'Block card';
      logBtn.disabled = blocked;
    });
    Array.prototype.forEach.call(netBtns, function (b) {
      b.addEventListener('click', function () {
        online = b.getAttribute('data-net') === 'on'; press(netBtns, b); w.classList.toggle('offline', !online);
        if (online) Array.prototype.forEach.call(list.querySelectorAll('small.q'), function (s2, i) {
          setTimeout(function () { s2.className = 'ok2'; s2.textContent = 'Synced'; }, 250 + i * 220);
        });
      });
    });
    logBtn.addEventListener('click', function () {
      if (blocked) return;
      var e = EXP[k++ % EXP.length]; setBal(bal - e[1]); add(e[0], e[1], false, !online);
    });
  });

  /* ---------- P3 Marine: один экран на пяти разрешениях ---------- */
  each('.bp', function (w) {
    var stage = w.querySelector('.bp-stage'), frame = w.querySelector('.bp-frame'), btns = w.querySelectorAll('.bp-tabs button');
    function fitTo(px) {
      var room = stage.clientWidth - 8, k = Math.min(1, room / px, 0.86);
      frame.style.setProperty('--w', px + 'px'); frame.style.setProperty('--k', k.toFixed(3));
    }
    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener('click', function () { press(btns, b); fitTo(parseInt(b.getAttribute('data-w'), 10)); });
    });
    var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(function () {
      var on = w.querySelector('.bp-tabs button[aria-pressed="true"]'); fitTo(parseInt(on.getAttribute('data-w'), 10));
    }, 120); });
    fitTo(1440);
  });

  /* ---------- реальные экраны: вкладки и шаги сами листаются, длинный экран сам плавно едет вниз ---------- */
  function seen(el, on, off) {
    if (!('IntersectionObserver' in window)) { on(); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) on(); else if (off) off(); }); }, { threshold: 0.3 }).observe(el);
  }
  var PAN_SPEED = 70;
  function ready(img, fn) { if (!img || img.tagName !== 'IMG' || img.complete) { fn(); return; } img.addEventListener('load', fn, { once: true }); }
  function pan(fig) {
    var t = fig.querySelector('.pan'); if (!t || fig.classList.contains('fit')) return 0;
    t.style.transition = 'none'; t.style.transform = 'translateY(0)'; void t.offsetHeight;
    var dist = t.getBoundingClientRect().height - fig.clientHeight;
    if (dist < 12 || reduce) return 0;
    var dur = dist / PAN_SPEED;
    t.style.transition = 'transform ' + dur.toFixed(2) + 's cubic-bezier(0.45, 0, 0.55, 1) 1.4s';
    t.style.transform = 'translateY(' + (-dist).toFixed(0) + 'px)';
    return dur + 1.4;
  }
  function switcher(w, btnSel) {
    var btns = w.querySelectorAll(btnSel), figs = w.querySelectorAll('.vw-f'), cap = w.querySelector('.vw-cap');
    var auto = parseInt(w.getAttribute('data-auto') || '0', 10);
    var cur = 0, timer = null, dlgT = null, user = false, visible = false, token = 0;
    function show(i) {
      cur = (i + figs.length) % figs.length; var my = ++token;
      Array.prototype.forEach.call(figs, function (f, k) { f.classList.toggle('on', k === cur); f.classList.remove('dlg'); });
      Array.prototype.forEach.call(btns, function (b, k) { b.setAttribute('aria-pressed', String(k === cur)); b.classList.toggle('done', k < cur); });
      var b = btns[cur];
      if (cap && b && b.hasAttribute('data-cap')) cap.innerHTML = b.getAttribute('data-cap');
      clearTimeout(dlgT);
      if (figs[cur].querySelector('.vw-dlg')) dlgT = setTimeout(function () { figs[cur].classList.add('dlg'); }, reduce ? 0 : 900);
      if (w.classList.contains('stp')) { w.classList.remove('play'); void w.offsetWidth; if (!user && visible && auto) w.classList.add('play'); }
      clearTimeout(timer);
      var f = figs[cur];
      ready(f.querySelector('img.pan'), function () {
        if (my !== token) return;
        var pt = visible ? pan(f) : 0;
        if (user || !auto || reduce || !visible) return;
        timer = setTimeout(function () { show(cur + 1); }, Math.max(auto, pt * 1000 + 2200));
      });
    }
    if (auto) w.style.setProperty('--dur', auto + 'ms');
    Array.prototype.forEach.call(btns, function (b, k) {
      b.addEventListener('click', function () { user = true; clearTimeout(timer); w.classList.remove('play'); show(k); });
    });
    seen(w, function () { if (!visible) { visible = true; show(cur); } }, function () { visible = false; clearTimeout(timer); w.classList.remove('play'); });
    Array.prototype.forEach.call(figs, function (f, k) { f.classList.toggle('on', k === 0); });
  }
  each('.vw', function (w) { switcher(w, '.tabs2 button'); });
  each('.stp', function (w) { switcher(w, '.stp-list button'); });

  /* ---------- длинная страница едет вниз и обратно, не перехватывая прокрутку страницы ---------- */
  each('.long', function (w) {
    var view = w.querySelector('.vw-view'), img = view && view.querySelector('img');
    if (!img || reduce) return;
    var speed = parseFloat(w.getAttribute('data-speed') || '90'), run = false, t0 = 0, pos = 0, dir = 1, hold = 1.4, last = 0;
    function frame(t) {
      if (!run) return;
      var dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t;
      var max = img.getBoundingClientRect().height - view.clientHeight;
      if (max <= 0) { requestAnimationFrame(frame); return; }
      if (hold > 0) hold -= dt;
      else {
        pos += dir * speed * (dir > 0 ? 1 : 4) * dt;
        if (pos >= max) { pos = max; dir = -1; hold = 2.2; }
        if (pos <= 0) { pos = 0; dir = 1; hold = 1.8; }
      }
      img.style.transform = 'translateY(' + (-pos).toFixed(1) + 'px)';
      requestAnimationFrame(frame);
    }
    seen(w, function () { if (run) return; run = true; last = 0; requestAnimationFrame(frame); }, function () { run = false; });
  });

  /* ---------- настоящие разрешения: рамка сужается, картинка меняется ---------- */
  each('.bpr', function (w) {
    var btns = w.querySelectorAll('.tabs2 button'), frame = w.querySelector('.bpr-frame'), imgs = w.querySelectorAll('.bpr-frame img[data-w]');
    var widest = parseInt(btns[0].getAttribute('data-w'), 10);
    function set(px) {
      frame.style.setProperty('--bw', Math.max(30, px / widest * 100).toFixed(2) + '%');
      Array.prototype.forEach.call(imgs, function (im) { im.classList.toggle('on', parseInt(im.getAttribute('data-w'), 10) === px); });
    }
    Array.prototype.forEach.call(btns, function (b) { b.addEventListener('click', function () { press(btns, b); set(parseInt(b.getAttribute('data-w'), 10)); }); });
    set(widest);
  });

  /* ---------- карта экипажа: заблокировать, разблокировать, активировать, сменить PIN ---------- */
  each('.cdx-demo', function (w) {
    var cdx = w.querySelector('.cdx'), btns = w.querySelectorAll('.tabs2 button'), cap = w.querySelector('.vw-cap');
    var dlg = cdx.querySelector('.cdx-dlg'), h = dlg.querySelector('h5'), p = dlg.querySelector('p'), inp = dlg.querySelector('.pu-in'), ok = dlg.querySelector('.cdx-ok'), no = dlg.querySelector('.no2');
    var stat = cdx.querySelector('h4 small'), main = cdx.querySelector('.cdx-act'), toast = cdx.querySelector('.cdx-toast span');
    var ACT = {
      block: ['Confirm action', 'Do you want to block the card?', 'Block', 'Card blocked'],
      unblock: ['Confirm action', 'Do you want to unblock the card?', 'Unblock', 'Card unblocked'],
      activate: ['Confirm action', 'Do you want to activate the card?', 'Activate', 'Card activated'],
      pin: ['Change PIN code', 'You are about to change the PIN code for this card.', 'Change', 'PIN code changed']
    };
    var order = ['block', 'unblock', 'activate', 'pin'], k = 0, user = false, visible = false, timer = null, pending = null;
    function state(s) {
      cdx.classList.toggle('blocked', s === 'blocked'); cdx.classList.toggle('inactive', s === 'inactive');
      stat.textContent = s === 'blocked' ? '(Blocked)' : s === 'inactive' ? '(Inactive)' : '(Active)';
      stat.classList.toggle('bad', s !== 'active');
      main.textContent = s === 'blocked' ? 'Unblock' : s === 'inactive' ? 'Activate' : 'Block';
    }
    function open(a) {
      pending = a; var d = ACT[a];
      h.textContent = d[0]; p.textContent = d[1]; ok.textContent = d[2]; inp.hidden = a !== 'pin';
      if (a === 'unblock') state('blocked'); if (a === 'activate') state('inactive'); if (a === 'block' || a === 'pin') state('active');
      cdx.classList.remove('toast'); cdx.classList.add('dlg');
      Array.prototype.forEach.call(btns, function (b, i) { b.setAttribute('aria-pressed', String(order[i] === a)); });
      if (cap) cap.innerHTML = btns[order.indexOf(a)].getAttribute('data-cap');
    }
    function confirm() {
      if (!pending) return; var a = pending; pending = null; cdx.classList.remove('dlg');
      if (a === 'block') state('blocked'); if (a === 'unblock' || a === 'activate') state('active');
      toast.textContent = ACT[a][3]; cdx.classList.add('toast');
      setTimeout(function () { cdx.classList.remove('toast'); }, 2200);
    }
    function cancel() { pending = null; cdx.classList.remove('dlg'); }
    function loop() {
      clearTimeout(timer); if (user || !visible || reduce) return;
      open(order[k % order.length]);
      timer = setTimeout(function () { confirm(); k++; timer = setTimeout(loop, 2600); }, 1900);
    }
    ok.addEventListener('click', function () { user = true; clearTimeout(timer); confirm(); });
    no.addEventListener('click', function () { user = true; clearTimeout(timer); cancel(); });
    main.addEventListener('click', function () { user = true; clearTimeout(timer); var s = main.textContent.trim().toLowerCase(); open(s === 'unblock' ? 'unblock' : s === 'activate' ? 'activate' : 'block'); });
    var pinBtn = cdx.querySelector('.cdx-pin'); if (pinBtn) pinBtn.addEventListener('click', function () { user = true; clearTimeout(timer); open('pin'); });
    Array.prototype.forEach.call(btns, function (b, i) { b.addEventListener('click', function () { user = true; clearTimeout(timer); open(order[i]); }); });
    seen(w, function () { if (!visible) { visible = true; setTimeout(loop, 900); } }, function () { visible = false; clearTimeout(timer); });
    state('active'); if (cap) cap.innerHTML = btns[0].getAttribute('data-cap');
  });
  /* ================= CryptoSwift ================= */
  /* демо-курсы в фунтах: общий тикер для всех блоков страницы */
  var CS_BASE = { BTC: 34620, ETH: 1812, USDT: 0.7905, USDC: 0.7902 };
  var CS_DEC = { BTC: 5, ETH: 4, USDT: 2, USDC: 2 };
  var csRate = { BTC: 34620, ETH: 1812, USDT: 0.7905, USDC: 0.7902 }, csDir = {}, csSubs = [], csTimer = null;
  function csCoin(v, c) { return v.toLocaleString('en-US', { minimumFractionDigits: CS_DEC[c], maximumFractionDigits: CS_DEC[c] }) + ' ' + c; }
  function csGBP(v, d) { d = d == null ? 2 : d; return '£' + v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function csRateTxt(c) { var r = csRate[c]; return csGBP(r, r < 10 ? 4 : 0); }
  function csTickStart() {
    if (csTimer || reduce) return;
    csTimer = setInterval(function () {
      if (document.hidden) return;
      Object.keys(csRate).forEach(function (c) {
        var vol = c === 'BTC' ? 0.0012 : c === 'ETH' ? 0.0016 : 0.00015, prev = csRate[c];
        var next = prev * (1 + (Math.random() - 0.5) * 2 * vol);
        next += (CS_BASE[c] - next) * 0.05;
        csRate[c] = next; csDir[c] = next >= prev ? 1 : -1;
      });
      csSubs.forEach(function (fn) { fn(); });
    }, 1700);
  }
  function csFlash(el, dir) {
    if (!el) return;
    el.classList.remove('up', 'dn'); void el.offsetWidth; el.classList.add(dir > 0 ? 'up' : 'dn');
    clearTimeout(el._ft); el._ft = setTimeout(function () { el.classList.remove('up', 'dn'); }, 900);
  }
  /* код для оплаты: 25 × 25 модулей с тремя «глазками», как у настоящего QR */
  function csQR(el, seed) {
    var N = 25, s = (seed >>> 0) || 7, html = '';
    function rnd() { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }
    function finder(x, y) {
      var fx = x < 7 ? x : x >= N - 7 ? x - (N - 7) : -1, fy = y < 7 ? y : y >= N - 7 ? y - (N - 7) : -1;
      if (fx < 0 || fy < 0 || (x >= N - 7 && y >= N - 7)) return -1;
      return Math.max(Math.abs(fx - 3), Math.abs(fy - 3)) === 2 ? 0 : 1;
    }
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var f = finder(x, y), b;
      if (f >= 0) b = f;
      else if ((x === 7 && (y < 8 || y >= N - 8)) || (y === 7 && (x < 8 || x >= N - 8)) || (x === N - 8 && y < 8) || (y === N - 8 && x < 8)) b = 0;
      else if (x === 6 || y === 6) b = (x + y) % 2 === 0 ? 1 : 0;
      else if (x >= 16 && x <= 20 && y >= 16 && y <= 20) b = Math.max(Math.abs(x - 18), Math.abs(y - 18)) === 1 ? 0 : 1;
      else b = rnd() > 0.5 ? 1 : 0;
      html += b ? '<i class="b"></i>' : '<i></i>';
    }
    el.innerHTML = html;
  }
  function csClock(sec) { var m = Math.floor(sec / 60), x = sec % 60; return (m < 10 ? '0' : '') + m + ':' + (x < 10 ? '0' : '') + x; }
  if (document.querySelector('.cx-ns, .fx, .payx')) csTickStart();

  /* ---------- новая продажа: цена в фунтах, монета, режим, затем статус сделки ---------- */
  each('.cx-ns', function (cx) {
    var view = cx.querySelector('.cx-view'), price = cx.querySelector('.cx-price'), pin = price.closest('.cx-in'), ph = cx.querySelector('.cx-ph');
    var coinB = cx.querySelectorAll('.cx-coins button'), modeB = cx.querySelectorAll('.cx-radios button'), chips = cx.querySelectorAll('.cx-chips button');
    var ind = cx.querySelector('.cx-ind'), fc = cx.querySelector('.cx-fc'), ff = cx.querySelector('.cx-ff'), go = cx.querySelector('.cx-go'), rec = cx.querySelector('.cx-rec');
    var steps = view.querySelectorAll('.cx-steps span'), badge = view.querySelector('.cx-badge'), st = view.querySelector('.cx-state'), si = st.querySelector('.si');
    var st1 = st.querySelector('.cx-st1'), st2 = st.querySelector('.cx-st2'), tm = st.querySelector('.cx-tm'), qr = view.querySelector('.cx-qr'), cancel = view.querySelector('.cx-cancel');
    var V = { id: view.querySelector('.v-id'), sid: view.querySelector('.cx-sid'), m: view.querySelector('.v-m'), f: view.querySelector('.v-f'), c: view.querySelector('.v-c'), r: view.querySelector('.v-r'), fee: view.querySelector('.v-fee'), rl: view.querySelector('.v-rl') };
    var coin = 'BTC', mode = 'person', val = 300000, ok = true, user = false, visible = false, busy = false, saleNo = 48213, demoK = 0;
    var saleT = [], demoT = [], clock = null;
    var DEMO = [{ coin: 'ETH', val: 18500, mode: 'person' }, { coin: 'USDT', val: 38900, mode: 'invoice' }, { coin: 'BTC', val: 300000, mode: 'person' }];
    var ICON = { wait: 'timer', run: 'refresh', done: 'check' };
    function laterS(fn, ms) { saleT.push(setTimeout(fn, ms)); }
    function laterD(fn, ms) { demoT.push(setTimeout(fn, ms)); }
    function clearS() { saleT.forEach(clearTimeout); saleT = []; clearInterval(clock); clock = null; }
    function clearD() { demoT.forEach(clearTimeout); demoT = []; go.classList.remove('press'); }
    function takeOver() { if (!user) { user = true; clearD(); } }

    function update(dir) {
      var txt = ok ? csCoin(val / csRate[coin], coin) : '…';
      ind.textContent = txt; fc.textContent = ok ? '≈ ' + txt : '';
      ff.textContent = ok ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' GBP' : '';
      if (dir && ok) { csFlash(ind, -dir); csFlash(fc, -dir); }
    }
    function validate() {
      ok = val >= 50 && val <= 500000;
      pin.classList.toggle('err', !ok); ph.classList.toggle('err', !ok);
      ph.textContent = val < 50 ? 'Minimum £50' : val > 500000 ? 'Maximum £500,000' : 'Minimum £50, maximum £500,000';
      go.disabled = !ok;
      Array.prototype.forEach.call(chips, function (c) { c.classList.toggle('on', +c.getAttribute('data-p') === val); });
    }
    function setVal(v) { val = v; price.value = v ? v.toLocaleString('en-US') : ''; validate(); update(); }
    function setCoin(c) { coin = c; Array.prototype.forEach.call(coinB, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-coin') === c)); }); update(); }
    function setMode(m) {
      mode = m; Array.prototype.forEach.call(modeB, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === m)); });
      rec.innerHTML = m === 'invoice' ? 'Send invoice to <b>*</b>' : 'Send receipt to (Optional)';
      go.textContent = m === 'invoice' ? 'Send the invoice' : 'Make the sale';
    }
    function state(kind, a, b) {
      st.className = 'cx-state ' + kind; si.innerHTML = '<svg><use href="#i-' + ICON[kind] + '"/></svg>';
      st1.textContent = a; st2.textContent = b;
      badge.className = 'cx-badge' + (kind === 'wait' ? '' : ' ' + kind);
      badge.textContent = kind === 'done' ? 'Completed' : kind === 'run' ? 'In progress' : mode === 'invoice' ? 'Invoice sent' : 'Waiting for payment';
      cancel.hidden = kind !== 'wait';
    }
    function stepTo(k) { Array.prototype.forEach.call(steps, function (s, i) { s.classList.toggle('ok', i < k); s.classList.toggle('now', i === k); }); }
    function sale() {
      if (!ok) return;
      clearS(); busy = true;
      var c = coin, rate = csRate[c], gbp = val, amt = gbp / rate, fee = Math.round(gbp * 0.5) / 100, no = ++saleNo, inv = mode === 'invoice';
      var amtTxt = csCoin(amt, c), rateTxt = csRateTxt(c), net = csGBP(gbp - fee);
      V.id.textContent = no; V.sid.textContent = 'Sale ' + no; V.m.textContent = inv ? 'Invoice' : 'In person';
      V.f.textContent = csGBP(gbp); V.c.textContent = amtTxt; V.r.textContent = '1 ' + c + ' = ' + rateTxt;
      V.fee.textContent = csGBP(fee); V.rl.textContent = inv ? 'Invoice sent to' : 'Receipt sent to';
      csQR(qr, no * 2654435761);
      view.classList.remove('paid'); stepTo(-1);
      var held = inv ? 3600 : 900;
      state('wait', inv ? 'Invoice sent' : 'Waiting for payment', inv ? 'Sofia gets a link and pays from anywhere. The price is held for 60 minutes.' : 'Show the code to the customer. The price is held for 15 minutes.');
      tm.textContent = csClock(held);
      clock = setInterval(function () { held = Math.max(0, held - 1); tm.textContent = csClock(held); }, 1000);
      view.classList.add('on');
      /* на телефоне форма длиннее экрана: новый экран сделки показываем с начала, как в приложении */
      if (user) { var top = cx.getBoundingClientRect().top; if (top < 0) window.scrollBy({ top: top - 76, behavior: reduce ? 'auto' : 'smooth' }); }
      var T = reduce ? 0 : 1;
      var SEQ = [['Checking the payment', 'The customer\'s wallet is screened before anything else.'],
                 ['Payment received', amtTxt + ' arrived from the customer\'s wallet.'],
                 ['Converting to pounds', 'The crypto is on its way to the exchange.'],
                 ['Converting to pounds', 'Sold at the locked rate of ' + rateTxt + ' per ' + c + '.'],
                 ['Paying out', net + ' is being sent to your bank account.']];
      laterS(function () {
        clearInterval(clock);
        SEQ.forEach(function (q, i) { laterS(function () { stepTo(i); state('run', q[0], q[1]); if (i === 1) view.classList.add('paid'); }, i * 1150 * T); });
        laterS(function () {
          stepTo(5); state('done', 'Completed', net + ' is on its way to your bank account. Fee ' + csGBP(fee) + '.');
          busy = false;
          if (!user && visible) laterD(back, 4200);
        }, SEQ.length * 1150 * T);
      }, 2600 * T);
    }
    function back() {
      clearS(); busy = false; view.classList.remove('on');
      if (user) { var top = cx.getBoundingClientRect().top; if (top < 0) window.scrollBy({ top: top - 76, behavior: reduce ? 'auto' : 'smooth' }); }
      if (!user && visible) laterD(demo, 2200);
    }
    function demo() {
      if (user || !visible || reduce) return;
      var d = DEMO[demoK++ % DEMO.length];
      laterD(function () { setMode(d.mode); }, 300);
      laterD(function () { setCoin(d.coin); }, 1100);
      laterD(function () { setVal(d.val); }, 1900);
      laterD(function () { go.classList.add('press'); }, 3300);
      laterD(function () { go.classList.remove('press'); sale(); }, 3550);
    }

    price.addEventListener('input', function () {
      var digits = price.value.replace(/[^0-9]/g, '').slice(0, 7);
      val = digits ? parseInt(digits, 10) : 0;
      price.value = digits ? val.toLocaleString('en-US') : '';
      validate(); update();
    });
    price.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); sale(); } });
    Array.prototype.forEach.call(chips, function (b) { b.addEventListener('click', function () { setVal(+b.getAttribute('data-p')); }); });
    Array.prototype.forEach.call(coinB, function (b) { b.addEventListener('click', function () { setCoin(b.getAttribute('data-coin')); }); });
    Array.prototype.forEach.call(modeB, function (b) { b.addEventListener('click', function () { setMode(b.getAttribute('data-mode')); }); });
    go.addEventListener('click', sale);
    Array.prototype.forEach.call(view.querySelectorAll('.cx-bk, .cx-cancel, .cx-again'), function (b) { b.addEventListener('click', back); });
    cx.addEventListener('pointerdown', takeOver);
    cx.addEventListener('keydown', takeOver);
    csSubs.push(function () { if (visible && !view.classList.contains('on')) update(csDir[coin]); });
    seen(cx, function () {
      if (visible) return; visible = true;
      if (user || busy) return;
      laterD(view.classList.contains('on') ? back : demo, 1600);
    }, function () { visible = false; clearD(); });
    validate(); update();
  });

  /* ---------- история продаж: фильтры, поиск и карточка сделки ---------- */
  each('.cx-sl', function (cx) {
    var rows = Array.prototype.slice.call(cx.querySelectorAll('button.cx-tr')), fb = cx.querySelectorAll('.cx-filt button'), q = cx.querySelector('.cx-search input');
    var empty = cx.querySelector('.cx-empty'), drw = cx.querySelector('.cx-drw'), tl = drw.querySelectorAll('.cx-tl li');
    var D = { id: drw.querySelector('.d-id'), chip: drw.querySelector('.d-chip'), f: drw.querySelector('.d-f'), c: drw.querySelector('.d-c'), n: drw.querySelector('.d-n'), m: drw.querySelector('.d-m'), d: drw.querySelector('.d-d') };
    var LBL = { done: 'Completed', wait: 'Waiting for payment', run: 'Converting', exp: 'Expired' };
    var cur = 'all', sel = null, user = false, visible = false, timer = null, k = 0;
    function apply(anim) {
      var text = q.value.trim().toLowerCase(), n = 0;
      rows.forEach(function (r) {
        var s = r.getAttribute('data-s');
        var show = (cur === 'all' || s === cur || (cur === 'pend' && (s === 'wait' || s === 'run'))) && (!text || r.textContent.toLowerCase().indexOf(text) > -1);
        r.hidden = !show;
        if (show && anim && !reduce) { r.style.setProperty('--i', n); r.classList.remove('cxr-in'); void r.offsetWidth; r.classList.add('cxr-in'); }
        if (show) n++;
      });
      empty.hidden = n > 0;
      if (sel && sel.hidden) close();
    }
    function open(r) {
      rows.forEach(function (x) { x.classList.toggle('sel', x === r); });
      sel = r;
      var c = r.children, s = r.getAttribute('data-s'), times = (r.getAttribute('data-t') || '').split(' ').filter(Boolean);
      D.id.textContent = c[0].textContent; D.d.textContent = c[1].textContent; D.n.textContent = c[2].textContent; D.m.textContent = c[3].textContent;
      D.f.textContent = c[4].textContent; D.c.textContent = c[5].textContent;
      D.chip.className = 'cx-chip d-chip k-' + s; D.chip.textContent = LBL[s];
      Array.prototype.forEach.call(tl, function (li, i) {
        var done = i < times.length, now = s === 'run' && i === times.length;
        li.classList.toggle('ok', done); li.classList.toggle('now', now);
        li.querySelector('em').textContent = done ? times[i] : now ? 'Now' : '';
      });
      drw.classList.add('on');
    }
    function close() { drw.classList.remove('on'); rows.forEach(function (x) { x.classList.remove('sel'); }); sel = null; }
    function setF(f) { cur = f; Array.prototype.forEach.call(fb, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-f') === f)); }); apply(true); }
    function stop() { user = true; clearTimeout(timer); }
    rows.forEach(function (r) { r.addEventListener('click', function () { stop(); if (sel === r) close(); else open(r); }); });
    Array.prototype.forEach.call(fb, function (b) { b.addEventListener('click', function () { stop(); setF(b.getAttribute('data-f')); }); });
    q.addEventListener('input', function () { stop(); apply(false); });
    drw.querySelector('.cx-x').addEventListener('click', function () { stop(); close(); });
    var SCRIPT = [function () { open(rows[0]); }, function () { open(rows[5]); }, function () { close(); setF('pend'); }, function () { open(rows[2]); },
                  function () { close(); setF('done'); }, function () { open(rows[6]); }, function () { close(); setF('all'); }];
    function loop() {
      clearTimeout(timer); if (user || !visible || reduce) return;
      SCRIPT[k++ % SCRIPT.length]();
      timer = setTimeout(loop, 2900);
    }
    seen(cx, function () { if (!visible) { visible = true; timer = setTimeout(loop, 1200); } }, function () { visible = false; clearTimeout(timer); });
  });

  /* ---------- до и после: крипта скачет, фунты стоят на месте ---------- */
  each('.fx', function (w) {
    var bBig = w.querySelector('.before .fx-big'), aC = w.querySelector('.fx-c2'), pB = w.querySelector('.before .fx-spark path');
    var pBase = w.querySelector('.after .fx-spark .base'), GBP = 300000, hist = [], visible = false;
    for (var i = 0; i < 40; i++) hist.push(CS_BASE.BTC * (1 + Math.sin(i / 2.6) * 0.0035 + (Math.random() - 0.5) * 0.004));
    function path(vals) {
      var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), pad = (hi - lo) * 0.12 || 1;
      lo -= pad; hi += pad;
      return vals.map(function (v, k) { return (k ? 'L' : 'M') + (k / (vals.length - 1) * 300).toFixed(1) + ' ' + (60 - (v - lo) / (hi - lo) * 56).toFixed(1); }).join(' ');
    }
    function draw(dir) {
      var amts = hist.map(function (r) { return GBP / r; }), d = path(amts);
      pB.setAttribute('d', d); if (pBase) pBase.setAttribute('d', d);
      var now = csCoin(amts[amts.length - 1], 'BTC');
      bBig.textContent = now; aC.textContent = now;
      if (dir) { csFlash(bBig, -dir); csFlash(aC, -dir); }
    }
    csSubs.push(function () { if (!visible) return; hist.push(csRate.BTC); if (hist.length > 40) hist.shift(); draw(csDir.BTC); });
    seen(w, function () { visible = true; }, function () { visible = false; });
    draw(0);
  });

  /* ---------- оплата глазами покупателя, статус у продавца меняется вместе с ней ---------- */
  each('.payx', function (w) {
    var pg = w.querySelector('.pg2'); if (!pg) return;
    var cb = pg.querySelectorAll('.pg2-coins button'), amt = pg.querySelector('.pg2-c'), q = pg.querySelector('.pg2-q'), addr = pg.querySelector('.pg2-addr span');
    var tl = pg.querySelector('.pg2-tl'), tb = pg.querySelector('.pg2-tm'), net = pg.querySelector('.pg2-net'), btn = pg.querySelector('.pg2-btn');
    var mst = w.querySelector('.mm-st'), bars = w.querySelectorAll('.mm-bar i'), mp = w.querySelector('.mm p');
    var GBP = 12450, coin = 'ETH', paid = false, user = false, visible = false, left = 900, payT = [], demoT = [], clock = null;
    var ADDR = { BTC: 'bc1q9h7k…x2wd', ETH: '0x7a3F…c91E', USDT: 'TQn8vX…4kLp', USDC: '0x2fC8…e6B3' };
    var SEED = { BTC: 11, ETH: 23, USDT: 37, USDC: 53 }, NET = { BTC: 'Bitcoin', ETH: 'Ethereum', USDT: 'Tron', USDC: 'Ethereum' };
    function later(list, fn, ms) { list.push(setTimeout(fn, ms)); }
    function clear(list) { list.forEach(clearTimeout); list.length = 0; }
    function amountTxt() { return csCoin(GBP / csRate[coin], coin); }
    function mstate(kind, label, n, html) {
      mst.className = 'mm-st' + (kind ? ' ' + kind : ''); mst.textContent = label;
      Array.prototype.forEach.call(bars, function (b, i) { b.classList.toggle('ok', i < n); b.classList.toggle('now', kind === 'run' && i === n); });
      mp.innerHTML = html;
    }
    function waitText() { return '£12,450.00 · <b>' + amountTxt() + '</b>'; }
    function setCoin(c) {
      coin = c; Array.prototype.forEach.call(cb, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-coin') === c)); });
      addr.textContent = ADDR[c]; net.textContent = NET[c]; csQR(q, SEED[c] * 7919); amt.textContent = amountTxt();
      if (!paid) mp.innerHTML = waitText();
    }
    function reset() {
      clear(payT); paid = false; pg.classList.remove('paid'); btn.textContent = 'Pay with wallet';
      tl.textContent = 'Price held for'; left = 900; tb.textContent = csClock(left);
      mstate('', 'Waiting for payment', 0, waitText());
    }
    function pay() {
      if (paid) return; paid = true; var T = reduce ? 0 : 1;
      btn.classList.add('press'); setTimeout(function () { btn.classList.remove('press'); }, 160);
      btn.textContent = 'Confirming…'; mstate('run', 'Checking', 0, 'The payment is being screened');
      later(payT, function () { pg.classList.add('paid'); btn.textContent = 'Paid · receipt sent'; tl.textContent = 'Status'; tb.textContent = 'Paid'; mstate('run', 'Converting', 2, 'Payment received, converting to pounds'); }, 1300 * T);
      later(payT, function () { mstate('run', 'Converting', 3, 'Sold at the locked rate'); }, 2400 * T);
      later(payT, function () { mstate('run', 'Paying out', 4, 'Sending pounds to the bank'); }, 3400 * T);
      later(payT, function () {
        mstate('done', 'Completed', 5, '<b>£12,450.00</b> is on its way to the bank');
        later(demoT, function () { reset(); if (!user) loop(); }, user ? 5200 : 4200);
      }, 4500 * T);
    }
    function loop() {
      clear(demoT); if (user || !visible || reduce) return;
      later(demoT, function () { setCoin('BTC'); }, 1500);
      later(demoT, function () { setCoin('USDT'); }, 3000);
      later(demoT, function () { setCoin('ETH'); }, 4500);
      later(demoT, function () { pay(); }, 6200);
    }
    function stop() { if (!user) { user = true; clear(demoT); } }
    Array.prototype.forEach.call(cb, function (b) { b.addEventListener('click', function () { stop(); if (paid) reset(); setCoin(b.getAttribute('data-coin')); }); });
    btn.addEventListener('click', function () { stop(); if (paid) { reset(); return; } pay(); });
    clock = setInterval(function () { if (!paid && visible && !reduce) { left = Math.max(0, left - 1); tb.textContent = csClock(left); } }, 1000);
    csSubs.push(function () { if (!visible || paid) return; amt.textContent = amountTxt(); mp.innerHTML = waitText(); });
    seen(w, function () { if (!visible) { visible = true; if (!paid) loop(); } }, function () { visible = false; clear(demoT); });
    setCoin('ETH'); reset();
  });

  /* ---------- аналитика: неделя, месяц, год ---------- */
  each('.anx', function (w) {
    var btns = w.querySelectorAll('.anx-seg button'), bars = w.querySelector('.anx-bars'), xs = w.querySelector('.anx-x'), yl = w.querySelectorAll('.anx-yl span'), sub = w.querySelector('.anx-sub');
    var K = {}; ['vol', 'vd', 'cnt', 'cd', 'avg', 'ad', 'out'].forEach(function (n) { K[n] = w.querySelector('.k-' + n); });
    var mixB = [w.querySelector('.m0'), w.querySelector('.m1'), w.querySelector('.m2'), w.querySelector('.m3')];
    var mixS = w.querySelectorAll('.anx-mix .mbar span'), MIXI = [0, 2, 1, 3];
    var COL = ['#f7931a', '#627eea', '#26a17b', '#2775ca'], user = false, visible = false, timer = null, order = ['week', 'month', 'year'], cur = 0;
    var MON = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
    var P = {
      week: { n: 7, sub: 'Last 7 days, in GBP', seed: 7, base: 52000, avg: 21400, d: ['+12%', '+8%', '+4%'], lab: function (i) { return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]; }, bump: [4, 5] },
      month: { n: 30, sub: 'Last 30 days, in GBP', seed: 31, base: 15500, avg: 19800, d: ['+18%', '+11%', '+6%'], lab: function (i) { return (i + 1) % 5 === 0 || i === 0 ? String(i + 1) : ''; }, bump: [] },
      year: { n: 12, sub: 'Last 12 months, in GBP', seed: 12, base: 420000, avg: 18900, d: ['+64%', '+41%', '+16%'], lab: function (i) { return MON[i]; }, bump: [] }
    };
    function rng(seed) { var s = seed * 7919 % 2147483647; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }
    function nice(v) { var e = Math.pow(10, Math.floor(Math.log10(v))), m = v / e; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * e; }
    function short(v) { return v >= 1e6 ? '£' + (v / 1e6).toFixed(v >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M' : v >= 1e3 ? '£' + Math.round(v / 1e3) + 'k' : '£' + Math.round(v); }
    function money(v) { return '£' + Math.round(v).toLocaleString('en-US'); }
    function build(key, anim) {
      var p = P[key], r = rng(p.seed), tot = [], parts = [], mix = [0, 0, 0, 0];
      for (var i = 0; i < p.n; i++) {
        var t = p.base * (0.45 + r() * 0.95) * (p.bump.indexOf(i) > -1 ? 1.4 : 1) * (key === 'year' ? 0.7 + i * 0.05 : 1);
        var sh = [0.44 + (r() - 0.5) * 0.16, 0.18 + (r() - 0.5) * 0.08, 0.28 + (r() - 0.5) * 0.12, 0.10 + (r() - 0.5) * 0.05];
        var sum = sh[0] + sh[1] + sh[2] + sh[3];
        sh = sh.map(function (x) { return x / sum; });
        tot.push(t); parts.push(sh); sh.forEach(function (x, j) { mix[j] += x * t; });
      }
      var vol = tot.reduce(function (a, b) { return a + b; }, 0), top = nice(Math.max.apply(null, tot) * 1.05);
      bars.innerHTML = tot.map(function (t, i) {
        return '<div title="' + (p.lab(i) || '') + ' ' + money(t) + '">' + parts[i].map(function (x, j) { return '<i style="background:' + COL[j] + ';height:' + (anim ? 0 : x * t / top * 100).toFixed(2) + '%" data-h="' + (x * t / top * 100).toFixed(2) + '"></i>'; }).join('') + '</div>';
      }).join('');
      if (anim) requestAnimationFrame(function () { requestAnimationFrame(function () { Array.prototype.forEach.call(bars.querySelectorAll('i'), function (el) { el.style.height = el.getAttribute('data-h') + '%'; }); }); });
      xs.innerHTML = tot.map(function (t, i) { return '<span>' + p.lab(i) + '</span>'; }).join('');
      Array.prototype.forEach.call(yl, function (el, i) { el.textContent = short(top * (4 - i) / 4); });
      sub.textContent = p.sub;
      var cnt = Math.round(vol / p.avg);
      K.vol.textContent = money(vol); K.cnt.textContent = cnt; K.avg.textContent = money(vol / cnt); K.out.textContent = money(vol * 0.995);
      K.vd.textContent = p.d[0]; K.cd.textContent = p.d[1]; K.ad.textContent = p.d[2];
      var all = mix[0] + mix[1] + mix[2] + mix[3];
      mix.forEach(function (m, j) { var pc = Math.round(m / all * 100); mixB[j].textContent = pc + '%'; mixS[MIXI.indexOf(j)].style.width = pc + '%'; });
    }
    function set(i, anim) { cur = i; press(btns, btns[i]); build(order[i], anim); }
    Array.prototype.forEach.call(btns, function (b, i) { b.addEventListener('click', function () { user = true; clearTimeout(timer); set(i, true); }); });
    function loop() { clearTimeout(timer); if (user || !visible || reduce) return; timer = setTimeout(function () { set((cur + 1) % order.length, true); loop(); }, 4200); }
    seen(w, function () { if (!visible) { visible = true; if (!user) set(cur, true); loop(); } }, function () { visible = false; clearTimeout(timer); });
    set(0, false);
  });

  /* ---------- навигация: тёмная и светлая ---------- */
  each('.navx', function (w) {
    var cx = w.querySelector('.cx'), btns = w.querySelectorAll('[data-nav]'), user = false, visible = false, timer = null;
    function set(v) { cx.classList.toggle('light', v === 'light'); Array.prototype.forEach.call(btns, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-nav') === v)); }); }
    Array.prototype.forEach.call(btns, function (b) { b.addEventListener('click', function () { user = true; clearTimeout(timer); set(b.getAttribute('data-nav')); }); });
    function loop() { clearTimeout(timer); if (user || !visible || reduce) return; timer = setTimeout(function () { set(cx.classList.contains('light') ? 'dark' : 'light'); loop(); }, 2600); }
    seen(w, function () { if (!visible) { visible = true; loop(); } }, function () { visible = false; clearTimeout(timer); });
  });

  /* ---------- пять разрешений: рамка меняет размер, форма перестраивается сама ---------- */
  each('.bpc', function (w) {
    var stage = w.querySelector('.bpc-stage'), frame = w.querySelector('.bpc-frame'), btns = w.querySelectorAll('.tabs2 button'), cap = w.querySelector('.bpc-cap');
    var mq = window.matchMedia('(max-width: 899px)'), cur = 0, user = false, visible = false, timer = null;
    function set(i) {
      cur = i; var b = btns[i], W = +b.getAttribute('data-w'), H = +b.getAttribute('data-h');
      var k = Math.min(1, stage.clientWidth / W, (mq.matches ? 500 : 580) / H);
      frame.style.setProperty('--w', W + 'px'); frame.style.setProperty('--h', H + 'px'); frame.style.setProperty('--k', k.toFixed(4));
      frame.setAttribute('data-dev', b.getAttribute('data-dev'));
      stage.style.height = Math.ceil(H * k) + 'px';
      Array.prototype.forEach.call(btns, function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      cap.innerHTML = b.getAttribute('data-cap');
    }
    Array.prototype.forEach.call(btns, function (b, i) { b.addEventListener('click', function () { user = true; clearTimeout(timer); set(i); }); });
    function loop() { clearTimeout(timer); if (user || !visible || reduce) return; timer = setTimeout(function () { set((cur + 1) % btns.length); loop(); }, 3600); }
    seen(w, function () { if (!visible) { visible = true; loop(); } }, function () { visible = false; clearTimeout(timer); });
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { set(cur); }, 120); });
    set(0);
  });

  /* ---------- маленькие переключатели: режим продажи в карточке ---------- */
  each('[data-flip]', function (el) {
    var ms = parseInt(el.getAttribute('data-flip'), 10) || 2600, t = null;
    if (reduce) return;
    seen(el, function () { if (!t) t = setInterval(function () { el.classList.toggle('alt'); }, ms); }, function () { clearInterval(t); t = null; });
  });
  /* ================= Banking Safe ================= */
  function ubMoney(v) { return Math.round(v).toLocaleString('en-US').replace(/,/g, '\u00a0'); }
  function ubCount(el, from, to) {
    if (reduce) { el.textContent = ubMoney(to); return; }
    var t0 = performance.now();
    (function step(t) { var q = Math.min(1, (t - t0) / 700); q = 1 - Math.pow(1 - q, 3); el.textContent = ubMoney(from + (to - from) * q); if (q < 1) requestAnimationFrame(step); })(t0);
  }

  /* ---------- сейф от вкладки «Накопичення» до первых пополнений ---------- */
  each('.sf:not(.pst)', function (w) {
    var ub = w.querySelector('.ub'); if (!ub) return;
    var scr = ub.querySelectorAll('.ub-scr'), steps = w.querySelectorAll('.sf-steps button');
    var fName = ub.querySelector('[data-k="name"]'), fAmt = ub.querySelector('[data-k="amt"]'), nameV = fName.querySelector('.v'), amtV = fAmt.querySelector('.v');
    var sw = ub.querySelector('.ub-sw'), date = ub.querySelector('.ub-date'), cont = ub.querySelector('[data-act="cont"]'), openB = ub.querySelector('.ub-open');
    var code = ub.querySelectorAll('.ub-code i'), conf = ub.querySelector('[data-act="otp"]'), tmr = ub.querySelector('.ub-otp .t'), keys = ub.querySelectorAll('.ub-kb span');
    var doneB = ub.querySelector('[data-s="3"] .ub-btn'), safe = ub.querySelector('.ub-safe'), amtEl = safe.querySelector('.ub-amt .a'), bar = safe.querySelector('.ub-bar i'), co = safe.querySelector('.ub-co');
    var acts = safe.querySelectorAll('.ub-acts button'), push = ub.querySelector('.ub-push'), p1 = push.querySelector('.p1'), p2 = push.querySelector('.p2'), toast = ub.querySelector('.ub-toast');
    var NAME = 'Vacation', GOAL = 60000, STEP = 7500, cur = 0, user = false, visible = false, T = [], bal = 0, hit = {}, shared = false, digits = '', otpClock = null;
    var MS = [[0.25, 'A quarter of the way', ' saved for Vacation. Keep going!'], [0.5, 'Halfway to Vacation', ' in the Safe, the same again to go.'], [0.75, 'Three quarters done', ' saved. Almost there!'], [1, 'Goal reached!', ' saved. Vacation is fully covered.']];
    function later(fn, ms) { T.push(setTimeout(fn, ms)); }
    function clear() { T.forEach(clearTimeout); T = []; Array.prototype.forEach.call(ub.querySelectorAll('.press'), function (b) { b.classList.remove('press'); }); }
    function press(b, fn) { b.classList.add('press'); later(function () { b.classList.remove('press'); fn(); }, 260); }
    function showToast(t) { toast.textContent = t; toast.classList.add('on'); clearTimeout(toast._t); toast._t = setTimeout(function () { toast.classList.remove('on'); }, 2200); }
    function showPush(a, b) { p1.textContent = a; p2.textContent = b; push.classList.add('on'); clearTimeout(push._t); push._t = setTimeout(function () { push.classList.remove('on'); }, 2800); }
    function resetForm() { nameV.textContent = ''; amtV.textContent = ''; fName.classList.add('foc'); fAmt.classList.remove('foc'); sw.classList.remove('on'); sw.setAttribute('aria-checked', 'false'); date.classList.remove('on'); cont.classList.remove('wait'); }
    function resetOtp() { digits = ''; paintCode(); conf.classList.add('dis'); var s = 178; tmr.textContent = '2:58'; clearInterval(otpClock); otpClock = setInterval(function () { s = Math.max(0, s - 1); tmr.textContent = Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60); }, 1000); }
    function paintCode() { Array.prototype.forEach.call(code, function (c, i) { c.textContent = digits[i] || ''; c.classList.toggle('cur', i === digits.length); }); conf.classList.toggle('dis', digits.length < 5); }
    function resetSafe() { bal = 0; hit = {}; shared = false; amtEl.textContent = '0'; bar.style.width = '0%'; co.classList.remove('on'); push.classList.remove('on'); }
    function setBal(v) {
      var from = bal; bal = Math.max(0, Math.min(GOAL, v)); ubCount(amtEl, from, bal); bar.style.width = (bal / GOAL * 100).toFixed(1) + '%';
      for (var i = 0; i < MS.length; i++) { var m = MS[i]; if (bal >= GOAL * m[0] && from < GOAL * m[0] && !hit[m[0]]) { hit[m[0]] = true; showPush(m[1], ubMoney(bal) + '\u00a0₴' + m[2]); } }
    }
    function go(i) {
      cur = i;
      Array.prototype.forEach.call(scr, function (s) { s.classList.toggle('on', +s.getAttribute('data-s') === i); });
      ub.classList.toggle('inv', i === 4);
      Array.prototype.forEach.call(steps, function (b, k) { b.classList.toggle('done', k < i); if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
      if (i === 1) resetForm();
      if (i === 2) resetOtp(); else clearInterval(otpClock);
      if (i === 0) resetSafe();
      w.classList.remove('play'); void w.offsetWidth;
      if (!user && visible && !reduce) { w.classList.add('play'); script(i); }
    }
    function type(el, text, ms, done) {
      var k = 0;
      (function next() { el.textContent = text.slice(0, ++k); if (k < text.length) later(next, ms); else if (done) later(done, 380); })();
    }
    var DUR = [2000, 5600, 3200, 2600, 7600];
    function script(i) {
      w.style.setProperty('--dur', DUR[i] + 'ms');
      if (i === 0) later(function () { press(openB, function () { go(1); }); }, 1600);
      if (i === 1) later(function () {
        type(nameV, NAME, 95, function () {
          fName.classList.remove('foc'); fAmt.classList.add('foc');
          type(amtV, '60\u00a0000 ₴', 110, function () {
            fAmt.classList.remove('foc'); sw.classList.add('on'); sw.setAttribute('aria-checked', 'true'); date.classList.add('on');
            later(function () { cont.classList.add('wait'); later(function () { go(2); }, 900); }, 900);
          });
        });
      }, 500);
      if (i === 2) { var seq = '48217', n = 0; (function key() { if (n < 5) { digits += seq[n++]; paintCode(); later(key, 300); } else later(function () { press(conf, function () { go(3); }); }, 500); })(); }
      if (i === 3) later(function () { press(doneB, function () { go(4); }); }, 2100);
      if (i === 4) {
        [0, 1, 2].forEach(function (k) { later(function () { press(acts[0], function () { setBal(bal + STEP); }); }, 1100 + k * 1300); });
        later(function () { press(acts[1], function () { shared = true; co.classList.add('on'); showToast('Olena joined the Safe'); }); }, 5200);
        later(function () { go(0); }, 7600);
      }
    }
    function takeOver() { if (!user) { user = true; clear(); w.classList.remove('play'); } }
    ub.addEventListener('pointerdown', takeOver);
    Array.prototype.forEach.call(steps, function (b) { b.addEventListener('click', function () { takeOver(); go(+b.getAttribute('data-go')); if (+b.getAttribute('data-go') === 4 && bal === 0) setBal(STEP * 2); }); });
    Array.prototype.forEach.call(ub.querySelectorAll('[data-go]'), function (b) { b.addEventListener('click', function () { var to = +b.getAttribute('data-go'); go(to); }); });
    fName.addEventListener('click', function () { nameV.textContent = NAME; fName.classList.remove('foc'); fAmt.classList.add('foc'); });
    fAmt.addEventListener('click', function () { amtV.textContent = '60\u00a0000 ₴'; fAmt.classList.remove('foc'); });
    sw.addEventListener('click', function () { var on = !sw.classList.contains('on'); sw.classList.toggle('on', on); sw.setAttribute('aria-checked', String(on)); date.classList.toggle('on', on); });
    cont.addEventListener('click', function () { if (!nameV.textContent) nameV.textContent = NAME; cont.classList.add('wait'); later(function () { go(2); }, 700); });
    Array.prototype.forEach.call(keys, function (k) { k.addEventListener('click', function () { var t = k.firstChild && k.firstChild.nodeType === 3 ? k.firstChild.textContent : ''; if (t === '⌫') digits = digits.slice(0, -1); else if (/^[0-9]$/.test(t) && digits.length < 5) digits += t; paintCode(); }); });
    conf.addEventListener('click', function () { if (digits.length < 5) { digits = '48217'; paintCode(); later(function () { go(3); }, 400); } else go(3); });
    acts[0].addEventListener('click', function () { setBal(bal + STEP); });
    acts[1].addEventListener('click', function () { shared = !shared; co.classList.toggle('on', shared); showToast(shared ? 'Olena joined the Safe' : 'The Safe is private again'); });
    acts[2].addEventListener('click', function () { if (bal <= 0) { showToast('The Safe is empty'); return; } setBal(bal - STEP); showToast('7\u00a0500\u00a0₴ moved to your card'); });
    w.querySelector('.sc-replay').addEventListener('click', function () { user = false; clear(); go(0); });
    seen(w, function () { if (!visible) { visible = true; if (!user) { clear(); go(cur); } } }, function () { visible = false; clear(); w.classList.remove('play'); });
    go(0);
  });

  /* ---------- A/B: только баланс или прогресс ---------- */
  each('.abx', function (w) {
    var phones = Array.prototype.slice.call(w.querySelectorAll('.abx-c .ub')), add = w.querySelector('.add'), rst = w.querySelector('.rst');
    var GOAL = 60000, bal = 0, user = false, visible = false, timer = null, k = 0, SEQ = [9000, 21000, 33000, 43800];
    function set(v) {
      var from = bal; bal = Math.max(0, Math.min(GOAL, v));
      phones.forEach(function (ph) {
        ubCount(ph.querySelector('.ub-amt .a'), from, bal);
        var b = ph.querySelector('.ub-bar i'), p = ph.querySelector('.ub-pc .p');
        if (b) b.style.width = (bal / GOAL * 100).toFixed(1) + '%';
        if (p) p.textContent = Math.round(bal / GOAL * 100) + '%';
      });
    }
    add.addEventListener('click', function () { user = true; clearTimeout(timer); set(bal + 6000); });
    rst.addEventListener('click', function () { user = true; clearTimeout(timer); set(0); });
    function loop() {
      clearTimeout(timer); if (user || !visible || reduce) return;
      if (k < SEQ.length) { set(SEQ[k++]); timer = setTimeout(loop, 1500); }
      else { timer = setTimeout(function () { k = 0; set(0); timer = setTimeout(loop, 1200); }, 3400); }
    }
    seen(w, function () { if (!visible) { visible = true; loop(); } }, function () { visible = false; clearTimeout(timer); });
  });

  /* ---------- регулярные пополнения: день, неделя, месяц ---------- */
  each('.atx', function (w) {
    var btns = w.querySelectorAll('[data-f]'), dec = w.querySelector('.dec'), inc = w.querySelector('.inc'), v = w.querySelector('.atx-amt .v');
    var when = w.querySelector('.when'), how = w.querySelector('.how'), fl = w.querySelector('.fl'), tg = w.querySelector('.tg'), ok = w.querySelector('.atx-ok');
    var AM = { day: [50, 100, 150, 200, 300, 500], week: [250, 500, 750, 1000, 1500, 2000], month: [1000, 2000, 3000, 4000, 5000, 7500] };
    var PER = { day: 30.44, week: 4.345, month: 1 }, WORD = { day: 'every day', week: 'every week', month: 'every month' };
    var f = 'week', k = 3, GOAL = 60000, TARGET = 18, user = false, visible = false, timer = null, demo = 0;
    var DEMO = [['week', 3], ['day', 1], ['month', 4], ['week', 1], ['month', 1], ['day', 5]];
    function dur(m) {
      if (m < 12) return 'In ' + m + (m === 1 ? ' month' : ' months');
      var y = Math.floor(m / 12), r = m % 12;
      return 'In ' + y + (y === 1 ? ' year' : ' years') + (r ? ' and ' + r + (r === 1 ? ' month' : ' months') : '');
    }
    function render() {
      var amt = AM[f][k], m = Math.ceil(GOAL / (amt * PER[f]));
      Array.prototype.forEach.call(btns, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-f') === f)); });
      v.textContent = ubMoney(amt) + '\u00a0₴';
      when.textContent = dur(m); how.textContent = 'with ' + ubMoney(amt) + '\u00a0₴ ' + WORD[f];
      var scale = Math.max(m, TARGET) * 1.12;
      fl.style.width = (m / scale * 100).toFixed(1) + '%'; tg.style.left = (TARGET / scale * 100).toFixed(1) + '%';
      var late = m > TARGET; ok.classList.toggle('late', late);
      ok.textContent = late ? (m - TARGET) + (m - TARGET === 1 ? ' month' : ' months') + ' after the target date' : 'On track for the target date';
      dec.disabled = k === 0; inc.disabled = k === AM[f].length - 1;
    }
    function stop() { user = true; clearTimeout(timer); }
    Array.prototype.forEach.call(btns, function (b) { b.addEventListener('click', function () { stop(); f = b.getAttribute('data-f'); k = Math.min(k, AM[f].length - 1); render(); }); });
    dec.addEventListener('click', function () { stop(); k = Math.max(0, k - 1); render(); });
    inc.addEventListener('click', function () { stop(); k = Math.min(AM[f].length - 1, k + 1); render(); });
    function loop() { clearTimeout(timer); if (user || !visible || reduce) return; timer = setTimeout(function () { var d = DEMO[demo++ % DEMO.length]; f = d[0]; k = d[1]; render(); loop(); }, 2600); }
    seen(w, function () { if (!visible) { visible = true; loop(); } }, function () { visible = false; clearTimeout(timer); });
    render();
  });

  /* ---------- семь шагов исследования ---------- */
  each('.rsx', function (w) {
    var btns = w.querySelectorAll('.rsx-line button'), panes = w.querySelectorAll('.rsx-pane'), pr = w.querySelector('.rsx-line .rsx-pr');
    var auto = parseInt(w.getAttribute('data-auto') || '5200', 10), cur = 0, user = false, visible = false, timer = null;
    function set(i) {
      cur = i;
      Array.prototype.forEach.call(btns, function (b, k) { b.classList.toggle('done', k < i); if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
      Array.prototype.forEach.call(panes, function (p, k) { p.classList.toggle('on', k === i); });
      if (pr) pr.style.width = (i / (btns.length - 1) * 86).toFixed(2) + '%';
    }
    Array.prototype.forEach.call(btns, function (b, i) { b.addEventListener('click', function () { user = true; clearTimeout(timer); set(i); }); });
    function loop() { clearTimeout(timer); if (user || !visible || reduce) return; timer = setTimeout(function () { set((cur + 1) % btns.length); loop(); }, auto); }
    seen(w, function () { if (!visible) { visible = true; loop(); } }, function () { visible = false; clearTimeout(timer); });
    set(0);
  });
  /* ---------- настоящие экраны: шаги слева, телефон справа, длинный экран сам едет вниз ---------- */
  each('.pst', function (w) {
    var btns = w.querySelectorAll('.sf-steps button'), imgs = w.querySelectorAll('.pst-scr > img, .pst-scr > .pst-i'), scr = w.querySelector('.pst-scr');
    var auto = parseInt(w.getAttribute('data-auto') || '3600', 10), cur = 0, user = false, visible = false, timer = null;
    function set(i) {
      cur = i; clearTimeout(timer);
      Array.prototype.forEach.call(btns, function (b, k) { b.classList.toggle('done', k < i); if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
      Array.prototype.forEach.call(imgs, function (im, k) { im.classList.toggle('on', k === i); if (k !== i) { im.style.transition = ''; im.style.transform = ''; } });
      var im = imgs[i], extra = 0;
      if (im && visible && !reduce) {
        var dist = im.getBoundingClientRect().height - scr.getBoundingClientRect().height;
        if (dist > 20) {
          var d = dist / scr.getBoundingClientRect().height * 2.6;
          im.style.transition = 'opacity 0.5s ease, transform ' + d.toFixed(2) + 's cubic-bezier(0.45, 0, 0.55, 1) 1.2s';
          im.style.transform = 'translateY(' + (-dist).toFixed(0) + 'px)'; extra = (d + 1.2) * 1000;
        }
      }
      w.classList.remove('play'); void w.offsetWidth;
      if (!user && visible && !reduce) { w.style.setProperty('--dur', (auto + extra) + 'ms'); w.classList.add('play'); timer = setTimeout(function () { set((cur + 1) % imgs.length); }, auto + extra); }
      var b = btns[i]; if (b && window.matchMedia('(max-width: 899px)').matches && b.parentElement && b.closest('.sf-steps').scrollWidth > b.closest('.sf-steps').clientWidth) { var l = b.closest('.sf-steps'); l.scrollTo({ left: b.parentElement.offsetLeft - 8, behavior: reduce ? 'auto' : 'smooth' }); }
    }
    Array.prototype.forEach.call(btns, function (b, k) { b.addEventListener('click', function () { user = true; clearTimeout(timer); w.classList.remove('play'); set(k); }); });
    seen(w, function () { if (!visible) { visible = true; set(cur); } }, function () { visible = false; clearTimeout(timer); w.classList.remove('play'); });
    set(0);
  });
})();