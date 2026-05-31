/**
 * DeepSeek Orbit — Persistent Custom Instructions & Developer Persona Memory
 * Features: RTL Presets (Persian, Arabic), Architecture Presets, Quick Tags, Seamless Storage Sync
 */
(function () {
  'use strict';

  window.DeepSeekOrbit = window.DeepSeekOrbit || {};
  const ICONS = window.DeepSeekOrbit.ICONS || {};

  const PRESETS = {
    persian_tech: {
      id: 'persian_tech',
      title: 'Persian Tech Lead',
      subtitle: 'توسعه‌دهنده ارشد فارسی',
      flag: '🇮🇷',
      text: 'همیشه توضیحات، تحلیل‌ها و پاسخ‌ها را به زبان فارسی روان، شیوا و با لحن حرفه‌ای مهندسی نرم‌افزار ارائه بده. کدهای برنامه‌نویسی و اصطلاحات تخصصی را به زبان انگلیسی بنویس و از تایپ‌اسکریپت (TypeScript) و استانداردهای Clean Code استفاده کن.'
    },
    arabic_eng: {
      id: 'arabic_eng',
      title: 'Arabic Software Engineer',
      subtitle: 'مهندس برمجيات عربي',
      flag: '🇸🇦',
      text: 'اشرح المفاهيم البرمجية والهيكلية بلغة عربية فصحى واضحة ومهنية مع الإبقاء على المصطلحات التقنية والتعليقات البرمجية باللغة الإنجليزية، واستخدم أفضل الممارسات الحديثة وأحدث التقنيات.'
    },
    senior_arch: {
      id: 'senior_arch',
      title: 'Full-Stack Architect',
      subtitle: 'Senior Production Engineer',
      flag: '⚡',
      text: 'You are a Senior Full-Stack Architect. Provide concise, high-performance, modular production code. Eliminate conversational filler, emphasize scalable architectural patterns, modern TypeScript/Next.js/Node idioms, and robust error handling.'
    },
    code_reviewer: {
      id: 'code_reviewer',
      title: 'Code Reviewer & QA',
      subtitle: 'Security & Edge-Case Specialist',
      flag: '🧪',
      text: 'You are a rigorous Senior Code Reviewer. When analyzing or writing code, identify potential security vulnerabilities, time/space complexity bottlenecks, edge cases, and include complete unit test suites.'
    }
  };

  const QUICK_TAGS = [
    { label: '+ Always TypeScript', insert: 'Use TypeScript with strict typing everywhere.' },
    { label: '+ Fluent Persian', insert: 'Explain in fluent, natural Persian.' },
    { label: '+ Clean Code / DRY', insert: 'Follow SOLID and DRY design principles.' },
    { label: '+ Include Unit Tests', insert: 'Include comprehensive automated unit tests.' },
    { label: '+ Concise / No Fluff', insert: 'Be extremely concise with direct code explanations.' }
  ];

  let currentSettings = {
    customInstructionsEnabled: false,
    customInstructionsPreset: 'persian_tech',
    customInstructionsText: PRESETS.persian_tech.text
  };

  function showToast(text, icon = ICONS.check) {
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

  function loadInstructions(callback) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['customInstructionsEnabled', 'customInstructionsPreset', 'customInstructionsText'], (res) => {
        if (res.customInstructionsEnabled !== undefined) currentSettings.customInstructionsEnabled = res.customInstructionsEnabled;
        if (res.customInstructionsPreset !== undefined) currentSettings.customInstructionsPreset = res.customInstructionsPreset;
        if (res.customInstructionsText !== undefined) currentSettings.customInstructionsText = res.customInstructionsText;
        if (callback) callback(currentSettings);
      });
    } else {
      if (callback) callback(currentSettings);
    }
  }

  function saveInstructions(settings, callback) {
    currentSettings = { ...currentSettings, ...settings };
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set(settings, () => {
        if (callback) callback();
      });
    } else {
      if (callback) callback();
    }
  }

  function openCustomInstructionsModal() {
    const existing = document.querySelector('.ds-instructions-modal-backdrop');
    if (existing) existing.remove();

    const backdrop = document.createElement('div');
    backdrop.className = 'ds-code-modal-backdrop ds-instructions-modal-backdrop';

    const presetCardsHtml = Object.values(PRESETS).map(p => `
      <div class="ds-preset-card ${currentSettings.customInstructionsPreset === p.id ? 'active' : ''}" data-preset-id="${p.id}">
        <div class="ds-preset-card-header">
          <span class="ds-preset-flag">${p.flag}</span>
          <span class="ds-preset-name">${p.title}</span>
        </div>
        <div class="ds-preset-subtitle">${p.subtitle}</div>
      </div>
    `).join('');

    const tagsHtml = QUICK_TAGS.map(t => `
      <button type="button" class="ds-rule-tag-btn" data-insert="${t.insert}">${t.label}</button>
    `).join('');

    backdrop.innerHTML = `
      <div class="ds-code-modal ds-instructions-modal" style="width: 90vw; max-width: 620px;">
        <div class="ds-code-modal-header" style="border-bottom: 1px solid var(--ds-border-dark);">
          <div class="ds-code-modal-title">
            <span style="color: var(--ds-brand-primary); display: inline-flex;">${ICONS.brain}</span>
            <span style="margin-left: 6px;">Persistent Instructions & Memory</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <label class="ds-instructions-toggle-wrap" title="Enable/Disable Custom Instructions">
              <span style="font-size: 12px; font-weight: 500; color: var(--ds-text-secondary);">Active</span>
              <input type="checkbox" id="instEnabledToggle" ${currentSettings.customInstructionsEnabled ? 'checked' : ''} />
              <span class="ds-toggle-slider"></span>
            </label>
            <button type="button" class="ds-code-modal-close-btn" id="instCloseBtn" title="Close (Esc)">✕</button>
          </div>
        </div>

        <div class="ds-instructions-body" style="padding: 16px 20px;">
          <!-- Preset Selector Grid -->
          <label style="display: block; font-size: 12px; font-weight: 600; color: #f8fafc; margin-bottom: 8px;">
            RTL & Architecture Presets
          </label>
          <div class="ds-preset-grid">
            ${presetCardsHtml}
          </div>

          <!-- Quick Rule Tag Injectors -->
          <div style="margin: 14px 0 8px;">
            <label style="display: block; font-size: 12px; font-weight: 600; color: #f8fafc; margin-bottom: 6px;">
              Quick Instruction Rules
            </label>
            <div class="ds-rule-tags-wrap">
              ${tagsHtml}
            </div>
          </div>

          <!-- Custom Instructions Textarea -->
          <div style="margin-top: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <label style="font-size: 12px; font-weight: 600; color: #f8fafc;">System Persona & Instructions Prompt</label>
              <span id="instCharCount" style="font-size: 11px; color: var(--ds-text-muted);">0 chars</span>
            </div>
            <textarea class="ds-instructions-textarea" id="instTextarea" placeholder="Write custom instructions for DeepSeek to remember across all your conversations...">${currentSettings.customInstructionsText}</textarea>
          </div>

          <!-- Actions -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px;">
            <button type="button" class="ds-suite-btn ds-ctx-btn-secondary" id="instResetBtn">
              <span>Reset to Default</span>
            </button>
            <button type="button" class="ds-suite-btn ds-ctx-btn-primary" id="instSaveBtn">
              <span class="ds-suite-btn-icon">${ICONS.check}</span>
              <span>Save & Apply Memory</span>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    void backdrop.offsetWidth;
    backdrop.classList.add('ds-modal-visible');

    const textarea = backdrop.querySelector('#instTextarea');
    const charCount = backdrop.querySelector('#instCharCount');
    const enabledToggle = backdrop.querySelector('#instEnabledToggle');
    const presetCards = backdrop.querySelectorAll('.ds-preset-card');
    const tagBtns = backdrop.querySelectorAll('.ds-rule-tag-btn');
    const saveBtn = backdrop.querySelector('#instSaveBtn');
    const resetBtn = backdrop.querySelector('#instResetBtn');
    const closeBtn = backdrop.querySelector('#instCloseBtn');

    function updateCharCount() {
      const len = (textarea.value || '').length;
      charCount.textContent = `${len.toLocaleString()} chars`;
    }
    updateCharCount();
    textarea.addEventListener('input', updateCharCount);

    // Preset selection
    presetCards.forEach(card => {
      card.addEventListener('click', () => {
        presetCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const pid = card.dataset.presetId;
        currentSettings.customInstructionsPreset = pid;
        if (PRESETS[pid]) {
          textarea.value = PRESETS[pid].text;
          updateCharCount();
        }
      });
    });

    // Tag insertion
    tagBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const textToInsert = btn.dataset.insert;
        if (textarea.value.trim().length > 0) {
          textarea.value += ' ' + textToInsert;
        } else {
          textarea.value = textToInsert;
        }
        updateCharCount();
        textarea.focus();
      });
    });

    // Reset button
    resetBtn.addEventListener('click', () => {
      textarea.value = PRESETS.persian_tech.text;
      presetCards.forEach(c => c.classList.remove('active'));
      const defaultCard = backdrop.querySelector('[data-preset-id="persian_tech"]');
      if (defaultCard) defaultCard.classList.add('active');
      currentSettings.customInstructionsPreset = 'persian_tech';
      updateCharCount();
    });

    // Save button
    saveBtn.addEventListener('click', () => {
      const isEnabled = enabledToggle.checked;
      const text = textarea.value.trim();

      saveInstructions({
        customInstructionsEnabled: isEnabled,
        customInstructionsPreset: currentSettings.customInstructionsPreset,
        customInstructionsText: text
      }, () => {
        showToast(isEnabled ? 'Custom instructions enabled & saved!' : 'Custom instructions saved (disabled)');
        closeModal();
        updatePersonaIndicator();
      });
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

  function updatePersonaIndicator() {
    const existing = document.querySelector('.ds-persona-pill');
    if (!currentSettings.customInstructionsEnabled) {
      if (existing) existing.remove();
      return;
    }

    const presetInfo = PRESETS[currentSettings.customInstructionsPreset] || { title: 'Custom Persona', flag: '🧠' };

    let pill = existing;
    if (!pill) {
      pill = document.createElement('div');
      pill.className = 'ds-persona-pill';

      const promptWrap = document.querySelector('.bf38813a, ._77cefa5, ._3d616d3');
      if (promptWrap) {
        promptWrap.parentNode.insertBefore(pill, promptWrap);
      }
    }

    if (pill) {
      pill.title = `Active Persona: ${presetInfo.title} (Click to customize)`;
      pill.innerHTML = `
        <span class="ds-persona-dot"></span>
        <span style="font-size: 11.5px; font-weight: 600; color: #ffffff;">${presetInfo.flag} ${presetInfo.title}</span>
        <span style="font-size: 10px; color: var(--ds-brand-primary); margin-left: 4px;">Memory Active</span>
      `;
      pill.onclick = openCustomInstructionsModal;
    }
  }

  function ensurePersonaIndicator(root = document) {
    if (currentSettings.customInstructionsEnabled) {
      updatePersonaIndicator();
    }
  }

  // Load initial settings on boot
  loadInstructions(() => {
    updatePersonaIndicator();
  });

  window.DeepSeekOrbit.CustomInstructions = {
    openCustomInstructionsModal,
    ensurePersonaIndicator,
    getSettings: () => currentSettings,
    loadInstructions,
    saveInstructions
  };
})();
