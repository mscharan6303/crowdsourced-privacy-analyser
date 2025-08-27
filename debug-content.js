// Debug version of content.js to verify score badge styling and insertion

(async () => {
  try {
    const links = document.querySelectorAll('a[href]');
    for (const link of links) {
      try {
        const url = new URL(link.href, window.location.href);
        if (url.protocol !== "http:" && url.protocol !== "https:") continue;

        // Simulate a score for testing
        const communityScore = Math.random() * 5;

        const badge = document.createElement('span');
        badge.className = 'score-badge';
        badge.textContent = ` [Score: ${communityScore.toFixed(2)}]`;

        if (communityScore >= 2) {
          badge.classList.add('score-badge-green');
          badge.style.color = '#fff';
          badge.style.backgroundColor = '#228B22'; // dark green background
        } else {
          badge.classList.add('score-badge-red');
          badge.style.color = '#fff';
          badge.style.backgroundColor = '#8B0000'; // dark red background
        }
        badge.style.position = 'relative';
        badge.style.left = '8px';
        badge.style.top = '4px';

        console.log('Inserting badge:', badge.textContent, 'after link:', link.href);

        link.insertAdjacentElement('afterend', badge);
      } catch (error) {
        console.error('Error processing link:', link.href, error);
      }
    }
  } catch (error) {
    console.error('Error in debug content script:', error);
  }
})();
