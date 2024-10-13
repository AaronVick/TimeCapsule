import axios from 'axios';
import hmacSHA256 from 'crypto-js/hmac-sha256';
import { enc } from 'crypto-js';

const VERCEL_OG_API = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og`;

let errorCount = 0;  // Track consecutive errors for Historypin

// Your API Key and Shared Secret from Historypin (replace with actual values)
const API_KEY = process.env.HISTORYPIN_API_KEY; 
const API_SECRET = process.env.HISTORYPIN_API_SECRET; 

// Function to generate the API token
function generateAPIToken(apiPath, querydata) {
  const orderedData = { ...querydata, api_path: apiPath, api_key: API_KEY };
  const bodyString = Object.keys(orderedData)
    .sort()
    .map(key => `${key}=${orderedData[key]}`)
    .join('&');

  // Generate the HMAC SHA256 hash
  return hmacSHA256(bodyString, API_SECRET).toString(enc.Hex);
}

// Fetch historical items (including photos with metadata) from Historypin API
async function fetchHistorypinData(keyword) {
  const apiPath = 'search.json';  // Example API path
  const querydata = {
    keyword: keyword,
    pin: 'photo',
    special: 'has comments',
  };

  // Generate the API token for authentication
  const apiToken = generateAPIToken(apiPath, querydata);

  // Construct the URL with the API token
  const queryString = Object.keys(querydata)
    .map(key => `${key}=${encodeURIComponent(querydata[key])}`)
    .join('&');
  const url = `https://www.historypin.org/en/api/${apiPath}?${queryString}&api_token=${apiToken}&api_key=${API_KEY}`;

  try {
    const response = await axios.get(url);
    const pins = response.data.items;

    if (pins && pins.length > 0) {
      return pins[0];  // Return the first valid item with photo and comments
    }
    return null;  // Return null if no valid data found
  } catch (error) {
    console.error('Error fetching data from Historypin:', error);
    throw error;  // Rethrow to increment error count
  }
}

// Fallback to Muffin Labs if Historypin API fails 3 consecutive times
async function fetchMuffinLabsData() {
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  
  try {
    const response = await axios.get(`https://history.muffinlabs.com/date/${month}/${day}`);
    return response.data.data;  // Return historical data from Muffin Labs
  } catch (error) {
    console.error('Error fetching data from Muffin Labs:', error);
    throw new Error('Failed to fetch data from Muffin Labs');
  }
}

export default async function handler(req, res) {
  console.log('Received request to initialFetch handler');
  console.log('Request method:', req.method);

  try {
    if (req.method === 'POST' || req.method === 'GET') {
      let historicalData;
      let event;
      let photoUrl;

      // Try Historypin first
      try {
        historicalData = await fetchHistorypinData('');  // Provide keyword or leave blank for general search
        if (!historicalData) {
          throw new Error('No data found in Historypin response');
        }
        event = `${historicalData.title} (${historicalData.time})`;  // Example format
        photoUrl = historicalData.media_url;
        errorCount = 0;  // Reset error count on success
      } catch (error) {
        errorCount += 1;
        console.error(`Historypin fetch attempt ${errorCount} failed`);

        if (errorCount >= 3) {
          // Fallback to Muffin Labs after 3 consecutive failures
          console.log('Switching to Muffin Labs after 3 failed attempts');
          const fallbackData = await fetchMuffinLabsData();
          event = `${fallbackData.Events[0].year}: ${fallbackData.Events[0].text}`;  // Example event format from Muffin Labs
          photoUrl = null;  // No images from Muffin Labs, fallback to Vercel OG for an image
          errorCount = 0;  // Reset error count on successful fallback
        } else {
          return res.status(500).json({ error: 'Failed fetching from Historypin, but not switching to Muffin Labs yet' });
        }
      }

      // Fallback to dynamic OG image if no photo found
      const fallbackText = `No Image Available for ${event}`;
      const fallbackOgImageUrl = `${VERCEL_OG_API}?text=${encodeURIComponent(fallbackText)}&photoUrl=default`;

      const finalOgImageUrl = photoUrl
        ? photoUrl
        : fallbackOgImageUrl;

      const ogImageUrlWithText = `${VERCEL_OG_API}?text=${encodeURIComponent(event)}&photoUrl=${encodeURIComponent(finalOgImageUrl)}`;

      console.log(`Serving event with image: ${event}`);

      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>On This Day in History</title>
          
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${ogImageUrlWithText}" />
          
          <meta property="fc:frame:button:1" content="Previous" />
          <meta property="fc:frame:button:2" content="Next" />
          <meta property="fc:frame:button:3" content="Share" />
          <meta property="fc:frame:button:3:action" content="link" />
          <meta property="fc:frame:button:3:target" content="https://warpcast.com/~/compose?text=Check+out+today's+moments+in+history!%0A%0AFrame+by+%40aaronv&embeds[]=https%3A%2F%2Ftime-capsule-jade.vercel.app" />
          <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/historyFrame" />
        </head>
      </html>
      `);
    } else {
      console.log('Method not allowed:', req.method);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
}
