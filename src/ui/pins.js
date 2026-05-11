/**
 * DeepSeek Orbit — Message Bookmarking & Pin Drawer
 */
(function () {
  'use strict';

  window.DeepSeekOrbit = window.DeepSeekOrbit || {};
  const ICONS = window.DeepSeekOrbit.ICONS || {};

  let bookmarkedMessages = [];

  function loadBookmarks(callback) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get({ bookmarkedMessages: [] }, (res) => {
        bookmarkedMessages = res.bookmarkedMessages || [];
        if (callback) callback(bookmarkedMessages);
      });
    } else {
      if (callback) callback(bookmarkedMessages);
    }
  }

  function saveBookmarks() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ bookmarkedMessages });
    }
  }

  function getMessageStableId(msgEl) {
    if (!msgEl) return 'msg-' + Date.now();
    if (msgEl.dataset.dsMsgId) return msgEl.dataset.dsMsgId;

    const rawText = (msgEl.textContent || '').trim().substring(0, 80);
    let hash = 0;
    for (let i = 0; i < rawText.length; i++) {
      hash = (hash << 5) - hash + rawText.charCodeAt(i);
      hash |= 0;
    }
    const stableId = 'msg-' + Math.abs(hash);
    msgEl.dataset.dsMsgId = stableId;
    return stableId;
  }

  function getMessageContentForPin(msgEl) {
    if (!msgEl) return '';
    const clone = msgEl.cloneNode(true);
    clone.querySelectorAll('.ds-export-toolbar, .ds-pin-btn, button, .ds-line-numbers-gutter').forEach(el => el.remove());
    return (clone.textContent || '').trim();
  }

  function handlePinButtonClick(btn) {
    const msg = btn.closest('._9663006, [data-virtual-list-item-key], .ds-message') || btn.parentElement.parentElement;
    if (!msg) return;

    const msgId = getMessageStableId(msg);
    const existingIndex = bookmarkedMessages.findIndex(b => b.id === msgId);

    if (existingIndex !== -1) {
      bookmarkedMessages.splice(existingIndex, 1);
      btn.classList.remove('pinned');
      btn.title = 'Pin message';
    } else {
      const fullText = getMessageContentForPin(msg);
      const isAssistant = !msg.querySelector('._11d6b3a') && (msg.querySelector('.ds-markdown') || msg.classList.contains('_9663006'));
      const role = isAssistant ? 'DeepSeek' : 'User';

      bookmarkedMessages.push({
        id: msgId,
        role: role,
        preview: fullText.substring(0, 160) + (fullText.length > 160 ? '...' : ''),
        timestamp: Date.now()
      });
      btn.classList.add('pinned');
      btn.title = 'Unpin message';
    }

    saveBookmarks();
    updatePinButtonsState();
  }

  function updatePinButtonsState() {
    const pinBtns = document.querySelectorAll('.ds-pin-btn');
    pinBtns.forEach(btn => {
      const msgId = btn.dataset.msgId;
      const isPinned = bookmarkedMessages.some(b => b.id === msgId);
      btn.classList.toggle('pinned', isPinned);
      btn.title = isPinned ? 'Unpin message' : 'Pin message';
    });
  }

  function enhanceMessagePinButtons(root = document) {
    const actionBars = root.querySelectorAll('._78e0558, ._965abe9');
    actionBars.forEach((actionsBar) => {
      const msg = actionsBar.closest('._9663006, [data-virtual-list-item-key], .ds-message') || actionsBar.parentElement;
      if (!msg) return;

      const msgId = getMessageStableId(msg);
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
            ${ICONS.pin}
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
        scrollToTopBtn.title = 'Scroll to top of message';
        scrollToTopBtn.innerHTML = `
          <div class="ds-button__background"></div>
          <div class="ds-button__icon ds-button__icon--last-child">
            <div class="ds-icon" style="font-size: inherit;">
              ${ICONS.arrowUp}
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

  function openPinsDrawer() {
    const existing = document.querySelector('.ds-nav-drawer-backdrop');
    if (existing) {
      existing.remove();
      return;
    }

    const backdrop = document.createElement('div');
    backdrop.className = 'ds-nav-drawer-backdrop';
    backdrop.innerHTML = `
      <div class="ds-nav-drawer">
        <div class="ds-nav-drawer-header">
          <div class="ds-nav-drawer-title">
            <span>${ICONS.pinFilled}</span> <span>Pinned Messages</span>
          </div>
          <button type="button" class="ds-code-modal-close-btn" id="drawerCloseBtn" title="Close (Esc)">✕</button>
        </div>
        <div class="ds-nav-drawer-content" id="pinsListContainer"></div>
      </div>
    `;

    document.body.appendChild(backdrop);
    void backdrop.offsetWidth;
    backdrop.classList.add('ds-drawer-visible');

    const container = backdrop.querySelector('#pinsListContainer');
    renderPinsDrawerList(container);

    let isClosing = false;
    const closeDrawer = () => {
      if (isClosing) return;
      isClosing = true;
      backdrop.classList.remove('ds-drawer-visible');
      document.removeEventListener('keydown', escHandler);
      setTimeout(() => {
        if (backdrop.parentNode) backdrop.remove();
      }, 240);
    };

    backdrop.querySelector('#drawerCloseBtn').addEventListener('click', closeDrawer);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeDrawer();
    });

    const escHandler = (e) => {
      if (e.key === 'Escape') closeDrawer();
    };
    document.addEventListener('keydown', escHandler);
  }

  function renderPinsDrawerList(container) {
    if (!container) return;
    if (bookmarkedMessages.length === 0) {
      container.innerHTML = `
        <div class="ds-pins-empty">
          <div style="font-size: 28px; opacity: 0.4; margin-bottom: 8px;">${ICONS.pin}</div>
          <div style="font-weight: 600; color: #fff; margin-bottom: 4px;">No pinned messages yet</div>
          <div style="font-size: 12px; color: var(--ds-text-secondary);">Click the pin icon on any message to save it here.</div>
        </div>
      `;
      return;
    }

    let html = '<div class="ds-pins-list">';
    bookmarkedMessages.forEach(b => {
      html += `
        <div class="ds-pin-card" data-msg-id="${b.id}">
          <div class="ds-pin-card-header">
            <span class="ds-pin-card-role ${b.role === 'User' ? 'user' : 'assistant'}">${b.role}</span>
            <button type="button" class="ds-pin-card-delete" data-del-id="${b.id}" title="Remove Pin">${ICONS.trash}</button>
          </div>
          <div class="ds-pin-card-text">${escapeHtml(b.preview)}</div>
        </div>
      `;
    });
    html += '</div>';
    container.innerHTML = html;

    container.querySelectorAll('.ds-pin-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.ds-pin-card-delete')) return;
        jumpToPinnedMessage(card.dataset.msgId);
      });
    });

    container.querySelectorAll('.ds-pin-card-delete').forEach(delBtn => {
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = delBtn.dataset.delId;
        bookmarkedMessages = bookmarkedMessages.filter(b => b.id !== id);
        saveBookmarks();
        updatePinButtonsState();
        renderPinsDrawerList(container);
      });
    });
  }

  function jumpToPinnedMessage(msgId) {
    const msg = document.querySelector(`[data-ds-msg-id="${msgId}"]`);
    if (msg) {
      msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
      msg.classList.add('ds-msg-highlight');
      setTimeout(() => msg.classList.remove('ds-msg-highlight'), 1800);
      const backdrop = document.querySelector('.ds-nav-drawer-backdrop');
      if (backdrop) backdrop.remove();
    }
  }

  function escapeHtml(str) {
    return (str || '').replace(/[&<>"']/g, (m) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[m]));
  }

  window.DeepSeekOrbit.Pins = {
    loadBookmarks,
    saveBookmarks,
    enhanceMessagePinButtons,
    openPinsDrawer,
    updatePinButtonsState
  };
})();
