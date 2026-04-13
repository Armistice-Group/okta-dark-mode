// Listen for storage changes and inject/remove CSS accordingly
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && 'enabled' in changes) {
    const enabled = changes.enabled.newValue;
    updateAllOktaTabs(enabled);
  }
});

async function updateAllOktaTabs(enabled) {
  const tabs = await chrome.tabs.query({
    url: [
      'https://*.okta.com/*',
      'https://*.okta-emea.com/*',
      'https://*.oktapreview.com/*'
    ]
  });

  for (const tab of tabs) {
    if (enabled) {
      chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['content.css']
      }).catch(() => {});
    } else {
      chrome.scripting.removeCSS({
        target: { tabId: tab.id },
        files: ['content.css']
      }).catch(() => {});
    }
  }
}
