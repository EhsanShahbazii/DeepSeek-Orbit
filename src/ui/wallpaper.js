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

  window.DeepSeekOrbit.Wallpaper = {
    applyWallpaper
  };
})();
