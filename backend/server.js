const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('../'));

// Persistent data file
const dataFile = path.join(__dirname, 'data.json');

// Load data from file
function loadData() {
  try {
    if (fs.existsSync(dataFile)) {
      const data = fs.readFileSync(dataFile, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
  return {
    reviews: {},
    reports: [],
    flaggedSites: {},
    nextReportId: 1
  };
}

// Save data to file
function saveData() {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(dataStore, null, 2));
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Initialize data store
let dataStore = loadData();

// Helper to calculate average score
function calculateScore(reviews) {
  if (!reviews || reviews.length === 0) return null;
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return (total / reviews.length).toFixed(2);
}

// GET /reviews?site=fullUrl
app.get('/reviews', (req, res) => {
  const site = req.query.site;
  if (!site) {
    return res.status(400).json({ error: 'Missing site parameter' });
  }
  const reviews = dataStore.reviews[site] || [];
  const score = calculateScore(reviews);
  res.json({ score: score, reviews: reviews });
});

// POST /review
app.post('/review', (req, res) => {
  const { site, rating, review } = req.body;
  if (!site || !rating || !review) {
    return res.status(400).json({ error: 'Missing site, rating or review in request body' });
  }
  if (!dataStore.reviews[site]) {
    dataStore.reviews[site] = [];
  }
  dataStore.reviews[site].push({ rating, text: review });
  saveData();
  res.status(201).json({ message: 'Review added' });
});

// POST /report
app.post('/report', (req, res) => {
  const { site, reason } = req.body;
  if (!site || !reason) {
    return res.status(400).json({ error: 'Missing site or reason in request body' });
  }
  const report = {
    id: dataStore.nextReportId++,
    site,
    reason,
    timestamp: new Date().toISOString()
  };
  dataStore.reports.push(report);

  // Update flaggedSites count
  if (!dataStore.flaggedSites[site]) {
    dataStore.flaggedSites[site] = { isBlacklisted: false, isRisky: false, flags: 0 };
  }
  dataStore.flaggedSites[site].flags++;

  saveData();
  res.status(201).json({ message: 'Report added', report });
});

// GET /reports
app.get('/reports', (req, res) => {
  res.json({ reports: dataStore.reports });
});

// DELETE /report/:id
app.delete('/report/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = dataStore.reports.findIndex(r => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Report not found' });
  }
  const removed = dataStore.reports.splice(index, 1)[0];

  // Decrement flags count for the site
  if (dataStore.flaggedSites[removed.site]) {
    dataStore.flaggedSites[removed.site].flags = Math.max(0, dataStore.flaggedSites[removed.site].flags - 1);
  }

  saveData();
  res.json({ message: 'Report deleted' });
});

// GET /flagged-sites
app.get('/flagged-sites', (req, res) => {
  res.json({ flaggedSites: dataStore.flaggedSites });
});

// POST /flagged-site/:site
app.post('/flagged-site/:site', (req, res) => {
  const site = req.params.site;
  const { isBlacklisted, isRisky, flags } = req.body;
  
  if (!dataStore.flaggedSites[site]) {
    dataStore.flaggedSites[site] = { isBlacklisted: false, isRisky: false, flags: 0 };
  }
  
  if (typeof isBlacklisted === 'boolean') {
    dataStore.flaggedSites[site].isBlacklisted = isBlacklisted;
  }
  if (typeof isRisky === 'boolean') {
    dataStore.flaggedSites[site].isRisky = isRisky;
  }
  if (typeof flags === 'number') {
    dataStore.flaggedSites[site].flags = flags;
  }
  
  // If marking as safe, also remove from blacklist and reset flags
  if (isRisky === false && isBlacklisted === false) {
    dataStore.flaggedSites[site].flags = 0;
    dataStore.flaggedSites[site].isBlacklisted = false;
    dataStore.flaggedSites[site].isRisky = false;
  }
  
  res.json({ message: 'Flagged site updated', site: dataStore.flaggedSites[site] });
});

// POST /unblock-site/:site
app.post('/unblock-site/:site', (req, res) => {
  const site = req.params.site;
  
  if (dataStore.flaggedSites[site]) {
    // Reset all blocking flags
    dataStore.flaggedSites[site].isBlacklisted = false;
    dataStore.flaggedSites[site].isRisky = false;
    dataStore.flaggedSites[site].flags = 0;
    
    // Remove all reports for this site
    dataStore.reports = dataStore.reports.filter(report => report.site !== site);
  }
  
  res.json({ message: 'Site unblocked successfully', site: dataStore.flaggedSites[site] });
});

// DELETE /site/:site
app.delete('/site/:site', (req, res) => {
  const site = decodeURIComponent(req.params.site);
  
  // Delete all reviews for this site
  if (dataStore.reviews[site]) {
    delete dataStore.reviews[site];
  }
  
  // Delete flagged site data
  if (dataStore.flaggedSites[site]) {
    delete dataStore.flaggedSites[site];
  }
  
  // Remove all reports for this site
  dataStore.reports = dataStore.reports.filter(report => report.site !== site);
  
  saveData();
  res.json({ message: 'Site permanently deleted', site });
});

// GET /insights
app.get('/insights', (req, res) => {
  // Example insights: top flagged sites by flags count
  const flaggedSitesArray = Object.entries(dataStore.flaggedSites).map(([site, data]) => ({
    site,
    flags: data.flags,
    isBlacklisted: data.isBlacklisted,
    isRisky: data.isRisky
  }));
  flaggedSitesArray.sort((a, b) => b.flags - a.flags);
  res.json({ topFlaggedSites: flaggedSitesArray.slice(0, 10) });
});


app.get('/all-reviews', (req, res) => {
  res.json({ reviews: dataStore.reviews });
});

// GET /total-reviews-count
app.get('/total-reviews-count', (req, res) => {
  let totalReviews = 0;
  for (const site in dataStore.reviews) {
    totalReviews += dataStore.reviews[site].length;
  }
  res.json({ count: totalReviews });
});

// DELETE /review
app.delete('/review', (req, res) => {
  const { site, index } = req.body;
  if (!site || typeof index !== 'number') {
    return res.status(400).json({ error: 'Missing site or index in request body' });
  }
  if (!dataStore.reviews[site] || !dataStore.reviews[site][index]) {
    return res.status(404).json({ error: 'Review not found' });
  }
  dataStore.reviews[site].splice(index, 1);
  res.json({ message: 'Review deleted' });
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
