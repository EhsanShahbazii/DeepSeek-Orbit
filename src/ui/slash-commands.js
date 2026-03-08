/**
 * DeepSeek Orbit — Prompt Productivity (Slash Commands & History Cycling)
 */
(function () {
  'use strict';

  window.DeepSeekOrbit = window.DeepSeekOrbit || {};

  const promptHistory = [];
  let historyIndex = -1;
  let activeSlashMenu = null;
  let activeIndex = 0;

  function setupPromptHistory(textarea) {
    if (!textarea || textarea.dataset.dsHistoryAttached === 'true') return;
    textarea.dataset.dsHistoryAttached = 'true';

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' && textarea.selectionStart === 0 && textarea.selectionEnd === 0 && !textarea.value.trim() && promptHistory.length > 0) {
        e.preventDefault();
        if (historyIndex === -1) historyIndex = promptHistory.length - 1;
        else if (historyIndex > 0) historyIndex--;

        textarea.value = promptHistory[historyIndex];
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (e.key === 'ArrowDown' && historyIndex !== -1) {
        if (historyIndex < promptHistory.length - 1) {
          historyIndex++;
          textarea.value = promptHistory[historyIndex];
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          historyIndex = -1;
          textarea.value = '';
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      } else if (e.key === 'Enter' && !e.shiftKey) {
        const text = textarea.value.trim();
        if (text && (promptHistory.length === 0 || promptHistory[promptHistory.length - 1] !== text)) {
          promptHistory.push(text);
          if (promptHistory.length > 50) promptHistory.shift();
        }
        historyIndex = -1;
      }
    });
  }

  function setupSlashCommands(textarea) {
    if (!textarea || textarea.dataset.dsSlashAttached === 'true') return;
    textarea.dataset.dsSlashAttached = 'true';

    const SLASH_COMMANDS = window.DeepSeekOrbit.SLASH_COMMANDS || [];

    textarea.addEventListener('input', () => {
      const val = textarea.value;
      if (val === '/') {
        showSlashMenu(textarea, SLASH_COMMANDS);
      } else if (activeSlashMenu && !val.startsWith('/')) {
        closeSlashMenu();
      } else if (activeSlashMenu) {
        filterSlashMenu(val.substring(1));
      }
    });

    textarea.addEventListener('keydown', (e) => {
      if (!activeSlashMenu) return;

      const items = activeSlashMenu.querySelectorAll('.ds-slash-item:not(.hidden)');
      if (items.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIndex = (activeIndex + 1) % items.length;
        updateActiveItem(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIndex = (activeIndex - 1 + items.length) % items.length;
        updateActiveItem(items);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const activeItem = items[activeIndex];
        if (activeItem) {
          selectCommand(textarea, activeItem.dataset.cmd, SLASH_COMMANDS);
        }
      } else if (e.key === 'Escape') {
        closeSlashMenu();
      }
    });
  }

  function showSlashMenu(textarea, commands) {
    closeSlashMenu();

    const parent = textarea.closest('._77cefa5') || textarea.parentElement;
    if (!parent) return;

    activeSlashMenu = document.createElement('div');
    activeSlashMenu.className = 'ds-slash-menu';

    let html = '<div class="ds-slash-header">Prompt Templates</div>';
    commands.forEach((c, idx) => {
      html += `
        <div class="ds-slash-item ${idx === 0 ? 'active' : ''}" data-cmd="${c.cmd}">
          <div class="ds-slash-item-icon">${c.icon}</div>
          <div class="ds-slash-item-content">
            <div class="ds-slash-item-title">${c.cmd} <span style="font-weight: 400; opacity: 0.6;">- ${c.title}</span></div>
            <div class="ds-slash-item-desc">${c.desc}</div>
          </div>
        </div>
      `;
    });

    activeSlashMenu.innerHTML = html;
    parent.appendChild(activeSlashMenu);
    activeIndex = 0;

    activeSlashMenu.querySelectorAll('.ds-slash-item').forEach((item) => {
      item.addEventListener('click', () => {
        selectCommand(textarea, item.dataset.cmd, commands);
      });
    });
  }

  function filterSlashMenu(filterText) {
    if (!activeSlashMenu) return;
    const clean = filterText.toLowerCase();
    const items = activeSlashMenu.querySelectorAll('.ds-slash-item');
    let visibleCount = 0;

    items.forEach((item) => {
      const cmd = item.dataset.cmd.toLowerCase();
      const match = cmd.includes(clean);
      item.classList.toggle('hidden', !match);
      if (match) visibleCount++;
    });

    const visibleItems = activeSlashMenu.querySelectorAll('.ds-slash-item:not(.hidden)');
    activeIndex = 0;
    updateActiveItem(visibleItems);

    if (visibleCount === 0) closeSlashMenu();
  }

  function updateActiveItem(items) {
    items.forEach((item, idx) => {
      item.classList.toggle('active', idx === activeIndex);
    });
  }

  function selectCommand(textarea, cmdName, commands) {
    const cmd = commands.find((c) => c.cmd === cmdName);
    if (!cmd) return;

    textarea.value = cmd.prompt;
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    closeSlashMenu();
  }

  function closeSlashMenu() {
    if (activeSlashMenu) {
      activeSlashMenu.remove();
      activeSlashMenu = null;
    }
  }

  window.DeepSeekOrbit.SlashCommands = {
    setupPromptHistory,
    setupSlashCommands
  };
})();
