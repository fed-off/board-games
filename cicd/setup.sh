#!/bin/bash

# Allow ubuntu user to run sudo without password
echo "ubuntu ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/ubuntu
sudo chmod 440 /etc/sudoers.d/ubuntu

# Install dependencies
sudo apt update -y
sudo apt install -y nginx nodejs npm

# Clone the repository
cd ~
git clone https://github.com/fed-off/board-games.git repo
cd repo
npm install

# Configure Node.js app as a service (backend)
sudo cp cicd/ws-server.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl start ws-server
sudo systemctl enable ws-server

# Configure Nginx (frontend)
sudo usermod -a -G ubuntu www-data
sudo cp cicd/nginx.conf /etc/nginx/sites-available/default
sudo systemctl restart nginx

# Configure continuous deployment
sudo cp cicd/deploy.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl start deploy
sudo systemctl enable deploy

