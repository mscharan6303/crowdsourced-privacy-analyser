#!/bin/bash

# Deployment script for Crowdsourced Data Privacy Analyser

echo "=== Crowdsourced Data Privacy Analyser Deployment ==="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2 globally..."
    npm install -g pm2
fi

# Install dependencies
echo "Installing backend dependencies..."
cd backend
npm install

echo "Installing frontend dependencies..."
cd ..
npm install

# Start the server with PM2
echo "Starting server with PM2..."
cd backend
pm2 start server.js --name "privacy-analyser"

# Save PM2 configuration
echo "Saving PM2 configuration..."
pm2 save

echo "=== Deployment Complete ==="
echo "Server is now running with PM2"
echo "Use 'pm2 status' to check server status"
echo "Use 'pm2 logs' to view server logs"
