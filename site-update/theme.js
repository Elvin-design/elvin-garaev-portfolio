(function () {
  var d = document.documentElement, t = null, go = null;
  d.classList.add('js');
  try { t = localStorage.getItem('eg-theme'); } catch (e) {}
  if (t !== 'light' && t !== 'dark') t = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  d.setAttribute('data-scheme', t);
  var tc = document.querySelector('meta[name="theme-color"]');
  if (tc) tc.setAttribute('content', t === 'light' ? '#f8f8f8' : '#10100f');
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  try { go = sessionStorage.getItem('eg-goto'); } catch (e) {}
  if (!location.hash && !go) { try { d.scrollIntoView({ block: 'start', behavior: 'instant' }); } catch (e) {} }
  setTimeout(function () { if (!window.__egReady) d.classList.remove('js'); }, 3000);
})();
