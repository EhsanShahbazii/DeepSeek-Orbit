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

  // CRC32 Table
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

    // Process each file
    for (const f of files) {
      const nameBytes = textEncoder.encode(f.name);
      const contentBytes = textEncoder.encode(f.content);
      const fileCrc = crc32(contentBytes);
      const size = contentBytes.length;

      // Local File Header (30 bytes + name + content)
      const localHeader = new Uint8Array(30 + nameBytes.length);
      const view = new DataView(localHeader.buffer);

      view.setUint32(0, 0x04034b50, true); // Local file header signature
      view.setUint16(4, 20, true);         // Version needed to extract (2.0)
      view.setUint16(6, 0x0800, true);     // General purpose bit flag (UTF-8)
      view.setUint16(8, 0, true);          // Compression method: 0 (Stored)
      view.setUint16(10, 0, true);         // File last mod time
      view.setUint16(12, 0, true);         // File last mod date
      view.setUint32(14, fileCrc, true);   // CRC-32
      view.setUint32(18, size, true);      // Compressed size
      view.setUint32(22, size, true);      // Uncompressed size
      view.setUint16(26, nameBytes.length, true); // File name length
      view.setUint16(28, 0, true);         // Extra field length

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

    // Build Central Directory
    const centralEntries = [];
    let centralSize = 0;

    for (const e of fileEntries) {
      const cdHeader = new Uint8Array(46 + e.nameBytes.length);
      const view = new DataView(cdHeader.buffer);

      view.setUint32(0, 0x02014b50, true); // Central directory signature
      view.setUint16(4, 20, true);         // Version made by
      view.setUint16(6, 20, true);         // Version needed to extract
      view.setUint16(8, 0x0800, true);     // Bit flag (UTF-8)
      view.setUint16(10, 0, true);         // Compression method: 0
      view.setUint16(12, 0, true);         // Mod time
      view.setUint16(14, 0, true);         // Mod date
      view.setUint32(16, e.crc, true);     // CRC-32
      view.setUint32(20, e.size, true);    // Compressed size
      view.setUint32(24, e.size, true);    // Uncompressed size
      view.setUint16(28, e.nameBytes.length, true); // Name length
      view.setUint16(30, 0, true);         // Extra field length
      view.setUint16(32, 0, true);         // Comment length
      view.setUint16(34, 0, true);         // Disk number start
      view.setUint16(36, 0, true);         // Internal file attributes
      view.setUint32(38, 0, true);         // External file attributes
      view.setUint32(42, e.offset, true);  // Relative offset of local header

      cdHeader.set(e.nameBytes, 46);
      centralEntries.push(cdHeader);
      centralSize += cdHeader.length;
    }

    // End of Central Directory Record (22 bytes)
    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);
    eocdView.setUint32(0, 0x06054b50, true); // Signature
    eocdView.setUint16(4, 0, true);          // Disk number
    eocdView.setUint16(6, 0, true);          // Disk with central dir
    eocdView.setUint16(8, fileEntries.length, true);  // Total entries on disk
    eocdView.setUint16(10, fileEntries.length, true); // Total entries
    eocdView.setUint32(12, centralSize, true);        // Size of central directory
    eocdView.setUint32(16, localOffset, true);        // Offset of central directory
    eocdView.setUint16(20, 0, true);         // Comment length

    // Assemble full ZIP blob parts
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

  function detectFilename(codeEl, blockIdx, lang = 'txt') {
    // 1. Check previous siblings for headers like "### index.html" or "**app.js**"
    let prev = codeEl.closest('pre') ? codeEl.closest('pre').previousElementSibling : null;
    while (prev && (prev.tagName === 'P' || prev.tagName.startsWith('H') || prev.tagName === 'DIV')) {
      const txt = (prev.textContent || '').trim();
      const fnMatch = txt.match(/(?:file|filename|path)?[:\s*#]*([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]{1,6})[*:]?/i);
      if (fnMatch && fnMatch[1]) {
        return fnMatch[1].replace(/^[#*\s]+|[#*\s]+$/g, '');
      }
      prev = prev.previousElementSibling;
      break;
    }

    // 2. Check first line inside code for comments (e.g. "// index.js", "<!-- style.css -->")
    const fullCode = codeEl.textContent || '';
    const firstLine = fullCode.split('\n')[0].trim();
    const commentMatch = firstLine.match(/^(?:\/\/|#|\/\*|<!--|--)\s*(?:file(?:name)?[:\s]*)?([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]{1,6})/i);
    if (commentMatch && commentMatch[1]) {
      return commentMatch[1];
    }

    // 3. Fallback based on language syntax
    const langExtMap = {
      'javascript': 'js', 'js': 'js', 'typescript': 'ts', 'ts': 'ts',
      'python': 'py', 'py': 'py', 'html': 'html', 'css': 'css',
      'json': 'json', 'markdown': 'md', 'md': 'md', 'bash': 'sh',
      'sh': 'sh', 'rust': 'rs', 'rs': 'rs', 'go': 'go', 'cpp': 'cpp',
      'c': 'c', 'java': 'java', 'sql': 'sql', 'yaml': 'yml', 'yml': 'yml'
    };
    const ext = langExtMap[lang.toLowerCase()] || (lang.length < 5 ? lang.toLowerCase() : 'txt');
    return `file_${blockIdx + 1}.${ext}`;
  }

  function extractProjectFiles(messageEl) {
    const codeBlocks = messageEl.querySelectorAll('pre code, .ds-markdown pre code');
    if (codeBlocks.length < 2) return null;

    const files = [];
    codeBlocks.forEach((codeEl, idx) => {
      // Determine language
      let lang = 'code';
      const classAttr = codeEl.getAttribute('class') || '';
      const langMatch = classAttr.match(/language-([a-zA-Z0-9_-]+)/);
      if (langMatch) lang = langMatch[1];

      const content = codeEl.textContent || '';
      if (!content.trim()) return;

      const filename = detectFilename(codeEl, idx, lang);
      files.push({
        name: filename,
        content: content,
        lang: lang,
        el: codeEl
      });
    });

    return files.length >= 2 ? files : null;
  }

  /* =========================================================================
     3. PROJECT BUNDLE BANNER INJECTION
     ========================================================================= */

  function enhanceMessageWithProjectBundle(messageEl) {
    if (messageEl.dataset.dsProjectEnhanced === 'true') return;
    if (messageEl.querySelector('.ds-project-bundle-banner')) return;

    const files = extractProjectFiles(messageEl);
    if (!files || files.length < 2) return;

    messageEl.dataset.dsProjectEnhanced = 'true';

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
      const chatTitle = (document.querySelector('._81e7b5e._19d617c ._72b6158, title') ? document.querySelector('._81e7b5e._19d617c ._72b6158, title').textContent : 'deepseek_project')
        .replace(/[\\/:*?"<>|]/g, '-').trim() || 'project';
      downloadBlob(`${chatTitle}_bundle_${Date.now()}.zip`, zipBlob);

      const origText = downloadBtn.querySelector('span:last-child').textContent;
      downloadBtn.querySelector('span:last-child').textContent = 'Downloaded!';
      setTimeout(() => {
        downloadBtn.querySelector('span:last-child').textContent = origText;
      }, 2200);
    });

    // Mount banner at the top of message
    messageEl.insertBefore(banner, messageEl.firstChild);
  }

  function enhanceMultiFileProjects(root = document) {
    const messages = root.querySelectorAll('.ds-markdown, [data-virtual-list-item-key] .ds-markdown');
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
