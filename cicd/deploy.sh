#!/bin/bash

SLEEP_SECONDS=60

REPO_DIR="/home/ubuntu/repo"
cd $REPO_DIR || { echo "Cannot change directory to $REPO_DIR"; exit 1; }

while true; do
  git fetch origin || { echo "Failed to fetch from remote repository"; exit 1; }

  # Check if there are changes
  if git diff --quiet HEAD origin/fix-ws-on-remote-server; then
    echo "No changes found."
  else
    echo "Changes found. Deploying the changes..."
    git clean -df || { echo "Failed to clean the repository"; exit 1; }
    git pull || { echo "Failed to pull from remote repository"; exit 1; }
    sudo systemctl restart nginx || { echo "Failed to restart nginx"; exit 1; }
    (cd backend && npm install) || { echo "Failed to install npm packages"; exit 1; }
    sudo systemctl restart ws-server || { echo "Failed to restart ws-server"; exit 1; }
    echo "Deployment completed."
  fi

  echo "Sleeping for $SLEEP_SECONDS seconds."
  sleep $SLEEP_SECONDS
done
