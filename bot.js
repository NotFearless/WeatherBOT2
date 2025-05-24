const axios = require('axios');
const { exec } = require('child_process');

// Configuration
const CONFIG = {
  NWS_API_URL: 'https://api.weather.gov/alerts/active',
  TIKTOK_RTMP: 'rtmp://your_stream_key' // Replace with your TikTok key
};

async function fetchAlerts() {
  try {
    const response = await axios.get(CONFIG.NWS_API_URL, {
      headers: { 'User-Agent': 'EC2-WeatherBot/1.0' }
    });
    return response.data.features.filter(alert => 
      ['Tornado', 'Severe Thunderstorm'].includes(alert.properties.event)
  } catch (error) {
    console.error('API Error:', error.message);
    return [];
  }
}

function streamAlert(alert) {
  const ffmpegCmd = `
    ffmpeg -f lavfi -i color=c=red:s=1080x1920:d=10 \
    -vf "drawtext=text='${alert.properties.headline.replace(/'/g, "'\\''")}':
          fontsize=48:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2" \
    -c:v libx264 -preset ultrafast -f flv ${CONFIG.TIKTOK_RTMP}
  `;
  exec(ffmpegCmd);
}

async function main() {
  console.log('🚀 Starting weather alert monitor...');
  while (true) {
    const alerts = await fetchAlerts();
    if (alerts.length > 0) {
      console.log(`⚠️ Alert found: ${alerts[0].properties.headline}`);
      await streamAlert(alerts[0]);
    }
    await new Promise(resolve => setTimeout(resolve, 60000)); // 1 min delay
  }
}

main();
