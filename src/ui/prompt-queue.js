/**
 * DeepSeek Orbit — Smart Prompt Queue (Auto-Submit)
 * Features: Queue prompts while DeepSeek is generating, floating queue bar, auto-send on finish
 */
(function () {
  'use strict';

  window.DeepSeekOrbit = window.DeepSeekOrbit || {};
  const ICONS = window.DeepSeekOrbit.ICONS || {};

  let promptQueue = [];
  let isListening = false;
  let pollTimer = null;

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
    }, 2400);
  }

  function isDeepSeekGenerating() {
    // 1. Check prompt bar for Stop button (or rect stop square icon)
    const promptContainer = document.querySelector('.bf38813a, ._77cefa5, ._3d616d3, ._020ab5b, form');
    if (promptContainer) {
      const stopElements = promptContainer.querySelectorAll(
        'button[aria-label*="Stop"], button[aria-label*="stop"], button[aria-label*="停止"], .ds-stop-button, button rect, div[role="button"] rect'
      );
      for (const el of stopElements) {
        if (el.offsetParent !== null || el.closest('button')?.offsetParent !== null) {
          return true;
        }
      }
    }

    // 2. Check for active streaming indicators in the chat
    const streamingElements = document.querySelectorAll(
      '.ds-loading-spin, .result-streaming, .ds-markdown-streaming, [class*="streaming"], ._0579e0a, .ds-loading'
    );
    for (const el of streamingElements) {
      if (el.offsetParent !== null) return true;
    }

    return false;
  }

  function getTextarea() {
    return document.querySelector('textarea, [contenteditable="true"]');
  }

  function getSendButton() {
    return document.querySelector('button[aria-label*="Send"], button[aria-label*="send"], ._52c986b, ._0a3d93b button, .bf38813a button:last-child');
  }

  function setPromptValue(text) {
    const textarea = getTextarea();
    if (!textarea) return;

    if (textarea.tagName === 'TEXTAREA') {
      textarea.value = text;
      textarea.focus();
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      textarea.innerText = text;
      textarea.focus();
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function submitCurrentPrompt() {
    const sendBtn = getSendButton();
    const textarea = getTextarea();

    if (sendBtn && !sendBtn.disabled) {
      sendBtn.click();
      return true;
    } else if (textarea) {
      const enterEvt = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true
      });
      textarea.dispatchEvent(enterEvt);
      return true;
    }
    return false;
  }

  function renderQueueUI() {
    let bar = document.querySelector('.ds-prompt-queue-bar');

    if (promptQueue.length === 0) {
      if (bar) bar.remove();
      return;
    }

    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'ds-prompt-queue-bar';

      const inputWrap = document.querySelector('._77cefa5, ._3d616d3, ._020ab5b, .bf38813a')?.closest('div[class*="chat"], form, div') || document.querySelector('.bf38813a')?.parentElement;
      if (inputWrap) {
        inputWrap.parentNode.insertBefore(bar, inputWrap);
      } else {
        document.body.appendChild(bar);
      }
    }

    const currentItem = promptQueue[0];
    const preview = currentItem.text.length > 50 ? currentItem.text.substring(0, 50) + '...' : currentItem.text;

    bar.innerHTML = `
      <div class="ds-queue-left">
        <span class="ds-queue-icon">${ICONS.queue}</span>
        <span class="ds-queue-label">Queued (${promptQueue.length}):</span>
        <span class="ds-queue-preview">"${preview}"</span>
      </div>
      <div class="ds-queue-actions">
        <button type="button" class="ds-queue-btn ds-queue-edit-btn" title="Edit queued prompt">Edit</button>
        <button type="button" class="ds-queue-btn ds-queue-cancel-btn" title="Cancel queued prompt">Cancel</button>
      </div>
    `;

    const editBtn = bar.querySelector('.ds-queue-edit-btn');
    const cancelBtn = bar.querySelector('.ds-queue-cancel-btn');

    editBtn.addEventListener('click', () => {
      const item = promptQueue.shift();
      if (item) {
        setPromptValue(item.text);
      }
      renderQueueUI();
    });

    cancelBtn.addEventListener('click', () => {
      promptQueue.shift();
      showToast('Queued prompt cancelled');
      renderQueueUI();
    });
  }

  function startQueueWatcher() {
    if (pollTimer) clearInterval(pollTimer);

    pollTimer = setInterval(() => {
      if (promptQueue.length === 0) {
        clearInterval(pollTimer);
        pollTimer = null;
        return;
      }

      const generating = isDeepSeekGenerating();
      if (!generating) {
        const nextItem = promptQueue.shift();
        if (nextItem) {
          setPromptValue(nextItem.text);
          setTimeout(() => {
            const ok = submitCurrentPrompt();
            if (ok) {
              showToast('Auto-submitted queued prompt!');
            }
          }, 400);
        }
        renderQueueUI();
      }
    }, 500);
  }

  function attachQueueListener() {
    if (isListening) return;
    isListening = true;

    // Use Capture phase on document to guarantee interception before DeepSeek
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        const target = e.target;
        if (target && (target.tagName === 'TEXTAREA' || target.getAttribute('contenteditable') === 'true' || target.closest('.bf38813a, ._77cefa5, ._3d616d3'))) {
          if (isDeepSeekGenerating()) {
            const text = (target.tagName === 'TEXTAREA' ? target.value : target.innerText || '').trim();
            if (text) {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();

              promptQueue.push({ id: Date.now(), text: text });
              setPromptValue('');
              renderQueueUI();
              showToast('Prompt queued! Will auto-send when response finishes.');
              startQueueWatcher();
            }
          }
        }
      }
    }, true);

    // Also intercept click on Send button during generation
    document.addEventListener('click', (e) => {
      const sendBtn = e.target.closest('button[aria-label*="Send"], button[aria-label*="send"], ._52c986b, .bf38813a button:last-child');
      if (sendBtn && isDeepSeekGenerating()) {
        const textarea = getTextarea();
        const text = (textarea ? (textarea.tagName === 'TEXTAREA' ? textarea.value : textarea.innerText || '') : '').trim();
        if (text) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          promptQueue.push({ id: Date.now(), text: text });
          setPromptValue('');
          renderQueueUI();
          showToast('Prompt queued! Will auto-send when response finishes.');
          startQueueWatcher();
        }
      }
    }, true);
  }

  function initPromptQueue(root = document) {
    attachQueueListener();
  }

  window.DeepSeekOrbit.PromptQueue = {
    initPromptQueue,
    getQueue: () => promptQueue
  };
})();
