# Crowdsourced Data Privacy Analyser

A Chrome extension that allows users to analyze website privacy and crowdsource reviews. The extension includes a backend server for data storage and management.

## Features

- **Privacy Analysis**: Users can review and rate websites based on privacy practices
- **Crowdsourced Reviews**: Share and view reviews from other users
- **Admin Dashboard**: Manage flagged sites and reports
- **Real-time Insights**: Get analytics on top flagged sites and review statistics

## Project Structure

```
├── backend/
│   ├── server.js          # Express.js backend server
│   ├── data.json          # Persistent data storage
│   ├── package.json       # Backend dependencies
│   └── package-lock.json
├── icons/                 # Extension icons
├── styles/               # CSS styles
├── admin.html            # Admin dashboard
├── admin.js              # Admin functionality
├── background.js         # Extension background script
├── content.js           # Content script for web pages
├── debug-content.js      # Debug content script
├── manifest.json         # Chrome extension manifest
├── popup.html           # Extension popup
├── popup.js             # Popup functionality
└── package.json         # Frontend dependencies
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Google Chrome browser

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chrome-extension
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   npm install
   ```

4. **Start the backend server**
   ```bash
   cd backend
   npm start
   ```
   The server will run on http://localhost:3000

5. **Load the Chrome extension**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the project directory

## API Endpoints

- `GET /reviews?site=url` - Get reviews for a specific site
- `POST /review` - Submit a new review
- `POST /report` - Report a site
- `GET /reports` - Get all reports
- `GET /flagged-sites` - Get flagged sites
- `GET /insights` - Get analytics insights

## Deployment

### Running Continuously with PM2

1. **Install PM2 globally**
   ```bash
   npm install -g pm2
   ```

2. **Start the server with PM2**
   ```bash
   cd backend
   pm2 start server.js --name "privacy-analyser"
   ```

3. **Save PM2 process list**
   ```bash
   pm2 save
   ```

4. **Setup PM2 to start on boot**
   ```bash
   pm2 startup
   ```

## GitHub Setup

1. **Create a new repository on GitHub**
   - Go to https://github.com/new
   - Name your repository (e.g., "crowdsourced-privacy-analyser")
   - Choose public or private
   - Don't initialize with README (we already have one)

2. **Add remote origin**
   ```bash
   git remote add origin https://github.com/your-username/your-repo-name.git
   ```

3. **Push to GitHub**
   ```bash
   git branch -M main
   git push -u origin main
   ```

### Alternative: Using GitHub CLI (if installed)
```bash
gh repo create crowdsourced-privacy-analyser --public --push --source=.
```

## Environment Variables

Create a `.env` file in the backend directory:

```
PORT=3000
NODE_ENV=production
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
