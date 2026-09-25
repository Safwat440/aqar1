// عقار ونّ — shared site behavior (vanilla JS, no dependencies)
(function () {
  'use strict';

  /* Sticky header */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile nav: hamburger + overlay + Escape + scroll lock */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('main-nav');
  var overlay = document.querySelector('.nav-overlay');

  function syncToggleLabel() {
    if (!toggle) return;
    var dict = window.translations && window.translations[document.documentElement.getAttribute('lang') === 'en' ? 'en' : 'ar'];
    if (!dict) return;
    var open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-label', dict[open ? 'nav.menuClose' : 'nav.menuOpen']);
  }
  function openMenu() {
    if (!nav || !toggle) return;
    nav.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    if (overlay) overlay.classList.add('show');
    document.body.classList.add('menu-open');
    syncToggleLabel();
  }
  function closeMenu() {
    if (!nav || !toggle) return;
    if (!nav.classList.contains('open')) return;
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    if (overlay) overlay.classList.remove('show');
    document.body.classList.remove('menu-open');
    syncToggleLabel();
  }
  syncToggleLabel();
  document.addEventListener('aqar:languagechange', syncToggleLabel);
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var isOpen = toggle.getAttribute('aria-expanded') === 'true';
      if (isOpen) closeMenu(); else openMenu();
    });
  }
  if (overlay) overlay.addEventListener('click', closeMenu);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });

  /* Mega menu / dropdown (click for touch + keyboard, hover for desktop) */
  document.querySelectorAll('.nav-item.has-menu').forEach(function (item) {
    var trigger = item.querySelector('.nav-link');
    if (!trigger) return;
    trigger.setAttribute('aria-expanded', 'false');
    var menu = item.querySelector('.mega-menu');
    function close() {
      item.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    }
    trigger.addEventListener('click', function (e) {
      if (window.innerWidth <= 900) {
        e.preventDefault();
        var isOpen = item.classList.toggle('open');
        trigger.setAttribute('aria-expanded', String(isOpen));
      }
    });
    item.addEventListener('mouseenter', function () {
      if (window.innerWidth > 900) {
        item.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
    item.addEventListener('mouseleave', function () {
      if (window.innerWidth > 900) close();
    });
  });

  /* Close mobile menu when a plain nav link (not a submenu toggle) is clicked.
     The "خدماتنا" trigger is also an <a class="nav-link">, but on mobile its
     click only expands/collapses the mega-menu in place (see above) — it
     must not also collapse the whole drawer, so it's excluded here. */
  if (nav) {
    nav.querySelectorAll('a.mega-link, a.nav-link').forEach(function (a) {
      var parentItem = a.closest('.nav-item');
      if (parentItem && parentItem.classList.contains('has-menu') && a.classList.contains('nav-link')) return;
      a.addEventListener('click', function () {
        if (window.innerWidth <= 900) closeMenu();
      });
    });
  }

  /* FAQ accordion */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var q = item.querySelector('.faq-q');
    var a = item.querySelector('.faq-a');
    if (!q || !a) return;
    q.setAttribute('aria-expanded', 'false');
    q.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');
      var faqRoot = item.parentElement;
      faqRoot.querySelectorAll('.faq-item.open').forEach(function (o) {
        if (o !== item) {
          o.classList.remove('open');
          o.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
          o.querySelector('.faq-a').style.maxHeight = null;
        }
      });
      item.classList.toggle('open', !isOpen);
      q.setAttribute('aria-expanded', String(!isOpen));
      a.style.maxHeight = !isOpen ? a.scrollHeight + 'px' : null;
    });
  });

  /* Tabs (blog category filter) — scoped to the same .i18n-block as the tab bar */
  document.querySelectorAll('.tabs[data-target]').forEach(function (tabs) {
    var scope = tabs.closest('.i18n-block') || document;
    var buttons = tabs.querySelectorAll('.tab');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.setAttribute('aria-selected', 'false'); });
        btn.setAttribute('aria-selected', 'true');
        var group = btn.getAttribute('data-filter');
        var targetList = scope.querySelector(tabs.getAttribute('data-target'));
        if (!targetList) return;
        targetList.querySelectorAll('[data-category]').forEach(function (card) {
          var show = group === 'all' || card.getAttribute('data-category') === group;
          card.style.display = show ? '' : 'none';
        });
      });
    });
  });

  /* Listing filters (auctions / projects) — scoped to the same .i18n-block */
  document.querySelectorAll('.filter-bar[data-target]').forEach(function (bar) {
    var scope = bar.closest('.i18n-block') || document;
    var list = scope.querySelector(bar.getAttribute('data-target'));
    if (!list) return;
    var selects = bar.querySelectorAll('select[data-filter]');
    var clearBtn = bar.querySelector('.js-clear-filters');
    function apply() {
      var filters = {};
      selects.forEach(function (s) { if (s.value) filters[s.getAttribute('data-filter')] = s.value; });
      var visible = 0;
      list.querySelectorAll('[data-card]').forEach(function (card) {
        var match = Object.keys(filters).every(function (key) {
          return card.getAttribute('data-' + key) === filters[key];
        });
        card.style.display = match ? '' : 'none';
        if (match) visible++;
      });
      var counter = bar.parentElement.querySelector('[data-results-count]');
      if (counter) counter.textContent = visible;
    }
    selects.forEach(function (s) { s.addEventListener('change', apply); });
    if (clearBtn) clearBtn.addEventListener('click', function () {
      selects.forEach(function (s) { s.selectedIndex = 0; });
      apply();
    });
  });

  /* Scroll reveal */
  var revealEls = document.querySelectorAll('.reveal, .reveal-stagger');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* Animated stat counters */
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && counters.length) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseInt(el.getAttribute('data-count'), 10);
        if (isNaN(target)) return;
        var duration = 1400;
        var startTime = null;
        function frame(ts) {
          if (!startTime) startTime = ts;
          var progress = Math.min((ts - startTime) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(target * eased).toLocaleString('en-US');
          if (progress < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
        cio.unobserve(el);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* Back to top */
  var backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    document.addEventListener('scroll', function () {
      backToTop.classList.toggle('show', window.scrollY > 700);
    }, { passive: true });
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* Countdown widget (auction detail) */
  document.querySelectorAll('[data-countdown]').forEach(function (widget) {
    var target = new Date(widget.getAttribute('data-countdown')).getTime();
    var dayEl = widget.querySelector('[data-cd-days]');
    var hourEl = widget.querySelector('[data-cd-hours]');
    var minEl = widget.querySelector('[data-cd-mins]');
    function tick() {
      var diff = target - Date.now();
      if (diff < 0) diff = 0;
      var days = Math.floor(diff / 86400000);
      var hours = Math.floor((diff % 86400000) / 3600000);
      var mins = Math.floor((diff % 3600000) / 60000);
      if (dayEl) dayEl.textContent = String(days).padStart(2, '0');
      if (hourEl) hourEl.textContent = String(hours).padStart(2, '0');
      if (minEl) minEl.textContent = String(mins).padStart(2, '0');
    }
    tick();
    setInterval(tick, 60000);
  });

  /* Form validation + demo submit state */
  document.querySelectorAll('.js-validate-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;
      form.querySelectorAll('[required]').forEach(function (input) {
        var field = input.closest('.field') || input.closest('.radio-group-wrap');
        var value = input.type === 'checkbox' ? input.checked : input.value.trim();
        var ok = value;
        if (input.type === 'tel' && value) {
          ok = /^[0-9+\s-]{7,}$/.test(input.value.trim());
        }
        if (input.type === 'radio') {
          var group = form.querySelectorAll('input[name="' + input.name + '"]');
          ok = Array.prototype.some.call(group, function (r) { return r.checked; });
        }
        if (field) field.classList.toggle('invalid', !ok);
        if (!ok) valid = false;
      });
      if (!valid) {
        var firstInvalid = form.querySelector('.invalid');
        if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      form.style.display = 'none';
      var success = form.parentElement.querySelector('.form-success');
      if (success) success.classList.add('show');
    });
  });

  /* Active nav link by current page filename */
  var path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link[data-page]').forEach(function (link) {
    if (link.getAttribute('data-page') === path) link.setAttribute('aria-current', 'page');
  });
})();

