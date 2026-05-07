/**
 * DeepSeek Orbit — Code Enhancements (Sticky Line Numbers, Word Wrap, Fullscreen Viewer)
 */
(function () {
  'use strict';

  window.DeepSeekOrbit = window.DeepSeekOrbit || {};
  const ICONS = window.DeepSeekOrbit.ICONS || {};

  function applyLineNumbers(codeBlock) {
    if (!codeBlock) return;
    const pre = codeBlock.querySelector('pre');
    if (!pre) return;

    if (pre.querySelector('.ds-line-numbers-gutter')) return;

    const code = pre.querySelector('code');
    const text = (code ? code.textContent : pre.textContent) || '';
    const lineCount = Math.max(1, text.split('\n').length);

    let gutter = pre.querySelector('.ds-line-numbers-gutter');
    if (!gutter) {
      gutter = document.createElement('div');
      gutter.className = 'ds-line-numbers-gutter';
      pre.insertBefore(gutter, pre.firstChild);
    }

    let linesHtml = '';
    for (let i = 1; i <= lineCount; i++) {
      linesHtml += `<span class="ds-line-num">${i}</span>`;
    }
    gutter.innerHTML = linesHtml;
  }

  function openCodeModal(pre, language = 'Code') {
    const existing = document.querySelector('.ds-code-modal-backdrop');
    if (existing) existing.remove();

    const code = pre.querySelector('code');
    const codeHtml = code ? code.innerHTML : pre.innerHTML;
    const lineCount = Math.max(1, (pre.textContent || '').split('\n').length);

    let linesHtml = '';
    for (let i = 1; i <= lineCount; i++) {
      linesHtml += `<span class="ds-line-num">${i}</span>`;
    }

    const modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'ds-code-modal-backdrop';
    modalBackdrop.innerHTML = `
      <div class="ds-code-modal">
        <div class="ds-code-modal-header">
          <div class="ds-code-modal-title">
            <span>${ICONS.code}</span> <span>${language}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div role="button" class="ds-button ds-button--borderlessNeutral ds-button--borderless ds-button--capsule ds-button--xs ds-button--icon-relative-m ds-button--min-width" id="modalWrapBtn" tabindex="0">
              <div class="ds-button__background"></div>
              <div class="ds-button__icon">${ICONS.wrap}</div>
              <span class="ds-button__content"><span class="code-info-button-text">Wrap</span></span>
            </div>
            <div role="button" class="ds-button ds-button--borderlessNeutral ds-button--borderless ds-button--capsule ds-button--xs ds-button--icon-relative-m ds-button--min-width" id="modalCopyBtn" tabindex="0">
              <div class="ds-button__background"></div>
              <div class="ds-button__icon">${ICONS.copy}</div>
              <span class="ds-button__content"><span class="code-info-button-text">Copy</span></span>
            </div>
            <button type="button" class="ds-code-modal-close-btn" id="modalCloseBtn" title="Close (Esc)">✕</button>
          </div>
        </div>
        <div class="ds-code-modal-body-wrap">
          <div class="ds-line-numbers-gutter">${linesHtml}</div>
          <pre class="ds-code-modal-body">${codeHtml}</pre>
        </div>
      </div>
    `;

    document.body.appendChild(modalBackdrop);
    void modalBackdrop.offsetWidth;
    modalBackdrop.classList.add('ds-modal-visible');

    const bodyEl = modalBackdrop.querySelector('.ds-code-modal-body');
    const wrapBtn = modalBackdrop.querySelector('#modalWrapBtn');
    const copyBtn = modalBackdrop.querySelector('#modalCopyBtn');
    const closeBtn = modalBackdrop.querySelector('#modalCloseBtn');

    wrapBtn.addEventListener('click', () => {
      bodyEl.classList.toggle('wrapped');
      wrapBtn.classList.toggle('ds-btn-active');
    });

    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(pre.textContent || '');
        copyBtn.querySelector('.ds-button__icon').innerHTML = ICONS.check;
        copyBtn.querySelector('.code-info-button-text').textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.querySelector('.ds-button__icon').innerHTML = ICONS.copy;
          copyBtn.querySelector('.code-info-button-text').textContent = 'Copy';
        }, 2000);
      } catch (e) {}
    });

    let isClosing = false;
    const closeModal = () => {
      if (isClosing) return;
      isClosing = true;
      modalBackdrop.classList.remove('ds-modal-visible');
      document.removeEventListener('keydown', escHandler);
      setTimeout(() => {
        if (modalBackdrop.parentNode) modalBackdrop.remove();
      }, 240);
    };

    closeBtn.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeModal();
    });

    const escHandler = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', escHandler);
  }

  function enhanceCodeBlocks(root = document) {
    const codeBlocks = root.querySelectorAll('.md-code-block');
    codeBlocks.forEach((cb) => {
      applyLineNumbers(cb);

      if (cb.dataset.dsEnhanced === 'true') return;
      cb.dataset.dsEnhanced = 'true';

      const banner = cb.querySelector('._121d384, .md-code-block-banner');
      if (!banner) return;

      // Remove DeepSeek's native Run button and its divider line
      banner.querySelectorAll('.ds-button, button, div[role="button"]').forEach(btn => {
        const txt = (btn.textContent || '').trim().toLowerCase();
        if (txt === 'run') {
          const prev = btn.previousElementSibling;
          if (prev && (prev.textContent.trim() === '|' || prev.className.includes('divider'))) {
            prev.remove();
          }
          btn.remove();
        }
      });

      const pre = cb.querySelector('pre');
      if (!pre) return;

      let btnGroup = banner.querySelector('.ds-code-btn-group');
      if (!btnGroup) {
        btnGroup = document.createElement('div');
        btnGroup.className = 'ds-code-btn-group';
        banner.appendChild(btnGroup);
      }

      // Word Wrap Button
      const wrapBtn = document.createElement('div');
      wrapBtn.setAttribute('role', 'button');
      wrapBtn.className = 'ds-button ds-button--borderlessNeutral ds-button--borderless ds-button--capsule ds-button--xs ds-button--icon-relative-m ds-button--min-width ds-code-btn-native';
      wrapBtn.setAttribute('tabindex', '0');
      wrapBtn.innerHTML = `
        <div class="ds-button__background"></div>
        <div class="ds-button__icon">${ICONS.wrap}</div>
        <span class="ds-button__content"><span class="code-info-button-text">Wrap</span></span>
      `;
      wrapBtn.addEventListener('click', () => {
        cb.classList.toggle('ds-code-wrapped');
        wrapBtn.classList.toggle('ds-btn-active');
      });
      btnGroup.appendChild(wrapBtn);

      // Expand Fullscreen Button
      const expandBtn = document.createElement('div');
      expandBtn.setAttribute('role', 'button');
      expandBtn.className = 'ds-button ds-button--borderlessNeutral ds-button--borderless ds-button--capsule ds-button--xs ds-button--icon-relative-m ds-button--min-width ds-code-btn-native';
      expandBtn.setAttribute('tabindex', '0');
      expandBtn.innerHTML = `
        <div class="ds-button__background"></div>
        <div class="ds-button__icon">${ICONS.expand}</div>
        <span class="ds-button__content"><span class="code-info-button-text">Expand</span></span>
      `;
      const langSpan = banner.querySelector('span');
      const lang = langSpan ? langSpan.textContent : 'Code';
      expandBtn.addEventListener('click', () => openCodeModal(pre, lang));
      btnGroup.appendChild(expandBtn);
    });
  }

  window.DeepSeekOrbit.CodeEnhancer = {
    applyLineNumbers,
    openCodeModal,
    enhanceCodeBlocks
  };
})();
