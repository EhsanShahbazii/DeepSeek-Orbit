/**
 * DeepSeek Orbit — Live HTML/CSS/JS Sandbox Preview (Artifacts)
 * Features: 1-Click Live Preview for Web Snippets, Multi-block HTML+CSS+JS Assembly, Responsive Viewport Switcher
 */
(function () {
  'use strict';

  window.DeepSeekOrbit = window.DeepSeekOrbit || {};
  const ICONS = window.DeepSeekOrbit.ICONS || {};

  function isPreviewableLanguage(lang) {
    const l = (lang || '').toLowerCase().trim();
    return ['html', 'htm', 'svg', 'xml', 'javascript', 'js', 'css', 'vue', 'svelte'].includes(l);
  }

  function isPreviewableContent(text) {
    if (!text || text.length < 10) return false;
    const t = text.trim();
    return t.includes('<html') || t.includes('<!DOCTYPE') || t.includes('<div') || 
           t.includes('<svg') || t.includes('<canvas') || t.includes('<style') ||
           t.includes('<script') || (t.includes('document.') && t.includes('addEventListener'));
  }

  function assembleArtifactHTML(currentCode, currentLang, messageEl) {
    const raw = (currentCode || '').trim();
    const l = (currentLang || '').toLowerCase().trim();

    // 1. If this block itself is a complete <!DOCTYPE html> or <html> document
    if (raw.startsWith('<!DOCTYPE') || raw.startsWith('<html')) {
      let completeDoc = raw;
      if (messageEl) {
        // Collect external CSS blocks
        const cssBlocks = Array.from(messageEl.querySelectorAll('.md-code-block, pre')).filter(cb => {
          const banner = cb.querySelector('span, ._121d384');
          const blkLang = (banner ? banner.textContent : '').toLowerCase().trim();
          const txt = (cb.textContent || '').trim();
          return blkLang.includes('css') && !txt.startsWith('<!DOCTYPE');
        });

        // Collect external JS blocks
        const jsBlocks = Array.from(messageEl.querySelectorAll('.md-code-block, pre')).filter(cb => {
          const banner = cb.querySelector('span, ._121d384');
          const blkLang = (banner ? banner.textContent : '').toLowerCase().trim();
          const txt = (cb.textContent || '').trim();
          return (blkLang.includes('js') || blkLang.includes('javascript')) && !txt.startsWith('<!DOCTYPE');
        });

        if (cssBlocks.length > 0) {
          const cssText = cssBlocks.map(cb => {
            const pre = cb.tagName === 'PRE' ? cb : cb.querySelector('pre');
            const code = pre ? (pre.querySelector('code') || pre) : cb;
            return code.textContent || '';
          }).join('\n');
          if (cssText.trim() && !completeDoc.includes(cssText.trim().substring(0, 30))) {
            completeDoc = completeDoc.replace('</head>', `<style>\n${cssText}\n</style>\n</head>`);
          }
        }

        if (jsBlocks.length > 0) {
          const jsText = jsBlocks.map(cb => {
            const pre = cb.tagName === 'PRE' ? cb : cb.querySelector('pre');
            const code = pre ? (pre.querySelector('code') || pre) : cb;
            return code.textContent || '';
          }).join('\n');
          if (jsText.trim() && !completeDoc.includes(jsText.trim().substring(0, 30))) {
            completeDoc = completeDoc.replace('</body>', `<script>\n${jsText}\n</script>\n</body>`);
          }
        }
      }
      return completeDoc;
    }

    // 2. If SVG
    if (raw.startsWith('<svg')) {
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>html,body{display:flex;align-items:center;justify-content:center;height:100vh;margin:0;padding:0;overflow:hidden;background:transparent;}</style></head><body>${raw}</body></html>`;
    }

    // 3. Otherwise pick ONLY the single main HTML block, single CSS, and single JS block
    let htmlPart = '';
    let cssPart = '';
    let jsPart = '';

    if (l.includes('html') || l.includes('xml')) {
      htmlPart = raw;
    } else if (l.includes('css')) {
      cssPart = raw;
    } else if (l.includes('js') || l.includes('javascript')) {
      jsPart = raw;
    }

    if (messageEl) {
      const codeBlocks = Array.from(messageEl.querySelectorAll('.md-code-block, pre'));
      for (const cb of codeBlocks) {
        const pre = cb.tagName === 'PRE' ? cb : cb.querySelector('pre');
        if (!pre) continue;
        const code = pre.querySelector('code') || pre;
        const text = (code.textContent || '').trim();
        const banner = cb.querySelector('span, ._121d384');
        const blkLang = (banner ? banner.textContent : '').toLowerCase().trim();

        if (!htmlPart && (blkLang.includes('html') || text.startsWith('<'))) {
          htmlPart = text;
        } else if (!cssPart && blkLang.includes('css')) {
          cssPart = text;
        } else if (!jsPart && (blkLang.includes('js') || blkLang.includes('javascript'))) {
          jsPart = text;
        }
      }
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Artifact Preview</title>
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow-x: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f1115;
      color: #f8fafc;
    }
    ${cssPart}
  </style>
</head>
<body>
  ${htmlPart || (jsPart ? '<div id="app"></div>' : '')}
  <script>
    try {
      ${jsPart}
    } catch (err) {
      console.error('Artifact Runtime Error:', err);
    }
  </script>
</body>
</html>`;
  }

  function openSandboxModal(code, language, messageEl) {
    const existing = document.querySelector('.ds-sandbox-modal-backdrop');
    if (existing) existing.remove();

    const compiledHTML = assembleArtifactHTML(code, language, messageEl);

    const backdrop = document.createElement('div');
    backdrop.className = 'ds-code-modal-backdrop ds-sandbox-modal-backdrop';

    backdrop.innerHTML = `
      <div class="ds-sandbox-modal">
        <!-- Top Toolbar -->
        <div class="ds-sandbox-header">
          <div class="ds-sandbox-title">
            <span style="color: var(--ds-brand-primary); display: inline-flex;">${ICONS.play}</span>
            <span>Live Sandbox Preview</span>
            <span class="ds-sandbox-badge">Artifact</span>
          </div>

          <!-- Viewport Switcher -->
          <div class="ds-sandbox-controls">
            <div class="ds-sandbox-device-pills">
              <button type="button" class="ds-sandbox-device-btn active" data-viewport="100%" title="Desktop View">
                <span>${ICONS.desktop}</span> <span>Desktop</span>
              </button>
              <button type="button" class="ds-sandbox-device-btn" data-viewport="768px" title="Tablet View">
                <span>Tablet</span>
              </button>
              <button type="button" class="ds-sandbox-device-btn" data-viewport="375px" title="Mobile View">
                <span>${ICONS.mobile}</span> <span>Mobile</span>
              </button>
            </div>

            <button type="button" class="ds-sandbox-btn" id="sandboxRerunBtn" title="Rerun Artifact">
              <span>${ICONS.refresh}</span> <span>Rerun</span>
            </button>

            <button type="button" class="ds-sandbox-btn" id="sandboxNewTabBtn" title="Open in New Tab">
              <span>${ICONS.export}</span> <span>New Tab</span>
            </button>

            <button type="button" class="ds-code-modal-close-btn" id="sandboxCloseBtn" title="Close (Esc)">✕</button>
          </div>
        </div>

        <!-- Frame Body -->
        <div class="ds-sandbox-body">
          <div class="ds-sandbox-frame-wrap" id="sandboxFrameWrap" style="width: 100%;">
            <iframe class="ds-sandbox-iframe" id="sandboxIframe" sandbox="allow-scripts allow-modals allow-forms"></iframe>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    void backdrop.offsetWidth;
    backdrop.classList.add('ds-modal-visible');

    const iframe = backdrop.querySelector('#sandboxIframe');
    const frameWrap = backdrop.querySelector('#sandboxFrameWrap');
    const rerunBtn = backdrop.querySelector('#sandboxRerunBtn');
    const newTabBtn = backdrop.querySelector('#sandboxNewTabBtn');
    const closeBtn = backdrop.querySelector('#sandboxCloseBtn');
    const deviceBtns = backdrop.querySelectorAll('.ds-sandbox-device-btn');

    function loadFrameContent() {
      iframe.srcdoc = compiledHTML;
    }
    loadFrameContent();

    // Device Viewport Switcher
    deviceBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        deviceBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const vp = btn.dataset.viewport;
        frameWrap.style.width = vp;
      });
    });

    // Rerun Button
    rerunBtn.addEventListener('click', () => {
      iframe.srcdoc = '';
      setTimeout(() => loadFrameContent(), 50);
    });

    // Open in New Tab
    newTabBtn.addEventListener('click', () => {
      const blob = new Blob([compiledHTML], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    });

    // Modal Close
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

    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });

    const escHandler = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', escHandler);
  }

  function enhanceCodeBlockWithPreview(codeBlock) {
    if (codeBlock.dataset.dsSandboxEnhanced === 'true') return;

    const banner = codeBlock.querySelector('._121d384, .md-code-block-banner');
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

    const pre = codeBlock.querySelector('pre');
    if (!pre) return;

    const code = pre.querySelector('code') || pre;
    const text = (code.textContent || '').trim();

    const langSpan = banner.querySelector('span');
    const lang = (langSpan ? langSpan.textContent : '').toLowerCase().trim();

    if (!isPreviewableLanguage(lang) && !isPreviewableContent(text)) {
      return;
    }

    codeBlock.dataset.dsSandboxEnhanced = 'true';

    let btnGroup = banner.querySelector('.ds-code-btn-group');
    if (!btnGroup) {
      btnGroup = document.createElement('div');
      btnGroup.className = 'ds-code-btn-group';
      banner.appendChild(btnGroup);
    }

    // Preview Button matching exact DeepSeek button format
    const previewBtn = document.createElement('div');
    previewBtn.setAttribute('role', 'button');
    previewBtn.className = 'ds-button ds-button--borderlessNeutral ds-button--borderless ds-button--capsule ds-button--xs ds-button--icon-relative-m ds-button--min-width ds-code-btn-native ds-sandbox-preview-btn';
    previewBtn.setAttribute('tabindex', '0');
    previewBtn.title = 'Live Sandbox Preview Artifact';
    previewBtn.innerHTML = `
      <div class="ds-button__background"></div>
      <div class="ds-button__icon">${ICONS.play}</div>
      <span class="ds-button__content"><span class="code-info-button-text">Preview</span></span>
    `;

    previewBtn.addEventListener('click', () => {
      const msg = codeBlock.closest('.ds-markdown, [data-virtual-list-item-key], ._63c77b1');
      openSandboxModal(text, lang, msg);
    });

    btnGroup.appendChild(previewBtn);
  }

  function enhanceSandboxPreviews(root = document) {
    const codeBlocks = root.querySelectorAll('.md-code-block');
    codeBlocks.forEach(cb => {
      try {
        enhanceCodeBlockWithPreview(cb);
      } catch (err) {}
    });
  }

  window.DeepSeekOrbit.SandboxPreview = {
    openSandboxModal,
    enhanceSandboxPreviews
  };
})();
