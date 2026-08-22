/**
 * DeepSeek Orbit — Floating Suite Toolbar & Chat Export Actions
 */
(function () {
  'use strict';

  window.DeepSeekOrbit = window.DeepSeekOrbit || {};
  const ICONS = window.DeepSeekOrbit.ICONS || {};

  function showToast(text, icon = ICONS.check) {
    const existing = document.querySelector('.ds-pro-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'ds-pro-toast';
    toast.innerHTML = `<span>${icon}</span> <span>${text}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 250);
    }, 2400);
  }

  function getConversationTitle() {
    const titleEl = document.querySelector('._81e7b5e._19d617c ._72b6158, title');
    let title = (titleEl ? titleEl.textContent : 'DeepSeek-Chat') || 'DeepSeek-Chat';
    return title.replace(/[\\/:*?"<>|]/g, '-').trim();
  }

  function collectConversationData() {
    const messages = [];
    const chatRows = document.querySelectorAll('._9663006, [data-virtual-list-item-key], .ds-message');

    chatRows.forEach((row) => {
      const isUser = !!row.querySelector('._11d6b3a');
      const textContainer = row.querySelector('.ds-markdown, ._63c77b1') || row;
      const clone = textContainer.cloneNode(true);
      clone.querySelectorAll('.ds-export-toolbar, .ds-pin-btn, button, .ds-line-numbers-gutter').forEach(el => el.remove());
      const content = clone.textContent ? clone.textContent.trim() : '';

      if (content) {
        messages.push({
          role: isUser ? 'User' : 'Assistant',
          content: content,
          timestamp: new Date().toISOString()
        });
      }
    });
    return messages;
  }

  const exportActions = {
    exportMarkdown() {
      const messages = collectConversationData();
      if (messages.length === 0) return showToast('No messages to export', ICONS.close);

      let md = `# ${getConversationTitle()}\n\n*Exported via DeepSeek Orbit on ${new Date().toLocaleString()}*\n\n---\n\n`;
      messages.forEach(m => {
        md += `### ${m.role === 'User' ? '👤 User' : '🤖 DeepSeek'}\n\n${m.content}\n\n---\n\n`;
      });

      downloadFile(md, `${getConversationTitle()}.md`, 'text/markdown;charset=utf-8');
      showToast('Markdown downloaded!', ICONS.check);
    },

    async copyMarkdown() {
      const messages = collectConversationData();
      if (messages.length === 0) return showToast('No messages to copy', ICONS.close);

      let md = `# ${getConversationTitle()}\n\n`;
      messages.forEach(m => {
        md += `### ${m.role === 'User' ? '👤 User' : '🤖 DeepSeek'}\n\n${m.content}\n\n---\n\n`;
      });

      try {
        await navigator.clipboard.writeText(md);
        showToast('All messages copied as Markdown!', ICONS.check);
      } catch (e) {
        showToast('Failed to copy to clipboard', ICONS.close);
      }
    },

    exportHTML() {
      const messages = collectConversationData();
      if (messages.length === 0) return showToast('No messages to export', ICONS.close);

      let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${getConversationTitle()}</title><style>body{font-family:system-ui,sans-serif;max-width:850px;margin:30px auto;padding:20px;line-height:1.6;color:#1e293b;background:#f8fafc}.msg{margin-bottom:24px;padding:16px 20px;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.1)}.msg.user{background:#e0e7ff;border-left:4px solid #4d6bfe}.msg.assistant{background:#fff;border-left:4px solid #10b981}.role{font-weight:700;margin-bottom:8px;font-size:14px}.content{white-space:pre-wrap;font-size:14.5px}</style></head><body><h1>${getConversationTitle()}</h1>`;
      messages.forEach(m => {
        html += `<div class="msg ${m.role.toLowerCase()}"><div class="role">${m.role}</div><div class="content">${escapeHtml(m.content)}</div></div>`;
      });
      html += `</body></html>`;

      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const printWin = window.open(url, '_blank');
      if (printWin) {
        printWin.focus();
      }
    },

    exportJSON() {
      const messages = collectConversationData();
      if (messages.length === 0) return showToast('No messages to export', ICONS.close);

      const json = JSON.stringify({
        title: getConversationTitle(),
        exportedAt: new Date().toISOString(),
        messagesCount: messages.length,
        messages: messages
      }, null, 2);

      downloadFile(json, `${getConversationTitle()}.json`, 'application/json;charset=utf-8');
      showToast('JSON exported!', ICONS.check);
    }
  };

  function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  function escapeHtml(str) {
    return (str || '').replace(/[&<>"']/g, (m) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[m]));
  }

  function ensureFloatingToolbar(callbacks) {
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
      <button type="button" class="ds-suite-btn" id="dsToolbarWideBtn" title="Toggle Wide Chat Mode">
        <span class="ds-suite-btn-icon">${ICONS.wide || '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 8H14.5M1.5 8L4.5 5M1.5 8L4.5 11M14.5 8L11.5 5M14.5 8L11.5 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'}</span> <span>Wide</span>
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
    const wideBtn = toolbar.querySelector('#dsToolbarWideBtn');
    const memoryBtn = toolbar.querySelector('#dsToolbarMemoryBtn');
    const toggleExportBtn = toolbar.querySelector('#dsExportToggleBtn');
    const exportMenu = toolbar.querySelector('#dsExportMenu');

    if (callbacks.onSearchInput) searchInput.addEventListener('input', (e) => callbacks.onSearchInput(e.target.value));
    if (callbacks.onSearchNext) searchNextBtn.addEventListener('click', callbacks.onSearchNext);
    if (callbacks.onSearchPrev) searchPrevBtn.addEventListener('click', callbacks.onSearchPrev);
    if (callbacks.onSearchClose) searchCloseBtn.addEventListener('click', callbacks.onSearchClose);
    if (callbacks.onSearchToggle) searchBtn.addEventListener('click', callbacks.onSearchToggle);
    if (callbacks.onPinsOpen) pinsBtn.addEventListener('click', callbacks.onPinsOpen);

    if (wideBtn) {
      wideBtn.addEventListener('click', () => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get(['enableWideChat'], (res) => {
            const newVal = !res.enableWideChat;
            chrome.storage.local.set({ enableWideChat: newVal }, () => {
              showToast(newVal ? 'Wide Chat Mode Enabled' : 'Wide Chat Mode Disabled');
            });
          });
        }
      });
    }

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

    exportMenu.querySelectorAll('.ds-export-item').forEach((item) => {
      item.addEventListener('click', () => {
        const actionName = item.dataset.action;
        if (exportActions[actionName]) {
          exportActions[actionName]();
        }
        exportMenu.classList.remove('show');
      });
    });
  }

  window.DeepSeekOrbit.Toolbar = {
    showToast,
    exportActions,
    ensureFloatingToolbar
  };
})();
