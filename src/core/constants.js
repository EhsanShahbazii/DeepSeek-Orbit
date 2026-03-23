/**
 * DeepSeek Orbit — Global Constants & SVG Icon Library
 */
(function () {
  'use strict';

  window.DeepSeekOrbit = window.DeepSeekOrbit || {};

  window.DeepSeekOrbit.DEFAULT_CONFIG = {
    enabled: true,
    mode: 'auto', // 'auto' | 'always-rtl' | 'always-ltr'
    fontFamily: 'Vazirmatn',
    customFont: '',
    enableWordWrap: false,
    autoCollapseThoughts: false,
    enableWallpaper: false,
    wallpaperImage: '',
    wallpaperOpacity: 0.15,
    wallpaperBlur: 0
  };

  window.DeepSeekOrbit.ICONS = {
    wrap: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 3.5H14M2 8H10.5C12 8 13.5 9.2 13.5 11C13.5 12.8 12 14 10.5 14H7.5M7.5 14L9.5 12M7.5 14L9.5 16M2 12.5H5.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    expand: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 6V2H6M14 6V2H10M2 10V14H6M14 10V14H10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    copy: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 4.5H5C3.9 4.5 3 5.4 3 6.5V12.5C3 13.6 3.9 14.5 5 14.5H11C12.1 14.5 13 13.6 13 12.5V6.5C13 5.4 12.1 4.5 11 4.5Z" stroke="currentColor" stroke-width="1.3"/><path d="M5 4.5V3.5C5 2.4 5.9 1.5 7 1.5H13C14.1 1.5 15 2.4 15 3.5V9.5C15 10.6 14.1 11.5 13 11.5H12.5" stroke="currentColor" stroke-width="1.3"/></svg>`,
    check: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 8.5L6.5 12L13 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    search: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.4"/><path d="M10.5 10.5L14.5 14.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`,
    pin: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 2.5L13.5 6L11.5 8L12.5 12L8.5 11L6.5 13L5.5 10.5L2 14L5.5 10.5L3 9.5L5 7.5L4 3.5L8 4.5L10 2.5Z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    pinFilled: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 2.5L13.5 6L11.5 8L12.5 12L8.5 11L6.5 13L5.5 10.5L2 14L5.5 10.5L3 9.5L5 7.5L4 3.5L8 4.5L10 2.5Z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    arrowUp: `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.5 10L8 5.5L12.5 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    arrowDown: `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.5 6L8 10.5L12.5 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    close: `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.5 3.5L12.5 12.5M12.5 3.5L3.5 12.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    trash: `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5H13.5M5.5 4.5V2.5H10.5V4.5M6.5 7.5V11.5M9.5 7.5V11.5M3.5 4.5L4.5 13.5H11.5L12.5 4.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    markdown: `<svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 2.5H14C14.55 2.5 15 2.95 15 3.5V12.5C15 13.05 14.55 13.5 14 13.5H2C1.45 13.5 1 13.05 1 12.5V3.5C1 2.95 1.45 2.5 2 2.5Z" stroke="currentColor" stroke-width="1.3"/><path d="M3.5 10.5V5.5L5.5 8L7.5 5.5V10.5M12.5 8.5L10.5 10.5M10.5 10.5L8.5 8.5M10.5 10.5V5.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    html: `<svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.3"/><path d="M1.5 8H14.5M8 1.5C9.5 3.5 10.5 5.7 10.5 8C10.5 10.3 9.5 12.5 8 14.5C6.5 12.5 5.5 10.3 5.5 8C5.5 5.7 6.5 3.5 8 1.5Z" stroke="currentColor" stroke-width="1.3"/></svg>`,
    json: `<svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 3C4 3 3.5 3.5 3.5 4.5V6.5C3.5 7.2 3 7.8 2 8C3 8.2 3.5 8.8 3.5 9.5V11.5C3.5 12.5 4 13 5 13M11 3C12 3 12.5 3.5 12.5 4.5V6.5C12.5 7.2 13 7.8 14 8C13 8.2 12.5 8.8 12.5 9.5V11.5C12.5 12.5 12 13 11 13" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`,
    export: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 1.5V10.5M8 1.5L4.5 5M8 1.5L11.5 5M2 9V13.5C2 14.05 2.45 14.5 3 14.5H13C13.55 14.5 14 14.05 14 13.5V9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    code: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 4.5L2 8L5.5 11.5M10.5 4.5L14 8L10.5 11.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    templateFix: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.5 2.5L13.5 6.5L11 9L13.5 11.5L9.5 11.5L7 14L5.5 10.5L2 9L6.5 7.5L9.5 2.5Z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    templateExplain: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.3"/><path d="M8 5V8.5M8 11.5V11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    templateRefactor: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 1.5L9.5 5.5L13.5 7L9.5 8.5L8 12.5L6.5 8.5L2.5 7L6.5 5.5L8 1.5Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>`,
    templateSummarize: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4H13.5M2.5 8H10M2.5 12H7.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`,
    templateTranslate: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 3.5H9M5.5 2V3.5M7 3.5C7 6.5 4 8.5 2.5 9.5M4 6.5C5 8 7 10 9 10.5M9.5 14L12 7.5L14.5 14M10.2 12.5H13.8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    templateTest: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 1.5L13.5 3.5V7.5C13.5 11 8 14.5 8 14.5C8 14.5 2.5 11 2.5 7.5V3.5L8 1.5Z" stroke="currentColor" stroke-width="1.3"/><path d="M5.5 7.5L7.5 9.5L10.5 5.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    image: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2.5" width="12" height="11" rx="2" stroke="currentColor" stroke-width="1.3"/><circle cx="5.5" cy="6" r="1.25" fill="currentColor"/><path d="M2.5 11.5L6 8L9.5 11.5L11.5 9.5L13.5 11.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    folder: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 3.5C1.5 2.95 1.95 2.5 2.5 2.5H6L7.5 4.5H13.5C14.05 4.5 14.5 4.95 14.5 5.5V12.5C14.5 13.05 14.05 13.5 13.5 13.5H2.5C1.95 13.5 1.5 13.05 1.5 12.5V3.5Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>`,
    github: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8C1.5 10.87 3.36 13.31 5.94 14.17C6.26 14.23 6.38 14.03 6.38 13.86C6.38 13.71 6.37 13.3 6.37 12.76C4.56 13.15 4.18 11.89 4.18 11.89C3.89 11.14 3.46 10.94 3.46 10.94C2.87 10.54 3.51 10.55 3.51 10.55C4.16 10.6 4.51 11.22 4.51 11.22C5.09 12.21 6.03 11.92 6.4 11.76C6.46 11.34 6.63 11.05 6.81 10.89C5.37 10.73 3.85 10.17 3.85 7.68C3.85 6.97 4.1 6.39 4.52 5.94C4.45 5.77 4.23 5.11 4.59 4.22C4.59 4.22 5.13 4.05 6.38 4.89C6.9 4.75 7.45 4.67 8 4.67C8.55 4.67 9.1 4.75 9.62 4.89C10.86 4.05 11.4 4.22 11.4 4.22C11.76 5.11 11.54 5.77 11.47 5.94C11.89 6.39 12.14 6.97 12.14 7.68C12.14 10.18 10.62 10.72 9.17 10.88C9.41 11.08 9.62 11.48 9.62 12.09C9.62 12.96 9.61 13.66 9.61 13.86C9.61 14.03 9.73 14.24 10.05 14.17C12.63 13.31 14.5 10.87 14.5 8C14.5 4.41 11.59 1.5 8 1.5Z"/></svg>`,
    globe: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.3"/><path d="M2 8H14M8 2C9.5 4 10.2 6 10.2 8C10.2 10 9.5 12 8 14C6.5 12 5.8 10 5.8 8C5.8 6 6.5 4 8 2Z" stroke="currentColor" stroke-width="1.3"/></svg>`,
    plus: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    upload: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 10.5V2.5M8 2.5L4.5 6M8 2.5L11.5 6M2.5 10.5V13.5H13.5V10.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    fileText: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.5 2.5H9.5L13 6V13.5H3.5V2.5Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M9.5 2.5V6H13M5.5 8.5H10.5M5.5 11H8.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`
  };

  window.DeepSeekOrbit.FONT_MAP = {
    'Vazirmatn': "'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    'Sahel': "'Sahel', 'Vazirmatn', Tahoma, sans-serif",
    'Shabnam': "'Shabnam', 'Vazirmatn', Tahoma, sans-serif",
    'Tahoma': "Tahoma, Arial, sans-serif",
    'Estedad': "'Estedad', 'Vazirmatn', sans-serif",
    'Samim': "'Samim', 'Vazirmatn', sans-serif",
    'Dana': "'Dana', 'Vazirmatn', sans-serif",
    'System': "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  };

  window.DeepSeekOrbit.SLASH_COMMANDS = [
    {
      cmd: '/fix',
      title: 'Fix & Debug Code',
      desc: 'Analyze root causes, solve bugs, and provide corrected code',
      icon: window.DeepSeekOrbit.ICONS.templateFix,
      prompt: 'Fix the bugs and errors in the following code, explain the root causes, and provide the corrected code:\n\n'
    },
    {
      cmd: '/explain',
      title: 'Explain Concepts',
      desc: 'Provide a clear, step-by-step breakdown with examples',
      icon: window.DeepSeekOrbit.ICONS.templateExplain,
      prompt: 'Please explain the following concept or code step-by-step in clear, simple terms with examples:\n\n'
    },
    {
      cmd: '/refactor',
      title: 'Refactor & Optimize',
      desc: 'Improve readability, architecture, and execution performance',
      icon: window.DeepSeekOrbit.ICONS.templateRefactor,
      prompt: 'Refactor the following code to improve clean architecture, readability, and performance:\n\n'
    },
    {
      cmd: '/summarize',
      title: 'Summarize Text',
      desc: 'Create a concise summary highlighting key points',
      icon: window.DeepSeekOrbit.ICONS.templateSummarize,
      prompt: 'Summarize the following text concisely with bullet points highlighting the key takeaways:\n\n'
    },
    {
      cmd: '/translate',
      title: 'Persian Translation',
      desc: 'Translate fluently to Persian while preserving technical terms',
      icon: window.DeepSeekOrbit.ICONS.templateTranslate,
      prompt: 'Please translate the following content into fluent, natural Persian while preserving technical terms:\n\n'
    },
    {
      cmd: '/test',
      title: 'Write Unit Tests',
      desc: 'Generate comprehensive test cases including edge scenarios',
      icon: window.DeepSeekOrbit.ICONS.templateTest,
      prompt: 'Write comprehensive unit tests with edge cases and mock data for the following code:\n\n'
    }
  ];
})();
