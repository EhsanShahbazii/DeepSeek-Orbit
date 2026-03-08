/**
 * DeepSeek Orbit — Custom Wallpaper Studio Engine
 */
(function () {
  'use strict';

  window.DeepSeekOrbit = window.DeepSeekOrbit || {};
  const ICONS = window.DeepSeekOrbit.ICONS || {};

  function applyWallpaper(config) {
    let layer = document.getElementById('ds-custom-wallpaper-layer');

    if (!config.enabled || !config.enableWallpaper || !config.wallpaperImage) {
      document.body.classList.remove('ds-has-wallpaper');
      document.documentElement.classList.remove('ds-has-wallpaper');
      if (layer) {
        layer.style.opacity = '0';
        setTimeout(() => {
          if (layer && layer.parentNode) layer.remove();
        }, 400);
      }
      return;
    }

    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'ds-custom-wallpaper-layer';
      document.body.prepend(layer);
    }

    const opacity = config.wallpaperOpacity !== undefined ? config.wallpaperOpacity : 0.15;
    const blur = config.wallpaperBlur !== undefined ? config.wallpaperBlur : 0;

    layer.style.backgroundImage = `url("${config.wallpaperImage}")`;
    layer.style.opacity = String(opacity);
    layer.style.filter = blur > 0 ? `blur(${blur}px)` : 'none';

    document.body.classList.add('ds-has-wallpaper');
    document.documentElement.classList.add('ds-has-wallpaper');
  }

  function openWallpaperModal(config, onSave) {
    const existing = document.querySelector('.ds-wallpaper-modal-backdrop');
    if (existing) {
      existing.remove();
      return;
    }

    const backdrop = document.createElement('div');
    backdrop.className = 'ds-code-modal-backdrop ds-wallpaper-modal-backdrop';

    const currentImg = config.wallpaperImage || '';
    const currentOpacity = Math.round((config.wallpaperOpacity !== undefined ? config.wallpaperOpacity : 0.15) * 100);
    const currentBlur = config.wallpaperBlur || 0;

    backdrop.innerHTML = `
      <div class="ds-code-modal ds-wallpaper-modal" style="width: 90vw; max-width: 520px; height: auto; max-height: 90vh;">
        <div class="ds-code-modal-header" style="border-bottom: 1px solid var(--ds-border-dark);">
          <div class="ds-code-modal-title">
            <span>${ICONS.image}</span> <span>Wallpaper Studio</span>
          </div>
          <button type="button" class="ds-code-modal-close-btn" id="wpModalCloseBtn" title="Close (Esc)">✕</button>
        </div>
        <div style="padding: 22px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto;">
          <!-- Drop / Upload Area -->
          <div class="ds-wp-upload-zone" id="wpDropZone" style="border: 2px dashed rgba(255,255,255,0.18); border-radius: 12px; padding: 22px 16px; text-align: center; cursor: pointer; transition: all 0.2s; background: rgba(0,0,0,0.25);">
            <input type="file" id="wpModalFileInput" accept="image/*" style="display: none;" />
            <div style="color: var(--ds-brand-primary); margin-bottom: 6px; display: flex; justify-content: center;">
              ${ICONS.image}
            </div>
            <div style="font-size: 13.5px; font-weight: 600; color: #fff; margin-bottom: 2px;">Click or Drag image here</div>
            <div style="font-size: 11.5px; color: var(--ds-text-secondary);">Supports PNG, JPG, WebP, SVG</div>
          </div>

          <!-- Preview & Remove -->
          <div id="wpModalPreviewSection" style="display: ${currentImg ? 'flex' : 'none'}; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 10px 14px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <img id="wpModalPreviewImg" src="${currentImg}" style="width: 48px; height: 48px; border-radius: 8px; object-fit: cover; border: 1px solid rgba(255,255,255,0.15);" />
              <div>
                <div style="font-size: 12.5px; font-weight: 600; color: #fff;">Custom Background</div>
                <div style="font-size: 11px; color: #4ade80;">Active Wallpaper</div>
              </div>
            </div>
            <button type="button" id="wpModalRemoveBtn" class="ds-suite-btn" style="color: #f87171; border-color: rgba(239, 68, 68, 0.3);">
              <span class="ds-suite-btn-icon">${ICONS.trash}</span> <span>Remove</span>
            </button>
          </div>

          <!-- Opacity Slider -->
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 12.5px; font-weight: 600; color: #fff; margin-bottom: 8px;">
              <span>Wallpaper Opacity</span>
              <span id="wpOpacityValText" style="color: var(--ds-brand-primary);">${currentOpacity}%</span>
            </div>
            <input type="range" id="wpModalOpacity" min="5" max="60" step="5" value="${currentOpacity}" style="width: 100%; accent-color: var(--ds-brand-primary); cursor: pointer;" />
          </div>

          <!-- Blur Slider -->
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 12.5px; font-weight: 600; color: #fff; margin-bottom: 8px;">
              <span>Background Blur</span>
              <span id="wpBlurValText" style="color: var(--ds-brand-primary);">${currentBlur}px</span>
            </div>
            <input type="range" id="wpModalBlur" min="0" max="20" step="1" value="${currentBlur}" style="width: 100%; accent-color: var(--ds-brand-primary); cursor: pointer;" />
          </div>

          <!-- Footer Actions -->
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px;">
            <button type="button" id="wpModalDoneBtn" class="ds-suite-btn" style="background: var(--ds-brand-primary); color: #fff; border-color: transparent; padding: 0 24px; font-weight: 600;">
              Done
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    void backdrop.offsetWidth;
    backdrop.classList.add('ds-modal-visible');

    const fileInput = backdrop.querySelector('#wpModalFileInput');
    const dropZone = backdrop.querySelector('#wpDropZone');
    const previewSec = backdrop.querySelector('#wpModalPreviewSection');
    const previewImg = backdrop.querySelector('#wpModalPreviewImg');
    const removeBtn = backdrop.querySelector('#wpModalRemoveBtn');
    const opacitySlider = backdrop.querySelector('#wpModalOpacity');
    const opacityValText = backdrop.querySelector('#wpOpacityValText');
    const blurSlider = backdrop.querySelector('#wpModalBlur');
    const blurValText = backdrop.querySelector('#wpBlurValText');
    const closeBtn = backdrop.querySelector('#wpModalCloseBtn');
    const doneBtn = backdrop.querySelector('#wpModalDoneBtn');

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

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = 'var(--ds-brand-primary)';
    });
    dropZone.addEventListener('dragleave', () => {
      dropZone.style.borderColor = 'rgba(255,255,255,0.18)';
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = 'rgba(255,255,255,0.18)';
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    });

    function handleFile(file) {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target.result;
        config.enableWallpaper = true;
        config.wallpaperImage = base64;
        previewImg.src = base64;
        previewSec.style.display = 'flex';
        applyWallpaper(config);
        if (onSave) onSave();
      };
      reader.readAsDataURL(file);
    }

    removeBtn.addEventListener('click', () => {
      config.enableWallpaper = false;
      config.wallpaperImage = '';
      previewImg.src = '';
      previewSec.style.display = 'none';
      applyWallpaper(config);
      if (onSave) onSave();
    });

    opacitySlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      opacityValText.textContent = `${val}%`;
      config.wallpaperOpacity = val / 100;
      applyWallpaper(config);
      if (onSave) onSave();
    });

    blurSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      blurValText.textContent = `${val}px`;
      config.wallpaperBlur = val;
      applyWallpaper(config);
      if (onSave) onSave();
    });

    closeBtn.addEventListener('click', closeModal);
    doneBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });

    const escHandler = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', escHandler);
  }

  window.DeepSeekOrbit.Wallpaper = {
    applyWallpaper,
    openWallpaperModal
  };
})();
