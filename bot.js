const axios = require('axios');
const { exec } = require('child_process');

// Configuration
const TWITCH_CONFIG = {
  NWS_API_URL: 'https://api.weather.gov/alerts/active',
  rtmp_url: "rtmp://live.twitch.tv/app",
  stream_key: "live_146048713_IuJW20r1igk6CMUke2G1BsmMBkF0kvf"
};

async function fetchAlerts() {
  try {
    const response = await axios.get(TWITCH_CONFIG.NWS_API_URL, {
      headers: { 'User-Agent': 'EC2-WeatherBot/1.0' }
    });
    return response.data.features.filter(alert =>
      ['Tornado Warning', 'Severe Thunderstorm Warning'].includes(alert.properties.event)
    );
  } catch (error) {
    console.error('API Error:', error.message);
    return [];
  }
}

function streamAlert(alert) {
  const alert_text = alert.properties.headline.replace(/:/g, '\\:').replace(/'/g, "\\'");
  console.log(`🎥 Starting FFmpeg stream with alert: ${alert_text}`);

  const ffmpegCmd = `
    ffmpeg -f lavfi -i color=c=red:s=1280x720:d=10 \
    -vf "drawtext=text='${alert_text}':fontsize=24:fontcolor=white:box=1:boxcolor=black@0.5:x=(w-text_w)/2:y=(h-text_h)/2" \
    -c:v libx264 -preset veryfast -tune zerolatency -g 60 -b:v 3000k -maxrate 3000k -bufsize 6000k \
    -f flv "${TWITCH_CONFIG.rtmp_url}/${TWITCH_CONFIG.stream_key}" > /dev/null 2>&1 &
  `;

  exec(ffmpegCmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`FFmpeg error: ${error.message}`);
    } else {
      console.log('✅ FFmpeg stream completed.');
    }
  });
}

async function main() {
  console.log('🚀 Starting weather alert monitor...');
  while (true) {
    const alerts = await fetchAlerts();
    if (alerts.length > 0) {
      console.log(`⚠️ Alert found: ${alerts[0].properties.headline}`);
      streamAlert(alerts[0]);
    } else {
      console.log('✅ No alerts found.');
    }
    await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 min before next check
  }
}

main();
