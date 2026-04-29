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
    }, 2200);
  }

  function isDeepSeekGenerating() {
    // Check for stop generation button or streaming indicators
    const stopBtn = document.querySelector('button[aria-label*="Stop"], button[aria-label*="stop"], .ds-stop-button, ._01264cb, svg[viewBox="0 0 16 16"] rect');
    if (stopBtn && stopBtn.offsetParent !== null) return true;

    // Check loading/thinking spinners
    const loadingSpinners = document.querySelectorAll('.ds-loading, .ds-loading-spin, ._0579e0a');
    for (const spin of loadingSpinners) {
      if (spin.offsetParent !== null) return true;
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

      // Insert above the chat input box container
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
      if (promptQueue.length === 0) return;

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
          }, 350);
        }
        renderQueueUI();
      }
    }, 600);
  }

  function attachQueueListener() {
    if (isListening) return;
    const textarea = getTextarea();
    if (!textarea) return;

    isListening = true;

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        const generating = isDeepSeekGenerating();
        if (generating) {
          const text = (textarea.tagName === 'TEXTAREA' ? textarea.value : textarea.innerText || '').trim();
          if (text) {
            e.preventDefault();
            e.stopPropagation();

            promptQueue.push({ id: Date.now(), text: text });
            setPromptValue('');
            renderQueueUI();
            showToast('Prompt queued! Will auto-send when done.');
            startQueueWatcher();
          }
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
