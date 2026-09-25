// عقار ونّ — centralized language controller
// Default language: Arabic. Persists choice in localStorage under 'aqarLanguage'.
// Swaps: html[lang]/[dir], the arabic.css/english.css stylesheet, header/footer
// text via [data-i18n], and the current page's bilingual <main> content blocks
// (elements with .i18n-block[data-lang]) — all without navigating away.
(function () {
  'use strict';
  var STORAGE_KEY = 'aqarLanguage';

  function getStoredLang() {
    try {
      var v = localStorage.getItem(STORAGE_KEY);
      return v === 'ar' || v === 'en' ? v : null;
    } catch (e) { return null; }
  }

  function storeLang(lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignore */ }
  }

  function applyTranslations(lang) {
    var dict = window.translations && window.translations[lang];
    if (!dict) return;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (dict[key] != null) el.textContent = dict[key];
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-aria');
      if (dict[key] != null) el.setAttribute('aria-label', dict[key]);
    });
  }

  // <title data-title-ar data-title-en> and <meta name="description" data-content-ar data-content-en>
  function applyDocumentMeta(lang) {
    var title = document.querySelector('title[data-title-' + lang + ']');
    if (title) document.title = title.getAttribute('data-title-' + lang);
    var desc = document.querySelector('meta[name="description"][data-content-' + lang + ']');
    if (desc) desc.setAttribute('content', desc.getAttribute('data-content-' + lang));
  }

  function swapStylesheet(lang) {
    var link = document.getElementById('lang-style');
    if (!link) return;
    var href = lang === 'ar' ? 'assets/css/arabic.css' : 'assets/css/english.css';
    if (!link.getAttribute('href').endsWith(href)) link.setAttribute('href', href);
  }

  function toggleContentBlocks(lang) {
    document.querySelectorAll('.i18n-block').forEach(function (block) {
      block.hidden = block.getAttribute('data-lang') !== lang;
    });
  }

  // Cross-page / footer links (e.g. "about.html#companies") target a plain,
  // unscoped id. Since the same section exists once per language block, an
  // invisible .anchor-slot marker (no static id) is assigned the live plain
  // id only inside the currently-visible block, so native #hash navigation
  // always resolves to the active language's content.
  function syncAnchorSlots() {
    document.querySelectorAll('.anchor-slot[data-anchor]').forEach(function (el) {
      el.removeAttribute('id');
    });
    document.querySelectorAll('.i18n-block:not([hidden]) .anchor-slot[data-anchor]').forEach(function (el) {
      el.id = el.getAttribute('data-anchor');
    });
  }

  function updateLangSwitchButtons(lang) {
    var dict = window.translations[lang];
    document.querySelectorAll('.js-lang-switch').forEach(function (btn) {
      var label = btn.querySelector('.lang-switch-label');
      if (label) label.textContent = dict['lang.switchLabel'];
      btn.setAttribute('aria-label', dict['lang.switchAria']);
    });
  }

  function setLanguage(lang, opts) {
    opts = opts || {};
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('data-lang', lang);
    swapStylesheet(lang);
    applyTranslations(lang);
    applyDocumentMeta(lang);
    toggleContentBlocks(lang);
    syncAnchorSlots();
    updateLangSwitchButtons(lang);
    storeLang(lang);
    if (!opts.silent) {
      document.dispatchEvent(new CustomEvent('aqar:languagechange', { detail: { lang: lang } }));
    }
  }

  function initLanguage() {
    var lang = getStoredLang() || 'ar';
    setLanguage(lang, { silent: true, initial: true });
    document.querySelectorAll('.js-lang-switch').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var current = document.documentElement.getAttribute('lang') === 'ar' ? 'ar' : 'en';
        // Close mobile menu cleanly if open, to avoid broken positioning mid-switch.
        // Done before setLanguage so listeners of aqar:languagechange see the final state.
        var nav = document.getElementById('main-nav');
        var toggle = document.querySelector('.nav-toggle');
        var overlay = document.querySelector('.nav-overlay');
        if (nav && nav.classList.contains('open')) {
          nav.classList.remove('open');
          if (toggle) toggle.setAttribute('aria-expanded', 'false');
          if (overlay) overlay.classList.remove('show');
          document.body.classList.remove('menu-open');
        }
        setLanguage(current === 'ar' ? 'en' : 'ar');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLanguage);
  } else {
    initLanguage();
  }

  window.AqarLanguage = { setLanguage: setLanguage, getLang: function () { return document.documentElement.getAttribute('lang') || 'ar'; } };
})();
