/**
 * DeepSeek Orbit — Unicode Bi-directional RTL Detection Engine
 */
(function () {
  'use strict';

  window.DeepSeekOrbit = window.DeepSeekOrbit || {};

  const STRIP_PUNCTUATION_REGEX = /^[\s\d\p{P}\p{S}\p{Emoji}\p{Emoji_Component}]+/u;

  function isRTLChar(char) {
    const code = char.charCodeAt(0);
    return (
      (code >= 0x0600 && code <= 0x06FF) || // Arabic / Persian
      (code >= 0x0750 && code <= 0x077F) || // Arabic Supplement
      (code >= 0x08A0 && code <= 0x08FF) || // Arabic Extended-A
      (code >= 0xFB50 && code <= 0xFDFF) || // Arabic Presentation Forms-A
      (code >= 0xFE70 && code <= 0xFEFF) || // Arabic Presentation Forms-B
      (code >= 0x0590 && code <= 0x05FF) || // Hebrew
      (code >= 0x0860 && code <= 0x086F) || // Syriac
      (code >= 0x0780 && code <= 0x07BF)    // Thaana
    );
  }

  function detectDirection(text) {
    if (!text || typeof text !== 'string') return null;
    const cleanText = text.replace(STRIP_PUNCTUATION_REGEX, '');
    if (!cleanText) return null;

    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      if (/[\s\d\p{P}\p{S}]/u.test(char)) continue;
      return isRTLChar(char) ? 'rtl' : 'ltr';
    }
    return null;
  }

  function isProtectedElement(el) {
    if (!el) return true;
    if (el.closest('pre') || el.closest('.md-code-block') || el.closest('.katex') || el.closest('.ds-export-toolbar') || el.closest('.ds-code-modal-backdrop') || el.closest('.ds-nav-drawer') || el.closest('.ds-search-bar-wrap')) return true;
    return false;
  }

  function processElement(el, mode = 'auto') {
    if (!el || isProtectedElement(el)) return;
    if (el.dataset && el.dataset.dsUserOverride === 'true') return;

    if (mode === 'always-rtl') {
      el.setAttribute('dir', 'rtl');
      el.classList.add('ds-dir-rtl');
      el.classList.remove('ds-dir-ltr');
      return;
    }

    if (mode === 'always-ltr') {
      el.setAttribute('dir', 'ltr');
      el.classList.add('ds-dir-ltr');
      el.classList.remove('ds-dir-rtl');
      return;
    }

    const text = el.textContent || '';
    if (!text.trim()) return;

    const dir = detectDirection(text);
    if (dir === 'rtl') {
      el.setAttribute('dir', 'rtl');
      el.classList.add('ds-dir-rtl');
      el.classList.remove('ds-dir-ltr');
    } else if (dir === 'ltr') {
      el.setAttribute('dir', 'ltr');
      el.classList.add('ds-dir-ltr');
      el.classList.remove('ds-dir-rtl');
    }
  }

  window.DeepSeekOrbit.Detector = {
    detectDirection,
    isRTLChar,
    processElement,
    isProtectedElement
  };
})();
