/**
 * DeepSeek Orbit — In-Chat Keyword Search Engine
 */
(function () {
  'use strict';

  window.DeepSeekOrbit = window.DeepSeekOrbit || {};

  let searchMatches = [];
  let currentSearchIndex = -1;

  function clearSearchHighlights() {
    document.querySelectorAll('.ds-search-highlight').forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
        parent.normalize();
      }
    });
    searchMatches = [];
    currentSearchIndex = -1;
    updateSearchCounter();
  }

  function updateSearchCounter() {
    const counter = document.getElementById('dsSearchCount');
    if (!counter) return;
    if (searchMatches.length === 0) {
      counter.textContent = '0 / 0';
    } else {
      counter.textContent = `${currentSearchIndex + 1} / ${searchMatches.length}`;
    }
  }

  function highlightKeywords(query) {
    clearSearchHighlights();
    const cleanQuery = (query || '').trim().toLowerCase();
    if (!cleanQuery) return;

    const messageNodes = document.querySelectorAll('.ds-markdown, .ds-message, ._9663006');
    messageNodes.forEach((container) => {
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
          if (node.parentElement && (node.parentElement.closest('pre') || node.parentElement.closest('.ds-export-toolbar'))) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      });

      const textNodes = [];
      while (walker.nextNode()) textNodes.push(walker.currentNode);

      textNodes.forEach((node) => {
        const text = node.textContent;
        const lowerText = text.toLowerCase();
        let startIndex = 0;
        let index = lowerText.indexOf(cleanQuery, startIndex);

        if (index === -1) return;

        const fragment = document.createDocumentFragment();
        while (index !== -1) {
          if (index > startIndex) {
            fragment.appendChild(document.createTextNode(text.substring(startIndex, index)));
          }

          const mark = document.createElement('mark');
          mark.className = 'ds-search-highlight';
          mark.textContent = text.substring(index, index + cleanQuery.length);
          fragment.appendChild(mark);
          searchMatches.push(mark);

          startIndex = index + cleanQuery.length;
          index = lowerText.indexOf(cleanQuery, startIndex);
        }

        if (startIndex < text.length) {
          fragment.appendChild(document.createTextNode(text.substring(startIndex)));
        }

        if (node.parentNode) {
          node.parentNode.replaceChild(fragment, node);
        }
      });
    });

    if (searchMatches.length > 0) {
      currentSearchIndex = 0;
      focusMatch(0);
    }
    updateSearchCounter();
  }

  function focusMatch(index) {
    if (index < 0 || index >= searchMatches.length) return;
    searchMatches.forEach((m, idx) => {
      m.classList.toggle('current', idx === index);
    });
    const target = searchMatches[index];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    updateSearchCounter();
  }

  function nextSearchMatch() {
    if (searchMatches.length === 0) return;
    currentSearchIndex = (currentSearchIndex + 1) % searchMatches.length;
    focusMatch(currentSearchIndex);
  }

  function prevSearchMatch() {
    if (searchMatches.length === 0) return;
    currentSearchIndex = (currentSearchIndex - 1 + searchMatches.length) % searchMatches.length;
    focusMatch(currentSearchIndex);
  }

  function openSearchBar() {
    const wrap = document.getElementById('dsSearchInlineWrap');
    const input = document.getElementById('dsSearchInput');
    const searchBtn = document.getElementById('dsToolbarSearchBtn');
    if (!wrap || !input) return;

    wrap.classList.add('active');
    if (searchBtn) searchBtn.classList.add('active');
    input.focus();
    input.select();
  }

  function closeSearchBar() {
    const wrap = document.getElementById('dsSearchInlineWrap');
    const input = document.getElementById('dsSearchInput');
    const searchBtn = document.getElementById('dsToolbarSearchBtn');
    if (!wrap || !input) return;

    wrap.classList.remove('active');
    if (searchBtn) searchBtn.classList.remove('active');
    input.value = '';
    clearSearchHighlights();
  }

  function toggleSearchBar() {
    const wrap = document.getElementById('dsSearchInlineWrap');
    if (!wrap) return;
    if (wrap.classList.contains('active')) closeSearchBar();
    else openSearchBar();
  }

  window.DeepSeekOrbit.Search = {
    highlightKeywords,
    clearSearchHighlights,
    nextSearchMatch,
    prevSearchMatch,
    openSearchBar,
    closeSearchBar,
    toggleSearchBar
  };
})();
