
chrome.runtime.onInstalled.addListener(() => {
  console.log("Crowdsourced Data Privacy Analyser installed.");
});

// Function to show badge on extension icon
function showBadge(text, color) {
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });
}

// Function to check site status and show badge accordingly
async function checkSiteStatus(url) {
  try {
    const response = await fetch(`http://localhost:3000/flagged-sites`);
    const data = await response.json();
    const flaggedSites = data.flaggedSites || {};
    if (flaggedSites[url]) {
      const siteInfo = flaggedSites[url];
      if (siteInfo.isBlacklisted) {
        showBadge("BL", "red");
      } else if (siteInfo.isRisky) {
        showBadge("!", "orange");
      } else {
        showBadge("", [0, 0, 0, 0]);
      }
    } else {
      showBadge("", [0, 0, 0, 0]);
    }
  } catch (error) {
    console.error("Error checking site status:", error);
    showBadge("", [0, 0, 0, 0]);
  }
}

// Listen for tab updates to check site status and show badge
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    checkSiteStatus(tab.url);
  }
});
