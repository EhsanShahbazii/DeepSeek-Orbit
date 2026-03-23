/**
 * DeepSeek Orbit — Context Ingestion Engine (Local Folder, GitHub Repo, Web Scraper)
 */
(function () {
  'use strict';

  window.DeepSeekOrbit = window.DeepSeekOrbit || {};
  const ICONS = window.DeepSeekOrbit.ICONS || {};

  const IGNORED_DIRS = new Set([
    'node_modules', '.git', '.svn', '.hg', 'dist', 'build', '.next', '.nuxt',
    '__pycache__', '.pytest_cache', '.vscode', '.idea', 'coverage', '.cache',
    'target', 'vendor', 'bin', 'obj', '.bundle', '.gradle'
  ]);

  const IGNORED_FILES = new Set([
    '.DS_Store', 'Thumbs.db', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
    'Cargo.lock', 'poetry.lock', 'composer.lock', 'Gemfile.lock'
  ]);

  const BINARY_EXTS = new Set([
    'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'svg', 'pdf', 'zip', 'tar', 'gz', '7z', 'rar',
    'mp4', 'webm', 'mov', 'avi', 'mp3', 'wav', 'ogg', 'exe', 'bin', 'so', 'dylib', 'dll',
    'woff', 'woff2', 'ttf', 'eot', 'otf', 'pyc', 'class', 'jar', 'apk', 'dmg', 'iso'
  ]);

  const MAX_FILE_SIZE = 100 * 1024; // 100 KB limit per file to avoid token bloat

  function getFileExtension(filename) {
    const parts = (filename || '').split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  }

  function isTextFile(filename) {
    const ext = getFileExtension(filename);
    if (BINARY_EXTS.has(ext)) return false;
    if (IGNORED_FILES.has(filename)) return false;
    return true;
  }

  function estimateTokens(text) {
    if (!text) return 0;
    // Fast estimation: ~4 chars per token for code & English
    return Math.round(text.length / 3.8);
  }

  /* =========================================================================
     1. LOCAL FOLDER INGESTION ENGINE
     ========================================================================= */

  async function parseLocalDirectoryWithPicker(onProgress) {
    if (!('showDirectoryPicker' in window)) {
      throw new Error('File System Access API not supported in this browser.');
    }

    const dirHandle = await window.showDirectoryPicker({ mode: 'read' });
    const files = [];
    const treeLines = [];

    async function traverse(handle, path = '', depth = 0) {
      const indent = '  '.repeat(depth);
      treeLines.push(`${indent}├── ${handle.name}${handle.kind === 'directory' ? '/' : ''}`);

      if (handle.kind === 'directory') {
        if (IGNORED_DIRS.has(handle.name)) return;

        for await (const entry of handle.values()) {
          const entryPath = path ? `${path}/${entry.name}` : entry.name;
          if (entry.kind === 'directory') {
            await traverse(entry, entryPath, depth + 1);
          } else if (entry.kind === 'file') {
            if (isTextFile(entry.name)) {
              try {
                const file = await entry.getFile();
                if (file.size <= MAX_FILE_SIZE) {
                  const content = await file.text();
                  files.push({
                    path: entryPath,
                    name: entry.name,
                    size: file.size,
                    content: content
                  });
                  if (onProgress) onProgress(files.length, entryPath);
                }
              } catch (err) {
                console.warn('Could not read file:', entryPath, err);
              }
            }
          }
        }
      }
    }

    await traverse(dirHandle, dirHandle.name, 0);

    return {
      name: dirHandle.name,
      tree: treeLines.join('\n'),
      files: files
    };
  }

  async function parseLocalDirectoryWithInput(fileList, onProgress) {
    const files = [];
    const treeMap = {};

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const relPath = file.webkitRelativePath || file.name;
      const parts = relPath.split('/');

      // Check ignored dirs
      const isIgnored = parts.some(part => IGNORED_DIRS.has(part));
      if (isIgnored) continue;

      if (isTextFile(file.name) && file.size <= MAX_FILE_SIZE) {
        try {
          const content = await file.text();
          files.push({
            path: relPath,
            name: file.name,
            size: file.size,
            content: content
          });
          if (onProgress) onProgress(files.length, relPath);
        } catch (e) {}
      }
    }

    const rootName = fileList[0] && fileList[0].webkitRelativePath ? fileList[0].webkitRelativePath.split('/')[0] : 'Project';
    const tree = files.map(f => `├── ${f.path}`).join('\n');

    return {
      name: rootName,
      tree: tree,
      files: files
    };
  }

  /* =========================================================================
     2. GITHUB REPOSITORY INGESTION ENGINE
     ========================================================================= */

  function parseGitHubUrl(url) {
    const clean = (url || '').trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '');
    const parts = clean.split('/');
    if (parts.length >= 2) {
      return {
        owner: parts[0],
        repo: parts[1],
        branch: parts[3] || 'main',
        subpath: parts.slice(4).join('/')
      };
    }
    return null;
  }

  async function fetchGitHubRepository(repoInput, token, onProgress) {
    const parsed = parseGitHubUrl(repoInput);
    if (!parsed) {
      throw new Error('Invalid GitHub repository format. Use owner/repo or full GitHub URL.');
    }

    const headers = { 'Accept': 'application/vnd.github.v3+json' };
    if (token) headers['Authorization'] = `token ${token}`;

    // Get default branch if not specified
    let branch = parsed.branch;
    const repoRes = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, { headers });
    if (!repoRes.ok) {
      if (repoRes.status === 404) throw new Error('Repository not found or private (add GitHub Token below).');
      if (repoRes.status === 403) throw new Error('GitHub API rate limit exceeded. Please provide a Personal Access Token.');
      throw new Error(`GitHub API error: ${repoRes.statusText}`);
    }
    const repoInfo = await repoRes.json();
    if (!parsed.branch || parsed.branch === 'main') {
      branch = repoInfo.default_branch || 'main';
    }

    // Fetch repository Git tree recursively
    const treeRes = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${branch}?recursive=1`, { headers });
    if (!treeRes.ok) throw new Error(`Failed to fetch tree: ${treeRes.statusText}`);
    const treeData = await treeRes.json();

    const candidateFiles = (treeData.tree || []).filter(item => {
      if (item.type !== 'blob') return false;
      const parts = item.path.split('/');
      if (parts.some(p => IGNORED_DIRS.has(p))) return false;
      if (parsed.subpath && !item.path.startsWith(parsed.subpath)) return false;
      return isTextFile(item.path);
    });

    if (candidateFiles.length === 0) {
      throw new Error('No matching text or code files found in repository.');
    }

    const files = [];
    const treeLines = candidateFiles.map(f => `├── ${f.path}`).join('\n');

    // Fetch files in batches of 6
    const BATCH_SIZE = 6;
    for (let i = 0; i < candidateFiles.length; i += BATCH_SIZE) {
      const batch = candidateFiles.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (item) => {
        try {
          const rawUrl = `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${branch}/${item.path}`;
          const fileRes = await fetch(rawUrl, { headers });
          if (fileRes.ok) {
            const content = await fileRes.text();
            if (content.length <= MAX_FILE_SIZE) {
              files.push({
                path: item.path,
                name: item.path.split('/').pop(),
                size: item.size || content.length,
                content: content
              });
              if (onProgress) onProgress(files.length, item.path, candidateFiles.length);
            }
          }
        } catch (err) {}
      }));
    }

    return {
      name: `${parsed.owner}/${parsed.repo}`,
      branch: branch,
      tree: treeLines,
      files: files
    };
  }

  /* =========================================================================
     3. WEB PAGE / ARTICLE INGESTION ENGINE
     ========================================================================= */

  async function fetchWebPageMarkdown(url) {
    let targetUrl = (url || '').trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    const res = await fetch(targetUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch webpage.`);
    const htmlText = await res.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    // Strip unneeded elements
    const unneeded = doc.querySelectorAll('script, style, noscript, nav, footer, header, aside, iframe, svg, form');
    unneeded.forEach(el => el.remove());

    const title = doc.title || targetUrl;
    const bodyContent = doc.body ? (doc.body.innerText || doc.body.textContent || '').trim() : '';
    const cleanText = bodyContent.replace(/\n{3,}/g, '\n\n');

    return {
      title: title,
      url: targetUrl,
      content: cleanText.substring(0, 120000) // 120k char cap
    };
  }

  /* =========================================================================
     4. FORMATTING & INSERTION HELPERS
     ========================================================================= */

  function formatContextMarkdown(data, type = 'folder') {
    if (type === 'web') {
      return `### 🌐 Web Context: [${data.title}](${data.url})\n\n\`\`\`markdown\n${data.content}\n\`\`\`\n\n---\n*Please analyze the above webpage content and assist with:* `;
    }

    let md = `# 📁 Context: ${data.name}\n\n`;
    md += `## 🌳 Project Tree\n\`\`\`\n${data.name}/\n${data.tree}\n\`\`\`\n\n`;
    md += `## 📄 Source Files (${data.files.length} files)\n\n`;

    data.files.forEach(f => {
      const ext = getFileExtension(f.name);
      md += `### \`${f.path}\`\n\`\`\`${ext}\n${f.content}\n\`\`\`\n\n`;
    });

    md += `---\n*Please analyze the above codebase structure and implementation, and assist with:* `;
    return md;
  }

  function insertIntoPromptTextarea(text) {
    const textarea = document.querySelector('textarea, [contenteditable="true"]');
    if (!textarea) return false;

    if (textarea.tagName === 'TEXTAREA') {
      textarea.value = text;
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      textarea.innerText = text;
      textarea.focus();
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
    return true;
  }

  /* =========================================================================
     5. CONTEXT STUDIO MODAL UI (DEEPSEEK DESIGN MATCHED)
     ========================================================================= */

  function openContextModal() {
    const existing = document.querySelector('.ds-context-modal-backdrop');
    if (existing) {
      existing.remove();
      return;
    }

    const backdrop = document.createElement('div');
    backdrop.className = 'ds-code-modal-backdrop ds-context-modal-backdrop';

    backdrop.innerHTML = `
      <div class="ds-code-modal ds-context-modal" style="width: 92vw; max-width: 620px; height: auto; max-height: 88vh;">
        <div class="ds-code-modal-header" style="border-bottom: 1px solid var(--ds-border-dark);">
          <div class="ds-code-modal-title">
            <span style="color: var(--ds-brand-primary);">${ICONS.upload}</span> <span>Context Ingestion Studio</span>
          </div>
          <button type="button" class="ds-code-modal-close-btn" id="ctxCloseBtn" title="Close (Esc)">✕</button>
        </div>

        <!-- Tab Navigation -->
        <div class="ds-ctx-tabs">
          <button type="button" class="ds-ctx-tab active" data-tab="folder">
            <span class="ds-ctx-tab-icon">${ICONS.folder}</span> <span>Local Folder</span>
          </button>
          <button type="button" class="ds-ctx-tab" data-tab="github">
            <span class="ds-ctx-tab-icon">${ICONS.github}</span> <span>GitHub Repo</span>
          </button>
          <button type="button" class="ds-ctx-tab" data-tab="web">
            <span class="ds-ctx-tab-icon">${ICONS.globe}</span> <span>Web Page</span>
          </button>
        </div>

        <div class="ds-ctx-body" style="padding: 20px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto;">
          
          <!-- TAB 1: LOCAL FOLDER -->
          <div class="ds-ctx-tab-panel active" id="panelFolder">
            <input type="file" id="ctxFolderInput" webkitdirectory directory multiple style="display: none;" />
            <div class="ds-ctx-dropzone" id="ctxFolderDropzone">
              <div style="color: var(--ds-brand-primary); margin-bottom: 8px;">${ICONS.folder}</div>
              <div style="font-weight: 600; color: #fff; font-size: 14px; margin-bottom: 4px;">Choose a Project Folder</div>
              <div style="font-size: 12px; color: var(--ds-text-secondary); max-width: 380px; margin: 0 auto 12px;">
                Recursively scans source files & ignores node_modules, .git, and binaries.
              </div>
              <button type="button" class="ds-suite-btn ds-ctx-action-btn" id="ctxSelectFolderBtn">
                <span class="ds-suite-btn-icon">${ICONS.plus}</span> <span>Browse Directory</span>
              </button>
            </div>
          </div>

          <!-- TAB 2: GITHUB REPO -->
          <div class="ds-ctx-tab-panel" id="panelGithub" style="display: none;">
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <label style="font-size: 12.5px; font-weight: 600; color: #fff;">Repository URL or owner/repo</label>
              <input type="text" class="ds-search-input" id="ctxGithubUrlInput" placeholder="e.g. facebook/react or https://github.com/torvalds/linux" style="width: 100%; border-radius: 8px; padding: 10px 14px; font-size: 13px;" />
              
              <div style="display: flex; gap: 8px; align-items: center;">
                <input type="password" class="ds-search-input" id="ctxGithubTokenInput" placeholder="GitHub Personal Access Token (Optional for private repos)" style="flex: 1; border-radius: 8px; padding: 8px 12px; font-size: 12px;" />
                <button type="button" class="ds-suite-btn ds-ctx-action-btn" id="ctxFetchGithubBtn" style="white-space: nowrap;">
                  <span>Fetch Codebase</span>
                </button>
              </div>
            </div>
          </div>

          <!-- TAB 3: WEB PAGE -->
          <div class="ds-ctx-tab-panel" id="panelWeb" style="display: none;">
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <label style="font-size: 12.5px; font-weight: 600; color: #fff;">Web Article / Documentation URL</label>
              <div style="display: flex; gap: 8px;">
                <input type="text" class="ds-search-input" id="ctxWebUrlInput" placeholder="https://docs.example.com/guide" style="flex: 1; border-radius: 8px; padding: 10px 14px; font-size: 13px;" />
                <button type="button" class="ds-suite-btn ds-ctx-action-btn" id="ctxFetchWebBtn">
                  <span>Fetch Page</span>
                </button>
              </div>
            </div>
          </div>

          <!-- PROGRESS & STATUS -->
          <div id="ctxProgressWrap" style="display: none; background: rgba(255,255,255,0.03); border: 1px solid var(--ds-border-dark); border-radius: 10px; padding: 12px 16px;">
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #fff; margin-bottom: 6px;">
              <span id="ctxStatusText">Reading files...</span>
              <span id="ctxCountText" style="color: var(--ds-brand-primary);">0 files</span>
            </div>
            <div class="ds-ctx-progressbar-bg" style="width: 100%; height: 5px; background: rgba(255,255,255,0.1); border-radius: 9999px; overflow: hidden;">
              <div id="ctxProgressBar" style="width: 30%; height: 100%; background: var(--ds-brand-primary); transition: width 0.2s;"></div>
            </div>
          </div>

          <!-- RESULTS SUMMARY PREVIEW -->
          <div id="ctxResultPreview" style="display: none; background: rgba(0,0,0,0.3); border: 1px solid var(--ds-border-dark); border-radius: 10px; padding: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 13px; font-weight: 600; color: #fff;" id="ctxResultTitle">Project Context Ready</span>
              <span class="ds-ctx-token-pill" id="ctxTokenPill">~0 tokens</span>
            </div>
            <div style="font-size: 12px; color: var(--ds-text-secondary); max-height: 120px; overflow-y: auto; font-family: var(--ds-code-font);" id="ctxFileListPreview"></div>
          </div>

          <!-- FOOTER ACTIONS -->
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px;">
            <button type="button" class="ds-suite-btn" id="ctxCopyBtn" style="display: none;">
              <span class="ds-suite-btn-icon">${ICONS.copy}</span> <span>Copy Markdown</span>
            </button>
            <button type="button" class="ds-suite-btn" id="ctxInsertBtn" style="display: none; background: var(--ds-brand-primary); color: #fff; border-color: transparent; font-weight: 600;">
              <span>Insert into Chat Prompt</span>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    void backdrop.offsetWidth;
    backdrop.classList.add('ds-modal-visible');

    let activeMarkdownResult = '';

    // Elements
    const closeBtn = backdrop.querySelector('#ctxCloseBtn');
    const tabs = backdrop.querySelectorAll('.ds-ctx-tab');
    const panels = {
      folder: backdrop.querySelector('#panelFolder'),
      github: backdrop.querySelector('#panelGithub'),
      web: backdrop.querySelector('#panelWeb')
    };

    const folderInput = backdrop.querySelector('#ctxFolderInput');
    const selectFolderBtn = backdrop.querySelector('#ctxSelectFolderBtn');
    const githubUrlInput = backdrop.querySelector('#ctxGithubUrlInput');
    const githubTokenInput = backdrop.querySelector('#ctxGithubTokenInput');
    const fetchGithubBtn = backdrop.querySelector('#ctxFetchGithubBtn');
    const webUrlInput = backdrop.querySelector('#ctxWebUrlInput');
    const fetchWebBtn = backdrop.querySelector('#ctxFetchWebBtn');

    const progressWrap = backdrop.querySelector('#ctxProgressWrap');
    const statusText = backdrop.querySelector('#ctxStatusText');
    const countText = backdrop.querySelector('#ctxCountText');
    const progressBar = backdrop.querySelector('#ctxProgressBar');

    const resultPreview = backdrop.querySelector('#ctxResultPreview');
    const resultTitle = backdrop.querySelector('#ctxResultTitle');
    const tokenPill = backdrop.querySelector('#ctxTokenPill');
    const fileListPreview = backdrop.querySelector('#ctxFileListPreview');

    const copyBtn = backdrop.querySelector('#ctxCopyBtn');
    const insertBtn = backdrop.querySelector('#ctxInsertBtn');

    // Load saved GitHub token if available
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['githubPatToken'], (res) => {
        if (res.githubPatToken) githubTokenInput.value = res.githubPatToken;
      });
    }

    // Modal Close Handler
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

    // Tab Switching
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const tabName = tab.dataset.tab;
        Object.keys(panels).forEach(k => {
          panels[k].style.display = k === tabName ? 'block' : 'none';
        });
      });
    });

    function showResults(title, md, filesCount) {
      activeMarkdownResult = md;
      progressWrap.style.display = 'none';
      resultPreview.style.display = 'block';
      copyBtn.style.display = 'inline-flex';
      insertBtn.style.display = 'inline-flex';

      resultTitle.textContent = title;
      const tokens = estimateTokens(md);
      tokenPill.textContent = `~${tokens.toLocaleString()} tokens (${(md.length / 1024).toFixed(1)} KB)`;
      fileListPreview.textContent = md.substring(0, 1800) + (md.length > 1800 ? '\n\n... (Full content prepared for insertion)' : '');
    }

    // Folder Actions
    selectFolderBtn.addEventListener('click', async () => {
      progressWrap.style.display = 'block';
      progressBar.style.width = '20%';
      statusText.textContent = 'Selecting directory...';

      try {
        if ('showDirectoryPicker' in window) {
          const data = await parseLocalDirectoryWithPicker((count, file) => {
            countText.textContent = `${count} files`;
            statusText.textContent = `Reading ${file.split('/').pop()}...`;
            progressBar.style.width = `${Math.min(95, 20 + count * 2)}%`;
          });
          const md = formatContextMarkdown(data, 'folder');
          showResults(`Local Folder: ${data.name} (${data.files.length} files)`, md, data.files.length);
        } else {
          folderInput.click();
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          folderInput.click();
        } else {
          progressWrap.style.display = 'none';
        }
      }
    });

    folderInput.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files.length > 0) {
        progressWrap.style.display = 'block';
        statusText.textContent = 'Scanning files...';
        const data = await parseLocalDirectoryWithInput(e.target.files, (count, file) => {
          countText.textContent = `${count} files`;
          progressBar.style.width = `${Math.min(95, 20 + count * 2)}%`;
        });
        const md = formatContextMarkdown(data, 'folder');
        showResults(`Local Folder (${data.files.length} files)`, md, data.files.length);
      }
    });

    // GitHub Actions
    fetchGithubBtn.addEventListener('click', async () => {
      const url = githubUrlInput.value.trim();
      const token = githubTokenInput.value.trim();
      if (!url) return;

      if (token && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ githubPatToken: token });
      }

      progressWrap.style.display = 'block';
      progressBar.style.width = '15%';
      statusText.textContent = 'Connecting to GitHub API...';

      try {
        const data = await fetchGitHubRepository(url, token, (count, file, total) => {
          countText.textContent = `${count} / ${total} files`;
          statusText.textContent = `Fetching ${file}...`;
          progressBar.style.width = `${Math.min(95, Math.round((count / total) * 100))}%`;
        });
        const md = formatContextMarkdown(data, 'github');
        showResults(`GitHub: ${data.name} (${data.files.length} files)`, md, data.files.length);
      } catch (err) {
        progressWrap.style.display = 'none';
        alert(`GitHub Fetch Error: ${err.message}`);
      }
    });

    // Web Page Actions
    fetchWebBtn.addEventListener('click', async () => {
      const url = webUrlInput.value.trim();
      if (!url) return;

      progressWrap.style.display = 'block';
      progressBar.style.width = '40%';
      statusText.textContent = 'Fetching webpage content...';

      try {
        const data = await fetchWebPageMarkdown(url);
        progressBar.style.width = '100%';
        const md = formatContextMarkdown(data, 'web');
        showResults(`Web Article: ${data.title}`, md, 1);
      } catch (err) {
        progressWrap.style.display = 'none';
        alert(`Webpage Fetch Error: ${err.message}`);
      }
    });

    // Copy Action
    copyBtn.addEventListener('click', async () => {
      if (!activeMarkdownResult) return;
      try {
        await navigator.clipboard.writeText(activeMarkdownResult);
        copyBtn.querySelector('span:last-child').textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.querySelector('span:last-child').textContent = 'Copy Markdown';
        }, 2000);
      } catch (e) {}
    });

    // Insert Action
    insertBtn.addEventListener('click', () => {
      if (!activeMarkdownResult) return;
      insertIntoPromptTextarea(activeMarkdownResult);
      closeModal();
    });
  }

  /* =========================================================================
     6. CHAT INPUT ATTACH BUTTON INJECTION
     ========================================================================= */

  function ensureAttachContextButton(root = document) {
    const inputWrappers = root.querySelectorAll('._77cefa5, ._3d616d3, ._020ab5b, ._8f7678d, ._425ea0b');

    inputWrappers.forEach(wrap => {
      if (wrap.querySelector('.ds-ctx-attach-btn')) return;

      const actionsArea = wrap.querySelector('._0bbda35, ._0a3d93b, ._78e0558') || wrap;
      if (!actionsArea) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ds-ctx-attach-btn ds-suite-btn';
      btn.title = 'Add Context (Folder, GitHub Repo, Webpage)';
      btn.innerHTML = `
        <span class="ds-suite-btn-icon" style="color: var(--ds-brand-primary);">${ICONS.upload}</span>
        <span>Context</span>
      `;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openContextModal();
      });

      actionsArea.appendChild(btn);
    });
  }

  window.DeepSeekOrbit.ContextImporter = {
    openContextModal,
    ensureAttachContextButton,
    parseLocalDirectoryWithPicker,
    fetchGitHubRepository,
    fetchWebPageMarkdown
  };
})();
