/**
 * DeepSeek Orbit — Multi-Memory & Custom Instructions Studio
 * Features: Native prompt bar toggle button (enable/disable), Table Layout, No icon clutter, Smooth Animations, Full CRUD
 */
(function () {
  'use strict';

  window.DeepSeekOrbit = window.DeepSeekOrbit || {};

  const MEM_ICONS = {
    brain: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04z"/></svg>`,
    edit: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>`,
    trash: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`,
    plus: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>`,
    check: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
  };

  const DEFAULT_MEMORIES = [
    {
      id: 'persian_tech',
      title: 'Persian Tech Lead',
      subtitle: 'توسعه‌دهنده ارشد فارسی',
      lang: 'fa',
      enabled: true,
      isDefault: true,
      text: 'همیشه توضیحات، تحلیل‌ها و پاسخ‌ها را به زبان فارسی روان، شیوا و با لحن حرفه‌ای مهندسی نرم‌افزار ارائه بده. کدهای برنامه‌نویسی و اصطلاحات تخصصی را به زبان انگلیسی بنویس و از تایپ‌اسکریپت (TypeScript) و استانداردهای Clean Code استفاده کن.'
    },
    {
      id: 'persian_explainer',
      title: 'Persian Deep Explainer',
      subtitle: 'توضیحات مفهومی و گام‌به‌گام',
      lang: 'fa',
      enabled: false,
      isDefault: true,
      text: 'تمام مفاهیم فنی، معماری سیستم و الگوریتم‌ها را به زبان فارسی سلیس، شیوا، با تحلیل ساختاریافته گام‌به‌گام و مثال‌های روشن و کاربردی توضیح بده.'
    },
    {
      id: 'senior_arch',
      title: 'Full-Stack Architect',
      subtitle: 'Senior Production Engineer',
      lang: 'en',
      enabled: false,
      isDefault: true,
      text: 'You are a Senior Full-Stack Architect. Provide concise, high-performance, modular production code. Eliminate conversational filler, emphasize scalable architectural patterns, modern TypeScript/Next.js/Node idioms, and robust error handling.'
    },
    {
      id: 'code_reviewer',
      title: 'Code Reviewer & QA',
      subtitle: 'Security & Edge-Case Specialist',
      lang: 'en',
      enabled: false,
      isDefault: true,
      text: 'You are a rigorous Senior Code Reviewer. When analyzing or writing code, identify potential security vulnerabilities, time/space complexity bottlenecks, edge cases, and include complete unit test suites.'
    },
    {
      id: 'strict_typing',
      title: 'Type Safety & Docstrings',
      subtitle: 'Strict Typing & Clean Documentation',
      lang: 'en',
      enabled: false,
      isDefault: true,
      text: 'Ensure all functions, classes, and modules have comprehensive JSDoc/TSDoc docstrings, complete type definitions, and zero implicit any.'
    }
  ];

  const QUICK_TAGS = [
    { label: '+ Always TypeScript', insert: 'Use TypeScript with strict typing everywhere.' },
    { label: '+ Fluent Persian', insert: 'Explain in fluent, natural Persian.' },
    { label: '+ Clean Code / SOLID', insert: 'Follow SOLID and DRY design principles.' },
    { label: '+ Include Unit Tests', insert: 'Include comprehensive automated unit tests.' },
    { label: '+ Concise / No Fluff', insert: 'Be extremely concise with direct code explanations.' }
  ];

  let memoryStore = {
    globalEnabled: true,
    memories: JSON.parse(JSON.stringify(DEFAULT_MEMORIES))
  };

  let activeFilter = 'all'; // 'all' | 'fa' | 'en' | 'custom'

  function showToast(text, icon = MEM_ICONS.check) {
    const existing = document.querySelector('.ds-pro-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'ds-pro-toast';
    toast.innerHTML = `<span style="display: inline-flex;">${icon}</span> <span>${text}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 250);
    }, 2200);
  }

  function loadMemoryStore(callback) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['orbitMemoryStore'], (res) => {
        if (res.orbitMemoryStore) {
          memoryStore = res.orbitMemoryStore;
          if (!memoryStore.memories || memoryStore.memories.length === 0) {
            memoryStore.memories = JSON.parse(JSON.stringify(DEFAULT_MEMORIES));
          }
        }
        if (callback) callback(memoryStore);
      });
    } else {
      if (callback) callback(memoryStore);
    }
  }

  function saveMemoryStore(callback) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ orbitMemoryStore: memoryStore }, () => {
        if (callback) callback();
      });
    } else {
      if (callback) callback();
    }
  }

  function getCombinedActivePrompt() {
    if (!memoryStore.globalEnabled) return '';
    const active = memoryStore.memories.filter(m => m.enabled);
    if (active.length === 0) return '';

    let prompt = `[Developer Persona & System Instructions]:\n`;
    active.forEach(m => {
      prompt += `• [${m.title}]: ${m.text.trim()}\n`;
    });
    return prompt.trim();
  }

  function openCustomInstructionsModal() {
    const existing = document.querySelector('.ds-instructions-modal-backdrop');
    if (existing) existing.remove();

    const backdrop = document.createElement('div');
    backdrop.className = 'ds-code-modal-backdrop ds-instructions-modal-backdrop';

    function renderModalContent() {
      const activeCount = memoryStore.memories.filter(m => m.enabled).length;

      const filteredList = memoryStore.memories.filter(m => {
        if (activeFilter === 'fa') return m.lang === 'fa';
        if (activeFilter === 'en') return m.lang === 'en';
        if (activeFilter === 'custom') return !m.isDefault;
        return true;
      });

      const tableRowsHtml = filteredList.map((m) => `
        <tr class="ds-memory-row ${m.enabled ? 'row-active' : ''}" data-id="${m.id}">
          <td style="width: 44px; text-align: center;">
            <input type="checkbox" class="ds-memory-check" data-id="${m.id}" ${m.enabled ? 'checked' : ''} />
          </td>
          <td style="width: 210px;">
            <div class="ds-memory-title-wrap">
              <div class="ds-memory-title">${escapeHtml(m.title)}</div>
              <div class="ds-memory-sub">${escapeHtml(m.subtitle || '')}</div>
            </div>
          </td>
          <td style="width: 90px;">
            <span class="ds-memory-lang-badge lang-${m.lang}">
              ${m.lang === 'fa' ? 'Persian' : m.lang === 'en' ? 'English' : 'Custom'}
            </span>
          </td>
          <td>
            <div class="ds-memory-preview-text" title="Click to edit instruction">${escapeHtml(m.text)}</div>
          </td>
          <td style="width: 80px; text-align: right;">
            <div class="ds-memory-row-actions">
              <button type="button" class="ds-mem-action-btn mem-edit-btn" data-id="${m.id}" title="Edit Memory">${MEM_ICONS.edit}</button>
              <button type="button" class="ds-mem-action-btn mem-del-btn" data-id="${m.id}" title="Delete Memory">${MEM_ICONS.trash}</button>
            </div>
          </td>
        </tr>
      `).join('');

      backdrop.innerHTML = `
        <div class="ds-code-modal ds-instructions-modal ds-memory-studio-modal">
          <!-- Header -->
          <div class="ds-code-modal-header">
            <div class="ds-code-modal-title">
              <span style="color: var(--ds-brand-primary); display: inline-flex;">${MEM_ICONS.brain}</span>
              <span style="margin-left: 6px; font-weight: 700; font-size: 14px;">Custom Instructions & Memory Studio</span>
              <span class="ds-memory-active-pill ${activeCount > 0 && memoryStore.globalEnabled ? 'active' : ''}">
                ${memoryStore.globalEnabled ? `${activeCount} Active` : 'Disabled'}
              </span>
            </div>
            <div style="display: flex; align-items: center; gap: 14px;">
              <label class="ds-instructions-toggle-wrap" title="Enable/Disable All Memories">
                <span style="font-size: 12px; font-weight: 600; color: #ffffff;">Master Switch</span>
                <input type="checkbox" id="instGlobalToggle" ${memoryStore.globalEnabled ? 'checked' : ''} />
                <span class="ds-toggle-slider"></span>
              </label>
              <button type="button" class="ds-code-modal-close-btn" id="instCloseBtn" title="Close (Esc)">✕</button>
            </div>
          </div>

          <!-- Filter Toolbar -->
          <div class="ds-memory-toolbar-strip">
            <div class="ds-memory-filter-pills">
              <button type="button" class="ds-mem-filter-btn ${activeFilter === 'all' ? 'active' : ''}" data-filter="all">All (${memoryStore.memories.length})</button>
              <button type="button" class="ds-mem-filter-btn ${activeFilter === 'fa' ? 'active' : ''}" data-filter="fa">Persian (${memoryStore.memories.filter(m => m.lang === 'fa').length})</button>
              <button type="button" class="ds-mem-filter-btn ${activeFilter === 'en' ? 'active' : ''}" data-filter="en">English (${memoryStore.memories.filter(m => m.lang === 'en').length})</button>
              <button type="button" class="ds-mem-filter-btn ${activeFilter === 'custom' ? 'active' : ''}" data-filter="custom">Custom (${memoryStore.memories.filter(m => !m.isDefault).length})</button>
            </div>

            <button type="button" class="ds-suite-btn ds-ctx-btn-primary" id="addNewMemBtn">
              <span class="ds-suite-btn-icon">${MEM_ICONS.plus}</span>
              <span>Add Custom Memory</span>
            </button>
          </div>

          <!-- Memory Table Area -->
          <div class="ds-memory-table-wrap">
            <table class="ds-memory-table ds-table-exempt" data-no-dynamic="true">
              <thead>
                <tr>
                  <th style="width: 44px; text-align: center;">Active</th>
                  <th style="width: 210px;">Persona Name</th>
                  <th style="width: 90px;">Language</th>
                  <th>Instruction Rules</th>
                  <th style="width: 80px; text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${tableRowsHtml || '<tr><td colspan="5" style="text-align: center; padding: 24px; color: var(--ds-text-muted);">No memories found in this filter.</td></tr>'}
              </tbody>
            </table>
          </div>

          <!-- Edit / Add Drawer Form -->
          <div class="ds-memory-edit-drawer" id="memEditDrawer">
            <div class="ds-mem-drawer-header">
              <span id="drawerTitleText" style="font-weight: 600; color: #ffffff;">Add Custom Memory</span>
              <button type="button" class="ds-code-modal-close-btn" id="closeDrawerBtn">✕</button>
            </div>
            <div class="ds-mem-drawer-body">
              <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px; margin-bottom: 10px;">
                <div>
                  <label class="ds-mem-form-label">Title / Persona Name</label>
                  <input type="text" class="ds-ctx-input" id="drawerTitleInput" placeholder="e.g. Next.js & Tailwind Specialist" />
                </div>
                <div>
                  <label class="ds-mem-form-label">Language / Category</label>
                  <select class="ds-ctx-input" id="drawerLangSelect">
                    <option value="fa">Persian (فارسی)</option>
                    <option value="en">English</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div style="margin-bottom: 8px;">
                <label class="ds-mem-form-label">Role Description</label>
                <input type="text" class="ds-ctx-input" id="drawerSubInput" placeholder="e.g. Modern UI Architecture & Clean Design" />
              </div>

              <div style="margin-bottom: 6px;">
                <label class="ds-mem-form-label">Quick Rules Injector</label>
                <div class="ds-rule-tags-wrap">
                  ${QUICK_TAGS.map(t => `<button type="button" class="ds-rule-tag-btn drawer-tag" data-insert="${t.insert}">${t.label}</button>`).join('')}
                </div>
              </div>

              <div>
                <label class="ds-mem-form-label">System Instructions Text</label>
                <textarea class="ds-instructions-textarea" id="drawerTextInput" style="height: 80px;" placeholder="Write specific rules and instructions for DeepSeek to follow..."></textarea>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px;">
                <button type="button" class="ds-suite-btn ds-ctx-btn-secondary" id="cancelDrawerBtn">Cancel</button>
                <button type="button" class="ds-suite-btn ds-ctx-btn-primary" id="saveDrawerBtn">Save Memory</button>
              </div>
            </div>
          </div>

          <!-- Bottom Footer Strip -->
          <div class="ds-memory-footer-strip">
            <button type="button" class="ds-suite-btn ds-ctx-btn-secondary" id="instResetAllBtn">
              <span>Reset to Defaults</span>
            </button>
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 12px; color: var(--ds-text-secondary);">${activeCount} active simultaneously</span>
              <button type="button" class="ds-suite-btn ds-ctx-btn-primary" id="instApplySaveBtn">
                <span class="ds-suite-btn-icon">${MEM_ICONS.check}</span>
                <span>Save & Apply</span>
              </button>
            </div>
          </div>
        </div>
      `;

      bindModalEvents();
    }

    let editingMemoryId = null;

    function bindModalEvents() {
      const globalToggle = backdrop.querySelector('#instGlobalToggle');
      const filterBtns = backdrop.querySelectorAll('.ds-mem-filter-btn');
      const checkBoxes = backdrop.querySelectorAll('.ds-memory-check');
      const addBtn = backdrop.querySelector('#addNewMemBtn');
      const resetBtn = backdrop.querySelector('#instResetAllBtn');
      const applyBtn = backdrop.querySelector('#instApplySaveBtn');
      const closeBtn = backdrop.querySelector('#instCloseBtn');

      const drawer = backdrop.querySelector('#memEditDrawer');
      const drawerTitleText = backdrop.querySelector('#drawerTitleText');
      const drawerTitleInput = backdrop.querySelector('#drawerTitleInput');
      const drawerLangSelect = backdrop.querySelector('#drawerLangSelect');
      const drawerSubInput = backdrop.querySelector('#drawerSubInput');
      const drawerTextInput = backdrop.querySelector('#drawerTextInput');
      const saveDrawerBtn = backdrop.querySelector('#saveDrawerBtn');
      const cancelDrawerBtn = backdrop.querySelector('#cancelDrawerBtn');
      const closeDrawerBtn = backdrop.querySelector('#closeDrawerBtn');

      globalToggle.addEventListener('change', () => {
        memoryStore.globalEnabled = globalToggle.checked;
        saveMemoryStore(() => {
          updatePromptBarMemoryButton();
          renderModalContent();
        });
      });

      filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          activeFilter = btn.dataset.filter;
          renderModalContent();
        });
      });

      checkBoxes.forEach(chk => {
        chk.addEventListener('change', () => {
          const id = chk.dataset.id;
          const target = memoryStore.memories.find(m => m.id === id);
          if (target) {
            target.enabled = chk.checked;
            saveMemoryStore(() => {
              updatePromptBarMemoryButton();
              const row = chk.closest('tr');
              if (row) row.classList.toggle('row-active', chk.checked);
              const pill = backdrop.querySelector('.ds-memory-active-pill');
              const count = memoryStore.memories.filter(m => m.enabled).length;
              if (pill) pill.textContent = `${count} Active`;
            });
          }
        });
      });

      backdrop.querySelectorAll('.mem-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          const target = memoryStore.memories.find(m => m.id === id);
          if (target) {
            editingMemoryId = id;
            drawerTitleText.textContent = `Edit Memory: ${target.title}`;
            drawerTitleInput.value = target.title;
            drawerLangSelect.value = target.lang || 'custom';
            drawerSubInput.value = target.subtitle || '';
            drawerTextInput.value = target.text;
            drawer.classList.add('open');
            drawerTitleInput.focus();
          }
        });
      });

      backdrop.querySelectorAll('.mem-del-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          const row = btn.closest('tr');
          if (row) {
            row.style.opacity = '0';
            row.style.transform = 'translateX(20px)';
          }
          setTimeout(() => {
            memoryStore.memories = memoryStore.memories.filter(m => m.id !== id);
            saveMemoryStore(() => {
              showToast('Memory item deleted');
              updatePromptBarMemoryButton();
              renderModalContent();
            });
          }, 180);
        });
      });

      addBtn.addEventListener('click', () => {
        editingMemoryId = null;
        drawerTitleText.textContent = 'Add Custom Memory';
        drawerTitleInput.value = '';
        drawerLangSelect.value = 'custom';
        drawerSubInput.value = '';
        drawerTextInput.value = '';
        drawer.classList.add('open');
        drawerTitleInput.focus();
      });

      drawer.querySelectorAll('.drawer-tag').forEach(t => {
        t.addEventListener('click', () => {
          const ins = t.dataset.insert;
          if (drawerTextInput.value.trim()) {
            drawerTextInput.value += ' ' + ins;
          } else {
            drawerTextInput.value = ins;
          }
        });
      });

      saveDrawerBtn.addEventListener('click', () => {
        const title = drawerTitleInput.value.trim();
        const text = drawerTextInput.value.trim();
        if (!title || !text) {
          showToast('Title and instructions cannot be empty', MEM_ICONS.trash);
          return;
        }

        const lang = drawerLangSelect.value;
        const sub = drawerSubInput.value.trim();

        if (editingMemoryId) {
          const mem = memoryStore.memories.find(m => m.id === editingMemoryId);
          if (mem) {
            mem.title = title;
            mem.lang = lang;
            mem.subtitle = sub;
            mem.text = text;
          }
        } else {
          memoryStore.memories.push({
            id: 'mem_' + Date.now(),
            title: title,
            subtitle: sub,
            lang: lang,
            enabled: true,
            isDefault: false,
            text: text
          });
        }

        saveMemoryStore(() => {
          showToast(editingMemoryId ? 'Memory updated!' : 'New memory created & activated!');
          drawer.classList.remove('open');
          updatePromptBarMemoryButton();
          renderModalContent();
        });
      });

      cancelDrawerBtn.addEventListener('click', () => {
        drawer.classList.remove('open');
      });
      closeDrawerBtn.addEventListener('click', () => {
        drawer.classList.remove('open');
      });

      resetBtn.addEventListener('click', () => {
        memoryStore.memories = JSON.parse(JSON.stringify(DEFAULT_MEMORIES));
        memoryStore.globalEnabled = true;
        saveMemoryStore(() => {
          showToast('Reset memories to default presets');
          updatePromptBarMemoryButton();
          renderModalContent();
        });
      });

      applyBtn.addEventListener('click', () => {
        saveMemoryStore(() => {
          showToast('Active memories saved and applied!');
          closeModal();
          updatePromptBarMemoryButton();
        });
      });

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
        if (e.key === 'Escape' && !drawer.classList.contains('open')) closeModal();
      };
      document.addEventListener('keydown', escHandler);
    }

    document.body.appendChild(backdrop);
    void backdrop.offsetWidth;
    backdrop.classList.add('ds-modal-visible');

    renderModalContent();
  }

  function updatePromptBarMemoryButton() {
    const oldPill = document.querySelector('.ds-persona-pill');
    if (oldPill) oldPill.remove();

    const toggleContainer = document.querySelector('._58b31c9, .ec4f5d61 > div:first-child');
    if (!toggleContainer) return;

    const activeCount = memoryStore.memories.filter(m => m.enabled).length;
    const isSelected = memoryStore.globalEnabled && activeCount > 0;

    let btn = toggleContainer.querySelector('.ds-orbit-memory-btn');
    if (!btn) {
      btn = document.createElement('div');
      btn.setAttribute('tabindex', '0');
      btn.setAttribute('role', 'button');
      btn.className = 'f79352dc ds-toggle-button ds-toggle-button--m ds-orbit-memory-btn';
      btn.style.transform = 'translateZ(0px)';
      btn.title = 'Memory (Click to toggle on/off, right-click to configure)';
      toggleContainer.appendChild(btn);

      // Left click toggles enable/disable
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const currentActive = memoryStore.memories.filter(m => m.enabled).length;
        if (currentActive === 0 && !memoryStore.globalEnabled) {
          openCustomInstructionsModal();
          return;
        }

        memoryStore.globalEnabled = !memoryStore.globalEnabled;
        saveMemoryStore(() => {
          updatePromptBarMemoryButton();
          showToast(
            memoryStore.globalEnabled 
              ? `Memory Active (${currentActive} persona${currentActive > 1 ? 's' : ''})` 
              : 'Memory Disabled'
          );
        });
      });

      // Right click opens settings modal
      btn.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openCustomInstructionsModal();
      });
    }

    btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    btn.classList.toggle('ds-toggle-button--selected', isSelected);

    btn.innerHTML = `
      <div class="ds-toggle-button__icon">
        <div class="ds-icon" style="font-size: inherit;">
          <div class="_46d2264" aria-hidden="true">
            <div style="width: 14px; height: 14px; display: flex; align-items: center; justify-content: center;">
              ${MEM_ICONS.brain}
            </div>
          </div>
        </div>
      </div>
      <span class="_6dbc175">${isSelected ? `Memory (${activeCount})` : 'Memory'}</span>
      <div class="ds-focus-ring" style="--dsl-focus-ring-offset: -1px;"></div>
    `;
  }

  function ensurePersonaIndicator(root = document) {
    updatePromptBarMemoryButton();
  }

  function escapeHtml(str) {
    return (str || '').replace(/[&<>"']/g, (m) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[m]));
  }

  // Initial load
  loadMemoryStore(() => {
    updatePromptBarMemoryButton();
  });

  window.DeepSeekOrbit.CustomInstructions = {
    openCustomInstructionsModal,
    ensurePersonaIndicator,
    getCombinedActivePrompt,
    getStore: () => memoryStore,
    loadMemoryStore,
    saveMemoryStore
  };
})();
