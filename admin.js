document.addEventListener("DOMContentLoaded", () => {
  const sitesListSection = document.getElementById("sites-list-section");
  const siteDetailSection = document.getElementById("site-detail-section");
  const reportsTableBody = document.querySelector("#reports-table tbody");
  const insightsDiv = document.getElementById("insights");
  
  let allReviewsData = {};
  let allFlaggedSites = {};

  // Show sites list and hide detail view
  window.showSitesList = function() {
    sitesListSection.style.display = "block";
    siteDetailSection.style.display = "none";
  };

  // Show detail view for a specific site
  function showSiteDetail(site) {
    sitesListSection.style.display = "none";
    siteDetailSection.style.display = "block";
    
    document.getElementById("site-detail-title").textContent = `Site Details: ${site}`;
    
    // Get reviews for this site
    const reviews = allReviewsData[site] || [];
    const avgRating = reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2) 
      : "0.0";
    
    // Get flags for this site
    const flags = allFlaggedSites[site]?.flags || 0;
    
    // Update stats
    document.getElementById("detail-total-reviews").textContent = reviews.length;
    document.getElementById("detail-avg-rating").textContent = avgRating;
    document.getElementById("detail-flags").textContent = flags;
    
    // Display reviews
    const container = document.getElementById("site-reviews-container");
    container.innerHTML = "";
    
    if (reviews.length === 0) {
      container.innerHTML = "<p>No reviews for this site yet.</p>";
      return;
    }
    
    reviews.forEach((review, index) => {
      const reviewDiv = document.createElement("div");
      reviewDiv.className = "review-item";
      
      const ratingDiv = document.createElement("div");
      ratingDiv.className = "rating";
      ratingDiv.textContent = `★ ${review.rating}/5`;
      
      const textDiv = document.createElement("div");
      textDiv.className = "text";
      textDiv.textContent = review.text;
      
      const actionsDiv = document.createElement("div");
      actionsDiv.className = "actions";
      
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete Review";
      deleteBtn.addEventListener("click", () => {
        if (confirm(`Delete this review for "${site}"?`)) {
          fetch("http://localhost:3000/review", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ site, index })
          }).then(() => {
            loadAllData().then(() => showSiteDetail(site));
          });
        }
      });
      
      actionsDiv.appendChild(deleteBtn);
      
      reviewDiv.appendChild(ratingDiv);
      reviewDiv.appendChild(textDiv);
      reviewDiv.appendChild(actionsDiv);
      
      container.appendChild(reviewDiv);
    });

    // Add functionality for detail view buttons
    const markSafeBtn = document.getElementById("mark-safe-detail-btn");
    const blacklistBtn = document.getElementById("blacklist-detail-btn");
    
    markSafeBtn.onclick = () => {
      if (confirm(`Mark site "${site}" as safe and unblock it?`)) {
        fetch(`http://localhost:3000/unblock-site/${encodeURIComponent(site)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        }).then(() => {
          loadAllData().then(() => {
            showSiteDetail(site); // Refresh the detail view
            loadSitesOverview();
            loadReports();
            alert(`Site "${site}" has been successfully unblocked!`);
          });
        });
      }
    };
    
    blacklistBtn.onclick = () => {
      if (confirm(`Blacklist site "${site}"?`)) {
        fetch(`http://localhost:3000/flagged-site/${encodeURIComponent(site)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isBlacklisted: true })
        }).then(() => {
          loadAllData().then(() => {
            showSiteDetail(site); // Refresh the detail view
            loadSitesOverview();
            loadReports();
            alert(`Site "${site}" has been blacklisted!`);
          });
        });
      }
    };
  }

  // Load all data from backend
  async function loadAllData() {
    try {
      const [reviewsRes, flaggedSitesRes] = await Promise.all([
        fetch("http://localhost:3000/all-reviews"),
        fetch("http://localhost:3000/flagged-sites")
      ]);
      
      const reviewsData = await reviewsRes.json();
      const flaggedSitesData = await flaggedSitesRes.json();
      
      allReviewsData = reviewsData.reviews || {};
      allFlaggedSites = flaggedSitesData.flaggedSites || {};
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  // Load and display sites overview
  function loadSitesOverview() {
    const tableBody = document.querySelector("#sites-overview-table tbody");
    tableBody.innerHTML = "";

    // Get all unique sites from both reviews and flagged sites
    const allSites = new Set([
      ...Object.keys(allReviewsData),
      ...Object.keys(allFlaggedSites)
    ]);

    for (const site of allSites) {
      const tr = document.createElement("tr");

      // Site name (clickable)
      const siteTd = document.createElement("td");
      const siteLink = document.createElement("span");
      siteLink.className = "site-link";
      siteLink.textContent = site;
      siteLink.addEventListener("click", () => showSiteDetail(site));
      siteTd.appendChild(siteLink);
      tr.appendChild(siteTd);

      // Total reviews
      const totalReviews = (allReviewsData[site] || []).length;
      const totalReviewsTd = document.createElement("td");
      totalReviewsTd.textContent = totalReviews;
      tr.appendChild(totalReviewsTd);

      // Average rating
      const reviews = allReviewsData[site] || [];
      const avgRating = reviews.length > 0 
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2) 
        : "0.0";
      const avgRatingTd = document.createElement("td");
      avgRatingTd.textContent = avgRating;
      tr.appendChild(avgRatingTd);

      // Flags
      const flags = allFlaggedSites[site]?.flags || 0;
      const flagsTd = document.createElement("td");
      flagsTd.textContent = flags;
      tr.appendChild(flagsTd);

      // Blacklisted status
      const isBlacklisted = allFlaggedSites[site]?.isBlacklisted || false;
      const blacklistedTd = document.createElement("td");
      blacklistedTd.innerHTML = isBlacklisted 
        ? '<span class="badge blacklisted">Yes</span>' 
        : 'No';
      tr.appendChild(blacklistedTd);

      // Actions - Delete button for sites
      const actionsTd = document.createElement("td");
      
      // Delete site button
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete Site";
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (confirm(`Delete all data for site "${site}" permanently?`)) {
          // Use the new DELETE endpoint for permanent deletion
          fetch(`http://localhost:3000/site/${encodeURIComponent(site)}`, {
            method: "DELETE"
          }).then(() => {
            // Remove the row from the table immediately
            tr.remove();
            // Update the local data without reloading
            delete allReviewsData[site];
            delete allFlaggedSites[site];
            // Also update reports if any exist for this site
            loadReports();
          });
        }
      });
      actionsTd.appendChild(deleteBtn);
      
      tr.appendChild(actionsTd);
      tableBody.appendChild(tr);
    }
  }

  // Fetch and display user reports
  function loadReports() {
    fetch("http://localhost:3000/reports")
      .then(res => res.json())
      .then(data => {
        reportsTableBody.innerHTML = "";
        const reports = data.reports || [];
        reports.forEach(report => {
          const tr = document.createElement("tr");

          const idTd = document.createElement("td");
          idTd.textContent = report.id;
          tr.appendChild(idTd);

          const siteTd = document.createElement("td");
          const siteLink = document.createElement("span");
          siteLink.className = "site-link";
          siteLink.textContent = report.site;
          siteLink.addEventListener("click", () => showSiteDetail(report.site));
          siteTd.appendChild(siteLink);
          tr.appendChild(siteTd);

          const reasonTd = document.createElement("td");
          reasonTd.textContent = report.reason;
          tr.appendChild(reasonTd);

          const timestampTd = document.createElement("td");
          timestampTd.textContent = new Date(report.timestamp).toLocaleString();
          tr.appendChild(timestampTd);

          const actionsTd = document.createElement("td");
          
          // Blacklist button
          const blacklistBtn = document.createElement("button");
          blacklistBtn.textContent = "Blacklist";
          blacklistBtn.addEventListener("click", () => {
            if (confirm(`Blacklist site "${report.site}"?`)) {
              fetch(`http://localhost:3000/flagged-site/${encodeURIComponent(report.site)}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isBlacklisted: true })
              }).then(() => {
                loadAllData().then(() => {
                  loadSitesOverview();
                  loadReports();
                });
              });
            }
          });
          actionsTd.appendChild(blacklistBtn);

          // Mark as safe button - Enhanced to fully unblock the site
          const markSafeBtn = document.createElement("button");
          markSafeBtn.textContent = "Mark Safe";
          markSafeBtn.addEventListener("click", () => {
            if (confirm(`Mark site "${report.site}" as safe and unblock it?`)) {
              // Fully unblock the site by resetting all blocking flags
              fetch(`http://localhost:3000/unblock-site/${encodeURIComponent(report.site)}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" }
              }).then(() => {
                loadAllData().then(() => {
                  loadSitesOverview();
                  loadReports();
                  alert(`Site "${report.site}" has been successfully unblocked!`);
                });
              });
            }
          });
          actionsTd.appendChild(markSafeBtn);

          // Delete report button
          const deleteBtn = document.createElement("button");
          deleteBtn.textContent = "Delete Report";
          deleteBtn.addEventListener("click", () => {
            if (confirm(`Delete report ID ${report.id}?`)) {
              fetch(`http://localhost:3000/report/${report.id}`, {
                method: "DELETE"
              }).then(() => {
                loadAllData().then(() => {
                  loadSitesOverview();
                  loadReports();
                });
              });
            }
          });
          actionsTd.appendChild(deleteBtn);

          tr.appendChild(actionsTd);
          reportsTableBody.appendChild(tr);
        });
      });
  }

  // Fetch and display insights
  function loadInsights() {
    fetch("http://localhost:3000/insights")
      .then(res => res.json())
      .then(data => {
        insightsDiv.innerHTML = "<h3>Top Flagged Sites</h3>";
        const list = document.createElement("ul");
        (data.topFlaggedSites || []).forEach(siteInfo => {
          const li = document.createElement("li");
          const siteLink = document.createElement("span");
          siteLink.className = "site-link";
          siteLink.textContent = `${siteInfo.site} - Flags: ${siteInfo.flags}`;
          siteLink.addEventListener("click", () => showSiteDetail(siteInfo.site));
          
          li.appendChild(siteLink);
          if (siteInfo.isBlacklisted) {
            li.innerHTML += " <span class='badge blacklisted'>(Blacklisted)</span>";
          }
          if (siteInfo.isRisky) {
            li.innerHTML += " <span class='badge risky'>(Risky)</span>";
          }
          list.appendChild(li);
        });
        insightsDiv.appendChild(list);
      });
  }

  // Initial load
  loadAllData().then(() => {
    loadSitesOverview();
    loadReports();
    loadInsights();
  });
});
