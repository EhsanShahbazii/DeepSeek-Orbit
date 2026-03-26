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

  const MAX_FILE_SIZE = 100 * 1024; // 100 KB limit per file

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
              } catch (err) {}
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

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const relPath = file.webkitRelativePath || file.name;
      const parts = relPath.split('/');

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
      throw new Error('Invalid format. Please use "owner/repo" or full GitHub URL.');
    }

    const headers = { 'Accept': 'application/vnd.github.v3+json' };
    if (token) headers['Authorization'] = `token ${token}`;

    let branch = parsed.branch;
    const repoRes = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, { headers });
    if (!repoRes.ok) {
      if (repoRes.status === 404) throw new Error('Repository not found or private (add GitHub token).');
      if (repoRes.status === 403) throw new Error('GitHub API rate limit reached. Add a Personal Access Token.');
      throw new Error(`GitHub API error: ${repoRes.statusText}`);
    }
    const repoInfo = await repoRes.json();
    if (!parsed.branch || parsed.branch === 'main') {
      branch = repoInfo.default_branch || 'main';
    }

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
      throw new Error('No supported code/text files found in repository.');
    }

    const files = [];
    const treeLines = candidateFiles.map(f => `├── ${f.path}`).join('\n');

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

    const unneeded = doc.querySelectorAll('script, style, noscript, nav, footer, header, aside, iframe, svg, form');
    unneeded.forEach(el => el.remove());

    const title = doc.title || targetUrl;
    const bodyContent = doc.body ? (doc.body.innerText || doc.body.textContent || '').trim() : '';
    const cleanText = bodyContent.replace(/\n{3,}/g, '\n\n');

    return {
      title: title,
      url: targetUrl,
      content: cleanText.substring(0, 120000)
    };
  }

  /* =========================================================================
     4. FORMATTING & PROMPT INSERTION
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
     5. CONTEXT STUDIO MODAL (FIXED HEIGHT, SMOOTH TRANSITION, NO OVERFLOW)
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
      <div class="ds-code-modal ds-context-modal" style="width: 92vw; max-width: 580px; height: auto;">
        <div class="ds-code-modal-header" style="border-bottom: 1px solid var(--ds-border-dark);">
          <div class="ds-code-modal-title">
            <span style="color: var(--ds-brand-primary); display: inline-flex; align-items: center;">${ICONS.upload}</span> 
            <span style="margin-left: 6px;">Context Ingestion Studio</span>
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

        <!-- Constant Fixed Height Body Container to Prevent Shaking -->
        <div class="ds-ctx-body" style="padding: 20px; height: 230px; min-height: 230px; max-height: 230px; box-sizing: border-box; overflow: hidden; position: relative; display: flex; flex-direction: column;">
          
          <!-- TAB 1: LOCAL FOLDER -->
          <div class="ds-ctx-tab-panel active" id="panelFolder">
            <input type="file" id="ctxFolderInput" webkitdirectory directory multiple style="display: none;" />
            <div class="ds-ctx-dropzone" id="ctxFolderDropzone">
              <div style="color: var(--ds-brand-primary); margin-bottom: 8px;">${ICONS.folder}</div>
              <div style="font-weight: 600; color: #fff; font-size: 14px; margin-bottom: 4px;">Choose a Project Folder</div>
              <div style="font-size: 12px; color: var(--ds-text-secondary); max-width: 380px; margin: 0 auto 12px; line-height: 1.4;">
                Recursively scans source files & ignores node_modules, .git, and binaries.
              </div>
              <button type="button" class="ds-suite-btn ds-ctx-action-btn" id="ctxSelectFolderBtn">
                <span class="ds-suite-btn-icon">${ICONS.plus}</span> <span>Browse Directory</span>
              </button>
            </div>
          </div>

          <!-- TAB 2: GITHUB REPO (Clean Inputs, No Password autofill, No Scrollbar) -->
          <div class="ds-ctx-tab-panel" id="panelGithub">
            <div style="display: flex; flex-direction: column; gap: 12px; height: 100%; justify-content: center;">
              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px;">Repository URL or owner/repo</label>
                <input type="text" class="ds-search-input" id="ctxGithubUrlInput" placeholder="e.g. facebook/react or https://github.com/owner/repo" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" style="width: 100%; border-radius: 8px; padding: 9px 12px; font-size: 13px; box-sizing: border-box;" />
              </div>
              
              <div style="display: flex; gap: 8px; align-items: center;">
                <input type="text" class="ds-search-input" id="ctxGithubTokenInput" name="gh_token_orbit" placeholder="GitHub PAT Token (Optional for private repos)" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" data-lpignore="true" data-1p-ignore="true" style="flex: 1; border-radius: 8px; padding: 9px 12px; font-size: 12px; box-sizing: border-box;" />
                <button type="button" class="ds-suite-btn ds-ctx-action-btn" id="ctxFetchGithubBtn" style="white-space: nowrap; height: 34px;">
                  <span>Fetch Codebase</span>
                </button>
              </div>
            </div>
          </div>

          <!-- TAB 3: WEB PAGE -->
          <div class="ds-ctx-tab-panel" id="panelWeb">
            <div style="display: flex; flex-direction: column; gap: 12px; height: 100%; justify-content: center;">
              <div>
                <label style="display: block; font-size: 12px; font-weight: 600; color: #fff; margin-bottom: 6px;">Web Article / Documentation URL</label>
                <div style="display: flex; gap: 8px;">
                  <input type="text" class="ds-search-input" id="ctxWebUrlInput" placeholder="https://docs.example.com/guide" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" style="flex: 1; border-radius: 8px; padding: 9px 12px; font-size: 13px; box-sizing: border-box;" />
                  <button type="button" class="ds-suite-btn ds-ctx-action-btn" id="ctxFetchWebBtn" style="white-space: nowrap; height: 34px;">
                    <span>Fetch Page</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- PROGRESS OVERLAY -->
          <div id="ctxProgressWrap" style="display: none; height: 100%; flex-direction: column; justify-content: center; background: rgba(255,255,255,0.02); border: 1px solid var(--ds-border-dark); border-radius: 10px; padding: 16px; box-sizing: border-box;">
            <div style="display: flex; justify-content: space-between; font-size: 12.5px; color: #fff; margin-bottom: 8px;">
              <span id="ctxStatusText">Scanning files...</span>
              <span id="ctxCountText" style="color: var(--ds-brand-primary); font-weight: 600;">0 files</span>
            </div>
            <div class="ds-ctx-progressbar-bg" style="width: 100%; height: 6px; background: rgba(255,255,255,0.08); border-radius: 9999px; overflow: hidden;">
              <div id="ctxProgressBar" style="width: 25%; height: 100%; background: var(--ds-brand-primary); transition: width 0.2s cubic-bezier(0.16, 1, 0.3, 1);"></div>
            </div>
          </div>

          <!-- RESULTS OVERLAY -->
          <div id="ctxResultPreview" style="display: none; height: 100%; flex-direction: column; justify-content: space-between; background: rgba(0,0,0,0.3); border: 1px solid var(--ds-border-dark); border-radius: 10px; padding: 12px 14px; box-sizing: border-box;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 13px; font-weight: 600; color: #fff;" id="ctxResultTitle">Context Ready</span>
              <span class="ds-ctx-token-pill" id="ctxTokenPill">~0 tokens</span>
            </div>
            <div style="font-size: 11.5px; color: var(--ds-text-secondary); max-height: 105px; overflow-y: auto; font-family: var(--ds-code-font); white-space: pre-wrap; line-height: 1.4; border-radius: 6px; background: rgba(0,0,0,0.25); padding: 8px;" id="ctxFileListPreview"></div>
            <div style="display: flex; justify-content: flex-end; gap: 8px;">
              <button type="button" class="ds-suite-btn" id="ctxCopyBtn">
                <span class="ds-suite-btn-icon">${ICONS.copy}</span> <span>Copy Markdown</span>
              </button>
              <button type="button" class="ds-suite-btn" id="ctxInsertBtn" style="background: var(--ds-brand-primary); color: #fff; border-color: transparent; font-weight: 600;">
                <span>Insert into Chat</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    void backdrop.offsetWidth;
    backdrop.classList.add('ds-modal-visible');

    let activeMarkdownResult = '';

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

    // Smooth Tab Switching
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        if (progressWrap.style.display === 'flex' || resultPreview.style.display === 'flex') {
          progressWrap.style.display = 'none';
          resultPreview.style.display = 'none';
        }

        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const tabName = tab.dataset.tab;

        Object.keys(panels).forEach(k => {
          if (k === tabName) {
            panels[k].classList.add('active');
          } else {
            panels[k].classList.remove('active');
          }
        });
      });
    });

    function showResults(title, md, filesCount) {
      activeMarkdownResult = md;
      progressWrap.style.display = 'none';
      Object.keys(panels).forEach(k => panels[k].classList.remove('active'));
      resultPreview.style.display = 'flex';

      resultTitle.textContent = title;
      const tokens = estimateTokens(md);
      tokenPill.textContent = `~${tokens.toLocaleString()} tokens (${(md.length / 1024).toFixed(1)} KB)`;
      fileListPreview.textContent = md.substring(0, 1800) + (md.length > 1800 ? '\n\n... (Full codebase ready for analysis)' : '');
    }

    // Folder Actions
    selectFolderBtn.addEventListener('click', async () => {
      progressWrap.style.display = 'flex';
      Object.keys(panels).forEach(k => panels[k].classList.remove('active'));
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
          showResults(`Local: ${data.name} (${data.files.length} files)`, md, data.files.length);
        } else {
          folderInput.click();
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          folderInput.click();
        } else {
          progressWrap.style.display = 'none';
          panels.folder.classList.add('active');
        }
      }
    });

    folderInput.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files.length > 0) {
        progressWrap.style.display = 'flex';
        Object.keys(panels).forEach(k => panels[k].classList.remove('active'));
        statusText.textContent = 'Scanning files...';
        const data = await parseLocalDirectoryWithInput(e.target.files, (count) => {
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

      progressWrap.style.display = 'flex';
      Object.keys(panels).forEach(k => panels[k].classList.remove('active'));
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
        panels.github.classList.add('active');
        alert(`GitHub Fetch Error: ${err.message}`);
      }
    });

    // Web Page Actions
    fetchWebBtn.addEventListener('click', async () => {
      const url = webUrlInput.value.trim();
      if (!url) return;

      progressWrap.style.display = 'flex';
      Object.keys(panels).forEach(k => panels[k].classList.remove('active'));
      progressBar.style.width = '40%';
      statusText.textContent = 'Fetching webpage content...';

      try {
        const data = await fetchWebPageMarkdown(url);
        progressBar.style.width = '100%';
        const md = formatContextMarkdown(data, 'web');
        showResults(`Web: ${data.title}`, md, 1);
      } catch (err) {
        progressWrap.style.display = 'none';
        panels.web.classList.add('active');
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
     6. CHAT INPUT CONTEXT BUTTON INJECTION (EXACT DEEPSEEK DESIGN)
     ========================================================================= */

  function ensureAttachContextButton(root = document) {
    // Look for DeepSeek's native button container (.bf38813a)
    const targetWrappers = root.querySelectorAll('.bf38813a, ._78e0558, ._0bbda35, ._0a3d93b');

    targetWrappers.forEach(wrap => {
      if (wrap.querySelector('.ds-orbit-context-btn')) return;

      const btn = document.createElement('div');
      btn.setAttribute('role', 'button');
      btn.setAttribute('tabindex', '0');
      btn.className = 'ds-button ds-button--iconLabelPrimary ds-button--icon ds-button--capsule ds-button--s ds-button--icon-relative-m ds-orbit-context-btn';
      btn.setAttribute('style', '--dsl-button-height: 34px;');
      btn.title = 'Add Context (Folder, GitHub Repo, Webpage)';

      btn.innerHTML = `
        <div class="ds-button__background"></div>
        <div class="ds-button__icon ds-button__icon--last-child">
          <div class="ds-icon" style="font-size: inherit;">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1.5 3.5C1.5 2.95 1.95 2.5 2.5 2.5H6L7.5 4.5H13.5C14.05 4.5 14.5 4.95 14.5 5.5V12.5C14.5 13.05 14.05 13.5 13.5 13.5H2.5C1.95 13.5 1.5 13.05 1.5 12.5V3.5Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
              <path d="M8 7V11M6 9H10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
          </div>
        </div>
      `;

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openContextModal();
      });

      // Insert as the first item inside .bf38813a or prepend next to paperclip upload
      wrap.insertBefore(btn, wrap.firstChild);
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
