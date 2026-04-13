// content-init.js — runs at document_start
// Injects content.css and a :root color-override block when enabled.

const DEFAULTS = {
  bg:      '#111113',
  bg2:     '#1c1c21',
  bg3:     '#26262d',
  accent:  '#d6d6d6',
  primary: '#4c9aff',
  btnbg:   '#2a2a35',
  link:    '#4c9aff',
};

const domain    = location.hostname;
const domainKey = `colors_${domain}`;

chrome.storage.local.get(['enabled', 'colors_global', domainKey], (result) => {
  if (result.enabled === false) return;

  // Inject the main stylesheet
  const link = document.createElement('link');
  link.rel  = 'stylesheet';
  link.href = chrome.runtime.getURL('content.css');
  document.documentElement.appendChild(link);

  applyColorOverride(result);
});

// Re-apply when storage changes (popup live-updates colors)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (!('colors_global' in changes) && !(domainKey in changes)) return;

  chrome.storage.local.get(['colors_global', domainKey], (result) => {
    applyColorOverride(result);
  });
});

function applyColorOverride(result) {
  const global = result['colors_global'] || {};
  const local  = result[domainKey]       || {};
  const colors = Object.assign({}, DEFAULTS, global, local);

  // Remove any previously injected override
  const existing = document.getElementById('okta-dark-color-override');
  if (existing) existing.remove();

  // Only inject if something differs from defaults
  const changed = Object.keys(DEFAULTS).some(k => colors[k] !== DEFAULTS[k]);
  if (!changed) return;

  const style = document.createElement('style');
  style.id = 'okta-dark-color-override';
  style.textContent = `
    :root {
      --ok-bg:       ${colors.bg}     !important;
      --ok-bg-2:     ${colors.bg2}    !important;
      --ok-bg-3:     ${colors.bg3}    !important;
      --ok-glow:     ${colors.accent}  !important;
      --ok-primary:  ${colors.primary} !important;
      --ok-btn-bg:   ${colors.btnbg}   !important;
      --ok-btn-text: #e8e8e8          !important;
      --ok-link:     ${colors.link}   !important;
    }
  `;
  document.documentElement.appendChild(style);
}
