/**
 * DeepSeek Pro Suite - Popup Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const enabledToggle = document.getElementById('enabledToggle');
  const autoCollapseThoughtsToggle = document.getElementById('autoCollapseThoughtsToggle');
  const wordWrapToggle = document.getElementById('wordWrapToggle');
  const statusBadge = document.getElementById('statusBadge');
  const fontSelect = document.getElementById('fontSelect');
  const customFontRow = document.getElementById('customFontRow');
  const customFontInput = document.getElementById('customFontInput');
  const segmentBtns = document.querySelectorAll('.segment-btn');
  const resetBtn = document.getElementById('resetBtn');

  const wallpaperToggle = document.getElementById('wallpaperToggle');
  const wallpaperControls = document.getElementById('wallpaperControls');
  const wallpaperFileInput = document.getElementById('wallpaperFileInput');
  const removeWallpaperBtn = document.getElementById('removeWallpaperBtn');
  const wallpaperPreviewWrap = document.getElementById('wallpaperPreviewWrap');
  const wallpaperPreviewImg = document.getElementById('wallpaperPreviewImg');
  const wallpaperOpacitySlider = document.getElementById('wallpaperOpacitySlider');
  const wallpaperOpacityVal = document.getElementById('wallpaperOpacityVal');
  const wallpaperBlurSlider = document.getElementById('wallpaperBlurSlider');
  const wallpaperBlurVal = document.getElementById('wallpaperBlurVal');

  const defaultSettings = {
    enabled: true,
    mode: 'auto',
    fontFamily: 'Vazirmatn',
    customFont: '',
    enableWordWrap: false,
    autoCollapseThoughts: false,
    enableWallpaper: false,
    wallpaperImage: '',
    wallpaperOpacity: 0.15,
    wallpaperBlur: 0
  };

  let currentSettings = { ...defaultSettings };

  function broadcastSettings(settings) {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'DEEPSEEK_UPDATE_CONFIG', config: settings }).catch(() => {});
        }
      });
    }
  }

  function saveAndBroadcast(key, val) {
    currentSettings[key] = val;
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [key]: val });
    }
    broadcastSettings(currentSettings);
  }

  function updateUI(settings) {
    currentSettings = { ...settings };
    enabledToggle.checked = settings.enabled;
    if (autoCollapseThoughtsToggle) autoCollapseThoughtsToggle.checked = settings.autoCollapseThoughts || false;
    if (wordWrapToggle) wordWrapToggle.checked = settings.enableWordWrap || false;

    if (settings.enabled) {
      statusBadge.textContent = 'Active';
      statusBadge.classList.remove('inactive');
    } else {
      statusBadge.textContent = 'Disabled';
      statusBadge.classList.add('inactive');
    }

    fontSelect.value = settings.fontFamily || 'Vazirmatn';
    if (customFontRow && customFontInput) {
      if (settings.fontFamily === 'Custom') {
        customFontRow.style.display = 'block';
        customFontInput.value = settings.customFont || '';
      } else {
        customFontRow.style.display = 'none';
      }
    }

    segmentBtns.forEach((btn) => {
      if (btn.dataset.mode === settings.mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Wallpaper UI
    if (wallpaperToggle && wallpaperControls) {
      wallpaperToggle.checked = !!settings.enableWallpaper;
      wallpaperControls.style.display = settings.enableWallpaper ? 'flex' : 'none';

      if (settings.wallpaperImage) {
        wallpaperPreviewWrap.style.display = 'block';
        wallpaperPreviewImg.src = settings.wallpaperImage;
        removeWallpaperBtn.style.display = 'inline-flex';
      } else {
        wallpaperPreviewWrap.style.display = 'none';
        wallpaperPreviewImg.src = '';
        removeWallpaperBtn.style.display = 'none';
      }

      const opacityPct = Math.round((settings.wallpaperOpacity !== undefined ? settings.wallpaperOpacity : 0.15) * 100);
      wallpaperOpacitySlider.value = opacityPct;
      wallpaperOpacityVal.textContent = opacityPct + '%';

      const blurVal = settings.wallpaperBlur || 0;
      wallpaperBlurSlider.value = blurVal;
      wallpaperBlurVal.textContent = blurVal + 'px';
    }
  }

  function loadSettings() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(defaultSettings, (settings) => {
        updateUI(settings);
      });
    } else {
      updateUI(defaultSettings);
    }
  }

  // Settings Listeners
  enabledToggle.addEventListener('change', () => {
    const isEnabled = enabledToggle.checked;
    if (isEnabled) {
      statusBadge.textContent = 'Active';
      statusBadge.classList.remove('inactive');
    } else {
      statusBadge.textContent = 'Disabled';
      statusBadge.classList.add('inactive');
    }
    saveAndBroadcast('enabled', isEnabled);
  });

  if (autoCollapseThoughtsToggle) {
    autoCollapseThoughtsToggle.addEventListener('change', () => {
      saveAndBroadcast('autoCollapseThoughts', autoCollapseThoughtsToggle.checked);
    });
  }

  if (wordWrapToggle) {
    wordWrapToggle.addEventListener('change', () => {
      saveAndBroadcast('enableWordWrap', wordWrapToggle.checked);
    });
  }

  segmentBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      segmentBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      saveAndBroadcast('mode', btn.dataset.mode);
    });
  });

  fontSelect.addEventListener('change', () => {
    const selected = fontSelect.value;
    if (customFontRow) {
      customFontRow.style.display = selected === 'Custom' ? 'block' : 'none';
      if (selected === 'Custom' && customFontInput) {
        customFontInput.focus();
      }
    }
    saveAndBroadcast('fontFamily', selected);
  });

  if (customFontInput) {
    customFontInput.addEventListener('input', () => {
      saveAndBroadcast('customFont', customFontInput.value.trim());
    });
  }

  // Wallpaper Event Handlers
  if (wallpaperToggle) {
    wallpaperToggle.addEventListener('change', () => {
      const isEnabled = wallpaperToggle.checked;
      wallpaperControls.style.display = isEnabled ? 'flex' : 'none';
      saveAndBroadcast('enableWallpaper', isEnabled);
    });
  }

  if (wallpaperFileInput) {
    wallpaperFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target.result;
        currentSettings.wallpaperImage = base64Data;
        currentSettings.enableWallpaper = true;
        wallpaperToggle.checked = true;
        wallpaperControls.style.display = 'flex';
        wallpaperPreviewWrap.style.display = 'block';
        wallpaperPreviewImg.src = base64Data;
        removeWallpaperBtn.style.display = 'inline-flex';

        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({
            wallpaperImage: base64Data,
            enableWallpaper: true
          });
        }
        broadcastSettings(currentSettings);
      };
      reader.readAsDataURL(file);
    });
  }

  if (removeWallpaperBtn) {
    removeWallpaperBtn.addEventListener('click', () => {
      currentSettings.wallpaperImage = '';
      wallpaperPreviewWrap.style.display = 'none';
      wallpaperPreviewImg.src = '';
      removeWallpaperBtn.style.display = 'none';
      wallpaperFileInput.value = '';

      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ wallpaperImage: '' });
      }
      broadcastSettings(currentSettings);
    });
  }

  if (wallpaperOpacitySlider) {
    wallpaperOpacitySlider.addEventListener('input', () => {
      const opacityVal = parseInt(wallpaperOpacitySlider.value, 10) / 100;
      wallpaperOpacityVal.textContent = wallpaperOpacitySlider.value + '%';
      saveAndBroadcast('wallpaperOpacity', opacityVal);
    });
  }

  if (wallpaperBlurSlider) {
    wallpaperBlurSlider.addEventListener('input', () => {
      const blurVal = parseInt(wallpaperBlurSlider.value, 10);
      wallpaperBlurVal.textContent = blurVal + 'px';
      saveAndBroadcast('wallpaperBlur', blurVal);
    });
  }

  const openWallpaperStudioBtn = document.getElementById('openWallpaperStudioBtn');
  if (openWallpaperStudioBtn) {
    openWallpaperStudioBtn.addEventListener('click', () => {
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0] && tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'openWallpaperModal' });
            window.close();
          }
        });
      }
    });
  }

  resetBtn.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set(defaultSettings, () => {
        updateUI(defaultSettings);
        broadcastSettings(defaultSettings);
      });
    } else {
      updateUI(defaultSettings);
    }
  });

  const githubLink = document.querySelector('.github-card');
  if (githubLink) {
    githubLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
        chrome.tabs.create({ url: 'https://github.com/EhsanShahbazii' });
      } else {
        window.open('https://github.com/EhsanShahbazii', '_blank');
      }
    });
  }

  loadSettings();
});
