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
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = target.toLocaleString('en-US'); cio.unobserve(el); return; }
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
      widget.classList.toggle('is-past', diff <= 0);
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

/* Homepage editorial sections: reveal once the section scrolls into view. */
(function () {
  'use strict';
  var sections = document.querySelectorAll('[data-stats-editorial],[data-services-editorial],[data-paths-editorial],[data-process-step],[data-journal-editorial],[data-journal-item],[data-trust-editorial],[data-prop-section]');
  if (!sections.length) return;
  if (!('IntersectionObserver' in window)) { sections.forEach(function (s) { s.classList.add('is-in'); }); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { threshold: 0, rootMargin: '0px 0px -25% 0px' });
  sections.forEach(function (s) { io.observe(s); });
})();

/* Homepage services list.
   Desktop (>=992px, motion allowed): a sticky scroll story. The section becomes a
   tall track, its content sticks under the header, and scroll progress through the
   track picks the active service (01 -> 04); then the page scrolls on normally.
   Clicking an inactive row scrolls to its stage; clicking the active row opens it.
   Elsewhere: hovering, focusing or tapping a row activates it (on touch, the first
   tap on an inactive row only activates it). */
(function () {
  'use strict';
  var sections = document.querySelectorAll('[data-services-editorial]');
  if (!sections.length) return;
  var mqWide = window.matchMedia('(min-width: 992px)');
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var controllers = [];

  sections.forEach(function (section) {
    var items = section.querySelectorAll('[data-service-index]');
    var images = section.querySelectorAll('[data-service-image]');
    var media = section.querySelector('.services-editorial__media');
    var current = 0, touchTap = false, wasActive = false;

    function activate(i) {
      if (i !== current && media) media.setAttribute('data-dir', i > current ? 'next' : 'prev');
      items.forEach(function (el, n) {
        el.classList.toggle('is-active', n === i);
        if (n === i) el.setAttribute('aria-current', 'true'); else el.removeAttribute('aria-current');
      });
      images.forEach(function (img, n) {
        img.classList.toggle('is-prev', n === current && n !== i);
        img.classList.toggle('is-active', n === i);
        if (n === i) img.removeAttribute('aria-hidden'); else img.setAttribute('aria-hidden', 'true');
      });
      current = i;
    }
    function sticky() { return section.classList.contains('is-sticky'); }
    // scroll offset (from the track's top) at which stage i begins
    function stageTop(i) {
      var range = section.offsetHeight - window.innerHeight;
      return section.getBoundingClientRect().top + window.scrollY + range * (i + 0.5) / items.length;
    }
    function update() {
      if (!sticky() || !section.offsetParent) return;
      var range = section.offsetHeight - window.innerHeight;
      var progress = Math.min(1, Math.max(0, -section.getBoundingClientRect().top / range));
      section.style.setProperty('--sv-progress', progress.toFixed(4));
      var i = Math.min(items.length - 1, Math.floor(progress * items.length));
      if (i !== current) activate(i);
    }

    items.forEach(function (el, i) {
      el.addEventListener('pointerdown', function (e) {
        touchTap = e.pointerType === 'touch';
        wasActive = el.classList.contains('is-active');
      });
      el.addEventListener('mouseenter', function () { if (!sticky()) activate(i); });
      el.addEventListener('focus', function () { activate(i); });
      el.addEventListener('click', function (e) {
        if (sticky()) {
          if (!el.classList.contains('is-active') || (touchTap && !wasActive)) {
            e.preventDefault();
            window.scrollTo({ top: stageTop(i), behavior: 'smooth' });
          }
        } else if (touchTap && !wasActive) {
          e.preventDefault();
        }
        touchTap = false;
        activate(i);
      });
    });
    controllers.push({ section: section, update: update });
  });

  // update() is a single rect read per section; scroll already fires at most once per frame
  function onScroll() { controllers.forEach(function (c) { c.update(); }); }
  function setMode() {
    var on = mqWide.matches && !mqReduce.matches;
    controllers.forEach(function (c) {
      c.section.classList.toggle('is-sticky', on);
      if (!on) c.section.style.removeProperty('--sv-progress');
    });
    onScroll();
  }
  [mqWide, mqReduce].forEach(function (mq) {
    if (mq.addEventListener) mq.addEventListener('change', setMode); else mq.addListener(setMode);
  });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  // the hidden language's copy has no layout until it is shown
  document.addEventListener('aqar:languagechange', onScroll);
  setMode();
})();

/* Journal items + property cards: subtle cursor parallax inside the hovered card's image.
   Fine pointers only, never with reduced motion; listeners live on each article,
   so nothing runs unless the pointer is over one. */
