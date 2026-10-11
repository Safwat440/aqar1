// عقار ونّ — site preloader
// Loaded synchronously in <head> on every page. Plays the brand Lottie animation
// (assets/js/animation.josn) in a full-screen overlay until window "load", then fades out.
// Self-contained: injects its own styles + overlay, loads lottie-web on demand, and
// always removes itself after MAX_WAIT even if the animation or library fails to load.
(function () {
  'use strict';
  var ANIMATION_URL = 'assets/js/animation.josn';
  var LOTTIE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie_light.min.js';
  var MAX_WAIT = 8000;   // hard cap: never keep the user on the loader longer than this
  var MIN_SHOW = 600;    // avoid a jarring flash on instant (cached) loads
  var FADE_MS = 450;

  var root = document.documentElement;
  var start = Date.now();
  var anim = null;
  var done = false;

  var css =
    'html.aqar-preloading,html.aqar-preloading body{overflow:hidden!important}' +
    '#aqar-preloader{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;' +
    'background:var(--color-background,#fff);opacity:1;transition:opacity ' + FADE_MS + 'ms ease,visibility ' + FADE_MS + 'ms ease}' +
    '#aqar-preloader.is-hidden{opacity:0;visibility:hidden;pointer-events:none}' +
    '#aqar-preloader .aqar-preloader__anim{width:min(90vw,720px);aspect-ratio:16/9;max-height:90vh}' +
    '#aqar-preloader .aqar-preloader__anim svg{display:block}' +
    '@media (prefers-reduced-motion:reduce){#aqar-preloader{transition:none}}';
  var style = document.createElement('style');
  style.id = 'aqar-preloader-style';
  style.textContent = css;
  document.head.appendChild(style);

  var overlay = document.createElement('div');
  overlay.id = 'aqar-preloader';
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-live', 'polite');
  overlay.setAttribute('aria-label', root.getAttribute('lang') === 'en' ? 'Loading' : 'جارٍ التحميل');
  var box = document.createElement('div');
  box.className = 'aqar-preloader__anim';
  box.setAttribute('aria-hidden', 'true');
  overlay.appendChild(box);
  // <body> does not exist yet; a fixed child of <html> renders above it until body is parsed.
  root.appendChild(overlay);
  root.classList.add('aqar-preloading');

  function hide() {
    if (done) return;
    done = true;
    root.classList.remove('aqar-preloading');
    overlay.classList.add('is-hidden');
    setTimeout(function () {
      if (anim) { anim.destroy(); anim = null; }
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, FADE_MS + 50);
  }

  function hideAfterMin() {
    setTimeout(hide, Math.max(0, MIN_SHOW - (Date.now() - start)));
  }

  function play(data) {
    if (done || !window.lottie) return;
    try {
      anim = window.lottie.loadAnimation({
        container: box,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: data,
        rendererSettings: { preserveAspectRatio: 'xMidYMid meet' }
      });
    } catch (e) { /* fall through: overlay still hides on load / MAX_WAIT */ }
  }

  // Load library + animation data in parallel; any failure just leaves the plain overlay.
  var dataPromise = (window.fetch ? fetch(ANIMATION_URL).then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }) : Promise.reject(new Error('no fetch')));
  var libPromise = window.lottie ? Promise.resolve() : new Promise(function (resolve, reject) {
    var s = document.createElement('script');
    s.src = LOTTIE_URL;
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
  Promise.all([dataPromise, libPromise]).then(function (res) { play(res[0]); }).catch(function () {});

  if (document.readyState === 'complete') hideAfterMin();
  else window.addEventListener('load', hideAfterMin);
  setTimeout(hide, MAX_WAIT);
  // Back/forward cache restores: never show a stale loader.
  window.addEventListener('pageshow', function (e) { if (e.persisted) hide(); });
})();
