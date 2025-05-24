#!/bin/bash
# Install dependencies
sudo apt update
sudo apt install -y nodejs npm ffmpeg

# Clone repo (if not already present)
git clone git@github.com:yourusername/weather-bot-ec2.git || true
cd weather-bot-ec2

# Install Node modules
npm install

# Make script executable
chmod +x bot.js

echo "✅ Setup complete! Run: pm2 start bot.js"