/* Premium homepage hero slider */
(function () {
  'use strict';
  document.querySelectorAll('[data-hero-slider]').forEach(function (root) {
    var slides = root.querySelectorAll('.hero-slide');
    var dots = root.querySelectorAll('[data-hero-dot]');
    var current = root.querySelector('[data-hero-current]');
    var prev = root.querySelector('[data-hero-prev]');
    var next = root.querySelector('[data-hero-next]');
    if (!slides.length || root.dataset.heroInit) return;
    root.dataset.heroInit = '1';
    var DELAY = 6500;
    var index = 0, timer = null, hovered = false, focused = false;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.style.setProperty('--hero-delay', DELAY + 'ms');
    function isRTL() { return document.documentElement.dir === 'rtl'; }

    function show(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (slide, n) {
        var active = n === index;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
      });
      dots.forEach(function (dot, n) {
        var active = n === index;
        // Re-adding the class recreates the ::after progress bar, restarting its animation.
        dot.classList.remove('is-active');
        if (active) { void dot.offsetWidth; dot.classList.add('is-active'); }
        dot.setAttribute('aria-selected', String(active));
        dot.tabIndex = active ? 0 : -1;
      });
      if (current) current.textContent = String(index + 1).padStart(2, '0');
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function restart() {
      stop();
      var paused = hovered || focused || reduceMotion;
      root.classList.toggle('is-paused', paused);
      if (paused || document.hidden) return;
      // The inactive language's copy stays in the DOM (hidden); don't animate it.
      timer = setInterval(function () { if (!root.closest('[hidden]')) show(index + 1); }, DELAY);
    }
    function go(i) { show(i); restart(); }
    function setHover(v) { hovered = v; if (!v) show(index); restart(); }
    function setFocus(v) { focused = v; if (!v) show(index); restart(); }

    dots.forEach(function (dot) { dot.addEventListener('click', function () { go(parseInt(dot.dataset.heroDot, 10)); }); });
    if (prev) prev.addEventListener('click', function () { go(index - 1); });
    if (next) next.addEventListener('click', function () { go(index + 1); });
    root.addEventListener('mouseenter', function () { setHover(true); });
    root.addEventListener('mouseleave', function () { setHover(false); });
    root.addEventListener('focusin', function () { if (!focused) setFocus(true); });
    root.addEventListener('focusout', function (e) { if (!root.contains(e.relatedTarget)) setFocus(false); });
    root.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (e.target.closest && !e.target.closest('.hero-slider-ui')) return;
      var forward = (e.key === 'ArrowLeft') === isRTL();
      go(index + (forward ? 1 : -1));
      var dot = dots[index];
      if (dot && e.target.classList.contains('hero-dot')) dot.focus();
      e.preventDefault();
    });
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else restart(); });

    var startX = 0, startY = 0;
    root.addEventListener('touchstart', function (e) { startX = e.changedTouches[0].clientX; startY = e.changedTouches[0].clientY; }, { passive: true });
    root.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - startX;
      var dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return;
      // Swiping toward the reading direction's end advances: left in LTR, right in RTL.
      var forward = isRTL() ? dx > 0 : dx < 0;
      go(index + (forward ? 1 : -1));
    }, { passive: true });

    show(0); restart();
  });
})();

