/*
  Поведение страниц кейсов: подгонка макетов под ширину экрана, приближение экрана по клику,
  появление блоков при прокрутке (повторяется при каждом возвращении) и счётчики цифр.
*/
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- макеты фиксированной ширины (интерфейсы, схемы) уменьшаются под колонку ---------- */
  var fits = Array.prototype.slice.call(document.querySelectorAll('[data-fit]'));
  /* схемы с data-flow на телефоне не уменьшаются, а перестраиваются в столбик (это делает CSS) */
  var phone = window.matchMedia('(max-width: 899px)');
  function fit() {
    fits.forEach(function (el) {
      if (phone.matches && el.hasAttribute('data-flow')) { el.style.zoom = ''; return; }
      var w = parseFloat(el.getAttribute('data-fit'));
      var max = parseFloat(el.getAttribute('data-max') || '1');
      var room = el.parentElement.clientWidth;
      el.style.zoom = String(Math.min(max, room / w));
    });
  }
  fit();
  var t;
  window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(fit, 100); });

  /* ---------- приближение экрана по клику: камера едет к точке, куда нажали ---------- */
  document.querySelectorAll('.zoomable').forEach(function (stage) {
    var shot = stage.querySelector('.shot');
    function toggle(e) {
      if (stage.classList.contains('zoomed')) { stage.classList.remove('zoomed'); return; }
      var r = shot.getBoundingClientRect();
      var x = e && e.clientX ? (e.clientX - r.left) / r.width * 100 : 50;
      var y = e && e.clientY ? (e.clientY - r.top) / r.height * 100 : 30;
      shot.style.transformOrigin = Math.max(0, Math.min(100, x)).toFixed(1) + '% ' + Math.max(0, Math.min(100, y)).toFixed(1) + '%';
      stage.classList.add('zoomed');
    }
    stage.addEventListener('click', toggle);
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      if (e.key === 'Escape') stage.classList.remove('zoomed');
    });
  });

  /* ---------- счётчики: цифра набегает от нуля ---------- */
  function count(scope) {
    scope.querySelectorAll('[data-to]').forEach(function (el) {
      var to = parseFloat(el.getAttribute('data-to'));
      var pre = el.getAttribute('data-pre') || '';
      var suf = el.getAttribute('data-suf') || '';
      if (reduce) { el.textContent = pre + to.toLocaleString('en-US') + suf; return; }
      var start = null;
      function step(now) {
        if (start === null) start = now;
        var k = Math.min(1, (now - start) / 1400);
        k = 1 - Math.pow(1 - k, 4);
        el.textContent = pre + Math.round(to * k).toLocaleString('en-US') + suf;
        if (k < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  /* ---------- появление блоков: при входе на экран и заново после того, как блок целиком ушёл ---------- */
  var blocks = Array.prototype.slice.call(document.querySelectorAll('.rv'));
  if (reduce || !('IntersectionObserver' in window)) {
    blocks.forEach(function (b) { b.classList.add('in'); count(b); });
    return;
  }
  root.classList.add('cs-anim');
  var enter = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting || entry.target.classList.contains('in')) return;
      entry.target.classList.add('in');
      count(entry.target);
      enter.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });
  /* блок появляется один раз и дальше остаётся на месте; уходя с экрана, только сбрасывает приближение */
  var away = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) entry.target.classList.remove('zoomed');
    });
  }, { threshold: 0 });
  blocks.forEach(function (b) { enter.observe(b); away.observe(b); });
})();
