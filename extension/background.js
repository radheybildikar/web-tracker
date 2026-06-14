const API_BASE = 'http://localhost:5000/api';

// Track time spent on each tab
const tabStartTimes = {};

// Skip internal/browser pages
function shouldTrack(url) {
  if (!url) return false;
  if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) return false;
  if (url.startsWith('about:') || url.startsWith('edge://')) return false;
  if (url === 'about:blank' || url === 'about:newtab') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

async function getToken() {
  return new Promise(resolve => {
    chrome.storage.local.get(['wt_token'], result => resolve(result.wt_token || null));
  });
}

async function logVisit(tab, duration = 0) {
  if (!tab?.url || !shouldTrack(tab.url)) return;

  const token = await getToken();
  if (!token) return; // Not logged in

  try {
    await fetch(`${API_BASE}/visits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        url: tab.url,
        title: tab.title || '',
        favicon: tab.favIconUrl || '',
        duration: Math.round(duration)
      })
    });
  } catch (err) {
    console.error('[WebTrace] Failed to log visit:', err.message);
  }
}

// When a tab finishes loading a new URL
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && shouldTrack(tab.url)) {
    tabStartTimes[tabId] = Date.now();
    logVisit(tab, 0);
  }
});

// When switching tabs, record duration on previous tab
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  // Stop timer on previously active tab
  const prevEntry = Object.entries(tabStartTimes).find(([id]) => Number(id) !== tabId);
  if (prevEntry) {
    const [prevId, startTime] = prevEntry;
    const duration = (Date.now() - startTime) / 1000;
    // Optionally log duration update here
    delete tabStartTimes[Number(prevId)];
  }
  tabStartTimes[tabId] = Date.now();
});

// Cleanup when tab closes
chrome.tabs.onRemoved.addListener((tabId) => {
  delete tabStartTimes[tabId];
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_STATUS') {
    getToken().then(token => sendResponse({ loggedIn: !!token }));
    return true;
  }
  if (message.type === 'SET_TOKEN') {
    chrome.storage.local.set({ wt_token: message.token }, () => sendResponse({ ok: true }));
    return true;
  }
  if (message.type === 'LOGOUT') {
    chrome.storage.local.remove(['wt_token', 'wt_user'], () => sendResponse({ ok: true }));
    return true;
  }
});
