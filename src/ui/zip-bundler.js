/**
 * DeepSeek Orbit — Multi-File Code Project Exporter & Pure JS ZIP Bundler
 * Features: Automatic multi-file code detection, filename resolution, 1-Click ZIP scaffolding
 */
(function () {
  'use strict';

  window.DeepSeekOrbit = window.DeepSeekOrbit || {};
  const ICONS = window.DeepSeekOrbit.ICONS || {};

  /* =========================================================================
     1. PURE VANILLA JS ZIP GENERATOR (PKZIP STANDARD)
     ========================================================================= */

  const CRC_TABLE = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    CRC_TABLE[i] = c;
  }

  function crc32(bytes) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) {
      crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xFF];
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function createZipBlob(files) {
    const textEncoder = new TextEncoder();
    const fileEntries = [];
    let localOffset = 0;

    for (const f of files) {
      const nameBytes = textEncoder.encode(f.name);
      const contentBytes = textEncoder.encode(f.content);
      const fileCrc = crc32(contentBytes);
      const size = contentBytes.length;

      const localHeader = new Uint8Array(30 + nameBytes.length);
      const view = new DataView(localHeader.buffer);

      view.setUint32(0, 0x04034b50, true);
      view.setUint16(4, 20, true);
      view.setUint16(6, 0x0800, true);
      view.setUint16(8, 0, true);
      view.setUint16(10, 0, true);
      view.setUint16(12, 0, true);
      view.setUint32(14, fileCrc, true);
      view.setUint32(18, size, true);
      view.setUint32(22, size, true);
      view.setUint16(26, nameBytes.length, true);
      view.setUint16(28, 0, true);

      localHeader.set(nameBytes, 30);

      fileEntries.push({
        nameBytes,
        contentBytes,
        crc: fileCrc,
        size,
        offset: localOffset,
        localHeader
      });

      localOffset += localHeader.length + contentBytes.length;
    }

    const centralEntries = [];
    let centralSize = 0;

    for (const e of fileEntries) {
      const cdHeader = new Uint8Array(46 + e.nameBytes.length);
      const view = new DataView(cdHeader.buffer);

      view.setUint32(0, 0x02014b50, true);
      view.setUint16(4, 20, true);
      view.setUint16(6, 20, true);
      view.setUint16(8, 0x0800, true);
      view.setUint16(10, 0, true);
      view.setUint16(12, 0, true);
      view.setUint16(14, 0, true);
      view.setUint32(16, e.crc, true);
      view.setUint32(20, e.size, true);
      view.setUint32(24, e.size, true);
      view.setUint16(28, e.nameBytes.length, true);
      view.setUint16(30, 0, true);
      view.setUint16(32, 0, true);
      view.setUint16(34, 0, true);
      view.setUint16(36, 0, true);
      view.setUint32(38, 0, true);
      view.setUint32(42, e.offset, true);

      cdHeader.set(e.nameBytes, 46);
      centralEntries.push(cdHeader);
      centralSize += cdHeader.length;
    }

    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);
    eocdView.setUint32(0, 0x06054b50, true);
    eocdView.setUint16(4, 0, true);
    eocdView.setUint16(6, 0, true);
    eocdView.setUint16(8, fileEntries.length, true);
    eocdView.setUint16(10, fileEntries.length, true);
    eocdView.setUint32(12, centralSize, true);
    eocdView.setUint32(16, localOffset, true);
    eocdView.setUint16(20, 0, true);

    const blobParts = [];
    for (const e of fileEntries) {
      blobParts.push(e.localHeader);
      blobParts.push(e.contentBytes);
    }
    for (const cd of centralEntries) {
      blobParts.push(cd);
    }
    blobParts.push(eocd);

    return new Blob(blobParts, { type: 'application/zip' });
  }

  function downloadBlob(filename, blob) {
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

  /* =========================================================================
     2. MULTI-FILE CODE EXTRACTION & FILENAME DETECTOR
     ========================================================================= */

  function detectFilename(cbEl, preEl, blockIdx, lang = 'txt') {
    // 1. Check previous siblings for headers like "### index.html", "**app.js**", or "1. `style.css`"
    let prev = cbEl.previousElementSibling;
    let attempts = 0;
    while (prev && attempts < 3) {
      const txt = (prev.textContent || '').trim();
      const fnMatch = txt.match(/(?:file(?:name)?|path)?[:\s*#`]*([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]{1,6})[`*:]?/i);
      if (fnMatch && fnMatch[1] && !fnMatch[1].startsWith('http')) {
        return fnMatch[1].replace(/^[#*`\s]+|[#*`\s]+$/g, '');
      }
      prev = prev.previousElementSibling;
      attempts++;
    }

    // 2. Check first line inside code for comment filename (e.g. "// index.js", "<!-- style.css -->")
    const code = preEl.querySelector('code') || preEl;
    const fullCode = code.textContent || '';
    const firstLine = fullCode.split('\n')[0].trim();
    const commentMatch = firstLine.match(/^(?:\/\/|#|\/\*|<!--|--)\s*(?:file(?:name)?[:\s]*)?([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]{1,6})/i);
    if (commentMatch && commentMatch[1]) {
      return commentMatch[1];
    }

    // 3. Fallback based on language syntax
    const cleanLang = (lang || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const langExtMap = {
      'javascript': 'js', 'js': 'js', 'typescript': 'ts', 'ts': 'ts',
      'python': 'py', 'py': 'py', 'html': 'html', 'css': 'css',
      'json': 'json', 'markdown': 'md', 'md': 'md', 'bash': 'sh',
      'sh': 'sh', 'rust': 'rs', 'rs': 'rs', 'go': 'go', 'cpp': 'cpp',
      'c': 'c', 'java': 'java', 'sql': 'sql', 'yaml': 'yml', 'yml': 'yml',
      'vue': 'vue', 'svelte': 'svelte', 'php': 'php', 'ruby': 'rb'
    };
    const ext = langExtMap[cleanLang] || (cleanLang.length > 0 && cleanLang.length <= 4 ? cleanLang : 'txt');
    return `file_${blockIdx + 1}.${ext}`;
  }

  function extractProjectFiles(messageEl) {
    const codeBlocks = Array.from(messageEl.querySelectorAll('.md-code-block, pre'));
    if (codeBlocks.length < 2) return null;

    // Filter unique pre elements
    const validBlocks = [];
    const seenPres = new Set();

    codeBlocks.forEach((cb) => {
      const pre = cb.tagName === 'PRE' ? cb : cb.querySelector('pre');
      if (!pre || seenPres.has(pre)) return;
      seenPres.add(pre);

      const code = pre.querySelector('code') || pre;
      const content = (code.textContent || '').trim();
      if (!content || content.length < 5) return;

      validBlocks.push({ cb, pre, code, content });
    });

    if (validBlocks.length < 2) return null;

    const files = [];
    validBlocks.forEach((item, idx) => {
      let lang = 'code';
      const langSpan = item.cb.querySelector('span, ._121d384');
      if (langSpan && langSpan.textContent) {
        lang = langSpan.textContent.trim().toLowerCase();
      }

      const filename = detectFilename(item.cb, item.pre, idx, lang);
      files.push({
        name: filename,
        content: item.content,
        lang: lang,
        el: item.cb
      });
    });

    return files.length >= 2 ? files : null;
  }

  /* =========================================================================
     3. PROJECT BUNDLE BANNER INJECTION
     ========================================================================= */

  function enhanceMessageWithProjectBundle(messageEl) {
    if (messageEl.querySelector('.ds-project-bundle-banner')) {
      return;
    }

    const files = extractProjectFiles(messageEl);
    if (!files || files.length < 2) return;

    const banner = document.createElement('div');
    banner.className = 'ds-project-bundle-banner';

    const filePillsHtml = files.slice(0, 4).map(f => `<span class="ds-bundle-file-tag">${f.name}</span>`).join('');
    const moreCount = files.length > 4 ? `<span class="ds-bundle-file-tag">+${files.length - 4} more</span>` : '';

    banner.innerHTML = `
      <div class="ds-bundle-banner-left">
        <div class="ds-bundle-icon-wrap">${ICONS.zip}</div>
        <div class="ds-bundle-info">
          <div class="ds-bundle-title">Multi-File Project Scaffold (${files.length} files)</div>
          <div class="ds-bundle-file-tags">${filePillsHtml}${moreCount}</div>
        </div>
      </div>
      <button type="button" class="ds-suite-btn ds-bundle-download-btn" title="Download all project files as a ZIP archive">
        <span class="ds-suite-btn-icon">${ICONS.upload}</span>
        <span>Download .ZIP</span>
      </button>
    `;

    const downloadBtn = banner.querySelector('.ds-bundle-download-btn');
    downloadBtn.addEventListener('click', () => {
      const zipBlob = createZipBlob(files);
      const titleEl = document.querySelector('._81e7b5e._19d617c ._72b6158, title');
      const chatTitle = (titleEl ? titleEl.textContent : 'deepseek_project')
        .replace(/[\\/:*?"<>|]/g, '-').trim() || 'project';
      downloadBlob(`${chatTitle}_bundle_${Date.now()}.zip`, zipBlob);

      const origText = downloadBtn.querySelector('span:last-child').textContent;
      downloadBtn.querySelector('span:last-child').textContent = 'Downloaded!';
      setTimeout(() => {
        downloadBtn.querySelector('span:last-child').textContent = origText;
      }, 2200);
    });

    // Mount banner before the first code block or at top of message
    const firstCode = messageEl.querySelector('.md-code-block, pre');
    if (firstCode) {
      firstCode.parentNode.insertBefore(banner, firstCode);
    } else {
      messageEl.insertBefore(banner, messageEl.firstChild);
    }
  }

  function enhanceMultiFileProjects(root = document) {
    const messages = root.querySelectorAll('.ds-markdown, [data-virtual-list-item-key] .ds-markdown, ._63c77b1');
    messages.forEach(msg => {
      try {
        enhanceMessageWithProjectBundle(msg);
      } catch (err) {}
    });
  }

  window.DeepSeekOrbit.ZipBundler = {
    createZipBlob,
    downloadBlob,
    enhanceMultiFileProjects
  };
})();
