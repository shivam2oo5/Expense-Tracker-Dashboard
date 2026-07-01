import { getTheme, setTheme as saveTheme } from './storage.js';

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  }
  const settingsToggle = document.getElementById('settings-dark-toggle');
  if (settingsToggle) settingsToggle.checked = theme === 'dark';
}

export function initTheme() {
  const theme = getTheme();
  applyTheme(theme);
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  saveTheme(next);
  applyTheme(next);
  return next;
}
