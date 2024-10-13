import axios from 'axios';
import crypto from 'crypto';

const VERCEL_OG_API = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og`;

let errorCount = 0;  // Track consecutive errors for Historypin

// Fetch the API key and secret from environment variables
const API_KEY = process.env.HISTORYPIN_API_KEY; 
const API_SECRET = process.env.HISTORYPIN_API_SECRET; 

// Function to generate the API token
function generateAPIToken(apiPath, querydata) {
  const orderedData = { ...querydata, api_path: apiPath, api_key: API_KEY };
  const bodyString = Object.keys(orderedData)
    .sort()
    .map(key => `${key}=${orderedData[key]}`)
    .join('&');

  // Generate the HMAC SHA256 hash using Node.js crypto
  return crypto.createHmac('sha256', API_SECRET).update(bodyString).digest('hex');
}

// Fetch historical items from Historypin API
async function fetchHistorypinData(keyword = 'history') {
  if (!API_KEY || !API_SECRET) {
    throw new Error('Historypin API key or secret is missing.');
  }

  const apiPath = 'search.json';
  const querydata = { keyword, pin: 'photo', special: 'has comments' };
  const apiToken = generateAPIToken(apiPath, querydata);
  const queryString = Object.keys(querydata)
    .map(key => `${key}=${encodeURIComponent(querydata[key])}`)
    .join('&');
  const url = `https://www.historypin.org/en/api/${apiPath}?${queryString}&api_token=${apiToken}&api_key=${API_KEY}`;

  try {
    const response = await axios.get(url);
    const pins = response.data.items;

    if (pins && pins.length > 0) {
      return pins[0];  // Return the first valid item
    }

    throw new Error('No valid data found in Historypin response');
  } catch (error) {
    throw error;  // Trigger fallback if error occurs
  }
}

// Fallback to Muffin Labs
async function fetchMuffinLabsData() {
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  
  try {
    const response = await axios.get(`https://history.muffinlabs.com/date/${month}/${day}`);
    return response.data.data;
  } catch (error) {
    throw new Error('Failed to fetch data from Muffin Labs');
  }
}

export default async function handler(req, res) {
  try {
    let historicalData, event, photoUrl;
    try {
      historicalData = await fetchHistorypinData('history');
      event = `${historicalData.title} (${historicalData.time})`;
      photoUrl = historicalData.media_url;
      errorCount = 0;
    } catch (error) {
      errorCount += 1;
      if (errorCount >= 1) {
        const fallbackData = await fetchMuffinLabsData();
        event = `${fallbackData.Events[0].year}: ${fallbackData.Events[0].text}`;
        photoUrl = null;
        errorCount = 0;
      } else {
        return res.status(500).json({ error: `Failed fetching from Historypin: ${error.message}` });
      }
    }

    const fallbackText = `No Image Available for ${event}`;
    const finalOgImageUrl = photoUrl
      ? photoUrl
      : `${VERCEL_OG_API}?text=${encodeURIComponent(fallbackText)}&photoUrl=default`;

    const ogImageUrlWithText = `${VERCEL_OG_API}?text=${encodeURIComponent(event)}&photoUrl=${encodeURIComponent(finalOgImageUrl)}`;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${ogImageUrlWithText}" />
        <meta property="fc:frame:button:1" content="Previous" />
        <meta property="fc:frame:button:2" content="Next" />
        <meta property="fc:frame:button:3" content="Share" />
        <meta property="fc:frame:button:3:target" content="https://warpcast.com/~/compose?text=Check+out+today's+moments+in+history!" />
        <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/historyFrame" />
      </head>
      </html>
    `);
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
