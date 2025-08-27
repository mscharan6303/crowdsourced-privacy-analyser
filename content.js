// Immediately invoked async function to fetch and display scores
(async () => {
  try {
    // Create floating score badge in top-left corner
    function createFloatingScoreBadge(score, siteName) {
      const badge = document.createElement('div');
      badge.id = 'community-score-badge';
      badge.innerHTML = `
        <div style="
          position: fixed;
          top: 10px;
          left: 10px;
          z-index: 10000;
          background: ${score >= 3 ? 'linear-gradient(135deg, #4CAF50, #45a049)' : 'linear-gradient(135deg, #f44336, #d32f2f)'};
          color: white;
          padding: 8px 12px;
          border-radius: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 14px;
          font-weight: bold;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          border: 2px solid rgba(255,255,255,0.2);
          backdrop-filter: blur(10px);
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 5px;
        ">
          <span style="font-size: 16px;">⭐</span>
          <span>${siteName}: ${score}/5</span>
        </div>
      `;

      // Add hover effect
      badge.addEventListener('mouseenter', () => {
        badge.style.transform = 'scale(1.05)';
        badge.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4)';
      });
      
      badge.addEventListener('mouseleave', () => {
        badge.style.transform = 'scale(1)';
        badge.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
      });

      // Add click to show details
      badge.addEventListener('click', async () => {
        try {
          const response = await fetch(`http://localhost:3000/reviews?site=${encodeURIComponent(window.location.href)}`);
          const data = await response.json();
          const reviews = data.reviews || [];
          
          let details = `Community Score: ${data.score || 'N/A'}/5\n`;
          details += `Reviews: ${reviews.length}\n`;
          if (reviews.length > 0) {
            details += `\nRecent Reviews:\n`;
            reviews.slice(0, 3).forEach((review, index) => {
              details += `${index + 1}. ${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)} - ${review.text.substring(0, 50)}...\n`;
            });
          }
          
          alert(details);
        } catch (error) {
          console.error('Failed to fetch review details:', error);
        }
      });

      return badge;
    }

    // Fetch and display community score for current site
    const currentSite = window.location.hostname;
    try {
      const response = await fetch(`http://localhost:3000/reviews?site=${encodeURIComponent(window.location.href)}`, {
        timeout: 5000
      });
      
      if (response.ok) {
        const data = await response.json();
        const communityScore = data.score || 'N/A';
        
        // Create and insert floating score badge
        const badge = createFloatingScoreBadge(communityScore, currentSite);
        document.body.appendChild(badge);

        // Hide the badge after 1 minute (60000 ms)
        setTimeout(() => {
          if (badge && badge.parentNode) {
            badge.parentNode.removeChild(badge);
          }
        }, 60000);
      }
    } catch (error) {
      console.error('Failed to fetch community score:', error);
    }

    // Fetch flagged sites and block access if current site is blacklisted or risky
    const currentSiteUrl = window.location.href;
    try {
      const flaggedSitesResponse = await fetch('http://localhost:3000/flagged-sites', { timeout: 5000 });
      if (flaggedSitesResponse.ok) {
        const flaggedSitesData = await flaggedSitesResponse.json();
        const flaggedSites = flaggedSitesData.flaggedSites || {};
        for (const [site, info] of Object.entries(flaggedSites)) {
          if (currentSiteUrl.includes(site)) {
            if (info.isBlacklisted || info.isRisky) {
              document.documentElement.innerHTML = '';
              alert(`Access to this site (${site}) is blocked because it is ${info.isBlacklisted ? 'blacklisted' : 'marked risky'}.`);
              throw new Error('Site access blocked by extension due to blacklist/risky status.');
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch flagged sites or block access:', err);
    }

    // Fetch average score for current site and alert if <= 3 or if site is reported
    try {
      const [reviewsResponse, reportsResponse] = await Promise.all([
        fetch(`http://localhost:3000/reviews?site=${encodeURIComponent(currentSiteUrl)}`, { timeout: 5000 }),
        fetch(`http://localhost:3000/reports`, { timeout: 5000 })
      ]);
      let avgScore = null;
      let isReported = false;

      if (reviewsResponse.ok) {
        const data = await reviewsResponse.json();
        avgScore = data.score;
      }

      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        const reports = reportsData.reports || [];
        isReported = reports.some(report => report.site === currentSiteUrl || currentSiteUrl.includes(report.site));
      }

      if ((avgScore !== null && !isNaN(avgScore) && avgScore <= 3) || isReported) {
        alert(`Warning: This site has a low average rating of ${avgScore !== null ? avgScore : 'N/A'} or has been reported. Please proceed with caution.`);
      }
    } catch (err) {
      console.error('Failed to fetch average score or reports for current site:', err);
    }

    // Continue with link badges for individual links
    const isHTTPS = window.location.protocol === "https:";
    const cookies = document.cookie.split(";").filter(cookie => cookie.trim()).length;
    const trackers = document.querySelectorAll('script[src*="track"], iframe[src*="ads"]').length;
    const suspicious = location.hostname.match(/\.xyz|\.tk|login\-|free\-/i);
    const localScore = (isHTTPS ? 1 : 0) + (cookies > 10 ? -1 : 1) + (trackers > 2 ? -1 : 1) + (suspicious ? -1 : 1);
    const verdict = localScore < 1 ? "Possibly Fake" : "Looks Legit";
    
    // Store data only if chrome.storage is available (Chrome extension context)
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ isHTTPS, cookies, trackers, verdict });
    }

    // Function to create score badge element for individual links
    function createLinkScoreBadge(score) {
      const badge = document.createElement('span');
      badge.className = 'score-badge';
      badge.textContent = ` [Score: ${score}]`;
      
      // Add class for color based on score
      if (score >= 2) {
        badge.classList.add('score-badge-green');
        badge.style.color = '#fff';
        badge.style.backgroundColor = '#228B22';
      } else {
        badge.classList.add('score-badge-red');
        badge.style.color = '#fff';
        badge.style.backgroundColor = '#8B0000';
      }
      badge.style.position = 'relative';
      badge.style.left = '8px';
      badge.style.top = '4px';
      
      return badge;
    }

    // Fetch and display community score beside each link
    const links = document.querySelectorAll('a[href]');
    for (const link of links) {
      try {
        const url = new URL(link.href, window.location.href);
        if (url.protocol !== "http:" && url.protocol !== "https:") continue;
        
        const response = await fetch(`http://localhost:3000/reviews?site=${encodeURIComponent(url.href)}`, {
          timeout: 5000
        });
        
        if (!response.ok) {
          console.error('Failed to fetch community score for link:', url.href);
          continue;
        }
        
        const data = await response.json();
        const communityScore = data.score;
        
        if (communityScore !== null && !isNaN(communityScore)) {
          const badge = createLinkScoreBadge(communityScore);
          link.insertAdjacentElement('afterend', badge);
        }
      } catch (error) {
        console.error('Failed to fetch community score for link:', link.href, error);
      }
    }
  } catch (error) {
    console.error('Error in main execution:', error);
  }
})();
