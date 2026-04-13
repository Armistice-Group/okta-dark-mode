const DEFAULTS = {
  bg:      '#111113',
  bg2:     '#1c1c21',
  bg3:     '#26262d',
  accent:  '#d6d6d6',
  primary: '#4c9aff',
  btnbg:   '#2a2a35',
  link:    '#4c9aff',
};

const toggle      = document.getElementById('toggle-enabled');
const statusDot   = document.querySelector('.status-dot');
const statusText  = document.getElementById('status-text');
const scopeGlobal = document.getElementById('scope-global');
const scopeDomain = document.getElementById('scope-domain');
const domainLabel = document.getElementById('domain-label');
const resetBtn    = document.getElementById('reset-btn');

const fields = ['bg', 'bg2', 'bg3', 'accent', 'primary', 'btnbg', 'link'];

let currentScope  = 'global'; // 'global' | 'domain'
let currentDomain = null;

// ── Bootstrap ────────────────────────────────────────────────
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (tab?.url) {
    try {
      currentDomain = new URL(tab.url).hostname;
    } catch {}
  }
  domainLabel.textContent = currentDomain || '';
  loadAll();
});

// ── Toggle ───────────────────────────────────────────────────
chrome.storage.local.get('enabled', ({ enabled }) => {
  const isEnabled = enabled !== false;
  toggle.checked = isEnabled;
  updateToggleUI(isEnabled);
});

toggle.addEventListener('change', () => {
  const isEnabled = toggle.checked;
  chrome.storage.local.set({ enabled: isEnabled });
  updateToggleUI(isEnabled);
});

function updateToggleUI(isEnabled) {
  if (isEnabled) {
    statusDot.style.background  = '#4caf50';
    statusDot.style.boxShadow   = '0 0 6px #4caf50';
    statusText.textContent      = 'Dark mode active';
  } else {
    statusDot.style.background  = '#888';
    statusDot.style.boxShadow   = 'none';
    statusText.textContent      = 'Dark mode off';
  }
}

// ── Scope toggle ─────────────────────────────────────────────
scopeGlobal.addEventListener('click', () => setScope('global'));
scopeDomain.addEventListener('click', () => setScope('domain'));

function setScope(scope) {
  currentScope = scope;
  scopeGlobal.classList.toggle('active', scope === 'global');
  scopeDomain.classList.toggle('active', scope === 'domain');
  domainLabel.textContent = scope === 'domain' ? (currentDomain || '') : '';
  loadColors();
}

// ── Storage helpers ──────────────────────────────────────────
function storageKey() {
  return currentScope === 'domain' && currentDomain
    ? `colors_${currentDomain}`
    : 'colors_global';
}

function loadAll() {
  loadColors();
}

function loadColors() {
  chrome.storage.local.get(storageKey(), (result) => {
    const colors = result[storageKey()] || {};
    fields.forEach(f => {
      const val = colors[f] || DEFAULTS[f];
      document.getElementById(`color-${f}`).value = val;
      document.getElementById(`hex-${f}`).value   = val.toUpperCase();
    });
  });
}

function saveColors() {
  const colors = {};
  fields.forEach(f => {
    colors[f] = document.getElementById(`color-${f}`).value;
  });
  chrome.storage.local.set({ [storageKey()]: colors });
}

// ── Color inputs ─────────────────────────────────────────────
fields.forEach(f => {
  const colorInput = document.getElementById(`color-${f}`);
  const hexInput   = document.getElementById(`hex-${f}`);

  // Native color picker → sync hex text + save
  colorInput.addEventListener('input', () => {
    hexInput.value = colorInput.value.toUpperCase();
    hexInput.classList.remove('invalid');
    saveColors();
  });

  // Hex text → validate + sync color picker + save
  hexInput.addEventListener('input', () => {
    const val = hexInput.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      colorInput.value = val;
      hexInput.classList.remove('invalid');
      saveColors();
    } else {
      hexInput.classList.toggle('invalid', val.length >= 4);
    }
  });
});

// ── Reset ────────────────────────────────────────────────────
resetBtn.addEventListener('click', () => {
  chrome.storage.local.remove(storageKey(), () => {
    loadColors();
  });
});

// ── Export ───────────────────────────────────────────────────
document.getElementById('export-btn').addEventListener('click', () => {
  chrome.storage.local.get(null, (allData) => {
    const json = JSON.stringify(allData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'okta-dark-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  });
});

// ── Import ───────────────────────────────────────────────────
const importBtn  = document.getElementById('import-btn');
const importFile = document.getElementById('import-file');

importBtn.addEventListener('click', () => importFile.click());

importFile.addEventListener('change', () => {
  const file = importFile.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);

      // Validate: must be a plain object with at least one known key
      const validKeys = /^(enabled|colors_global|colors_.+)$/;
      const keys = Object.keys(data);
      if (!keys.length || !keys.every(k => validKeys.test(k))) {
        throw new Error('Unrecognized settings format');
      }

      chrome.storage.local.set(data, () => {
        loadAll();
        flashImportBtn('import-ok', 'Imported!');
      });
    } catch {
      flashImportBtn('import-error', 'Invalid file');
    }
    importFile.value = '';
  };
  reader.readAsText(file);
});

function flashImportBtn(cls, label) {
  importBtn.textContent = label;
  importBtn.classList.add(cls);
  setTimeout(() => {
    importBtn.textContent = 'Import settings';
    importBtn.classList.remove(cls);
  }, 2000);
}
