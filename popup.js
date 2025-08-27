document.addEventListener("DOMContentLoaded", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = new URL(tab.url);
  const fullUrl = url.href;
  document.getElementById("website-details").textContent = fullUrl;

  // Backend API for community score and reviews
  fetch("http://localhost:3000/reviews?site=" + encodeURIComponent(fullUrl))
    .then(res => res.json())
    .then(data => {
      document.getElementById("score").textContent = data.score ?? "N/A";
      displayReviews(data.reviews || []);
    }).catch(() => {
      document.getElementById("score").textContent = "Unavailable";
    });

  // Fetch total reviews count
  fetch("http://localhost:3000/total-reviews-count")
    .then(res => res.json())
    .then(data => {
      document.getElementById("total-reviews").textContent = data.count || "0";
    }).catch(() => {
      document.getElementById("total-reviews").textContent = "Unavailable";
    });

  // Handle star rating
  let stars = document.querySelectorAll(".star");
  stars.forEach(star => {
    star.addEventListener("click", () => {
      stars.forEach(s => s.classList.remove("checked"));
      for (let i = 0; i < star.dataset.value; i++) {
        stars[i].classList.add("checked");
      }
    });
  });

  // Submit review
  document.getElementById("submit").addEventListener("click", () => {
    let rating = document.querySelectorAll(".star.checked").length;
    let review = document.getElementById("review").value;
    fetch("http://localhost:3000/review", {
      method: "POST",
      body: JSON.stringify({ site: fullUrl, rating, review }),
      headers: { "Content-Type": "application/json" }
    }).then(() => {
      alert("Review submitted!");
      // Refresh reviews after submission
      fetch("http://localhost:3000/reviews?site=" + encodeURIComponent(fullUrl))
        .then(res => res.json())
        .then(data => {
          document.getElementById("score").textContent = data.score ?? "N/A";
          const container = document.getElementById("reviews");
          container.innerHTML = "";
          (data.reviews || []).forEach(r => {
            const div = document.createElement("div");
            div.className = "review";
            div.textContent = `⭐ ${r.rating}/5 — ${r.text}`;
            container.appendChild(div);
          });
        });
      
      // Refresh total reviews count after submission
      fetch("http://localhost:3000/total-reviews-count")
        .then(res => res.json())
        .then(data => {
          document.getElementById("total-reviews").textContent = data.count || "0";
        });
    }).catch((error) => {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Please try again.");
    });
  });

  document.getElementById("report").addEventListener("click", () => {
    let reason = prompt("Please enter the reason for reporting this site:");
    if (!reason) {
      alert("Report cancelled. Reason is required.");
      return;
    }
    fetch("http://localhost:3000/report", {
      method: "POST",
      body: JSON.stringify({ site: fullUrl, reason }),
      headers: { "Content-Type": "application/json" }
    }).then(() => {
      alert("Site reported.");
    }).catch(() => {
      alert("Failed to report site.");
    });
  });

  function displayReviews(reviews) {
    const container = document.getElementById("reviews");
    reviews.forEach(r => {
      const div = document.createElement("div");
      div.className = "review";
      div.textContent = `⭐ ${r.rating}/5 — ${r.text}`;
      container.appendChild(div);
    });
  }
});
