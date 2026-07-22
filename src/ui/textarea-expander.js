/**
 * DeepSeek Orbit — Textarea Auto-Expand & Maximize Controller
 * Features: Native-sized button (28px), 90vh smooth upward expansion, Esc collapse
 */
(function () {
  'use strict';

  window.DeepSeekOrbit = window.DeepSeekOrbit || {};

  const EXPAND_ICONS = {
    expand: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
    collapse: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`
  };

  let isExpanded = false;

  function toggleExpandTextarea(container, textarea, btn) {
    isExpanded = !isExpanded;

    const wrap = container.closest('._77cefa5, ._3d616d3, ._020ab5b') || container;
    wrap.classList.toggle('ds-input-expanded', isExpanded);
    textarea.classList.toggle('ds-textarea-expanded', isExpanded);

    if (btn) {
      btn.innerHTML = isExpanded ? EXPAND_ICONS.collapse : EXPAND_ICONS.expand;
      btn.title = isExpanded ? 'Collapse input (Esc)' : 'Expand input editor (90vh)';
      btn.classList.toggle('active', isExpanded);
    }

    if (isExpanded) {
      textarea.focus();
    }
  }

  function checkTextareaScrollbar(textarea, btn) {
    if (!textarea || !btn) return;
    const hasScroll = textarea.scrollHeight > textarea.clientHeight + 4;
    const hasContent = (textarea.value || '').length > 30 || (textarea.value || '').includes('\n');

    if (hasScroll || hasContent || isExpanded) {
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';
    } else {
      btn.style.opacity = '0';
      btn.style.pointerEvents = 'none';
    }
  }

  function ensureTextareaExpandButton(root = document) {
    const inputArea = root.querySelector('._24fad49, ._020ab5b');
    if (!inputArea) return;

    const textarea = inputArea.querySelector('textarea, [contenteditable="true"]');
    if (!textarea) return;

    let btn = inputArea.querySelector('.ds-textarea-expand-btn');
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ds-textarea-expand-btn';
      btn.title = 'Expand input editor';
      btn.innerHTML = EXPAND_ICONS.expand;
      inputArea.appendChild(btn);

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleExpandTextarea(inputArea, textarea, btn);
      });

      textarea.addEventListener('input', () => {
        checkTextareaScrollbar(textarea, btn);
      });

      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isExpanded) {
          e.preventDefault();
          toggleExpandTextarea(inputArea, textarea, btn);
        }
      });
    }

    checkTextareaScrollbar(textarea, btn);
  }

  window.DeepSeekOrbit.TextareaExpander = {
    ensureTextareaExpandButton
  };
})();
