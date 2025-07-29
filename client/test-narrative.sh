#!/bin/bash

# Change directory to the project
cd /Users/h2o/Documents/Projects/Research/Visplora/client

# Install dependencies if needed
echo "Checking for dependencies..."
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Build and run the project
echo "Building and running the project..."
npm run dev
