// content-icons.js
// Swaps app tile icons based on the Okta app instance ID found in each
// tile's href. Override map lives in icon-overrides.js (loaded before this).
// Only runs when dark mode is enabled.

chrome.storage.local.get('enabled', ({ enabled }) => {
  if (enabled === false) return;
  init();
});

function init() {
  // Extract the app instance ID from a chiclet href.
  // href pattern: /home/{appType}/{instanceId}/{templateId}
  function getAppId(href) {
    try {
      const parts = new URL(href).pathname.split('/');
      // ['', 'home', appType, instanceId, templateId]
      return parts.length >= 4 ? parts[3] : null;
    } catch {
      return null;
    }
  }

  function applyOverride(chiclet) {
    const appId = getAppId(chiclet.href);
    if (!appId || !ICON_OVERRIDES[appId]) return;

    const img = chiclet.querySelector('.chiclet--article img, img.app-logo--image');
    if (!img) return;

    // Avoid double-processing
    if (img.dataset.oktaDarkOverride === appId) return;

    img.src = chrome.runtime.getURL(ICON_OVERRIDES[appId]);
    img.dataset.oktaDarkOverride = appId;
  }

  function applyAll() {
    document.querySelectorAll('a.chiclet[data-se="app-card"]')
      .forEach(applyOverride);
  }

  // Run immediately for whatever is in the DOM now
  applyAll();

  // Also watch for tiles added dynamically (Okta renders async)
  const observer = new MutationObserver(() => applyAll());
  observer.observe(document.body, { childList: true, subtree: true });
}