(function () {
  'use strict';
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.journal-editorial__item, .prop-card').forEach(function (item) {
    var media = item.querySelector('.journal-editorial__media') || item;
    if (!media) return;
    item.addEventListener('pointermove', function (e) {
      var r = media.getBoundingClientRect();
      var x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      var y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
      item.style.setProperty('--jx', x.toFixed(3));
      item.style.setProperty('--jy', y.toFixed(3));
    });
    item.addEventListener('pointerleave', function () {
      item.style.setProperty('--jx', '0');
      item.style.setProperty('--jy', '0');
    });
  });
})();

/* Home property carousels: a centred active card with neighbours on both sides
   (looping), tabs that filter the set, arrows, dots, counter, keys and swipe.
   Cards are positioned by JS; CSS handles the transitions. */
(function () {
  'use strict';
  // Wait for DOMContentLoaded: language.js shows the saved language's block then,
  // and measuring earlier would size the hidden block's carousels.
  function initAll() {
  document.querySelectorAll('[data-prop-carousel]').forEach(function (root) {
    if (root.dataset.propInit) return;   // idempotent: never bind a second instance
    root.dataset.propInit = '1';
    var section = root.closest('[data-prop-section]');
    var viewport = root.querySelector('.prop-carousel__viewport');
    var all = Array.prototype.slice.call(viewport.querySelectorAll('.prop-card'));
    var dotsBox = root.querySelector('[data-prop-dots]');
    var curEl = root.querySelector('[data-prop-current]'), totEl = root.querySelector('[data-prop-total]');
    var prevBtn = root.querySelector('[data-prop-prev]'), nextBtn = root.querySelector('[data-prop-next]');
    var tabs = section ? section.querySelectorAll('[data-prop-filter]') : [];
    var items = all.slice(), active = 0, slots = new Map();
    var key = all[0] && all[0].classList.contains('prop-card--auction') ? 'status' : 'type';
    function rtl() { return document.documentElement.dir === 'rtl'; }
    function pad(n) { return String(n).padStart(2, '0'); }
    function metrics() {
      var W = viewport.clientWidth, vw = window.innerWidth;
      var perView = vw >= 1100 ? 3 : 1;
      var gap = vw >= 1100 ? 18 : 14;
      var w = perView === 3 ? (W - gap * 2) / 3 : Math.min(W * (vw >= 700 ? 0.62 : 0.86), 520);
      return { w: w, gap: gap, h: w / 0.87, perView: perView };
    }
    function layout(noAnim) {
      if (!viewport.offsetParent) return;
      var m = metrics(), n = items.length;
      root.style.setProperty('--pc-w', m.w + 'px');
      root.style.setProperty('--pc-vh', Math.round(m.h * 1.1) + 'px');
      all.forEach(function (c) { if (items.indexOf(c) < 0) { c.hidden = true; } });
      items.forEach(function (c, i) {
        c.hidden = false;
        var rel = ((i - active) % n + n) % n;           // 0..n-1
        if (rel > n / 2) rel -= n;                     // centre the loop
        if (n === 2 && rel === -1) rel = 1;
        var prev = slots.get(c);
        var jump = noAnim || (prev !== undefined && Math.abs(prev - rel) > 1);
        c.classList.toggle('is-jump', jump);
        slots.set(c, rel);
        var dist = Math.abs(rel);
        var x = rel * (m.w + m.gap) * (rtl() ? -1 : 1);
        var scale = dist === 0 ? 1.06 : 0.97;
        c.style.transform = 'translateX(' + x + 'px) scale(' + scale + ')';
        c.style.zIndex = String(10 - dist);
        c.style.opacity = dist > 2 ? '0' : dist === 2 ? '.55' : '1';
        c.classList.toggle('is-center', dist === 0);
        c.classList.toggle('is-peek', dist === 2);
        // only the cards actually in view take part in tab order / the a11y tree
        var visible = dist <= (m.perView === 3 ? 1 : 0);
        if (visible) c.removeAttribute('inert'); else c.setAttribute('inert', '');
        c.setAttribute('aria-hidden', String(!visible));
      });
      requestAnimationFrame(function () { items.forEach(function (c) { c.classList.remove('is-jump'); }); });
      curEl.textContent = pad(n ? active + 1 : 0);
      totEl.textContent = pad(n);
      Array.prototype.forEach.call(dotsBox.children, function (d, i) {
        if (i === active) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
      });
      prevBtn.disabled = nextBtn.disabled = n < 2;
    }
    function buildDots() {
      dotsBox.innerHTML = '';
      items.forEach(function (c, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', pad(i + 1) + ' / ' + pad(items.length));
        b.addEventListener('click', function () { go(i); });
        dotsBox.appendChild(b);
      });
    }
    // autoplay: one timer per carousel, re-armed by every go() call
    var AUTOPLAY_MS = 4500;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var timer = null, hovering = false, touching = false, keyboardFocus = false, inView = false;
    function canAutoplay() {
      return !reduceMotion && inView && !document.hidden && !hovering && !touching && !keyboardFocus &&
        items.length > 1 && !!viewport.offsetParent;
    }
    function stopAutoplay() { if (timer) { clearTimeout(timer); timer = null; } }
    function armAutoplay() {
      stopAutoplay();
      if (canAutoplay()) timer = setTimeout(function () { timer = null; go(active + 1); }, AUTOPLAY_MS);
    }
    function go(i) { var n = items.length; if (!n) return; active = ((i % n) + n) % n; layout(); armAutoplay(); }
    prevBtn.addEventListener('click', function () { go(active - 1); });
    nextBtn.addEventListener('click', function () { go(active + 1); });
    root.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      var forward = (e.key === 'ArrowLeft') === rtl();
      go(active + (forward ? 1 : -1));
      e.preventDefault();
    });
    // clicking a side card brings it to the centre instead of following its link
    items.forEach(function (c) {
      c.addEventListener('click', function (e) {
        if (c.classList.contains('is-center')) return;
        var i = items.indexOf(c);
        if (i > -1) { e.preventDefault(); go(i); }
      }, true);
    });
    // swipe
    var sx = 0, sy = 0, tracking = false;
    viewport.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse') return; tracking = true; touching = true; stopAutoplay(); sx = e.clientX; sy = e.clientY; });
    viewport.addEventListener('pointerup', function (e) {
      if (!tracking) return; tracking = false; touching = false;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
      var forward = rtl() ? dx > 0 : dx < 0;
      go(active + (forward ? 1 : -1));
    });
    viewport.addEventListener('pointercancel', function () { tracking = false; touching = false; armAutoplay(); });
    viewport.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse' && !timer) armAutoplay(); });
    // pause while a mouse is over the carousel or keyboard focus is inside it
    root.addEventListener('mouseenter', function () { hovering = true; stopAutoplay(); });
    root.addEventListener('mouseleave', function () { hovering = false; armAutoplay(); });
    root.addEventListener('focusin', function (e) {
      if (e.target.matches && e.target.matches(':focus-visible')) { keyboardFocus = true; stopAutoplay(); }
    });
    root.addEventListener('focusout', function (e) {
      if (!root.contains(e.relatedTarget)) { keyboardFocus = false; armAutoplay(); }
    });
    document.addEventListener('visibilitychange', armAutoplay);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[entries.length - 1].isIntersecting; armAutoplay();
      }, { threshold: 0.25 }).observe(root);
    } else { inView = true; }
    Array.prototype.forEach.call(tabs, function (tab) {
      tab.addEventListener('click', function () {
        Array.prototype.forEach.call(tabs, function (t) { t.setAttribute('aria-selected', String(t === tab)); });
        var f = tab.getAttribute('data-prop-filter');
        items = all.filter(function (c) { return f === 'all' || c.getAttribute('data-' + key) === f; });
        active = 0; slots.clear(); buildDots(); layout(true); armAutoplay();
      });
    });
    buildDots(); layout(true);
    // Re-layout whenever the viewport's size changes (including when a hidden
    // language block becomes visible). layout() keeps the current slide.
    function relayout() { slots.clear(); layout(true); armAutoplay(); }
    if ('ResizeObserver' in window) new ResizeObserver(relayout).observe(viewport);
    else window.addEventListener('resize', relayout);
    document.addEventListener('aqar:languagechange', relayout);   // explicit switch
  });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll);
  else initAll();
})();

/* Homepage video hero: fade the video in once frames are playing; the poster
   (also the section background) stays visible if autoplay is blocked.
   Reduced-motion users get the still poster instead of a moving background. */
(function () {
  'use strict';
  var video = document.querySelector('[data-hero-video] video');
  if (!video) return;
  var root = video.closest('[data-hero-video]');
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    video.removeAttribute('autoplay');
    video.pause();
    return;
  }
  function ready() { root.classList.add('is-playing'); }
  if (!video.paused && video.readyState > 2) ready();
  else video.addEventListener('playing', ready, { once: true });
  // Chrome pauses video in background tabs; retry when the page becomes visible.
  function play() {
    var p = video.play();
    if (p && p.catch) p.catch(function () { /* autoplay blocked: poster remains */ });
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden && video.paused) play(); });
  play();
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
