/**
 * DeepSeek Orbit — Storage & Settings Sync Controller
 */
(function () {
  'use strict';

  window.DeepSeekOrbit = window.DeepSeekOrbit || {};

  const DEFAULT_CONFIG = window.DeepSeekOrbit.DEFAULT_CONFIG || {};

  function loadSettings(callback) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(DEFAULT_CONFIG, (stored) => {
        const config = { ...DEFAULT_CONFIG, ...stored };
        if (callback) callback(config);
      });
    } else {
      if (callback) callback(DEFAULT_CONFIG);
    }
  }

  function saveSettings(settings, callback) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set(settings, () => {
        if (callback) callback();
      });
    } else {
      if (callback) callback();
    }
  }

  window.DeepSeekOrbit.Storage = {
    loadSettings,
    saveSettings
  };
})();
