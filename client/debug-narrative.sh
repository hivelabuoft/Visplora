#!/bin/bash

# Change directory to the project
cd /Users/h2o/Documents/Projects/Research/Visplora/client

# Add debugging environment variable
export DEBUG_REACT_FLOW=true

# Install dependencies if needed
echo "Checking for dependencies..."
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Build and run the project with debugging enabled
echo "Building and running the project with debugging..."
npm run dev
