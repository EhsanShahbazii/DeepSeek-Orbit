/**
 * DeepSeek Pro Suite - Content Script
 * - Smart RTL/LTR Direction Detection & Persian Typography
 * - Code & Developer Tools (Default Line Numbers, Word Wrap, Fullscreen Syntax Viewer)
 * - Navigation & Chat Management (In-Chat Keyword Search, Pin Messages, Prompts Outline/TOC)
 * - Full Chat Export (Markdown, HTML, JSON, Clipboard) with SVG icons
 */

(function () {
  'use strict';

  // Configuration state
  let config = {
    enabled: true,
    mode: 'auto',
    fontFamily: 'Vazirmatn',
    customFont: '',
    enableWordWrap: false,
    autoCollapseThoughts: false,
    enableWallpaper: false,
    wallpaperImage: '',
    wallpaperOpacity: 0.15,
    wallpaperBlur: 0
  };

  // Unicode ranges for RTL scripts (Arabic, Persian, Urdu, Hebrew, etc.)
  const RTL_CHAR_REGEX = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  const LTR_CHAR_REGEX = /[A-Za-z\u00C0-\u024F]/;
  const STRIP_PUNCTUATION_REGEX = /^[\s\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~•—–«»"'\n\r\t#*>-]+/;

  // Clean SVG Icons (No Emojis)
  const ICONS = {
    wrap: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 3.5H14M2 8H10.5C12 8 13.5 9.2 13.5 11C13.5 12.8 12 14 10.5 14H7.5M7.5 14L9.5 12M7.5 14L9.5 16M2 12.5H5.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    expand: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 6V2H6M14 6V2H10M2 10V14H6M14 10V14H10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    copy: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 4.5H5C3.9 4.5 3 5.4 3 6.5V12.5C3 13.6 3.9 14.5 5 14.5H11C12.1 14.5 13 13.6 13 12.5V6.5C13 5.4 12.1 4.5 11 4.5Z" stroke="currentColor" stroke-width="1.3"/><path d="M5 4.5V3.5C5 2.4 5.9 1.5 7 1.5H13C14.1 1.5 15 2.4 15 3.5V9.5C15 10.6 14.1 11.5 13 11.5H12.5" stroke="currentColor" stroke-width="1.3"/></svg>`,
    check: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 8.5L6.5 12L13 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    search: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.4"/><path d="M10.5 10.5L14.5 14.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`,
    pin: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 2.5L13.5 6L11.5 8L12.5 12L8.5 11L6.5 13L5.5 10.5L2 14L5.5 10.5L3 9.5L5 7.5L4 3.5L8 4.5L10 2.5Z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    pinFilled: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 2.5L13.5 6L11.5 8L12.5 12L8.5 11L6.5 13L5.5 10.5L2 14L5.5 10.5L3 9.5L5 7.5L4 3.5L8 4.5L10 2.5Z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    arrowUp: `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.5 10L8 5.5L12.5 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    arrowDown: `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.5 6L8 10.5L12.5 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    close: `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.5 3.5L12.5 12.5M12.5 3.5L3.5 12.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    trash: `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5H13.5M5.5 4.5V2.5H10.5V4.5M6.5 7.5V11.5M9.5 7.5V11.5M3.5 4.5L4.5 13.5H11.5L12.5 4.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    markdown: `<svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 2.5H14C14.55 2.5 15 2.95 15 3.5V12.5C15 13.05 14.55 13.5 14 13.5H2C1.45 13.5 1 13.05 1 12.5V3.5C1 2.95 1.45 2.5 2 2.5Z" stroke="currentColor" stroke-width="1.3"/><path d="M3.5 10.5V5.5L5.5 8L7.5 5.5V10.5M12.5 8.5L10.5 10.5M10.5 10.5L8.5 8.5M10.5 10.5V5.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    html: `<svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.3"/><path d="M1.5 8H14.5M8 1.5C9.5 3.5 10.5 5.7 10.5 8C10.5 10.3 9.5 12.5 8 14.5C6.5 12.5 5.5 10.3 5.5 8C5.5 5.7 6.5 3.5 8 1.5Z" stroke="currentColor" stroke-width="1.3"/></svg>`,
    json: `<svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 3C4 3 3.5 3.5 3.5 4.5V6.5C3.5 7.2 3 7.8 2 8C3 8.2 3.5 8.8 3.5 9.5V11.5C3.5 12.5 4 13 5 13M11 3C12 3 12.5 3.5 12.5 4.5V6.5C12.5 7.2 13 7.8 14 8C13 8.2 12.5 8.8 12.5 9.5V11.5C12.5 12.5 12 13 11 13" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`,
    export: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 1.5V10.5M8 1.5L4.5 5M8 1.5L11.5 5M2 9V13.5C2 14.05 2.45 14.5 3 14.5H13C13.55 14.5 14 14.05 14 13.5V9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    code: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 4.5L2 8L5.5 11.5M10.5 4.5L14 8L10.5 11.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    templateFix: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.5 2.5L13.5 6.5L11 9L13.5 11.5L9.5 11.5L7 14L5.5 10.5L2 9L6.5 7.5L9.5 2.5Z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    templateExplain: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.3"/><path d="M8 5V8.5M8 11.5V11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    templateRefactor: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 1.5L9.5 5.5L13.5 7L9.5 8.5L8 12.5L6.5 8.5L2.5 7L6.5 5.5L8 1.5Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>`,
    templateSummarize: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4H13.5M2.5 8H10M2.5 12H7.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`,
    templateTranslate: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 3.5H9M5.5 2V3.5M7 3.5C7 6.5 4 8.5 2.5 9.5M4 6.5C5 8 7 10 9 10.5M9.5 14L12 7.5L14.5 14M10.2 12.5H13.8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    templateTest: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 1.5L13.5 3.5V7.5C13.5 11 8 14.5 8 14.5C8 14.5 2.5 11 2.5 7.5V3.5L8 1.5Z" stroke="currentColor" stroke-width="1.3"/><path d="M5.5 7.5L7.5 9.5L10.5 5.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    image: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2.5" width="12" height="11" rx="2" stroke="currentColor" stroke-width="1.3"/><circle cx="5.5" cy="6" r="1.25" fill="currentColor"/><path d="M2.5 11.5L6 8L9.5 11.5L11.5 9.5L13.5 11.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  };

  const FONT_MAP = {
    'Vazirmatn': "'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    'Sahel': "'Sahel', 'Vazirmatn', Tahoma, sans-serif",
    'Shabnam': "'Shabnam', 'Vazirmatn', Tahoma, sans-serif",
    'Tahoma': "Tahoma, Arial, sans-serif",
    'Estedad': "'Estedad', 'Vazirmatn', sans-serif",
    'Samim': "'Samim', 'Vazirmatn', sans-serif",
    'Dana': "'Dana', 'Vazirmatn', sans-serif",
    'System': "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  };

  function detectDirection(text) {
    if (!text || typeof text !== 'string') return null;
    const cleanText = text.replace(STRIP_PUNCTUATION_REGEX, '');
    if (!cleanText) return null;

    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      if (RTL_CHAR_REGEX.test(char)) return 'rtl';
      if (LTR_CHAR_REGEX.test(char)) return 'ltr';
    }
    return null;
  }

  function applySettings() {
    let fontVal;
    if (config.fontFamily === 'Custom' && config.customFont) {
      fontVal = `"${config.customFont}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    } else {
      fontVal = FONT_MAP[config.fontFamily] || FONT_MAP['Vazirmatn'];
    }
    document.documentElement.style.setProperty('--ds-rtl-font', fontVal);

    // 1. RTL Class & Attribute Cleanup
    if (config.enabled) {
      document.documentElement.classList.add('ds-rtl-active');
      ensureFloatingToolbar();
      ensureNavigationDrawer();
    } else {
      document.documentElement.classList.remove('ds-rtl-active');
      document.querySelectorAll('[data-ds-dir]').forEach(el => {
        el.removeAttribute('data-ds-dir');
      });
      document.querySelectorAll('textarea, input').forEach(inp => {
        inp.removeAttribute('data-ds-dir');
        inp.dir = 'auto';
      });
      hideSearchBar();
      toggleDrawer(false);
      hideSlashMenu();
    }

    // 2. Real-time Word Wrap Live Sync
    document.querySelectorAll('.md-code-block').forEach(cb => {
      cb.classList.toggle('ds-code-wrapped', !!config.enableWordWrap);
      const wrapBtn = cb.querySelector('.ds-custom-wrap-btn');
      if (wrapBtn) wrapBtn.classList.toggle('ds-btn-active', !!config.enableWordWrap);
    });

    // 3. Auto-Collapse Thoughts
    if (document.body) {
      document.body.classList.toggle('ds-auto-collapse-thoughts', !!config.autoCollapseThoughts);
      if (config.enabled) {
        if (config.autoCollapseThoughts) {
          collapseAllThoughts(document);
        } else {
          expandAllThoughts(document);
        }
      }
    }

    // 4. Custom Background Wallpaper
    applyWallpaper();
  }

  function applyWallpaper() {
    let layer = document.getElementById('ds-custom-wallpaper-layer');
    const isWallpaperActive = config.enabled && config.enableWallpaper && !!config.wallpaperImage;

    if (!isWallpaperActive) {
      if (layer) {
        layer.style.opacity = '0';
        setTimeout(() => {
          if ((!config.enableWallpaper || !config.enabled) && layer && layer.parentNode) {
            layer.remove();
          }
        }, 400);
      }
      if (document.body) document.body.classList.remove('ds-has-wallpaper');
      document.documentElement.classList.remove('ds-has-wallpaper');
      return;
    }

    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'ds-custom-wallpaper-layer';
      layer.style.opacity = '0';
      if (document.body) {
        document.body.prepend(layer);
      } else {
        document.documentElement.prepend(layer);
      }
    }

    document.documentElement.classList.add('ds-has-wallpaper');
    if (document.body) document.body.classList.add('ds-has-wallpaper');
    layer.style.backgroundImage = `url("${config.wallpaperImage}")`;
    const targetOpacity = config.wallpaperOpacity !== undefined ? config.wallpaperOpacity : 0.15;
    void layer.offsetWidth;
    layer.style.opacity = targetOpacity.toString();
    const blur = config.wallpaperBlur || 0;
    layer.style.filter = blur > 0 ? `blur(${blur}px)` : 'none';
  }

  function handleAutoCollapseThoughts(root = document) {
    if (!config.autoCollapseThoughts || !config.enabled) return;

    const thoughtContainers = root.querySelectorAll('._74c0879, [class*="_74c0879"]');
    thoughtContainers.forEach(container => {
      if (container.dataset.dsAutoCollapsed) return;

      const content = container.querySelector('.ds-think-content, .e1675d8b, ._767406f');
      const toggleHeader = container.querySelector('._5ab5d64, ._245c867, [class*="_5ab5d64"], [class*="_245c867"]');

      if (content && toggleHeader) {
        container.dataset.dsAutoCollapsed = 'true';
        if (content.offsetHeight > 0 || window.getComputedStyle(content).display !== 'none') {
          toggleHeader.click();
        }
      }
    });
  }

  function collapseAllThoughts(root = document) {
    const thoughtContainers = root.querySelectorAll('._74c0879, [class*="_74c0879"]');
    thoughtContainers.forEach(container => {
      container.dataset.dsAutoCollapsed = 'true';
      const content = container.querySelector('.ds-think-content, .e1675d8b, ._767406f');
      const toggleHeader = container.querySelector('._5ab5d64, ._245c867, [class*="_5ab5d64"], [class*="_245c867"]');

      if (content && toggleHeader) {
        if (content.offsetHeight > 0 || window.getComputedStyle(content).display !== 'none') {
          toggleHeader.click();
        }
      }
    });
  }

  function expandAllThoughts(root = document) {
    const thoughtContainers = root.querySelectorAll('._74c0879, [class*="_74c0879"]');
    thoughtContainers.forEach(container => {
      delete container.dataset.dsAutoCollapsed;
      const content = container.querySelector('.ds-think-content, .e1675d8b, ._767406f');
      const toggleHeader = container.querySelector('._5ab5d64, ._245c867, [class*="_5ab5d64"], [class*="_245c867"]');

      if (toggleHeader) {
        if (!content || content.offsetHeight === 0 || window.getComputedStyle(content).display === 'none') {
          toggleHeader.click();
        }
      }
    });
  }

  function shouldIgnore(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return true;
    const tagName = el.tagName.toLowerCase();
    if (['pre', 'code', 'svg', 'math', 'style', 'script'].includes(tagName)) return true;
    if (el.closest('pre') || el.closest('.md-code-block') || el.closest('.katex') || el.closest('.ds-export-toolbar') || el.closest('.ds-code-modal-backdrop') || el.closest('.ds-nav-drawer') || el.closest('.ds-search-bar-wrap')) return true;
    return false;
  }

  function processElement(el) {
    if (!config.enabled || shouldIgnore(el)) return;

    if (config.mode === 'always-rtl') {
      if (el.getAttribute('data-ds-dir') !== 'rtl') el.setAttribute('data-ds-dir', 'rtl');
      return;
    }
    if (config.mode === 'always-ltr') {
      if (el.getAttribute('data-ds-dir') !== 'ltr') el.setAttribute('data-ds-dir', 'ltr');
      return;
    }

    const text = el.textContent || '';
    if (!text.trim()) return;

    const dir = detectDirection(text);
    if (dir && el.getAttribute('data-ds-dir') !== dir) {
      el.setAttribute('data-ds-dir', dir);
    }
  }

  function processInput(inputEl) {
    if (!config.enabled || !inputEl) return;
    if (config.mode === 'always-rtl') {
      inputEl.setAttribute('data-ds-dir', 'rtl');
      inputEl.dir = 'rtl';
      return;
    }
    if (config.mode === 'always-ltr') {
      inputEl.setAttribute('data-ds-dir', 'ltr');
      inputEl.dir = 'ltr';
      return;
    }
    const val = inputEl.value || inputEl.placeholder || '';
    const dir = detectDirection(val) || 'auto';
    inputEl.setAttribute('data-ds-dir', dir);
    inputEl.dir = dir;
  }

  /* =========================================================================
     2. 💻 CODE & DEVELOPER TOOLS (STICKY LINE NUMBERS & FULLSCREEN MODAL)
     ========================================================================= */

  function countCodeLines(pre) {
    if (!pre) return 1;
    const spanChildren = Array.from(pre.querySelectorAll(':scope > span, :scope > div'));
    const innerTextLines = (pre.innerText || '').split(/\r\n|\r|\n/);
    const textContentLines = (pre.textContent || '').split(/\r\n|\r|\n/);

    return Math.max(
      spanChildren.length,
      innerTextLines.length,
      textContentLines.length,
      1
    );
  }

  function applyLineNumbers(codeBlockEl) {
    const pre = codeBlockEl.querySelector('pre');
    if (!pre) return;

    let wrapper = codeBlockEl.querySelector('.ds-code-body-container');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.className = 'ds-code-body-container';
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);
    }

    let gutter = wrapper.querySelector('.ds-line-numbers-gutter');
    if (!gutter) {
      gutter = document.createElement('div');
      gutter.className = 'ds-line-numbers-gutter';
      wrapper.insertBefore(gutter, pre);
    }

    const lineCount = countCodeLines(pre);

    let linesHtml = '';
    for (let i = 1; i <= lineCount; i++) {
      linesHtml += `<span class="ds-line-num">${i}</span>`;
    }
    gutter.innerHTML = linesHtml;
  }

  function openFullscreenCode(codeBlockEl) {
    const pre = codeBlockEl.querySelector('pre');
    if (!pre) return;

    const langEl = codeBlockEl.querySelector('.d813de27, [class*="lang"]');
    const language = (langEl ? langEl.textContent : '').trim() || 'Code';
    
    const codeHtml = pre.innerHTML;
    const lineCount = countCodeLines(pre);

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
    // Force reflow for smooth scaling and fade-in animation
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
      } catch (e) {
        showToast('Failed to copy', ICONS.close);
      }
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
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  function enhanceCodeBlocks(root = document) {
    const codeBlocks = root.querySelectorAll('.md-code-block');

    codeBlocks.forEach(cb => {
      applyLineNumbers(cb);

      if (cb.dataset.dsEnhanced === 'true') return;
      cb.dataset.dsEnhanced = 'true';

      const banner = cb.querySelector('._121d384, .md-code-block-banner');
      if (!banner) return;

      const actionsContainer = banner.querySelector('.efa13877') || banner;

      const wrapBtn = document.createElement('div');
      wrapBtn.setAttribute('role', 'button');
      wrapBtn.className = 'ds-button ds-button--borderlessNeutral ds-button--borderless ds-button--capsule ds-button--xs ds-button--icon-relative-m ds-button--min-width ds-custom-wrap-btn';
      wrapBtn.setAttribute('tabindex', '0');
      wrapBtn.innerHTML = `
        <div class="ds-button__background"></div>
        <div class="ds-button__icon">${ICONS.wrap}</div>
        <span class="ds-button__content"><span class="code-info-button-text">Wrap</span></span>
      `;

      const expandBtn = document.createElement('div');
      expandBtn.setAttribute('role', 'button');
      expandBtn.className = 'ds-button ds-button--borderlessNeutral ds-button--borderless ds-button--capsule ds-button--xs ds-button--icon-relative-m ds-button--min-width ds-custom-expand-btn';
      expandBtn.setAttribute('tabindex', '0');
      expandBtn.innerHTML = `
        <div class="ds-button__background"></div>
        <div class="ds-button__icon">${ICONS.expand}</div>
        <span class="ds-button__content"><span class="code-info-button-text">Expand</span></span>
      `;

      actionsContainer.insertBefore(expandBtn, actionsContainer.firstChild);
      actionsContainer.insertBefore(wrapBtn, actionsContainer.firstChild);

      if (config.enableWordWrap) {
        cb.classList.add('ds-code-wrapped');
        wrapBtn.classList.add('ds-btn-active');
      }

      wrapBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isWrapped = cb.classList.toggle('ds-code-wrapped');
        wrapBtn.classList.toggle('ds-btn-active', isWrapped);
      };

      expandBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        openFullscreenCode(cb);
      };
    });
  }

  /* =========================================================================
     3. 🔍 NAVIGATION & CHAT MANAGEMENT (SEARCH, TOC, BOOKMARKS)
     ========================================================================= */

  // --- BOOKMARKS & PINS MANAGEMENT (CURRENT CHAT SESSION) ---

  let searchMatches = [];
  let currentSearchIndex = -1;
  let bookmarkedMessages = [];
  let lastObservedUrl = window.location.href;

  function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }

  function getMessageStableId(msg) {
    const textEl = msg.querySelector('.ds-markdown, .ds-collapsible-text, .d29f3d7d') || msg;
    const text = (textEl.textContent || '').trim().replace(/\s+/g, ' ').substring(0, 120);
    const hash = hashString(text || 'msg');
    const isUser = !!msg.querySelector('.ds-collapsible-text, .d29f3d7d');
    const role = isUser ? 'u' : 'a';
    return `${role}_${hash}`;
  }

  function onChatSessionChange() {
    if (window.location.href !== lastObservedUrl) {
      lastObservedUrl = window.location.href;
      // Reset pins when switching to a different chat
      bookmarkedMessages = [];
      updateAllPinButtons();
      renderBookmarksList();
    }
  }

  // Intercept Single-Page Navigation
  const originalPushState = history.pushState;
  history.pushState = function () {
    const res = originalPushState.apply(this, arguments);
    onChatSessionChange();
    return res;
  };

  const originalReplaceState = history.replaceState;
  history.replaceState = function () {
    const res = originalReplaceState.apply(this, arguments);
    onChatSessionChange();
    return res;
  };

  window.addEventListener('popstate', onChatSessionChange);

  // --- IN-CHAT KEYWORD SEARCH ---

  function clearSearchHighlights() {
    const highlights = document.querySelectorAll('.ds-search-highlight, .ds-search-highlight-active');
    highlights.forEach(h => {
      const parent = h.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(h.textContent), h);
        parent.normalize();
      }
    });
    searchMatches = [];
    currentSearchIndex = -1;
  }

  function highlightKeywords(keyword) {
    clearSearchHighlights();
    if (!keyword || !keyword.trim()) return;

    const term = keyword.trim().toLowerCase();
    const messageContainers = document.querySelectorAll('.ds-markdown, .ds-collapsible-text, .d29f3d7d');

    const shouldIgnore = (el) => {
      return el && (el.tagName === 'PRE' || el.closest('pre') || el.classList.contains('ds-line-num'));
    };

    messageContainers.forEach(container => {
      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            if (!node.textContent || !node.textContent.toLowerCase().includes(term)) {
              return NodeFilter.FILTER_REJECT;
            }
            if (shouldIgnore(node.parentElement)) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        },
        false
      );

      const nodesToReplace = [];
      let currentNode;
      while ((currentNode = walker.nextNode())) {
        nodesToReplace.push(currentNode);
      }

      nodesToReplace.forEach(textNode => {
        const text = textNode.textContent;
        const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);
        const fragment = document.createDocumentFragment();

        parts.forEach(part => {
          if (part.toLowerCase() === term) {
            const mark = document.createElement('mark');
            mark.className = 'ds-search-highlight';
            mark.textContent = part;
            fragment.appendChild(mark);
            searchMatches.push(mark);
          } else if (part.length > 0) {
            fragment.appendChild(document.createTextNode(part));
          }
        });

        if (textNode.parentNode) {
          textNode.parentNode.replaceChild(fragment, textNode);
        }
      });
    });

    if (searchMatches.length > 0) {
      currentSearchIndex = 0;
      updateSearchActive();
    }
  }

  function updateSearchActive() {
    searchMatches.forEach((m, idx) => {
      if (idx === currentSearchIndex) {
        m.className = 'ds-search-highlight-active';
        m.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        m.className = 'ds-search-highlight';
      }
    });

    const countEl = document.querySelector('#dsSearchCount');
    if (countEl) {
      countEl.textContent = searchMatches.length ? `${currentSearchIndex + 1} / ${searchMatches.length}` : '0 / 0';
    }
  }

  function nextSearchMatch() {
    if (!searchMatches.length) return;
    currentSearchIndex = (currentSearchIndex + 1) % searchMatches.length;
    updateSearchActive();
  }

  function prevSearchMatch() {
    if (!searchMatches.length) return;
    currentSearchIndex = (currentSearchIndex - 1 + searchMatches.length) % searchMatches.length;
    updateSearchActive();
  }

  function openSearchBar() {
    ensureFloatingToolbar();
    const searchWrap = document.querySelector('#dsSearchInlineWrap');
    const searchBtn = document.querySelector('#dsToolbarSearchBtn');
    const input = document.querySelector('#dsSearchInput');

    if (searchWrap) {
      searchWrap.classList.add('show');
      if (searchBtn) searchBtn.classList.add('selected');
      if (input) {
        input.focus();
        input.select();
      }
    }
  }

  function closeSearchBar() {
    const searchWrap = document.querySelector('#dsSearchInlineWrap');
    const searchBtn = document.querySelector('#dsToolbarSearchBtn');
    if (searchWrap) {
      searchWrap.classList.remove('show');
      if (searchBtn) searchBtn.classList.remove('selected');
    }
    clearSearchHighlights();
  }

  function toggleSearchBar() {
    const searchWrap = document.querySelector('#dsSearchInlineWrap');
    if (searchWrap && searchWrap.classList.contains('show')) {
      closeSearchBar();
    } else {
      openSearchBar();
    }
  }

  // --- NAVIGATION DRAWER (BOOKMARKS / PINS) ---

  function flashMessage(el) {
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.remove('ds-message-flash-target');
    void el.offsetWidth;
    el.classList.add('ds-message-flash-target');
  }

  function jumpToMessage(bm) {
    if (!bm) return;

    // 1. Check direct element reference if still in DOM
    if (bm.el && document.body.contains(bm.el)) {
      flashMessage(bm.el);
      return;
    }

    // 2. Direct query by stable data-ds-msg-id or data-msg-id
    const target = document.querySelector(`[data-ds-msg-id="${bm.id}"]`) || document.querySelector(`[data-msg-id="${bm.id}"]`);
    if (target) {
      const msgEl = target.closest('._9663006, [data-virtual-list-item-key], .ds-message') || target;
      flashMessage(msgEl);
      return;
    }

    // 3. Query by text sample matching
    const sample = (bm.textSample || bm.snippet || '').substring(0, 40);
    if (sample) {
      const allMsgs = document.querySelectorAll('._9663006, .ds-message, .d29f3d7d, ._4f9bf79');
      for (const msg of allMsgs) {
        if (msg.textContent && msg.textContent.includes(sample)) {
          msg.dataset.dsMsgId = bm.id;
          flashMessage(msg);
          return;
        }
      }
    }

    // 4. Virtual list scroll search
    const virtualList = document.querySelector('.ds-virtual-list, .ds-scroll-area--enabled, ._2bd7b35');
    if (virtualList && sample) {
      showToast('Locating message...');
      let step = 0;
      const maxScroll = virtualList.scrollHeight;

      const searchInterval = setInterval(() => {
        step++;
        const found = document.querySelector(`[data-ds-msg-id="${bm.id}"]`) ||
          Array.from(document.querySelectorAll('._9663006, .ds-message, .d29f3d7d')).find(m => m.textContent && m.textContent.includes(sample));

        if (found) {
          clearInterval(searchInterval);
          found.dataset.dsMsgId = bm.id;
          flashMessage(found);
        } else if (step > 12) {
          clearInterval(searchInterval);
          showToast('Message located in chat history');
        } else {
          virtualList.scrollTop = step * (maxScroll / 12);
        }
      }, 50);
    } else {
      showToast('Message not found');
    }
  }

  function ensureNavigationDrawer() {
    let drawer = document.querySelector('.ds-nav-drawer');
    if (drawer) return drawer;

    drawer = document.createElement('div');
    drawer.className = 'ds-nav-drawer';
    drawer.innerHTML = `
      <div class="ds-nav-drawer-header">
        <div style="display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 13.5px; color: var(--ds-text-primary);">
          <span style="color: var(--ds-brand-primary); display: inline-flex;">${ICONS.pinFilled}</span>
          <span>Pinned Messages</span>
          <span id="dsPinsCountBadge" style="font-size: 11px; background: rgba(77, 107, 254, 0.15); color: var(--ds-brand-primary); padding: 2px 8px; border-radius: 9999px; font-weight: 700; border: 1px solid rgba(77, 107, 254, 0.3);">0</span>
        </div>
        <button type="button" class="ds-nav-drawer-close" id="dsDrawerCloseBtn" title="Close">${ICONS.close}</button>
      </div>
      <div class="ds-nav-drawer-content" id="dsDrawerContent"></div>
    `;

    document.body.appendChild(drawer);

    const closeBtn = drawer.querySelector('#dsDrawerCloseBtn');
    closeBtn.addEventListener('click', () => drawer.classList.remove('open'));

    return drawer;
  }

  function renderBookmarksList() {
    const content = document.querySelector('#dsDrawerContent');
    const badge = document.querySelector('#dsPinsCountBadge');
    if (badge) badge.textContent = bookmarkedMessages.length;

    if (!content) return;
    content.innerHTML = '';

    if (!bookmarkedMessages.length) {
      content.innerHTML = `<div class="ds-nav-empty">No pinned messages in this chat.<br/>Click the pin button on any message to save it here.</div>`;
      return;
    }

    bookmarkedMessages.forEach((bm, idx) => {
      const item = document.createElement('div');
      item.className = 'ds-bookmark-item';
      item.innerHTML = `
        <div class="ds-bookmark-header">
          <span class="ds-bookmark-role">${bm.role}</span>
          <button type="button" class="ds-bookmark-unpin" title="Remove pin">${ICONS.trash}</button>
        </div>
        <div class="ds-bookmark-snippet">${bm.snippet}</div>
      `;

      const unpinBtn = item.querySelector('.ds-bookmark-unpin');
      unpinBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const removeIdx = bookmarkedMessages.findIndex(b => b.id === bm.id);
        if (removeIdx >= 0) {
          bookmarkedMessages.splice(removeIdx, 1);
        } else {
          bookmarkedMessages.splice(idx, 1);
        }
        renderBookmarksList();
        updateAllPinButtons();
        showToast('Message unpinned');
      });

      item.addEventListener('click', () => {
        jumpToMessage(bm);
      });

      content.appendChild(item);
    });
  }

  function openPinsDrawer() {
    const drawer = ensureNavigationDrawer();
    renderBookmarksList();
    // Force layout reflow so the initial closed position is registered before transitioning
    void drawer.offsetWidth;
    requestAnimationFrame(() => {
      drawer.classList.add('open');
    });
  }

  // --- MESSAGE PIN BUTTONS ---

  function handlePinButtonClick(pinBtn) {
    if (!pinBtn) return;
    const targetMsg = pinBtn.closest('._9663006, [data-virtual-list-item-key], .ds-message') || pinBtn.parentElement.closest('._9663006, .ds-message') || pinBtn.parentElement;
    const currentId = pinBtn.dataset.msgId || (targetMsg ? getMessageStableId(targetMsg) : `msg_${Date.now()}`);

    const existingIdx = bookmarkedMessages.findIndex(b => b.id === currentId);
    if (existingIdx >= 0) {
      bookmarkedMessages.splice(existingIdx, 1);
      showToast('Message unpinned');
    } else {
      const isUser = !!(targetMsg && targetMsg.querySelector('.ds-collapsible-text, .d29f3d7d'));
      const textContentEl = targetMsg ? (targetMsg.querySelector('.ds-markdown, .ds-collapsible-text, .d29f3d7d') || targetMsg) : null;
      const cleanText = textContentEl ? (textContentEl.textContent || '').trim().replace(/\s+/g, ' ') : 'Pinned message';
      const snippetText = cleanText.substring(0, 160) || 'Pinned message';
      const textSample = cleanText.substring(0, 80);

      bookmarkedMessages.push({
        id: currentId,
        el: targetMsg,
        role: isUser ? 'User' : 'Assistant',
        snippet: snippetText,
        textSample: textSample,
        timestamp: Date.now()
      });
      showToast('Message pinned to Bookmarks!');
    }

    updateAllPinButtons();
    renderBookmarksList();
  }

  function updateAllPinButtons() {
    const pinBtns = document.querySelectorAll('.ds-pin-btn');
    pinBtns.forEach(btn => {
      const msgId = btn.dataset.msgId;
      const isPinned = bookmarkedMessages.some(b => b.id === msgId);
      btn.classList.toggle('pinned', isPinned);
      btn.title = isPinned ? 'Unpin message' : 'Pin message';
      const iconWrap = btn.querySelector('.ds-button__icon .ds-icon');
      if (iconWrap) {
        iconWrap.innerHTML = isPinned ? ICONS.pinFilled : ICONS.pin;
      }
    });
  }

  function enhanceMessagePinButtons(root = document) {
    const actionBars = root.querySelectorAll('._965abe9, ._54866f7, ._78e0558, ._0bbda35, ._0a3d93b > .ds-flex');

    actionBars.forEach((actionsBar) => {
      if (actionsBar.closest('.bf38813a, ._77cefa5')) return;

      const msg = actionsBar.closest('._9663006, [data-virtual-list-item-key], .ds-message, ._4f09d84') || actionsBar.parentElement?.parentElement || actionsBar.parentElement;
      if (!msg) return;

      const msgId = getMessageStableId(msg);
      msg.dataset.dsMsgId = msgId;

      let pinBtn = actionsBar.querySelector('.ds-pin-btn');
      const isPinned = bookmarkedMessages.some(b => b.id === msgId);

      if (!pinBtn) {
        pinBtn = document.createElement('div');
        pinBtn.setAttribute('role', 'button');
        pinBtn.className = 'ds-button ds-button--iconLabelTertiary ds-button--icon ds-button--capsule ds-button--xs ds-button--icon-relative-l db183363 ds-pin-btn';
        pinBtn.setAttribute('tabindex', '0');
        pinBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          handlePinButtonClick(pinBtn);
        };
        actionsBar.appendChild(pinBtn);
      }

      pinBtn.dataset.msgId = msgId;
      pinBtn.classList.toggle('pinned', isPinned);
      pinBtn.title = isPinned ? 'Unpin message' : 'Pin message';
      pinBtn.innerHTML = `
        <div class="ds-button__background"></div>
        <div class="ds-button__icon ds-button__icon--last-child">
          <div class="ds-icon" style="font-size: inherit;">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 2.5L13.5 6L11.5 8L12.5 12L8.5 11L6.5 13L5.5 10.5L2 14L5.5 10.5L3 9.5L5 7.5L4 3.5L8 4.5L10 2.5Z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      `;

      // Scroll to Top of Message Button
      let scrollToTopBtn = actionsBar.querySelector('.ds-scroll-top-btn');
      if (!scrollToTopBtn) {
        scrollToTopBtn = document.createElement('div');
        scrollToTopBtn.setAttribute('role', 'button');
        scrollToTopBtn.className = 'ds-button ds-button--iconLabelTertiary ds-button--icon ds-button--capsule ds-button--xs ds-button--icon-relative-l db183363 ds-scroll-top-btn';
        scrollToTopBtn.setAttribute('tabindex', '0');
        scrollToTopBtn.title = 'Scroll to top of this message';
        scrollToTopBtn.innerHTML = `
          <div class="ds-button__background"></div>
          <div class="ds-button__icon ds-button__icon--last-child">
            <div class="ds-icon" style="font-size: inherit;">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.5 10.5L8 5.5L12.5 10.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        `;
        scrollToTopBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          msg.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
        actionsBar.appendChild(scrollToTopBtn);
      }
    });
  }

  /* =========================================================================
     4. ✍️ PROMPTING & TYPING PRODUCTIVITY (SLASH COMMANDS, HISTORY & TTS)
     ========================================================================= */

  // --- 1. SLASH COMMAND TEMPLATES (/) ---
  const SLASH_COMMANDS = [
    {
      cmd: '/fix',
      title: 'Fix & Debug Code',
      desc: 'Analyze root causes, solve bugs, and provide corrected code',
      icon: ICONS.templateFix,
      prompt: 'Fix the bugs and errors in the following code, explain the root causes, and provide the corrected code:\n\n'
    },
    {
      cmd: '/explain',
      title: 'Explain Code / Concept',
      desc: 'Step-by-step breakdown with clear explanations & examples',
      icon: ICONS.templateExplain,
      prompt: 'Explain how the following code/concept works step-by-step with clear examples:\n\n'
    },
    {
      cmd: '/refactor',
      title: 'Refactor & Clean Code',
      desc: 'Optimize structure, readability, and performance',
      icon: ICONS.templateRefactor,
      prompt: 'Refactor and optimize the following code for better readability, performance, and clean architecture:\n\n'
    },
    {
      cmd: '/summarize',
      title: 'Summarize Text',
      desc: 'Concise summary with key takeaways and bullet points',
      icon: ICONS.templateSummarize,
      prompt: 'Summarize the key points, core findings, and actionable takeaways of the following text concisely:\n\n'
    },
    {
      cmd: '/translate',
      title: 'Translate to Fluent Persian',
      desc: 'Natural Persian translation preserving code & technical terms',
      icon: ICONS.templateTranslate,
      prompt: 'Translate the following text into fluent, natural Persian (فارسی روان و دقیق) while keeping technical code terms intact:\n\n'
    },
    {
      cmd: '/test',
      title: 'Generate Unit Tests',
      desc: 'Comprehensive test suites including mocks and edge cases',
      icon: ICONS.templateTest,
      prompt: 'Write comprehensive unit tests with edge cases and mocks for the following code:\n\n'
    }
  ];

  let slashActiveIndex = 0;
  let currentSlashMatches = [];
  let currentSlashInputEl = null;

  function ensureSlashMenu() {
    let menu = document.querySelector('.ds-slash-menu');
    if (menu) return menu;

    menu = document.createElement('div');
    menu.className = 'ds-slash-menu';
    document.body.appendChild(menu);
    return menu;
  }

  function hideSlashMenu() {
    const menu = document.querySelector('.ds-slash-menu');
    if (menu) menu.classList.remove('show');
    currentSlashMatches = [];
    slashActiveIndex = 0;
    currentSlashInputEl = null;
  }

  function applySlashCommand(item, inputEl) {
    if (!inputEl) return;

    // Use native prototype setter to update React/Vue state reliably
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set
      || Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;

    if (nativeSetter) {
      nativeSetter.call(inputEl, item.prompt);
    } else {
      inputEl.value = item.prompt;
    }

    inputEl.focus();
    inputEl.selectionStart = inputEl.selectionEnd = inputEl.value.length;
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    inputEl.dispatchEvent(new Event('change', { bubbles: true }));

    hideSlashMenu();
    showToast(`Template ${item.cmd} inserted`);
  }

  function renderSlashMenu(matches, inputEl) {
    const menu = ensureSlashMenu();
    if (!matches.length) {
      hideSlashMenu();
      return;
    }

    currentSlashMatches = matches;
    currentSlashInputEl = inputEl;
    if (slashActiveIndex >= matches.length) slashActiveIndex = 0;

    menu.innerHTML = '';
    matches.forEach((item, idx) => {
      const el = document.createElement('div');
      el.className = `ds-slash-item ${idx === slashActiveIndex ? 'active' : ''}`;
      el.innerHTML = `
        <div class="ds-slash-icon">${item.icon}</div>
        <div class="ds-slash-info">
          <div class="ds-slash-header">
            <span class="ds-slash-cmd">${item.cmd}</span>
            <span class="ds-slash-title">${item.title}</span>
          </div>
          <div class="ds-slash-desc">${item.desc}</div>
        </div>
      `;

      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        applySlashCommand(item, inputEl);
      });

      menu.appendChild(el);
    });

    const rect = inputEl.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.left = `${Math.max(16, rect.left)}px`;
    menu.style.bottom = `${window.innerHeight - rect.top + 8}px`;
    menu.classList.add('show');
  }

  function handleSlashInput(inputEl) {
    const val = inputEl.value;
    if (val.startsWith('/')) {
      const query = val.toLowerCase();
      const matches = SLASH_COMMANDS.filter(c => c.cmd.startsWith(query) || c.title.toLowerCase().includes(query.slice(1)));
      renderSlashMenu(matches, inputEl);
    } else {
      hideSlashMenu();
    }
  }

  function handleSlashKeydown(e, inputEl) {
    const menu = document.querySelector('.ds-slash-menu');
    if (!menu || !menu.classList.contains('show') || !currentSlashMatches.length) return false;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      slashActiveIndex = (slashActiveIndex + 1) % currentSlashMatches.length;
      renderSlashMenu(currentSlashMatches, inputEl);
      return true;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      slashActiveIndex = (slashActiveIndex - 1 + currentSlashMatches.length) % currentSlashMatches.length;
      renderSlashMenu(currentSlashMatches, inputEl);
      return true;
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      const selected = currentSlashMatches[slashActiveIndex];
      if (selected) {
        applySlashCommand(selected, inputEl);
      }
      return true;
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      hideSlashMenu();
      return true;
    }
    return false;
  }

  // --- 2. PROMPT HISTORY CYCLING (↑ / ↓) ---
  const promptHistory = [];
  let promptHistoryIndex = -1;
  let promptDraft = '';

  function setInputValue(inputEl, val) {
    if (!inputEl) return;
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set
      || Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    if (nativeSetter) {
      nativeSetter.call(inputEl, val);
    } else {
      inputEl.value = val;
    }
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    inputEl.dispatchEvent(new Event('change', { bubbles: true }));
    inputEl.selectionStart = inputEl.selectionEnd = inputEl.value.length;
  }

  function recordPromptHistory(text) {
    const clean = (text || '').trim();
    if (!clean) return;
    if (!promptHistory.length || promptHistory[0] !== clean) {
      promptHistory.unshift(clean);
      if (promptHistory.length > 50) promptHistory.pop();
    }
    promptHistoryIndex = -1;
    promptDraft = '';
  }

  function handlePromptHistoryKey(e, inputEl) {
    if (!promptHistory.length) return;

    if (e.key === 'ArrowUp') {
      const textBeforeCursor = inputEl.value.substring(0, inputEl.selectionStart);
      const isFirstLine = !textBeforeCursor.includes('\n');

      if (isFirstLine && (promptHistoryIndex < promptHistory.length - 1)) {
        e.preventDefault();
        e.stopPropagation();
        if (promptHistoryIndex === -1) {
          promptDraft = inputEl.value;
        }
        promptHistoryIndex++;
        setInputValue(inputEl, promptHistory[promptHistoryIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      if (promptHistoryIndex >= 0) {
        const textAfterCursor = inputEl.value.substring(inputEl.selectionEnd);
        const isLastLine = !textAfterCursor.includes('\n');

        if (isLastLine) {
          e.preventDefault();
          e.stopPropagation();
          promptHistoryIndex--;
          if (promptHistoryIndex === -1) {
            setInputValue(inputEl, promptDraft);
          } else {
            setInputValue(inputEl, promptHistory[promptHistoryIndex]);
          }
        }
      }
    }
  }

  /* =========================================================================
     CHAT EXPORT & TOAST MODULE
     ========================================================================= */

  function showToast(message, iconSvg = ICONS.check) {
    let toast = document.querySelector('.ds-pro-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'ds-pro-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span style="display:inline-flex;align-items:center;color:#4d6bfe;">${iconSvg}</span> <span>${message}</span>`;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  function getChatTitle() {
    const titleEl = document.querySelector('.chat-title, [class*="title"], title');
    const titleText = (titleEl ? titleEl.textContent : '') || document.title || 'DeepSeek_Chat';
    return titleText.trim().replace(/[\\/:*?"<>|]/g, '_').substring(0, 50) || 'DeepSeek_Chat';
  }

  function extractAssistantMarkdown(markdownNode) {
    if (!markdownNode) return '';
    const clone = markdownNode.cloneNode(true);

    const codeBlocks = clone.querySelectorAll('.md-code-block, pre');
    codeBlocks.forEach(cb => {
      const langEl = cb.querySelector('.d813de27, [class*="language"], [class*="lang"]');
      const lang = (langEl ? langEl.textContent : '').trim() || '';
      const pre = cb.querySelector('pre') || cb;
      const codeText = pre.textContent || '';
      const mdCode = `\n\`\`\`${lang}\n${codeText.trim()}\n\`\`\`\n`;
      const placeholder = document.createTextNode(mdCode);
      cb.parentNode.replaceChild(placeholder, cb);
    });

    clone.querySelectorAll('code').forEach(c => {
      c.textContent = `\`${c.textContent}\``;
    });
    clone.querySelectorAll('strong, b').forEach(b => {
      b.textContent = `**${b.textContent}**`;
    });
    clone.querySelectorAll('em, i').forEach(i => {
      i.textContent = `*${i.textContent}*`;
    });

    return clone.textContent.trim();
  }

  function extractConversation() {
    const messages = [];
    const items = document.querySelectorAll('._9663006, ._4f9bf79, .ds-message, [data-virtual-list-item-key]');

    items.forEach(item => {
      const markdownEl = item.querySelector('.ds-markdown');
      const userTextEl = item.querySelector('.ds-collapsible-text, .d29f3d7d');

      if (userTextEl && !markdownEl) {
        const text = userTextEl.textContent.trim();
        if (text && (!messages.length || messages[messages.length - 1].content !== text)) {
          messages.push({ role: 'user', content: text });
        }
      } else if (markdownEl) {
        const thinkingEl = item.querySelector('.ds-thinking-content, [class*="thinking"]');
        const thinkingText = thinkingEl ? thinkingEl.textContent.trim() : null;
        const responseText = extractAssistantMarkdown(markdownEl);

        if (responseText) {
          messages.push({
            role: 'assistant',
            content: responseText,
            thinking: thinkingText
          });
        }
      }
    });

    return messages;
  }

  function generateMarkdown(includeThinking = true) {
    const messages = extractConversation();
    const title = getChatTitle();
    const date = new Date().toLocaleString();

    let md = `# ${title}\n\n*Exported from DeepSeek Chat on ${date}*\n\n---\n\n`;

    messages.forEach((msg) => {
      if (msg.role === 'user') {
        md += `### User\n\n${msg.content}\n\n---\n\n`;
      } else {
        md += `### DeepSeek\n\n`;
        if (includeThinking && msg.thinking) {
          md += `<details>\n<summary>Thinking Process</summary>\n\n${msg.thinking}\n\n</details>\n\n`;
        }
        md += `${msg.content}\n\n---\n\n`;
      }
    });

    return md;
  }

  function generateHTML() {
    const messages = extractConversation();
    const title = getChatTitle();
    const date = new Date().toLocaleString();

    let htmlContent = messages.map(msg => {
      const isUser = msg.role === 'user';
      const roleName = isUser ? 'User' : 'DeepSeek';
      const bgClass = isUser ? 'user-msg' : 'assistant-msg';
      const thinkingHtml = msg.thinking ? `<details class="thinking"><summary>Thinking Process</summary><div class="think-body">${msg.thinking}</div></details>` : '';
      
      return `
        <div class="message ${bgClass}">
          <div class="msg-header"><strong>${roleName}</strong></div>
          ${thinkingHtml}
          <div class="msg-body">${msg.content.replace(/\n/g, '<br/>')}</div>
        </div>
      `;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Vazirmatn", sans-serif; background: #131415; color: #f0f3f6; padding: 30px; max-width: 860px; margin: 0 auto; line-height: 1.7; }
    h1 { border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; font-size: 24px; color: #fff; }
    .meta { color: #90949c; font-size: 13px; margin-bottom: 30px; }
    .message { border-radius: 12px; padding: 16px 20px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.08); }
    .user-msg { background: #1e1f22; }
    .assistant-msg { background: #25262a; border-color: rgba(77,107,254,0.3); }
    .msg-header { font-size: 14px; margin-bottom: 10px; color: #4d6bfe; font-weight: 600; }
    .thinking { background: #131415; padding: 10px; border-radius: 8px; margin-bottom: 12px; font-size: 12px; color: #90949c; border: 1px dashed rgba(255,255,255,0.1); }
    .msg-body { font-size: 14px; white-space: pre-wrap; word-break: break-word; }
    @media print { body { background: white; color: black; } .message { border: 1px solid #ddd; background: #f9f9f9; } }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="meta">Exported from DeepSeek Chat • ${date}</div>
  ${htmlContent}
</body>
</html>`;
  }

  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  const exportActions = {
    exportMarkdown: () => {
      const md = generateMarkdown(true);
      const filename = `${getChatTitle()}_${Date.now()}.md`;
      downloadFile(filename, md, 'text/markdown;charset=utf-8');
      showToast('Exported chat as Markdown');
    },
    copyMarkdown: async () => {
      const md = generateMarkdown(true);
      try {
        await navigator.clipboard.writeText(md);
        showToast('Copied full chat to clipboard!');
      } catch (e) {
        showToast('Failed to copy to clipboard', ICONS.close);
      }
    },
    exportHTML: () => {
      const html = generateHTML();
      const filename = `${getChatTitle()}_${Date.now()}.html`;
      downloadFile(filename, html, 'text/html;charset=utf-8');
      showToast('Exported chat as HTML');
    },
    exportJSON: () => {
      const data = {
        title: getChatTitle(),
        exportedAt: new Date().toISOString(),
        messages: extractConversation()
      };
      const filename = `${getChatTitle()}_${Date.now()}.json`;
      downloadFile(filename, JSON.stringify(data, null, 2), 'application/json;charset=utf-8');
      showToast('Exported chat as JSON');
    }
  };

  // --- FLOATING SUITE TOOLBAR ---

  function ensureFloatingToolbar() {
    if (document.querySelector('.ds-export-toolbar')) return;

    const toolbar = document.createElement('div');
    toolbar.className = 'ds-export-toolbar';
    toolbar.innerHTML = `
      <div class="ds-search-inline-wrap" id="dsSearchInlineWrap">
        <span style="color: var(--ds-text-muted); display: inline-flex;">${ICONS.search}</span>
        <input type="text" class="ds-search-input" id="dsSearchInput" placeholder="Search in chat..." />
        <span class="ds-search-count" id="dsSearchCount">0 / 0</span>
        <button type="button" class="ds-search-btn-icon" id="dsSearchPrevBtn" title="Previous (Shift+Enter)">${ICONS.arrowUp}</button>
        <button type="button" class="ds-search-btn-icon" id="dsSearchNextBtn" title="Next (Enter)">${ICONS.arrowDown}</button>
        <button type="button" class="ds-search-btn-icon ds-search-btn-close" id="dsSearchCloseBtn" title="Close (Esc)">${ICONS.close}</button>
      </div>
      <button type="button" class="ds-suite-btn" id="dsToolbarSearchBtn" title="Search (Ctrl + F)">
        <span class="ds-suite-btn-icon">${ICONS.search}</span> <span>Search</span>
      </button>
      <button type="button" class="ds-suite-btn" id="dsToolbarPinsBtn" title="Pinned Messages">
        <span class="ds-suite-btn-icon">${ICONS.pinFilled}</span> <span>Pins</span>
      </button>
      <button type="button" class="ds-suite-btn" id="dsToolbarMemoryBtn" title="Persistent Instructions & Persona Memory">
        <span class="ds-suite-btn-icon">${ICONS.brain}</span> <span>Memory</span>
      </button>
      <button type="button" class="ds-suite-btn" id="dsExportToggleBtn" title="Export & Share Chat">
        <span class="ds-suite-btn-icon">${ICONS.export}</span> <span>Export</span>
      </button>
      <div class="ds-export-menu" id="dsExportMenu">
        <button type="button" class="ds-export-item" data-action="exportMarkdown">
          <span class="ds-export-item-icon">${ICONS.markdown}</span> <span>Download Markdown</span>
        </button>
        <button type="button" class="ds-export-item" data-action="copyMarkdown">
          <span class="ds-export-item-icon">${ICONS.copy}</span> <span>Copy All as Markdown</span>
        </button>
        <button type="button" class="ds-export-item" data-action="exportHTML">
          <span class="ds-export-item-icon">${ICONS.html}</span> <span>Export HTML / Print</span>
        </button>
        <div class="ds-export-divider"></div>
        <button type="button" class="ds-export-item" data-action="exportJSON">
          <span class="ds-export-item-icon">${ICONS.json}</span> <span>Export JSON</span>
        </button>
      </div>
    `;

    document.body.appendChild(toolbar);

    const searchBtn = toolbar.querySelector('#dsToolbarSearchBtn');
    const searchInput = toolbar.querySelector('#dsSearchInput');
    const searchPrevBtn = toolbar.querySelector('#dsSearchPrevBtn');
    const searchNextBtn = toolbar.querySelector('#dsSearchNextBtn');
    const searchCloseBtn = toolbar.querySelector('#dsSearchCloseBtn');
    const pinsBtn = toolbar.querySelector('#dsToolbarPinsBtn');
    const memoryBtn = toolbar.querySelector('#dsToolbarMemoryBtn');
    const toggleExportBtn = toolbar.querySelector('#dsExportToggleBtn');
    const exportMenu = toolbar.querySelector('#dsExportMenu');

    searchInput.addEventListener('input', (e) => {
      highlightKeywords(e.target.value);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (e.shiftKey) prevSearchMatch();
        else nextSearchMatch();
      } else if (e.key === 'Escape') {
        closeSearchBar();
      }
    });

    searchPrevBtn.addEventListener('click', prevSearchMatch);
    searchNextBtn.addEventListener('click', nextSearchMatch);
    searchCloseBtn.addEventListener('click', closeSearchBar);
    searchBtn.addEventListener('click', toggleSearchBar);
    pinsBtn.addEventListener('click', openPinsDrawer);

    memoryBtn.addEventListener('click', () => {
      if (window.DeepSeekOrbit && window.DeepSeekOrbit.CustomInstructions) {
        window.DeepSeekOrbit.CustomInstructions.openCustomInstructionsModal();
      }
    });

    toggleExportBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      exportMenu.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!toolbar.contains(e.target)) {
        exportMenu.classList.remove('show');
      }
    });

    exportMenu.querySelectorAll('.ds-export-item').forEach(item => {
      item.addEventListener('click', () => {
        const actionName = item.dataset.action;
        if (exportActions[actionName]) {
          exportActions[actionName]();
        }
        exportMenu.classList.remove('show');
      });
    });
  }

  function openWallpaperModal() {
    const existing = document.querySelector('.ds-wallpaper-modal-backdrop');
    if (existing) {
      existing.remove();
      return;
    }

    const backdrop = document.createElement('div');
    backdrop.className = 'ds-code-modal-backdrop ds-wallpaper-modal-backdrop';

    const currentImg = config.wallpaperImage || '';
    const currentOpacity = Math.round((config.wallpaperOpacity !== undefined ? config.wallpaperOpacity : 0.15) * 100);
    const currentBlur = config.wallpaperBlur || 0;

    backdrop.innerHTML = `
      <div class="ds-code-modal ds-wallpaper-modal" style="width: 90vw; max-width: 520px; height: auto; max-height: 90vh;">
        <div class="ds-code-modal-header" style="border-bottom: 1px solid var(--ds-border-dark);">
          <div class="ds-code-modal-title">
            <span>${ICONS.image}</span> <span>Wallpaper Studio</span>
          </div>
          <button type="button" class="ds-code-modal-close-btn" id="wpModalCloseBtn" title="Close (Esc)">✕</button>
        </div>
        <div style="padding: 22px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto;">
          <!-- Drop / Upload Area -->
          <div class="ds-wp-upload-zone" id="wpDropZone" style="border: 2px dashed rgba(255,255,255,0.18); border-radius: 12px; padding: 22px 16px; text-align: center; cursor: pointer; transition: all 0.2s; background: rgba(0,0,0,0.25);">
            <input type="file" id="wpModalFileInput" accept="image/*" style="display: none;" />
            <div style="color: var(--ds-brand-primary); margin-bottom: 6px; display: flex; justify-content: center;">
              ${ICONS.image}
            </div>
            <div style="font-size: 13.5px; font-weight: 600; color: #fff; margin-bottom: 2px;">Click or Drag image here</div>
            <div style="font-size: 11.5px; color: var(--ds-text-secondary);">Supports PNG, JPG, WebP, SVG</div>
          </div>

          <!-- Preview & Remove -->
          <div id="wpModalPreviewSection" style="display: ${currentImg ? 'flex' : 'none'}; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 10px 14px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <img id="wpModalPreviewImg" src="${currentImg}" style="width: 48px; height: 48px; border-radius: 8px; object-fit: cover; border: 1px solid rgba(255,255,255,0.15);" />
              <div>
                <div style="font-size: 12.5px; font-weight: 600; color: #fff;">Custom Background</div>
                <div style="font-size: 11px; color: #4ade80;">Active Wallpaper</div>
              </div>
            </div>
            <button type="button" id="wpModalRemoveBtn" class="ds-suite-btn" style="color: #f87171; border-color: rgba(239, 68, 68, 0.3);">
              <span class="ds-suite-btn-icon">${ICONS.trash}</span> <span>Remove</span>
            </button>
          </div>

          <!-- Opacity Slider -->
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 12.5px; font-weight: 600; color: #fff; margin-bottom: 8px;">
              <span>Wallpaper Opacity</span>
              <span id="wpOpacityValText" style="color: var(--ds-brand-primary);">${currentOpacity}%</span>
            </div>
            <input type="range" id="wpModalOpacity" min="5" max="60" step="5" value="${currentOpacity}" style="width: 100%; accent-color: var(--ds-brand-primary); cursor: pointer;" />
          </div>

          <!-- Blur Slider -->
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 12.5px; font-weight: 600; color: #fff; margin-bottom: 8px;">
              <span>Background Blur</span>
              <span id="wpBlurValText" style="color: var(--ds-brand-primary);">${currentBlur}px</span>
            </div>
            <input type="range" id="wpModalBlur" min="0" max="20" step="1" value="${currentBlur}" style="width: 100%; accent-color: var(--ds-brand-primary); cursor: pointer;" />
          </div>

          <!-- Footer Actions -->
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px;">
            <button type="button" id="wpModalDoneBtn" class="ds-suite-btn" style="background: var(--ds-brand-primary); color: #fff; border-color: transparent; padding: 0 24px; font-weight: 600;">
              Done
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    void backdrop.offsetWidth;
    backdrop.classList.add('ds-modal-visible');

    const fileInput = backdrop.querySelector('#wpModalFileInput');
    const dropZone = backdrop.querySelector('#wpDropZone');
    const previewSec = backdrop.querySelector('#wpModalPreviewSection');
    const previewImg = backdrop.querySelector('#wpModalPreviewImg');
    const removeBtn = backdrop.querySelector('#wpModalRemoveBtn');
    const opacitySlider = backdrop.querySelector('#wpModalOpacity');
    const opacityValText = backdrop.querySelector('#wpOpacityValText');
    const blurSlider = backdrop.querySelector('#wpModalBlur');
    const blurValText = backdrop.querySelector('#wpBlurValText');
    const closeBtn = backdrop.querySelector('#wpModalCloseBtn');
    const doneBtn = backdrop.querySelector('#wpModalDoneBtn');

    let isClosing = false;
    const closeModal = () => {
      if (isClosing) return;
      isClosing = true;
      backdrop.classList.remove('ds-modal-visible');
      document.removeEventListener('keydown', escHandler);
      setTimeout(() => {
        if (backdrop.parentNode) backdrop.remove();
      }, 240);
    };

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = 'var(--ds-brand-primary)';
    });
    dropZone.addEventListener('dragleave', () => {
      dropZone.style.borderColor = 'rgba(255,255,255,0.18)';
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = 'rgba(255,255,255,0.18)';
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    });

    function handleFile(file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file', ICONS.close);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target.result;
        config.enableWallpaper = true;
        config.wallpaperImage = base64;
        previewImg.src = base64;
        previewSec.style.display = 'flex';
        applySettings();
        saveWallpaperSettings();
      };
      reader.readAsDataURL(file);
    }

    removeBtn.addEventListener('click', () => {
      config.enableWallpaper = false;
      config.wallpaperImage = '';
      previewImg.src = '';
      previewSec.style.display = 'none';
      applySettings();
      saveWallpaperSettings();
    });

    opacitySlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      opacityValText.textContent = `${val}%`;
      config.wallpaperOpacity = val / 100;
      applyWallpaper();
      saveWallpaperSettings();
    });

    blurSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      blurValText.textContent = `${val}px`;
      config.wallpaperBlur = val;
      applyWallpaper();
      saveWallpaperSettings();
    });

    closeBtn.addEventListener('click', closeModal);
    doneBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });

    const escHandler = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', escHandler);
  }

  function saveWallpaperSettings() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({
        enableWallpaper: config.enableWallpaper,
        wallpaperImage: config.wallpaperImage,
        wallpaperOpacity: config.wallpaperOpacity,
        wallpaperBlur: config.wallpaperBlur
      });
    }
  }

  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
      if (req.action && exportActions[req.action]) {
        exportActions[req.action]();
        sendResponse({ success: true });
      } else if (req.action === 'openSearch') {
        openSearchBar();
        sendResponse({ success: true });
      } else if (req.action === 'openPins') {
        openPinsDrawer();
        sendResponse({ success: true });
      } else if (req.action === 'openWallpaperModal') {
        openWallpaperModal();
        sendResponse({ success: true });
      }
    });
  }

  /* =========================================================================
     DOM SCANNER & OBSERVER
     ========================================================================= */

  function scanDOM(root = document) {
    if (!config.enabled) return;

    const textBlocks = root.querySelectorAll(
      '.ds-markdown p, .ds-markdown h1, .ds-markdown h2, .ds-markdown h3, .ds-markdown h4, .ds-markdown h5, .ds-markdown h6, .ds-markdown li, .ds-markdown blockquote, .ds-markdown table, .ds-markdown td, .ds-markdown th'
    );
    for (let i = 0; i < textBlocks.length; i++) {
      processElement(textBlocks[i]);
    }

    const userMessages = root.querySelectorAll(
      '.ds-collapsible-text, .ds-collapsible-text > div, .d29f3d7d, .ds-message:not(:has(.ds-markdown))'
    );
    for (let i = 0; i < userMessages.length; i++) {
      processElement(userMessages[i]);
    }

    const thinkingBlocks = root.querySelectorAll(
      '.ds-thinking-content, [class*="thinking"], [class*="reasoning"]'
    );
    for (let i = 0; i < thinkingBlocks.length; i++) {
      processElement(thinkingBlocks[i]);
    }

    const inputs = root.querySelectorAll('textarea, input[type="text"], input[name="search"]');
    for (let i = 0; i < inputs.length; i++) {
      processInput(inputs[i]);
    }

    // Enhance Code Blocks
    enhanceCodeBlocks(root);

    // Enhance Pin Buttons on Messages
    enhanceMessagePinButtons(root);

    // Auto-Collapse R1 Thoughts
    handleAutoCollapseThoughts(root);

    // Dynamic Markdown Tables (Sorting, Filtering, CSV/Excel)
    if (window.DeepSeekOrbit && window.DeepSeekOrbit.DynamicTables) {
      window.DeepSeekOrbit.DynamicTables.enhanceDynamicTables(root);
    }

    // Multi-File Project Bundler (1-Click ZIP)
    if (window.DeepSeekOrbit && window.DeepSeekOrbit.ZipBundler) {
      window.DeepSeekOrbit.ZipBundler.enhanceMultiFileProjects(root);
    }

    // Live HTML/CSS/JS Sandbox Preview (Artifacts)
    if (window.DeepSeekOrbit && window.DeepSeekOrbit.SandboxPreview) {
      window.DeepSeekOrbit.SandboxPreview.enhanceSandboxPreviews(root);
    }

    // Persona Indicator for Custom Instructions
    if (window.DeepSeekOrbit && window.DeepSeekOrbit.CustomInstructions) {
      window.DeepSeekOrbit.CustomInstructions.ensurePersonaIndicator(root);
    }

    // Mount Toolbar & Navigation Drawer
    ensureFloatingToolbar();
    ensureNavigationDrawer();

    // Mount Context Attachment Button next to chat input
    if (window.DeepSeekOrbit && window.DeepSeekOrbit.ContextImporter) {
      window.DeepSeekOrbit.ContextImporter.ensureAttachContextButton(root);
    }
  }

  let rafId = null;
  function scheduleScan() {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      scanDOM();
    });
  }

  function initObserver() {
    const observer = new MutationObserver((mutations) => {
      let needsScan = false;
      for (let i = 0; i < mutations.length; i++) {
        const mutation = mutations[i];
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          needsScan = true;
          break;
        } else if (mutation.type === 'characterData') {
          needsScan = true;
          break;
        }
      }
      if (needsScan) {
        scheduleScan();
      }
    });

    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  function setupInputListeners() {
    document.addEventListener('input', (e) => {
      if (e.target && (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT')) {
        processInput(e.target);
        if (e.target.tagName === 'TEXTAREA') {
          handleSlashInput(e.target);
        }
      }
    }, true);

    document.addEventListener('focusin', (e) => {
      if (e.target && (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT')) {
        processInput(e.target);
      }
    }, true);

    // Keydown handler for Slash Commands & Prompt History Cycling
    document.addEventListener('keydown', (e) => {
      if (e.target && e.target.tagName === 'TEXTAREA') {
        if (handleSlashKeydown(e, e.target)) return;
        handlePromptHistoryKey(e, e.target);

        // Record prompt on Enter
        if (e.key === 'Enter' && !e.shiftKey) {
          recordPromptHistory(e.target.value);
          hideSlashMenu();
        }
      }
    }, true);

    // Global Click Handler (Pin Buttons, Slash Menu dismiss, Send button prompt recording)
    document.addEventListener('click', (e) => {
      const pinBtn = e.target.closest('.ds-pin-btn');
      if (pinBtn) {
        e.preventDefault();
        e.stopPropagation();
        handlePinButtonClick(pinBtn);
        return;
      }

      const codeWrapBtn = e.target.closest('.ds-custom-wrap-btn');
      if (codeWrapBtn) {
        e.preventDefault();
        e.stopPropagation();
        const cb = codeWrapBtn.closest('.md-code-block');
        if (cb) {
          const isWrapped = cb.classList.toggle('ds-code-wrapped');
          codeWrapBtn.classList.toggle('ds-btn-active', isWrapped);
        }
        return;
      }

      const codeExpandBtn = e.target.closest('.ds-custom-expand-btn');
      if (codeExpandBtn) {
        e.preventDefault();
        e.stopPropagation();
        const cb = codeExpandBtn.closest('.md-code-block');
        if (cb) {
          openFullscreenCode(cb);
        }
        return;
      }

      // Dismiss slash menu on outside click
      if (!e.target.closest('.ds-slash-menu')) {
        hideSlashMenu();
      }

      // Record prompt when clicking send button
      const sendBtn = e.target.closest('button[type="submit"], [aria-label*="Send"], .ds-icon-button, [class*="send"]');
      if (sendBtn) {
        const ta = document.querySelector('textarea');
        if (ta && ta.value) {
          recordPromptHistory(ta.value);
        }
      }
    }, true);
  }

  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + F: In-Chat Search override
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && !e.shiftKey) {
        const isEditing = ['TEXTAREA', 'INPUT'].includes(document.activeElement.tagName) && document.activeElement.id !== 'dsSearchInput';
        if (!isEditing) {
          e.preventDefault();
          openSearchBar();
        }
      }

      // Ctrl/Cmd + Shift + X: Input RTL toggle
      if ((e.ctrlKey || e.altKey || e.metaKey) && e.shiftKey && e.code === 'KeyX') {
        e.preventDefault();
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT')) {
          const currentDir = activeEl.getAttribute('data-ds-dir') || activeEl.dir || 'ltr';
          const newDir = currentDir === 'rtl' ? 'ltr' : 'rtl';
          activeEl.setAttribute('data-ds-dir', newDir);
          activeEl.dir = newDir;
        }
      }
    });
  }

  function loadSettings() {
    const storageApi = (typeof chrome !== 'undefined' && chrome.storage) ? (chrome.storage.local || chrome.storage.sync) : null;
    if (storageApi) {
      storageApi.get(['enabled', 'mode', 'fontFamily', 'customFont', 'enableWordWrap', 'autoCollapseThoughts', 'enableWallpaper', 'wallpaperImage', 'wallpaperOpacity', 'wallpaperBlur'], (res) => {
        if (res) {
          config.enabled = res.enabled !== undefined ? res.enabled : true;
          config.mode = res.mode || 'auto';
          config.fontFamily = res.fontFamily || 'Vazirmatn';
          config.customFont = res.customFont || '';
          config.enableWordWrap = res.enableWordWrap || false;
          config.autoCollapseThoughts = res.autoCollapseThoughts || false;
          config.enableWallpaper = res.enableWallpaper || false;
          config.wallpaperImage = res.wallpaperImage || '';
          config.wallpaperOpacity = res.wallpaperOpacity !== undefined ? res.wallpaperOpacity : 0.15;
          config.wallpaperBlur = res.wallpaperBlur || 0;
        }
        applySettings();
        scheduleScan();
      });

      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' || area === 'sync') {
          if (changes.enabled !== undefined) config.enabled = changes.enabled.newValue;
          if (changes.mode !== undefined) config.mode = changes.mode.newValue;
          if (changes.fontFamily !== undefined) config.fontFamily = changes.fontFamily.newValue;
          if (changes.customFont !== undefined) config.customFont = changes.customFont.newValue;
          if (changes.enableWordWrap !== undefined) config.enableWordWrap = changes.enableWordWrap.newValue;
          if (changes.autoCollapseThoughts !== undefined) config.autoCollapseThoughts = changes.autoCollapseThoughts.newValue;
          if (changes.enableWallpaper !== undefined) config.enableWallpaper = changes.enableWallpaper.newValue;
          if (changes.wallpaperImage !== undefined) config.wallpaperImage = changes.wallpaperImage.newValue;
          if (changes.wallpaperOpacity !== undefined) config.wallpaperOpacity = changes.wallpaperOpacity.newValue;
          if (changes.wallpaperBlur !== undefined) config.wallpaperBlur = changes.wallpaperBlur.newValue;
          applySettings();
          scheduleScan();
        }
      });
    } else {
      applySettings();
      scheduleScan();
    }
  }

  function setupMessageListeners() {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
        if (req && req.type === 'DEEPSEEK_UPDATE_CONFIG' && req.config) {
          Object.assign(config, req.config);
          applySettings();
          if (config.enabled) {
            scheduleScan(true);
          }
          sendResponse({ status: 'ok' });
        }
      });
    }
  }

  function init() {
    loadSettings();
    initObserver();
    setupInputListeners();
    setupKeyboardShortcuts();
    setupMessageListeners();
    scheduleScan();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
