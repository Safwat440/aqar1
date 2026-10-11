/* Home news brief: seamless, clone-free carousel for the existing article set. */
(function () {
  'use strict';
  var INTERVAL = 3600;
  var roots = document.querySelectorAll('[data-news-carousel]');
  if (!roots.length) return;

  roots.forEach(function (root) {
    if (root.dataset.newsCarouselInit) return;
    root.dataset.newsCarouselInit = 'true';

    var viewport = root.querySelector('[data-news-viewport]');
    var track = root.querySelector('[data-news-track]');
    if (!viewport || !track || track.children.length < 2) return;

    var timer = null;
    var pending = '';
    var focused = false;
    var dragging = false;
    var moved = false;
    var suppressClick = false;
    var pointerId = null;
    var startX = 0;
    var dragDelta = 0;
    var inView = false;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function isRTL() {
      return document.documentElement.dir === 'rtl';
    }

    function activeLanguageBlock() {
      return !root.closest('.i18n-block[hidden]');
    }

    function canRun() {
      return activeLanguageBlock() && !focused && !dragging;
    }

    function stopTimer() {
      window.clearTimeout(timer);
      timer = null;
    }

    function cardGap() {
      return parseFloat(window.getComputedStyle(track).columnGap) || 0;
    }

    function cardDistance(card) {
      return card ? card.getBoundingClientRect().width + cardGap() : 0;
    }

    function updateCurrent() {
      var first = track.firstElementChild;
      if (first) root.setAttribute('data-current-article', first.getAttribute('data-news-id') || '');
    }

    function schedule() {
      stopTimer();
      if (!canRun() || pending) return;
      timer = window.setTimeout(function () { moveNext(0); }, INTERVAL);
    }

    function resetTransform() {
      track.style.transition = 'none';
      track.style.transform = 'translate3d(0,0,0)';
      void track.offsetWidth;
      track.style.removeProperty('transition');
    }

    function finishMove() {
      if (!pending) return;
      var action = pending;
      pending = '';
      track.style.transition = 'none';
      if (action === 'next' && track.firstElementChild) track.appendChild(track.firstElementChild);
      track.style.transform = 'translate3d(0,0,0)';
      void track.offsetWidth;
      track.style.removeProperty('transition');
      updateCurrent();
      schedule();
    }

    function moveNext(fromX) {
      if (pending || dragging || !track.firstElementChild) return;
      stopTimer();
      var distance = cardDistance(track.firstElementChild);
      if (!distance) { schedule(); return; }
      var sign = isRTL() ? 1 : -1;
      if (reduceMotion) {
        track.appendChild(track.firstElementChild);
        resetTransform();
        updateCurrent();
        schedule();
        return;
      }
      pending = 'next';
      track.style.transition = '';
      var target = sign * distance;
      window.requestAnimationFrame(function () {
        track.style.transform = 'translate3d(' + target + 'px,0,0)';
      });
    }

    function movePrevious(fromX) {
      if (pending || dragging || !track.lastElementChild) return;
      stopTimer();
      var last = track.lastElementChild;
      var distance = cardDistance(last);
      if (!distance) { schedule(); return; }
      if (reduceMotion) {
        track.insertBefore(last, track.firstElementChild);
        resetTransform();
        updateCurrent();
        schedule();
        return;
      }
      var compensation = (isRTL() ? 1 : -1) * distance;
      track.style.transition = 'none';
      track.insertBefore(last, track.firstElementChild);
      track.style.transform = 'translate3d(' + (compensation + (fromX || 0)) + 'px,0,0)';
      void track.offsetWidth;
      pending = 'previous';
      window.requestAnimationFrame(function () {
        track.style.transition = '';
        track.style.transform = 'translate3d(0,0,0)';
      });
    }

    track.addEventListener('transitionend', function (event) {
      if (event.target === track && event.propertyName === 'transform') finishMove();
    });

    root.addEventListener('focusin', function () { focused = true; stopTimer(); });
    root.addEventListener('focusout', function (event) {
      if (!root.contains(event.relatedTarget)) { focused = false; schedule(); }
    });

    viewport.addEventListener('pointerdown', function (event) {
      if (event.button !== -1 && event.button !== 0) return;
      if (pending) return;
      dragging = true;
      moved = false;
      pointerId = event.pointerId;
      startX = event.clientX;
      dragDelta = 0;
      stopTimer();
      if (viewport.setPointerCapture && pointerId != null) viewport.setPointerCapture(pointerId);
    });
    viewport.addEventListener('pointermove', function (event) {
      if (!dragging || event.pointerId !== pointerId) return;
      dragDelta = event.clientX - startX;
      if (Math.abs(dragDelta) > 6) moved = true;
      if (moved) {
        track.style.transition = 'none';
        track.style.transform = 'translate3d(' + dragDelta + 'px,0,0)';
      }
    });
    function endPointer(event, cancelled) {
      if (!dragging || (event && event.pointerId !== pointerId)) return;
      dragging = false;
      if (viewport.releasePointerCapture && pointerId != null && viewport.hasPointerCapture && viewport.hasPointerCapture(pointerId)) {
        viewport.releasePointerCapture(pointerId);
      }
      pointerId = null;
      var dx = cancelled ? 0 : dragDelta;
      if (!cancelled && moved && Math.abs(dx) > 48) {
        suppressClick = true;
        window.setTimeout(function () { suppressClick = false; }, 250);
        var forwardSign = isRTL() ? 1 : -1;
        if (dx * forwardSign > 0) moveNext(dx);
        else movePrevious(dx);
      } else {
        track.style.transition = '';
        track.style.transform = 'translate3d(0,0,0)';
        schedule();
      }
      moved = false;
      dragDelta = 0;
    }
    viewport.addEventListener('pointerup', function (event) { endPointer(event, false); });
    viewport.addEventListener('pointercancel', function (event) { endPointer(event, true); });
    viewport.addEventListener('click', function (event) {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);

    viewport.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft') {
        if (isRTL()) moveNext(0); else movePrevious(0);
        event.preventDefault();
      } else if (event.key === 'ArrowRight') {
        if (isRTL()) movePrevious(0); else moveNext(0);
        event.preventDefault();
      }
    });

    function preloadImages() {
      root.querySelectorAll('img').forEach(function (image) { image.loading = 'eager'; });
    }

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.target !== root) return;
          inView = entry.isIntersecting;
          if (inView) preloadImages();
          schedule();
        });
      }, { threshold: 0.08 });
      observer.observe(root);
    } else {
      inView = true;
      preloadImages();
    }

    document.addEventListener('visibilitychange', schedule);
    document.addEventListener('aqar:languagechange', function () {
      stopTimer();
      if (!activeLanguageBlock() && pending) finishMove();
      var bounds = root.getBoundingClientRect();
      inView = activeLanguageBlock() && bounds.bottom > 0 && bounds.top < window.innerHeight;
      if (inView) preloadImages();
      schedule();
    });
    window.addEventListener('resize', function () {
      if (pending) finishMove();
      else if (!dragging) resetTransform();
    });
    updateCurrent();
    schedule();
  });
})();