(function(){"use strict";if(!window.matchMedia("(pointer:fine)").matches)return;document.querySelectorAll(".card,.gallery-item").forEach(function(el){el.addEventListener("pointermove",function(e){if(innerWidth<900)return;var r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;el.style.setProperty("--mx",x*100+"%");el.style.setProperty("--my",y*100+"%")});el.addEventListener("pointerleave",function(){el.style.removeProperty("--mx");el.style.removeProperty("--my")})})})();

/* BiDi numbers: on pages with <body data-bidi-numbers>, wrap numeric runs in text
   (e.g. "+966 55 059 5911", "9:00", "2026/09/24", "25%") in <span class="num">,
   which main.css isolates as LTR. A MutationObserver covers text inserted later
   (translations, dynamic content). Digits are left in their original form. */
(function () {
  'use strict';
  var body = document.body;
  if (!body || !body.hasAttribute('data-bidi-numbers')) return;
  // separators (: / . , - space) only count when another digit follows, so a sentence's
  // closing period stays in the Arabic flow instead of being pulled into the number
  var RUN = /\+?\d(?:\d|[:\/.,٫\-–](?=\d)|\s(?=\+?\d))*%?/g;
  var TEST = /\d/;
  var SKIP = /^(SCRIPT|STYLE|TEXTAREA|INPUT|SELECT|OPTION|CODE|PRE|SVG|BDI)$/;
  function skip(el) {
    for (; el && el !== body; el = el.parentElement) {
      if (SKIP.test(el.tagName) || el.classList.contains('num') || el.classList.contains('legal-index') ||
          el.hasAttribute('data-no-bidi') || el.isContentEditable || (el.tagName === 'A' && /^tel:/.test(el.getAttribute('href') || ''))) return true;
    }
    return false;
  }
  function wrapText(node) {
    var text = node.nodeValue;
    if (!TEST.test(text) || skip(node.parentElement)) return;
    RUN.lastIndex = 0;
    var frag = document.createDocumentFragment(), last = 0, m;
    while ((m = RUN.exec(text))) {
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      var span = document.createElement('span');
      span.className = 'num';
      span.textContent = m[0];
      frag.appendChild(span);
      last = m.index + m[0].length;
    }
    if (!last) return;
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag, node);
  }
  function scan(root) {
    if (root.nodeType === 3) { wrapText(root); return; }
    if (root.nodeType !== 1 || skip(root)) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(wrapText);
  }
  var observer = new MutationObserver(function (records) {
    observer.disconnect();
    records.forEach(function (r) {
      if (r.type === 'characterData') wrapText(r.target);
      else r.addedNodes.forEach(scan);
    });
    observe();
  });
  function observe() { observer.observe(body, { childList: true, characterData: true, subtree: true }); }
  scan(body);
  observe();
})();
